/** Description: Testes dos formatadores do feed. */
import { formatarCoordenadas, formatarTempoRelativo } from '../formatadores';

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
});

