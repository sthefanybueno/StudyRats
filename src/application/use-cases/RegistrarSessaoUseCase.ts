/** Description: This file (src/application/use-cases/RegistrarSessaoUseCase.ts) contains the implementation for its respective feature. */
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';
import { ILocationGateway } from '../../domain/gateways/ILocationGateway';
import { Coordenada } from '../../domain/value-objects/Coordenada';

export interface RegistrarSessaoRequest {
  usuarioId: string;
  disciplinaId: string;
  topicoId: string;
  duracaoMinutos: number;
  comFoto: boolean;
  /** Foto já capturada pela UI. Quando informada, a câmera NÃO é aberta novamente. */
  fotoUri?: string | null;
  /** Quando verdadeiro, anexa a localização atual do dispositivo à sessão. */
  anexarGps?: boolean;
}

export type RegistrarSessaoResponse = 
  | { isSuccess: true; value: SessaoEstudo }
  | { isSuccess: false; error: string };

export class RegistrarSessaoUseCase {
  constructor(
    private sessaoRepository: ISessaoEstudoRepository,
    private usuarioRepository: IUsuarioRepository,
    private cameraGateway: ICameraGateway,
    private locationGateway: ILocationGateway
  ) {}

  async execute(request: RegistrarSessaoRequest): Promise<RegistrarSessaoResponse> {
    try {
      // 1. Validar usuário existe
      const usuario = await this.usuarioRepository.buscarPorId(request.usuarioId);
      if (!usuario) {
        return { isSuccess: false, error: 'Usuário não encontrado' };
      }

      // 2. Obter localização se solicitado (evidência opcional: se falhar, a sessão ainda é registrada)
      const coordenada = request.anexarGps ? await this.obterCoordenada() : undefined;

      // 3. Criar a sessão
      const sessao = SessaoEstudo.create({
        usuarioId: request.usuarioId,
        disciplinaId: request.disciplinaId,
        topicoId: request.topicoId,
        duracaoMinutos: request.duracaoMinutos,
        coordenada,
      });

      // 4. Anexar foto: reaproveita a já capturada; só abre a câmera se nenhuma foi informada
      if (request.comFoto) {
        const uriLocal = request.fotoUri ?? (await this.cameraGateway.capturarFoto());
        if (uriLocal) {
          const foto = FotoSessao.create({
            sessaoId: sessao.id,
            uriLocal: uriLocal,
          });
          sessao.anexarFoto(foto);
        }
      }

      // 5. Adicionar recompensa (XP) ao usuário
      // Exemplo: 1 XP por minuto estudado
      const xpGanho = request.duracaoMinutos;
      usuario.adicionarXP(xpGanho);

      // 6. Salvar agregados
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

  /**
   * A localização é uma evidência opcional: permissão negada, GPS desligado ou leitura inválida
   * não devem impedir o registro da sessão de estudo.
   */
  private async obterCoordenada(): Promise<Coordenada | undefined> {
    try {
      const { latitude, longitude } = await this.locationGateway.obterLocalizacaoAtual();
      return Coordenada.create({ latitude, longitude });
    } catch {
      return undefined;
    }
  }
}
