import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SENHA_MIN_CARACTERES } from '@/application/use-cases/CadastrarUsuarioUseCase';
import { BrandMark } from '@/components/Brand';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Card, Pill } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/TextField';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/providers/AuthProvider';

/** UC01 — Fazer Cadastro (RF01): email, senha e nome de exibição. */
export default function CadastroScreen() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);

  const senhaOk = senha.length >= SENHA_MIN_CARACTERES;
  const podeEnviar = nome.trim().length > 0 && email.trim().length > 0 && senhaOk;

  const criarConta = async () => {
    if (!podeEnviar) return;
    setErro(null);
    setCarregando(true);
    const mensagem = await cadastrar(nome, email, senha);
    setCarregando(false);
    if (mensagem) setErro(mensagem);
  };

  return (
    <Screen contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <BrandMark subtitle="Criar conta" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.heading}>
        <AppText variant="display">Entre para a{'\n'}matilha de ratos 🐀</AppText>
        <AppText variant="body" color={Colors.textSecondary}>
          Cada sessão de estudo vale XP. Mantenha o streak e dispute o ranking semanal.
        </AppText>
        <View style={styles.perks}>
          <Pill tone="primary" icon="flash" label="+10 XP por sessão" />
          <Pill tone="warning" icon="flame" label="Bônus de streak" />
          <Pill tone="ai" icon="sparkles" label="Resumos com IA" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(500)}>
        <Card style={styles.form}>
          <TextField
            testID="cadastro-nome"
            label="Nome de exibição"
            icon="person-outline"
            placeholder="Como vão te ver no ranking"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="nickname"
            returnKeyType="next"
            value={nome}
            onChangeText={setNome}
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <TextField
            ref={emailRef}
            testID="cadastro-email"
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
            testID="cadastro-senha"
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Crie uma senha"
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            value={senha}
            onChangeText={setSenha}
            onSubmitEditing={criarConta}
            hint={`Mínimo de ${SENHA_MIN_CARACTERES} caracteres${senhaOk ? ' ✓' : ''}`}
          />

          {erro && (
            <View style={styles.erro}>
              <AppText variant="caption" color={Colors.danger}>
                {erro}
              </AppText>
            </View>
          )}

          <Button
            testID="cadastro-criar"
            label="Criar conta"
            iconRight="arrow-forward"
            onPress={criarConta}
            loading={carregando}
            disabled={!podeEnviar}
          />
          <AppText variant="caption" color={Colors.textMuted} style={styles.center}>
            O cadastro precisa de internet. Depois disso, o app funciona offline.
          </AppText>
        </Card>
      </Animated.View>

      <View style={styles.row}>
        <AppText variant="body" color={Colors.textSecondary}>
          Já tem conta?
        </AppText>
        <Link href="/login" replace style={styles.link}>
          <AppText variant="label" color={Colors.primary}>
            Entrar
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.four },
  heading: { gap: Spacing.three },
  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  form: { gap: Spacing.three + 4, padding: Spacing.four },
  erro: {
    backgroundColor: Colors.dangerSoft,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  link: { paddingVertical: Spacing.one },
});
