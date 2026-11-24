/** Description: Caso de uso que isola o ICameraGateway da camada de UI (câmera do sistema, galeria e CameraView). */
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';

export class CapturarEvidenciaFotoUseCase {
  constructor(private readonly cameraGateway: ICameraGateway) {}

  async capturarComCameraSistema(): Promise<string | null> {
    return this.cameraGateway.capturarFoto();
  }

  async selecionarDaGaleria(): Promise<string | null> {
    if (this.cameraGateway.selecionarDaGaleria) {
      return this.cameraGateway.selecionarDaGaleria();
    }
    return this.cameraGateway.capturarFoto();
  }

  async processarFotoCapturada(uriTemp: string): Promise<string> {
    if (this.cameraGateway.processarFotoCapturada) {
      return this.cameraGateway.processarFotoCapturada(uriTemp);
    }
    return uriTemp;
  }
}

