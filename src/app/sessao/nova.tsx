import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAtividades } from '../../hooks/useAtividades';
import { useLocalSearchParams, router } from 'expo-router';

export default function NovaSessaoScreen() {
  const { disciplinaId } = useLocalSearchParams<{ disciplinaId: string }>();
  const { usuario } = useAuth();
  const { registrarSessao, cadastrarTopico, disciplinas } = useAtividades(usuario?.id || '');

  const [topico, setTopico] = useState('');
  const [loading, setLoading] = useState(false);
  const [comFoto, setComFoto] = useState(true); // Switch mockado
  
  const disciplina = disciplinas.find(d => d.id === disciplinaId);

  const handleIniciarSessao = async () => {
    if (!usuario) return;
    setLoading(true);

    try {
      // Cria tópico fictício apenas para a demonstração, se não houver
      const topicoRes = await cadastrarTopico(disciplinaId, topico || 'Revisão Geral');
      if (!topicoRes.isSuccess) throw new Error(topicoRes.error);

      // Inicia sessão de estudo, invocando Camera e GPS nativos via Gateways
      const sessaoRes = await registrarSessao(
        disciplinaId,
        topicoRes.value.id,
        60, // 60 minutos mockado
        comFoto
      );

      if (sessaoRes.isSuccess) {
        Alert.alert('Sucesso!', 'Sessão concluída. Você ganhou +60 XP e a foto foi anexada via expo-camera.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erro', sessaoRes.error);
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!disciplina) return <View style={styles.container}><Text style={{color:'#fff'}}>Carregando...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estudar: {disciplina.nome}</Text>
      <Text style={styles.subtitle}>Esta ação invocará a Câmera e o GPS nativo do seu dispositivo graças aos Adapters injetados.</Text>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: comFoto ? '#00ff00' : '#333' }]} 
        onPress={() => setComFoto(!comFoto)}
      >
        <Text style={[styles.buttonText, { color: comFoto ? '#121214' : '#A8A8B3' }]}>
          {comFoto ? '📸 Tirar foto ao finalizar' : '📷 Sem foto'}
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.startButton} onPress={handleIniciarSessao} disabled={loading}>
        {loading ? <ActivityIndicator color="#121214" /> : <Text style={styles.startButtonText}>INICIAR SESSÃO</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#00ff00', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#A8A8B3', marginBottom: 30, lineHeight: 20 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  startButton: { backgroundColor: '#00ff00', padding: 20, borderRadius: 8, alignItems: 'center' },
  startButtonText: { color: '#121214', fontWeight: 'bold', fontSize: 18 }
});
