import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAtividades } from '../../hooks/useAtividades';
import { router } from 'expo-router';

export default function DisciplinasScreen() {
  const { usuario } = useAuth();
  const { disciplinas, carregando, carregarDisciplinas, cadastrarDisciplina } = useAtividades(usuario?.id || '');
  
  const [novaDisciplina, setNovaDisciplina] = useState('');

  useEffect(() => {
    if (usuario) carregarDisciplinas();
  }, [usuario]);

  const handleCadastrar = async () => {
    if (novaDisciplina.trim() === '') return;
    await cadastrarDisciplina(novaDisciplina, '#00ff00');
    setNovaDisciplina('');
  };

  if (!usuario) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Disciplinas</Text>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Nova disciplina..." 
          placeholderTextColor="#A8A8B3"
          value={novaDisciplina}
          onChangeText={setNovaDisciplina}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCadastrar} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#121214" /> : <Text style={styles.addButtonText}>+</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={disciplinas}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/sessao/nova?disciplinaId=${item.id}`)}>
            <View style={[styles.colorBar, { backgroundColor: item.cor }]} />
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <Text style={styles.cardSub}>Toque para estudar</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma disciplina cadastrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#202024', color: '#fff', padding: 15, borderRadius: 8, marginRight: 10 },
  addButton: { backgroundColor: '#00ff00', width: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, fontWeight: 'bold', color: '#121214' },
  card: { backgroundColor: '#202024', borderRadius: 8, padding: 20, marginBottom: 10, overflow: 'hidden' },
  colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSub: { color: '#00ff00', fontSize: 12, marginTop: 5 },
  empty: { color: '#A8A8B3', textAlign: 'center', marginTop: 50 }
});
