import { Usuario } from '../entities/Usuario';

export interface IUsuarioRepository {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  listarTodos(): Promise<Usuario[]>;
}
