import { Usuario } from '../../domain/entities/Usuario';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';

export type ConsultarRankingResponse = 
  | { isSuccess: true; value: Usuario[] }
  | { isSuccess: false; error: string };

export class ConsultarRankingUseCase {
  constructor(private syncGateway: ISyncGateway) {}

  async execute(): Promise<ConsultarRankingResponse> {
    try {
      const ranking = await this.syncGateway.obterRanking();

      // Regra de negócio: garantir que está ordenado por xpSemanal caso a API não o faça estritamente
      const sorted = ranking.sort((a, b) => b.xpSemanal - a.xpSemanal).slice(0, 50);

      return {
        isSuccess: true,
        value: sorted
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message || 'Erro ao consultar o ranking',
      };
    }
  }
}
