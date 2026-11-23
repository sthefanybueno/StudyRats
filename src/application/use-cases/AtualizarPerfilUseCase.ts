/** Description: This file (src/application/use-cases/AtualizarPerfilUseCase.ts) contains the implementation for its respective feature. */
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';

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
  constructor(
    private usuarioRepository: IUsuarioRepository,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

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
        const limpo = request.nomeUsuario.trim();
        if (limpo) {
          const existente = await this.usuarioRepository.buscarPorNomeUsuario(limpo);
          if (existente && existente.id !== usuario.id) {
            throw new Error('Este nome de usuário já está em uso');
          }
        }
        usuario.atualizarNomeUsuario(request.nomeUsuario);
      }
      if (request.fotoUrl !== undefined) {
        usuario.atualizarFotoUrl(request.fotoUrl);
      }

      await this.usuarioRepository.salvar(usuario);

      if (this.syncQueueRepository) {
        await this.syncQueueRepository.enfileirar(
          SyncQueueItem.create({
            entidade: 'perfis',
            operacao: 'UPDATE',
            payloadJson: JSON.stringify({
              id: usuario.id,
              email: usuario.email.getValue,
              nomeExibicao: usuario.nomeExibicao,
              xpTotal: usuario.xpTotal,
              xpSemanal: usuario.xpSemanal,
              streakAtual: usuario.streakAtual,
            }),
          })
        );
      }

      return { isSuccess: true };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}

