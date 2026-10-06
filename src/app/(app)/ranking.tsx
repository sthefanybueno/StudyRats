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
  const [carregando, setCarregando] = useState(true);

  // Carregar usuários reais cadastrados no banco local
  const carregarRanking = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await DIContainer.repositories.usuario.listarTodos();
      // Garantir que o usuário atual está na lista se estiver logado
      if (usuario && !lista.some(u => u.id === usuario.id)) {
        lista.push(usuario);
      }
      // Ordenar por XP Total (decrescente)
      lista.sort((a, b) => b.xpTotal - a.xpTotal);
      setUsuariosRanking(lista);
    } catch (e) {
      console.error('Erro ao carregar ranking:', e);
      if (usuario) setUsuariosRanking([usuario]);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregarRanking();
    }, [carregarRanking])
  );

  const userRankIndex = usuariosRanking.findIndex(u => u.id === usuario?.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 1;
  const userXp = usuario?.xpTotal ?? 0;
  const userStreak = usuario?.streakAtual ?? 0;
  const primeiroNome = usuario?.nomeExibicao ?? 'Usuário';

  const usuarioTop1 = usuariosRanking[0];
  const usuarioTop2 = usuariosRanking[1];
  const usuarioTop3 = usuariosRanking[2];
  const outrosUsuarios = usuariosRanking.slice(3);

  return (
    <Screen contentStyle={styles.content}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Ranking Local" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync Local" />
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
            Ranking Local Atualizado • <AppText variant="caption" color={Colors.text} style={styles.boldText}>{usuariosRanking.length} {usuariosRanking.length === 1 ? 'Usuário Cadastrado' : 'Usuários Cadastrados'}</AppText>
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
            <Pill tone="neutral" label="Dados Locais do Aparelho" />
          </View>
        </Card>
      </Animated.View>

      {/* Pódio dos Cadastrados */}
      <View style={styles.podioSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">🏆 Pódio dos Estudantes</AppText>
          <Pill tone="primary" label={`${usuariosRanking.length} Cadastrado(s)`} />
        </View>

        <View style={styles.podioRow}>
          {/* #2 Lugar */}
          {usuarioTop2 ? (
            <View style={[styles.podioCard, styles.podioCard2]}>
              <View style={[styles.avatarCircle, { borderColor: '#A0AEC0' }]}>
                {usuarioTop2.fotoUrl ? (
                  <Image source={{ uri: usuarioTop2.fotoUrl }} style={styles.podioAvatarImage} />
                ) : (
                  <AppText variant="label" color="#A0AEC0">
                    {usuarioTop2.nomeExibicao[0]?.toUpperCase()}
                  </AppText>
                )}
              </View>
              <Pill tone="neutral" label="#2" />
              <AppText variant="label" numberOfLines={1} style={styles.centerText}>
                {usuarioTop2.nomeExibicao}
              </AppText>
              {usuarioTop2.nomeUsuario ? (
                <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
                  {usuarioTop2.nomeUsuario}
                </AppText>
              ) : null}
              <AppText variant="heading" color={Colors.primary}>
                {usuarioTop2.xpTotal}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP
              </AppText>
            </View>
          ) : (
            <View style={[styles.podioCard, styles.podioCard2, styles.podioEmpty]}>
              <Ionicons name="person-outline" size={24} color={Colors.textMuted} />
              <AppText variant="caption" color={Colors.textMuted}>
                Vago
              </AppText>
            </View>
          )}

          {/* #1 Lugar (Destaque Central) */}
          {usuarioTop1 && (
            <View style={[styles.podioCard, styles.podioCard1]}>
              <View style={styles.crownBox}>
                <Ionicons name="star" size={16} color={Colors.primary} />
              </View>
              <View style={[styles.avatarCircle, styles.avatarCircle1]}>
                {usuarioTop1.fotoUrl ? (
                  <Image source={{ uri: usuarioTop1.fotoUrl }} style={styles.podioAvatarImage1} />
                ) : (
                  <AppText variant="title" color={Colors.primary}>
                    {usuarioTop1.nomeExibicao[0]?.toUpperCase()}
                  </AppText>
                )}
              </View>
              <Pill tone="primary" label="#1" />
              <AppText variant="heading" numberOfLines={1} style={styles.centerText}>
                {usuarioTop1.nomeExibicao}
              </AppText>
              <AppText variant="caption" color={Colors.primary} style={styles.centerText}>
                {usuarioTop1.nomeUsuario || (usuarioTop1.id === usuario?.id ? 'Você' : 'Líder')}
              </AppText>
              <AppText variant="display" color={Colors.primary}>
                {usuarioTop1.xpTotal}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP TOTAL
              </AppText>
            </View>
          )}

          {/* #3 Lugar */}
          {usuarioTop3 ? (
            <View style={[styles.podioCard, styles.podioCard3]}>
              <View style={[styles.avatarCircle, { borderColor: '#CD7F32' }]}>
                {usuarioTop3.fotoUrl ? (
                  <Image source={{ uri: usuarioTop3.fotoUrl }} style={styles.podioAvatarImage} />
                ) : (
                  <AppText variant="label" color="#CD7F32">
                    {usuarioTop3.nomeExibicao[0]?.toUpperCase()}
                  </AppText>
                )}
              </View>
              <Pill tone="neutral" label="#3" />
              <AppText variant="label" numberOfLines={1} style={styles.centerText}>
                {usuarioTop3.nomeExibicao}
              </AppText>
              {usuarioTop3.nomeUsuario ? (
                <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
                  {usuarioTop3.nomeUsuario}
                </AppText>
              ) : null}
              <AppText variant="heading" color={Colors.primary}>
                {usuarioTop3.xpTotal}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP
              </AppText>
            </View>
          ) : (
            <View style={[styles.podioCard, styles.podioCard3, styles.podioEmpty]}>
              <Ionicons name="person-outline" size={24} color={Colors.textMuted} />
              <AppText variant="caption" color={Colors.textMuted}>
                Vago
              </AppText>
            </View>
          )}
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
          Exibindo apenas os usuários reais cadastrados no banco de dados local do seu aplicativo.
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
  userRankFooter: { flexDirection: 'row', gap: Spacing.two },
  podioSection: { gap: Spacing.three },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  podioRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  podioCard: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.two + 2, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  podioCard1: { height: 190, borderColor: Colors.primary, backgroundColor: 'rgba(253,186,92,0.08)' },
  podioCard2: { height: 160 },
  podioCard3: { height: 160 },
  podioEmpty: { justifyContent: 'center', opacity: 0.5, borderStyle: 'dashed' },
  crownBox: { marginBottom: -4 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceRaised, overflow: 'hidden' },
  avatarCircle1: { width: 52, height: 52, borderRadius: 26, borderColor: Colors.primary },
  podioAvatarImage: { width: 40, height: 40, borderRadius: 20 },
  podioAvatarImage1: { width: 48, height: 48, borderRadius: 24 },
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

