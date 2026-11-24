/** Description: Contrato puro de domínio para notificações locais (sessão ativa, conclusão de timer e lembrete de streak). */

export interface SessaoAtivaNotificacaoParams {
  disciplina: string;
  topico?: string | null;
  duracaoAlvoMinutos: number;
  terminaEm: Date;
}

export interface ConclusaoTimerNotificacaoParams {
  disciplina: string;
  segundosRestantes: number;
}

export interface LembreteStreakNotificacaoParams {
  streakAtual: number;
  hora?: number;
  minuto?: number;
}

export interface INotificationGateway {
  solicitarPermissao(): Promise<boolean>;
  exibirSessaoAtiva(params: SessaoAtivaNotificacaoParams): Promise<void>;
  encerrarSessaoAtiva(): Promise<void>;
  agendarConclusaoTimer(params: ConclusaoTimerNotificacaoParams): Promise<void>;
  cancelarConclusaoTimer(): Promise<void>;
  agendarLembreteDiarioStreak(params: LembreteStreakNotificacaoParams): Promise<void>;
  cancelarLembreteDiarioStreak(): Promise<void>;
}
