import { Topico } from '../../domain/entities/Topico';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';

export interface CadastrarTopicoRequest {
  disciplinaId: string;
  nome: string;
}

export type CadastrarTopicoResponse = 
  | { isSuccess: true; value: Topico }
  | { isSuccess: false; error: string };

export class CadastrarTopicoUseCase {
  constructor(private disciplinaRepository: IDisciplinaRepository) {}

  async execute(request: CadastrarTopicoRequest): Promise<CadastrarTopicoResponse> {
    try {
      const disciplina = await this.disciplinaRepository.buscarPorId(request.disciplinaId);
      
      if (!disciplina) {
        throw new Error('Disciplina não encontrada');
      }

      const topico = Topico.create({
        disciplinaId: disciplina.id,
        nome: request.nome,
      });

      disciplina.adicionarTopico(topico);

      await this.disciplinaRepository.salvar(disciplina);

      return {
        isSuccess: true,
        value: topico,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
