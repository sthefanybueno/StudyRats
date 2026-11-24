/** Description: This file (src/app/_layout.tsx) contains the implementation for its respective feature. */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useNetworkSync } from '@/hooks/useNetworkSync';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { SessaoFocoProvider, useSessaoFoco } from '@/providers/SessaoFocoProvider';
import { AppThemeProvider, useAppTheme } from "@/providers/ThemeProvider";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
    const { colors: Colors } = useAppTheme();

  const { usuario, restaurando, precisaOnboarding } = useAuth();
  const { tempoEsgotado } = useSessaoFoco();
  const { sincronizarManualmente } = useNetworkSync();
  const segments = useSegments();
  const router = useRouter();

  // Assim que o usuário autenticar ou restaurar a sessão, sincroniza imediatamente a fila Outbox com o Supabase
  useEffect(() => {
    if (usuario?.id) {
      void sincronizarManualmente();
    }
  }, [usuario?.id, sincronizarManualmente]);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const pronto = fontsLoaded && !restaurando;

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync();
    }
  }, [pronto]);

  // Garante redirecionamento imediato para /(auth)/login ao deslogar (sem fallback para +not-found em '/')
  useEffect(() => {
    if (!pronto) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!usuario && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (usuario && precisaOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/disciplinas');
    } else if (usuario && !precisaOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(app)');
    } else if (usuario && !precisaOnboarding && tempoEsgotado && segments.join('/') !== 'sessao/nova') {
      router.replace('/sessao/nova');
    }
  }, [usuario, precisaOnboarding, tempoEsgotado, pronto, segments, router]);

  if (!pronto) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="sessao/nova" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function InnerLayout() {
  const { colors: Colors, modoEscuro } = useAppTheme();

  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: Colors.background, card: Colors.surface, primary: Colors.primary },
  };

  return (
    <NavigationThemeProvider value={navTheme}>
      <AuthProvider>
        <SessaoFocoProvider>
          <StatusBar style={modoEscuro ? 'light' : 'dark'} />
          <RootNavigator />
        </SessaoFocoProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <InnerLayout />
    </AppThemeProvider>
  );
}
