/** Description: This file (src/domain/value-objects/__tests__/Coordenada.spec.ts) contains the implementation for its respective feature. */
import { Coordenada } from '../Coordenada';

describe('Coordenada Value Object', () => {
  it('deve criar uma coordenada válida', () => {
    const timestamp = new Date();
    const coord = Coordenada.create({ latitude: -23.5505, longitude: -46.6333, timestamp });

    expect(coord.latitude).toBe(-23.5505);
    expect(coord.longitude).toBe(-46.6333);
    expect(coord.timestamp).toBe(timestamp);
  });

  it('deve atribuir timestamp padrão se não for informado', () => {
    const coord = Coordenada.create({ latitude: 0, longitude: 0 });

    expect(coord.timestamp).toBeInstanceOf(Date);
  });

  it('deve lançar erro para latitude inválida (< -90 ou > 90)', () => {
    expect(() => Coordenada.create({ latitude: -91, longitude: 0 })).toThrow('Latitude inválida');
    expect(() => Coordenada.create({ latitude: 91, longitude: 0 })).toThrow('Latitude inválida');
  });

  it('deve lançar erro para longitude inválida (< -180 ou > 180)', () => {
    expect(() => Coordenada.create({ latitude: 0, longitude: -181 })).toThrow('Longitude inválida');
    expect(() => Coordenada.create({ latitude: 0, longitude: 181 })).toThrow('Longitude inválida');
  });

  it('deve preservar accuracy válida e localAproximado higienizado', () => {
    const coord = Coordenada.create({
      latitude: -21.5561,
      longitude: -45.4345,
      accuracy: 18.5,
      localAproximado: '  Centro, Varginha  ',
    });

    expect(coord.accuracy).toBe(18.5);
    expect(coord.localAproximado).toBe('Centro, Varginha');
  });

  it('deve rejeitar accuracy negativa (< 0) ou acima do limite confiável (> 1000m)', () => {
    expect(() => Coordenada.create({ latitude: -21.55, longitude: -45.43, accuracy: -1 })).toThrow('Accuracy inválida');
    expect(() => Coordenada.create({ latitude: -21.55, longitude: -45.43, accuracy: 1500 })).toThrow(
      'Accuracy insuficiente para registro confiável'
    );
  });

  it('deve calcular a distância em metros entre duas coordenadas (Haversine)', () => {
    const origem = Coordenada.create({ latitude: -21.5561, longitude: -45.4345 });
    const mesmoPonto = { latitude: -21.5561, longitude: -45.4345 };
    const perto = { latitude: -21.559, longitude: -45.4345 }; // ~322 m ao sul

    expect(origem.distanciaMetrosPara(mesmoPonto)).toBe(0);
    expect(origem.distanciaMetrosPara(perto)).toBeGreaterThan(250);
    expect(origem.distanciaMetrosPara(perto)).toBeLessThan(400);
  });
});
