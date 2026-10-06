import { CadastrarUsuarioUseCase } from '../CadastrarUsuarioUseCase';
import { IAuthGateway } from '../../../domain/gateways/IAuthGateway';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../../domain/entities/Usuario';

class MockAuthGateway implements IAuthGateway {
  emailsExistentes = ['usado@test.com'];
  async obterUsuarioLogado(): Promise<Usuario | null> { return null; }
  async login(email: string): Promise<Usuario> {
    return Usuario.create({ id: 'u1', email, nomeExibicao: 'Tester' });
  }
  async cadastrar(email: string, _senha: string, nomeExibicao: string): Promise<Usuario> {
    if (this.emailsExistentes.includes(email)) throw new Error('Este email já está em uso');
    return Usuario.create({ id: 'u-new', email, nomeExibicao });
  }
  async logout(): Promise<void> {}
}

class MockUsuarioRepository implements IUsuarioRepository {
  usuarios: Usuario[] = [];
  async salvar(usuario: Usuario): Promise<void> { this.usuarios.push(usuario); }
  async buscarPorId(id: string): Promise<Usuario | null> { return this.usuarios.find(u => u.id === id) || null; }
  async listarTodos(): Promise<Usuario[]> { return this.usuarios; }
}

const setup = () => {
  const repo = new MockUsuarioRepository();
  const useCase = new CadastrarUsuarioUseCase(new MockAuthGateway(), repo);
  return { repo, useCase };
};

describe('CadastrarUsuarioUseCase', () => {
  it('cadastra usuário e salva em cache local', async () => {
    const { repo, useCase } = setup();
    const res = await useCase.execute({ email: 'novo@test.com', senha: '123456', nomeExibicao: 'Clara' });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.nomeExibicao).toBe('Clara');
      expect(res.value.xpTotal).toBe(0);
    }
    expect(repo.usuarios).toHaveLength(1);
  });

  it('rejeita nome vazio', async () => {
    const { useCase } = setup();
    const res = await useCase.execute({ email: 'novo@test.com', senha: '123456', nomeExibicao: '  ' });
    expect(res.isSuccess).toBe(false);
  });

  it('rejeita email inválido', async () => {
    const { useCase } = setup();
    const res = await useCase.execute({ email: 'invalido', senha: '123456', nomeExibicao: 'Clara' });
    expect(res).toEqual({ isSuccess: false, error: 'Formato de email inválido' });
  });

  it('rejeita senha fraca', async () => {
    const { useCase } = setup();
    const res = await useCase.execute({ email: 'novo@test.com', senha: '123', nomeExibicao: 'Clara' });
    expect(res.isSuccess).toBe(false);
  });

  it('propaga erro de email já cadastrado', async () => {
    const { useCase } = setup();
    const res = await useCase.execute({ email: 'usado@test.com', senha: '123456', nomeExibicao: 'Clara' });
    expect(res).toEqual({ isSuccess: false, error: 'Este email já está em uso' });
  });
});
