/** Description: Caso de uso de consulta para listar disciplinas e buscar uma disciplina por ID sem expor o repositório à UI. */
import { Disciplina } from '../../domain/entities/Disciplina';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export class ListarDisciplinasUseCase {
  constructor(private readonly disciplinaRepository: IDisciplinaRepository) {}

  async execute(usuarioId: string): Promise<Disciplina[]> {
    if (!usuarioId || usuarioId.trim() === '') return [];
    return this.disciplinaRepository.listarPorUsuario(usuarioId);
  }

  async buscarPorId(disciplinaId: string): Promise<Disciplina | null> {
    if (!disciplinaId || disciplinaId.trim() === '') return null;
    return this.disciplinaRepository.buscarPorId(disciplinaId);
  }
}

