import { ResumoIA } from '../../domain/entities/ResumoIA';
import { IAIGateway } from '../../domain/gateways/IAIGateway';
import { IResumoIARepository } from '../../domain/repositories/IResumoIARepository';

export interface GerarResumoRequest {
  topicoId: string;
  nomeTopico: string;
}

export type GerarResumoResponse = 
  | { isSuccess: true; value: ResumoIA }
  | { isSuccess: false; error: string };

export class GerarResumoUseCase {
  constructor(
    private aiGateway: IAIGateway,
    private resumoRepository: IResumoIARepository
  ) {}

  async execute(request: GerarResumoRequest): Promise<GerarResumoResponse> {
    try {
      // Bate no gateway de IA
      const conteudo = await this.aiGateway.gerarResumoParaTopico(request.nomeTopico);
      
      // Cria a entidade
      const resumo = ResumoIA.create({
        topicoId: request.topicoId,
        conteudo: conteudo
      });

      // Salva no banco local
      await this.resumoRepository.salvar(resumo);

      return {
        isSuccess: true,
        value: resumo
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message
      };
    }
  }
}
