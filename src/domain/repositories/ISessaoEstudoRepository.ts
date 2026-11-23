/** Description: This file (src/domain/repositories/ISessaoEstudoRepository.ts) contains the implementation for its respective feature. */
import { SessaoEstudo } from '../entities/SessaoEstudo';

export interface ISessaoEstudoRepository {
  /**
   * Salva a sessão de estudo inteira, incluindo sua entidade fraca (FotoSessao, se houver).
   */
  salvar(sessao: SessaoEstudo): Promise<void>;
  
  /**
   * Registra o upload concluído da foto da sessão (url_remota + upload_status = completed).
   */
  atualizarFoto(sessaoId: string, urlRemota: string): Promise<void>;

  /**
   * Marca a sessão como sincronizada ('synced') após envio bem-sucedido da fila Outbox ao Supabase.
   */
  marcarComoSincronizada?(sessaoId: string): Promise<void>;

  /**
   * Retorna a sessão pelo ID.
   */
  buscarPorId(id: string): Promise<SessaoEstudo | null>;
  
  /**
   * Retorna as sessões de um usuário.
   */
  listarPorUsuario(usuarioId: string): Promise<SessaoEstudo[]>;
  
  /**
   * Retorna as sessões de uma disciplina específica.
   */
  listarPorDisciplina(disciplinaId: string): Promise<SessaoEstudo[]>;

  /**
   * Retorna todas as sessões registradas no repositório.
   */
  listarTodas(): Promise<SessaoEstudo[]>;

  /**
   * Remove (define como null) as coordenadas e dados de localização de todas as sessões do usuário (LGPD).
   * Retorna a quantidade de sessões que tinham localização e foram limpas.
   */
  removerCoordenadasPorUsuario?(usuarioId: string): Promise<number>;

  /**
   * Política de retenção LGPD (PDF 01, slides 41 e 44; PDF 02, slide 42):
   * Remove coordenadas de sessões anteriores a `dataLimite`, preservando a sessão, duração e XP.
   */
  expurgarCoordenadasAntigas?(dataLimite: Date): Promise<number>;

  /**
   * Apaga todas as sessões locais (usado no reset completo de dados locais do aparelho).
   */
  limparTudo?(): Promise<void>;
}
