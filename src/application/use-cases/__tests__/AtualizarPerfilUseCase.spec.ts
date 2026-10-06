import { AtualizarPerfilUseCase } from '../AtualizarPerfilUseCase';
import { Usuario } from '../../../domain/entities/Usuario';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

describe('AtualizarPerfilUseCase', () => {
  let repository: jest.Mocked<IUsuarioRepository>;
  let useCase: AtualizarPerfilUseCase;

  beforeEach(() => {
    repository = {
      salvar: jest.fn(),
      buscarPorId: jest.fn(),
      listarTodos: jest.fn(),
    };
    useCase = new AtualizarPerfilUseCase(repository);
  });

  it('should update display name, username and fotoUrl successfully', async () => {
    const usuario = Usuario.create({ id: 'u1', email: 'clara@test.com', nomeExibicao: 'Clara' });
    repository.buscarPorId.mockResolvedValue(usuario);

    const result = await useCase.execute({
      usuarioId: 'u1',
      nomeExibicao: 'Clara Nogueira',
      nomeUsuario: 'clara_n',
      fotoUrl: 'file:///path/avatar.png',
    });

    expect(result.isSuccess).toBe(true);
    expect(usuario.nomeExibicao).toBe('Clara Nogueira');
    expect(usuario.nomeUsuario).toBe('@clara_n');
    expect(usuario.fotoUrl).toBe('file:///path/avatar.png');
    expect(repository.salvar).toHaveBeenCalledWith(usuario);
  });

  it('should return error if user is not found', async () => {
    repository.buscarPorId.mockResolvedValue(null);

    const result = await useCase.execute({
      usuarioId: 'invalid-id',
      nomeExibicao: 'Novo Nome',
    });

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error).toBe('Usuário não encontrado');
    }
  });
});
