import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Coordenada } from '../../domain/value-objects/Coordenada';
import { FotoSessao } from '../../domain/entities/FotoSessao';

const STORAGE_KEY = '@studyrats:sessoes';

export class LocalAsyncStorageSessaoEstudoRepository implements ISessaoEstudoRepository {
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

  async salvar(sessao: SessaoEstudo): Promise<void> {
    const todos = await this.carregarTodos();
    todos[sessao.id] = {
      id: sessao.id,
      usuarioId: sessao.usuarioId,
      disciplinaId: sessao.disciplinaId,
      topicoId: sessao.topicoId,
      duracaoMinutos: sessao.duracaoMinutos,
      createdAt: sessao.createdAt.toISOString(),
      syncStatus: sessao.syncStatus.value,
      coordenada: sessao.coordenada ? { latitude: sessao.coordenada.latitude, longitude: sessao.coordenada.longitude } : null,
      foto: sessao.foto ? {
        id: sessao.foto.id,
        sessaoId: sessao.foto.sessaoId,
        uriLocal: sessao.foto.uriLocal,
        urlRemota: sessao.foto.urlRemota,
        uploadStatus: sessao.foto.uploadStatus,
      } : null,
    };
    await this.salvarTodos(todos);
  }

  async buscarPorId(id: string): Promise<SessaoEstudo | null> {
    const todos = await this.carregarTodos();
    const item = todos[id];
    if (!item) return null;
    return this.mapToEntity(item);
  }

  async listarPorUsuario(usuarioId: string): Promise<SessaoEstudo[]> {
    const todos = await this.carregarTodos();
    const lista: SessaoEstudo[] = [];
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item.usuarioId === usuarioId) {
        lista.push(this.mapToEntity(item));
      }
    }
    return lista.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listarPorDisciplina(disciplinaId: string): Promise<SessaoEstudo[]> {
    const todos = await this.carregarTodos();
    const lista: SessaoEstudo[] = [];
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item.disciplinaId === disciplinaId) {
        lista.push(this.mapToEntity(item));
      }
    }
    return lista.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private mapToEntity(item: any): SessaoEstudo {
    const sessao = SessaoEstudo.create({
      id: item.id,
      usuarioId: item.usuarioId,
      disciplinaId: item.disciplinaId,
      topicoId: item.topicoId,
      duracaoMinutos: item.duracaoMinutos,
      createdAt: new Date(item.createdAt),
      syncStatus: item.syncStatus,
      coordenada: item.coordenada ? Coordenada.create({ latitude: item.coordenada.latitude, longitude: item.coordenada.longitude }) : undefined,
    });

    if (item.foto) {
      const foto = FotoSessao.create({
        id: item.foto.id,
        sessaoId: item.foto.sessaoId,
        uriLocal: item.foto.uriLocal,
        urlRemota: item.foto.urlRemota,
        uploadStatus: item.foto.uploadStatus,
      });
      sessao.anexarFoto(foto);
    }

    return sessao;
  }
}
