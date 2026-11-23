/** Description: Implementação de ILocationGateway com expo-location: serviços, permissões, accuracy, anti-mock, fallback e reverse geocoding LGPD. */
import * as Location from 'expo-location';
import {
  ILocationGateway,
  Coordenadas,
  DiagnosticoLocalizacao,
  OpcoesMonitoramentoLocalizacao,
  SubscricaoLocalizacao,
} from '../../domain/gateways/ILocationGateway';
import { MAX_ACCURACY_METERS } from '../../domain/value-objects/Coordenada';

/** Idade máxima aceita para fallback de última posição conhecida (5 minutos). */
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

export class ExpoLocationGateway implements ILocationGateway {
  async diagnosticarPermissao(): Promise<DiagnosticoLocalizacao> {
    let servicosAtivos = true;
    if (typeof Location.hasServicesEnabledAsync === 'function') {
      const enabled = await Location.hasServicesEnabledAsync();
      if (enabled === false) {
        servicosAtivos = false;
      }
    }

    // Diagnóstico é 100% passivo: consulta getForegroundPermissionsAsync sem disparar popup do SO (RNF02)
    if (typeof Location.getForegroundPermissionsAsync === 'function') {
      const res = await Location.getForegroundPermissionsAsync();
      return {
        servicosAtivos,
        permissaoConcedida: res?.status === 'granted',
        canAskAgain: res?.canAskAgain ?? true,
      };
    }

    return {
      servicosAtivos,
      permissaoConcedida: false,
      canAskAgain: true,
    };
  }

  async obterLocalizacaoAtual(): Promise<Coordenadas> {
    // 1. Verificar se o serviço de localização (GPS) do aparelho está ativo (PDF 02, slide 9)
    if (typeof Location.hasServicesEnabledAsync === 'function') {
      const servicosAtivos = await Location.hasServicesEnabledAsync();
      if (servicosAtivos === false) {
        throw new Error('Serviço de localização (GPS) desligado no aparelho');
      }
    }

    // 2. Solicitar permissão em foreground apenas no momento de uso (PDF 02, slides 9, 10 e 18)
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      if (canAskAgain === false) {
        throw new Error('Permissão de localização negada permanentemente. Habilite nas configurações.');
      }
      throw new Error('Permissão de localização negada');
    }

    // 3. Capturar posição atual com Accuracy.Balanced (~100m, equilíbrio bateria x precisão - PDF 02, slides 11-12)
    //    e fallback para getLastKnownPositionAsync em ambientes internos (PDF 02, slide 13)
    const balancedAccuracy = Location.Accuracy?.Balanced ?? 3;
    let location: Location.LocationObject | null = null;

    try {
      location = await Location.getCurrentPositionAsync({
        accuracy: balancedAccuracy,
      });
    } catch (err) {
      if (typeof Location.getLastKnownPositionAsync === 'function') {
        location = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
          requiredAccuracy: MAX_ACCURACY_METERS,
        });
      }
      if (!location) {
        throw err instanceof Error ? err : new Error('Não foi possível obter a posição atual');
      }
    }

    // 4. Segurança: rejeitar posição simulada / Fake GPS no Android (PDF 02, slide 42)
    if (location.mocked === true) {
      throw new Error('Localização simulada (Mock Location) detectada');
    }

    const { latitude, longitude, accuracy } = location.coords;

    // 5. Qualidade da posição: descartar accuracy inválida (< 0) ou ruim (> 1000m Cell ID - PDF 01, slides 19-20)
    if (typeof accuracy === 'number') {
      if (accuracy < 0) {
        throw new Error('Accuracy inválida');
      }
      if (accuracy > MAX_ACCURACY_METERS) {
        throw new Error('Accuracy insuficiente para registro confiável');
      }
    }

    // 6. Reverse Geocoding aproximado (Bairro, Cidade) sem rua/número para privacidade LGPD (PDF 01, slides 34 e 46; PDF 02, slide 17)
    const localAproximado = await this.obterLocalAproximado(latitude, longitude);

    return {
      latitude,
      longitude,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      localAproximado,
    };
  }

  async monitorarPosicao(
    callback: (coords: Coordenadas) => void,
    opcoes?: OpcoesMonitoramentoLocalizacao
  ): Promise<SubscricaoLocalizacao> {
    if (typeof Location.hasServicesEnabledAsync === 'function') {
      const servicosAtivos = await Location.hasServicesEnabledAsync();
      if (servicosAtivos === false) {
        throw new Error('Serviço de localização (GPS) desligado no aparelho');
      }
    }

    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain === false) {
        throw new Error('Permissão de localização negada permanentemente. Habilite nas configurações.');
      }
      throw new Error('Permissão de localização negada');
    }

    // Equilíbrio bateria x precisão no monitoramento em foreground (PDF 02, slides 12, 14 e 18)
    const balancedAccuracy = Location.Accuracy?.Balanced ?? 3;
    const sub = await Location.watchPositionAsync(
      {
        accuracy: balancedAccuracy,
        distanceInterval: opcoes?.distanceInterval ?? 10,
        timeInterval: opcoes?.timeInterval ?? 5000,
      },
      (loc) => {
        if (loc.mocked === true) return;
        const acc = loc.coords.accuracy;
        if (typeof acc === 'number' && (acc < 0 || acc > MAX_ACCURACY_METERS)) return;

        callback({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: typeof acc === 'number' ? acc : undefined,
        });
      }
    );

    return {
      remove: () => sub.remove(),
    };
  }

  async obterLocalAproximado(latitude: number, longitude: number): Promise<string | undefined> {
    if (typeof Location.reverseGeocodeAsync !== 'function') {
      return undefined;
    }

    try {
      const resultados = await Location.reverseGeocodeAsync({ latitude, longitude });
      const end = resultados?.[0];
      if (!end) return undefined;

      // Minimização LGPD: exibimos apenas bairro/distrito e cidade/UF, nunca rua ou número residencial
      const bairro = end.district?.trim() || end.subregion?.trim() || undefined;
      const cidade = end.city?.trim() || end.region?.trim() || undefined;

      if (bairro && cidade && bairro.toLowerCase() !== cidade.toLowerCase()) {
        return `${bairro}, ${cidade}`;
      }
      return cidade || bairro || undefined;
    } catch {
      // Se estiver offline ou o serviço de geocoding falhar, retorna undefined (fallback para coordenada aproximada)
      return undefined;
    }
  }

  async obterCoordenadasPorEndereco(endereco: string): Promise<Coordenadas | null> {
    const consulta = endereco.trim();
    if (!consulta || typeof Location.geocodeAsync !== 'function') {
      return null;
    }

    const resultados = await Location.geocodeAsync(consulta);
    const primeiro = resultados?.[0];
    if (!primeiro || typeof primeiro.latitude !== 'number' || typeof primeiro.longitude !== 'number') {
      return null;
    }

    const localAproximado =
      (await this.obterLocalAproximado(primeiro.latitude, primeiro.longitude)) ?? consulta;

    return {
      latitude: primeiro.latitude,
      longitude: primeiro.longitude,
      accuracy: typeof primeiro.accuracy === 'number' ? primeiro.accuracy : undefined,
      localAproximado,
    };
  }
}
