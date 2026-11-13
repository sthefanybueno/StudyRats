/** Description: This file (src/application/use-cases/CadastrarDisciplinaUseCase.ts) contains the implementation for its respective feature. */
import { Disciplina } from '../../domain/entities/Disciplina';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface CadastrarDisciplinaRequest {
  usuarioId: string;
  nome: string;
  cor: string;
}

export type CadastrarDisciplinaResponse = 
  | { isSuccess: true; value: Disciplina }
  | { isSuccess: false; error: string };

export class CadastrarDisciplinaUseCase {
  constructor(
    private disciplinaRepository: IDisciplinaRepository,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: CadastrarDisciplinaRequest): Promise<CadastrarDisciplinaResponse> {
    try {
      const disciplina = Disciplina.create({
        usuarioId: request.usuarioId,
        nome: request.nome,
        cor: request.cor,
      });

      await this.disciplinaRepository.salvar(disciplina);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'disciplinas',
            operacao: 'INSERT',
            payloadJson: JSON.stringify({
              id: disciplina.id,
              usuarioId: disciplina.usuarioId,
              nome: disciplina.nome,
              cor: disciplina.cor,
              createdAt: disciplina.createdAt.toISOString(),
            }),
          })
        );
      }

      return {
        isSuccess: true,
        value: disciplina,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
