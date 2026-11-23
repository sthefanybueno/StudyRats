/** Description: This file (src/application/use-cases/SincronizarFilaUseCase.ts) contains the implementation for its respective feature. */
import { ISyncQueueRepository } from '../../domain/repositories/ISyncQueueRepository';
import { ISyncGateway } from '../../domain/gateways/ISyncGateway';
import { ISessaoEstudoRepository } from '../../domain/repositories/ISessaoEstudoRepository';

export type SincronizarFilaResponse = {
  processados: number;
  falhas: number;
  coordenadasExpurgadas?: number;
};

/** Prazo máximo de retenção de coordenadas brutas no histórico (90 dias - PDF 01, slides 41 e 44; PDF 02, slide 42). */
export const DIAS_RETENCAO_LOCALIZACAO = 90;

export class SincronizarFilaUseCase {
  constructor(
    private syncQueueRepository: ISyncQueueRepository,
    private syncGateway: ISyncGateway,
    private sessaoRepository?: ISessaoEstudoRepository
  ) {}

  async execute(): Promise<SincronizarFilaResponse> {
    let coordenadasExpurgadas = 0;
    if (this.sessaoRepository?.expurgarCoordenadasAntigas) {
      const dataLimite = new Date(Date.now() - DIAS_RETENCAO_LOCALIZACAO * 24 * 60 * 60 * 1000);
      coordenadasExpurgadas = await this.sessaoRepository.expurgarCoordenadasAntigas(dataLimite);
    }

    if (this.syncGateway.expurgarCoordenadasAntigas) {
      try {
        const expurgadasNuvem = await this.syncGateway.expurgarCoordenadasAntigas(DIAS_RETENCAO_LOCALIZACAO);
        coordenadasExpurgadas = Math.max(coordenadasExpurgadas, expurgadasNuvem);
      } catch {
        // Expurgo remoto é melhor-esforço e não bloqueia a sincronização da fila local
      }
    }

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

        if (item.entidade === 'sessoes_estudo' && item.operacao !== 'DELETE' && payload.id && this.sessaoRepository?.marcarComoSincronizada) {
          await this.sessaoRepository.marcarComoSincronizada(payload.id);
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

    return { processados, falhas, coordenadasExpurgadas };
  }
}
