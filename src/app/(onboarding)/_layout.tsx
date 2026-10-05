import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { OnboardingProvider } from '@/providers/OnboardingProvider';

/** RF02 — onboarding em 3 telas após o primeiro cadastro. */
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="disciplinas" options={{ gestureEnabled: false }} />
        <Stack.Screen name="meta" />
        <Stack.Screen name="tutorial" />
      </Stack>
    </OnboardingProvider>
  );
}
