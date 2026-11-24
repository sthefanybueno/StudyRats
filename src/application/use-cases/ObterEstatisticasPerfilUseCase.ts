/** Description: Caso de uso para calcular estatísticas do perfil (local + nuvem) e reconciliar divergências de XP. */
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { CalculoXpService } from '../../domain/services/CalculoXpService';

export interface EstatisticasPerfil {
  sessoesCount: number;
  sessoesComGpsCount: number;
  minutosTotais: number;
  xpReconciliado: boolean;
}

export class ObterEstatisticasPerfilUseCase {
  constructor(
    private readonly sessaoRepository: ISessaoEstudoRepository,
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly syncQueueRepository: ISyncQueueRepository,
    private readonly syncGateway?: ISyncGateway
  ) {}

  async execute(usuarioId: string): Promise<EstatisticasPerfil> {
    if (!usuarioId || usuarioId.trim() === '') {
      return { sessoesCount: 0, sessoesComGpsCount: 0, minutosTotais: 0, xpReconciliado: false };
    }

    const [listSessoes, remoto, pendentes] = await Promise.all([
      this.sessaoRepository.listarPorUsuario(usuarioId),
      this.syncGateway?.obterEstatisticasUsuarioRemoto?.().catch(() => null) ?? Promise.resolve(null),
      this.syncQueueRepository.buscarPendentes(1),
    ]);

    const localCount = listSessoes.length;
    const localGpsCount = listSessoes.filter((s) => !!s.coordenada).length;
    const localMins = listSessoes.reduce((acc, s) => acc + s.duracaoMinutos, 0);

    let xpReconciliado = false;

    if (pendentes.length === 0 && remoto?.sessoesResumo && localCount <= remoto.sessoesResumo.length) {
      const mapaLocal = new Map(listSessoes.map((s) => [s.id, s]));
      const xpRealSessoes = remoto.sessoesResumo.reduce((acc, s) => {
        const local = mapaLocal.get(s.id);
        return (
          acc +
          CalculoXpService.calcular({
            duracaoMinutos: s.duracaoMinutos,
            comFoto: s.comFoto || !!local?.foto,
            comGps: s.comGps,
          })
        );
      }, 0);

      const usuarioAtual = await this.usuarioRepository.buscarPorId(usuarioId);
      const resetSemanalRemoto =
        typeof remoto.xpSemanal === 'number' &&
        usuarioAtual !== null &&
        remoto.xpSemanal < usuarioAtual.xpSemanal;
      const remotoDivergente = typeof remoto.xpTotal === 'number' && remoto.xpTotal !== xpRealSessoes;
      const deveEnviarNuvem = usuarioAtual !== null && (usuarioAtual.xpTotal !== xpRealSessoes || remotoDivergente);

      if (usuarioAtual && (deveEnviarNuvem || resetSemanalRemoto)) {
        if (usuarioAtual.xpTotal > xpRealSessoes) {
          usuarioAtual.descontarXP(usuarioAtual.xpTotal - xpRealSessoes);
        } else if (xpRealSessoes > usuarioAtual.xpTotal) {
          usuarioAtual.adicionarXP(xpRealSessoes - usuarioAtual.xpTotal);
        }
        if (resetSemanalRemoto && typeof remoto.xpSemanal === 'number') {
          usuarioAtual.atualizarXpSemanal(remoto.xpSemanal);
        }
        await this.usuarioRepository.salvar(usuarioAtual);
        if (deveEnviarNuvem) {
          await this.syncGateway
            ?.enviarParaNuvem('perfis', 'UPDATE', {
              id: usuarioAtual.id,
              xpTotal: usuarioAtual.xpTotal,
              xpSemanal: usuarioAtual.xpSemanal,
              streakAtual: usuarioAtual.streakAtual,
            })
            .catch(() => {});
        }
        xpReconciliado = true;
      }
    }

    return {
      sessoesCount: remoto ? Math.max(localCount, remoto.sessoesCount) : localCount,
      sessoesComGpsCount: remoto ? Math.max(localGpsCount, remoto.sessoesComGpsCount) : localGpsCount,
      minutosTotais: remoto ? Math.max(localMins, remoto.minutosTotais) : localMins,
      xpReconciliado,
    };
  }
}

