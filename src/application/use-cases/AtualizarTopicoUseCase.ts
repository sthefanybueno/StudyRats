import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export interface AtualizarTopicoRequest {
  disciplinaId: string;
  topicoId: string;
  novoNome: string;
}

export type AtualizarTopicoResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class AtualizarTopicoUseCase {
  constructor(private disciplinaRepository: IDisciplinaRepository) {}

  async execute(request: AtualizarTopicoRequest): Promise<AtualizarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);

      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      disciplina.atualizarTopico(request.topicoId, request.novoNome);
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
