/** Description: This file (src/application/use-cases/DeletarTopicoUseCase.ts) contains the implementation for its respective feature. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface DeletarTopicoRequest {
  disciplinaId: string;
  topicoId: string;
}

export type DeletarTopicoResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class DeletarTopicoUseCase {
  constructor(
    private disciplinaRepository: IDisciplinaRepository,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: DeletarTopicoRequest): Promise<DeletarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);

      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      disciplina.removerTopico(request.topicoId);
      await this.disciplinaRepository.salvar(disciplina);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'topicos',
            operacao: 'DELETE',
            payloadJson: JSON.stringify({
              id: request.topicoId,
              disciplinaId: request.disciplinaId,
              deletedAt: new Date().toISOString(),
            }),
          })
        );
      }

      return { isSuccess: true };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
