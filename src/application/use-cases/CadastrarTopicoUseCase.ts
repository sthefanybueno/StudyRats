/** Description: This file (src/application/use-cases/CadastrarTopicoUseCase.ts) contains the implementation for its respective feature. */
import { Topico } from '../../domain/entities/Topico';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface CadastrarTopicoRequest {
  disciplinaId: string;
  nome: string;
}

export type CadastrarTopicoResponse = 
  | { isSuccess: true; value: Topico }
  | { isSuccess: false; error: string };

export class CadastrarTopicoUseCase {
  constructor(
    private disciplinaRepository: IDisciplinaRepository,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: CadastrarTopicoRequest): Promise<CadastrarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);
      
      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      const topico = Topico.create({
        disciplinaId: disciplina.id,
        nome: request.nome,
      });

      disciplina.adicionarTopico(topico);

      await this.disciplinaRepository.salvar(disciplina);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'topicos',
            operacao: 'INSERT',
            payloadJson: JSON.stringify({
              id: topico.id,
              disciplinaId: topico.disciplinaId,
              nome: topico.nome,
              createdAt: topico.createdAt.toISOString(),
            }),
          })
        );
      }

      return {
        isSuccess: true,
        value: topico,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
