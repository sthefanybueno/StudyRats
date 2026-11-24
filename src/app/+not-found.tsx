/** Description: Rota especial +not-found.tsx do Expo Router para deep links ou caminhos inválidos. */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Surface';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useAppTheme } from '@/providers/ThemeProvider';

export default function NotFoundScreen() {
  const { colors: Colors } = useAppTheme();
  const { usuario, precisaOnboarding } = useAuth();

  const destinoInicial = !usuario
    ? '/(auth)/login'
    : precisaOnboarding
      ? '/(onboarding)/disciplinas'
      : '/(app)';

  return (
    <Screen contentStyle={styles.container}>
      <Card style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: Colors.primarySoft }]}>
          <Ionicons name="compass-outline" size={34} color={Colors.primary} />
        </View>
        <AppText variant="title" style={styles.centerText}>
          Página não encontrada
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} style={styles.centerText}>
          O endereço acessado não existe neste aplicativo.
        </AppText>
        <Button
          label="Voltar para o Início"
          icon="home-outline"
          onPress={() => router.replace(destinoInicial)}
          style={styles.button}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: Spacing.one,
  },
});

