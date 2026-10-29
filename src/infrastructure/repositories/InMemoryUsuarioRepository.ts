/** Description: This file (src/infrastructure/repositories/InMemoryUsuarioRepository.ts) contains the implementation for its respective feature. */
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

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const alvo = email.trim().toLowerCase();
    for (const u of this.usuarios.values()) {
      if (u.email.getValue.toLowerCase() === alvo) {
        return u;
      }
    }
    return null;
  }

  async buscarPorNomeUsuario(nomeUsuario: string): Promise<Usuario | null> {
    const alvo = nomeUsuario.trim().toLowerCase();
    for (const u of this.usuarios.values()) {
      if (u.nomeUsuario && u.nomeUsuario.trim().toLowerCase() === alvo) {
        return u;
      }
    }
    return null;
  }

  async listarTodos(): Promise<Usuario[]> {
    return Array.from(this.usuarios.values());
  }
}
