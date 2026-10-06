import { Usuario } from '../../domain/entities/Usuario';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { ISessionStorage } from '../../domain/gateways/ISessionStorage';
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
    private usuarioRepository: IUsuarioRepository,
    private sessionStorage?: ISessionStorage
  ) {}

  async execute(request: AutenticarUsuarioRequest): Promise<AutenticarUsuarioResponse> {
    try {
      let usuario: Usuario | null = null;

      if (!request.isLogin) {
        // 1. Tenta restaurar token da sessão segura
        const sessionToken = await this.sessionStorage?.obterSessionToken();
        if (sessionToken) {
          usuario = await this.usuarioRepository.buscarPorId(sessionToken);
        }

        // 2. Se não encontrou no repo, tenta no gateway
        if (!usuario) {
          usuario = await this.authGateway.obterUsuarioLogado();
        }
      }

      // 3. Se for login explícito (ou tentou restaurar sem token salvo), faz login no gateway
      if (!usuario && request.isLogin) {
        usuario = await this.authGateway.login(request.email, request.senha ?? '');
      }

      if (!usuario) {
        return { isSuccess: false, error: 'Sessão não encontrada' };
      }

      // Salva token criptografado na sessão segura e cache no repositório
      await this.sessionStorage?.salvarSessionToken(usuario.id);
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
