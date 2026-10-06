import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill, ProgressBar } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function PerfilScreen() {
  const { usuario, logout, atualizarPerfil } = useAuth();

  // Configurações Locais Toggles
  const [lembreteStreak, setLembreteStreak] = useState(true);
  const [modoOfflinePrioritario, setModoOfflinePrioritario] = useState(true);

  // Edição de Perfil State
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [novoNomeInput, setNovoNomeInput] = useState('');
  const [novoUsernameInput, setNovoUsernameInput] = useState('');
  const [fotoUrlInput, setFotoUrlInput] = useState<string | undefined>(undefined);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estatísticas Reais Carregadas do Armazenamento Local
  const [sessoesCount, setSessoesCount] = useState(0);
  const [minutosTotais, setMinutosTotais] = useState(0);

  const carregarEstatísticasReais = useCallback(async () => {
    if (!usuario) return;
    try {
      const listSessoes = await DIContainer.repositories.sessao.listarPorUsuario(usuario.id);
      setSessoesCount(listSessoes.length);
      const totalMins = listSessoes.reduce((acc, s) => acc + s.duracaoMinutos, 0);
      setMinutosTotais(totalMins);
    } catch (e) {
      console.error('Erro ao carregar estatísticas reais:', e);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      carregarEstatísticasReais();
    }, [carregarEstatísticasReais])
  );

  // Abrir Modal de Edição de Perfil
  const handleAbrirEdicao = () => {
    setNovoNomeInput(usuario?.nomeExibicao || '');
    setNovoUsernameInput(usuario?.nomeUsuario || '');
    setFotoUrlInput(usuario?.fotoUrl);
    setErroEdicao(null);
    setMostrarModalEditar(true);
  };

  // Selecionar Foto da Galeria
  const handleSelecionarFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoUrlInput(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Erro ao selecionar foto:', err);
    }
  };

  // Salvar Novo Nome, Username e Foto de Perfil
  const handleSalvarPerfil = async () => {
    if (!novoNomeInput.trim()) {
      setErroEdicao('Informe o nome de exibição');
      return;
    }
    setSalvandoPerfil(true);
    const err = await atualizarPerfil({
      nomeExibicao: novoNomeInput.trim(),
      nomeUsuario: novoUsernameInput.trim() || undefined,
      fotoUrl: fotoUrlInput,
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
    <Screen contentStyle={styles.content}>
      {/* Header Superior */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Meu Perfil" />
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
          <Pill tone="success" dot label="Dados do Aparelho" />
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
              onPress={() => setLembreteStreak(l => !l)}
              style={[styles.toggleSwitch, lembreteStreak && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, lembreteStreak && styles.toggleKnobActive]} />
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
              onPress={() => setModoOfflinePrioritario(m => !m)}
              style={[styles.toggleSwitch, modoOfflinePrioritario && styles.toggleSwitchActive]}>
              <View style={[styles.toggleKnob, modoOfflinePrioritario && styles.toggleKnobActive]} />
            </Pressable>
          </View>
        </Card>
      </View>

      {/* Logout Button */}
      <View style={styles.perfilFooter}>
        <Button
          testID="logout-btn"
          label="Encerrar Sessão Segura"
          variant="secondary"
          icon="log-out-outline"
          onPress={logout}
        />
      </View>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={mostrarModalEditar}
        transparent
        animationType="fade"
        onRequestClose={() => setMostrarModalEditar(false)}>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AppText variant="title">Editar Perfil</AppText>
              <Pressable hitSlop={10} onPress={() => setMostrarModalEditar(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
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
            </View>

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
    gap: Spacing.three,
    padding: Spacing.four,
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
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});

