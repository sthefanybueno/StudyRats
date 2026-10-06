import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';

export class InMemorySessaoEstudoRepository implements ISessaoEstudoRepository {
  private sessoes: Map<string, SessaoEstudo> = new Map();

  async salvar(sessao: SessaoEstudo): Promise<void> {
    this.sessoes.set(sessao.id, sessao);
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
}
