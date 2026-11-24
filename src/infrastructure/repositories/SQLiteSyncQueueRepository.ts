/** Description: SQLite implementation of ISyncQueueRepository using SQLiteExecutor. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import type { SQLiteExecutor } from '../database/SQLiteExecutor';
import { getDatabase } from '../database/database';
import { notifyTableChanged } from '../database/schema';

interface SyncQueueRow {
  id: string;
  entidade: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  payload_json: string;
  tentativas: number;
  erro_msg: string | null;
  status: 'pending' | 'error';
  created_at: string;
}

/** Itens com falha são reprocessados até este limite de tentativas. */
export const MAX_TENTATIVAS = 5;

export class SQLiteSyncQueueRepository implements ISyncQueueRepository {
  private aoEnfileirarCallback?: () => void;
  private transacaoAtivaDepth = 0;
  private enfileiradoNaTransacao = false;

  constructor(private readonly getDb: () => Promise<SQLiteExecutor> = getDatabase) {}

  definirCallbackAoEnfileirar(callback: () => void): void {
    this.aoEnfileirarCallback = callback;
  }

  async executarEmTransacao<T>(task: () => Promise<T>): Promise<T> {
    const db = await this.getDb();
    let resultado!: T;
    const externa = this.transacaoAtivaDepth === 0;
    if (externa) {
      this.enfileiradoNaTransacao = false;
    }
    this.transacaoAtivaDepth++;
    try {
      await db.withTransactionAsync(async () => {
        resultado = await task();
      });
    } catch (error) {
      if (externa) {
        this.enfileiradoNaTransacao = false;
      }
      throw error;
    } finally {
      this.transacaoAtivaDepth--;
    }

    if (externa && this.enfileiradoNaTransacao) {
      this.enfileiradoNaTransacao = false;
      this.aoEnfileirarCallback?.();
    }

    return resultado;
  }

  async enfileirar(item: SyncQueueItem): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT INTO sync_queue (
        id, entidade, operacao, payload_json, tentativas, erro_msg, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        entidade = excluded.entidade,
        operacao = excluded.operacao,
        payload_json = excluded.payload_json,
        tentativas = excluded.tentativas,
        erro_msg = excluded.erro_msg,
        status = excluded.status;`,
      [
        item.id,
        item.entidade,
        item.operacao,
        item.payloadJson,
        item.tentativas,
        item.erroMsg ?? null,
        item.status,
        item.createdAt.toISOString(),
      ]
    );
    notifyTableChanged('sync_queue');
    if (this.transacaoAtivaDepth > 0) {
      this.enfileiradoNaTransacao = true;
    } else {
      this.aoEnfileirarCallback?.();
    }
  }

  async buscarPendentes(limite: number = 10): Promise<SyncQueueItem[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SyncQueueRow>(
      `SELECT * FROM sync_queue
       WHERE status = 'pending' OR (status = 'error' AND tentativas < ${MAX_TENTATIVAS})
       ORDER BY created_at ASC, id ASC
       LIMIT ?;`,
      [limite]
    );

    return rows.map((r) =>
      SyncQueueItem.create({
        id: r.id,
        entidade: r.entidade,
        operacao: r.operacao,
        payloadJson: r.payload_json,
        tentativas: r.tentativas,
        erroMsg: r.erro_msg ?? undefined,
        status: r.status,
        createdAt: new Date(r.created_at),
      })
    );
  }

  async remover(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [id]);
  }

  async registrarFalha(item: SyncQueueItem): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE sync_queue
       SET tentativas = ?, erro_msg = ?, status = ?
       WHERE id = ?;`,
      [item.tentativas, item.erroMsg ?? null, item.status, item.id]
    );
  }

  async resetarFalhas(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `UPDATE sync_queue
       SET tentativas = 0, status = 'pending'
       WHERE status = 'error';`
    );
  }

  async obterUltimoPullCursor(usuarioId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`studyrats.sync_cursor.${usuarioId}`);
    } catch {
      return null;
    }
  }

  async salvarUltimoPullCursor(usuarioId: string, cursorIso: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`studyrats.sync_cursor.${usuarioId}`, cursorIso);
    } catch {
      // Melhor-esforço: não bloqueia sincronização
    }
  }
}

