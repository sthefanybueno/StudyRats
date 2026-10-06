export interface CalculoXpParams {
  duracaoMinutos: number;
  comFoto: boolean;
  comGps?: boolean;
}

/**
 * Domain Service puro responsável pelo cálculo de XP acumulado em sessões de estudo.
 * Regra:
 * - 1 XP por minuto estudado (mínimo de 1 min).
 * - Bônus de +10 XP se incluir foto de comprovação.
 * - Bônus de +5 XP se incluir localização GPS.
 * - Bônus de +15 XP para sessões de foco estendido (>= 45 minutos).
 */
export class CalculoXpService {
  public static calcular(params: CalculoXpParams): number {
    const minutos = Math.max(1, Math.floor(params.duracaoMinutos));
    let xp = minutos;

    if (params.comFoto) {
      xp += 10;
    }

    if (params.comGps) {
      xp += 5;
    }

    if (minutos >= 45) {
      xp += 15;
    }

    return xp;
  }
}
