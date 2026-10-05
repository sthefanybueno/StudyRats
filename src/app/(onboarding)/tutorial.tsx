import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OnboardingHeader } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useOnboarding } from '@/providers/OnboardingProvider';

type Passo = {
  icon: keyof typeof Ionicons.glyphMap;
  cor: string;
  fundo: string;
  titulo: string;
  texto: string;
  selos: { label: string; tone: 'primary' | 'ai' | 'success' | 'warning' }[];
};

// Regras de negócio vindas do documento de especificação (RF11–RF20).
const PASSOS: Passo[] = [
  {
    icon: 'flash',
    cor: Colors.primary,
    fundo: Colors.primarySoft,
    titulo: 'Registre suas sessões',
    texto: 'Escolha disciplina, tópico e duração. Foto e localização são opcionais.',
    selos: [{ label: '+10 XP por sessão', tone: 'primary' }],
  },
  {
    icon: 'flame',
    cor: Colors.warning,
    fundo: Colors.warningSoft,
    titulo: 'Mantenha o streak',
    texto: 'Estude pelo menos uma sessão por dia. A cada 7 dias seguidos você ganha bônus.',
    selos: [{ label: '+50 XP a cada 7 dias', tone: 'warning' }],
  },
  {
    icon: 'cloud-offline',
    cor: Colors.success,
    fundo: Colors.successSoft,
    titulo: 'Funciona sem internet',
    texto: 'Tudo é salvo no aparelho e sincronizado sozinho quando a conexão voltar.',
    selos: [
      { label: 'Sincronizado', tone: 'success' },
      { label: 'Pendente', tone: 'warning' },
    ],
  },
  {
    icon: 'sparkles',
    cor: Colors.aiText,
    fundo: Colors.aiSoft,
    titulo: 'Resumos com IA',
    texto: 'Gere resumos dos seus tópicos e leia depois, mesmo offline. Gerar precisa de internet.',
    selos: [{ label: 'Até 10 por dia', tone: 'ai' }],
  },
  {
    icon: 'trophy',
    cor: Colors.primary,
    fundo: Colors.primarySoft,
    titulo: 'Ranking semanal',
    texto: 'Dispute o Top 50 pelo XP da semana. O placar zera toda segunda-feira.',
    selos: [{ label: 'Top 50 global', tone: 'primary' }],
  },
];

/** Onboarding 3/3 — tutorial rápido (RF02). Conclui o UC03. */
export default function OnboardingTutorial() {
  const { usuario, concluirOnboarding } = useAuth();
  const { metaMinutos } = useOnboarding();

  return (
    <Screen
      footer={
        <Button
          testID="onboarding-concluir"
          label="Começar a estudar"
          icon="rocket-outline"
          onPress={concluirOnboarding}
        />
      }>
      <OnboardingHeader step={3} />

      <Animated.View entering={FadeInDown.duration(450)} style={styles.heading}>
        <AppText variant="display">Como funciona{'\n'}a toca 🐀</AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Em 30 segundos você já sabe tudo para começar a ganhar XP.
        </AppText>
      </Animated.View>

      <View style={styles.list}>
        {PASSOS.map((p, i) => (
          <Animated.View key={p.titulo} entering={FadeInDown.delay(90 * i).duration(450)}>
            <Card style={styles.item}>
              <View style={[styles.icon, { backgroundColor: p.fundo }]}>
                <Ionicons name={p.icon} size={22} color={p.cor} />
              </View>
              <View style={styles.body}>
                <AppText variant="heading">{p.titulo}</AppText>
                <AppText variant="caption" color={Colors.textSecondary} style={styles.texto}>
                  {p.texto}
                </AppText>
                <View style={styles.selos}>
                  {p.selos.map(s => (
                    <Pill key={s.label} tone={s.tone} dot label={s.label} />
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(450)}>
        <Card style={styles.resumo}>
          <AppText variant="overline" color={Colors.primary}>
            Seu ponto de partida
          </AppText>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <AppText variant="title">{usuario?.xpTotal ?? 0}</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <AppText variant="title">{usuario?.streakAtual ?? 0}</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                dias de streak
              </AppText>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <AppText variant="title" color={Colors.primary}>
                {metaMinutos}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                min/dia
              </AppText>
            </View>
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.two },
  list: { gap: Spacing.three - 4 },
  item: { flexDirection: 'row', gap: Spacing.three - 2 },
  icon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  texto: { lineHeight: 18 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  resumo: {
    gap: Spacing.three,
    padding: Spacing.four - 4,
    borderColor: 'rgba(253,186,92,0.35)',
    backgroundColor: 'rgba(253,186,92,0.06)',
  },
  stats: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 32, backgroundColor: Colors.border },
});
