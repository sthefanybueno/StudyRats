/** Description: This file (src/application/use-cases/SincronizarFilaUseCase.ts) contains the implementation for its respective feature. */
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';

export type SincronizarFilaResponse = {
  processados: number;
  falhas: number;
};

export class SincronizarFilaUseCase {
  constructor(
    private syncQueueRepository: ISyncQueueRepository,
    private syncGateway: ISyncGateway,
    private sessaoRepository?: ISessaoEstudoRepository
  ) {}

  async execute(): Promise<SincronizarFilaResponse> {
    const itensPendentes = await this.syncQueueRepository.buscarPendentes(10);
    
    let processados = 0;
    let falhas = 0;

    for (const item of itensPendentes) {
      try {
        const payload = JSON.parse(item.payloadJson);

        // Evidência fotográfica: sobe ao Storage antes de gravar a sessão; se falhar, o item volta a ser tentado.
        let caminhoFoto: string | undefined;
        if (item.entidade === 'sessoes_estudo' && item.operacao !== 'DELETE' && payload.fotoLocal) {
          caminhoFoto = await this.syncGateway.fazerUploadFoto(
            payload.fotoLocal,
            `${payload.usuarioId}/${payload.id}.jpg`
          );
        }

        await this.syncGateway.enviarParaNuvem(item.entidade, item.operacao, payload);

        if (caminhoFoto && this.sessaoRepository) {
          await this.sessaoRepository.atualizarFoto(payload.id, caminhoFoto);
        }

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
