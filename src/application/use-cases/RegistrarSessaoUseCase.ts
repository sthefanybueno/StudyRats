import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Usuario } from '../../domain/entities/Usuario';
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';

export interface RegistrarSessaoRequest {
  usuarioId: string;
  disciplinaId: string;
  topicoId: string;
  duracaoMinutos: number;
  comFoto: boolean;
}

export type RegistrarSessaoResponse = 
  | { isSuccess: true; value: SessaoEstudo }
  | { isSuccess: false; error: string };

export class RegistrarSessaoUseCase {
  constructor(
    private sessaoRepository: ISessaoEstudoRepository,
    private usuarioRepository: IUsuarioRepository,
    private cameraGateway: ICameraGateway
  ) {}

  async execute(request: RegistrarSessaoRequest): Promise<RegistrarSessaoResponse> {
    try {
      // 1. Validar usuário existe
      const usuario = await this.usuarioRepository.buscarPorId(request.usuarioId);
      if (!usuario) {
        return { isSuccess: false, error: 'Usuário não encontrado' };
      }

      // 2. Criar a sessão
      const sessao = SessaoEstudo.create({
        usuarioId: request.usuarioId,
        disciplinaId: request.disciplinaId,
        topicoId: request.topicoId,
        duracaoMinutos: request.duracaoMinutos,
      });

      // 3. Tirar foto se solicitado
      if (request.comFoto) {
        const uriLocal = await this.cameraGateway.capturarFoto();
        if (uriLocal) {
          const foto = FotoSessao.create({
            sessaoId: sessao.id,
            uriLocal: uriLocal,
          });
          sessao.anexarFoto(foto);
        }
      }

      // 4. Adicionar recompensa (XP) ao usuário
      // Exemplo: 1 XP por minuto estudado
      const xpGanho = request.duracaoMinutos;
      usuario.adicionarXP(xpGanho);

      // 5. Salvar agregados
      await this.sessaoRepository.salvar(sessao);
      await this.usuarioRepository.salvar(usuario);

      return {
        isSuccess: true,
        value: sessao,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }
}
