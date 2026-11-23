/** Description: Testes dos formatadores do feed. */
import {
  formatarCoordenadas,
  formatarCoordenadasAproximadas,
  formatarDistancia,
  formatarLocalizacaoFeed,
  formatarTempoRelativo,
} from '../formatadores';

describe('formatadores do feed', () => {
  const agora = new Date('2026-03-10T12:00:00Z');
  const atras = (ms: number) => new Date(agora.getTime() - ms);

  it.each([
    [10 * 1000, 'agora'],
    [5 * 60 * 1000, 'há 5 min'],
    [3 * 3600 * 1000, 'há 3 h'],
    [2 * 86400 * 1000, 'há 2 d'],
    [65 * 86400 * 1000, 'há 2 m'],
    [800 * 86400 * 1000, 'há 2 a'],
  ])('tempo relativo %d ms -> %s', (ms, esperado) => {
    expect(formatarTempoRelativo(atras(ms), agora)).toBe(esperado);
  });

  it('data futura é tratada como "agora"', () => {
    expect(formatarTempoRelativo(new Date(agora.getTime() + 5000), agora)).toBe('agora');
  });

  it('formata coordenadas com 5 casas decimais', () => {
    expect(formatarCoordenadas(-19.919123456, -43.93861234)).toBe('-19.91912, -43.93861');
  });

  it('formata coordenadas aproximadas com 2 casas decimais (~1 km - LGPD)', () => {
    expect(formatarCoordenadasAproximadas(-19.919123456, -43.93861234)).toBe('-19.92, -43.94');
  });

  it('prioriza Bairro/Cidade no feed e usa coordenada aproximada (2 casas) quando offline', () => {
    expect(formatarLocalizacaoFeed(-21.5561, -45.4345, 'Centro, Varginha')).toBe('Centro, Varginha');
    expect(formatarLocalizacaoFeed(-21.5561, -45.4345, undefined)).toBe('-21.56, -45.43');
    expect(formatarLocalizacaoFeed(-21.5561, -45.4345, 'Centro, Varginha', 350)).toBe('Centro, Varginha · 350 m');
    expect(formatarLocalizacaoFeed(undefined, undefined, undefined)).toBeNull();
  });

  it('formata distância em metros ou quilômetros', () => {
    expect(formatarDistancia(420)).toBe('420 m');
    expect(formatarDistancia(1250)).toBe('1,3 km');
  });
});

