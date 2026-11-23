/** Description: Specs for SQLiteSessaoEstudoRepository, executed against a real in-memory SQLite engine. */
import { SQLiteSessaoEstudoRepository } from '../SQLiteSessaoEstudoRepository';
import { migrate } from '../../database/migrations';
import { SqlJsExecutor } from '../../database/__tests__/sqlJsExecutor';
import { SessaoEstudo } from '@/domain/entities/SessaoEstudo';
import { FotoSessao } from '@/domain/entities/FotoSessao';
import { Coordenada } from '@/domain/value-objects/Coordenada';
import { StatusSincronizacao } from '@/domain/value-objects/StatusSincronizacao';

describe('SQLiteSessaoEstudoRepository', () => {
  let db: SqlJsExecutor;
  let repo: SQLiteSessaoEstudoRepository;

  beforeEach(async () => {
    db = await SqlJsExecutor.create();
    await migrate(db);
    repo = new SQLiteSessaoEstudoRepository(async () => db);
  });

  const novaSessao = (over: Partial<Parameters<typeof SessaoEstudo.create>[0]> = {}) =>
    SessaoEstudo.create({
      usuarioId: 'usr-1',
      disciplinaId: 'disc-1',
      topicoId: 'top-1',
      duracaoMinutos: 45,
      ...over,
    });

  it('deve salvar e recuperar uma sessão simples (sem foto e sem GPS)', async () => {
    const sessao = novaSessao();
    await repo.salvar(sessao);

    const achada = await repo.buscarPorId(sessao.id);

    expect(achada?.id).toBe(sessao.id);
    expect(achada?.duracaoMinutos).toBe(45);
    expect(achada?.syncStatus.value).toBe('pending');
    expect(achada?.coordenada).toBeUndefined();
    expect(achada?.foto).toBeUndefined();
  });

  it('deve persistir a coordenada de geolocalização, incluindo timestamp, accuracy e localAproximado', async () => {
    const capturadaEm = new Date('2026-05-10T14:30:00.000Z');
    const sessao = novaSessao({
      coordenada: Coordenada.create({
        latitude: -23.5505,
        longitude: -46.6333,
        timestamp: capturadaEm,
        accuracy: 15.2,
        localAproximado: 'Sé, São Paulo',
      }),
    });
    await repo.salvar(sessao);

    const achada = await repo.buscarPorId(sessao.id);

    expect(achada?.coordenada?.latitude).toBe(-23.5505);
    expect(achada?.coordenada?.longitude).toBe(-46.6333);
    expect(achada?.coordenada?.timestamp.toISOString()).toBe(capturadaEm.toISOString());
    expect(achada?.coordenada?.accuracy).toBeCloseTo(15.2);
    expect(achada?.coordenada?.localAproximado).toBe('Sé, São Paulo');
  });

  it('deve remover as coordenadas das sessões do usuário mantendo as sessões (direito de exclusão LGPD)', async () => {
    const s1 = novaSessao({
      usuarioId: 'usr-1',
      coordenada: Coordenada.create({ latitude: -21.55, longitude: -45.43, accuracy: 10, localAproximado: 'Centro, Varginha' }),
    });
    const s2 = novaSessao({ usuarioId: 'usr-1' });
    const sOutro = novaSessao({
      usuarioId: 'usr-2',
      coordenada: Coordenada.create({ latitude: -19.91, longitude: -43.93 }),
    });
    await repo.salvar(s1);
    await repo.salvar(s2);
    await repo.salvar(sOutro);

    const removidas = await repo.removerCoordenadasPorUsuario('usr-1');

    expect(removidas).toBe(1);
    expect((await repo.buscarPorId(s1.id))?.coordenada).toBeUndefined();
    expect((await repo.buscarPorId(sOutro.id))?.coordenada?.latitude).toBe(-19.91);
  });

  it('deve expurgar automaticamente coordenadas antigas anteriores à data limite (política de retenção 90 dias)', async () => {
    const antiga = novaSessao({
      createdAt: new Date('2025-11-01T10:00:00.000Z'),
      coordenada: Coordenada.create({ latitude: -21.55, longitude: -45.43 }),
    });
    const recente = novaSessao({
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      coordenada: Coordenada.create({ latitude: -19.91, longitude: -43.93 }),
    });
    await repo.salvar(antiga);
    await repo.salvar(recente);

    const expurgadas = await repo.expurgarCoordenadasAntigas(new Date('2026-01-01T00:00:00.000Z'));

    expect(expurgadas).toBe(1);
    expect((await repo.buscarPorId(antiga.id))?.coordenada).toBeUndefined();
    expect((await repo.buscarPorId(antiga.id))?.duracaoMinutos).toBe(45);
    expect((await repo.buscarPorId(recente.id))?.coordenada?.latitude).toBe(-19.91);
  });

  it('deve persistir a foto da câmera como entidade fraca da sessão', async () => {
    const sessao = novaSessao();
    sessao.anexarFoto(FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///docs/fotos/caderno.jpg' }));
    await repo.salvar(sessao);

    const achada = await repo.buscarPorId(sessao.id);

    expect(achada?.foto?.uriLocal).toBe('file:///docs/fotos/caderno.jpg');
    expect(achada?.foto?.sessaoId).toBe(sessao.id);
    expect(achada?.foto?.uploadStatus).toBe('pending');
  });

  it('deve salvar foto e coordenada juntas na mesma sessão', async () => {
    const sessao = novaSessao({ coordenada: Coordenada.create({ latitude: 10, longitude: 20 }) });
    sessao.anexarFoto(FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///foto.jpg' }));
    await repo.salvar(sessao);

    const achada = await repo.buscarPorId(sessao.id);

    expect(achada?.foto?.uriLocal).toBe('file:///foto.jpg');
    expect(achada?.coordenada?.latitude).toBe(10);
  });

  it('deve atualizar (upsert) a sessão ao salvar novamente, refletindo o status de sincronização e o upload da foto', async () => {
    const sessao = novaSessao();
    const foto = FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///foto.jpg' });
    sessao.anexarFoto(foto);
    await repo.salvar(sessao);

    foto.marcarComoUploadConcluido('https://cdn/foto.jpg');
    sessao.atualizarSyncStatus('synced');
    await repo.salvar(sessao);

    const achada = await repo.buscarPorId(sessao.id);
    const todas = await repo.listarPorUsuario('usr-1');

    expect(todas).toHaveLength(1);
    expect(achada?.syncStatus.value).toBe('synced');
    expect(achada?.foto?.urlRemota).toBe('https://cdn/foto.jpg');
    expect(achada?.foto?.uploadStatus).toBe('completed');
  });

  it('deve retornar null para sessão inexistente', async () => {
    expect(await repo.buscarPorId('nao-existe')).toBeNull();
  });

  it('deve listar por usuário e por disciplina, da mais recente para a mais antiga', async () => {
    const antiga = novaSessao({ createdAt: new Date('2026-01-01T10:00:00Z'), syncStatus: StatusSincronizacao.synced() });
    const recente = novaSessao({ createdAt: new Date('2026-03-01T10:00:00Z') });
    const outroUsuario = novaSessao({ usuarioId: 'usr-2' });
    const outraDisciplina = novaSessao({ disciplinaId: 'disc-2' });
    for (const s of [antiga, recente, outroUsuario, outraDisciplina]) await repo.salvar(s);

    const doUsuario = await repo.listarPorUsuario('usr-1');
    const daDisciplina = await repo.listarPorDisciplina('disc-1');

    expect(doUsuario).toHaveLength(3);
    expect(doUsuario.map((s) => s.id)).not.toContain(outroUsuario.id);
    expect(doUsuario.findIndex((s) => s.id === recente.id)).toBeLessThan(doUsuario.findIndex((s) => s.id === antiga.id));
    expect(daDisciplina.map((s) => s.id).sort()).toEqual([antiga.id, outroUsuario.id, recente.id].sort());
    expect(doUsuario.find((s) => s.id === antiga.id)?.syncStatus.value).toBe('synced');
  });

  it('deve carregar a foto e a coordenada de cada sessão ao listar', async () => {
    const sessao = novaSessao({ coordenada: Coordenada.create({ latitude: 1, longitude: 2 }) });
    sessao.anexarFoto(FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///a.jpg' }));
    await repo.salvar(sessao);
    await repo.salvar(novaSessao());

    const lista = await repo.listarPorUsuario('usr-1');
    const comEvidencias = lista.find((s) => s.id === sessao.id);

    expect(lista).toHaveLength(2);
    expect(comEvidencias?.foto?.uriLocal).toBe('file:///a.jpg');
    expect(comEvidencias?.coordenada?.longitude).toBe(2);
  });

  it('deve remover a foto junto com a sessão (ON DELETE CASCADE) e garantir 1 foto por sessão', async () => {
    const sessao = novaSessao();
    sessao.anexarFoto(FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///a.jpg' }));
    await repo.salvar(sessao);
    sessao.anexarFoto(FotoSessao.create({ sessaoId: sessao.id, uriLocal: 'file:///b.jpg' }));
    await repo.salvar(sessao);

    const fotos = await db.getAllAsync<{ uri_local: string }>('SELECT uri_local FROM fotos_sessao');
    expect(fotos).toHaveLength(1);
    expect(fotos[0].uri_local).toBe('file:///b.jpg');

    await db.runAsync('DELETE FROM sessoes_estudo WHERE id = ?', [sessao.id]);
    const restantes = await db.getAllAsync('SELECT * FROM fotos_sessao');
    expect(restantes).toHaveLength(0);
  });
});
