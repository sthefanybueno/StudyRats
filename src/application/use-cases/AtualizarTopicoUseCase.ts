/** Description: This file (src/application/use-cases/AtualizarTopicoUseCase.ts) contains the implementation for its respective feature. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface AtualizarTopicoRequest {
  disciplinaId: string;
  topicoId: string;
  novoNome: string;
}

export type AtualizarTopicoResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class AtualizarTopicoUseCase {
  constructor(
    private disciplinaRepository: IDisciplinaRepository,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: AtualizarTopicoRequest): Promise<AtualizarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);

      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      disciplina.atualizarTopico(request.topicoId, request.novoNome);
      await this.disciplinaRepository.salvar(disciplina);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'topicos',
            operacao: 'UPDATE',
            payloadJson: JSON.stringify({
              id: request.topicoId,
              disciplinaId: request.disciplinaId,
              nome: request.novoNome,
              updatedAt: new Date().toISOString(),
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
