import { IResumoIARepository } from '../../domain/repositories/IResumoIARepository';
import { ResumoIA } from '../../domain/entities/ResumoIA';

export class InMemoryResumoIARepository implements IResumoIARepository {
  private resumos: Map<string, ResumoIA> = new Map();

  async salvar(resumo: ResumoIA): Promise<void> {
    this.resumos.set(resumo.id, resumo);
  }

  async buscarPorTopico(topicoId: string): Promise<ResumoIA | null> {
    return Array.from(this.resumos.values()).find(r => r.topicoId === topicoId) || null;
  }
}
