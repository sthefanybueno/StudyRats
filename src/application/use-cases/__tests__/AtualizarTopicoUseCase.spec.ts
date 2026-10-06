import { AtualizarTopicoUseCase } from '../AtualizarTopicoUseCase';
import { Disciplina } from '../../../domain/entities/Disciplina';
import { Topico } from '../../../domain/entities/Topico';
import { IDisciplinaRepository } from '../../../domain/repositories/IDisciplinaRepository';

describe('AtualizarTopicoUseCase', () => {
  let repository: jest.Mocked<IDisciplinaRepository>;
  let useCase: AtualizarTopicoUseCase;

  beforeEach(() => {
    repository = {
      salvar: jest.fn(),
      buscarPorId: jest.fn(),
      listarPorUsuario: jest.fn(),
      deletar: jest.fn(),
    };
    useCase = new AtualizarTopicoUseCase(repository);
  });

  it('should update topic name successfully', async () => {
    const disciplina = Disciplina.create({ usuarioId: 'u1', nome: 'Matemática', cor: '#FFF' });
    const topico = Topico.create({ id: 't1', disciplinaId: disciplina.id, nome: 'Vetores' });
    disciplina.adicionarTopico(topico);

    repository.buscarPorId.mockResolvedValue(disciplina);

    const result = await useCase.execute({
      disciplinaId: disciplina.id,
      topicoId: 't1',
      novoNome: 'Geometria Analítica',
    });

    expect(result.isSuccess).toBe(true);
    expect(disciplina.topicos[0].nome).toBe('Geometria Analítica');
    expect(repository.salvar).toHaveBeenCalledWith(disciplina);
  });

  it('should return error if discipline does not exist', async () => {
    repository.buscarPorId.mockResolvedValue(null);

    const result = await useCase.execute({
      disciplinaId: 'invalid-id',
      topicoId: 't1',
      novoNome: 'Novo Nome',
    });

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error).toBe('Disciplina não encontrada');
    }
  });
});
