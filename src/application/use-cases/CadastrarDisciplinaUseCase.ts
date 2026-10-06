import { Disciplina } from '../../domain/entities/Disciplina';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export interface CadastrarDisciplinaRequest {
  usuarioId: string;
  nome: string;
  cor: string;
}

export type CadastrarDisciplinaResponse = 
  | { isSuccess: true; value: Disciplina }
  | { isSuccess: false; error: string };

export class CadastrarDisciplinaUseCase {
  constructor(private disciplinaRepository: IDisciplinaRepository) {}

  async execute(request: CadastrarDisciplinaRequest): Promise<CadastrarDisciplinaResponse> {
    try {
      const disciplina = Disciplina.create({
        usuarioId: request.usuarioId,
        nome: request.nome,
        cor: request.cor,
      });

      await this.disciplinaRepository.salvar(disciplina);

      return {
        isSuccess: true,
        value: disciplina,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
