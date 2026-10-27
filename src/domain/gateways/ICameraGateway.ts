/** Description: This file (src/domain/gateways/ICameraGateway.ts) contains the implementation for its respective feature. */
export interface ICameraGateway {
  /**
   * Abre a câmera nativa do dispositivo para o usuário tirar uma foto.
   * Retorna a URI (caminho local) da imagem capturada, ou null se o usuário cancelar.
   */
  capturarFoto(): Promise<string | null>;
}
