import { ILocationGateway, Coordenadas } from '../../domain/gateways/ILocationGateway';
import * as Location from 'expo-location';

export class ExpoLocationGateway implements ILocationGateway {
  async obterLocalizacaoAtual(): Promise<Coordenadas> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permissão de localização negada');
    }

    const location = await Location.getCurrentPositionAsync({});
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }
}
