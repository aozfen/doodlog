import { Stack } from 'expo-router';

import { colors } from '@/theme';

// The notebooks tab has its own stack so the bottom bar stays visible on a notebook page.
export default function NotebooksLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
