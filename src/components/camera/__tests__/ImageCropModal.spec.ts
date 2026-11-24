/** Description: Testes unitários para cálculo de limites e retângulo de recorte do ImageCropModal. */
import { calcularImageBounds, calcularRetanguloCortePixels } from '../ImageCropModal';

describe('ImageCropModal - cálculos de recorte', () => {
  it('deve calcular bounds centralizados mantendo proporção (contain)', () => {
    const bounds = calcularImageBounds(400, 600, 2000, 1000);
    expect(bounds.displayWidth).toBe(400);
    expect(bounds.displayHeight).toBe(200);
    expect(bounds.offsetX).toBe(0);
    expect(bounds.offsetY).toBe(200);
  });

  it('deve converter cropBox de tela para coordenadas em pixels reais da imagem', () => {
    const bounds = calcularImageBounds(400, 600, 2000, 1000);
    const pixels = calcularRetanguloCortePixels(
      { x: 100, y: 250, width: 200, height: 100 },
      bounds
    );

    expect(pixels).toEqual({
      originX: 500,
      originY: 250,
      width: 1000,
      height: 500,
    });
  });

  it('deve limitar coordenadas de corte dentro dos limites naturais da imagem', () => {
    const bounds = calcularImageBounds(400, 400, 1000, 1000);
    const pixels = calcularRetanguloCortePixels(
      { x: -20, y: -10, width: 500, height: 500 },
      bounds
    );

    expect(pixels.originX).toBe(0);
    expect(pixels.originY).toBe(0);
    expect(pixels.width).toBeLessThanOrEqual(1000);
    expect(pixels.height).toBeLessThanOrEqual(1000);
  });
});
