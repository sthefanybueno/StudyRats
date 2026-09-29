import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { Usuario } from '../../domain/entities/Usuario';

/**
 * Mock Auth Gateway que simula login do Google para testarmos o MVP Local.
 */
export class MockAuthGateway implements IAuthGateway {
  private usuarioAtual: Usuario | null = null;

  async obterUsuarioLogado(): Promise<Usuario | null> {
    return this.usuarioAtual;
  }

  async login(email: string, senha?: string): Promise<Usuario> {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    this.usuarioAtual = Usuario.create({
      id: 'mock-google-id-' + Date.now(),
      email: email || 'user@gmail.com',
      nomeExibicao: 'Estudante (Mock Google)',
      xpTotal: 0,
      xpSemanal: 0,
      streakAtual: 0
    });

    return this.usuarioAtual;
  }

  async logout(): Promise<void> {
    this.usuarioAtual = null;
  }
}
