import { GerarResumoUseCase } from './GerarResumoUseCase';
import { IAIGateway } from '../../domain/gateways/IAIGateway';
import { IResumoIARepository } from '../../domain/repositories/IResumoIARepository';
import { ResumoIA } from '../../domain/entities/ResumoIA';

class MockAIGateway implements IAIGateway {
  shouldFail = false;
  async gerarResumoParaTopico(nome: string): Promise<string> {
    if (this.shouldFail) throw new Error('Falha na API de IA');
    return `Resumo mock para: ${nome}`;
  }
}

class MockResumoRepository implements IResumoIARepository {
  resumos: ResumoIA[] = [];
  async salvar(resumo: ResumoIA): Promise<void> { this.resumos.push(resumo); }
  async buscarPorTopico(id: string): Promise<ResumoIA | null> { return this.resumos.find(r => r.topicoId === id) || null; }
}

describe('GerarResumoUseCase', () => {
  it('should generate summary and save to repository', async () => {
    const aiGateway = new MockAIGateway();
    const repo = new MockResumoRepository();
    const useCase = new GerarResumoUseCase(aiGateway, repo);

    const response = await useCase.execute({ topicoId: 'topico-123', nomeTopico: 'Física Quantica' });

    expect(response.isSuccess).toBe(true);
    if (response.isSuccess) {
      expect(response.value.conteudo).toBe('Resumo mock para: Física Quantica');
      expect(repo.resumos).toHaveLength(1);
    }
  });

  it('should fail if AI gateway fails', async () => {
    const aiGateway = new MockAIGateway();
    aiGateway.shouldFail = true;
    const repo = new MockResumoRepository();
    const useCase = new GerarResumoUseCase(aiGateway, repo);

    const response = await useCase.execute({ topicoId: 'topico-123', nomeTopico: 'Física Quantica' });

    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) {
      expect(response.error).toBe('Falha na API de IA');
    }
  });
});
