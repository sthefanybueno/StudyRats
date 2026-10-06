import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from './AppText';
import { Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from "@/providers/ThemeProvider";
import { Colors as GlobalColors } from "@/constants/theme";

type Variant = 'primary' | 'ai' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: GlobalColors.primary, fg: GlobalColors.primaryText },
  ai: { bg: GlobalColors.aiStrong, fg: '#FFFFFF' },
  secondary: { bg: GlobalColors.surfaceRaised, fg: GlobalColors.text, border: GlobalColors.border },
  ghost: { bg: 'transparent', fg: GlobalColors.textSecondary },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  style,
  testID,
}: ButtonProps) {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Animated.View style={[animated, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[
          styles.base,
          { backgroundColor: p.bg, borderColor: p.border ?? 'transparent', opacity: inactive && !loading ? 0.5 : 1 },
          variant === 'primary' && styles.glow,
        ]}>
        {loading ? (
          <ActivityIndicator color={p.fg} />
        ) : (
          <View style={styles.row}>
            {icon && <Ionicons name={icon} size={20} color={p.fg} />}
            <AppText variant="heading" color={p.fg} style={styles.label}>
              {label}
            </AppText>
            {iconRight && <Ionicons name={iconRight} size={20} color={p.fg} />}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const useStyles = (Colors: any) => StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { fontSize: 16 },
});
