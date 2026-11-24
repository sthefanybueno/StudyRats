/** Description: This file (src/app/sessao/nova.tsx) contains the implementation for its respective feature. */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import type { Topico } from '@/domain/entities/Topico';
import { CalculoXpService } from '@/domain/services/CalculoXpService';
import { useAuth } from '@/providers/AuthProvider';
import { useLocation } from '@/hooks/useLocation';
import { formatarTempoRegressivo, useSessaoFoco } from '@/providers/SessaoFocoProvider';
import { useAppTheme } from "@/providers/ThemeProvider";

export default function NovaSessaoScreen() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const { usuario, recarregarUsuario } = useAuth();
  const { sessaoAtiva, concluindo, iniciarSessao, pausarSessao, retomarSessao, atualizarFoto, concluirSessao, cancelarSessao } = useSessaoFoco();
  const [salvandoLocal, setSalvandoLocal] = useState(false);

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
  const [monitorarSinalGps, setMonitorarSinalGps] = useState(false);
  const [enderecoManual, setEnderecoManual] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // Só inicia watchPositionAsync após o usuário interagir ou quando a permissão já estiver concedida (RNF02/RNF03)
  const { coords: coordsMonitoradas } = useLocation({
    ativo: anexarGps && monitorarSinalGps && !sessaoAtiva,
    distanceInterval: 10,
  });

  const xpPrevisto = CalculoXpService.calcular({
    duracaoMinutos,
    comFoto: !!fotoUri,
    comGps: anexarGps || !!enderecoManual.trim(),
  });
  const bonusPrevisto = xpPrevisto - Math.max(1, Math.floor(duracaoMinutos));

  // Status de Envio e Evidências
  const salvando = salvandoLocal || concluindo;
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [avisoGpsMsg, setAvisoGpsMsg] = useState<string | null>(null);
  const [podeAbrirAjustesGps, setPodeAbrirAjustesGps] = useState(false);
  const [erroFotoMsg, setErroFotoMsg] = useState<string | null>(null);
  const [podeAbrirAjustesFoto, setPodeAbrirAjustesFoto] = useState(false);
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
      enderecoManual: enderecoManual.trim() || null,
      fotoUri,
    });
  };

  // Diagnosticar status de GPS e permissão quando o usuário ativa o toggle (PDF 02, slides 9, 10 e 18)
  const handleAlternarGps = async () => {
    const novoValor = !anexarGps;
    setAnexarGps(novoValor);
    setAvisoGpsMsg(null);
    setPodeAbrirAjustesGps(false);

    if (novoValor && DIContainer.gateways.location.diagnosticarPermissao) {
      try {
        const diag = await DIContainer.gateways.location.diagnosticarPermissao();
        if (!diag.servicosAtivos) {
          setAvisoGpsMsg('O GPS do aparelho está desligado. A sessão poderá ser salva sem localização.');
          setPodeAbrirAjustesGps(true);
          setMonitorarSinalGps(false);
        } else if (!diag.permissaoConcedida && !diag.canAskAgain) {
          setAvisoGpsMsg('Permissão de localização bloqueada. Habilite nas configurações do sistema.');
          setPodeAbrirAjustesGps(true);
          setMonitorarSinalGps(false);
        } else if (diag.permissaoConcedida) {
          setMonitorarSinalGps(true);
        }
      } catch {
        // Diagnóstico é opcional e não bloqueia a interação
      }
    } else {
      setMonitorarSinalGps(false);
    }
  };

  const handleAbrirConfiguracoesSistema = () => {
    Linking.openSettings().catch(() => {});
  };

  // Finalizar Sessão Ativa em Execução
  const voltarParaDashboard = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)');
    }
  };

  const handleFinalizarSessaoAtiva = async () => {
    if (!usuario || salvando) return;
    setSalvandoLocal(true);
    setErroMsg(null);
    const res = await concluirSessao(usuario.id);
    if (res.isSuccess) {
      if (res.avisoGps) {
        setAvisoGpsMsg(res.avisoGps);
      }
      setSucessoMsg(`+${res.xpGanho} XP registrados com sucesso!`);
      setSalvandoLocal(false);
      await recarregarUsuario();
    } else {
      setSalvandoLocal(false);
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

  const aplicarNovaFoto = (uri: string | null) => {
    if (sessaoAtiva) {
      atualizarFoto(uri);
    } else {
      setFotoUri(uri);
    }
  };

  // Capturar Foto via Câmera ou Galeria
  const handleCapturarOuEscolherFoto = async (origem: 'camera' | 'galeria') => {
    setCarregandoFoto(true);
    setErroFotoMsg(null);
    setPodeAbrirAjustesFoto(false);
    setErroMsg(null);
    try {
      const uri =
        origem === 'galeria' && DIContainer.gateways.camera.selecionarDaGaleria
          ? await DIContainer.gateways.camera.selecionarDaGaleria()
          : await DIContainer.gateways.camera.capturarFoto();
      if (uri) {
        aplicarNovaFoto(uri);
      }
    } catch (e: any) {
      const msg = e?.message || 'Erro ao anexar foto';
      setErroFotoMsg(msg);
      if (/permanentemente/i.test(msg)) {
        setPodeAbrirAjustesFoto(true);
      }
    } finally {
      setCarregandoFoto(false);
    }
  };

  return (
    <Screen
      footer={
        sucessoMsg ? (
          <View style={styles.runningFooterRow}>
            <Button
              label="Nova Sessão"
              icon="add-circle-outline"
              variant="secondary"
              onPress={() => {
                setSucessoMsg(null);
                setAvisoGpsMsg(null);
                setErroFotoMsg(null);
                setErroMsg(null);
                setFotoUri(null);
              }}
              style={styles.flex}
            />
            <Button
              label="Voltar ao Início"
              icon="home-outline"
              variant="primary"
              onPress={voltarParaDashboard}
              style={styles.flex}
            />
          </View>
        ) : sessaoAtiva ? (
          <View style={styles.runningFooterRow}>
            {sessaoAtiva.emExecucao ? (
              <Button
                label="Pausar"
                icon="pause"
                variant="secondary"
                disabled={salvando}
                onPress={pausarSessao}
                style={styles.flex}
              />
            ) : (
              <Button
                label="Retomar"
                icon="play"
                variant="primary"
                disabled={salvando}
                onPress={retomarSessao}
                style={styles.flex}
              />
            )}
            <Button
              label="Concluir"
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
        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o Dashboard"
          onPress={voltarParaDashboard}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <AppText variant="overline" color={Colors.textSecondary}>
            STUDYRATS
          </AppText>
          <AppText variant="heading" numberOfLines={1}>
            Sessão de Foco
          </AppText>
        </View>
      </View>

      {sucessoMsg ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.sucessoCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <AppText variant="title" color={Colors.success} style={styles.centerText}>
              {sucessoMsg}
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
              Sua sessão foi salva localmente no dispositivo e será sincronizada com sua conta.
            </AppText>
            {avisoGpsMsg && (
              <AppText variant="caption" color={Colors.warning} style={styles.centerText}>
                Aviso GPS: {avisoGpsMsg}
              </AppText>
            )}
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
              <View style={styles.runningMetaRow}>
                <Ionicons name="journal" size={18} color={sessaoAtiva.disciplina.cor} />
                <AppText variant="heading" numberOfLines={1} style={styles.runningMetaText}>
                  {sessaoAtiva.disciplina.nome}
                </AppText>
              </View>
              {sessaoAtiva.topico && (
                <View style={styles.runningMetaRow}>
                  <Ionicons name="bookmark-outline" size={14} color={Colors.textSecondary} />
                  <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1} style={styles.runningMetaText}>
                    {sessaoAtiva.topico.nome}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.runningPhotoSection}>
              <View style={styles.rowBetween}>
                <AppText variant="label">Foto do Caderno (+10 XP)</AppText>
              </View>

              {sessaoAtiva.fotoUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: sessaoAtiva.fotoUri }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable disabled={salvando} onPress={() => aplicarNovaFoto(null)} style={styles.removePhotoBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoButtonsRow}>
                  <Button
                    label="Câmera"
                    variant="secondary"
                    icon="camera-outline"
                    loading={carregandoFoto}
                    disabled={salvando}
                    onPress={() => handleCapturarOuEscolherFoto('camera')}
                    style={styles.flex}
                  />
                  <Button
                    label="Galeria"
                    variant="secondary"
                    icon="image-outline"
                    loading={carregandoFoto}
                    disabled={salvando}
                    onPress={() => handleCapturarOuEscolherFoto('galeria')}
                    style={styles.flex}
                  />
                </View>
              )}

              {erroFotoMsg && (
                <View style={styles.gpsWarningBox}>
                  <AppText variant="caption" color={Colors.danger}>
                    {erroFotoMsg}
                  </AppText>
                  {podeAbrirAjustesFoto && (
                    <Button
                      label="Abrir Configurações"
                      variant="secondary"
                      icon="settings-outline"
                      onPress={handleAbrirConfiguracoesSistema}
                    />
                  )}
                </View>
              )}
            </View>

            <Button
              label="Cancelar Sessão"
              variant="secondary"
              icon="close-circle-outline"
              disabled={salvando}
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
                      onPress={() => router.push({ pathname: '/(app)/materias', params: { novo: '1' } })}
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
                      <View style={styles.flex}>
                        <TextField
                          label=""
                          icon="bookmark-outline"
                          placeholder="Nome do novo tópico"
                          value={novoTopicoNome}
                          onChangeText={setNovoTopicoNome}
                        />
                      </View>
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
                      Nenhum tópico cadastrado nesta disciplina. Clique em &quot;+ Criar Rápido&quot; para adicionar.
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
                <View style={styles.xpPreviewLeft}>
                  <View style={styles.xpStarCircle}>
                    <Ionicons name="star" size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.xpPreviewTexts}>
                    <AppText variant="label">Ganho Previsto</AppText>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      {duracaoMinutos} XP Base {bonusPrevisto > 0 ? `+ ${bonusPrevisto} XP Bônus` : '(sem bônus)'}
                    </AppText>
                  </View>
                </View>
                <View style={styles.xpPreviewTotalBadge}>
                  <AppText variant="heading" color={Colors.primary}>
                    +{xpPrevisto} XP
                  </AppText>
                </View>
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
              <Pressable onPress={handleAlternarGps} style={styles.evidenceItem}>
                <View style={styles.evidenceLeft}>
                  <View style={styles.evidenceIconBox}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={anexarGps ? Colors.success : Colors.textMuted}
                    />
                  </View>
                  <View style={styles.evidenceTextCol}>
                    <AppText variant="label">Anexar Localização (GPS)</AppText>
                    <AppText variant="caption" color={anexarGps ? Colors.success : Colors.textMuted}>
                      {anexarGps
                        ? coordsMonitoradas
                          ? `● Sinal GPS ativo (±${Math.round(coordsMonitoradas.accuracy ?? 10)} m) · +5 XP`
                          : '● Captura ao concluir · +5 XP'
                        : 'Desativado'}
                    </AppText>
                  </View>
                </View>
                <View style={[styles.toggleSwitch, anexarGps && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleKnob, anexarGps && styles.toggleKnobActive]} />
                </View>
              </Pressable>

              {avisoGpsMsg && (
                <View style={styles.gpsWarningBox}>
                  <AppText variant="caption" color={Colors.warning}>
                    {avisoGpsMsg}
                  </AppText>
                  {podeAbrirAjustesGps && (
                    <Button
                      label="Abrir Configurações"
                      variant="secondary"
                      icon="settings-outline"
                      onPress={handleAbrirConfiguracoesSistema}
                    />
                  )}
                </View>
              )}

              {(!anexarGps || !!avisoGpsMsg) && (
                <TextField
                  label="Local ou endereço manual (Geocoding opcional)"
                  icon="map-outline"
                  value={enderecoManual}
                  onChangeText={setEnderecoManual}
                  placeholder="Ex: Biblioteca Central, Varginha"
                  hint="Convertido em coordenadas aproximadas se o GPS não for usado"
                />
              )}

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
                <View style={styles.photoButtonsRow}>
                  <Button
                    label="Câmera"
                    variant="secondary"
                    icon="camera"
                    loading={carregandoFoto}
                    onPress={() => handleCapturarOuEscolherFoto('camera')}
                    style={styles.flex}
                  />
                  <Button
                    label="Galeria"
                    variant="secondary"
                    icon="image-outline"
                    loading={carregandoFoto}
                    onPress={() => handleCapturarOuEscolherFoto('galeria')}
                    style={styles.flex}
                  />
                </View>
              )}

              {erroFotoMsg && (
                <View style={styles.gpsWarningBox}>
                  <AppText variant="caption" color={Colors.danger}>
                    {erroFotoMsg}
                  </AppText>
                  {podeAbrirAjustesFoto && (
                    <Button
                      label="Abrir Configurações"
                      variant="secondary"
                      icon="settings-outline"
                      onPress={handleAbrirConfiguracoesSistema}
                    />
                  )}
                </View>
              )}
            </Card>
          </Animated.View>
        </>
      )}

      {erroMsg && !sucessoMsg && (
        <Card style={styles.erroCard}>
          <AppText variant="caption" color={Colors.danger}>
            {erroMsg}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const useStyles = (Colors: any) => StyleSheet.create({
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  timerDisplayContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  timerDisplayText: {
    fontSize: 54,
    lineHeight: 62,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  runningMetaInfo: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  runningMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  runningMetaText: {
    flexShrink: 1,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  headerTitleCol: { flex: 1, flexShrink: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xpPreviewLeft: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  xpStarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  xpPreviewTexts: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  xpPreviewTotalBadge: {
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    flexShrink: 0,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  evidenceLeft: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
  },
  evidenceTextCol: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
  },
  evidenceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 3,
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textMuted,
    alignSelf: 'flex-start',
  },
  toggleKnobActive: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-end',
  },
  photoButtonsRow: { flexDirection: 'row', gap: Spacing.two, width: '100%' },
  runningPhotoSection: { width: '100%', gap: Spacing.two },
  photoPreviewContainer: { position: 'relative', width: '100%', height: 160, borderRadius: Radius.md, overflow: 'hidden' },
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
  gpsWarningBox: {
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  erroCard: { backgroundColor: Colors.dangerSoft, padding: Spacing.three },
  flex: { flex: 1 },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});
