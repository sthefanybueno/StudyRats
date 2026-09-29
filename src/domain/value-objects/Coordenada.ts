export interface CoordenadaProps {
  latitude: number;
  longitude: number;
}

export class Coordenada {
  private constructor(private readonly props: CoordenadaProps) {}

  public get latitude(): number {
    return this.props.latitude;
  }

  public get longitude(): number {
    return this.props.longitude;
  }

  public static create(props: CoordenadaProps): Coordenada {
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error('Latitude inválida');
    }
    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error('Longitude inválida');
    }

    return new Coordenada(props);
  }
}
