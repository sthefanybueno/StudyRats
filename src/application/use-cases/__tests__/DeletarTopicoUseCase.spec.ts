import { DeletarTopicoUseCase } from '../DeletarTopicoUseCase';
import { Disciplina } from '../../../domain/entities/Disciplina';
import { Topico } from '../../../domain/entities/Topico';
import { IDisciplinaRepository } from '../../../domain/repositories/IDisciplinaRepository';

describe('DeletarTopicoUseCase', () => {
  let repository: jest.Mocked<IDisciplinaRepository>;
  let useCase: DeletarTopicoUseCase;

  beforeEach(() => {
    repository = {
      salvar: jest.fn(),
      buscarPorId: jest.fn(),
      listarPorUsuario: jest.fn(),
      deletar: jest.fn(),
    };
    useCase = new DeletarTopicoUseCase(repository);
  });

  it('should soft-delete a topic successfully', async () => {
    const disciplina = Disciplina.create({ usuarioId: 'u1', nome: 'Física', cor: '#FFF' });
    const topico = Topico.create({ id: 't1', disciplinaId: disciplina.id, nome: 'Cinemática' });
    disciplina.adicionarTopico(topico);

    repository.buscarPorId.mockResolvedValue(disciplina);

    const result = await useCase.execute({
      disciplinaId: disciplina.id,
      topicoId: 't1',
    });

    expect(result.isSuccess).toBe(true);
    expect(disciplina.topicos).toHaveLength(0);
    expect(repository.salvar).toHaveBeenCalledWith(disciplina);
  });

  it('should return error if discipline does not exist', async () => {
    repository.buscarPorId.mockResolvedValue(null);

    const result = await useCase.execute({
      disciplinaId: 'invalid-id',
      topicoId: 't1',
    });

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error).toBe('Disciplina não encontrada');
    }
  });
});
