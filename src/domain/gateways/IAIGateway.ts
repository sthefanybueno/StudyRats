/** Description: This file (src/domain/gateways/IAIGateway.ts) contains the implementation for its respective feature. */
export interface IAIGateway {
  /**
   * Envia o nome ou contexto de um tópico para a API de Inteligência Artificial e retorna um resumo estruturado.
   */
  gerarResumoParaTopico(nomeTopico: string): Promise<string>;
}
