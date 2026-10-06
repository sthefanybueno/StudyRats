import { Disciplina } from '../entities/Disciplina';

export interface IDisciplinaRepository {
  /**
   * Salva uma disciplina inteira, incluindo suas entidades fracas (Tópicos).
   */
  salvar(disciplina: Disciplina): Promise<void>;
  
  /**
   * Retorna a disciplina e todos os seus tópicos.
   */
  buscarPorId(id: string): Promise<Disciplina | null>;
  
  /**
   * Lista todas as disciplinas de um usuário.
   */
  listarPorUsuario(usuarioId: string): Promise<Disciplina[]>;
  
  /**
   * Deleta a disciplina. O banco de dados (Infra) será responsável por fazer o CASCADE nos tópicos.
   */
  deletar(id: string): Promise<void>;
}
