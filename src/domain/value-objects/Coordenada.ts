/** Description: Value Object WGS84 para coordenadas geográficas, com validação de accuracy e rótulo aproximado (LGPD). */
export interface CoordenadaProps {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  /** Raio de confiança em metros (CEP). Leituras < 0 ou > MAX_ACCURACY_METERS são rejeitadas. */
  accuracy?: number;
  /** Localização aproximada legível (ex.: "Centro, Varginha") obtida via reverse geocoding, sem rua/número (LGPD). */
  localAproximado?: string;
}

/** Limite máximo aceitável de accuracy em metros (PDF 01, slide 20: >= 1000m indica Cell ID impreciso). */
export const MAX_ACCURACY_METERS = 1000;

interface InternalCoordenadaProps {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  localAproximado?: string;
}

export class Coordenada {
  private constructor(private readonly props: InternalCoordenadaProps) {}

  public get latitude(): number {
    return this.props.latitude;
  }

  public get longitude(): number {
    return this.props.longitude;
  }

  public get timestamp(): Date {
    return this.props.timestamp;
  }

  public get accuracy(): number | undefined {
    return this.props.accuracy;
  }

  public get localAproximado(): string | undefined {
    return this.props.localAproximado;
  }

  /**
   * Calcula a distância geodésica (Haversine, WGS84) em metros até outro ponto (PDF 01, slides 6-7 e 40).
   */
  public distanciaMetrosPara(alvo: { latitude: number; longitude: number }): number {
    const R = 6371000; // Raio médio da Terra em metros
    const toRad = (graus: number) => (graus * Math.PI) / 180;
    const dLat = toRad(alvo.latitude - this.props.latitude);
    const dLon = toRad(alvo.longitude - this.props.longitude);
    const lat1 = toRad(this.props.latitude);
    const lat2 = toRad(alvo.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  public static create(props: CoordenadaProps): Coordenada {
    if (props.latitude < -90 || props.latitude > 90 || Number.isNaN(props.latitude)) {
      throw new Error('Latitude inválida');
    }
    if (props.longitude < -180 || props.longitude > 180 || Number.isNaN(props.longitude)) {
      throw new Error('Longitude inválida');
    }
    if (props.accuracy !== undefined && props.accuracy !== null) {
      if (props.accuracy < 0 || Number.isNaN(props.accuracy)) {
        throw new Error('Accuracy inválida');
      }
      if (props.accuracy > MAX_ACCURACY_METERS) {
        throw new Error('Accuracy insuficiente para registro confiável');
      }
    }

    const localLimpo = props.localAproximado?.trim() || undefined;

    return new Coordenada({
      latitude: props.latitude,
      longitude: props.longitude,
      timestamp: props.timestamp ?? new Date(),
      accuracy: props.accuracy ?? undefined,
      localAproximado: localLimpo,
    });
  }
}
