import { Usuario } from '../../domain/entities/Usuario';
import { Email } from '../../domain/value-objects/Email';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export const SENHA_MIN_CARACTERES = 6;

export interface CadastrarUsuarioRequest {
  email: string;
  senha: string;
  nomeExibicao: string;
}

export type CadastrarUsuarioResponse =
  | { isSuccess: true; value: Usuario }
  | { isSuccess: false; error: string };

/**
 * UC01 — Fazer Cadastro.
 * Valida dados com as regras do domínio antes de delegar ao AuthGateway
 * e mantém o usuário em cache local (offline-first).
 */
export class CadastrarUsuarioUseCase {
  constructor(
    private authGateway: IAuthGateway,
    private usuarioRepository: IUsuarioRepository
  ) {}

  async execute(request: CadastrarUsuarioRequest): Promise<CadastrarUsuarioResponse> {
    try {
      if (!request.nomeExibicao || request.nomeExibicao.trim() === '') {
        throw new Error('O nome de exibição é obrigatório');
      }
      Email.create(request.email.trim());
      if (!request.senha || request.senha.length < SENHA_MIN_CARACTERES) {
        throw new Error(`A senha deve ter pelo menos ${SENHA_MIN_CARACTERES} caracteres`);
      }

      const usuario = await this.authGateway.cadastrar(
        request.email.trim(),
        request.senha,
        request.nomeExibicao.trim()
      );

      await this.usuarioRepository.salvar(usuario);
      return { isSuccess: true, value: usuario };
    } catch (error: any) {
      return { isSuccess: false, error: error.message };
    }
  }
}
