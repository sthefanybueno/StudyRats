/** Description: This file (src/application/use-cases/CadastrarUsuarioUseCase.ts) contains the implementation for its respective feature. */
import { Usuario } from '../../domain/entities/Usuario';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { Email } from '../../domain/value-objects/Email';
import { IAuthGateway } from '../../domain/gateways/IAuthGateway';
import { ISessionStorage } from '../../domain/gateways/ISessionStorage';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

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
    private usuarioRepository: IUsuarioRepository,
    private sessionStorage?: ISessionStorage,
    private syncQueueRepository?: ISyncQueueRepository
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

      // A unicidade do e-mail é garantida pelo Supabase Auth (fonte da verdade). O cache local não
      // pode bloquear o cadastro, pois pode conter contas já excluídas na nuvem.
      const usuario = await this.authGateway.cadastrar(
        request.email.trim(),
        request.senha,
        request.nomeExibicao.trim()
      );

      await this.sessionStorage?.salvarSessionToken(usuario.id);
      await this.usuarioRepository.salvar(usuario);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'perfis',
            operacao: 'INSERT',
            payloadJson: JSON.stringify({
              id: usuario.id,
              email: usuario.email.getValue,
              nomeExibicao: usuario.nomeExibicao,
              metaDiariaMinutos: usuario.metaDiariaMinutos,
              xpTotal: usuario.xpTotal,
              xpSemanal: usuario.xpSemanal,
              streakAtual: usuario.streakAtual,
            }),
          })
        );
      }

      return { isSuccess: true, value: usuario };
    } catch (error: any) {
      return { isSuccess: false, error: error.message };
    }
  }
}
