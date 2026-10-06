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
});
