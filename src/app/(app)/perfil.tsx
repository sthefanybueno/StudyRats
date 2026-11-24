/** Description: This file (src/app/(app)/perfil.tsx) contains the implementation for its respective feature. */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill, ProgressBar } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing } from '@/constants/theme';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from "@/providers/ThemeProvider";

const PREF_LEMBRETE_KEY = 'studyrats.pref.lembreteStreak';
const PREF_OFFLINE_KEY = 'studyrats.pref.modoOfflinePrioritario';
const METAS_OPCOES = [30, 60, 120, 180] as const;

export default function PerfilScreen() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);
  // O Modal transparente cobre a tela inteira: o card não pode invadir notch / home indicator.
  const insets = useSafeAreaInsets();

  const { usuario, logout, atualizarPerfil, recarregarUsuario } = useAuth();
  const { isOnline, sincronizarManualmente } = useNetworkSync();
  const [atualizando, setAtualizando] = useState(false);

  const { modoEscuro, setModoEscuro } = useAppTheme();
  const [lembreteStreak, setLembreteStreak] = useState(true);
  const [modoOfflinePrioritario, setModoOfflinePrioritario] = useState(true);

  // Carrega preferências locais persistidas do aparelho
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PREF_LEMBRETE_KEY),
      AsyncStorage.getItem(PREF_OFFLINE_KEY),
    ])
      .then(([lembrete, offline]) => {
        const lembreteAtivo = lembrete !== 'false';
        setLembreteStreak(lembreteAtivo);
        if (offline === 'false') setModoOfflinePrioritario(false);

        if (lembreteAtivo) {
          void DIContainer.agendarLembreteStreak(usuario?.streakAtual ?? 0);
        } else {
          void DIContainer.cancelarLembreteStreak();
        }
      })
      .catch(() => {});
  }, [usuario?.streakAtual]);

  const alternarLembreteStreak = () => {
    const novo = !lembreteStreak;
    setLembreteStreak(novo);
    AsyncStorage.setItem(PREF_LEMBRETE_KEY, String(novo)).catch(() => {});
    if (novo) {
      void DIContainer.agendarLembreteStreak(usuario?.streakAtual ?? 0);
    } else {
      void DIContainer.cancelarLembreteStreak();
    }
  };

  const alternarModoOffline = () => {
    const novo = !modoOfflinePrioritario;
    setModoOfflinePrioritario(novo);
    AsyncStorage.setItem(PREF_OFFLINE_KEY, String(novo)).catch(() => {});
  };

  // Edição de Perfil State
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [novoNomeInput, setNovoNomeInput] = useState('');
  const [novoUsernameInput, setNovoUsernameInput] = useState('');
  const [fotoUrlInput, setFotoUrlInput] = useState<string | undefined>(undefined);
  const [metaInput, setMetaInput] = useState<number>(60);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estatísticas Reais Carregadas do Armazenamento Local
  const [sessoesCount, setSessoesCount] = useState(0);
  const [sessoesComGpsCount, setSessoesComGpsCount] = useState(0);
  const [minutosTotais, setMinutosTotais] = useState(0);
  const [limpandoGps, setLimpandoGps] = useState(false);
  const [confirmarLimparGps, setConfirmarLimparGps] = useState(false);
  const [msgPrivacidade, setMsgPrivacidade] = useState<string | null>(null);

  const carregarEstatísticasReais = useCallback(async () => {
    if (!usuario) return;
    try {
      const stats = await DIContainer.obterEstatisticasPerfil.execute(usuario.id);
      setSessoesCount(stats.sessoesCount);
      setSessoesComGpsCount(stats.sessoesComGpsCount);
      setMinutosTotais(stats.minutosTotais);
      if (stats.xpReconciliado) {
        await recarregarUsuario();
      }
    } catch (e) {
      console.error('Erro ao carregar estatísticas reais:', e);
    }
  }, [usuario, recarregarUsuario]);

  const handleLimparHistoricoLocalizacao = () => {
    if (!usuario) return;
    setConfirmarLimparGps(true);
  };

  const confirmarLimparHistoricoLocalizacao = async () => {
    if (!usuario) return;
    setConfirmarLimparGps(false);
    setLimpandoGps(true);
    setMsgPrivacidade(null);
    const res = await DIContainer.limparHistoricoLocalizacao.execute({ usuarioId: usuario.id });
    setLimpandoGps(false);
    if (res.isSuccess) {
      setSessoesComGpsCount(0);
      await recarregarUsuario();
      setMsgPrivacidade(
        res.value.sessoesAfetadas > 0
          ? `Localização removida de ${res.value.sessoesAfetadas} ${res.value.sessoesAfetadas === 1 ? 'sessão' : 'sessões'}${
              res.value.xpDescontado > 0 ? ` e XP recalculado (-${res.value.xpDescontado} XP).` : '.'
            }`
          : 'Nenhuma coordenada pendente encontrada. Histórico limpo.'
      );
    } else {
      setMsgPrivacidade(res.error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarEstatísticasReais();
    }, [carregarEstatísticasReais])
  );

  const handleAtualizar = useCallback(async () => {
    setAtualizando(true);
    try {
      await sincronizarManualmente();
      await recarregarUsuario();
      await carregarEstatísticasReais();
    } finally {
      setAtualizando(false);
    }
  }, [sincronizarManualmente, recarregarUsuario, carregarEstatísticasReais]);

  // Abrir Modal de Edição de Perfil
  const handleAbrirEdicao = () => {
    setNovoNomeInput(usuario?.nomeExibicao || '');
    setNovoUsernameInput(usuario?.nomeUsuario || '');
    setFotoUrlInput(usuario?.fotoUrl);
    setMetaInput(usuario?.metaDiariaMinutos ?? 60);
    setErroEdicao(null);
    setMostrarModalEditar(true);
  };

  // Selecionar Foto da Galeria (via CapturarEvidenciaFotoUseCase + compressão)
  const handleSelecionarFoto = async () => {
    try {
      const uri = await DIContainer.capturarEvidenciaFoto.selecionarDaGaleria();
      if (uri) {
        setFotoUrlInput(uri);
      }
    } catch (err: any) {
      setErroEdicao(err?.message || 'Erro ao selecionar foto');
    }
  };

  // Salvar Novo Nome, Username, Foto e Meta Diária
  const handleSalvarPerfil = async () => {
    if (!novoNomeInput.trim()) {
      setErroEdicao('Informe o nome de exibição');
      return;
    }
    setSalvandoPerfil(true);
    const err = await atualizarPerfil({
      nomeExibicao: novoNomeInput.trim(),
      nomeUsuario: novoUsernameInput.trim(),
      fotoUrl: fotoUrlInput ?? '',
      metaDiariaMinutos: metaInput,
    });
    setSalvandoPerfil(false);
    if (err) {
      setErroEdicao(err);
    } else {
      setMostrarModalEditar(false);
      setErroEdicao(null);
    }
  };

  const xpTotal = usuario?.xpTotal ?? 0;
  const streakAtual = usuario?.streakAtual ?? 0;
  const nivelCalculado = Math.floor(xpTotal / 100) + 1;
  const xpProgressoNivel = xpTotal % 100;
  const primeiroNome = usuario?.nomeExibicao ?? 'Estudante';
  const emailVal = usuario?.email.getValue ?? '';

  // Formatação do tempo total de estudo
  const formatarTempoTotal = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const horas = Math.floor(mins / 60);
    const restoMins = mins % 60;
    return restoMins > 0 ? `${horas}h ${restoMins}m` : `${horas}h`;
  };

  return (
    <Screen contentStyle={styles.content} edges={['top']} refreshing={atualizando} onRefresh={handleAtualizar}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Meu Perfil" />
        <View style={styles.topHeaderRight}>
          <Pill tone={isOnline ? 'success' : 'warning'} dot label={isOnline ? 'Online' : 'Offline'} />
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

      {/* Cartão de Perfil do Usuário */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={styles.profileHeroCard}>
          <View style={styles.profileHeroTop}>
            <View style={styles.largeAvatarCircle}>
              {usuario?.fotoUrl ? (
                <Image source={{ uri: usuario.fotoUrl }} style={styles.largeAvatarImage} />
              ) : (
                <Ionicons name="person" size={30} color={Colors.primary} />
              )}
              <View style={styles.heroLevelBadge}>
                <AppText variant="caption" style={styles.heroLevelBadgeText}>
                  Nv.{nivelCalculado}
                </AppText>
              </View>
            </View>

            <View style={styles.flex}>
              <AppText variant="title">{primeiroNome}</AppText>
              {usuario?.nomeUsuario ? (
                <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                  {usuario.nomeUsuario}
                </AppText>
              ) : null}
              <AppText variant="caption" color={Colors.textSecondary}>
                {emailVal}
              </AppText>
            </View>

            {/* Botão para Editar Perfil */}
            <Pressable hitSlop={10} style={styles.editProfileBtn} onPress={handleAbrirEdicao}>
              <Ionicons name="pencil" size={14} color={Colors.primary} />
              <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                Editar
              </AppText>
            </Pressable>
          </View>

          {/* Progresso de XP Real */}
          <View style={styles.xpProgressBlock}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Progresso Nível {nivelCalculado}
              </AppText>
              <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                {xpProgressoNivel} / 100 XP
              </AppText>
            </View>
            <ProgressBar progress={xpProgressoNivel / 100} />
          </View>
        </Card>
      </Animated.View>

      {/* Estatísticas Reais do Usuário (4 Cards) */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">Seu Desempenho Real</AppText>
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
            <AppText variant="title" color={Colors.primary}>
              {streakAtual} {streakAtual === 1 ? 'Dia' : 'Dias'}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Sequência ativa
            </AppText>
          </Card>

          {/* Card 2: XP Total */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                XP Acumulado
              </AppText>
              <Ionicons name="star-outline" size={16} color={Colors.primary} />
            </View>
            <AppText variant="title">{xpTotal} XP</AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Total no perfil
            </AppText>
          </Card>

          {/* Card 3: Tempo Total */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Tempo Estudado
              </AppText>
              <Ionicons name="time-outline" size={16} color={Colors.aiText} />
            </View>
            <AppText variant="title">{formatarTempoTotal(minutosTotais)}</AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Minutos gravados
            </AppText>
          </Card>

          {/* Card 4: Sessões Gravadas */}
          <Card style={styles.gridStatCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Sessões
              </AppText>
              <Ionicons name="journal-outline" size={16} color={Colors.success} />
            </View>
            <AppText variant="title" color={Colors.success}>
              {sessoesCount}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Sessões de foco
            </AppText>
          </Card>
        </View>
      </View>

      {/* Configurações Locais */}
      <View style={styles.configSection}>
        <AppText variant="heading">Preferências</AppText>

        <Card style={styles.configCard}>
          {/* Toggle 1: Lembretes de Streak */}
          <View style={styles.configItem}>
            <View style={styles.configIconBox}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">Lembretes de Foco</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Alertas para manter sua sequência diária
              </AppText>
            </View>
            <Pressable
              onPress={alternarLembreteStreak}
              style={[styles.toggleSwitch, lembreteStreak && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, lembreteStreak && styles.toggleKnobActive]} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Toggle Modo Escuro */}
          <View style={styles.configItem}>
            <View style={styles.configIconBox}>
              <Ionicons name="moon-outline" size={18} color={Colors.aiText} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">Modo Escuro (Beta)</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Tema navy escuro para ambientes noturnos
              </AppText>
            </View>
            <Pressable
              onPress={() => setModoEscuro(!modoEscuro)}
              style={[styles.toggleSwitch, modoEscuro && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, modoEscuro && styles.toggleKnobActive]} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Toggle 2: Modo Offline Prioritário */}
          <View style={styles.configItem}>
            <View style={styles.configIconBox}>
              <Ionicons name="cloud-offline-outline" size={18} color={Colors.success} />
            </View>
            <View style={styles.flex}>
              <AppText variant="label">Armazenamento Local Ativo</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Salvar todas as sessões offline-first
              </AppText>
            </View>
            <Pressable
              onPress={alternarModoOffline}
              style={[styles.toggleSwitch, modoOfflinePrioritario && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, modoOfflinePrioritario && styles.toggleKnobActive]} />
            </Pressable>
          </View>
        </Card>
      </View>

      {/* Privacidade & Localização (LGPD - Art. 13, 14 e 18) */}
      <View style={styles.configSection}>
        <View style={styles.sectionHeader}>
          <AppText variant="heading">Privacidade & Localização (LGPD)</AppText>
        </View>

        <Card style={styles.lgpdCard}>
          <AppText variant="caption" color={Colors.textSecondary}>
            • Finalidade e Minimização: o GPS é coletado apenas em primeiro plano (foreground) quando você conclui uma sessão com a opção ativa. No Feed, exibimos apenas Bairro/Cidade ou posição aproximada (~1 km).
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            • Direito de Eliminação (Art. 18 LGPD): você pode apagar todas as coordenadas salvas mantendo suas horas de estudo (o bônus de +5 XP por GPS é recalculado).
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            • Retenção Automática: coordenadas com mais de 90 dias são expurgadas automaticamente durante a sincronização.
          </AppText>
          {msgPrivacidade && (
            <AppText variant="caption" color={Colors.success} style={styles.boldText}>
              {msgPrivacidade}
            </AppText>
          )}
          <Button
            testID="limpar-localizacao-btn"
            label="Excluir Histórico de Localização"
            variant="secondary"
            icon="location-outline"
            loading={limpandoGps}
            onPress={handleLimparHistoricoLocalizacao}
          />
        </Card>
      </View>

      {/* Logout & Reset Buttons */}
      <View style={styles.perfilFooter}>
        <Button
          testID="logout-btn"
          label="Encerrar Sessão Segura"
          variant="secondary"
          icon="log-out-outline"
          onPress={logout}
        />
        {/*         
          <Button
            label="Limpar Dados Locais (Reset)"
            variant="danger"
            icon="trash-outline"
            onPress={async () => {
              await DIContainer.resetarDadosLocais();
              logout();
            }}
          />
        */}
      </View>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={mostrarModalEditar}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModalEditar(false)}>
        <View
          style={[
            styles.modalOverlay,
            { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three },
          ]}>
          <Card style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AppText variant="title">Editar Perfil</AppText>
              <Pressable hitSlop={10} onPress={() => setMostrarModalEditar(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Seleção e Visualização de Foto de Perfil */}
              <View style={styles.avatarPickRow}>
                <View style={styles.largeAvatarCircle}>
                  {fotoUrlInput ? (
                    <Image source={{ uri: fotoUrlInput }} style={styles.largeAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={30} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.avatarActionsRow}>
                  <Button
                    label="Alterar Foto"
                    variant="secondary"
                    icon="image-outline"
                    onPress={handleSelecionarFoto}
                  />
                  {fotoUrlInput ? (
                    <Pressable hitSlop={10} onPress={() => setFotoUrlInput(undefined)}>
                      <AppText variant="caption" color={Colors.danger} style={styles.centerText}>
                        Remover Foto
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <TextField
                label="Nome de Exibição"
                icon="person-outline"
                value={novoNomeInput}
                onChangeText={setNovoNomeInput}
                placeholder="Seu nome no app"
                error={erroEdicao}
              />

              <TextField
                label="Nome de Usuário (Username)"
                icon="at-outline"
                value={novoUsernameInput}
                onChangeText={setNovoUsernameInput}
                placeholder="@seu_username (ex: @clara_estudante)"
                hint="Identificador exibido no ranking"
              />

              <View style={styles.metaGroup}>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Meta Diária de Estudo
                </AppText>
                <View style={styles.metaChipsRow}>
                  {METAS_OPCOES.map((m) => {
                    const ativa = metaInput === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMetaInput(m)}
                        style={[styles.metaChip, ativa && styles.metaChipActive]}>
                        <AppText variant="label" color={ativa ? Colors.primaryText : Colors.text}>
                          {m}m
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => setMostrarModalEditar(false)}
                style={styles.modalBtn}
              />
              <Button
                label={salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
                variant="primary"
                onPress={handleSalvarPerfil}
                loading={salvandoPerfil}
                style={styles.modalBtn}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Modal de Confirmação LGPD para Excluir Histórico de Localização */}
      <Modal
        visible={confirmarLimparGps}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmarLimparGps(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="location-outline" size={26} color={Colors.danger} />
            </View>
            <AppText variant="title" style={styles.centerText}>
              Excluir histórico de localização?
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
              Tem certeza que deseja apagar permanentemente as coordenadas de localização{' '}
              {sessoesComGpsCount > 0
                ? `de ${sessoesComGpsCount} ${sessoesComGpsCount === 1 ? 'sessão salva' : 'sessões salvas'}`
                : 'salvas'}{' '}
              ? Suas horas de estudo serão mantidas e o bônus de GPS (+5 XP por sessão) será recalculado.
            </AppText>
            <View style={styles.confirmActionsRow}>
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={() => setConfirmarLimparGps(false)}
                style={styles.modalBtn}
              />
              <Button
                testID="confirmar-limpar-localizacao-btn"
                label="Excluir"
                variant="danger"
                icon="trash-outline"
                onPress={confirmarLimparHistoricoLocalizacao}
                style={styles.modalBtn}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
  profileHeroCard: { gap: Spacing.three, padding: Spacing.four - 4 },
  profileHeroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  largeAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  largeAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  heroLevelBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: Colors.aiStrong,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  heroLevelBadgeText: { fontSize: 9, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFF' },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceRaised,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpProgressBlock: { gap: 6 },
  statsSection: { gap: Spacing.two + 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridStatCard: { width: '48%', gap: 4, padding: Spacing.three },
  configSection: { gap: Spacing.two + 4 },
  configCard: { padding: Spacing.three },
  lgpdCard: { padding: Spacing.three, gap: Spacing.two + 2 },
  configItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2, paddingVertical: 4 },
  configIconBox: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  toggleSwitch: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.surfaceInput, borderWidth: 1, borderColor: Colors.border, padding: 2 },
  toggleSwitchActive: { backgroundColor: Colors.success },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.textMuted },
  toggleKnobActive: { backgroundColor: '#FFF', alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.two },
  perfilFooter: { marginTop: Spacing.two, marginBottom: Spacing.two },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  metaGroup: { gap: Spacing.two },
  metaChipsRow: { flexDirection: 'row', gap: Spacing.two },
  metaChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  metaChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBody: {
    gap: Spacing.three,
  },
  avatarPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  avatarActionsRow: {
    gap: Spacing.two,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalBtn: {
    flex: 1,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  confirmIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.one,
  },
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});

