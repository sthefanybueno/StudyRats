import { SessaoEstudo } from '../entities/SessaoEstudo';

export interface ISessaoEstudoRepository {
  /**
   * Salva a sessão de estudo inteira, incluindo sua entidade fraca (FotoSessao, se houver).
   */
  salvar(sessao: SessaoEstudo): Promise<void>;
  
  /**
   * Retorna a sessão pelo ID.
   */
  buscarPorId(id: string): Promise<SessaoEstudo | null>;
  
  /**
   * Retorna as sessões de um usuário.
   */
  listarPorUsuario(usuarioId: string): Promise<SessaoEstudo[]>;
  
  /**
   * Retorna as sessões de uma disciplina específica.
   */
  listarPorDisciplina(disciplinaId: string): Promise<SessaoEstudo[]>;
}
