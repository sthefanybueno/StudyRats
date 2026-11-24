/** Description: Caso de uso que isola o ILocationGateway da camada de UI (diagnóstico e monitoramento em foreground). */
import {
  Coordenadas,
  DiagnosticoLocalizacao,
  ILocationGateway,
  OpcoesMonitoramentoLocalizacao,
  SubscricaoLocalizacao,
} from '../../domain/gateways/ILocationGateway';

export class DiagnosticarLocalizacaoUseCase {
  constructor(private readonly locationGateway: ILocationGateway) {}

  async diagnosticarPermissao(): Promise<DiagnosticoLocalizacao | null> {
    if (!this.locationGateway.diagnosticarPermissao) {
      return null;
    }
    return this.locationGateway.diagnosticarPermissao();
  }

  async obterLocalizacaoAtual(): Promise<Coordenadas> {
    return this.locationGateway.obterLocalizacaoAtual();
  }

  async monitorarPosicao(
    callback: (coords: Coordenadas) => void,
    opcoes?: OpcoesMonitoramentoLocalizacao
  ): Promise<SubscricaoLocalizacao | null> {
    if (!this.locationGateway.monitorarPosicao) {
      const inicial = await this.locationGateway.obterLocalizacaoAtual();
      callback(inicial);
      return null;
    }
    return this.locationGateway.monitorarPosicao(callback, opcoes);
  }
}

