import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { ExpoCameraGateway } from '../ExpoCameraGateway';
import { ExpoLocationGateway } from '../ExpoLocationGateway';
import { MockAIGateway } from '../MockAIGateway';
import { MockSyncGateway } from '../MockSyncGateway';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('Infrastructure Gateways', () => {
  describe('ExpoCameraGateway', () => {
    it('deve capturar foto quando permissão concedida', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'granted' } as any);
      jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://foto.jpg' }],
      } as any);

      const gateway = new ExpoCameraGateway();
      const uri = await gateway.capturarFoto();

      expect(uri).toBe('file://foto.jpg');
    });

    it('deve lançar erro quando a permissão for negada', async () => {
      jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'denied' } as any);

      const gateway = new ExpoCameraGateway();
      await expect(gateway.capturarFoto()).rejects.toThrow('Permissão de câmera negada');
    });
  });

  describe('ExpoLocationGateway', () => {
    it('deve obter localização quando permissão concedida', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: -23.55, longitude: -46.63 },
      });

      const gateway = new ExpoLocationGateway();
      const coords = await gateway.obterLocalizacaoAtual();

      expect(coords.latitude).toBe(-23.55);
      expect(coords.longitude).toBe(-46.63);
    });

    it('deve lançar erro quando a permissão de localização for negada', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

      const gateway = new ExpoLocationGateway();
      await expect(gateway.obterLocalizacaoAtual()).rejects.toThrow('Permissão de localização negada');
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
