/** Description: Tests for SQLiteDisciplinaRepository using in-memory SQLite (SqlJsExecutor). */
import { SQLiteDisciplinaRepository } from '../SQLiteDisciplinaRepository';
import { SqlJsExecutor } from '../../database/__tests__/sqlJsExecutor';
import { migrate } from '../../database/migrations';
import { Disciplina } from '../../../domain/entities/Disciplina';
import { Topico } from '../../../domain/entities/Topico';

describe('SQLiteDisciplinaRepository', () => {
  let db: any;
  let repo: SQLiteDisciplinaRepository;

  beforeEach(async () => {
    db = await SqlJsExecutor.create();
    await migrate(db);
    repo = new SQLiteDisciplinaRepository(async () => db);
  });

  it('deve salvar e recuperar uma disciplina com seus tópicos', async () => {
    const disciplina = Disciplina.create({
      id: 'd1',
      usuarioId: 'u1',
      nome: 'Cálculo I',
      cor: '#3B82F6',
    });

    const topico1 = Topico.create({
      id: 't1',
      disciplinaId: 'd1',
      nome: 'Limites',
    });

    const topico2 = Topico.create({
      id: 't2',
      disciplinaId: 'd1',
      nome: 'Derivadas',
    });

    disciplina.adicionarTopico(topico1);
    disciplina.adicionarTopico(topico2);

    await repo.salvar(disciplina);

    const recuperada = await repo.buscarPorId('d1');
    expect(recuperada).not.toBeNull();
    expect(recuperada?.id).toBe('d1');
    expect(recuperada?.nome).toBe('Cálculo I');
    expect(recuperada?.cor).toBe('#3B82F6');
    expect(recuperada?.topicos).toHaveLength(2);
    expect(recuperada?.topicos.map(t => t.nome)).toEqual(['Limites', 'Derivadas']);
  });

  it('deve listar disciplinas ativas por usuário', async () => {
    const d1 = Disciplina.create({ id: 'd1', usuarioId: 'u1', nome: 'Física I', cor: '#10B981', createdAt: new Date('2026-01-01T10:00:00.000Z') });
    const d2 = Disciplina.create({ id: 'd2', usuarioId: 'u1', nome: 'Química', cor: '#F59E0B', createdAt: new Date('2026-01-01T11:00:00.000Z') });
    const d3 = Disciplina.create({ id: 'd3', usuarioId: 'u2', nome: 'Outro Usuário', cor: '#EF4444' });

    await repo.salvar(d1);
    await repo.salvar(d2);
    await repo.salvar(d3);

    const lista = await repo.listarPorUsuario('u1');
    expect(lista).toHaveLength(2);
    expect(lista.map(d => d.nome)).toEqual(['Física I', 'Química']);
  });

  it('deve atualizar disciplina e sincronizar tópicos removidos', async () => {
    const disciplina = Disciplina.create({
      id: 'd1',
      usuarioId: 'u1',
      nome: 'Álgebra Linear',
      cor: '#8B5CF6',
    });
    disciplina.adicionarTopico(Topico.create({ id: 't1', disciplinaId: 'd1', nome: 'Vetores' }));
    disciplina.adicionarTopico(Topico.create({ id: 't2', disciplinaId: 'd1', nome: 'Matrizes' }));

    await repo.salvar(disciplina);

    // Remover um tópico
    disciplina.removerTopico('t1');
    await repo.salvar(disciplina);

    const recuperada = await repo.buscarPorId('d1');
    expect(recuperada?.topicos).toHaveLength(1);
    expect(recuperada?.topicos[0].id).toBe('t2');
  });

  it('deve fazer soft delete da disciplina e ocultar da listagem', async () => {
    const disciplina = Disciplina.create({
      id: 'd1',
      usuarioId: 'u1',
      nome: 'História',
      cor: '#EC4899',
    });
    await repo.salvar(disciplina);

    await repo.deletar('d1');

    const recuperada = await repo.buscarPorId('d1');
    expect(recuperada).toBeNull();

    const lista = await repo.listarPorUsuario('u1');
    expect(lista).toHaveLength(0);
  });
});
