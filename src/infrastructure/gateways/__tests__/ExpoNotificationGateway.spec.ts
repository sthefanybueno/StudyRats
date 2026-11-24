/** Description: Testes unitários do ExpoNotificationGateway (sessão ativa sticky, timer e lembrete diário de streak). */
import * as Notifications from 'expo-notifications';
import {
  ExpoNotificationGateway,
  NOTIF_ID_SESSAO_ATIVA,
  NOTIF_ID_STREAK_DIARIO,
  NOTIF_ID_TIMER_FIM,
} from '../ExpoNotificationGateway';

describe('ExpoNotificationGateway', () => {
  let gateway: ExpoNotificationGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new ExpoNotificationGateway();
  });

  it('deve exibir notificação persistente ao iniciar sessão ativa', async () => {
    const terminaEm = new Date(2026, 10, 24, 10, 30, 0);
    await gateway.exibirSessaoAtiva({
      disciplina: 'Cálculo I',
      topico: 'Derivadas',
      duracaoAlvoMinutos: 45,
      terminaEm,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: NOTIF_ID_SESSAO_ATIVA,
        content: expect.objectContaining({
          title: 'Sessão de foco em andamento',
          body: expect.stringContaining('Cálculo I · Derivadas'),
          autoDismiss: false,
        }),
      })
    );
  });

  it('deve encerrar a notificação de sessão ativa ao pausar, concluir ou cancelar', async () => {
    await gateway.encerrarSessaoAtiva();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith(NOTIF_ID_SESSAO_ATIVA);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIF_ID_SESSAO_ATIVA);
  });

  it('deve agendar notificação de conclusão do timer com segundos restantes', async () => {
    await gateway.agendarConclusaoTimer({
      disciplina: 'Algoritmos',
      segundosRestantes: 1500,
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIF_ID_TIMER_FIM);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: NOTIF_ID_TIMER_FIM,
        trigger: expect.objectContaining({
          seconds: 1500,
        }),
      })
    );
  });

  it('deve agendar e cancelar o lembrete diário de streak', async () => {
    await gateway.agendarLembreteDiarioStreak({ streakAtual: 5, hora: 20, minuto: 0 });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: NOTIF_ID_STREAK_DIARIO,
        content: expect.objectContaining({
          body: expect.stringContaining('5 dias'),
        }),
        trigger: expect.objectContaining({
          hour: 20,
          minute: 0,
        }),
      })
    );

    await gateway.cancelarLembreteDiarioStreak();
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(NOTIF_ID_STREAK_DIARIO);
  });
});
