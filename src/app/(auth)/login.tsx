import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

/** UC02 — Fazer Login (RF03). */
export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const senhaRef = useRef<TextInput>(null);

  const podeEnviar = email.trim().length > 0 && senha.length > 0;

  const entrar = async () => {
    if (!podeEnviar) return;
    setErro(null);
    setCarregando(true);
    const mensagem = await login(email, senha);
    setCarregando(false);
    if (mensagem) setErro(mensagem);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        <BrandMark size="lg" />
        <AppText variant="body" color={Colors.textSecondary} style={styles.center}>
          Estude, registre e suba no ranking.{'\n'}Mesmo sem internet.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <Card style={styles.form}>
          <View style={styles.formHeader}>
            <AppText variant="overline" color={Colors.primary}>
              Bem-vindo de volta
            </AppText>
            <AppText variant="title">Entrar na toca</AppText>
          </View>

          <TextField
            testID="login-email"
            label="Email"
            icon="mail-outline"
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => senhaRef.current?.focus()}
          />
          <TextField
            ref={senhaRef}
            testID="login-senha"
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Sua senha"
            secure
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            value={senha}
            onChangeText={setSenha}
            onSubmitEditing={entrar}
          />

          {erro && (
            <View style={styles.erro}>
              <AppText variant="caption" color={Colors.danger}>
                {erro}
              </AppText>
            </View>
          )}

          <Button
            testID="login-entrar"
            label="Entrar"
            iconRight="arrow-forward"
            onPress={entrar}
            loading={carregando}
            disabled={!podeEnviar}
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.footer}>
        <View style={styles.row}>
          <AppText variant="body" color={Colors.textSecondary}>
            Ainda não tem conta?
          </AppText>
          <Link href="/cadastro" replace style={styles.link}>
            <AppText variant="label" color={Colors.primary}>
              Criar conta
            </AppText>
          </Link>
        </View>
        <Pill tone="success" dot label="Seus dados ficam salvos no aparelho" />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: Spacing.five },
  hero: { alignItems: 'center', gap: Spacing.three },
  center: { textAlign: 'center' },
  form: { gap: Spacing.three + 4, padding: Spacing.four },
  formHeader: { gap: Spacing.one },
  erro: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  footer: { alignItems: 'center', gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { paddingVertical: Spacing.one },
});
