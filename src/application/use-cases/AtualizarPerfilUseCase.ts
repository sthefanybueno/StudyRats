import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export interface AtualizarPerfilRequest {
  usuarioId: string;
  nomeExibicao?: string;
  nomeUsuario?: string;
  fotoUrl?: string;
}

export type AtualizarPerfilResponse =
  | { isSuccess: true }
  | { isSuccess: false; error: string };

export class AtualizarPerfilUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(request: AtualizarPerfilRequest): Promise<AtualizarPerfilResponse> {
    try {
      const usuario = await this.usuarioRepository.buscarPorId(request.usuarioId);

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

      if (request.nomeExibicao !== undefined) {
        usuario.atualizarNomeExibicao(request.nomeExibicao);
      }
      if (request.nomeUsuario !== undefined) {
        usuario.atualizarNomeUsuario(request.nomeUsuario);
      }
      if (request.fotoUrl !== undefined) {
        usuario.atualizarFotoUrl(request.fotoUrl);
      }

      await this.usuarioRepository.salvar(usuario);

      return { isSuccess: true };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}

