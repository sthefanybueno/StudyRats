/** Description: This file (src/app/(app)/ranking.tsx) contains the implementation for its respective feature. */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { Radius, Spacing } from '@/constants/theme';
import type { Usuario } from '@/domain/entities/Usuario';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from "@/providers/ThemeProvider";

export default function RankingScreen() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const { usuario } = useAuth();
  const [usuariosRanking, setUsuariosRanking] = useState<Usuario[]>([]);
  const [, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [origem, setOrigem] = useState<'nuvem' | 'local'>('local');

  // Carregar ranking do Supabase (com fallback local se offline)
  const carregarRanking = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await DIContainer.consultarRanking.execute();
      if (res.isSuccess && res.value.length > 0) {
        let lista = [...res.value];
        if (usuario && !lista.some(u => u.id === usuario.id)) {
          lista.push(usuario);
        }
        lista.sort((a, b) => b.xpSemanal - a.xpSemanal);
        setUsuariosRanking(lista);
        setOrigem('nuvem');
      } else {
        const lista = await DIContainer.repositories.usuario.listarTodos();
        if (usuario && !lista.some(u => u.id === usuario.id)) {
          lista.push(usuario);
        }
        lista.sort((a, b) => b.xpSemanal - a.xpSemanal);
        setUsuariosRanking(lista);
        setOrigem('local');
      }
    } catch (e) {
      console.error('Erro ao carregar ranking:', e);
      if (usuario) setUsuariosRanking([usuario]);
      setOrigem('local');
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregarRanking();
    }, [carregarRanking])
  );

  const handleAtualizar = useCallback(async () => {
    setAtualizando(true);
    try {
      await DIContainer.sincronizarFila.execute().catch(() => {});
      await carregarRanking();
    } finally {
      setAtualizando(false);
    }
  }, [carregarRanking]);

  const userRankIndex = usuariosRanking.findIndex(u => u.id === usuario?.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 1;
  const userXp = usuario?.xpTotal ?? 0;
  const userStreak = usuario?.streakAtual ?? 0;
  const primeiroNome = usuario?.nomeExibicao ?? 'Usuário';

  const usuarioTop1 = usuariosRanking[0];
  const usuarioTop2 = usuariosRanking[1];
  const usuarioTop3 = usuariosRanking[2];

  return (
    <Screen contentStyle={styles.content} edges={['top']} refreshing={atualizando} onRefresh={handleAtualizar}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <BrandMark subtitle={origem === 'nuvem' ? 'Ranking Global' : 'Ranking Local'} />
        <View style={styles.topHeaderRight}>
          <Pill tone={origem === 'nuvem' ? 'success' : 'warning'} dot label={origem === 'nuvem' ? 'Online' : 'Offline'} />
          <View style={styles.avatarBox}>
            {usuario?.fotoUrl ? (
              <Image source={{ uri: usuario.fotoUrl }} style={styles.avatarImageSmall} />
            ) : (
              <AppText variant="label" color={Colors.primary}>
                {primeiroNome[0]?.toUpperCase()}
              </AppText>
            )}
          </View>
        </View>
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.rowGap}>
          <View style={styles.greenDot} />
          <AppText variant="caption" color={Colors.textSecondary}>
            {origem === 'nuvem' ? 'Ranking Global Atualizado' : 'Ranking Local (sem conexão)'}
          </AppText>
        </View>
        <Ionicons name="people-outline" size={16} color={Colors.textMuted} />
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
              {usuario?.nomeUsuario ? (
                <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                  {usuario.nomeUsuario}
                </AppText>
              ) : null}
              <View style={styles.rowGap}>
                <AppText variant="heading" color={Colors.primary}>
                  {userXp.toLocaleString()} <AppText variant="caption" color={Colors.textSecondary}>XP</AppText>
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  • {userRank === 1 ? 'Líder do Ranking! 👑' : `Posição #${userRank}`}
                </AppText>
              </View>
            </View>
            <Pill tone="success" label="● Ativo" />
          </View>
          <View style={styles.userRankFooter}>
            <Pill tone="warning" icon="flame" label={`${userStreak} Dias de Streak`} />
            <Pill tone="neutral" label={origem === 'nuvem' ? 'Dados da Nuvem' : 'Dados Locais do Aparelho'} />
          </View>
        </Card>
      </Animated.View>

      {/* Pódio dos Cadastrados */}
      <View style={styles.podioSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">🏆 Pódio dos Estudantes</AppText>
          <Pill tone="primary" label={`${usuariosRanking.length} ${usuariosRanking.length === 1 ? 'Estudante' : 'Estudantes'}`} />
        </View>

        <View style={styles.podioRow}>
          {[
            { pos: 2 as const, membro: usuarioTop2, corBorda: '#A0AEC0', corTexto: '#A0AEC0', corFundo: Colors.surface, cardStyle: styles.podioCard2 },
            { pos: 1 as const, membro: usuarioTop1, corBorda: Colors.primary, corTexto: Colors.primary, corFundo: Colors.primarySoft, cardStyle: styles.podioCard1 },
            { pos: 3 as const, membro: usuarioTop3, corBorda: '#CD7F32', corTexto: '#CD7F32', corFundo: Colors.surface, cardStyle: styles.podioCard3 },
          ].map(({ pos, membro, corBorda, corTexto, corFundo, cardStyle }) => {
            const isPrimeiro = pos === 1;

            if (!membro) {
              return (
                <View key={pos} style={[styles.podioCard, cardStyle, styles.podioEmpty]}>
                  <View style={[styles.podioRankTag, { backgroundColor: Colors.surfaceRaised, borderColor: Colors.border }]}>
                    <AppText variant="caption" color={Colors.textMuted} style={styles.boldText}>
                      #{pos}
                    </AppText>
                  </View>
                  <View style={styles.podioEmptyAvatar}>
                    <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
                  </View>
                  <AppText variant="caption" color={Colors.textMuted} style={styles.centerText}>
                    Vago
                  </AppText>
                </View>
              );
            }

            const isEu = membro.id === usuario?.id;
            const subtitulo = membro.nomeUsuario || (isEu ? 'Você' : undefined);

            return (
              <View
                key={pos}
                style={[
                  styles.podioCard,
                  cardStyle,
                  { borderColor: corBorda, backgroundColor: isPrimeiro ? corFundo : Colors.surface },
                ]}>
                {isPrimeiro && (
                  <View style={styles.crownBox}>
                    <Ionicons name="trophy" size={16} color={Colors.primary} />
                  </View>
                )}

                <View style={styles.podioAvatarWrap}>
                  <View
                    style={[
                      styles.avatarCircle,
                      isPrimeiro && styles.avatarCircle1,
                      { borderColor: corBorda },
                    ]}>
                    {membro.fotoUrl ? (
                      <Image
                        source={{ uri: membro.fotoUrl }}
                        style={isPrimeiro ? styles.podioAvatarImage1 : styles.podioAvatarImage}
                      />
                    ) : (
                      <AppText variant={isPrimeiro ? 'title' : 'heading'} color={corTexto}>
                        {membro.nomeExibicao[0]?.toUpperCase()}
                      </AppText>
                    )}
                  </View>
                  <View style={[styles.podioMedalBadge, { backgroundColor: isPrimeiro ? Colors.primary : corBorda }]}>
                    <AppText variant="caption" color={isPrimeiro ? Colors.primaryText : '#111827'} style={styles.podioMedalText}>
                      #{pos}
                    </AppText>
                  </View>
                </View>

                <View style={styles.podioNameBlock}>
                  <AppText
                    variant={isPrimeiro ? 'heading' : 'label'}
                    numberOfLines={1}
                    style={styles.centerText}>
                    {membro.nomeExibicao}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={isPrimeiro ? Colors.primary : Colors.textSecondary}
                    numberOfLines={1}
                    style={styles.centerText}>
                    {subtitulo ?? ' '}
                  </AppText>
                </View>

                <View style={styles.podioXpBlock}>
                  <AppText
                    variant={isPrimeiro ? 'title' : 'heading'}
                    color={Colors.primary}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}>
                    {membro.xpTotal.toLocaleString()}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary} style={styles.podioXpLabel}>
                    {isPrimeiro ? 'XP TOTAL' : 'XP'}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Lista de Concorrentes (Ranking Completo) */}
      {usuariosRanking.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <AppText variant="overline" color={Colors.textSecondary}>
              RANKING COMPLETO
            </AppText>
            <AppText variant="overline" color={Colors.textMuted}>
              XP Total
            </AppText>
          </View>

          {usuariosRanking.map((comp, idx) => {
            const rankPos = idx + 1;
            const isUser = comp.id === usuario?.id;

            return (
              <Card
                key={comp.id}
                style={isUser ? styles.userHighlightedRowCard : styles.rankRowCard}>
                <AppText
                  variant="heading"
                  color={isUser ? Colors.primaryText : Colors.textSecondary}
                  style={styles.rankNumber}>
                  #{rankPos}
                </AppText>
                <View style={styles.rowAvatarBox}>
                  {comp.fotoUrl ? (
                    <Image source={{ uri: comp.fotoUrl }} style={styles.listAvatarImage} />
                  ) : (
                    <Ionicons
                      name="person-circle"
                      size={32}
                      color={isUser ? Colors.primaryText : Colors.textMuted}
                    />
                  )}
                </View>
                <View style={styles.flex}>
                  <AppText variant="label" color={isUser ? Colors.primaryText : Colors.text}>
                    {comp.nomeExibicao} {isUser && '(Você)'}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={isUser ? Colors.primaryText : Colors.textSecondary}>
                    {comp.nomeUsuario || comp.email.getValue}
                  </AppText>
                </View>
                <View style={styles.rankRowRight}>
                  <AppText variant="label" color={isUser ? Colors.primaryText : Colors.primary}>
                    {comp.xpTotal.toLocaleString()}{' '}
                    <AppText
                      variant="caption"
                      color={isUser ? Colors.primaryText : Colors.textSecondary}>
                      XP
                    </AppText>
                  </AppText>
                  <AppText
                    variant="caption"
                    color={isUser ? Colors.primaryText : Colors.textMuted}>
                    🔥 {comp.streakAtual}d
                  </AppText>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Footer informativo */}
      <Card style={styles.warningFooterCard}>
        <Ionicons name="cube-outline" size={20} color={Colors.success} />
        <AppText variant="caption" color={Colors.textSecondary} style={styles.flex}>
          {origem === 'nuvem'
            ? 'Exibindo o ranking global dos top 50 estudantes com mais XP na semana.'
            : 'Sem conexão com a nuvem: exibindo apenas os usuários cadastrados neste aparelho.'}
        </AppText>
      </Card>
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
    overflow: 'hidden',
  },
  avatarImageSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  userRankCard: { gap: Spacing.three, padding: Spacing.four - 4, borderColor: Colors.primary, backgroundColor: 'rgba(253,186,92,0.06)' },
  userRankTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2 },
  rankBadgeBox: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  userRankFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  podioSection: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  podioRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  podioCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  podioCard1: { minHeight: 206, borderWidth: 1.5, borderColor: Colors.primary },
  podioCard2: { minHeight: 178 },
  podioCard3: { minHeight: 164 },
  podioEmpty: { justifyContent: 'center', gap: Spacing.two, opacity: 0.6, borderStyle: 'dashed' },
  podioEmptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podioRankTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  crownBox: { marginBottom: -4 },
  podioAvatarWrap: { position: 'relative', alignItems: 'center', marginBottom: 4 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceRaised,
    overflow: 'hidden',
  },
  avatarCircle1: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.primary },
  podioAvatarImage: { width: 42, height: 42, borderRadius: 21 },
  podioAvatarImage1: { width: 52, height: 52, borderRadius: 26 },
  podioMedalBadge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  podioMedalText: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold' },
  podioNameBlock: { width: '100%', alignItems: 'center', gap: 1 },
  podioXpBlock: { width: '100%', alignItems: 'center' },
  podioXpLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: 0.4 },
  listSection: { gap: Spacing.two },
  rankRowCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, padding: Spacing.three },
  userHighlightedRowCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, padding: Spacing.three, backgroundColor: Colors.primary, borderColor: Colors.primaryStrong },
  rankNumber: { width: 32, textAlign: 'center' },
  rowAvatarBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  listAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  rankRowRight: { alignItems: 'flex-end' },
  warningFooterCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, padding: Spacing.three + 2 },
  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});

