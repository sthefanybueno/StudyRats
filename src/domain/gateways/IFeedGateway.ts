/** Description: Porta (contrato) do domínio para obter o feed de sessões da comunidade. */
import { SessaoEstudo } from '../entities/SessaoEstudo';
import { Usuario } from '../entities/Usuario';

/** Sessão de estudo publicada por um membro da comunidade, com o contexto necessário para exibição. */
export interface SessaoComunidade {
  sessao: SessaoEstudo;
  autor: Usuario;
  disciplinaNome: string;
  topicoNome: string;
}

export interface PaginaFeed {
  itens: SessaoComunidade[];
  /** Cursor opaco para pedir a próxima página. Ausente quando não há mais itens. */
  proximoCursor?: string;
}

export interface IFeedGateway {
  /**
   * Retorna uma página de sessões da comunidade, da mais recente para a mais antiga.
   * @param cursor cursor devolvido pela página anterior (omitido na primeira página).
   * @param limite quantidade máxima de itens da página.
   */
  obterFeed(cursor?: string, limite?: number): Promise<PaginaFeed>;
}

