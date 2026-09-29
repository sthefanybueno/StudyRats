import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';

export class InMemorySyncQueueRepository implements ISyncQueueRepository {
  private fila: Map<string, SyncQueueItem> = new Map();

  async enfileirar(item: SyncQueueItem): Promise<void> {
    this.fila.set(item.id, item);
  }

  async buscarPendentes(limite: number = 10): Promise<SyncQueueItem[]> {
    return Array.from(this.fila.values())
      .filter(item => item.status === 'pending' || item.status === 'error')
      .slice(0, limite);
  }

  async remover(id: string): Promise<void> {
    this.fila.delete(id);
  }

  async registrarFalha(item: SyncQueueItem): Promise<void> {
    this.fila.set(item.id, item);
  }
}
