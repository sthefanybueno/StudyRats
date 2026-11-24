/** Description: Implementação Expo (expo-notifications) de INotificationGateway para notificações locais. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type {
  ConclusaoTimerNotificacaoParams,
  INotificationGateway,
  LembreteStreakNotificacaoParams,
  SessaoAtivaNotificacaoParams,
} from '../../domain/gateways/INotificationGateway';

export const NOTIF_ID_SESSAO_ATIVA = 'studyrats-sessao-ativa';
export const NOTIF_ID_TIMER_FIM = 'studyrats-timer-fim';
export const NOTIF_ID_STREAK_DIARIO = 'studyrats-streak-diario';

const CANAL_SESSAO_ATIVA = 'studyrats-sessao-ativa';
const CANAL_LEMBRETES = 'studyrats-lembretes';

if (Platform.OS !== 'web' && typeof Notifications.setNotificationHandler === 'function') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const ehSessaoAtiva = notification?.request?.identifier === NOTIF_ID_SESSAO_ATIVA;
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: !ehSessaoAtiva,
        shouldSetBadge: false,
      };
    },
  });
}

function formatarHora(data: Date): string {
  const h = data.getHours().toString().padStart(2, '0');
  const m = data.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export class ExpoNotificationGateway implements INotificationGateway {
  private canaisConfigurados = false;

  private async garantirCanaisAndroid(): Promise<void> {
    if (Platform.OS !== 'android' || this.canaisConfigurados) return;
    try {
      if (typeof Notifications.setNotificationChannelAsync === 'function') {
        await Notifications.setNotificationChannelAsync(CANAL_SESSAO_ATIVA, {
          name: 'Sessão de Estudo Ativa',
          importance: Notifications.AndroidImportance.LOW,
          sound: null,
          enableVibrate: false,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
          name: 'Lembretes e Cronômetro',
          importance: Notifications.AndroidImportance.HIGH,
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
      this.canaisConfigurados = true;
    } catch {
      // Não bloqueia o fluxo em ambientes sem suporte a canais
    }
  }

  async solicitarPermissao(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      await this.garantirCanaisAndroid();
      const atual = await Notifications.getPermissionsAsync();
      if (atual.granted || atual.status === 'granted') {
        return true;
      }
      if (atual.canAskAgain === false) {
        return false;
      }
      const solicitacao = await Notifications.requestPermissionsAsync();
      return Boolean(solicitacao.granted || solicitacao.status === 'granted');
    } catch {
      return false;
    }
  }

  async exibirSessaoAtiva(params: SessaoAtivaNotificacaoParams): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const permitido = await this.solicitarPermissao();
      if (!permitido) return;

      const subtitulo = params.topico ? `${params.disciplina} · ${params.topico}` : params.disciplina;
      const horarioTermino = formatarHora(params.terminaEm);

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIF_ID_SESSAO_ATIVA,
        content: {
          title: 'Sessão de foco em andamento',
          body: `${subtitulo} · Meta ${params.duracaoAlvoMinutos} min (término às ${horarioTermino})`,
          sticky: Platform.OS === 'android',
          autoDismiss: false,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
          data: { tipo: 'sessao_ativa' },
        },
        trigger:
          Platform.OS === 'android'
            ? ({ channelId: CANAL_SESSAO_ATIVA } as any)
            : null,
      });
    } catch {
      // Melhor-esforço para não interromper o cronômetro
    }
  }

  async encerrarSessaoAtiva(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      if (typeof Notifications.dismissNotificationAsync === 'function') {
        await Notifications.dismissNotificationAsync(NOTIF_ID_SESSAO_ATIVA);
      }
    } catch {
      // Ignora caso já tenha sido removida
    }
    try {
      if (typeof Notifications.cancelScheduledNotificationAsync === 'function') {
        await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_SESSAO_ATIVA);
      }
    } catch {
      // Ignora
    }
  }

  async agendarConclusaoTimer(params: ConclusaoTimerNotificacaoParams): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await this.cancelarConclusaoTimer();
      const permitido = await this.solicitarPermissao();
      if (!permitido) return;

      const segundos = Math.max(1, Math.round(params.segundosRestantes));

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIF_ID_TIMER_FIM,
        content: {
          title: 'Tempo de foco concluído!',
          body: `Sua sessão de ${params.disciplina} terminou. Volte ao app para registrar e garantir seu XP.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { tipo: 'timer_fim' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: segundos,
          ...(Platform.OS === 'android' ? { channelId: CANAL_LEMBRETES } : {}),
        },
      });
    } catch {
      // Melhor-esforço
    }
  }

  async cancelarConclusaoTimer(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_TIMER_FIM);
    } catch {
      // Ignora caso não exista agendamento
    }
  }

  async agendarLembreteDiarioStreak(params: LembreteStreakNotificacaoParams): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await this.cancelarLembreteDiarioStreak();
      const permitido = await this.solicitarPermissao();
      if (!permitido) return;

      const hora = params.hora ?? 20;
      const minuto = params.minuto ?? 0;
      const body =
        params.streakAtual > 0
          ? `Não deixe seu streak de ${params.streakAtual} ${params.streakAtual === 1 ? 'dia' : 'dias'} apagar! Faça uma sessão rápida hoje.`
          : 'Que tal começar uma sequência de estudos hoje? Abra o StudyRats e registre sua sessão.';

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIF_ID_STREAK_DIARIO,
        content: {
          title: 'Hora de manter seu ritmo!',
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { tipo: 'lembrete_streak' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hora,
          minute: minuto,
          ...(Platform.OS === 'android' ? { channelId: CANAL_LEMBRETES } : {}),
        },
      });
    } catch {
      // Melhor-esforço
    }
  }

  async cancelarLembreteDiarioStreak(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelScheduledNotificationAsync(NOTIF_ID_STREAK_DIARIO);
    } catch {
      // Ignora
    }
  }
}
