import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';

export type SincronizarFilaResponse = {
  processados: number;
  falhas: number;
};

export class SincronizarFilaUseCase {
  constructor(
    private syncQueueRepository: ISyncQueueRepository,
    private syncGateway: ISyncGateway
  ) {}

  async execute(): Promise<SincronizarFilaResponse> {
    const itensPendentes = await this.syncQueueRepository.buscarPendentes(10);
    
    let processados = 0;
    let falhas = 0;

    for (const item of itensPendentes) {
      try {
        await this.syncGateway.enviarParaNuvem(
          item.entidade,
          item.operacao,
          JSON.parse(item.payloadJson)
        );

        // Se sucesso, remove da fila local (Outbox)
        await this.syncQueueRepository.remover(item.id);
        processados++;
      } catch (error) {
        // Se falha, incrementa tentativas
        item.registrarFalha(error instanceof Error ? error.message : 'Erro desconhecido');
        await this.syncQueueRepository.registrarFalha(item);
        falhas++;
      }
    }

    return { processados, falhas };
  }
}
