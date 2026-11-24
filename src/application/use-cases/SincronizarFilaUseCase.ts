/** Description: This file (src/application/use-cases/SincronizarFilaUseCase.ts) contains the implementation for its respective feature. */
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export type SincronizarFilaResponse = {
  processados: number;
  falhas: number;
  coordenadasExpurgadas?: number;
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
    private usuarioRepository?: IUsuarioRepository
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

    return { processados, falhas, coordenadasExpurgadas };
  }
}
