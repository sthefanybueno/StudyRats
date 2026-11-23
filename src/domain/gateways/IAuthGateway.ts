/** Description: This file (src/domain/gateways/IAuthGateway.ts) contains the implementation for its respective feature. */
import { Usuario } from '../entities/Usuario';

export type EventoMudancaSessao = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | string;

export interface SubscricaoSessaoAuth {
  unsubscribe(): void;
}

export interface IAuthGateway {
  /**
   * Tenta restaurar a sessão do usuário previamente autenticado no dispositivo.
   */
  obterUsuarioLogado(): Promise<Usuario | null>;
  
  /**
   * Realiza login e retorna a entidade de usuário preenchida.
   */
  login(email: string, senha: string): Promise<Usuario>;

  /**
   * Cria uma nova conta (UC01) e retorna o usuário já autenticado.
   */
  cadastrar(email: string, senha: string, nomeExibicao: string): Promise<Usuario>;
  
  /**
   * Desloga o usuário e limpa o cache.
   */
  logout(): Promise<void>;

  /**
   * Escuta mudanças de sessão (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED - PDF 03, slides 14 e 43).
   */
  onAuthStateChange?(callback: (evento: EventoMudancaSessao, usuario: Usuario | null) => void): SubscricaoSessaoAuth;
}
