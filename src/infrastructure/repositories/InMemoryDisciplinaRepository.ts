import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { Disciplina } from '../../domain/entities/Disciplina';

export class InMemoryDisciplinaRepository implements IDisciplinaRepository {
  private disciplinas: Map<string, Disciplina> = new Map();

  async salvar(disciplina: Disciplina): Promise<void> {
    this.disciplinas.set(disciplina.id, disciplina);
  }

  async buscarPorId(id: string): Promise<Disciplina | null> {
    const disc = this.disciplinas.get(id);
    return disc && !disc.deletedAt ? disc : null;
  }

  async listarPorUsuario(usuarioId: string): Promise<Disciplina[]> {
    return Array.from(this.disciplinas.values()).filter(d => d.usuarioId === usuarioId && !d.deletedAt);
  }

  async deletar(id: string): Promise<void> {
    const disc = this.disciplinas.get(id);
    if (disc) {
      disc.marcarComoDeletada();
      this.disciplinas.set(id, disc);
    }
  }
}
