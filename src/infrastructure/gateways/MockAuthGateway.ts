import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { Usuario } from '../../domain/entities/Usuario';

interface ContaMock {
  usuario: Usuario;
  senha: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock do Supabase Auth para o MVP local.
 * Mantém contas em memória; uma conta demo já vem cadastrada.
 */
export class MockAuthGateway implements IAuthGateway {
  private usuarioAtual: Usuario | null = null;
  private contas = new Map<string, ContaMock>([
    [
      'demo@studyrats.app',
      {
        senha: '123456',
        usuario: Usuario.create({
          id: 'mock-demo',
          email: 'demo@studyrats.app',
          nomeExibicao: 'Rato Demo',
        }),
      },
    ],
  ]);

  async obterUsuarioLogado(): Promise<Usuario | null> {
    return this.usuarioAtual;
  }

  async login(email: string, senha: string): Promise<Usuario> {
    await delay(700);
    const conta = this.contas.get(email.toLowerCase());
    if (!conta || conta.senha !== senha) {
      throw new Error('Email ou senha incorretos');
    }
    this.usuarioAtual = conta.usuario;
    return conta.usuario;
  }

  async cadastrar(email: string, senha: string, nomeExibicao: string): Promise<Usuario> {
    await delay(900);
    const chave = email.toLowerCase();
    if (this.contas.has(chave)) {
      throw new Error('Este email já está em uso');
    }
    const usuario = Usuario.create({ id: 'mock-' + Date.now(), email, nomeExibicao });
    this.contas.set(chave, { usuario, senha });
    this.usuarioAtual = usuario;
    return usuario;
  }

  async logout(): Promise<void> {
    this.usuarioAtual = null;
  }
}
