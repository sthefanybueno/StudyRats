import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';

export class InMemoryUsuarioRepository implements IUsuarioRepository {
  private usuarios: Map<string, Usuario> = new Map();

  async salvar(usuario: Usuario): Promise<void> {
    this.usuarios.set(usuario.id, usuario);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) || null;
  }

  async listarTodos(): Promise<Usuario[]> {
    return Array.from(this.usuarios.values());
  }
}
