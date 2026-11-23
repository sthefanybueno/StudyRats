/** Description: This file (src/app/(app)/_layout.tsx) contains the implementation for its respective feature. */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useAppTheme } from "@/providers/ThemeProvider";

/** Altura útil da tab bar (ícone + rótulo), sem contar o inset do sistema. */
const TAB_BAR_CONTENT_HEIGHT = 58;

export default function AppTabsLayout() {
    const { colors: Colors } = useAppTheme();
      const styles = useStyles(Colors);
  // Inset inferior real do aparelho (home indicator do iOS / barra de navegação do Android edge-to-edge).
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: [styles.tabBar, { height: TAB_BAR_CONTENT_HEIGHT + paddingBottom, paddingBottom }],
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materias"
        options={{
          title: 'Matérias',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const useStyles = (Colors: any) => StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
