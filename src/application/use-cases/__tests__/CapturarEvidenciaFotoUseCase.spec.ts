/** Description: Unit tests for CapturarEvidenciaFotoUseCase. */
import { CapturarEvidenciaFotoUseCase } from '../CapturarEvidenciaFotoUseCase';

describe('CapturarEvidenciaFotoUseCase', () => {
  it('deve delegar captura da câmera do sistema, galeria e processamento de CameraView', async () => {
    const gateway = {
      capturarFoto: jest.fn().mockResolvedValue('file:///cam.jpg'),
      selecionarDaGaleria: jest.fn().mockResolvedValue('file:///gal.jpg'),
      processarFotoCapturada: jest.fn().mockResolvedValue('file:///proc.jpg'),
    };
    const uc = new CapturarEvidenciaFotoUseCase(gateway);

    expect(await uc.capturarComCameraSistema()).toBe('file:///cam.jpg');
    expect(await uc.selecionarDaGaleria()).toBe('file:///gal.jpg');
    expect(await uc.processarFotoCapturada('file:///raw.jpg')).toBe('file:///proc.jpg');
  });
});

