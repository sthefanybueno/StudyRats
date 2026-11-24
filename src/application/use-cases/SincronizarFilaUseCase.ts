/** Description: This file (src/application/use-cases/SincronizarFilaUseCase.ts) contains the implementation for its respective feature. */
import { Disciplina } from '../../domain/entities/Disciplina';
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Topico } from '../../domain/entities/Topico';
import { Coordenada } from '../../domain/value-objects/Coordenada';
import { StatusSincronizacao } from '../../domain/value-objects/StatusSincronizacao';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export type SincronizarFilaResponse = {
  processados: number;
  falhas: number;
  coordenadasExpurgadas?: number;
  deltaAplicados?: number;
};

/** Prazo máximo de retenção de coordenadas brutas no histórico (90 dias - PDF 01, slides 41 e 44; PDF 02, slide 42). */
export const DIAS_RETENCAO_LOCALIZACAO = 90;

export class SincronizarFilaUseCase {
  private execucaoAtiva: Promise<SincronizarFilaResponse> | null = null;
  private pendenteNovaPassagem = false;

  constructor(
    private syncQueueRepository: ISyncQueueRepository,
    private syncGateway: ISyncGateway,
    private sessaoRepository?: ISessaoEstudoRepository,
    private usuarioRepository?: IUsuarioRepository,
    private disciplinaRepository?: IDisciplinaRepository
  ) {}

  async execute(): Promise<SincronizarFilaResponse> {
    if (this.execucaoAtiva) {
      this.pendenteNovaPassagem = true;
      return this.execucaoAtiva;
    }

    this.execucaoAtiva = this.processarFila();
    try {
      let resultado = await this.execucaoAtiva;
      while (this.pendenteNovaPassagem) {
        this.pendenteNovaPassagem = false;
        this.execucaoAtiva = this.processarFila();
        const extra = await this.execucaoAtiva;
        resultado = {
          processados: resultado.processados + extra.processados,
          falhas: resultado.falhas + extra.falhas,
          coordenadasExpurgadas: Math.max(resultado.coordenadasExpurgadas ?? 0, extra.coordenadasExpurgadas ?? 0),
        };
      }
      return resultado;
    } finally {
      this.execucaoAtiva = null;
    }
  }

