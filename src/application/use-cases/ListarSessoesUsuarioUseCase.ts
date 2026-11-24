/** Description: Caso de uso de consulta para listar sessões de estudo do usuário logado sem expor o repositório à UI. */
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';

export class ListarSessoesUsuarioUseCase {
  constructor(private readonly sessaoRepository: ISessaoEstudoRepository) {}

  async execute(usuarioId: string): Promise<SessaoEstudo[]> {
    if (!usuarioId || usuarioId.trim() === '') return [];
    return this.sessaoRepository.listarPorUsuario(usuarioId);
  }
}

