import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#121214' },
      headerTintColor: '#fff',
      tabBarStyle: { backgroundColor: '#121214', borderTopColor: '#202024' },
      tabBarActiveTintColor: '#00ff00',
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="disciplinas" 
        options={{ 
          title: 'Disciplinas',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
