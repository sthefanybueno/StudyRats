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

export function formatarCoordenadas(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

