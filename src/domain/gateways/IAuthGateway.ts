import { Usuario } from '../entities/Usuario';

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
   * Desloga o usuário e limpa o cache.
   */
  logout(): Promise<void>;
}
