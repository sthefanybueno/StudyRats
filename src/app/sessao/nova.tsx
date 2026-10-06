import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import type { Topico } from '@/domain/entities/Topico';
import { useAuth } from '@/providers/AuthProvider';
import { formatarTempoRegressivo, useSessaoFoco } from '@/providers/SessaoFocoProvider';

export default function NovaSessaoScreen() {
  const { usuario } = useAuth();
  const { sessaoAtiva, iniciarSessao, pausarSessao, retomarSessao, concluirSessao, cancelarSessao } = useSessaoFoco();

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  const [topicoSelecionado, setTopicoSelecionado] = useState<Topico | null>(null);
  
  // Criar rápido novo tópico
  const [novoTopicoNome, setNovoTopicoNome] = useState('');
  const [criandoTopico, setCriandoTopico] = useState(false);

  // Passo 2: Duração
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);

  // Passo 3: Evidências
  const [anexarGps, setAnexarGps] = useState(true);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // Status de Envio
  const [salvando, setSalvando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // Carregar disciplinas do usuário
  useEffect(() => {
    if (!usuario) return;
    DIContainer.repositories.disciplina.listarPorUsuario(usuario.id).then(list => {
      setDisciplinas(list);
      if (list.length > 0) {
        setDisciplinaSelecionada(list[0]);
        if (list[0].topicos.length > 0) {
          setTopicoSelecionado(list[0].topicos[0]);
        }
      }
    });
  }, [usuario]);

  // Iniciar Sessão de Foco
  const handleIniciarSessaoFoco = () => {
    if (!usuario) return;
    if (!disciplinaSelecionada) {
      setErroMsg('Selecione uma disciplina');
      return;
    }
    iniciarSessao({
      disciplina: disciplinaSelecionada,
      topico: topicoSelecionado,
      duracaoAlvoMinutos: duracaoMinutos,
      anexarGps,
      fotoUri,
    });
    router.replace('/(app)');
  };

  // Finalizar Sessão Ativa em Execução
  const handleFinalizarSessaoAtiva = async () => {
    if (!usuario) return;
    setSalvando(true);
    const res = await concluirSessao(usuario.id);
    setSalvando(false);
    if (res.isSuccess) {
      setSucessoMsg(`+${res.xpGanho} XP Registrados com sucesso!`);
      setTimeout(() => {
        router.replace('/(app)');
      }, 1200);
    } else {
      setErroMsg(res.error || 'Erro ao concluir sessão');
    }
  };

  // Atualizar tópico selecionado ao trocar disciplina
  const selecionarDisciplina = (d: Disciplina) => {
    setDisciplinaSelecionada(d);
    if (d.topicos.length > 0) {
      setTopicoSelecionado(d.topicos[0]);
    } else {
      setTopicoSelecionado(null);
    }
  };

  // Cadastrar tópico rápido se necessário
  const handleCriarTopicoRapido = async () => {
    if (!disciplinaSelecionada || !novoTopicoNome.trim()) return;
    const res = await DIContainer.cadastrarTopico.execute({
      disciplinaId: disciplinaSelecionada.id,
      nome: novoTopicoNome.trim(),
    });
    if (res.isSuccess) {
      setNovoTopicoNome('');
      setCriandoTopico(false);
      // Recarregar disciplina atualizada
      const discAtualizada = await DIContainer.repositories.disciplina.buscarPorId(disciplinaSelecionada.id);
      if (discAtualizada) {
        setDisciplinaSelecionada(discAtualizada);
        const novot = discAtualizada.topicos.find(t => t.id === res.value.id);
        if (novot) setTopicoSelecionado(novot);
      }
    }
  };

  // Capturar Foto
  const handleTirarFoto = async () => {
    setCarregandoFoto(true);
    try {
      const uri = await DIContainer.registrarSessao['cameraGateway'].capturarFoto();
      if (uri) setFotoUri(uri);
    } catch (e: any) {
      setErroMsg(e.message || 'Erro ao capturar foto');
    } finally {
      setCarregandoFoto(false);
    }
  };

  // Concluir Sessão
  const handleConcluirSessao = async () => {
    if (!usuario) return;
    if (!disciplinaSelecionada) {
      setErroMsg('Selecione uma disciplina');
      return;
    }

    setSalvando(true);
    setErroMsg(null);

    try {
      const topicoIdFinal = topicoSelecionado
        ? topicoSelecionado.id
        : disciplinaSelecionada.topicos[0]?.id || 'topico-generico';

      const res = await DIContainer.registrarSessao.execute({
        usuarioId: usuario.id,
        disciplinaId: disciplinaSelecionada.id,
        topicoId: topicoIdFinal,
        duracaoMinutos,
        comFoto: !!fotoUri,
      });

      if (res.isSuccess) {
        setSucessoMsg(`+${duracaoMinutos} XP Registrados!`);
        setTimeout(() => {
          router.replace('/(app)');
        }, 1500);
      } else {
        setErroMsg(res.error);
      }
    } catch (e: any) {
      setErroMsg(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Screen
      footer={
        sucessoMsg ? null : sessaoAtiva ? (
          <View style={styles.runningFooterRow}>
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
              loading={salvando}
              onPress={handleFinalizarSessaoAtiva}
              style={styles.flex}
            />
          </View>
        ) : (
          <Button
            testID="iniciar-sessao-btn"
            label="Iniciar Sessão de Foco"
            icon="play"
            onPress={handleIniciarSessaoFoco}
          />
        )
      }>
      {/* Header Superior */}
      <View style={styles.headerRow}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="overline" color={Colors.textSecondary}>
            STUDYRATS
          </AppText>
          <AppText variant="heading">Sessão De Foco</AppText>
        </View>
        <Pill tone="success" dot label="Gravação Local Ativa" />
      </View>

      {sucessoMsg ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.sucessoCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <AppText variant="title" color={Colors.success}>
              {sucessoMsg}
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
              Sua sessão foi blindada localmente no dispositivo. Retornando ao Dashboard...
            </AppText>
          </Card>
        </Animated.View>
      ) : sessaoAtiva ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card accent={sessaoAtiva.disciplina.cor} style={styles.runningTimerCard}>
            <View style={styles.runningTimerHeader}>
              <Pill
                tone={sessaoAtiva.emExecucao ? 'success' : 'warning'}
                dot
                label={sessaoAtiva.emExecucao ? 'EM EXECUÇÃO' : 'PAUSADO'}
              />
              <AppText variant="caption" color={Colors.textMuted}>
                Alvo: {sessaoAtiva.duracaoAlvoMinutos} min
              </AppText>
            </View>

            <View style={styles.timerDisplayContainer}>
              <AppText variant="display" style={styles.timerDisplayText}>
                {formatarTempoRegressivo(sessaoAtiva.segundosDecorridos, sessaoAtiva.duracaoAlvoMinutos)}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                TEMPO DE FOCO RESTANTE
              </AppText>
            </View>

            <View style={styles.runningMetaInfo}>
              <View style={styles.rowGap}>
                <Ionicons name="journal" size={18} color={sessaoAtiva.disciplina.cor} />
                <AppText variant="heading">{sessaoAtiva.disciplina.nome}</AppText>
              </View>
              {sessaoAtiva.topico && (
                <View style={styles.rowGap}>
                  <Ionicons name="bookmark-outline" size={14} color={Colors.textSecondary} />
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {sessaoAtiva.topico.nome}
                  </AppText>
                </View>
              )}
            </View>

            <Button
              label="Cancelar Sessão"
              variant="secondary"
              icon="close-circle-outline"
              onPress={cancelarSessao}
            />
          </Card>
        </Animated.View>
      ) : (
        <>
          {/* Passo 1: Disciplina & Tópico */}
          <Animated.View entering={FadeInDown.duration(450)}>
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <AppText variant="caption" color="#FFF" style={styles.boldText}>
                    1
                  </AppText>
                </View>
                <AppText variant="heading" style={styles.flex}>
                  Disciplina & Tópico
                </AppText>
                <Pill tone="primary" icon="flash" label="+15% Foco" />
              </View>

              <View style={styles.fieldGroup}>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Matéria
                </AppText>
                {disciplinas.length === 0 ? (
                  <View style={styles.noDiscBox}>
                    <AppText variant="caption" color={Colors.textMuted}>
                      Nenhuma disciplina cadastrada ainda.
                    </AppText>
                    <Button
                      label="Cadastrar Disciplina"
                      variant="secondary"
                      onPress={() => router.push('/(onboarding)/disciplinas')}
                    />
                  </View>
                ) : (
                  <View style={styles.discChips}>
                    {disciplinas.map(d => {
                      const ativa = disciplinaSelecionada?.id === d.id;
                      return (
                        <Pressable
                          key={d.id}
                          onPress={() => selecionarDisciplina(d)}
                          style={[
                            styles.chipItem,
                            { borderColor: d.cor },
                            ativa && { backgroundColor: d.cor + '22', borderWidth: 2 },
                          ]}>
                          <View style={[styles.dot, { backgroundColor: d.cor }]} />
                          <AppText variant="label" color={ativa ? Colors.text : Colors.textSecondary}>
                            {d.nome}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Tópico em Estudo */}
              {disciplinaSelecionada && (
                <View style={styles.fieldGroup}>
                  <View style={styles.rowBetween}>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      Tópico em Estudo
                    </AppText>
                    <Pressable onPress={() => setCriandoTopico(t => !t)}>
                      <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                        {criandoTopico ? 'Cancelar' : '+ Criar Rápido'}
                      </AppText>
                    </Pressable>
                  </View>

                  {criandoTopico ? (
                    <View style={styles.criarTopicoRow}>
                      <TextField
                        label=""
                        icon="bookmark-outline"
                        placeholder="Nome do novo tópico"
                        value={novoTopicoNome}
                        onChangeText={setNovoTopicoNome}
                        style={styles.flex}
                      />
                      <Button label="Salvar" variant="primary" onPress={handleCriarTopicoRapido} />
                    </View>
                  ) : disciplinaSelecionada.topicos.length > 0 ? (
                    <View style={styles.topicosChips}>
                      {disciplinaSelecionada.topicos.map(t => {
                        const selecionado = topicoSelecionado?.id === t.id;
                        return (
                          <Pressable
                            key={t.id}
                            onPress={() => setTopicoSelecionado(t)}
                            style={[styles.topicoChip, selecionado && styles.topicoChipActive]}>
                            <Ionicons
                              name="bookmark"
                              size={14}
                              color={selecionado ? Colors.primary : Colors.textMuted}
                            />
                            <AppText variant="caption" color={selecionado ? Colors.text : Colors.textSecondary}>
                              {t.nome}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <AppText variant="caption" color={Colors.textMuted}>
                      Nenhum tópico cadastrado nesta disciplina. Clique em "+ Criar Rápido" para adicionar.
                    </AppText>
                  )}
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Passo 2: Duração do Estudo */}
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: Colors.primary }]}>
                  <AppText variant="caption" color={Colors.primaryText} style={styles.boldText}>
                    2
                  </AppText>
                </View>
                <AppText variant="heading" style={styles.flex}>
                  Duração do Estudo
                </AppText>
                <Pill tone="warning" icon="flame" label="Combo x1.2" />
              </View>

              <View style={styles.counterRow}>
                <Pressable
                  onPress={() => setDuracaoMinutos(m => Math.max(5, m - 5))}
                  style={styles.counterBtn}>
                  <Ionicons name="remove" size={24} color={Colors.text} />
                </Pressable>

                <View style={styles.counterDisplay}>
                  <AppText variant="display" style={styles.counterValue}>
                    {duracaoMinutos}
                  </AppText>
                  <AppText variant="overline" color={Colors.textSecondary}>
                    MINUTOS FOCADOS
                  </AppText>
                </View>

                <Pressable onPress={() => setDuracaoMinutos(m => m + 5)} style={styles.counterBtn}>
                  <Ionicons name="add" size={24} color={Colors.text} />
                </Pressable>
              </View>

              {/* Quick Select Buttons */}
              <View style={styles.quickButtonsRow}>
                {[15, 30, 45, 60].map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setDuracaoMinutos(m)}
                    style={[styles.quickBtn, duracaoMinutos === m && styles.quickBtnActive]}>
                    <AppText variant="label" color={duracaoMinutos === m ? Colors.primaryText : Colors.text}>
                      +{m}m
                    </AppText>
                  </Pressable>
                ))}
              </View>

              {/* Preview XP Card */}
              <View style={styles.xpPreviewCard}>
                <Ionicons name="star" size={18} color={Colors.primary} />
                <AppText variant="caption" color={Colors.textSecondary}>
                  Ganho Previsto:
                </AppText>
                <AppText variant="label" color={Colors.primary}>
                  {duracaoMinutos} XP Base
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  + 7 Bônus =
                </AppText>
                <AppText variant="heading" color={Colors.primary}>
                  {duracaoMinutos + 7} XP
                </AppText>
              </View>
            </Card>
          </Animated.View>

          {/* Passo 3: Evidências & Provas (Opcionais) */}
          <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: Colors.success }]}>
                  <AppText variant="caption" color="#FFF" style={styles.boldText}>
                    3
                  </AppText>
                </View>
                <AppText variant="heading" style={styles.flex}>
                  Evidências & Provas
                </AppText>
                <AppText variant="overline" color={Colors.textMuted}>
                  OPCIONAIS
                </AppText>
              </View>

              {/* GPS Toggle */}
              <View style={styles.evidenceItem}>
                <View style={styles.evidenceLeft}>
                  <View style={styles.evidenceIconBox}>
                    <Ionicons name="location-outline" size={20} color={Colors.success} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="label">Anexar Localização (GPS)</AppText>
                    <AppText variant="caption" color={Colors.success}>
                      {anexarGps ? '● Detectado com Alta Precisão (4m)' : 'Desativado'}
                    </AppText>
                  </View>
                </View>
                <Pressable
                  onPress={() => setAnexarGps(g => !g)}
                  style={[styles.toggleSwitch, anexarGps && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleKnob, anexarGps && styles.toggleKnobActive]} />
                </Pressable>
              </View>

              {/* Photo Attachment */}
              <View style={styles.evidenceItem}>
                <View style={styles.evidenceLeft}>
                  <View style={styles.evidenceIconBox}>
                    <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="label">Foto do Caderno / Estudo</AppText>
                    <AppText variant="caption" color={Colors.primary}>
                      +10 XP Bônus de foto
                    </AppText>
                  </View>
                </View>
              </View>

              {fotoUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: fotoUri }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable onPress={() => setFotoUri(null)} style={styles.removePhotoBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </Pressable>
                </View>
              ) : (
                <Button
                  label="Tirar Foto do Caderno"
                  variant="secondary"
                  icon="camera"
                  loading={carregandoFoto}
                  onPress={handleTirarFoto}
                />
              )}
            </Card>
          </Animated.View>

          {erroMsg && (
            <Card style={styles.erroCard}>
              <AppText variant="caption" color={Colors.danger}>
                {erroMsg}
              </AppText>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  runningFooterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  runningTimerCard: {
    gap: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
  },
  runningTimerHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerDisplayContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  timerDisplayText: {
    fontSize: 56,
    lineHeight: 64,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  runningMetaInfo: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCard: { gap: Spacing.three, padding: Spacing.four - 4 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.aiStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: { gap: Spacing.one + 2 },
  noDiscBox: { gap: Spacing.two, paddingVertical: Spacing.two },
  discChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  criarTopicoRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  topicosChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  topicoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicoChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterDisplay: { alignItems: 'center' },
  counterValue: { fontSize: 48, lineHeight: 54, color: Colors.primary, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  quickButtonsRow: { flexDirection: 'row', gap: Spacing.two },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  xpPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: Spacing.two + 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
  },
  evidenceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  evidenceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 4 },
  evidenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  toggleSwitchActive: { backgroundColor: Colors.success },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.textMuted },
  toggleKnobActive: { backgroundColor: '#FFF', alignSelf: 'flex-end' },
  photoPreviewContainer: { position: 'relative', height: 160, borderRadius: Radius.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: Radius.pill,
  },
  sucessoCard: { alignItems: 'center', gap: Spacing.three, padding: Spacing.five },
  erroCard: { backgroundColor: Colors.dangerSoft, padding: Spacing.three },
  flex: { flex: 1 },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});
