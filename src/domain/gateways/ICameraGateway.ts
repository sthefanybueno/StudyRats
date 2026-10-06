export interface ICameraGateway {
  /**
   * Abre a câmera nativa do dispositivo para o usuário tirar uma foto.
   * Retorna a URI (caminho local) da imagem capturada, ou null se o usuário cancelar.
   */
  capturarFoto(): Promise<string | null>;
}
