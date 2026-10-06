import { SyncQueueItem } from '../entities/SyncQueueItem';

export interface ISyncQueueRepository {
  /**
   * Adiciona um novo item na fila local de sincronização.
   */
  enfileirar(item: SyncQueueItem): Promise<void>;
  
  /**
   * Busca os próximos itens pendentes na fila (FIFO).
   */
  buscarPendentes(limite?: number): Promise<SyncQueueItem[]>;
  
  /**
   * Remove o item da fila após ser sincronizado com sucesso.
   */
  remover(id: string): Promise<void>;
  
  /**
   * Atualiza o status e contagem de tentativas após uma falha de sincronização.
   */
  registrarFalha(item: SyncQueueItem): Promise<void>;
}
