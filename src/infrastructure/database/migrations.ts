/** Description: Versioned schema migrations for the local SQLite database (PRAGMA user_version pattern from the Expo docs). */
import type { SQLiteExecutor } from './SQLiteExecutor';

export const DATABASE_VERSION = 1;

/**
 * Cria/atualiza o schema local. É idempotente: só aplica as versões que ainda não foram executadas.
 *
 * Modelagem (DDD):
 *  - `sessoes_estudo` é o agregado raiz; a `Coordenada` (value object) fica embutida em colunas.
 *  - `fotos_sessao` é a entidade fraca `FotoSessao`: no máximo 1 por sessão (UNIQUE) e removida em cascata.
 */
export async function migrate(db: SQLiteExecutor): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versaoAtual = row?.user_version ?? 0;

  if (versaoAtual >= DATABASE_VERSION) {
    return;
  }

  if (versaoAtual < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessoes_estudo (
        id TEXT PRIMARY KEY NOT NULL,
        usuario_id TEXT NOT NULL,
        disciplina_id TEXT NOT NULL,
        topico_id TEXT NOT NULL,
        duracao_minutos INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        latitude REAL,
        longitude REAL,
        coordenada_timestamp TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_estudo (usuario_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sessoes_disciplina ON sessoes_estudo (disciplina_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS fotos_sessao (
        id TEXT PRIMARY KEY NOT NULL,
        sessao_id TEXT NOT NULL UNIQUE REFERENCES sessoes_estudo (id) ON DELETE CASCADE,
        uri_local TEXT NOT NULL,
        url_remota TEXT,
        upload_status TEXT NOT NULL DEFAULT 'pending'
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
