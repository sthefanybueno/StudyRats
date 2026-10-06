import { Usuario } from '../entities/Usuario';

export interface ISyncGateway {
  /**
   * Faz o upload de um arquivo binário (como uma foto) e retorna a URL remota hospedada.
   */
  fazerUploadFoto(uriLocal: string, caminhoRemoto: string): Promise<string>;
  
  /**
   * Executa uma chamada genérica para sincronizar dados JSON (usado para processar a SyncQueue local).
   */
  enviarParaNuvem(tabela: string, operacao: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): Promise<void>;

  /**
   * Busca os 50 usuários com maior XP semanal (para uso no ConsultarRankingUseCase).
   */
  obterRanking(): Promise<Usuario[]>;
}
