import { CalculoXpService } from '../CalculoXpService';
import { CalculoStreakService } from '../CalculoStreakService';

describe('Domain Services (CalculoXpService & CalculoStreakService)', () => {
  describe('CalculoXpService', () => {
    it('deve calcular XP básico por minuto de estudo', () => {
      expect(CalculoXpService.calcular({ duracaoMinutos: 30, comFoto: false })).toBe(30);
    });

    it('deve adicionar bônus de +10 XP para foto', () => {
      expect(CalculoXpService.calcular({ duracaoMinutos: 30, comFoto: true })).toBe(40);
    });

    it('deve adicionar bônus de +5 XP para GPS', () => {
      expect(CalculoXpService.calcular({ duracaoMinutos: 20, comFoto: false, comGps: true })).toBe(25);
    });

    it('deve adicionar bônus de +15 XP para sessões estendidas (>= 45 min)', () => {
      expect(CalculoXpService.calcular({ duracaoMinutos: 50, comFoto: true, comGps: true })).toBe(50 + 10 + 5 + 15);
    });
  });

  describe('CalculoStreakService', () => {
    it('deve iniciar o streak em 1 se não houver estudo anterior', () => {
      const streak = CalculoStreakService.calcularNovoStreak(0, undefined, new Date(2026, 9, 5));
      expect(streak).toBe(1);
    });

    it('deve manter o mesmo streak se estudou mais de uma vez no mesmo dia', () => {
      const hoje = new Date(2026, 9, 5, 15, 0);
      const estudoAnteriorHoje = new Date(2026, 9, 5, 9, 0);

      const streak = CalculoStreakService.calcularNovoStreak(5, estudoAnteriorHoje, hoje);
      expect(streak).toBe(5);
    });

    it('deve incrementar o streak em 1 se estudou no dia consecutivo', () => {
      const ontem = new Date(2026, 9, 4, 18, 0);
      const hoje = new Date(2026, 9, 5, 10, 0);

      const streak = CalculoStreakService.calcularNovoStreak(5, ontem, hoje);
      expect(streak).toBe(6);
    });

    it('deve resetar o streak para 1 se ficou mais de 1 dia sem estudar', () => {
      const haTresDias = new Date(2026, 9, 2, 10, 0);
      const hoje = new Date(2026, 9, 5, 10, 0);

      const streak = CalculoStreakService.calcularNovoStreak(10, haTresDias, hoje);
      expect(streak).toBe(1);
    });
  });
});
