import { ConsultarRankingUseCase } from './ConsultarRankingUseCase';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { Usuario } from '../../domain/entities/Usuario';

class MockSyncGateway implements ISyncGateway {
  async fazerUploadFoto(uri: string, path: string): Promise<string> { return ''; }
  async enviarParaNuvem(tab: string, op: 'INSERT'|'UPDATE'|'DELETE', pay: any): Promise<void> {}
  
  async obterRanking(): Promise<Usuario[]> {
    return [
      Usuario.create({ id: '2', email: 'dois@test.com', nomeExibicao: 'User 2', xpSemanal: 10 }),
      Usuario.create({ id: '1', email: 'um@test.com', nomeExibicao: 'User 1', xpSemanal: 50 }),
      Usuario.create({ id: '3', email: 'tres@test.com', nomeExibicao: 'User 3', xpSemanal: 5 }),
    ];
  }
}

describe('ConsultarRankingUseCase', () => {
  it('should return top 50 users sorted by xpSemanal', async () => {
    const gateway = new MockSyncGateway();
    const useCase = new ConsultarRankingUseCase(gateway);

    const response = await useCase.execute();

    expect(response.isSuccess).toBe(true);
    if (response.isSuccess) {
      expect(response.value).toHaveLength(3);
      expect(response.value[0].id).toBe('1');
      expect(response.value[1].id).toBe('2');
      expect(response.value[2].id).toBe('3');
    }
  });
});
