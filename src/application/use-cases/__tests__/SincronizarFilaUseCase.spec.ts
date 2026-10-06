import { SincronizarFilaUseCase } from '../SincronizarFilaUseCase';
import { ISyncQueueRepository } from '../../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../../domain/gateways/ISyncGateway';
import { SyncQueueItem } from '../../../domain/entities/SyncQueueItem';
import { Usuario } from '../../../domain/entities/Usuario';

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
  async enviarParaNuvem(): Promise<void> {
    if (this.shouldFail) throw new Error('Network error');
  }
  async fazerUploadFoto(): Promise<string> { return ''; }
  async obterRanking(): Promise<Usuario[]> { return []; }
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
});
