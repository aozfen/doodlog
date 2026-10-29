import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';

import { AddMemoryProvider, useAddMemory } from '@/components/add/add-memory';
import { BottomBar } from '@/components/bottom-bar';
import { routes } from '@/constants';
import { useOnboarded } from '@/hooks/use-store';
import { colors } from '@/theme';

export default function TabsLayout() {
  const onboarded = useOnboarded();
  if (!onboarded) return <Redirect href={routes.onboarding} />;
  return (
    <AddMemoryProvider>
      <TabsWithBar />
    </AddMemoryProvider>
  );
}

function TabsWithBar() {
  const { open } = useAddMemory();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <BottomBar {...props} onAdd={open} />}>
      <Tabs.Screen name="(notebooks)" />
      <Tabs.Screen name="calendar" />
    </Tabs>
  );
}
