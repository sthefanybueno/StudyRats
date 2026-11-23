/** Description: Formata a distância de tempo ("há 5 min") e as coordenadas exibidas no card do feed. */
export function formatarTempoRelativo(data: Date, agora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((agora.getTime() - data.getTime()) / 1000));
  if (segundos < 60) return 'agora';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias} d`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} m`;

  return `há ${Math.floor(meses / 12)} a`;
}

export function formatarCoordenadas(latitude: number, longitude: number, casasDecimais: number = 5): string {
  return `${latitude.toFixed(casasDecimais)}, ${longitude.toFixed(casasDecimais)}`;
}

/**
 * Formata coordenadas com 2 casas decimais (~1,1 km de precisão) para proteção de privacidade (LGPD - PDF 01, slide 46).
 */
export function formatarCoordenadasAproximadas(latitude: number, longitude: number): string {
  return formatarCoordenadas(latitude, longitude, 2);
}

/**
 * Formata distância em metros para leitura humana (ex.: "320 m" ou "1,2 km").
 */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.max(0, Math.round(metros))} m`;
  }
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Retorna a localização a ser exibida no Feed:
 * 1) Bairro/Cidade (via reverseGeocodeAsync), quando disponível;
 * 2) Caso contrário (ex.: sessão gravada offline), coordenadas aproximadas com 2 casas decimais (~1 km);
 * 3) Se houver `distanciaMetros` (filtro espacial "Perto de mim"), anexa a distância formatada.
 */
export function formatarLocalizacaoFeed(
  latitude?: number,
  longitude?: number,
  localAproximado?: string,
  distanciaMetros?: number
): string | null {
  let base: string | null = null;
  if (localAproximado && localAproximado.trim().length > 0) {
    base = localAproximado.trim();
  } else if (latitude !== undefined && longitude !== undefined) {
    base = formatarCoordenadasAproximadas(latitude, longitude);
  }

  if (!base) return null;
  if (distanciaMetros !== undefined && distanciaMetros !== null) {
    return `${base} · ${formatarDistancia(distanciaMetros)}`;
  }
  return base;
}

