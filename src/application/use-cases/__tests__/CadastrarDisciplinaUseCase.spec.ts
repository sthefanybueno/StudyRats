import { CadastrarDisciplinaUseCase } from '../CadastrarDisciplinaUseCase';
import { IDisciplinaRepository } from '../../../domain/repositories/IDisciplinaRepository';
import { Disciplina } from '../../../domain/entities/Disciplina';

class MockDisciplinaRepository implements IDisciplinaRepository {
  public disciplinas: Disciplina[] = [];
  async salvar(disciplina: Disciplina): Promise<void> { this.disciplinas.push(disciplina); }
  async buscarPorId(id: string): Promise<Disciplina | null> { return this.disciplinas.find((d) => d.id === id) || null; }
  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> { return this.disciplinas; }
  async deletar(id: string): Promise<void> { this.disciplinas = this.disciplinas.filter((d) => d.id !== id); }
}

describe('CadastrarDisciplinaUseCase', () => {
  let repository: MockDisciplinaRepository;
  let useCase: CadastrarDisciplinaUseCase;

  beforeEach(() => {
    repository = new MockDisciplinaRepository();
    useCase = new CadastrarDisciplinaUseCase(repository);
  });

  it('should successfully create and save a new Disciplina', async () => {
    const request = {
      usuarioId: 'user-1',
      nome: 'Física Quantica',
      cor: '#FF00FF',
    };

    const response = await useCase.execute(request);

    expect(response.isSuccess).toBe(true);
    if (response.isSuccess) {
      expect(response.value.nome).toBe('Física Quantica');
      expect(repository.disciplinas).toHaveLength(1);
      expect(repository.disciplinas[0].nome).toBe('Física Quantica');
    }
  });

  it('should fail if name is empty', async () => {
    const request = {
      usuarioId: 'user-1',
      nome: '',
      cor: '#FF00FF',
    };

    const response = await useCase.execute(request);

    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) {
      expect(response.error).toBe('O nome da disciplina não pode ser vazio');
    }
    expect(repository.disciplinas).toHaveLength(0);
  });
});
