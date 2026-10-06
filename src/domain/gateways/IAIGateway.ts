export interface IAIGateway {
  /**
   * Envia o nome ou contexto de um tópico para a API de Inteligência Artificial e retorna um resumo estruturado.
   */
  gerarResumoParaTopico(nomeTopico: string): Promise<string>;
}
