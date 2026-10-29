/** Description: This file (src/infrastructure/gateways/__tests__/Gateways.spec.ts) contains the implementation for its respective feature. */
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