  private async processarFila(): Promise<SincronizarFilaResponse> {
    let coordenadasExpurgadas = 0;
    if (this.sessaoRepository?.expurgarCoordenadasAntigas) {
      const dataLimite = new Date(Date.now() - DIAS_RETENCAO_LOCALIZACAO * 24 * 60 * 60 * 1000);
      coordenadasExpurgadas = await this.sessaoRepository.expurgarCoordenadasAntigas(dataLimite);
    }

    if (this.syncGateway.expurgarCoordenadasAntigas) {
      try {
        const expurgadasNuvem = await this.syncGateway.expurgarCoordenadasAntigas(DIAS_RETENCAO_LOCALIZACAO);
        coordenadasExpurgadas = Math.max(coordenadasExpurgadas, expurgadasNuvem);
      } catch {
        // Expurgo remoto é melhor-esforço e não bloqueia a sincronização da fila local
      }
    }

    const itensPendentes = await this.syncQueueRepository.buscarPendentes(25);
    
    let processados = 0;
    let falhas = 0;

    for (const item of itensPendentes) {
      try {
        const payload = JSON.parse(item.payloadJson);

        // Evidência fotográfica: sobe ao Storage antes de gravar a sessão; se falhar, o item volta a ser tentado.
        let caminhoFoto: string | undefined;
        if (item.entidade === 'sessoes_estudo' && item.operacao !== 'DELETE' && payload.fotoLocal) {
          const extensao = /\.png$/i.test(String(payload.fotoLocal)) ? 'png' : 'jpg';
          caminhoFoto = await this.syncGateway.fazerUploadFoto(
            payload.fotoLocal,
            `${payload.usuarioId}/${payload.id}.${extensao}`
          );
          payload.fotoRemota = caminhoFoto;
        }

        // Avatar de perfil local (file:// ou content://): sobe para bucket público 'avatares' para exibir no Ranking/Feed
        if (
          item.entidade === 'perfis' &&
          item.operacao !== 'DELETE' &&
          typeof payload.fotoUrl === 'string' &&
          /^(file|content):\/\//i.test(payload.fotoUrl) &&
          this.syncGateway.fazerUploadAvatar
        ) {
          const extensao = /\.png$/i.test(payload.fotoUrl) ? 'png' : 'jpg';
          const avatarUrlRemota = await this.syncGateway.fazerUploadAvatar(
            payload.fotoUrl,
            `${payload.id}/avatar.${extensao}`
          );
          payload.fotoUrl = avatarUrlRemota;

          if (this.usuarioRepository && payload.id) {
            const usuarioLocal = await this.usuarioRepository.buscarPorId(payload.id);
            if (usuarioLocal) {
              usuarioLocal.atualizarFotoUrl(avatarUrlRemota);
              await this.usuarioRepository.salvar(usuarioLocal);
            }
          }
        }

        await this.syncGateway.enviarParaNuvem(item.entidade, item.operacao, payload);

        if (caminhoFoto && this.sessaoRepository) {
          await this.sessaoRepository.atualizarFoto(payload.id, caminhoFoto);
        }

        if (item.entidade === 'sessoes_estudo' && item.operacao !== 'DELETE' && payload.id && this.sessaoRepository?.marcarComoSincronizada) {
          await this.sessaoRepository.marcarComoSincronizada(payload.id);
        }

        // Se sucesso, remove da fila local (Outbox)
        await this.syncQueueRepository.remover(item.id);
        processados++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        console.warn(`[SincronizarFilaUseCase] Falha ao sincronizar ${item.entidade} (${item.operacao}):`, msg);
        // Se falha, incrementa tentativas
        item.registrarFalha(msg);
        await this.syncQueueRepository.registrarFalha(item);
        falhas++;
      }
    }

    const deltaAplicados = await this.executarDeltaPull();

    return { processados, falhas, coordenadasExpurgadas, deltaAplicados };
  }

  private async executarDeltaPull(): Promise<number> {
    if (!this.syncGateway.baixarDeltaRemoto || (!this.disciplinaRepository && !this.sessaoRepository)) {
      return 0;
    }

    try {
      const pendentesRestantes = await this.syncQueueRepository.buscarPendentes(100);
      const idsComPendencia = new Set<string>();
      for (const item of pendentesRestantes) {
        try {
          const parsed = JSON.parse(item.payloadJson);
          if (parsed?.id) idsComPendencia.add(parsed.id);
        } catch {
          // Ignora payload malformado
        }
      }

      // Se o SQLite local ainda não tem disciplinas, força pull completo (sinceIso = undefined)
      let sinceIso: string | undefined;
      if (this.syncQueueRepository.obterUltimoPullCursor) {
        // Verifica primeiro com pull sem cursor ou usando o usuário da primeira leitura
        const deltaInicial = await this.syncGateway.baixarDeltaRemoto(undefined);
        if (!deltaInicial) return 0;

        if (this.disciplinaRepository) {
          const locais = await this.disciplinaRepository.listarPorUsuario(deltaInicial.usuarioId);
          const cursorSalvo = await this.syncQueueRepository.obterUltimoPullCursor(deltaInicial.usuarioId);
          if (locais.length > 0 && cursorSalvo) {
            sinceIso = cursorSalvo;
          }
        }

        const delta = sinceIso ? await this.syncGateway.baixarDeltaRemoto(sinceIso) : deltaInicial;
        if (!delta) return 0;

        const aplicados = await this.aplicarDelta(delta, idsComPendencia);
        if (this.syncQueueRepository.salvarUltimoPullCursor) {
          await this.syncQueueRepository.salvarUltimoPullCursor(delta.usuarioId, delta.serverTimeIso);
        }
        return aplicados;
      }

      const delta = await this.syncGateway.baixarDeltaRemoto(undefined);
      if (!delta) return 0;
      return await this.aplicarDelta(delta, idsComPendencia);
    } catch {
      return 0;
    }
  }

