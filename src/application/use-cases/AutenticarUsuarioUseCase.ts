import { Usuario } from '../../domain/entities/Usuario';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

export interface AutenticarUsuarioRequest {
  email: string;
  senha?: string;
  isLogin: boolean;
}

export type AutenticarUsuarioResponse = 
  | { isSuccess: true; value: Usuario }
  | { isSuccess: false; error: string };

export class AutenticarUsuarioUseCase {
  constructor(
    private authGateway: IAuthGateway,
    private usuarioRepository: IUsuarioRepository
  ) {}

  async execute(request: AutenticarUsuarioRequest): Promise<AutenticarUsuarioResponse> {
    try {
      let usuario: Usuario | null = null;

      if (!request.isLogin) {
        // Se não for login explícito, tenta restaurar sessão
        usuario = await this.authGateway.obterUsuarioLogado();
      }

      // Se for login explícito ou não achou sessão, faz login
      if (!usuario) {
        usuario = await this.authGateway.login(request.email, request.senha ?? '');
      }

      // Cache local
      await this.usuarioRepository.salvar(usuario);

      return {
        isSuccess: true,
        value: usuario,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
