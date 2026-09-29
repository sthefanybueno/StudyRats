import { IAIGateway } from '../../domain/gateways/IAIGateway';

export class MockAIGateway implements IAIGateway {
  async gerarResumoParaTopico(nomeTopico: string): Promise<string> {
    console.log(`[MockAIGateway] Simulando geração de resumo para o tópico: ${nomeTopico}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `# Resumo: ${nomeTopico}\n\nEste é um resumo gerado offline mockado. Em produção, este texto virá da API OpenAI ou Gemini configurada no backend. \n\nPontos chaves:\n- Aprendizado rápido\n- Foco total\n- Sucesso!`;
  }
}
