import { CadastrarTopicoUseCase } from '../CadastrarTopicoUseCase';
import { IDisciplinaRepository } from '../../../domain/repositories/IDisciplinaRepository';
import { Disciplina } from '../../../domain/entities/Disciplina';

class MockDisciplinaRepository implements IDisciplinaRepository {
  public disciplinas: Disciplina[] = [];
  async salvar(disciplina: Disciplina): Promise<void> {
    const index = this.disciplinas.findIndex(d => d.id === disciplina.id);
    if (index >= 0) this.disciplinas[index] = disciplina;
    else this.disciplinas.push(disciplina);
  }
  async buscarPorId(id: string): Promise<Disciplina | null> { return this.disciplinas.find(d => d.id === id) || null; }
  async listarPorUsuario(id: string): Promise<Disciplina[]> { return this.disciplinas; }
  async deletar(id: string): Promise<void> {}
}

describe('CadastrarTopicoUseCase', () => {
  it('should add a topico to an existing disciplina', async () => {
    const repo = new MockDisciplinaRepository();
    const useCase = new CadastrarTopicoUseCase(repo);

    const disciplina = Disciplina.create({ usuarioId: '1', nome: 'Matemática', cor: '#000' });
    await repo.salvar(disciplina);

    const response = await useCase.execute({ disciplinaId: disciplina.id, nome: 'Álgebra' });

    expect(response.isSuccess).toBe(true);
    if (response.isSuccess) {
      expect(response.value.nome).toBe('Álgebra');
      const savedDisc = await repo.buscarPorId(disciplina.id);
      expect(savedDisc?.topicos).toHaveLength(1);
      expect(savedDisc?.topicos[0].nome).toBe('Álgebra');
    }
  });

  it('should fail if disciplina does not exist', async () => {
    const repo = new MockDisciplinaRepository();
    const useCase = new CadastrarTopicoUseCase(repo);

    const response = await useCase.execute({ disciplinaId: 'invalid', nome: 'Álgebra' });

    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) {
      expect(response.error).toBe('Disciplina não encontrada');
    }
  });
});
