import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

/** Competidores simulados para compor o ranking global e posicionar o usuário dinamicamente */
const TOP_COMPETIDORES = [
  { rank: 1, nome: 'Lucas M.', materia: 'Engenharia • Computação', xp: 2850, streak: '25d', titulo: 'Lenda Madrugada', podio: true },
  { rank: 2, nome: 'Beatriz L.', materia: 'Medicina • Anatomia', xp: 2410, streak: '18d', titulo: 'Mestre do Foco', podio: true },
  { rank: 3, nome: 'Rafael C.', materia: 'Direito • Constitucional', xp: 2190, streak: '15d', titulo: 'Rato Biblioteca', podio: true },
  { rank: 4, nome: 'Mariana Silva', materia: 'Neuroanatomia • Medicina', xp: 2040, streak: '19d' },
  { rank: 5, nome: 'Thiago Souza', materia: 'Algoritmos • C. Computação', xp: 1960, streak: '12d' },
  { rank: 6, nome: 'Clara Nogueira', materia: 'Direito Constitucional', xp: 1890, streak: '16d' },
  { rank: 7, nome: 'Gabriel Ramos', materia: 'Cálculo Diferencial • Eng', xp: 1820, streak: '8d' },
  { rank: 8, nome: 'Sofia Martins', materia: 'Bioquímica Celular', xp: 1750, streak: '22d' },
  { rank: 9, nome: 'Enzo Farias', materia: 'Física Quântica', xp: 1680, streak: '11d' },
  { rank: 10, nome: 'Júlia Duarte', materia: 'Macroeconomia II', xp: 1610, streak: '15d' },
  { rank: 11, nome: 'Felipe Castro', materia: 'Estatística Aplicada', xp: 1570, streak: '9d' },
  { rank: 12, nome: 'Laura Peixoto', materia: 'Farmacologia Clínica', xp: 1510, streak: '14d' },
  { rank: 13, nome: 'Bruno Ribeiro', materia: 'Inteligência Artificial', xp: 1462, streak: '13d' },
  { rank: 15, nome: 'Camila Andrade', materia: 'Direito Penal • OAB', xp: 1390, streak: '6d' },
];

