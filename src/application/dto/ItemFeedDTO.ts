/** Description: DTO de leitura do Feed: formato consumido pela apresentação (a UI nunca recebe entidades de domínio cruas). */
export interface ItemFeedDTO {
  id: string;
  autor: {
    id: string;
    nome: string;
    fotoUrl?: string;
    nivel: number;
  };
  disciplina: string;
  topico: string;
  duracaoMinutos: number;
  xp: number;
  fotoUri?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  localAproximado?: string;
  /** Distância em metros até a posição atual do usuário quando o filtro espacial ("Perto de mim") está ativo. */
  distanciaMetros?: number;
  createdAt: Date;
  syncStatus?: string;
}

export interface FiltroFeedDTO {
  /** Quando verdadeiro, filtra sessões dentro de `raioMetros` da posição atual (PostGIS ST_DWithin / Haversine). */
  pertoDeMim?: boolean;
  /** Raio de busca em metros (padrão: 1000m = 1 km - PDF 01, slide 40). */
  raioMetros?: number;
  /** Coordenada central opcional; se omitida quando `pertoDeMim = true`, é obtida via ILocationGateway. */
  latitude?: number;
  longitude?: number;
}

export interface PaginaFeedDTO {
  itens: ItemFeedDTO[];
  proximoCursor?: string;
}

