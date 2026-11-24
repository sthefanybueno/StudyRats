/** Description: Opens the app's local SQLite database once (lazy singleton), enables WAL/foreign keys and runs migrations. */
import * as SQLite from 'expo-sqlite';

import { migrate } from './migrations';
import type { SQLiteBindValue, SQLiteExecutor } from './SQLiteExecutor';

const DATABASE_NAME = 'studyrats.db';

/** Adapta o SQLiteDatabase do expo-sqlite para a porta SQLiteExecutor com suporte a transações re-entrantes. */
function createExpoExecutor(db: SQLite.SQLiteDatabase): SQLiteExecutor {
  let transactionDepth = 0;

  return {
    execAsync: (source) => db.execAsync(source),
    runAsync: (source, params: SQLiteBindValue[] = []) => db.runAsync(source, params),
    getAllAsync: <T>(source: string, params: SQLiteBindValue[] = []) => db.getAllAsync<T>(source, params),
    getFirstAsync: <T>(source: string, params: SQLiteBindValue[] = []) => db.getFirstAsync<T>(source, params),
    withTransactionAsync: async (task) => {
      if (transactionDepth > 0) {
        transactionDepth++;
        try {
          await task();
        } finally {
          transactionDepth--;
        }
        return;
      }

      transactionDepth++;
      try {
        await db.withTransactionAsync(task);
      } finally {
        transactionDepth--;
      }
    },
  };
}

let databasePromise: Promise<SQLiteExecutor> | null = null;

/**
 * Retorna a conexão única com o banco local. Se a abertura/migração falhar, a próxima chamada tenta de novo.
 */
export function getDatabase(): Promise<SQLiteExecutor> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      const executor = createExpoExecutor(db);
      await migrate(executor);
      return executor;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
