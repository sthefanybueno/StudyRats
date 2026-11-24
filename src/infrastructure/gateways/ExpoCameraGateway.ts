/** Description: This file (src/infrastructure/gateways/ExpoCameraGateway.ts) contains the implementation for its respective feature. */
import { ICameraGateway } from '../../domain/gateways/ICameraGateway';
import * as ImagePicker from 'expo-image-picker';

export class ExpoCameraGateway implements ICameraGateway {
  constructor(private persistirFoto?: (uriTemp: string) => Promise<string>) {}

  private async processarResultado(result: ImagePicker.ImagePickerResult): Promise<string | null> {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uriTemp = result.assets[0].uri;
      if (this.persistirFoto) {
        return await this.persistirFoto(uriTemp);
      }
      return uriTemp;
    }

    return null;
  }

  async capturarFoto(): Promise<string | null> {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();

    if (permissao.status !== 'granted') {
      if (permissao.canAskAgain === false) {
        throw new Error('Permissão de câmera negada permanentemente. Habilite nas configurações do sistema.');
      }
      throw new Error('Permissão de câmera negada');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      quality: 0.8,
    });

    return this.processarResultado(result);
  }

  async selecionarDaGaleria(): Promise<string | null> {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissao.status !== 'granted') {
      if (permissao.canAskAgain === false) {
        throw new Error('Permissão de galeria negada permanentemente. Habilite nas configurações do sistema.');
      }
      throw new Error('Permissão de galeria negada');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      quality: 0.8,
    });

    return this.processarResultado(result);
  }
}
