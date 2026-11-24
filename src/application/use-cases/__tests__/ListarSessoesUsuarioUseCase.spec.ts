/** Description: Unit tests for ListarSessoesUsuarioUseCase. */
import { ListarSessoesUsuarioUseCase } from '../ListarSessoesUsuarioUseCase';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';

describe('ListarSessoesUsuarioUseCase', () => {
  it('deve listar apenas sessões do usuário informado', async () => {
    const repo = new InMemorySessaoEstudoRepository();
    await repo.salvar(
      SessaoEstudo.create({ id: 's1', usuarioId: 'u1', disciplinaId: 'd1', topicoId: 't1', duracaoMinutos: 25 })
    );
    await repo.salvar(
      SessaoEstudo.create({ id: 's2', usuarioId: 'u2', disciplinaId: 'd1', topicoId: 't1', duracaoMinutos: 30 })
    );

    const uc = new ListarSessoesUsuarioUseCase(repo);
    expect(await uc.execute('')).toEqual([]);
    const res = await uc.execute('u1');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('s1');
  });
});

