/** Description: Use case for soft-deleting a discipline locally and enqueueing the update for Supabase synchronization. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

export interface DeletarDisciplinaRequest {
  disciplinaId: string;
}

export type DeletarDisciplinaResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class DeletarDisciplinaUseCase {
  constructor(
    private readonly disciplinaRepository: IDisciplinaRepository,
    private readonly syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: DeletarDisciplinaRequest): Promise<DeletarDisciplinaResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);
      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      disciplina.marcarComoDeletada();

      const executarEmTransacao = this.syncQueueRepository?.executarEmTransacao
        ? <T>(fn: () => Promise<T>) => this.syncQueueRepository!.executarEmTransacao!(fn)
        : async <T>(fn: () => Promise<T>) => fn();

      await executarEmTransacao(async () => {
        await this.disciplinaRepository.salvar(disciplina);

        if (this.syncQueueRepository) {
          const agoraIso = (disciplina.deletedAt ?? new Date()).toISOString();
          await this.syncQueueRepository.enfileirar(
            SyncQueueItem.create({
              entidade: 'disciplinas',
              operacao: 'UPDATE',
              payloadJson: JSON.stringify({
                id: disciplina.id,
                usuarioId: disciplina.usuarioId,
                nome: disciplina.nome,
                cor: disciplina.cor,
                createdAt: disciplina.createdAt.toISOString(),
                updatedAt: agoraIso,
                deletedAt: agoraIso,
              }),
            })
          );
        }
      });

      return { isSuccess: true };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message || 'Erro ao apagar disciplina',
      };
    }
  }
}

