import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from './AppText';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from "@/providers/ThemeProvider";
import { Colors as GlobalColors } from "@/constants/theme";

export function Card({ children, style, accent }: { children: ReactNode; style?: ViewStyle; accent?: string }) {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  return (
    <View style={[styles.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : null, style]}>{children}</View>
  );
}

type Tone = 'primary' | 'ai' | 'success' | 'warning' | 'neutral';

const tones: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: GlobalColors.primarySoft, fg: GlobalColors.primary },
  ai: { bg: GlobalColors.aiSoft, fg: GlobalColors.aiText },
  success: { bg: GlobalColors.successSoft, fg: GlobalColors.success },
  warning: { bg: GlobalColors.warningSoft, fg: GlobalColors.warning },
  neutral: { bg: GlobalColors.surfaceRaised, fg: GlobalColors.textSecondary },
};

/** Selo em pílula, como "● Sincronizado" / "+45 XP" nas telas do Stitch. */
export function Pill({
  label,
  tone = 'neutral',
  icon,
  dot,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
}) {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      {icon && <Ionicons name={icon} size={12} color={t.fg} />}
      <AppText variant="caption" color={t.fg} style={styles.pillText}>
        {label}
      </AppText>
    </View>
  );
}

/** Barra de progresso com gradiente âmbar → verde (igual ao card de XP). */
export function ProgressBar({ progress, colors }: { progress: number; colors?: [string, string] }) {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <LinearGradient
        colors={colors ?? [Colors.primaryStrong, Colors.success]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${pct * 100}%` }]}
      />
    </View>
  );
}

const useStyles = (Colors: any) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillText: { fontFamily: 'PlusJakartaSans_700Bold' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  track: { height: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