export default function RankingScreen() {
  const { usuario } = useAuth();
  const [subTab, setSubTab] = useState<'geral' | 'faculdade' | 'grupo'>('geral');

  const userXp = usuario?.xpTotal ?? 1420;
  const userStreak = usuario?.streakAtual ?? 14;
  const primeiroNome = usuario?.nomeExibicao ?? 'Alex';

  // Calcular posição do usuário logado dinamicamente com base no seu XP real
  const calcularPosicao = () => {
    let pos = 1;
    for (const c of TOP_COMPETIDORES) {
      if (userXp < c.xp) {
        pos = c.rank + 1;
      }
    }
    return Math.max(1, pos);
  };

  const userRank = calcularPosicao();

  return (
    <Screen contentStyle={styles.content}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Ranking" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync" />
          <View style={styles.avatarBox}>
            <AppText variant="label" color={Colors.primary}>
              {primeiroNome[0]?.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.rowGap}>
          <View style={styles.greenDot} />
          <AppText variant="caption" color={Colors.textSecondary}>
            Ranking Online Atualizado há 5 min • <AppText variant="caption" color={Colors.text} style={styles.boldText}>Top 50</AppText>
          </AppText>
        </View>
        <Ionicons name="refresh-outline" size={16} color={Colors.textMuted} />
      </View>

      {/* Sub Tabs */}
      <View style={styles.subTabRow}>
        <Pressable
          onPress={() => setSubTab('geral')}
          style={[styles.subTab, subTab === 'geral' && styles.subTabActive]}>
          <AppText variant="label" color={subTab === 'geral' ? Colors.text : Colors.textMuted}>
            Geral
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setSubTab('faculdade')}
          style={[styles.subTab, subTab === 'faculdade' && styles.subTabActive]}>
          <AppText variant="label" color={subTab === 'faculdade' ? Colors.text : Colors.textMuted}>
            Minha Faculdade
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setSubTab('grupo')}
          style={[styles.subTab, subTab === 'grupo' && styles.subTabActive]}>
          <AppText variant="label" color={subTab === 'grupo' ? Colors.text : Colors.textMuted}>
            Meu Grupo
          </AppText>
        </Pressable>
      </View>

      {/* Card Fixo do Usuário Logado */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={styles.userRankCard}>
          <View style={styles.userRankTop}>
            <View style={styles.rankBadgeBox}>
              <AppText variant="heading" color={Colors.primaryText} style={styles.boldText}>
                #{userRank}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="title">{primeiroNome} (Você)</AppText>
              <View style={styles.rowGap}>
                <AppText variant="heading" color={Colors.primary}>
                  {userXp.toLocaleString()} <AppText variant="caption" color={Colors.textSecondary}>XP</AppText>
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  • {userRank > 1 ? `${(TOP_COMPETIDORES[userRank - 2]?.xp ?? userXp + 42) - userXp} pts para ultrapassar #${userRank - 1}` : 'Você é o #1!'}
                </AppText>
              </View>
            </View>
            <Pill tone="success" label="↗ +3 hoje! 🚀" />
          </View>
          <View style={styles.userRankFooter}>
            <Pill tone="warning" icon="flame" label={`${userStreak} Dias`} />
            <Pill tone="neutral" label="Multiplicador 1.5x" />
          </View>
        </Card>
      </Animated.View>

      {/* Pódio Semanal (Top 3) */}
      <View style={styles.podioSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">🏆 Pódio Semanal</AppText>
          <AppText variant="overline" color={Colors.textMuted}>
            Temporada 04
          </AppText>
        </View>

        <View style={styles.podioRow}>
          {/* #2 Lugar */}
          <View style={[styles.podioCard, styles.podioCard2]}>
            <View style={[styles.avatarCircle, { borderColor: '#A0AEC0' }]}>
              <Ionicons name="person" size={20} color="#A0AEC0" />
            </View>
            <Pill tone="neutral" label="#2" />
            <AppText variant="label" style={styles.centerText}>
              Beatriz L.
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.centerText}>
              Mestre do Foco
            </AppText>
            <AppText variant="heading" color={Colors.primary}>
              2.410
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              XP
            </AppText>
          </View>

          {/* #1 Lugar (Destaque Central) */}
          <View style={[styles.podioCard, styles.podioCard1]}>
            <View style={styles.crownBox}>
              <Ionicons name="star" size={16} color={Colors.primary} />
            </View>
            <View style={[styles.avatarCircle, styles.avatarCircle1]}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <Pill tone="primary" label="#1" />
            <AppText variant="heading" style={styles.centerText}>
              Lucas M.
            </AppText>
            <AppText variant="caption" color={Colors.primary} style={styles.centerText}>
              Lenda Madrugada
            </AppText>
            <AppText variant="display" color={Colors.primary}>
              2.850
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              XP TOTAL
            </AppText>
          </View>

          {/* #3 Lugar */}
          <View style={[styles.podioCard, styles.podioCard3]}>
            <View style={[styles.avatarCircle, { borderColor: '#CD7F32' }]}>
              <Ionicons name="person" size={20} color="#CD7F32" />
            </View>
            <Pill tone="neutral" label="#3" />
            <AppText variant="label" style={styles.centerText}>
              Rafael C.
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.centerText}>
              Rato Biblioteca
            </AppText>
            <AppText variant="heading" color={Colors.primary}>
              2.190
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              XP
            </AppText>
          </View>
        </View>
      </View>

      {/* Lista de Concorrentes (#4 a #15 + Posição do Usuário) */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="overline" color={Colors.textSecondary}>
            TOP CONCORRENTES (#4 • #15)
          </AppText>
          <AppText variant="overline" color={Colors.textMuted}>
            Sequência / XP
          </AppText>
        </View>

        {TOP_COMPETIDORES.filter(c => !c.podio).map(comp => (
          <Card key={comp.rank} style={styles.rankRowCard}>
            <AppText variant="heading" color={Colors.textSecondary} style={styles.rankNumber}>
              #{comp.rank}
            </AppText>
            <View style={styles.rowAvatarBox}>
              <Ionicons name="person-circle-outline" size={32} color={Colors.textMuted} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">{comp.nome}</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {comp.materia}
              </AppText>
            </View>
            <View style={styles.rankRowRight}>
              <AppText variant="label" color={Colors.primary}>
                {comp.xp.toLocaleString()} <AppText variant="caption" color={Colors.textSecondary}>XP</AppText>
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                🔥 {comp.streak}
              </AppText>
            </View>
          </Card>
        ))}

        {/* Linha Destacada do Usuário Logado */}
        <Card style={styles.userHighlightedRowCard}>
          <AppText variant="heading" color={Colors.primaryText} style={styles.rankNumber}>
            #{userRank}
          </AppText>
          <View style={styles.rowAvatarBox}>
            <Ionicons name="person-circle" size={32} color={Colors.primaryText} />
          </View>
          <View style={styles.flex}>
            <View style={styles.rowGap}>
              <AppText variant="heading" color={Colors.primaryText}>
                {primeiroNome} (Você)
              </AppText>
              <View style={styles.voceBadge}>
                <AppText variant="caption" color="#000" style={styles.boldText}>
                  VOCÊ
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={Colors.primaryText}>
              Sistemas Operacionais • TI
            </AppText>
          </View>
          <View style={styles.rankRowRight}>
            <AppText variant="heading" color={Colors.primaryText}>
              {userXp.toLocaleString()} <AppText variant="caption" color={Colors.primaryText}>XP</AppText>
            </AppText>
            <AppText variant="caption" color={Colors.primaryText}>
              🔥 {userStreak}d
            </AppText>
          </View>
        </Card>
      </View>

      {/* Warning Footer */}
      <Card style={styles.warningFooterCard}>
        <Ionicons name="wifi-outline" size={20} color={Colors.success} />
        <AppText variant="caption" color={Colors.textSecondary} style={styles.flex}>
          O ranking requer conexão com a internet para sincronizar pontuações e conquistas dos outros ratos de estudo em tempo real.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  subTabRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: Colors.surfaceInput, padding: 4, borderRadius: Radius.lg },
  subTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: Radius.md },
  subTabActive: { backgroundColor: Colors.surfaceRaised },
  userRankCard: { gap: Spacing.three, padding: Spacing.four - 4, borderColor: Colors.primary, backgroundColor: 'rgba(253,186,92,0.06)' },
  userRankTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2 },
  rankBadgeBox: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  userRankFooter: { flexDirection: 'row', gap: Spacing.two },
  podioSection: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  podioRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  podioCard: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.two + 2, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  podioCard1: { height: 190, borderColor: Colors.primary, backgroundColor: 'rgba(253,186,92,0.08)' },
  podioCard2: { height: 160 },
  podioCard3: { height: 160 },
  crownBox: { marginBottom: -4 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceRaised },
  avatarCircle1: { width: 52, height: 52, borderRadius: 26, borderColor: Colors.primary },
  listSection: { gap: Spacing.two },
  rankRowCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, padding: Spacing.three },
  userHighlightedRowCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, padding: Spacing.three, backgroundColor: Colors.primary, borderColor: Colors.primaryStrong },
  rankNumber: { width: 32, textAlign: 'center' },
  rowAvatarBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  rankRowRight: { alignItems: 'flex-end' },
  voceBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.pill, backgroundColor: Colors.primaryText },
  warningFooterCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, padding: Spacing.three + 2 },
  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});
