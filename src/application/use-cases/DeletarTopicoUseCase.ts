import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export interface DeletarTopicoRequest {
  disciplinaId: string;
  topicoId: string;
}

export type DeletarTopicoResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class DeletarTopicoUseCase {
  constructor(private disciplinaRepository: IDisciplinaRepository) {}

  async execute(request: DeletarTopicoRequest): Promise<DeletarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);

      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      disciplina.removerTopico(request.topicoId);
      await this.disciplinaRepository.salvar(disciplina);

      return { isSuccess: true };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
