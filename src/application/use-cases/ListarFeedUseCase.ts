/** Description: This file (src/application/use-cases/ListarFeedUseCase.ts) contains the implementation for its respective feature. */
import { CalculoXpService } from '../../domain/services/CalculoXpService';
import { IFeedGateway, SessaoComunidade } from '../../domain/gateways/IFeedGateway';
import { ItemFeedDTO, PaginaFeedDTO } from '../dto/ItemFeedDTO';

/** Tamanho máximo de cada página do feed. */
export const LIMITE_FEED = 50;

export type ListarFeedResponse =
  | { isSuccess: true; value: PaginaFeedDTO }
  | { isSuccess: false; error: string };

export class ListarFeedUseCase {
  constructor(private feedGateway: IFeedGateway) {}

  async execute(cursor?: string): Promise<ListarFeedResponse> {
    try {
      const pagina = await this.feedGateway.obterFeed(cursor, LIMITE_FEED);

      // Regra de negócio: sem duplicatas, da mais recente para a mais antiga, no máximo 50 por página.
      const unicos = new Map<string, SessaoComunidade>();
      for (const item of pagina.itens) {
        if (!unicos.has(item.sessao.id)) unicos.set(item.sessao.id, item);
      }

      const itens = Array.from(unicos.values())
        .sort((a, b) => b.sessao.createdAt.getTime() - a.sessao.createdAt.getTime())
        .slice(0, LIMITE_FEED)
        .map(ListarFeedUseCase.paraDTO);

      return { isSuccess: true, value: { itens, proximoCursor: pagina.proximoCursor } };
    } catch (error: any) {
      return { isSuccess: false, error: error.message || 'Erro ao carregar o feed' };
    }
  }

  private static paraDTO({ sessao, autor, disciplinaNome, topicoNome }: SessaoComunidade): ItemFeedDTO {
    const foto = sessao.foto;
    const coordenada = sessao.coordenada;

    return {
      id: sessao.id,
      autor: {
        id: autor.id,
        nome: autor.nomeExibicao,
        fotoUrl: autor.fotoUrl,
        nivel: Math.floor(autor.xpTotal / 100) + 1,
      },
      disciplina: disciplinaNome,
      topico: topicoNome,
      duracaoMinutos: sessao.duracaoMinutos,
      xp: CalculoXpService.calcular({
        duracaoMinutos: sessao.duracaoMinutos,
        comFoto: !!foto,
        comGps: !!coordenada,
      }),
      fotoUri: foto ? foto.urlRemota ?? foto.uriLocal : undefined,
      latitude: coordenada?.latitude,
      longitude: coordenada?.longitude,
      createdAt: sessao.createdAt,
    };
  }
}

