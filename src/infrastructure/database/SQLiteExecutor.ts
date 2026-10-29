/** Description: Minimal port over the SQLite API, so repositories do not depend on the native expo-sqlite module (testable with any engine). */
export type SQLiteBindValue = string | number | null | Uint8Array;

export interface SQLiteExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
