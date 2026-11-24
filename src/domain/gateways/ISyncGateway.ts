/** Description: This file (src/domain/gateways/ISyncGateway.ts) contains the implementation for its respective feature. */
import { Usuario } from '../entities/Usuario';

export interface ISyncGateway {
  /**
   * Faz o upload de um arquivo binário (como uma foto) e retorna a URL remota hospedada.
   */
  fazerUploadFoto(uriLocal: string, caminhoRemoto: string): Promise<string>;

  /**
   * Faz o upload da foto de avatar do perfil e retorna a URL pública para exibição no Ranking/Feed.
   */
  fazerUploadAvatar?(uriLocal: string, caminhoRemoto: string): Promise<string>;

  /**
   * Gera URL temporária assinada (createSignedUrl) para acesso seguro a arquivo em bucket privado (PDF 03, slide 28).
   */
  criarUrlAssinadaFoto?(caminhoRemoto: string, expiraEmSegundos?: number): Promise<string | null>;
  
  /**
   * Executa uma chamada genérica para sincronizar dados JSON (usado para processar a SyncQueue local).
   */
  enviarParaNuvem(tabela: string, operacao: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): Promise<void>;

  /**
   * Busca os 50 usuários com maior XP semanal (para uso no ConsultarRankingUseCase).
   */
  obterRanking(): Promise<Usuario[]>;

  /**
   * Executa a política de retenção no servidor (PostGIS/Supabase - expurgar_coordenadas_antigas).
   */
  expurgarCoordenadasAntigas?(diasRetencao: number): Promise<number>;

  /**
   * Limpa diretamente no servidor as coordenadas do usuário autenticado e retorna quantas sessões foram afetadas.
   */
  limparCoordenadasRemotas?(): Promise<number>;

  /**
   * Consulta diretamente no servidor as estatísticas reais de sessões (e GPS) e XP do usuário autenticado.
   */
  obterEstatisticasUsuarioRemoto?(): Promise<{
    sessoesCount: number;
    sessoesComGpsCount: number;
    minutosTotais: number;
    sessoesResumo?: Array<{
      id: string;
      duracaoMinutos: number;
      comGps: boolean;
      comFoto: boolean;
    }>;
    xpTotal?: number;
    xpSemanal?: number;
    streakAtual?: number;
  } | null>;
}
