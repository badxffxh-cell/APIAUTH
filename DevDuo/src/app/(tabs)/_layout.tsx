import { Tabs } from 'expo-router/js-tabs';

import { GlassTabBar } from '@/components/navigation/GlassTabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'shift',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aprender' }} />
      <Tabs.Screen name="editor" options={{ title: 'Editor' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistente' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
