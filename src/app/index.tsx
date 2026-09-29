import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function LoginScreen() {
  const { usuario, carregando, erro, loginGoogle } = useAuth();

  useEffect(() => {
    if (usuario) {
      router.replace('/dashboard');
    }
  }, [usuario]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StudyRats</Text>
      <Text style={styles.subtitle}>Sua jornada de estudos gamificada</Text>

      {erro && <Text style={styles.error}>{erro}</Text>}

      {carregando ? (
        <ActivityIndicator size="large" color="#00ff00" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => loginGoogle()}>
          <Text style={styles.buttonText}>Entrar com o Google (Mock)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121214', padding: 20 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#00ff00', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#A8A8B3', marginBottom: 50 },
  error: { color: '#ff5555', marginBottom: 20 },
  button: { backgroundColor: '#00ff00', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#121214', fontWeight: 'bold', fontSize: 16 }
});
