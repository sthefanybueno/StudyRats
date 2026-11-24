/** Description: Caso de uso LGPD (Art. 18) para eliminar coordenadas de geolocalização (local + Supabase), recalcular XP e sincronizar o perfil. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { BONUS_GPS_XP, CalculoXpService } from '../../domain/services/CalculoXpService';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export interface LimparHistoricoLocalizacaoRequest {
  usuarioId: string;
}

export type LimparHistoricoLocalizacaoResponse =
  | { isSuccess: true; value: { sessoesAfetadas: number; xpDescontado: number } }
  | { isSuccess: false; error: string };

export class LimparHistoricoLocalizacaoUseCase {
  constructor(
    private readonly sessaoRepository: ISessaoEstudoRepository,
    private readonly syncQueueRepository?: ISyncQueueRepository,
    private readonly usuarioRepository?: IUsuarioRepository,
    private readonly syncGateway?: ISyncGateway
  ) {}

  async execute(request: LimparHistoricoLocalizacaoRequest): Promise<LimparHistoricoLocalizacaoResponse> {
    try {
      if (!request.usuarioId || request.usuarioId.trim() === '') {
        return { isSuccess: false, error: 'O ID do usuário é obrigatório' };
      }

      // 1. Consulta prévia do XP real no Supabase antes da limpeza caso o cache local esteja defasado
      let statsRemotoAntes: Awaited<ReturnType<NonNullable<ISyncGateway['obterEstatisticasUsuarioRemoto']>>> = null;
      if (this.syncGateway?.obterEstatisticasUsuarioRemoto) {
        statsRemotoAntes = await this.syncGateway.obterEstatisticasUsuarioRemoto().catch(() => null);
      }

      // 2. Limpa localmente no SQLite
      const sessoesLocaisAfetadas = this.sessaoRepository.removerCoordenadasPorUsuario
        ? await this.sessaoRepository.removerCoordenadasPorUsuario(request.usuarioId)
        : 0;

      // 3. Tenta limpar diretamente online no Supabase (limpar_minhas_coordenadas); se offline, enfileira na Outbox
      let sessoesRemotasAfetadas = 0;
      let limpoOnline = false;
      if (this.syncGateway?.limparCoordenadasRemotas) {
        try {
          sessoesRemotasAfetadas = await this.syncGateway.limparCoordenadasRemotas();
          limpoOnline = true;
        } catch {
          limpoOnline = false;
        }
      }

      const sessoesAfetadas = Math.max(sessoesLocaisAfetadas, sessoesRemotasAfetadas);

      // 4. Recalcula XP (reconciliando pela soma real das sessões quando disponível, ou descontando +5 XP por sessão afetada)
      let xpDescontado = 0;
      const sessoesLocais = await this.sessaoRepository.listarPorUsuario(request.usuarioId);
      const mapaFotosLocais = new Map(sessoesLocais.map((s) => [s.id, !!s.foto]));

      let xpCalculadoReal: number | undefined;
      if (limpoOnline && statsRemotoAntes?.sessoesResumo && sessoesLocais.length <= statsRemotoAntes.sessoesResumo.length) {
        const resumoMapa = new Map<string, { duracaoMinutos: number; comFoto: boolean; comGps: boolean }>();
        for (const s of statsRemotoAntes.sessoesResumo) {
          resumoMapa.set(s.id, {
            duracaoMinutos: s.duracaoMinutos,
            comFoto: s.comFoto || (mapaFotosLocais.get(s.id) ?? false),
            comGps: false, // Coordenadas acabaram de ser apagadas no servidor e no aparelho
          });
        }
        for (const s of sessoesLocais) {
          if (!resumoMapa.has(s.id)) {
            resumoMapa.set(s.id, {
              duracaoMinutos: s.duracaoMinutos,
              comFoto: !!s.foto,
              comGps: false,
            });
          }
        }
        xpCalculadoReal = Array.from(resumoMapa.values()).reduce(
          (acc, s) => acc + CalculoXpService.calcular(s),
          0
        );
      }

      if ((sessoesAfetadas > 0 || xpCalculadoReal !== undefined) && this.usuarioRepository) {
        const usuario = await this.usuarioRepository.buscarPorId(request.usuarioId);
        if (usuario) {
          if (typeof statsRemotoAntes?.xpTotal === 'number' && statsRemotoAntes.xpTotal > usuario.xpTotal) {
            usuario.adicionarXP(statsRemotoAntes.xpTotal - usuario.xpTotal);
          }

          const xpAnterior = usuario.xpTotal;
          if (xpCalculadoReal !== undefined) {
            if (usuario.xpTotal > xpCalculadoReal) {
              usuario.descontarXP(usuario.xpTotal - xpCalculadoReal);
            } else if (xpCalculadoReal > usuario.xpTotal) {
              usuario.adicionarXP(xpCalculadoReal - usuario.xpTotal);
            }
          } else {
            usuario.descontarXP(sessoesAfetadas * BONUS_GPS_XP);
          }
          xpDescontado = Math.max(0, xpAnterior - usuario.xpTotal);

          if (xpDescontado > 0 || xpAnterior !== usuario.xpTotal || sessoesAfetadas > 0) {
            await this.usuarioRepository.salvar(usuario);

            const payloadPerfil = {
              id: usuario.id,
              xpTotal: usuario.xpTotal,
              xpSemanal: usuario.xpSemanal,
              streakAtual: usuario.streakAtual,
            };

            let perfilSincronizadoDireto = false;
            if (limpoOnline && this.syncGateway) {
              try {
                await this.syncGateway.enviarParaNuvem('perfis', 'UPDATE', payloadPerfil);
                perfilSincronizadoDireto = true;
              } catch {
                perfilSincronizadoDireto = false;
              }
            }

            if (!perfilSincronizadoDireto && this.syncQueueRepository) {
              await this.syncQueueRepository.enfileirar(
                SyncQueueItem.create({
                  entidade: 'perfis',
                  operacao: 'UPDATE',
                  payloadJson: JSON.stringify(payloadPerfil),
                })
              );
            }
          }
        }
      }

      if (!limpoOnline && this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'sessoes_estudo',
            operacao: 'UPDATE',
            payloadJson: JSON.stringify({
              acao: 'LIMPAR_COORDENADAS',
              usuarioId: request.usuarioId,
            }),
          })
        );
      }

      return {
        isSuccess: true,
        value: { sessoesAfetadas, xpDescontado },
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message || 'Erro ao limpar histórico de localização',
      };
    }
  }
}

