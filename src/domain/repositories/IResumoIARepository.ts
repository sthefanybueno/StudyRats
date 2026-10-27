/** Description: This file (src/domain/repositories/IResumoIARepository.ts) contains the implementation for its respective feature. */
import { ResumoIA } from '../entities/ResumoIA';

export interface IResumoIARepository {
  salvar(resumo: ResumoIA): Promise<void>;
  buscarPorTopico(topicoId: string): Promise<ResumoIA | null>;
}
