/** Description: Unit tests for ObterEstatisticasPerfilUseCase including XP reconciliation. */
import { ObterEstatisticasPerfilUseCase } from '../ObterEstatisticasPerfilUseCase';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Usuario } from '../../../domain/entities/Usuario';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';
import { InMemoryUsuarioRepository } from '../../../infrastructure/repositories/InMemoryUsuarioRepository';

describe('ObterEstatisticasPerfilUseCase', () => {
  it('deve agregar estatísticas remotas e reconciliar XP divergente quando não houver pendências', async () => {
    const sessaoRepo = new InMemorySessaoEstudoRepository();
    const usuarioRepo = new InMemoryUsuarioRepository();
    const syncQueueRepo: any = { buscarPendentes: jest.fn().mockResolvedValue([]) };
    const syncGateway: any = {
      obterEstatisticasUsuarioRemoto: jest.fn().mockResolvedValue({
        sessoesCount: 2,
        sessoesComGpsCount: 0,
        minutosTotais: 24,
        xpTotal: 34,
        sessoesResumo: [
          { id: 's1', duracaoMinutos: 14, comGps: false, comFoto: false },
          { id: 's2', duracaoMinutos: 10, comGps: false, comFoto: false },
        ],
      }),
      enviarParaNuvem: jest.fn().mockResolvedValue(undefined),
    };

    const user = Usuario.create({ id: 'u1', nomeExibicao: 'Sthefany', email: 's@test.com', xpTotal: 34 });
    await usuarioRepo.salvar(user);
    await sessaoRepo.salvar(
      SessaoEstudo.create({ id: 's1', usuarioId: 'u1', disciplinaId: 'd1', topicoId: 't1', duracaoMinutos: 14 })
    );

    const uc = new ObterEstatisticasPerfilUseCase(sessaoRepo, usuarioRepo, syncQueueRepo, syncGateway);
    const stats = await uc.execute('u1');

    expect(stats.sessoesCount).toBe(2);
    expect(stats.minutosTotais).toBe(24);
    expect(stats.xpReconciliado).toBe(true);
    const atualizado = await usuarioRepo.buscarPorId('u1');
    expect(atualizado?.xpTotal).toBe(24);
    expect(syncGateway.enviarParaNuvem).toHaveBeenCalledWith(
      'perfis',
      'UPDATE',
      expect.objectContaining({ id: 'u1', xpTotal: 24 })
    );
  });
});

