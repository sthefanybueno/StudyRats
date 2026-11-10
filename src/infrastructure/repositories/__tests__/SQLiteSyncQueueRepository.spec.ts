/** Description: Tests for SQLiteSyncQueueRepository using in-memory SQLite (SqlJsExecutor). */
import { SQLiteSyncQueueRepository } from '../SQLiteSyncQueueRepository';
import { SqlJsExecutor } from '../../database/__tests__/sqlJsExecutor';
import { migrate } from '../../database/migrations';
import { SyncQueueItem } from '../../../domain/entities/SyncQueueItem';

describe('SQLiteSyncQueueRepository', () => {
  let db: any;
  let repo: SQLiteSyncQueueRepository;

  beforeEach(async () => {
    db = await SqlJsExecutor.create();
    await migrate(db);
    repo = new SQLiteSyncQueueRepository(async () => db);
  });

  it('deve enfileirar itens e recuperá-los em ordem FIFO', async () => {
    const item1 = SyncQueueItem.create({
      id: 'sq-1',
      entidade: 'sessoes_estudo',
      operacao: 'INSERT',
      payloadJson: JSON.stringify({ sessaoId: 's1' }),
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
    });

    const item2 = SyncQueueItem.create({
      id: 'sq-2',
      entidade: 'disciplinas',
      operacao: 'INSERT',
      payloadJson: JSON.stringify({ disciplinaId: 'd1' }),
      createdAt: new Date('2026-01-01T11:00:00.000Z'),
    });

    await repo.enfileirar(item1);
    await repo.enfileirar(item2);

    const pendentes = await repo.buscarPendentes();
    expect(pendentes).toHaveLength(2);
    expect(pendentes[0].id).toBe('sq-1');
    expect(pendentes[0].entidade).toBe('sessoes_estudo');
    expect(pendentes[1].id).toBe('sq-2');
    expect(pendentes[1].entidade).toBe('disciplinas');
  });

  it('deve respeitar o limite de itens buscados', async () => {
    for (let i = 1; i <= 5; i++) {
      await repo.enfileirar(
        SyncQueueItem.create({
          id: `sq-${i}`,
          entidade: 'topicos',
          operacao: 'INSERT',
          payloadJson: JSON.stringify({ i }),
          createdAt: new Date(`2026-01-01T10:0${i}:00.000Z`),
        })
      );
    }

    const pendentes = await repo.buscarPendentes(2);
    expect(pendentes).toHaveLength(2);
    expect(pendentes[0].id).toBe('sq-1');
    expect(pendentes[1].id).toBe('sq-2');
  });

  it('deve remover o item da fila após ser processado com sucesso', async () => {
    const item = SyncQueueItem.create({
      id: 'sq-1',
      entidade: 'sessoes_estudo',
      operacao: 'INSERT',
      payloadJson: JSON.stringify({ sessaoId: 's1' }),
    });

    await repo.enfileirar(item);
    let pendentes = await repo.buscarPendentes();
    expect(pendentes).toHaveLength(1);

    await repo.remover('sq-1');
    pendentes = await repo.buscarPendentes();
    expect(pendentes).toHaveLength(0);
  });

  it('deve registrar falha no item aumentando tentativas e marcando status', async () => {
    const item = SyncQueueItem.create({
      id: 'sq-1',
      entidade: 'sessoes_estudo',
      operacao: 'INSERT',
      payloadJson: JSON.stringify({ sessaoId: 's1' }),
    });

    await repo.enfileirar(item);

    item.registrarFalha('Conexão recusada pelo servidor');
    await repo.registrarFalha(item);

    // Como o status foi alterado para 'error', não deve vir mais na lista de pendentes imediatos
    const pendentes = await repo.buscarPendentes();
    expect(pendentes).toHaveLength(0);

    // Mas no banco a linha existe com erro registrado
    const raw = await db.getFirstAsync<{ tentativas: number; erro_msg: string; status: string }>(
      'SELECT tentativas, erro_msg, status FROM sync_queue WHERE id = ?',
      ['sq-1']
    );
    expect(raw?.tentativas).toBe(1);
    expect(raw?.erro_msg).toBe('Conexão recusada pelo servidor');
    expect(raw?.status).toBe('error');
  });
});

