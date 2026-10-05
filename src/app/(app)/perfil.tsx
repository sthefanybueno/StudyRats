import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill, ProgressBar } from '@/components/ui/Surface';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  // Configurações Locais Toggles
  const [lembreteStreak, setLembreteStreak] = useState(true);
  const [modoOfflinePrioritario, setModoOfflinePrioritario] = useState(true);

  // Sync Engine State
  const [sincronizando, setSincronizando] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [qtdPendentes, setQtdPendentes] = useState(2);

  // Carregar contagem de pendências locais da fila
  const carregarFila = useCallback(async () => {
    try {
      // Simulação da verificação da fila local de outbox
      setQtdPendentes(2);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarFila();
    }, [carregarFila])
  );

  // Forçar Sincronização
  const handleForcarSincronizacao = async () => {
    setSincronizando(true);
    setSyncFeedback(null);
    try {
      const res = await DIContainer.sincronizarFila.execute();
      if (res.falhas === 0) {
        setQtdPendentes(0);
        setSyncFeedback(`Sincronização concluída! ${res.processados} itens sincronizados.`);
      } else {
        setSyncFeedback(`Processados: ${res.processados}, Falhas: ${res.falhas}`);
      }
    } catch (e: any) {
      setSyncFeedback(e.message || 'Falha na conexão com o servidor');
    } finally {
      setSincronizando(false);
    }
  };

  const xpTotal = usuario?.xpTotal ?? 14850;
  const xpSemanal = usuario?.xpSemanal ?? 1420;
  const streakAtual = usuario?.streakAtual ?? 14;
  const nivelCalculado = Math.floor(xpTotal / 100) + 1;
  const primeiroNome = usuario?.nomeExibicao ?? 'Alex Ferreira';
  const emailVal = usuario?.email.getValue ?? 'alex@studyrats.app';
  const handleVal = `@${primeiroNome.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <Screen contentStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Perfil" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync" />
          <View style={styles.avatarBox}>
            <AppText variant="label" color={Colors.primary}>
              {primeiroNome[0]?.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      {/* User Profile Hero Card */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={styles.profileHeroCard}>
          <View style={styles.profileHeroTop}>
            <View style={styles.largeAvatarContainer}>
              <View style={styles.largeAvatarCircle}>
                <Ionicons name="person" size={32} color={Colors.primary} />
              </View>
              <View style={styles.heroLevelBadge}>
                <AppText variant="caption" style={styles.heroLevelBadgeText}>
                  Lv.{nivelCalculado}
                </AppText>
              </View>
            </View>

            <View style={styles.flex}>
              <View style={styles.rowGap}>
                <AppText variant="title">{primeiroNome}</AppText>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {handleVal} • {emailVal}
              </AppText>
              <View style={styles.veteranoBadge}>
                <View style={styles.amberDot} />
                <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                  Rato Veterano
                </AppText>
              </View>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpProgressBlock}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Progresso para Nível {nivelCalculado + 1}
              </AppText>
              <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                {xpTotal.toLocaleString()} / {(nivelCalculado * 1000).toLocaleString()} XP
              </AppText>
            </View>
            <ProgressBar progress={0.85} colors={[Colors.primary, Colors.success]} />
          </View>

          {/* Conquistas em Destaque */}
          <View style={styles.conquistasBlock}>
            <AppText variant="overline" color={Colors.textSecondary}>
              CONQUISTAS EM DESTAQUE
            </AppText>
            <View style={styles.conquistasRow}>
              <Pill tone="primary" icon="trophy-outline" label="Madrugador Supremo" />
              <Pill tone="success" icon="checkmark-done-outline" label="Meta 100%" />
              <Pill tone="warning" icon="flash-outline" label="Foco Contínuo" />
              <Pill tone="ai" icon="sparkles-outline" label="IA Explorer" />
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Estatísticas Vituais Grid (4 Cards) */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">Estatísticas Vituais</AppText>
          <View style={styles.rowGap}>
            <Ionicons name="flash-outline" size={14} color={Colors.success} />
            <AppText variant="caption" color={Colors.success} style={styles.boldText}>
              Em Ritmo Acelerado
            </AppText>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Card 1: Streak */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Streak Atual
              </AppText>
              <Ionicons name="flame-outline" size={16} color={Colors.primary} />
            </View>
            <AppText variant="display" color={Colors.primary}>
              {streakAtual} Dias
            </AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Recorde: 21 dias
            </AppText>
          </Card>

          {/* Card 2: XP Vitalício */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP Vitalício
              </AppText>
              <Ionicons name="star-outline" size={16} color={Colors.primary} />
            </View>
            <AppText variant="title">{xpTotal.toLocaleString()} XP</AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Top 5% da Turma
            </AppText>
          </Card>

          {/* Card 3: XP Semanal */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP Semanal
              </AppText>
              <Ionicons name="stats-chart-outline" size={16} color={Colors.success} />
            </View>
            <AppText variant="title" color={Colors.success}>
              {xpSemanal.toLocaleString()} XP
            </AppText>
            <AppText variant="caption" color={Colors.success} style={styles.boldText}>
              📈 Ritmo Imbatível
            </AppText>
          </Card>

          {/* Card 4: Horas Totais */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Horas Totais
              </AppText>
              <Ionicons name="time-outline" size={16} color={Colors.aiText} />
            </View>
            <AppText variant="title">128 Horas</AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              ⏱️ Produtividade alta
            </AppText>
          </Card>
        </View>
      </View>

      {/* Fila Local (Offline-First) Sync Box */}
      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <Card style={styles.syncBoxCard}>
          <View style={styles.syncBoxHeader}>
            <View style={styles.syncIconCircle}>
              <Ionicons name="sync-outline" size={20} color={Colors.success} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading">Fila Local (Offline-First)</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {qtdPendentes > 0 ? `${qtdPendentes} itens aguardando conexão` : 'Todos os itens sincronizados!'}
              </AppText>
            </View>
            <Pill tone="success" dot label="Ativo" />
          </View>

          {qtdPendentes > 0 && (
            <View style={styles.syncItemsList}>
              <View style={styles.syncItemRow}>
                <View style={styles.amberDot} />
                <AppText variant="caption" color={Colors.text} style={styles.flex}>
                  Sessão Física Clássica: 60m + 2 fotos
                </AppText>
                <Pill tone="warning" icon="wifi-outline" label="Aguardando Wi-Fi" />
              </View>

              <View style={styles.syncItemRow}>
                <View style={styles.greenDot} />
                <AppText variant="caption" color={Colors.text} style={styles.flex}>
                  Resumo IA: Termodinâmica
                </AppText>
                <Pill tone="success" icon="checkmark-circle-outline" label="Cache OK" />
              </View>
            </View>
          )}

          {syncFeedback && (
            <AppText variant="caption" color={syncFeedback.includes('Erro') ? Colors.danger : Colors.success}>
              {syncFeedback}
            </AppText>
          )}

          <Button
            label="Forçar Sincronização Agora"
            variant="secondary"
            icon="sync-outline"
            loading={sincronizando}
            onPress={handleForcarSincronizacao}
          />
        </Card>
      </Animated.View>

      {/* Configurações de Sincronia */}
      <View style={styles.configSection}>
        <AppText variant="heading">Configurações de Sincronia</AppText>

        <Card style={styles.configCard}>
          {/* Toggle 1: Lembretes de Streak */}
          <View style={styles.configItem}>
            <View style={styles.configIconBox}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">Lembretes de Streak</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Alertas diários para preservar os 14 dias
              </AppText>
            </View>
            <Pressable
              onPress={() => setLembreteStreak(l => !l)}
              style={[styles.toggleSwitch, lembreteStreak && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, lembreteStreak && styles.toggleKnobActive]} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Toggle 2: Modo Offline Prioritário */}
          <View style={styles.configItem}>
            <View style={styles.configIconBox}>
              <Ionicons name="cloud-offline-outline" size={20} color={Colors.success} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">Modo Offline Prioritário</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Economiza 4G/5G gravando localmente
              </AppText>
            </View>
            <Pressable
              onPress={() => setModoOfflinePrioritario(m => !m)}
              style={[styles.toggleSwitch, modoOfflinePrioritario && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, modoOfflinePrioritario && styles.toggleKnobActive]} />
            </Pressable>
          </View>
        </Card>
      </View>

      {/* Footer info & Logout */}
      <View style={styles.perfilFooter}>
        <View style={styles.rowCenter}>
          <View style={styles.greenDot} />
          <AppText variant="caption" color={Colors.textMuted}>
            StudyRats v2.4 (Build Offline Resilient) • Logs Locais
          </AppText>
        </View>

        <Button
          testID="logout-btn"
          label="Encerrar Sessão Segura"
          variant="secondary"
          icon="log-out-outline"
          onPress={logout}
        />

        <View style={styles.rowCenter}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.success} />
          <AppText variant="caption" color={Colors.textMuted}>
            Seus dados continuam criptografados e salvos neste celular
          </AppText>
        </View>
      </View>
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
  profileHeroCard: { gap: Spacing.three, padding: Spacing.four - 4 },
  profileHeroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  largeAvatarContainer: { position: 'relative' },
  largeAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLevelBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: Colors.aiStrong,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  heroLevelBadgeText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFF' },
  veteranoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  amberDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  xpProgressBlock: { gap: 6 },
  conquistasBlock: { gap: 8 },
  conquistasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsSection: { gap: Spacing.two + 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridStatCard: { width: '48%', gap: 4, padding: Spacing.three },
  syncBoxCard: { gap: Spacing.three, padding: Spacing.four - 4, backgroundColor: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.25)' },
  syncBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  syncIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  syncItemsList: { gap: Spacing.two },
  syncItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceInput, padding: Spacing.two + 2, borderRadius: Radius.md },
  configSection: { gap: Spacing.two + 4 },
  configCard: { padding: Spacing.three },
  configItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, paddingVertical: 4 },
  configIconBox: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  toggleSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceInput, borderWidth: 1, borderColor: Colors.border, padding: 2 },
  toggleSwitchActive: { backgroundColor: Colors.success },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.textMuted },
  toggleKnobActive: { backgroundColor: '#FFF', alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.two },
  perfilFooter: { gap: Spacing.three, marginTop: Spacing.two },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
});
