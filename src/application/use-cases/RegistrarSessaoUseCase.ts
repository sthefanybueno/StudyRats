/** Description: This file (src/application/use-cases/RegistrarSessaoUseCase.ts) contains the implementation for its respective feature. */
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';
import { ILocationGateway } from '../../domain/gateways/ILocationGateway';
import { CalculoXpService } from '../../domain/services/CalculoXpService';
import { CalculoStreakService } from '../../domain/services/CalculoStreakService';
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
  /** Endereço/local opcional para Forward Geocoding (geocodeAsync) quando GPS não for usado ou falhar. */
  enderecoManual?: string | null;
}

export type RegistrarSessaoResponse = 
  | { isSuccess: true; value: SessaoEstudo; avisoGps?: string }
  | { isSuccess: false; error: string };

export class RegistrarSessaoUseCase {
  constructor(
    private sessaoRepository: ISessaoEstudoRepository,
    private usuarioRepository: IUsuarioRepository,
    private cameraGateway: ICameraGateway,
    private locationGateway: ILocationGateway,
    private syncQueueRepository?: ISyncQueueRepository
  ) {}

  async execute(request: RegistrarSessaoRequest): Promise<RegistrarSessaoResponse> {
    try {
      // 1. Validar usuário existe
      const usuario = await this.usuarioRepository.buscarPorId(request.usuarioId);
      if (!usuario) {
        return { isSuccess: false, error: 'Usuário não encontrado' };
      }

      // 2. Obter localização via GPS ou Forward Geocoding (endereço manual) se solicitado
      let coordenada: Coordenada | undefined;
      let avisoGps: string | undefined;
      const enderecoLimpo = request.enderecoManual?.trim() || undefined;

      if (request.anexarGps) {
        const resultadoGps = await this.obterCoordenada();
        coordenada = resultadoGps.coordenada;
        avisoGps = resultadoGps.avisoGps;
      }

      if (!coordenada && enderecoLimpo) {
        const coordEndereco = await this.obterCoordenadaPorEndereco(enderecoLimpo);
        if (coordEndereco) {
          coordenada = coordEndereco;
          avisoGps = undefined;
        }
      }

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

      // 5. Adicionar recompensa (XP) e recalcular dias seguidos (Streak real)
      const xpGanho = CalculoXpService.calcular({
        duracaoMinutos: request.duracaoMinutos,
        comFoto: !!sessao.foto,
        comGps: !!sessao.coordenada,
      });
      usuario.adicionarXP(xpGanho);

      const sessoesAnteriores = await this.sessaoRepository.listarPorUsuario(request.usuarioId);
      const datasComAtual = [...sessoesAnteriores.map((s) => s.createdAt), sessao.createdAt];
      const streakCalculado = CalculoStreakService.calcular(datasComAtual, sessao.createdAt);
      usuario.atualizarStreak(Math.max(1, streakCalculado));

      // 6 e 7. Salvar agregados e enfileirar na mesma transação SQLite atômica (Outbox Pattern)
      const executarEmTransacao = this.syncQueueRepository?.executarEmTransacao
        ? <T>(fn: () => Promise<T>) => this.syncQueueRepository!.executarEmTransacao!(fn)
        : async <T>(fn: () => Promise<T>) => fn();

      await executarEmTransacao(async () => {
        await this.sessaoRepository.salvar(sessao);

        if (this.syncQueueRepository) {
          await this.syncQueueRepository.enfileirar(
            SyncQueueItem.create({
              entidade: 'sessoes_estudo',
              operacao: 'INSERT',
              payloadJson: JSON.stringify({
                id: sessao.id,
                usuarioId: sessao.usuarioId,
                disciplinaId: sessao.disciplinaId,
                topicoId: sessao.topicoId,
                duracaoMinutos: sessao.duracaoMinutos,
                createdAt: sessao.createdAt.toISOString(),
                latitude: sessao.coordenada?.latitude ?? null,
                longitude: sessao.coordenada?.longitude ?? null,
                accuracy: sessao.coordenada?.accuracy ?? null,
                localAproximado: sessao.coordenada?.localAproximado ?? null,
                fotoLocal: sessao.foto?.uriLocal ?? null,
              }),
            })
          );

          // 8. Espelhar XP/streak no perfil remoto (alimenta o ranking global)
          await this.syncQueueRepository.enfileirar(
            SyncQueueItem.create({
              entidade: 'perfis',
              operacao: 'UPDATE',
              payloadJson: JSON.stringify({
                id: usuario.id,
                xpTotal: usuario.xpTotal,
                xpSemanal: usuario.xpSemanal,
                streakAtual: usuario.streakAtual,
              }),
            })
          );
        }
      });

      await this.usuarioRepository.salvar(usuario);

      return {
        isSuccess: true,
        value: sessao,
        avisoGps,
      };
    } catch (error: any) {
      return {
        isSuccess: false,
        error: error.message,
      };
    }
  }

  /**
   * A localização é uma evidência opcional: permissão negada, GPS desligado, mock location ou accuracy ruim
   * não devem impedir o registro da sessão de estudo, mas retornam aviso claro ao usuário (RNF02 / FA1).
   */
  private async obterCoordenada(): Promise<{ coordenada?: Coordenada; avisoGps?: string }> {
    try {
      const { latitude, longitude, accuracy, localAproximado } = await this.locationGateway.obterLocalizacaoAtual();
      return {
        coordenada: Coordenada.create({ latitude, longitude, accuracy, localAproximado }),
      };
    } catch (err: any) {
      return {
        coordenada: undefined,
        avisoGps:
          err?.message ||
          'Sessão salva sem localização. Ative o GPS nas configurações para registrar onde você estuda.',
      };
    }
  }

  private async obterCoordenadaPorEndereco(endereco: string): Promise<Coordenada | undefined> {
    if (!this.locationGateway.obterCoordenadasPorEndereco) {
      return undefined;
    }
    try {
      const resultado = await this.locationGateway.obterCoordenadasPorEndereco(endereco);
      if (!resultado) return undefined;
      return Coordenada.create({
        latitude: resultado.latitude,
        longitude: resultado.longitude,
        accuracy: resultado.accuracy,
        localAproximado: resultado.localAproximado ?? endereco,
      });
    } catch {
      return undefined;
    }
  }
}
