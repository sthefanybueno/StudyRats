import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill, ProgressBar } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, DisciplinaCores, Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import { useAuth } from '@/providers/AuthProvider';

export default function MateriasScreen() {
  const { usuario } = useAuth();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Form para Cadastrar Nova Matéria
  const [mostrarFormMateria, setMostrarFormMateria] = useState(false);
  const [nomeNovaMateria, setNomeNovaMateria] = useState('');
  const [corNovaMateria, setCorNovaMateria] = useState<string>(DisciplinaCores[0]);
  const [erroMateria, setErroMateria] = useState<string | null>(null);

  // Form para Adicionar Tópico a uma Matéria específica
  const [disciplinaAddTopicoId, setDisciplinaAddTopicoId] = useState<string | null>(null);
  const [nomeNovoTopico, setNomeNovoTopico] = useState('');

  // Carregar Disciplinas Locais
  const carregarDisciplinas = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    try {
      const list = await DIContainer.repositories.disciplina.listarPorUsuario(usuario.id);
      setDisciplinas(list);
    } catch (e) {
      console.error('Erro ao carregar matérias:', e);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

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

  // Cadastrar Tópico Funcional
  const handleCadastrarTopico = async (disciplinaId: string) => {
    if (!nomeNovoTopico.trim()) return;
    const res = await DIContainer.cadastrarTopico.execute({
      disciplinaId,
      nome: nomeNovoTopico.trim(),
    });
    if (res.isSuccess) {
      setNomeNovoTopico('');
      setDisciplinaAddTopicoId(null);
      await carregarDisciplinas();
    }
  };

  // Excluir Matéria (Soft Delete)
  const handleDeletarMateria = async (d: Disciplina) => {
    d.marcarComoDeletada();
    await DIContainer.repositories.disciplina.salvar(d);
    await carregarDisciplinas();
  };

  return (
    <Screen contentStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <BrandMark subtitle="Gerenciamento" />
        <View style={styles.topHeaderRight}>
          <Pill tone="success" dot label="Sync" />
          <View style={styles.avatarBox}>
            <AppText variant="label" color={Colors.primary}>
              {usuario?.nomeExibicao[0]?.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>

      {/* Tabs Switcher (Disciplinas vs Biblioteca IA) */}
      <View style={styles.subTabRow}>
        <Pressable style={[styles.subTab, styles.subTabActive]}>
          <Ionicons name="book" size={16} color={Colors.text} />
          <AppText variant="label">Disciplinas</AppText>
          <View style={styles.tabBadge}>
            <AppText variant="caption" color={Colors.text} style={styles.boldText}>
              {disciplinas.length}
            </AppText>
          </View>
        </Pressable>

        <Pressable style={styles.subTab}>
          <Ionicons name="sparkles" size={16} color={Colors.textMuted} />
          <AppText variant="label" color={Colors.textMuted}>
            Biblioteca IA
          </AppText>
          <View style={[styles.tabBadge, { backgroundColor: Colors.surfaceInput }]}>
            <AppText variant="caption" color={Colors.textMuted}>
              8
            </AppText>
          </View>
        </Pressable>
      </View>

      {/* Módulo Neural (IA Estática Demonstrativa) */}
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={styles.aiModuleCard}>
          <View style={styles.aiHeader}>
            <View style={styles.rowGap}>
              <View style={styles.botIconCircle}>
                <Ionicons name="hardware-chip-outline" size={18} color={Colors.aiText} />
              </View>
              <View>
                <AppText variant="overline" color={Colors.textSecondary}>
                  MÓDULO NEURAL STUDYRATS
                </AppText>
                <AppText variant="heading">Sínteses de IA Diárias</AppText>
              </View>
            </View>
            <Pill tone="success" dot label="Ativo" />
          </View>

          <View style={styles.aiCapacityRow}>
            <AppText variant="caption" color={Colors.textSecondary}>
              Capacidade de processamento
            </AppText>
            <AppText variant="label" color={Colors.aiText}>
              7 / 10 utilizados
            </AppText>
          </View>

          <ProgressBar progress={0.7} colors={[Colors.aiStrong, Colors.aiText]} />

          <View style={styles.aiFooterRow}>
            <AppText variant="caption" color={Colors.textMuted}>
              ⏱ 3 slots restantes hoje • Reseta às 00:00
            </AppText>
          </View>

          <Button
            label="Novo Resumo com IA (+25 XP)"
            variant="ai"
            icon="sparkles"
            disabled
            onPress={() => {}}
          />
        </Card>
      </Animated.View>

      {/* Botão de Cadastrar Nova Matéria (Funcional!) */}
      <Animated.View entering={FadeInDown.delay(60).duration(450)}>
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

      {/* Seção Disciplinas em Foco */}
      <View style={styles.sectionHeader}>
        <AppText variant="overline" color={Colors.textSecondary}>
          DISCIPLINAS EM FOCO
        </AppText>
        <Pill tone="success" icon="cloud-done-outline" label="Banco Local Atualizado" />
      </View>

      {disciplinas.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="journal-outline" size={32} color={Colors.textMuted} />
          <AppText variant="heading" style={styles.centerText}>
            Nenhuma matéria cadastrada
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary} style={styles.centerText}>
            Clique no botão acima para adicionar suas matérias do semestre!
          </AppText>
        </Card>
      ) : (
        disciplinas.map(disc => (
          <Animated.View key={disc.id} layout={LinearTransition} exiting={FadeOut}>
            <Card accent={disc.cor} style={styles.materiaCard}>
              <View style={styles.materiaHeader}>
                <View style={[styles.materiaIconBox, { backgroundColor: disc.cor + '22' }]}>
                  <Ionicons name="calculator-outline" size={20} color={disc.cor} />
                </View>

                <View style={styles.flex}>
                  <AppText variant="heading">{disc.nome}</AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {disc.topicos.length} {disc.topicos.length === 1 ? 'tópico cadastrado' : 'tópicos cadastrados'}
                  </AppText>
                </View>

                <Pressable hitSlop={8} onPress={() => handleDeletarMateria(disc)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </View>

              {/* Tópicos da Matéria */}
              {disc.topicos.length > 0 && (
                <View style={styles.topicosList}>
                  {disc.topicos.map(t => (
                    <View key={t.id} style={styles.topicoBadgeItem}>
                      <Ionicons name="bookmark-outline" size={12} color={disc.cor} />
                      <AppText variant="caption" color={Colors.text}>
                        {t.nome}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              {/* Adicionar Tópico Inline */}
              {disciplinaAddTopicoId === disc.id ? (
                <View style={styles.addTopicoForm}>
                  <TextField
                    label=""
                    icon="bookmark-outline"
                    placeholder="Nome do tópico"
                    value={nomeNovoTopico}
                    onChangeText={setNomeNovoTopico}
                    style={styles.flex}
                  />
                  <Button
                    label="Adicionar"
                    variant="primary"
                    onPress={() => handleCadastrarTopico(disc.id)}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => setDisciplinaAddTopicoId(disc.id)}
                  style={styles.addTopicoBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                  <AppText variant="caption" color={Colors.primary} style={styles.boldText}>
                    + Adicionar Tópico
                  </AppText>
                </Pressable>
              )}

              <View style={styles.materiaFooterBadges}>
                <Pill tone="primary" icon="layers-outline" label={`${disc.topicos.length} módulos`} />
                <Pill tone="success" dot label="Salvo no aparelho" />
              </View>
            </Card>
          </Animated.View>
        ))
      )}

      {/* Síntese Recente (Estática/Demonstrativa) */}
      <Animated.View entering={FadeInDown.delay(180).duration(450)}>
        <Card style={styles.sinteseCard}>
          <View style={styles.sinteseHeader}>
            <Pill tone="success" icon="wifi-outline" label="Disponível offline sem sinal" />
            <AppText variant="caption" color={Colors.textMuted}>
              Gerado há 2h
            </AppText>
          </View>

          <AppText variant="overline" color={Colors.aiText}>
            SÍNTESE RECENTE
          </AppText>
          <AppText variant="heading">Teoria de Ondas e Campos Eletromagnéticos</AppText>
          <AppText variant="caption" color={Colors.textSecondary} numberOfLines={2}>
            Equações de Maxwell unificadas, propagação em dielétricos e reflexão total interna. Síntese...
          </AppText>

          <View style={styles.sinteseActions}>
            <Button label="Ler Síntese" variant="secondary" icon="book-outline" style={styles.flex} onPress={() => {}} />
            <Button label="Áudio Síntese" variant="ai" icon="volume-high-outline" style={styles.flex} onPress={() => {}} />
          </View>
        </Card>
      </Animated.View>

      {/* Mascote Card (Pip, o Rato Sábio) */}
      <Animated.View entering={FadeInDown.delay(240).duration(450)}>
        <Card style={styles.mascoteCard}>
          <View style={styles.rowGap}>
            <View style={styles.mascoteAvatarCircle}>
              <Ionicons name="paw-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.flex}>
              <View style={styles.rowBetween}>
                <AppText variant="heading">Pip, o Rato Sábio</AppText>
                <Pill tone="primary" label="+150 XP" />
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={styles.mascoteText}>
                "Mais disciplinas cadastradas liberam árvores de habilidades e aceleram suas recompensas diárias no ranking!"
              </AppText>
            </View>
          </View>
        </Card>
      </Animated.View>
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
  subTabRow: { flexDirection: 'row', gap: Spacing.two, backgroundColor: Colors.surfaceInput, padding: 4, borderRadius: Radius.lg },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.md },
  subTabActive: { backgroundColor: Colors.surfaceRaised },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill, backgroundColor: Colors.primarySoft },
  aiModuleCard: { gap: Spacing.two + 4, padding: Spacing.four - 4, backgroundColor: 'rgba(109,40,217,0.12)', borderColor: 'rgba(139,92,246,0.3)' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  botIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.aiSoft, alignItems: 'center', justifyContent: 'center' },
  aiCapacityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formCard: { gap: Spacing.three, padding: Spacing.four - 4, borderColor: Colors.primary },
  colorGroup: { gap: Spacing.two },
  colorPalette: { flexDirection: 'row', gap: Spacing.two },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { borderWidth: 2, borderColor: '#FFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  materiaCard: { gap: Spacing.three, padding: Spacing.four - 4 },
  materiaHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 2 },
  materiaIconBox: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surfaceInput, alignItems: 'center', justifyContent: 'center' },
  topicosList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  topicoBadgeItem: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: Colors.surfaceInput },
  addTopicoForm: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  addTopicoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  materiaFooterBadges: { flexDirection: 'row', gap: Spacing.two },
  sinteseCard: { gap: Spacing.two + 2, padding: Spacing.four - 4 },
  sinteseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sinteseActions: { flexDirection: 'row', gap: Spacing.two },
  mascoteCard: { padding: Spacing.three + 2, backgroundColor: 'rgba(253,186,92,0.08)', borderColor: 'rgba(253,186,92,0.25)' },
  mascoteAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  mascoteText: { lineHeight: 18, marginTop: 4 },
  flex: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boldText: { fontFamily: 'PlusJakartaSans_700Bold' },
  centerText: { textAlign: 'center' },
});
