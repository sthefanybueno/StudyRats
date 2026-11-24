/** Description: Domain Service puro para calcular a sequência de dias seguidos (streak) de estudo. */

function paraChaveDiaLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export class CalculoStreakService {
  /**
   * Calcula o novo streak a partir do streak anterior e da data do último estudo registrado.
   */
  public static calcularNovoStreak(
    streakAtual: number,
    dataUltimoEstudo?: Date,
    dataAtual: Date = new Date()
  ): number {
    if (!dataUltimoEstudo || Number.isNaN(dataUltimoEstudo.getTime())) {
      return Math.max(1, streakAtual || 1);
    }

    const hoje = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
    const ultimo = new Date(dataUltimoEstudo.getFullYear(), dataUltimoEstudo.getMonth(), dataUltimoEstudo.getDate());
    const diffDias = Math.round((hoje.getTime() - ultimo.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDias <= 0) {
      return Math.max(1, streakAtual);
    }
    if (diffDias === 1) {
      return Math.max(0, streakAtual) + 1;
    }
    return 1;
  }

  /**
   * Calcula quantos dias consecutivos (até hoje ou ontem) possuem ao menos 1 sessão de estudo.
   * Usa o calendário local do aparelho para evitar virada de dia antecipada por UTC.
   */
  public static calcular(datasSessoes: Date[], referencia: Date = new Date()): number {
    if (!datasSessoes || datasSessoes.length === 0) {
      return 0;
    }

    const diasEstudados = new Set(
      datasSessoes
        .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()))
        .map(paraChaveDiaLocal)
    );

    if (diasEstudados.size === 0) {
      return 0;
    }

    const cursor = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());

    // Se ainda não estudou hoje, mantém o streak vivo caso tenha estudado ontem
    if (!diasEstudados.has(paraChaveDiaLocal(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!diasEstudados.has(paraChaveDiaLocal(cursor))) {
        return 0;
      }
    }

    let streak = 0;
    while (diasEstudados.has(paraChaveDiaLocal(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }
}
