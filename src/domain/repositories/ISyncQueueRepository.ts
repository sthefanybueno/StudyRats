/** Description: This file (src/domain/repositories/ISyncQueueRepository.ts) contains the implementation for its respective feature. */
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

  /**
   * Reabilita itens com falha na fila local para nova tentativa de sincronização.
   */
  resetarFalhas?(): Promise<void>;

  /**
   * Executa mutação de domínio + enfileiramento na Outbox dentro da mesma transação SQLite atômica.
   */
  executarEmTransacao?<T>(task: () => Promise<T>): Promise<T>;

  /**
   * Cursor ISO da última sincronização Delta Pull realizada para o usuário.
   */
  obterUltimoPullCursor?(usuarioId: string): Promise<string | null>;

  /**
   * Persiste o cursor ISO da última sincronização Delta Pull realizada para o usuário.
   */
  salvarUltimoPullCursor?(usuarioId: string, cursorIso: string): Promise<void>;
}
