/** Description: This file (src/application/use-cases/ConsultarRankingUseCase.ts) contains the implementation for its respective feature. */
import { Usuario } from '../../domain/entities/Usuario';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export type ConsultarRankingResponse =
  | { isSuccess: true; value: Usuario[]; origem: 'nuvem' | 'local' }
  | { isSuccess: false; error: string };

export class ConsultarRankingUseCase {
  constructor(
    private syncGateway: ISyncGateway,
    private usuarioRepository?: IUsuarioRepository
  ) {}

  async execute(usuarioLogado?: Usuario | null): Promise<ConsultarRankingResponse> {
    try {
      const ranking = await this.syncGateway.obterRanking();
      if (ranking.length > 0 || !this.usuarioRepository) {
        const lista = [...ranking];
        if (usuarioLogado && !lista.some((u) => u.id === usuarioLogado.id)) {
          lista.push(usuarioLogado);
        }
        const sorted = lista.sort((a, b) => b.xpSemanal - a.xpSemanal).slice(0, 50);

        return {
          isSuccess: true,
          value: sorted,
          origem: 'nuvem',
        };
      }
    } catch (error: any) {
      if (!this.usuarioRepository) {
        return {
          isSuccess: false,
          error: error.message || 'Erro ao consultar o ranking',
        };
      }
    }

    try {
      const locais = await this.usuarioRepository!.listarTodos();
      const lista = [...locais];
      if (usuarioLogado && !lista.some((u) => u.id === usuarioLogado.id)) {
        lista.push(usuarioLogado);
      }
      const sorted = lista.sort((a, b) => b.xpSemanal - a.xpSemanal).slice(0, 50);

      return {
        isSuccess: true,
        value: sorted,
        origem: 'local',
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message || 'Erro ao consultar o ranking',
      };
    }
  }
}
