import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { Usuario } from '../../domain/entities/Usuario';

export class MockSyncGateway implements ISyncGateway {
  async fazerUploadFoto(uriLocal: string, caminhoRemoto: string): Promise<string> {
    console.log(`[MockSyncGateway] Simulando upload de ${uriLocal} para ${caminhoRemoto}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return `https://mock.supabase.co/storage/${caminhoRemoto}`;
  }

  async enviarParaNuvem(tabela: string, operacao: 'INSERT' | 'UPDATE' | 'DELETE', payload: any): Promise<void> {
    console.log(`[MockSyncGateway] Simulando envio (Outbox) - Tabela: ${tabela} | OP: ${operacao}`);
    console.log(`Payload:`, payload);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async obterRanking(): Promise<Usuario[]> {
    console.log(`[MockSyncGateway] Simulando obtenção do ranking global`);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Retorna alguns usuários mockados para a UI
    return [
      Usuario.create({ id: 'u1', email: 'alice@test.com', nomeExibicao: 'Alice', xpSemanal: 450, xpTotal: 1200 }),
      Usuario.create({ id: 'u2', email: 'bob@test.com', nomeExibicao: 'Bob', xpSemanal: 300, xpTotal: 900 }),
      Usuario.create({ id: 'u3', email: 'charlie@test.com', nomeExibicao: 'Charlie', xpSemanal: 150, xpTotal: 400 }),
    ];
  }
}
