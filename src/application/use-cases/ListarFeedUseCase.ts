/** Description: This file (src/application/use-cases/ListarFeedUseCase.ts) contains the implementation for its respective feature. */
import { CalculoXpService } from '../../domain/services/CalculoXpService';
import { IFeedGateway, SessaoComunidade } from '../../domain/gateways/IFeedGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IDisciplinaRepository } from '../../domain/repositories/IDisciplinaRepository';
import { ItemFeedDTO, PaginaFeedDTO } from '../dto/ItemFeedDTO';

/** Tamanho máximo de cada página do feed. */
export const LIMITE_FEED = 50;

export type ListarFeedResponse =
  | { isSuccess: true; value: PaginaFeedDTO }
  | { isSuccess: false; error: string };

export class ListarFeedUseCase {
  constructor(
    private sessaoRepository: ISessaoEstudoRepository,
    private usuarioRepository: IUsuarioRepository,
    private disciplinaRepository: IDisciplinaRepository,
    private feedGateway?: IFeedGateway
  ) {}

  async execute(cursor?: string): Promise<ListarFeedResponse> {
    try {
      const mapaItens = new Map<string, SessaoComunidade>();

      // 1. Carrega sessões manuais e reais do banco local
      const sessoesLocais = await this.sessaoRepository.listarTodas();
      const todosUsuarios = await this.usuarioRepository.listarTodos();
      const mapaUsuarios = new Map(todosUsuarios.map(u => [u.id, u]));

      // Cache em memória de disciplinas para associar nomes reais
      const mapaDisciplinas = new Map<string, { nome: string; topicos: Map<string, string> }>();
      for (const s of sessoesLocais) {
        if (!mapaDisciplinas.has(s.disciplinaId)) {
          const disc = await this.disciplinaRepository.buscarPorId(s.disciplinaId);
          if (disc) {
            const topicosMap = new Map(disc.topicos.map(t => [t.id, t.nome]));
            mapaDisciplinas.set(s.disciplinaId, { nome: disc.nome, topicos: topicosMap });
          }
        }
      }

      for (const sessao of sessoesLocais) {
        const autor = mapaUsuarios.get(sessao.usuarioId);
        const infoDisc = mapaDisciplinas.get(sessao.disciplinaId);

        if (autor) {
          mapaItens.set(sessao.id, {
            sessao,
            autor,
            disciplinaNome: infoDisc?.nome || 'Disciplina',
            topicoNome: infoDisc?.topicos.get(sessao.topicoId) || 'Estudo Livre',
          });
        }
      }

      // 2. Se houver gateway externo com sessões remotas reais da nuvem, mescla
      let proximoCursorRemoto: string | undefined = undefined;
      if (this.feedGateway) {
        try {
          const paginaRemota = await this.feedGateway.obterFeed(cursor, LIMITE_FEED);
          proximoCursorRemoto = paginaRemota.proximoCursor;
          for (const item of paginaRemota.itens) {
            if (!mapaItens.has(item.sessao.id)) {
              mapaItens.set(item.sessao.id, item);
            }
          }
        } catch {
          // Se offline ou falhar busca remota, segue apenas com as sessões locais
        }
      }

      // 3. Ordenação cronológica rigorosa: da mais recente para a mais antiga
      const ordenados = Array.from(mapaItens.values())
        .sort((a, b) => b.sessao.createdAt.getTime() - a.sessao.createdAt.getTime());

      // Paginação
      const inicio = cursor ? parseInt(cursor, 10) || 0 : 0;
      const fatiados = ordenados.slice(inicio, inicio + LIMITE_FEED);
      const proximoCursor = (inicio + LIMITE_FEED < ordenados.length)
        ? String(inicio + LIMITE_FEED)
        : proximoCursorRemoto;

      const itens = fatiados.map(ListarFeedUseCase.paraDTO);

      return {
        isSuccess: true,
        value: { itens, proximoCursor },
      };
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
      syncStatus: sessao.syncStatus?.value,
    };
  }
}
