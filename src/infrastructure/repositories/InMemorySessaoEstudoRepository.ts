/** Description: This file (src/infrastructure/repositories/InMemorySessaoEstudoRepository.ts) contains the implementation for its respective feature. */
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';

export class InMemorySessaoEstudoRepository implements ISessaoEstudoRepository {
  private sessoes: Map<string, SessaoEstudo> = new Map();

  async salvar(sessao: SessaoEstudo): Promise<void> {
    this.sessoes.set(sessao.id, sessao);
  }

  async atualizarFoto(sessaoId: string, urlRemota: string): Promise<void> {
    this.sessoes.get(sessaoId)?.foto?.marcarComoUploadConcluido(urlRemota);
  }

  async marcarComoSincronizada(sessaoId: string): Promise<void> {
    this.sessoes.get(sessaoId)?.atualizarSyncStatus('synced');
  }

  async buscarPorId(id: string): Promise<SessaoEstudo | null> {
    return this.sessoes.get(id) || null;
  }

  async listarPorUsuario(usuarioId: string): Promise<SessaoEstudo[]> {
    return Array.from(this.sessoes.values()).filter(s => s.usuarioId === usuarioId);
  }

  async listarPorDisciplina(disciplinaId: string): Promise<SessaoEstudo[]> {
    return Array.from(this.sessoes.values()).filter(s => s.disciplinaId === disciplinaId);
  }

  async listarTodas(): Promise<SessaoEstudo[]> {
    return Array.from(this.sessoes.values());
  }

  async removerCoordenadasPorUsuario(usuarioId: string): Promise<number> {
    let removidas = 0;
    for (const sessao of this.sessoes.values()) {
      if (sessao.usuarioId === usuarioId && sessao.coordenada) {
        sessao.removerCoordenada();
        removidas++;
      }
    }
    return removidas;
  }

  async expurgarCoordenadasAntigas(dataLimite: Date): Promise<number> {
    let removidas = 0;
    for (const sessao of this.sessoes.values()) {
      if (sessao.coordenada && sessao.createdAt.getTime() < dataLimite.getTime()) {
        sessao.removerCoordenada();
        removidas++;
      }
    }
    return removidas;
  }

  async limparTudo(): Promise<void> {
    this.sessoes.clear();
  }
}
