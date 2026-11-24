/** Description: Unit tests for ListarDisciplinasUseCase. */
import { ListarDisciplinasUseCase } from '../ListarDisciplinasUseCase';
import { Disciplina } from '../../../domain/entities/Disciplina';
import { InMemoryDisciplinaRepository } from '../../../infrastructure/repositories/InMemoryDisciplinaRepository';

describe('ListarDisciplinasUseCase', () => {
  it('deve listar disciplinas do usuário e buscar por ID', async () => {
    const repo = new InMemoryDisciplinaRepository();
    const d1 = Disciplina.create({ id: 'd1', usuarioId: 'u1', nome: 'Cálculo', cor: '#FF0000' });
    const d2 = Disciplina.create({ id: 'd2', usuarioId: 'u2', nome: 'Outra', cor: '#00FF00' });
    await repo.salvar(d1);
    await repo.salvar(d2);

    const uc = new ListarDisciplinasUseCase(repo);
    expect(await uc.execute('')).toEqual([]);
    const lista = await uc.execute('u1');
    expect(lista.map((d) => d.id)).toEqual(['d1']);

    expect((await uc.buscarPorId('d1'))?.nome).toBe('Cálculo');
    expect(await uc.buscarPorId('')).toBeNull();
  });
});

