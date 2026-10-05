import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

interface ScreenProps {
  children: ReactNode;
  /** Conteúdo fixo no rodapé (ex.: botão de avançar). */
  footer?: ReactNode;
  contentStyle?: ViewStyle;
}

/** Fundo navy com brilhos suaves âmbar/roxo, scroll e teclado tratados. */
export function Screen({ children, footer, contentStyle }: ScreenProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(139,92,246,0.18)', 'transparent']}
        style={styles.glowTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(253,186,92,0.10)']}
        style={styles.glowBottom}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  glowTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  glowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  footer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
});
