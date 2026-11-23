/** Description: This file (src/infrastructure/gateways/__tests__/Gateways.spec.ts) contains the implementation for its respective feature. */
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { ExpoCameraGateway } from '../ExpoCameraGateway';
import { ExpoLocationGateway } from '../ExpoLocationGateway';
import { MockAIGateway } from '../MockAIGateway';
import { MockSyncGateway } from '../MockSyncGateway';

jest.mock('expo-location', () => ({
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  hasServicesEnabledAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

describe('Infrastructure Gateways', () => {
  describe('ExpoCameraGateway', () => {
    it('deve capturar foto e devolver a URI permanente quando permissão concedida', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'granted' } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://cache/foto.jpg' }],
      } as any);
      const persistir = jest.fn().mockResolvedValue('file://documents/fotos_sessao/foto.jpg');

      const gateway = new ExpoCameraGateway(persistir);
      const uri = await gateway.capturarFoto();

      expect(persistir).toHaveBeenCalledWith('file://cache/foto.jpg');
      expect(uri).toBe('file://documents/fotos_sessao/foto.jpg');
    });

    it('deve devolver null e não persistir nada quando o usuário cancelar a captura', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'granted' } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({ canceled: true, assets: null } as any);
      const persistir = jest.fn();

      const gateway = new ExpoCameraGateway(persistir);

      expect(await gateway.capturarFoto()).toBeNull();
      expect(persistir).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando a permissão for negada', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'denied' } as any);
      const persistir = jest.fn();

      const gateway = new ExpoCameraGateway(persistir);
      await expect(gateway.capturarFoto()).rejects.toThrow('Permissão de câmera negada');
      expect(persistir).not.toHaveBeenCalled();
    });
  });

  describe('ExpoLocationGateway', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([]);
    });

    it('deve obter localização, accuracy e reverse geocoding aproximado (bairro, cidade) quando permissão concedida', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: -21.5561, longitude: -45.4345, accuracy: 12 },
        mocked: false,
      });
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        { street: 'Av. Rio Branco', streetNumber: '100', district: 'Centro', city: 'Varginha', region: 'MG' },
      ]);

      const gateway = new ExpoLocationGateway();
      const coords = await gateway.obterLocalizacaoAtual();

      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
      expect(coords.latitude).toBe(-21.5561);
      expect(coords.longitude).toBe(-45.4345);
      expect(coords.accuracy).toBe(12);
      expect(coords.localAproximado).toBe('Centro, Varginha');
    });

    it('deve lançar erro quando o GPS do aparelho estiver desligado (hasServicesEnabledAsync = false)', async () => {
      (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(false);

      const gateway = new ExpoLocationGateway();
      await expect(gateway.obterLocalizacaoAtual()).rejects.toThrow('Serviço de localização (GPS) desligado');
      expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando a permissão de localização for negada e indicar bloqueio permanente quando canAskAgain = false', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied', canAskAgain: false });

      const gateway = new ExpoLocationGateway();
      await expect(gateway.obterLocalizacaoAtual()).rejects.toThrow('Permissão de localização negada permanentemente');
    });

    it('deve usar getLastKnownPositionAsync como fallback quando getCurrentPositionAsync falhar', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(new Error('Timeout GPS indoor'));
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: -19.9191, longitude: -43.9386, accuracy: 45 },
        mocked: false,
      });

      const gateway = new ExpoLocationGateway();
      const coords = await gateway.obterLocalizacaoAtual();

      expect(Location.getLastKnownPositionAsync).toHaveBeenCalled();
      expect(coords.latitude).toBe(-19.9191);
      expect(coords.accuracy).toBe(45);
    });

    it('deve rejeitar localização simulada (mocked = true) e leituras com accuracy ruim (> 1000m)', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
        coords: { latitude: -23.55, longitude: -46.63, accuracy: 5 },
        mocked: true,
      });

      const gateway = new ExpoLocationGateway();
      await expect(gateway.obterLocalizacaoAtual()).rejects.toThrow('Localização simulada (Mock Location) detectada');

      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
        coords: { latitude: -23.55, longitude: -46.63, accuracy: 1800 },
        mocked: false,
      });
      await expect(gateway.obterLocalizacaoAtual()).rejects.toThrow('Accuracy insuficiente');
    });

    it('deve monitorar posição com watchPositionAsync (distanceInterval = 10) e permitir cancelar via remove()', async () => {
      const mockRemove = jest.fn();
      let watchCb: ((loc: any) => void) | undefined;
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted', canAskAgain: true });
      (Location.watchPositionAsync as jest.Mock).mockImplementation(async (_opts: any, cb: (loc: any) => void) => {
        watchCb = cb;
        return { remove: mockRemove };
      });

      const recebidas: any[] = [];
      const gateway = new ExpoLocationGateway();
      const sub = await gateway.monitorarPosicao((c) => recebidas.push(c), { distanceInterval: 10, timeInterval: 5000 });

      // Ignora leitura simulada (mocked) e aceita leitura válida
      watchCb?.({ coords: { latitude: 0, longitude: 0, accuracy: 5 }, mocked: true });
      watchCb?.({ coords: { latitude: -21.5561, longitude: -45.4345, accuracy: 9 }, mocked: false });

      expect(recebidas).toHaveLength(1);
      expect(recebidas[0]).toEqual({ latitude: -21.5561, longitude: -45.4345, accuracy: 9 });

      sub.remove();
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('deve converter endereço em coordenadas via geocodeAsync (Forward Geocoding)', async () => {
      (Location.geocodeAsync as jest.Mock).mockResolvedValue([
        { latitude: -19.9245, longitude: -43.9352, accuracy: 20 },
      ]);
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValue([
        { district: 'Funcionários', city: 'Belo Horizonte', region: 'MG' },
      ]);

      const gateway = new ExpoLocationGateway();
      const coords = await gateway.obterCoordenadasPorEndereco('Av. Brasil, 1000, BH');

      expect(Location.geocodeAsync).toHaveBeenCalledWith('Av. Brasil, 1000, BH');
      expect(coords).toEqual({
        latitude: -19.9245,
        longitude: -43.9352,
        accuracy: 20,
        localAproximado: 'Funcionários, Belo Horizonte',
      });
    });
  });

  describe('MockAIGateway & MockSyncGateway', () => {
    it('deve gerar resumo para o tópico', async () => {
      const ai = new MockAIGateway();
      const resumo = await ai.gerarResumoParaTopico('História');

      expect(resumo).toContain('Resumo: História');
    });

    it('deve fazer upload de foto e enviar payload no MockSyncGateway', async () => {
      const sync = new MockSyncGateway();
      const url = await sync.fazerUploadFoto('local.jpg', 'remoto.jpg');
      await sync.enviarParaNuvem('sessoes', 'INSERT', { id: 1 });
      const ranking = await sync.obterRanking();

      expect(url).toContain('https://mock.supabase.co/storage/remoto.jpg');
      expect(ranking).toHaveLength(3);
    });
  });
});
