/** Description: Testes unitários do caso de uso LimparHistoricoLocalizacaoUseCase (direito de eliminação LGPD). */
import { LimparHistoricoLocalizacaoUseCase } from '../LimparHistoricoLocalizacaoUseCase';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';
import { InMemorySyncQueueRepository } from '../../../infrastructure/repositories/InMemorySyncQueueRepository';
import { SessaoEstudo } from '../../../domain/entities/SessaoEstudo';
import { Coordenada } from '../../../domain/value-objects/Coordenada';

describe('LimparHistoricoLocalizacaoUseCase', () => {
  let sessaoRepo: InMemorySessaoEstudoRepository;
  let syncQueueRepo: InMemorySyncQueueRepository;
  let useCase: LimparHistoricoLocalizacaoUseCase;

  beforeEach(() => {
    sessaoRepo = new InMemorySessaoEstudoRepository();
    syncQueueRepo = new InMemorySyncQueueRepository();
    useCase = new LimparHistoricoLocalizacaoUseCase(sessaoRepo, syncQueueRepo);
  });

  it('deve remover as coordenadas das sessões do usuário e enfileirar atualização no Supabase', async () => {
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
    }

    const s1 = await sessaoRepo.buscarPorId('s1');
    expect(s1?.coordenada).toBeUndefined();

    const fila = await syncQueueRepo.buscarPendentes(10);
    expect(fila).toHaveLength(1);
    expect(fila[0].entidade).toBe('sessoes_estudo');
    expect(fila[0].operacao).toBe('UPDATE');
    expect(JSON.parse(fila[0].payloadJson)).toEqual({
      acao: 'LIMPAR_COORDENADAS',
      usuarioId: 'usr-1',
    });
  });

  it('deve falhar quando usuarioId estiver vazio', async () => {
    const res = await useCase.execute({ usuarioId: '   ' });
    expect(res.isSuccess).toBe(false);
  });
});

