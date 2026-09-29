import { ResumoIA } from '../entities/ResumoIA';

export interface IResumoIARepository {
  salvar(resumo: ResumoIA): Promise<void>;
  buscarPorTopico(topicoId: string): Promise<ResumoIA | null>;
}
