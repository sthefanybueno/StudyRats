import { AutenticarUsuarioUseCase } from './AutenticarUsuarioUseCase';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';
import { Email } from '../../domain/value-objects/Email';

class MockAuthGateway implements IAuthGateway {
  async obterUsuarioLogado(): Promise<Usuario | null> { return null; }
  async login(email: string, senha?: string): Promise<Usuario> {
    if (senha && senha !== '123') throw new Error('Credenciais inválidas');
    return Usuario.create({ id: 'user-auth-1', email, nomeExibicao: 'Tester' });
  }
  async logout(): Promise<void> {}
}

class MockUsuarioRepository implements IUsuarioRepository {
  usuarios: Usuario[] = [];
  async salvar(usuario: Usuario): Promise<void> { this.usuarios.push(usuario); }
  async buscarPorId(id: string): Promise<Usuario | null> { return this.usuarios.find(u => u.id === id) || null; }
}

describe('AutenticarUsuarioUseCase', () => {
  it('should authenticate user and save to cache', async () => {
    const gateway = new MockAuthGateway();
    const repo = new MockUsuarioRepository();
    const useCase = new AutenticarUsuarioUseCase(gateway, repo);

    const response = await useCase.execute({ email: 'test@test.com', senha: '123', isLogin: true });

    expect(response.isSuccess).toBe(true);
    if (response.isSuccess) {
      expect(response.value.email.getValue).toBe('test@test.com');
      expect(repo.usuarios).toHaveLength(1);
    }
  });

  it('should fail with invalid credentials', async () => {
    const gateway = new MockAuthGateway();
    const repo = new MockUsuarioRepository();
    const useCase = new AutenticarUsuarioUseCase(gateway, repo);

    const response = await useCase.execute({ email: 'test@test.com', senha: 'wrong', isLogin: true });

    expect(response.isSuccess).toBe(false);
    if (!response.isSuccess) {
      expect(response.error).toBe('Credenciais inválidas');
    }
  });
});
