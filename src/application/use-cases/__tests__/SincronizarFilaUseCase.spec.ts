/** Description: This file (src/application/use-cases/__tests__/SincronizarFilaUseCase.spec.ts) contains the implementation for its respective feature. */
import { SincronizarFilaUseCase } from '../SincronizarFilaUseCase';
import { ISyncQueueRepository } from '../../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../../domain/gateways/ISyncGateway';
import { SyncQueueItem } from '../../../domain/entities/SyncQueueItem';
import { Usuario } from '../../../domain/entities/Usuario';
import { InMemoryDisciplinaRepository } from '../../../infrastructure/repositories/InMemoryDisciplinaRepository';
import { InMemorySessaoEstudoRepository } from '../../../infrastructure/repositories/InMemorySessaoEstudoRepository';

class MockSyncQueueRepo implements ISyncQueueRepository {
  itens: SyncQueueItem[] = [];
  async enfileirar(item: SyncQueueItem): Promise<void> { this.itens.push(item); }
  async buscarPendentes(limite?: number): Promise<SyncQueueItem[]> { return this.itens.filter(i => i.status === 'pending').slice(0, limite); }
  async remover(id: string): Promise<void> { this.itens = this.itens.filter(i => i.id !== id); }
  async registrarFalha(item: SyncQueueItem): Promise<void> {
    const idx = this.itens.findIndex(i => i.id === item.id);
    if (idx >= 0) this.itens[idx] = item;
  }
}

class MockSyncGateway implements ISyncGateway {
  shouldFail = false;
  expurgoChamado = false;
  ultimoPayloadEnviado: any = null;
  async enviarParaNuvem(_t: string, _op: string, payload: any): Promise<void> {
    if (this.shouldFail) throw new Error('Network error');
    this.ultimoPayloadEnviado = payload;
  }
  async fazerUploadFoto(): Promise<string> { return ''; }
  async fazerUploadAvatar(_uri: string, caminho: string): Promise<string> {
    return `https://cdn.supabase.co/storage/v1/object/public/avatares/${caminho}`;
  }
  async obterRanking(): Promise<Usuario[]> { return []; }
  async expurgarCoordenadasAntigas(): Promise<number> {
    this.expurgoChamado = true;
    return 3;
  }
}

describe('SincronizarFilaUseCase', () => {
  it('should process pending items and remove them', async () => {
    const repo = new MockSyncQueueRepo();
    const gateway = new MockSyncGateway();
    const useCase = new SincronizarFilaUseCase(repo, gateway);

    const item = SyncQueueItem.create({ entidade: 'SessaoEstudo', operacao: 'INSERT', payloadJson: '{}' });
    await repo.enfileirar(item);

    const response = await useCase.execute();

    expect(response.processados).toBe(1);
    expect(response.falhas).toBe(0);
    expect(response.coordenadasExpurgadas).toBe(3);
    expect(gateway.expurgoChamado).toBe(true);
    expect(repo.itens).toHaveLength(0); // Removido
  });

  it('should register failure if gateway fails', async () => {
    const repo = new MockSyncQueueRepo();
    const gateway = new MockSyncGateway();
    gateway.shouldFail = true;
    const useCase = new SincronizarFilaUseCase(repo, gateway);

    const item = SyncQueueItem.create({ entidade: 'SessaoEstudo', operacao: 'INSERT', payloadJson: '{}' });
    await repo.enfileirar(item);

    const response = await useCase.execute();

    expect(response.processados).toBe(0);
    expect(response.falhas).toBe(1);
    expect(repo.itens).toHaveLength(1);
    expect(repo.itens[0].status).toBe('error');
    expect(repo.itens[0].tentativas).toBe(1);
  });

  it('deve subir avatar local ao bucket público antes de enviar perfil para nuvem', async () => {
    const repo = new MockSyncQueueRepo();
    const gateway = new MockSyncGateway();
    const useCase = new SincronizarFilaUseCase(repo, gateway);

    const item = SyncQueueItem.create({
      entidade: 'perfis',
      operacao: 'UPDATE',
      payloadJson: JSON.stringify({
        id: 'u-1',
        nomeExibicao: 'Clara',
        nomeUsuario: '@clara',
        fotoUrl: 'file:///cache/avatar.png',
        metaDiariaMinutos: 120,
      }),
    });
    await repo.enfileirar(item);

    const response = await useCase.execute();
    expect(response.processados).toBe(1);
    expect(gateway.ultimoPayloadEnviado.fotoUrl).toBe(
      'https://cdn.supabase.co/storage/v1/object/public/avatares/u-1/avatar.png'
    );
  });

  it('deve baixar alterações via Delta Pull Sync e hidratar disciplinas, tópicos e sessões locais', async () => {
    const repo = new MockSyncQueueRepo();
    const discRepo = new InMemoryDisciplinaRepository();
    const sessaoRepo = new InMemorySessaoEstudoRepository();
    const gateway: ISyncGateway = {
      enviarParaNuvem: jest.fn(),
      fazerUploadFoto: jest.fn(),
      obterRanking: jest.fn().mockResolvedValue([]),
      baixarDeltaRemoto: jest.fn().mockResolvedValue({
        usuarioId: 'u-1',
        serverTimeIso: '2026-11-24T00:00:00.000Z',
        disciplinas: [
          {
            id: 'd-rem',
            usuarioId: 'u-1',
            nome: 'Algoritmos',
            cor: '#3B82F6',
            createdAt: '2026-11-23T10:00:00.000Z',
            updatedAt: '2026-11-23T10:00:00.000Z',
            deletedAt: null,
            topicos: [
              {
                id: 't-rem',
                disciplinaId: 'd-rem',
                nome: 'Grafos',
                createdAt: '2026-11-23T10:00:00.000Z',
                updatedAt: '2026-11-23T10:00:00.000Z',
                deletedAt: null,
              },
            ],
          },
        ],
        topicosSoltos: [],
        sessoes: [
          {
            id: 's-rem',
            usuarioId: 'u-1',
            disciplinaId: 'd-rem',
            topicoId: 't-rem',
            duracaoMinutos: 40,
            createdAt: '2026-11-23T12:00:00.000Z',
            latitude: -21.55,
            longitude: -45.43,
            localAproximado: 'Centro, Varginha',
          },
        ],
      }),
    };

    const useCase = new SincronizarFilaUseCase(repo, gateway, sessaoRepo, undefined, discRepo);
    const response = await useCase.execute();

    expect(response.deltaAplicados).toBe(2);
    const disciplinas = await discRepo.listarPorUsuario('u-1');
    expect(disciplinas).toHaveLength(1);
    expect(disciplinas[0].nome).toBe('Algoritmos');
    expect(disciplinas[0].topicos[0].nome).toBe('Grafos');
    const sessoes = await sessaoRepo.listarPorUsuario('u-1');
    expect(sessoes).toHaveLength(1);
    expect(sessoes[0].syncStatus.value).toBe('synced');
  });
});
