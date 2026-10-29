/** Description: Test helper that runs real SQLite (sql.js, in memory) behind the app's SQLiteExecutor port. */
import initSqlJs, { type BindParams, type Database } from 'sql.js';

import type { SQLiteExecutor, SQLiteBindValue } from '../SQLiteExecutor';

export class SqlJsExecutor implements SQLiteExecutor {
  private constructor(private readonly db: Database) {}

  static async create(): Promise<SqlJsExecutor> {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run('PRAGMA foreign_keys = ON');
    return new SqlJsExecutor(db);
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(source: string, params: SQLiteBindValue[] = []): Promise<void> {
    this.db.run(source, params as BindParams);
  }

  async getAllAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T[]> {
    const stmt = this.db.prepare(source);
    try {
      stmt.bind(params as BindParams);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  async getFirstAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, params);
    return rows[0] ?? null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.run('BEGIN');
    try {
      await task();
      this.db.run('COMMIT');
    } catch (error) {
      this.db.run('ROLLBACK');
      throw error;
    }
  }
}
