import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { DisciplinaCores, Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from "@/providers/ThemeProvider";

export default function MateriasScreen() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);

  const { usuario } = useAuth();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Form para Cadastrar Nova Matéria
  const [mostrarFormMateria, setMostrarFormMateria] = useState(false);
  const [nomeNovaMateria, setNomeNovaMateria] = useState('');
  const [corNovaMateria, setCorNovaMateria] = useState<string>(DisciplinaCores[0]);
  const [erroMateria, setErroMateria] = useState<string | null>(null);

  // Modal e Gestão de Tópicos da Matéria selecionada
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
  const [nomeNovoTopico, setNomeNovoTopico] = useState('');
  const [erroTopico, setErroTopico] = useState<string | null>(null);

  // Edição de Tópico
  const [topicoEditandoId, setTopicoEditandoId] = useState<string | null>(null);
  const [nomeTopicoEditando, setNomeTopicoEditando] = useState('');
  const [erroTopicoEditando, setErroTopicoEditando] = useState<string | null>(null);

  // Carregar Disciplinas Locais
  const carregarDisciplinas = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    try {
      const list = await DIContainer.repositories.disciplina.listarPorUsuario(usuario.id);
      setDisciplinas(list);

      // Atualizar a disciplina selecionada se estiver com o modal aberto
      if (disciplinaSelecionada) {
        const atual = list.find(d => d.id === disciplinaSelecionada.id);
        if (atual) setDisciplinaSelecionada(atual);
      }
    } catch (e) {
      console.error('Erro ao carregar matérias:', e);
    } finally {
      setCarregando(false);
    }
  }, [usuario, disciplinaSelecionada?.id]);

  useFocusEffect(
    useCallback(() => {
      carregarDisciplinas();
    }, [carregarDisciplinas])
  );

  // Cadastrar Matéria Funcional
  const handleCadastrarMateria = async () => {
    if (!usuario) return;
    if (!nomeNovaMateria.trim()) {
      setErroMateria('Informe o nome da matéria');
      return;
    }

    const res = await DIContainer.cadastrarDisciplina.execute({
      usuarioId: usuario.id,
      nome: nomeNovaMateria.trim(),
      cor: corNovaMateria,
    });

    if (res.isSuccess) {
      setNomeNovaMateria('');
      setMostrarFormMateria(false);
      setErroMateria(null);
      await carregarDisciplinas();
    } else {
      setErroMateria(res.error);
    }
  };

  // Cadastrar Tópico na Matéria Selecionada
  const handleCadastrarTopico = async () => {
    if (!disciplinaSelecionada) return;
    if (!nomeNovoTopico.trim()) {
      setErroTopico('Informe o nome do tópico');
      return;
    }

    const res = await DIContainer.cadastrarTopico.execute({
      disciplinaId: disciplinaSelecionada.id,
      nome: nomeNovoTopico.trim(),
    });

    if (res.isSuccess) {
      setNomeNovoTopico('');
      setErroTopico(null);
      await carregarDisciplinas();
    } else {
      setErroTopico('Erro ao adicionar tópico');
    }
  };

  // Editar Tópico na Matéria Selecionada
  const handleSalvarEdicaoTopico = async (topicoId: string) => {
    if (!disciplinaSelecionada) return;
    if (!nomeTopicoEditando.trim()) {
      setErroTopicoEditando('O nome do tópico não pode ser vazio');
      return;
    }

    const res = await DIContainer.atualizarTopico.execute({
      disciplinaId: disciplinaSelecionada.id,
      topicoId,
      novoNome: nomeTopicoEditando.trim(),
    });

    if (res.isSuccess) {
      setTopicoEditandoId(null);
      setNomeTopicoEditando('');
      setErroTopicoEditando(null);
      await carregarDisciplinas();
    } else {
      setErroTopicoEditando(res.error);
    }
  };

  // Excluir Tópico na Matéria Selecionada
  const handleDeletarTopico = async (topicoId: string) => {
    if (!disciplinaSelecionada) return;
    const res = await DIContainer.deletarTopico.execute({
      disciplinaId: disciplinaSelecionada.id,
      topicoId,
    });

    if (res.isSuccess) {
      await carregarDisciplinas();
    }
  };

  // Excluir Matéria (Soft Delete)
  const handleDeletarMateria = async (d: Disciplina) => {
    d.marcarComoDeletada();
    await DIContainer.repositories.disciplina.salvar(d);
    if (disciplinaSelecionada?.id === d.id) {
      setDisciplinaSelecionada(null);
    }
    await carregarDisciplinas();
  };

  return (
    <Screen contentStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Gerenciamento de Matérias" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync Local" />
          <View style={styles.avatarBox}>
            <AppText variant="label" color={Colors.primary}>
              {usuario?.nomeExibicao[0]?.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      {/* Header com resumo de Matérias */}
      <View style={styles.summaryHeader}>
        <View>
          <AppText variant="title">Minhas Matérias</AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            {disciplinas.length} {disciplinas.length === 1 ? 'matéria cadastrada' : 'matérias cadastradas'}
          </AppText>
        </View>
        <Pill tone="primary" icon="book-outline" label={`${disciplinas.reduce((acc, d) => acc + d.topicos.length, 0)} tópicos`} />
      </View>

      {/* Botão de Cadastrar Nova Matéria */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <Button
          testID="btn-cadastrar-materia"
          label={mostrarFormMateria ? 'Cancelar Cadastro' : '+ Cadastrar Nova Matéria'}
          variant={mostrarFormMateria ? 'secondary' : 'primary'}
          icon={mostrarFormMateria ? 'close-circle-outline' : 'add-circle-outline'}
          onPress={() => setMostrarFormMateria(f => !f)}
        />
      </Animated.View>

      {/* Formulário de Cadastro de Matéria */}
      {mostrarFormMateria && (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card style={styles.formCard}>
            <AppText variant="heading">Nova Matéria</AppText>

            <TextField
              label="Nome da Matéria"
              icon="book-outline"
              placeholder="Ex.: Arquitetura de Sistemas"
              value={nomeNovaMateria}
              onChangeText={setNomeNovaMateria}
              error={erroMateria}
            />

            <View style={styles.colorGroup}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Cor da Matéria
              </AppText>
              <View style={styles.colorPalette}>
                {DisciplinaCores.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setCorNovaMateria(c)}
                    style={[styles.colorSwatch, { backgroundColor: c }, corNovaMateria === c && styles.colorSwatchActive]}>
                    {corNovaMateria === c && <Ionicons name="checkmark" size={14} color="#000" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <Button label="Salvar Matéria" variant="primary" onPress={handleCadastrarMateria} />
          </Card>
        </Animated.View>
      )}

      {/* Seção Disciplinas */}
      <View style={styles.sectionHeader}>
        <AppText variant="overline" color={Colors.textSecondary}>
          SUAS DISCIPLINAS
        </AppText>
        <Pill tone="success" icon="cloud-done-outline" label="Banco Local Atualizado" />
      </View>

      {disciplinas.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="journal-outline" size={36} color={Colors.textMuted} />
          <AppText variant="heading" style={styles.centerText}>
            Nenhuma matéria cadastrada
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
            Clique no botão "+ Cadastrar Nova Matéria" para adicionar suas disciplinas do semestre!
          </AppText>
        </Card>
      ) : (
        disciplinas.map(disc => (
          <Animated.View key={disc.id} layout={LinearTransition} exiting={FadeOut}>
            <Pressable onPress={() => setDisciplinaSelecionada(disc)}>
              <Card accent={disc.cor} style={styles.materiaCard}>
                <View style={styles.materiaHeader}>
                  <View style={[styles.materiaIconBox, { backgroundColor: disc.cor + '22' }]}>
                    <Ionicons name="journal" size={20} color={disc.cor} />
                  </View>

                  <View style={styles.flex}>
                    <AppText variant="heading">{disc.nome}</AppText>
                    <AppText variant="caption" color={Colors.textSecondary}>
                      {disc.topicos.length} {disc.topicos.length === 1 ? 'tópico cadastrado' : 'tópicos cadastrados'}
                    </AppText>
                  </View>

                  <Pressable
                    hitSlop={12}
                    onPress={e => {
                      e.stopPropagation();
                      handleDeletarMateria(disc);
                    }}
                    style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>

                <View style={styles.materiaCardFooter}>
                  <View style={styles.openDetailAction}>
                    <AppText variant="label" color={disc.cor} style={styles.boldText}>
                      Abrir matéria e tópicos
                    </AppText>
                    <Ionicons name="chevron-forward" size={16} color={disc.cor} />
                  </View>
                  <Pill tone="success" dot label="Salvo localmente" />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        ))
      )}

      {/* Modal de Detalhes da Matéria e Tópicos */}
      <Modal
        visible={!!disciplinaSelecionada}
        animationType="slide"
        transparent
        onRequestClose={() => setDisciplinaSelecionada(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {disciplinaSelecionada && (
              <>
                {/* Header do Modal */}
                <View style={styles.modalHeader}>
                  <View style={styles.rowGap}>
                    <View
                      style={[
                        styles.materiaIconBox,
                        { backgroundColor: disciplinaSelecionada.cor + '22' },
                      ]}>
                      <Ionicons name="journal" size={22} color={disciplinaSelecionada.cor} />
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="heading">{disciplinaSelecionada.nome}</AppText>
                      <AppText variant="caption" color={Colors.textSecondary}>
                        Gerenciar tópicos de estudo
                      </AppText>
                    </View>
                  </View>
                  <Pressable style={styles.closeBtn} onPress={() => setDisciplinaSelecionada(null)}>
                    <Ionicons name="close" size={22} color={Colors.text} />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  {/* Seção Tópicos Cadastrados */}
                  <View style={styles.sectionHeader}>
                    <AppText variant="overline" color={Colors.textSecondary}>
                      TÓPICOS CADASTRADOS ({disciplinaSelecionada.topicos.length})
                    </AppText>
                  </View>

                  {disciplinaSelecionada.topicos.length === 0 ? (
                    <Card style={styles.emptyTopicsCard}>
                      <Ionicons name="bookmark-outline" size={28} color={Colors.textMuted} />
                      <AppText variant="label" color={Colors.textSecondary} style={styles.centerText}>
                        Nenhum tópico cadastrado nesta matéria ainda.
                      </AppText>
                      <AppText variant="caption" color={Colors.textMuted} style={styles.centerText}>
                        Use o formulário abaixo para adicionar seu primeiro tópico!
                      </AppText>
                    </Card>
                  ) : (
                    <View style={styles.topicosContainer}>
                      {disciplinaSelecionada.topicos.map((topico, idx) => (
                        <View key={topico.id} style={styles.topicoCard}>
                          {topicoEditandoId === topico.id ? (
                            <View style={styles.editTopicoRow}>
                              <TextField
                                label=""
                                icon="pencil-outline"
                                placeholder="Nome do tópico"
                                value={nomeTopicoEditando}
                                onChangeText={setNomeTopicoEditando}
                                error={erroTopicoEditando}
                                style={styles.flex}
                              />
                              <Pressable
                                style={styles.iconBtnAction}
                                onPress={() => handleSalvarEdicaoTopico(topico.id)}>
                                <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                              </Pressable>
                              <Pressable
                                style={styles.iconBtnAction}
                                onPress={() => {
                                  setTopicoEditandoId(null);
                                  setErroTopicoEditando(null);
                                }}>
                                <Ionicons name="close-circle-outline" size={22} color={Colors.textMuted} />
                              </Pressable>
                            </View>
                          ) : (
                            <>
                              <View style={styles.rowGap}>
                                <View style={[styles.topicoNumberBadge, { backgroundColor: disciplinaSelecionada.cor + '22' }]}>
                                  <AppText variant="caption" color={disciplinaSelecionada.cor} style={styles.boldText}>
                                    #{idx + 1}
                                  </AppText>
                                </View>
                                <AppText variant="body" style={styles.flex}>
                                  {topico.nome}
                                </AppText>
                              </View>
                              <View style={styles.topicoActions}>
                                <Pressable
                                  hitSlop={8}
                                  style={styles.iconBtnAction}
                                  onPress={() => {
                                    setTopicoEditandoId(topico.id);
                                    setNomeTopicoEditando(topico.nome);
                                    setErroTopicoEditando(null);
                                  }}>
                                  <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                                </Pressable>
                                <Pressable
                                  hitSlop={8}
                                  style={styles.iconBtnAction}
                                  onPress={() => handleDeletarTopico(topico.id)}>
                                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                                </Pressable>
                              </View>
                            </>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Formulário para Adicionar Novo Tópico */}
                  <Card style={styles.addTopicoModalCard}>
                    <AppText variant="heading">+ Adicionar Novo Tópico</AppText>

                    <TextField
                      label="Nome do Tópico"
                      icon="bookmark-outline"
                      placeholder="Ex.: Álgebra Booleana, Herança..."
                      value={nomeNovoTopico}
                      onChangeText={setNomeNovoTopico}
                      error={erroTopico}
                    />

                    <Button
                      label="Salvar Tópico"
                      variant="primary"
                      icon="add-circle-outline"
                      onPress={handleCadastrarTopico}
                    />
                  </Card>
                </ScrollView>
              </>
            )}
          </View>
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
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formCard: { gap: Spacing.three, padding: Spacing.four - 4, borderColor: Colors.primary },
  colorGroup: { gap: Spacing.two },
  colorPalette: { flexDirection: 'row', gap: Spacing.two },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { borderWidth: 2, borderColor: '#FFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  materiaCard: { gap: Spacing.three, padding: Spacing.four - 4 },
  materiaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2 },
  materiaIconBox: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surfaceInput, alignItems: 'center', justifyContent: 'center' },
  materiaCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.two, borderTopWidth: 1, borderTopColor: Colors.border },
  openDetailAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mascoteCard: { padding: Spacing.three + 2, backgroundColor: 'rgba(253,186,92,0.08)', borderColor: 'rgba(253,186,92,0.25)' },
  mascoteAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mascoteText: { lineHeight: 18, marginTop: 4 },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingTop: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  emptyTopicsCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  topicosContainer: {
    gap: Spacing.two,
  },
  topicoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceInput,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editTopicoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  topicoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtnAction: {
    padding: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicoNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTopicoModalCard: {
    gap: Spacing.three,
    padding: Spacing.four - 4,
    marginTop: Spacing.two,
    borderColor: Colors.primary,
  },

  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});
