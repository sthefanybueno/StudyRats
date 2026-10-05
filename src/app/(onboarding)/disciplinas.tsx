import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { DIContainer } from '@/application/di/container';
import { OnboardingHeader } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, DisciplinaCores, Radius, Spacing } from '@/constants/theme';
import type { Disciplina } from '@/domain/entities/Disciplina';
import { useAuth } from '@/providers/AuthProvider';

const SUGESTOES = ['Cálculo', 'Física', 'Programação', 'Química', 'Biologia', 'História', 'Inglês', 'Direito'];

/** Onboarding 1/3 — escolher disciplinas (RF02 → UC04 / CadastrarDisciplinaUseCase). */
export default function OnboardingDisciplinas() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState<string>(DisciplinaCores[0]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const jaAdicionada = (n: string) => disciplinas.some(d => d.nome.toLowerCase() === n.trim().toLowerCase());

  const adicionar = async (nomeDisciplina: string, corDisciplina: string = cor) => {
    if (!usuario) return;
    if (jaAdicionada(nomeDisciplina)) {
      setErro('Essa disciplina já foi adicionada');
      return;
    }
    const res = await DIContainer.cadastrarDisciplina.execute({
      usuarioId: usuario.id,
      nome: nomeDisciplina.trim(),
      cor: corDisciplina,
    });
    if (!res.isSuccess) {
      setErro(res.error);
      return;
    }
    setErro(null);
    setNome('');
    setDisciplinas(prev => [...prev, res.value]);
    // próxima cor da paleta para variar visualmente
    const idx = DisciplinaCores.indexOf(corDisciplina as (typeof DisciplinaCores)[number]);
    setCor(DisciplinaCores[(idx + 1) % DisciplinaCores.length]);
  };

  const remover = async (disciplina: Disciplina) => {
    disciplina.marcarComoDeletada(); // soft delete (RF05)
    await DIContainer.repositories.disciplina.salvar(disciplina);
    setDisciplinas(prev => prev.filter(d => d.id !== disciplina.id));
  };

  return (
    <Screen
      footer={
        <Button
          testID="onboarding-disciplinas-continuar"
          label={disciplinas.length ? `Continuar com ${disciplinas.length}` : 'Adicione ao menos 1'}
          iconRight="arrow-forward"
          disabled={!disciplinas.length}
          onPress={() => router.push('/meta')}
        />
      }>
      <OnboardingHeader step={1} canGoBack={false} />

      <Animated.View entering={FadeInDown.duration(450)} style={styles.heading}>
        <AppText variant="display">
          Olá, {usuario?.nomeExibicao.split(' ')[0]}! 👋{'\n'}O que você estuda?
        </AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Cadastre suas matérias. Você poderá adicionar tópicos e editar tudo depois.
        </AppText>
      </Animated.View>

      <Card style={styles.form}>
        <TextField
          testID="onboarding-disciplina-nome"
          label="Nova disciplina"
          icon="book-outline"
          placeholder="Ex.: Cálculo II"
          value={nome}
          onChangeText={t => {
            setNome(t);
            setErro(null);
          }}
          returnKeyType="done"
          onSubmitEditing={() => nome.trim() && adicionar(nome)}
          error={erro}
        />

        <View style={styles.colorRow}>
          <AppText variant="caption" color={Colors.textSecondary}>
            Cor
          </AppText>
          <View style={styles.colors}>
            {DisciplinaCores.map(c => (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={`Cor ${c}`}
                accessibilityState={{ selected: c === cor }}
                onPress={() => setCor(c)}
                style={[styles.swatch, { backgroundColor: c }, c === cor && styles.swatchActive]}>
                {c === cor && <Ionicons name="checkmark" size={14} color={Colors.background} />}
              </Pressable>
            ))}
          </View>
        </View>

        <Button
          testID="onboarding-disciplina-adicionar"
          label="Adicionar disciplina"
          icon="add-circle-outline"
          variant="secondary"
          disabled={!nome.trim()}
          onPress={() => adicionar(nome)}
        />
      </Card>

      <View style={styles.section}>
        <AppText variant="overline" color={Colors.textSecondary}>
          Sugestões rápidas
        </AppText>
        <View style={styles.chips}>
          {SUGESTOES.filter(s => !jaAdicionada(s)).map(s => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => adicionar(s)}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
              <Ionicons name="add" size={14} color={Colors.primary} />
              <AppText variant="label">{s}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {disciplinas.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="overline" color={Colors.textSecondary}>
              Suas disciplinas
            </AppText>
            <Pill tone="success" icon="cloud-done-outline" label="Salvo no aparelho" />
          </View>
          {disciplinas.map(d => (
            <Animated.View key={d.id} entering={FadeInDown.springify()} exiting={FadeOut} layout={LinearTransition}>
              <Card accent={d.cor} style={styles.item}>
                <View style={[styles.itemIcon, { backgroundColor: d.cor + '22' }]}>
                  <Ionicons name="book" size={18} color={d.cor} />
                </View>
                <AppText variant="heading" style={styles.flex} numberOfLines={1}>
                  {d.nome}
                </AppText>
                <Pill tone="warning" dot label="Pendente" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${d.nome}`}
                  hitSlop={8}
                  onPress={() => remover(d)}
                  style={styles.remove}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </Pressable>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.two },
  form: { gap: Spacing.three, padding: Spacing.four - 4 },
  colorRow: { gap: Spacing.two },
  colors: { flexDirection: 'row', gap: Spacing.two + 2 },
  swatch: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderWidth: 2, borderColor: Colors.text },
  section: { gap: Spacing.three - 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three - 4, paddingVertical: Spacing.three - 2 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
