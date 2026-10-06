import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill, ProgressBar } from '@/components/ui/Surface';
import { Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import type { SessaoEstudo } from '@/domain/entities/SessaoEstudo';
import { useAuth } from '@/providers/AuthProvider';
import { formatarTempoRegressivo, useSessaoFoco } from '@/providers/SessaoFocoProvider';
import { useAppTheme } from "@/providers/ThemeProvider";

export default function DashboardScreen() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const { usuario } = useAuth();
  const { sessaoAtiva, pausarSessao, retomarSessao, concluirSessao } = useSessaoFoco();
  const [carregando, setCarregando] = useState(true);
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>([]);
  const [disciplinasMap, setDisciplinasMap] = useState<Map<string, Disciplina>>(new Map());
  const [salvandoSessao, setSalvandoSessao] = useState(false);

  // Concluir Sessão diretamente do Dashboard
  const handleConcluirSessaoDashboard = async () => {
    if (!usuario) return;
    setSalvandoSessao(true);
    const res = await concluirSessao(usuario.id);
    setSalvandoSessao(false);
    if (res.isSuccess) {
      await carregarDadosLocais();
    }
  };

  // Carregar dados reais locais a cada foco na tela
  const carregarDadosLocais = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    try {
      const listDisciplinas = await DIContainer.repositories.disciplina.listarPorUsuario(usuario.id);
      const listSessoes = await DIContainer.repositories.sessao.listarPorUsuario(usuario.id);

      const mapD = new Map<string, Disciplina>();
      listDisciplinas.forEach(d => mapD.set(d.id, d));
      setDisciplinasMap(mapD);

      setSessoes(listSessoes);
    } catch (e) {
      console.error('Erro ao carregar dados locais:', e);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregarDadosLocais();
    }, [carregarDadosLocais])
  );

  // Cálculos dinâmicos com base nas entidades locais
  const xpTotal = usuario?.xpTotal ?? 0;
  const xpSemanal = usuario?.xpSemanal ?? 0;
  const streakAtual = usuario?.streakAtual ?? 0;
  const nivelCalculado = Math.floor(xpTotal / 100) + 1;
  const xpProximoNivel = nivelCalculado * 100;
  const xpProgressoNivel = xpTotal % 100;

  // Minutos estudados hoje
  const hojeStr = new Date().toISOString().split('T')[0];
  const sessoesHoje = sessoes.filter(
    s => s.createdAt && s.createdAt.toISOString().split('T')[0] === hojeStr
  );
  const minutosHoje = sessoesHoje.reduce((acc, s) => acc + s.duracaoMinutos, 0);
  const metaMinutos = 60;
  const metaPorcentagem = Math.min(100, Math.round((minutosHoje / metaMinutos) * 100));

  const primeiroNome = usuario?.nomeExibicao.split(' ')[0] ?? 'Estudante';

  return (
    <Screen contentStyle={styles.content}>
      {/* Top Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.topHeader}>
        <BrandMark subtitle="Dashboard" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync" />
          <View style={styles.avatarBox}>
            <AppText variant="label" color={Colors.primary}>
              {primeiroNome[0]?.toUpperCase()}
            </AppText>
            <View style={styles.levelBadge}>
              <AppText variant="caption" style={styles.levelBadgeText}>
                Nv.{nivelCalculado}
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Greeting / Tactical Header */}
      <Animated.View entering={FadeInDown.delay(60).duration(450)} style={styles.greetingHeader}>
        <View style={styles.flex}>
          <AppText variant="overline" color={Colors.textSecondary}>
            PAINEL TÁTICO
          </AppText>
          <AppText variant="display">Fala, {primeiroNome}! ⚡</AppText>
        </View>
        <View style={styles.nivelPill}>
          <Ionicons name="trophy" size={14} color={Colors.aiText} />
          <AppText variant="caption" color={Colors.aiText} style={styles.boldText}>
            Nível {nivelCalculado}
          </AppText>
        </View>
      </Animated.View>

      {/* HERO CTA PRINCIPAL: Sessão de Foco (Super Destaque #1) */}
      <Animated.View entering={FadeInDown.delay(100).duration(450)}>
        {sessaoAtiva ? (
          <Card accent={sessaoAtiva.disciplina.cor} style={styles.activeSessionDashboardCard}>
            <View style={styles.activeSessionHeader}>
              <View style={styles.rowInlineGap}>
                <Ionicons name="timer-outline" size={20} color={Colors.primary} />
                <AppText variant="title">Sessão de Foco</AppText>
              </View>
              <Pill
                tone={sessaoAtiva.emExecucao ? 'success' : 'warning'}
                dot
                label={sessaoAtiva.emExecucao ? 'EM EXECUÇÃO' : 'PAUSADO'}
              />
            </View>

            <View style={styles.activeSessionBody}>
              <View style={styles.flex}>
                <AppText variant="heading" color={sessaoAtiva.disciplina.cor}>
                  {sessaoAtiva.disciplina.nome}
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {sessaoAtiva.topico ? sessaoAtiva.topico.nome : 'Sem tópico específico'}
                </AppText>
              </View>

              <View style={styles.timerBoxDashboard}>
                <AppText variant="display" color={Colors.primary} style={styles.timerTextDashboard}>
                  {formatarTempoRegressivo(sessaoAtiva.segundosDecorridos, sessaoAtiva.duracaoAlvoMinutos)}
                </AppText>
              </View>
            </View>

            {/* Botões de Ação da Sessão de Foco */}
            <View style={styles.activeSessionActions}>
              {sessaoAtiva.emExecucao ? (
                <Button
                  label="Pausar"
                  icon="pause"
                  variant="secondary"
                  onPress={pausarSessao}
                  style={styles.flex}
                />
              ) : (
                <Button
                  label="Retomar"
                  icon="play"
                  variant="primary"
                  onPress={retomarSessao}
                  style={styles.flex}
                />
              )}

              <Button
                label="Concluir Sessão"
                icon="checkmark-circle"
                variant="primary"
                loading={salvandoSessao}
                onPress={handleConcluirSessaoDashboard}
                style={styles.flex}
              />
            </View>
          </Card>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar Nova Sessão de Foco"
            onPress={() => router.push('/sessao/nova')}
            style={({ pressed }) => [styles.heroActionBanner, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}>
            <View style={styles.heroActionIconCircle}>
              <Ionicons name="play" size={26} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <View style={styles.rowInlineGap}>
                <AppText variant="title" color={Colors.primaryText} style={styles.boldText}>
                  Sessão de Foco
                </AppText>
              </View>
              <AppText variant="caption" color="rgba(255, 255, 255, 0.85)" style={styles.boldText}>
                Iniciar Nova Sessão • Cronômetro & Registro Local
              </AppText>
            </View>
            <View style={styles.heroActionArrowCircle}>
              <Ionicons name="arrow-forward" size={22} color={Colors.primary} />
            </View>
          </Pressable>
        )}
      </Animated.View>

      {/* Card de Streak & Multiplicador */}
      <Animated.View entering={FadeInDown.delay(140).duration(450)}>
        <Card style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.flameCircle}>
              <Ionicons name="flame" size={24} color={Colors.primary} />
            </View>
            <View>
              <View style={styles.rowInline}>
                <AppText variant="title">{streakAtual}</AppText>
                <AppText variant="heading"> {streakAtual === 1 ? 'Dia Seguido' : 'Dias Seguidos'}</AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {streakAtual > 0 ? 'Ritmo Imparável' : 'Inicie seu streak hoje'}
              </AppText>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Pill tone="primary" icon="flash" label="1.5x XP Ativo" />
            <AppText variant="caption" color={Colors.textMuted} style={styles.rightAlign}>
              Multiplicador do dia
            </AppText>
          </View>
        </Card>
      </Animated.View>

      {/* Card de Progresso de XP */}
      <Animated.View entering={FadeInDown.delay(180).duration(450)}>
        <Card style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={styles.rowGap}>
              <Ionicons name="flash" size={16} color={Colors.primary} />
              <AppText variant="label">Progresso de XP</AppText>
            </View>
            <AppText variant="label" color={Colors.primary}>
              {xpProgressoNivel} <AppText variant="caption" color={Colors.textSecondary}>/ 100 XP para Nv. {nivelCalculado + 1}</AppText>
            </AppText>
          </View>
          <ProgressBar progress={xpProgressoNivel / 100} />
          <View style={styles.xpFooter}>
            <AppText variant="caption" color={Colors.textSecondary}>
              Total acumulado: {xpTotal} XP
            </AppText>
            <AppText variant="caption" color={Colors.success} style={styles.boldText}>
              {metaPorcentagem >= 100 ? 'Meta de hoje batida! 🎉' : 'Meta de hoje quase lá!'}
            </AppText>
          </View>
        </Card>
      </Animated.View>

      {/* Grid de Estatísticas Rápidas (3 Cards calculados em tempo real) */}
      <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            {minutosHoje > 0 && <Pill tone="success" label={`+${minutosHoje}m`} />}
          </View>
          <AppText variant="title">{minutosHoje >= 60 ? `${Math.floor(minutosHoje / 60)}h ${minutosHoje % 60}m` : `${minutosHoje}m`}</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            Tempo Hoje
          </AppText>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="trophy-outline" size={18} color={Colors.aiText} />
            <Pill tone="ai" label="XP" />
          </View>
          <AppText variant="title">{xpSemanal}</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            XP Semanal
          </AppText>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statTop}>
            <Ionicons name="options-outline" size={18} color={Colors.primary} />
            <Ionicons name="pie-chart-outline" size={16} color={Colors.success} />
          </View>
          <AppText variant="title">{metaPorcentagem}%</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            Meta Diária
          </AppText>
        </Card>
      </Animated.View>

      {/* Seção de Histórico Recente de Sessões do Usuário */}
      <Animated.View entering={FadeInDown.delay(360).duration(450)} style={styles.historicoSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.rowGap}>
            <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            <AppText variant="heading">Histórico Recente</AppText>
          </View>
        </View>

        {sessoes.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={36} color={Colors.textMuted} />
            <AppText variant="heading" style={styles.centerText}>
              Nenhuma sessão gravada ainda
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
              Comece agora registrando sua primeira sessão para ganhar +10 XP e salvar localmente no dispositivo!
            </AppText>
            <Button
              label="Registrar primeira sessão"
              icon="add-circle-outline"
              variant="secondary"
              onPress={() => router.push('/sessao/nova')}
            />
          </Card>
        ) : (
          sessoes.slice(0, 5).map(sessao => {
            const disc = disciplinasMap.get(sessao.disciplinaId);
            const nomeDisciplina = disc ? disc.nome : 'Disciplina';
            const corDisciplina = disc ? disc.cor : Colors.primary;
            const isSynced = sessao.syncStatus.value === 'synced';

            return (
              <Card key={sessao.id} accent={corDisciplina} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={styles.flex}>
                    <AppText variant="heading">{nomeDisciplina}</AppText>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Sessão de {sessao.duracaoMinutos} minutos
                    </AppText>
                  </View>
                  <Pill tone="primary" icon="flash" label="+10 XP" />
                </View>

                {sessao.foto && (
                  <View style={styles.thumbContainer}>
                    <Image source={{ uri: sessao.foto.uriLocal }} style={styles.thumbImage} contentFit="cover" />
                    <View style={styles.thumbOverlay}>
                      <Ionicons name="camera-outline" size={12} color="#FFF" />
                      <AppText variant="caption" color="#FFF" style={styles.boldText}>
                        1 foto anexada
                      </AppText>
                    </View>
                  </View>
                )}

                <View style={styles.historyBadgesRow}>
                  {isSynced ? (
                    <Pill tone="success" dot label="Sincronizado" />
                  ) : (
                    <Pill tone="warning" dot label="Salvo Localmente (Offline)" />
                  )}
                  {sessao.coordenada && (
                    <Pill tone="neutral" icon="location-outline" label="Localização capturada" />
                  )}
                </View>

                <View style={styles.historyFooter}>
                  <AppText variant="caption" color={Colors.textMuted}>
                    ⏱ {sessao.duracaoMinutos} min • {sessao.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </View>
              </Card>
            );
          })
        )}
      </Animated.View>

      {/* Card Dica do Rato */}
      <Animated.View entering={FadeInDown.delay(420).duration(450)}>
        <Card style={styles.dicaRatoCard}>
          <View style={styles.dicaRatoHeader}>
            <View style={styles.purpleCircle}>
              <Ionicons name="bulb-outline" size={20} color={Colors.aiText} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label" color={Colors.aiText}>
                Dica do Rato
              </AppText>
            </View>
            <Pill tone="success" label="100% BLINDADO" />
          </View>
          <AppText variant="caption" color={Colors.textSecondary} style={styles.dicaRatoText}>
            Você está protegido offline. Seus registros ficam gravados no armazenamento do aparelho e sobem sozinhos quando houver internet!
          </AppText>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const useStyles = (Colors: any) => StyleSheet.create({
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
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.aiStrong,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  levelBadgeText: { fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFF' },
  greetingHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nivelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.aiSoft,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four - 4,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2 },
  flameCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRight: { alignItems: 'flex-end', gap: 4 },
  rowInline: { flexDirection: 'row', alignItems: 'baseline' },
  rightAlign: { textAlign: 'right' },
  xpCard: { gap: Spacing.two + 2, padding: Spacing.four - 4 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroActionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four - 4,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.primaryStrong,
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroActionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSessionDashboardCard: {
    gap: Spacing.three,
    padding: Spacing.four - 4,
    borderColor: Colors.primary,
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeSessionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceInput,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  timerBoxDashboard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  timerTextDashboard: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  activeSessionActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowInlineGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, padding: Spacing.three - 2, gap: 6 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historicoSection: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  centerText: { textAlign: 'center' },
  historyCard: { gap: Spacing.two + 2, padding: Spacing.three + 2 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  thumbContainer: {
    height: 120,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  historyBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyFooter: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  dicaRatoCard: {
    gap: Spacing.two,
    padding: Spacing.three + 2,
    backgroundColor: 'rgba(109,40,217,0.12)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  dicaRatoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  purpleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.aiSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dicaRatoText: { lineHeight: 18 },
  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
});
