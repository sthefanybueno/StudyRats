/** Description: Caso de uso LGPD (Art. 18) para eliminar todas as coordenadas de geolocalização do histórico local e enfileirar limpeza no Supabase. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface LimparHistoricoLocalizacaoRequest {
  usuarioId: string;
}

export type LimparHistoricoLocalizacaoResponse =
  | { isSuccess: true; value: { sessoesAfetadas: number } }
  | { isSuccess: false; error: string };

export class LimparHistoricoLocalizacaoUseCase {
  constructor(
    private readonly sessaoRepository: ISessaoEstudoRepository,
    private readonly syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: LimparHistoricoLocalizacaoRequest): Promise<LimparHistoricoLocalizacaoResponse> {
    try {
      if (!request.usuarioId || request.usuarioId.trim() === '') {
        return { isSuccess: false, error: 'O ID do usuário é obrigatório' };
      }

      const sessoesAfetadas = this.sessaoRepository.removerCoordenadasPorUsuario
        ? await this.sessaoRepository.removerCoordenadasPorUsuario(request.usuarioId)
        : 0;

      if (this.syncQueueRepository) {
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
        value: { sessoesAfetadas },
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message || 'Erro ao limpar histórico de localização',
      };
    }
  }
}

