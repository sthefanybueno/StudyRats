/**
 * Domain Service puro responsável por calcular a manutenção ou reset do Streak (dias consecutivos de estudo).
 */
export class CalculoStreakService {
  public static calcularNovoStreak(streakAtual: number, ultimaDataEstudo?: Date, dataAtual: Date = new Date()): number {
    if (!ultimaDataEstudo) {
      return 1;
    }

    const dataUltimo = new Date(ultimaDataEstudo.getFullYear(), ultimaDataEstudo.getMonth(), ultimaDataEstudo.getDate());
    const dataHoje = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());

    const diffDias = Math.floor((dataHoje.getTime() - dataUltimo.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
      // Estudo realizado no mesmo dia: mantém o streak sem incrementar duas vezes no mesmo dia
      return Math.max(1, streakAtual);
    }

    if (diffDias === 1) {
      // Estudo realizado no dia seguinte consecutivo: incrementa
      return streakAtual + 1;
    }

    // Passou mais de 1 dia sem estudar: reset para 1
    return 1;
  }
}
