/** Description: This file (src/infrastructure/repositories/SecureStoreSessaoEstudoRepository.ts) contains the implementation for its respective feature. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Coordenada } from '../../domain/value-objects/Coordenada';
import { FotoSessao } from '../../domain/entities/FotoSessao';

const STORAGE_KEY = 'studyrats.sessoes';

export class SecureStoreSessaoEstudoRepository implements ISessaoEstudoRepository {
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
      coordenada: sessao.coordenada
        ? {
            latitude: sessao.coordenada.latitude,
            longitude: sessao.coordenada.longitude,
            accuracy: sessao.coordenada.accuracy,
            localAproximado: sessao.coordenada.localAproximado,
          }
        : null,
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

  async atualizarFoto(sessaoId: string, urlRemota: string): Promise<void> {
    const todos = await this.carregarTodos();
    if (todos[sessaoId]?.foto) {
      todos[sessaoId].foto.urlRemota = urlRemota;
      todos[sessaoId].foto.uploadStatus = 'completed';
      await this.salvarTodos(todos);
    }
  }

  async marcarComoSincronizada(sessaoId: string): Promise<void> {
    const todos = await this.carregarTodos();
    if (todos[sessaoId]) {
      todos[sessaoId].syncStatus = 'synced';
      await this.salvarTodos(todos);
    }
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


  async listarTodas(): Promise<SessaoEstudo[]> {
    const todos = await this.carregarTodos();
    const lista: SessaoEstudo[] = [];
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item) {
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
      coordenada: item.coordenada
        ? Coordenada.create({
            latitude: item.coordenada.latitude,
            longitude: item.coordenada.longitude,
            accuracy: item.coordenada.accuracy,
            localAproximado: item.coordenada.localAproximado,
          })
        : undefined,
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

  async removerCoordenadasPorUsuario(usuarioId: string): Promise<number> {
    const todos = await this.carregarTodos();
    let removidas = 0;
    for (const key of Object.keys(todos)) {
      if (todos[key]?.usuarioId === usuarioId && todos[key]?.coordenada) {
        todos[key].coordenada = null;
        removidas++;
      }
    }
    if (removidas > 0) {
      await this.salvarTodos(todos);
    }
    return removidas;
  }

  async expurgarCoordenadasAntigas(dataLimite: Date): Promise<number> {
    const todos = await this.carregarTodos();
    let removidas = 0;
    for (const key of Object.keys(todos)) {
      const item = todos[key];
      if (item?.coordenada && new Date(item.createdAt).getTime() < dataLimite.getTime()) {
        item.coordenada = null;
        removidas++;
      }
    }
    if (removidas > 0) {
      await this.salvarTodos(todos);
    }
    return removidas;
  }

  async limparTudo(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
