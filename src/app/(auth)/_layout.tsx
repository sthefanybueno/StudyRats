import { Stack } from 'expo-router';
import { useAppTheme } from "@/providers/ThemeProvider";

export default function AuthLayout() {
    const { colors: Colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
    </Stack>
  );
}
