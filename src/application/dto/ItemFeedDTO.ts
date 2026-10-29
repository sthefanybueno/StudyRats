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
  createdAt: Date;
}

export interface PaginaFeedDTO {
  itens: ItemFeedDTO[];
  proximoCursor?: string;
}

