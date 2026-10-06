import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { SessaoFocoProvider } from '@/providers/SessaoFocoProvider';
import { useAppTheme } from "@/providers/ThemeProvider";
import { Colors as GlobalColors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: GlobalColors.background, card: GlobalColors.surface, primary: GlobalColors.primary },
};

function RootNavigator() {
    const { colors: Colors } = useAppTheme();

  const { usuario, restaurando, precisaOnboarding } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
    }
  }, [usuario, precisaOnboarding, pronto, segments, router]);

  if (!pronto) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background }, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const { colors: Colors, modoEscuro } = useAppTheme();

  const navTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: Colors.background, card: Colors.surface, primary: Colors.primary },
  };

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <SessaoFocoProvider>
          <StatusBar style={modoEscuro ? 'light' : 'dark'} />
          <RootNavigator />
        </SessaoFocoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
