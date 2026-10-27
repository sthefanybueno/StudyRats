/** Description: This file (src/domain/gateways/ILocationGateway.ts) contains the implementation for its respective feature. */
export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface ILocationGateway {
  /**
   * Solicita a localização atual do dispositivo.
   * Pode lançar erro caso a permissão seja negada.
   */
  obterLocalizacaoAtual(): Promise<Coordenadas>;
}
