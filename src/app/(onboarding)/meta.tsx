import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { OnboardingHeader } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Surface';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/providers/OnboardingProvider';

const OPCOES = [
  { minutos: 30, titulo: 'Casual', descricao: 'Um pouquinho todo dia', icon: 'leaf-outline' },
  { minutos: 60, titulo: 'Regular', descricao: 'Ritmo constante', icon: 'walk-outline' },
  { minutos: 120, titulo: 'Intenso', descricao: 'Semana de provas', icon: 'flame-outline' },
  { minutos: 180, titulo: 'Rato de biblioteca', descricao: 'Modo maratona', icon: 'rocket-outline' },
] as const;

const XP_POR_SESSAO = 10; // RF15

function Opcao({
  item,
  ativa,
  onPress,
}: {
  item: (typeof OPCOES)[number];
  ativa: boolean;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    borderColor: withTiming(ativa ? Colors.primary : Colors.border, { duration: 200 }),
    backgroundColor: withTiming(ativa ? 'rgba(253,186,92,0.08)' : Colors.surface, { duration: 200 }),
  }));
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: ativa }} onPress={onPress}>
      <Animated.View style={[styles.opcao, style]}>
        <View style={[styles.opcaoIcon, ativa && { backgroundColor: Colors.primarySoft }]}>
          <Ionicons name={item.icon} size={22} color={ativa ? Colors.primary : Colors.textSecondary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{item.titulo}</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            {item.descricao}
          </AppText>
        </View>
        <AppText variant="title" color={ativa ? Colors.primary : Colors.text}>
          {item.minutos}
          <AppText variant="caption" color={Colors.textSecondary}>
            {' '}
            min
          </AppText>
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

/** Onboarding 2/3 — definir meta de estudo (RF02). */
export default function OnboardingMeta() {
  const { metaMinutos, setMetaMinutos } = useOnboarding();

  return (
    <Screen
      footer={
        <Button
          testID="onboarding-meta-continuar"
          label="Definir meta"
          iconRight="arrow-forward"
          onPress={() => router.push('/tutorial')}
        />
      }>
      <OnboardingHeader step={2} />

      <Animated.View entering={FadeInDown.duration(450)} style={styles.heading}>
        <AppText variant="display">Qual é a sua{'\n'}meta diária?</AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Quanto tempo você quer estudar por dia? Isso ajuda a manter o seu streak.
        </AppText>
      </Animated.View>

      <View style={styles.list} accessibilityRole="radiogroup">
        {OPCOES.map((o, i) => (
          <Animated.View key={o.minutos} entering={FadeInDown.delay(80 * i).duration(400)}>
            <Opcao item={o} ativa={metaMinutos === o.minutos} onPress={() => setMetaMinutos(o.minutos)} />
          </Animated.View>
        ))}
      </View>

      <Card style={styles.dica}>
        <View style={styles.dicaIcon}>
          <Ionicons name="bulb-outline" size={20} color={Colors.aiText} />
        </View>
        <View style={styles.flex}>
          <AppText variant="label" color={Colors.aiText}>
            Dica do Rato
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary} style={styles.dicaText}>
            Cada sessão concluída rende +{XP_POR_SESSAO} XP. Estudar todos os dias mantém o seu streak vivo 🔥
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.two },
  list: { gap: Spacing.three - 4 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    padding: Spacing.three,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  opcaoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  dica: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    backgroundColor: 'rgba(109,40,217,0.14)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  dicaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.aiSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dicaText: { lineHeight: 18, marginTop: 2 },
});
