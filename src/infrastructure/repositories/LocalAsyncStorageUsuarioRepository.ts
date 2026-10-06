import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';

const STORAGE_KEY = '@studyrats:usuarios';

export class LocalAsyncStorageUsuarioRepository implements IUsuarioRepository {
  private async carregarTodos(): Promise<Record<string, any>> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private async salvarTodos(map: Record<string, any>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  async salvar(usuario: Usuario): Promise<void> {
    const todos = await this.carregarTodos();
    todos[usuario.id] = {
      id: usuario.id,
      email: usuario.email.getValue,
      nomeExibicao: usuario.nomeExibicao,
      nomeUsuario: usuario.nomeUsuario,
      fotoUrl: usuario.fotoUrl,
      xpTotal: usuario.xpTotal,
      xpSemanal: usuario.xpSemanal,
      streakAtual: usuario.streakAtual,
    };
    await this.salvarTodos(todos);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const todos = await this.carregarTodos();
    const item = todos[id];
    if (!item) return null;
    return Usuario.create({
      id: item.id,
      email: item.email,
      nomeExibicao: item.nomeExibicao,
      nomeUsuario: item.nomeUsuario,
      fotoUrl: item.fotoUrl,
      xpTotal: item.xpTotal,
      xpSemanal: item.xpSemanal,
      streakAtual: item.streakAtual,
    });
  }

  async listarTodos(): Promise<Usuario[]> {
    const todos = await this.carregarTodos();
    const lista: Usuario[] = [];
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item && item.id) {
        lista.push(
          Usuario.create({
            id: item.id,
            email: item.email,
            nomeExibicao: item.nomeExibicao,
            nomeUsuario: item.nomeUsuario,
            fotoUrl: item.fotoUrl,
            xpTotal: item.xpTotal || 0,
            xpSemanal: item.xpSemanal || 0,
            streakAtual: item.streakAtual || 0,
          })
        );
      }
    }
    return lista;
  }
}

