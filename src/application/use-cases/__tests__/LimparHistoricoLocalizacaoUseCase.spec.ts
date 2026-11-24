/** Description: Testes unitários do caso de uso LimparHistoricoLocalizacaoUseCase (direito de eliminação LGPD). */
import { LimparHistoricoLocalizacaoUseCase } from '../LimparHistoricoLocalizacaoUseCase';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';
import { InMemorySyncQueueRepository } from '../../../infrastructure/repositories/InMemorySyncQueueRepository';
import { InMemoryUsuarioRepository } from '../../../infrastructure/repositories/InMemoryUsuarioRepository';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Usuario } from '../../../domain/entities/Usuario';
import { Coordenada } from '../../../domain/value-objects/Coordenada';

describe('LimparHistoricoLocalizacaoUseCase', () => {
  let sessaoRepo: InMemorySessaoEstudoRepository;
  let syncQueueRepo: InMemorySyncQueueRepository;
  let usuarioRepo: InMemoryUsuarioRepository;
  let useCase: LimparHistoricoLocalizacaoUseCase;

  beforeEach(() => {
    sessaoRepo = new InMemorySessaoEstudoRepository();
    syncQueueRepo = new InMemorySyncQueueRepository();
    usuarioRepo = new InMemoryUsuarioRepository();
    useCase = new LimparHistoricoLocalizacaoUseCase(sessaoRepo, syncQueueRepo, usuarioRepo);
  });

  it('deve remover as coordenadas das sessões, recalcular o XP do usuário e enfileirar atualização no Supabase', async () => {
    const usuario = Usuario.create({
      id: 'usr-1',
      email: 'clara@test.com',
      nomeExibicao: 'Clara',
      xpTotal: 70,
      xpSemanal: 70,
    });
    await usuarioRepo.salvar(usuario);

    await sessaoRepo.salvar(
      SessaoEstudo.create({
        id: 's1',
        usuarioId: 'usr-1',
        disciplinaId: 'd1',
        topicoId: 't1',
        duracaoMinutos: 40,
        coordenada: Coordenada.create({
          latitude: -21.5561,
          longitude: -45.4345,
          accuracy: 12,
          localAproximado: 'Centro, Varginha',
        }),
      })
    );
    await sessaoRepo.salvar(
      SessaoEstudo.create({
        id: 's2',
        usuarioId: 'usr-1',
        disciplinaId: 'd1',
        topicoId: 't1',
        duracaoMinutos: 25,
      })
    );

    const res = await useCase.execute({ usuarioId: 'usr-1' });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.sessoesAfetadas).toBe(1);
      expect(res.value.xpDescontado).toBe(5);
    }

    const s1 = await sessaoRepo.buscarPorId('s1');
    expect(s1?.coordenada).toBeUndefined();

    const usuarioAtualizado = await usuarioRepo.buscarPorId('usr-1');
    expect(usuarioAtualizado?.xpTotal).toBe(65);
    expect(usuarioAtualizado?.xpSemanal).toBe(65);

    const fila = await syncQueueRepo.buscarPendentes(10);
    expect(fila).toHaveLength(2);
    expect(fila[0].entidade).toBe('perfis');
    expect(JSON.parse(fila[0].payloadJson)).toMatchObject({ id: 'usr-1', xpTotal: 65, xpSemanal: 65 });
    expect(fila[1].entidade).toBe('sessoes_estudo');
    expect(fila[1].operacao).toBe('UPDATE');
    expect(JSON.parse(fila[1].payloadJson)).toEqual({
      acao: 'LIMPAR_COORDENADAS',
      usuarioId: 'usr-1',
    });
  });

  it('deve falhar quando usuarioId estiver vazio', async () => {
    const res = await useCase.execute({ usuarioId: '   ' });
    expect(res.isSuccess).toBe(false);
  });

  it('deve usar a contagem e XP online do Supabase quando o aparelho local estiver vazio', async () => {
    const usuario = Usuario.create({
      id: 'usr-1',
      email: 'clara@test.com',
      nomeExibicao: 'Clara',
      xpTotal: 0,
      xpSemanal: 0,
    });
    await usuarioRepo.salvar(usuario);

    const mockSyncGateway: any = {
      obterEstatisticasUsuarioRemoto: jest.fn().mockResolvedValue({
        sessoesCount: 3,
        sessoesComGpsCount: 2,
        minutosTotais: 90,
        xpTotal: 100,
        xpSemanal: 100,
      }),
      limparCoordenadasRemotas: jest.fn().mockResolvedValue(2),
      enviarParaNuvem: jest.fn().mockResolvedValue(undefined),
    };

    const useCaseOnline = new LimparHistoricoLocalizacaoUseCase(
      sessaoRepo,
      syncQueueRepo,
      usuarioRepo,
      mockSyncGateway
    );

    const res = await useCaseOnline.execute({ usuarioId: 'usr-1' });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.sessoesAfetadas).toBe(2);
      expect(res.value.xpDescontado).toBe(10);
    }

    const usuarioAtualizado = await usuarioRepo.buscarPorId('usr-1');
    expect(usuarioAtualizado?.xpTotal).toBe(90);
    expect(mockSyncGateway.limparCoordenadasRemotas).toHaveBeenCalledTimes(1);
    expect(mockSyncGateway.enviarParaNuvem).toHaveBeenCalledWith(
      'perfis',
      'UPDATE',
      expect.objectContaining({ id: 'usr-1', xpTotal: 90, xpSemanal: 90 })
    );
  });
});

