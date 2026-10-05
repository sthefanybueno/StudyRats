import AsyncStorage from '@react-native-async-storage/async-storage';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { Disciplina } from '../../domain/entities/Disciplina';
import { Topico } from '../../domain/entities/Topico';

const STORAGE_KEY = '@studyrats:disciplinas';

export class LocalAsyncStorageDisciplinaRepository implements IDisciplinaRepository {
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

  async salvar(disciplina: Disciplina): Promise<void> {
    const todos = await this.carregarTodos();
    todos[disciplina.id] = {
      id: disciplina.id,
      usuarioId: disciplina.usuarioId,
      nome: disciplina.nome,
      cor: disciplina.cor,
      createdAt: disciplina.createdAt.toISOString(),
      updatedAt: disciplina.updatedAt.toISOString(),
      deletedAt: disciplina.deletedAt ? disciplina.deletedAt.toISOString() : null,
      topicos: disciplina.topicos.map(t => ({
        id: t.id,
        disciplinaId: t.disciplinaId,
        nome: t.nome,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
      })),
    };
    await this.salvarTodos(todos);
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const todos = await this.carregarTodos();
    const item = todos[id];
    if (!item || item.deletedAt) return null;
    const disc = Disciplina.create({
      id: item.id,
      usuarioId: item.usuarioId,
      nome: item.nome,
      cor: item.cor,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    });
    if (item.topicos && Array.isArray(item.topicos)) {
      for (const t of item.topicos) {
        if (!t.deletedAt) {
          disc.adicionarTopico(Topico.create({
            id: t.id,
            disciplinaId: t.disciplinaId,
            nome: t.nome,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          }));
        }
      }
    }
    return disc;
  }

  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> {
    const todos = await this.carregarTodos();
    const lista: Disciplina[] = [];
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item.usuarioId === usuarioId && !item.deletedAt) {
        const disc = Disciplina.create({
          id: item.id,
          usuarioId: item.usuarioId,
          nome: item.nome,
          cor: item.cor,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        });
        if (item.topicos && Array.isArray(item.topicos)) {
          for (const t of item.topicos) {
            if (!t.deletedAt) {
              disc.adicionarTopico(Topico.create({
                id: t.id,
                disciplinaId: t.disciplinaId,
                nome: t.nome,
                createdAt: new Date(t.createdAt),
                updatedAt: new Date(t.updatedAt),
              }));
            }
          }
        }
        lista.push(disc);
      }
    }
    return lista;
  }

  async deletar(id: string): Promise<void> {
    const todos = await this.carregarTodos();
    if (todos[id]) {
      todos[id].deletedAt = new Date().toISOString();
      await this.salvarTodos(todos);
    }
  }
}