  private async aplicarDelta(
    delta: NonNullable<Awaited<ReturnType<NonNullable<ISyncGateway['baixarDeltaRemoto']>>>>,
    idsComPendencia: Set<string>
  ): Promise<number> {
    let aplicados = 0;

    if (this.disciplinaRepository) {
      for (const d of delta.disciplinas) {
        if (idsComPendencia.has(d.id)) continue;
        if (d.deletedAt) {
          await this.disciplinaRepository.deletar(d.id);
          aplicados++;
          continue;
        }

        const existente = await this.disciplinaRepository.buscarPorId(d.id);
        const topicosRemotosPorId = new Map(d.topicos.map((t) => [t.id, t]));

        const disc = Disciplina.create({
          id: d.id,
          usuarioId: d.usuarioId,
          nome: d.nome,
          cor: d.cor,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          syncStatus: StatusSincronizacao.synced(),
        });

        // Preserva tópicos locais inalterados caso o pull tenha sido incremental
        if (existente) {
          for (const tLocal of existente.topicos) {
            if (!topicosRemotosPorId.has(tLocal.id)) {
              disc.adicionarTopico(tLocal);
            }
          }
        }

        for (const t of d.topicos) {
          if (t.deletedAt || idsComPendencia.has(t.id)) continue;
          disc.adicionarTopico(
            Topico.create({
              id: t.id,
              disciplinaId: d.id,
              nome: t.nome,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
              syncStatus: StatusSincronizacao.synced(),
            })
          );
        }

        await this.disciplinaRepository.salvar(disc);
        aplicados++;
      }

      for (const t of delta.topicosSoltos) {
        if (idsComPendencia.has(t.id) || idsComPendencia.has(t.disciplinaId)) continue;
        const existente = await this.disciplinaRepository.buscarPorId(t.disciplinaId);
        if (!existente) continue;

        if (t.deletedAt) {
          existente.removerTopico(t.id);
        } else {
          const jaExiste = existente.topicos.some((loc) => loc.id === t.id);
          if (jaExiste) {
            existente.atualizarTopico(t.id, t.nome);
          } else {
            existente.adicionarTopico(
              Topico.create({
                id: t.id,
                disciplinaId: t.disciplinaId,
                nome: t.nome,
                createdAt: new Date(t.createdAt),
                updatedAt: new Date(t.updatedAt),
                syncStatus: StatusSincronizacao.synced(),
              })
            );
          }
        }
        await this.disciplinaRepository.salvar(existente);
        aplicados++;
      }
    }

    if (this.sessaoRepository) {
      for (const s of delta.sessoes) {
        if (idsComPendencia.has(s.id)) continue;
        const jaLocal = await this.sessaoRepository.buscarPorId(s.id);
        if (jaLocal) continue;

        let coordenada: Coordenada | undefined;
        if (typeof s.latitude === 'number' && typeof s.longitude === 'number') {
          try {
            coordenada = Coordenada.create({
              latitude: s.latitude,
              longitude: s.longitude,
              accuracy: typeof s.accuracy === 'number' ? s.accuracy : undefined,
              localAproximado: s.localAproximado ?? undefined,
            });
          } catch {
            coordenada = undefined;
          }
        }

        const sessao = SessaoEstudo.create({
          id: s.id,
          usuarioId: s.usuarioId,
          disciplinaId: s.disciplinaId,
          topicoId: s.topicoId,
          duracaoMinutos: s.duracaoMinutos,
          createdAt: new Date(s.createdAt),
          syncStatus: StatusSincronizacao.synced(),
          coordenada,
        });

        const uriFoto = s.fotoUrlAssinada || s.fotoPathRemoto;
        if (uriFoto) {
          sessao.anexarFoto(
            FotoSessao.create({
              sessaoId: s.id,
              uriLocal: uriFoto,
              urlRemota: s.fotoPathRemoto ?? uriFoto,
              uploadStatus: 'completed',
            })
          );
        }

        await this.sessaoRepository.salvar(sessao);
        aplicados++;
      }
    }

    return aplicados;
  }
}
