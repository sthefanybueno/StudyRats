import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { DIContainer } from '../../application/di/container';
import { Usuario } from '../../domain/entities/Usuario';

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const [ranking, setRanking] = useState<Usuario[]>([]);

  useEffect(() => {
    DIContainer.consultarRanking.execute().then(res => {
      if (res.isSuccess) setRanking(res.value);
    });
  }, []);

  if (!usuario) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {usuario.nomeExibicao}</Text>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>XP Total</Text>
        <Text style={styles.statsValue}>{usuario.xpTotal}</Text>
        <Text style={styles.statsLabel}>Streak Atual</Text>
        <Text style={styles.statsValue}>🔥 {usuario.streakAtual} dias</Text>
      </View>

      <Text style={styles.sectionTitle}>Ranking Global (Top 3)</Text>
      {ranking.map((u, i) => (
        <View key={u.id} style={styles.rankItem}>
          <Text style={styles.rankPos}>{i + 1}º</Text>
          <Text style={styles.rankName}>{u.nomeExibicao}</Text>
          <Text style={styles.rankXp}>{u.xpSemanal} XP</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  statsCard: { backgroundColor: '#202024', padding: 20, borderRadius: 8, marginBottom: 30 },
  statsLabel: { color: '#A8A8B3', fontSize: 14 },
  statsValue: { color: '#00ff00', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  rankItem: { flexDirection: 'row', backgroundColor: '#202024', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center' },
  rankPos: { color: '#00ff00', fontWeight: 'bold', width: 30 },
  rankName: { color: '#fff', flex: 1 },
  rankXp: { color: '#A8A8B3' }
});
