/** Description: SQLite implementation of ISyncQueueRepository using SQLiteExecutor. */
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import type { SQLiteExecutor } from '../database/SQLiteExecutor';
import { getDatabase } from '../database/database';

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

export class SQLiteSyncQueueRepository implements ISyncQueueRepository {
  constructor(private readonly getDb: () => Promise<SQLiteExecutor> = getDatabase) {}

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
  }

  async buscarPendentes(limite: number = 10): Promise<SyncQueueItem[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SyncQueueRow>(
      `SELECT * FROM sync_queue
       WHERE status = 'pending'
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
}

