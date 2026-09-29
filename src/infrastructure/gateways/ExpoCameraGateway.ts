import { ICameraGateway } from '../../domain/gateways/ICameraGateway';
import * as ImagePicker from 'expo-image-picker';

export class ExpoCameraGateway implements ICameraGateway {
  async capturarFoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permissão de câmera negada');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null; 
  }
}
