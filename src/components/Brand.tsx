import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AppText } from './ui/AppText';
import { Colors, Radius, Spacing } from '@/constants/theme';

const logo = require('../../assets/images/logo-glow.png');

/** Logo + nome do app, como no header das telas do Stitch. */
export function BrandMark({ subtitle, size = 'md' }: { subtitle?: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 72 : 44;
  return (
    <View style={[styles.brand, size === 'lg' && styles.brandLg]}>
      <View style={[styles.logoBox, { width: box, height: box, borderRadius: box * 0.28 }]}>
        <Image source={logo} style={{ width: box * 0.8, height: box * 0.8 }} contentFit="contain" />
      </View>
      <View style={size === 'lg' && styles.center}>
        <AppText variant={size === 'lg' ? 'display' : 'heading'}>StudyRats</AppText>
        {subtitle && (
          <AppText variant="caption" color={Colors.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
    </View>
  );
}

function Segment({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    flex: withTiming(active ? 2.2 : 1, { duration: 280 }),
    backgroundColor: withTiming(active ? Colors.primary : Colors.surfaceRaised, { duration: 280 }),
  }));
  return <Animated.View style={[styles.segment, style]} />;
}

/** Cabeçalho do onboarding (RF02): voltar + "Passo X de 3" + barra segmentada. */
export function OnboardingHeader({ step, total = 3, canGoBack = true }: { step: number; total?: number; canGoBack?: boolean }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <AppText variant="overline" color={Colors.textSecondary}>
          Passo {step} de {total}
        </AppText>
        <View style={styles.back} />
      </View>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <Segment key={i} active={i + 1 <= step} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 4 },
  brandLg: { flexDirection: 'column', gap: Spacing.three },
  center: { alignItems: 'center' },
  logoBox: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: { flexDirection: 'row', gap: 6 },
  segment: { height: 6, borderRadius: Radius.pill },
});
