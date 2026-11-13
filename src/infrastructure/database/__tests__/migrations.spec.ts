/** Description: Specs for the SQLite schema migrations (versioned through PRAGMA user_version). */
import { migrate, DATABASE_VERSION } from '../migrations';
import { SqlJsExecutor } from './sqlJsExecutor';

describe('migrate', () => {
  it('deve criar as tabelas de sessões e fotos e registrar a versão do schema', async () => {
    const db = await SqlJsExecutor.create();
    await migrate(db);

    const tabelas = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const versao = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

    expect(tabelas.map((t) => t.name)).toEqual([
      'disciplinas',
      'fotos_sessao',
      'sessoes_estudo',
      'sync_queue',
      'topicos',
    ]);
    expect(versao?.user_version).toBe(DATABASE_VERSION);
  });

  it('deve criar as tabelas da versão 2 com as colunas esperadas', async () => {
    const db = await SqlJsExecutor.create();
    await migrate(db);

    const colunasDisc = await db.getAllAsync<{ name: string }>("PRAGMA table_info('disciplinas')");
    expect(colunasDisc.map((c) => c.name)).toEqual(
      expect.arrayContaining(['id', 'usuario_id', 'nome', 'cor', 'created_at', 'updated_at', 'deleted_at', 'sync_status'])
    );

    const colunasTop = await db.getAllAsync<{ name: string }>("PRAGMA table_info('topicos')");
    expect(colunasTop.map((c) => c.name)).toEqual(
      expect.arrayContaining(['id', 'disciplina_id', 'nome', 'created_at', 'updated_at', 'deleted_at', 'sync_status'])
    );

    const colunasSync = await db.getAllAsync<{ name: string }>("PRAGMA table_info('sync_queue')");
    expect(colunasSync.map((c) => c.name)).toEqual(
      expect.arrayContaining(['id', 'entidade', 'operacao', 'payload_json', 'tentativas', 'erro_msg', 'status', 'created_at'])
    );
  });

  it('deve guardar a coordenada (latitude, longitude, timestamp) como colunas da sessão', async () => {
    const db = await SqlJsExecutor.create();
    await migrate(db);

    const colunas = await db.getAllAsync<{ name: string }>("PRAGMA table_info('sessoes_estudo')");

    expect(colunas.map((c) => c.name)).toEqual(
      expect.arrayContaining(['latitude', 'longitude', 'coordenada_timestamp'])
    );
  });

  it('deve ser idempotente: rodar duas vezes não falha nem apaga dados', async () => {
    const db = await SqlJsExecutor.create();
    await migrate(db);
    await db.runAsync(
      'INSERT INTO sessoes_estudo (id, usuario_id, disciplina_id, topico_id, duracao_minutos, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['s1', 'u1', 'd1', 't1', 30, '2026-01-01T00:00:00.000Z', 'pending']
    );

    await expect(migrate(db)).resolves.toBeUndefined();

    const linhas = await db.getAllAsync('SELECT * FROM sessoes_estudo');
    expect(linhas).toHaveLength(1);
  });
});
