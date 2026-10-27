/** Description: This file (src/domain/repositories/IUsuarioRepository.ts) contains the implementation for its respective feature. */
import { Usuario } from '../entities/Usuario';

export interface IUsuarioRepository {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  listarTodos(): Promise<Usuario[]>;
}
