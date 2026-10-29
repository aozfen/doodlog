import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { loadStore } from '@/mock';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, text: colors.ink, primary: colors.red },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Caveat_700Bold, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const [storeLoaded, setStoreLoaded] = useState(false);
  const loaded = fontsLoaded && storeLoaded;

  useEffect(() => {
    loadStore().then(() => setStoreLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen
          name="first-drawing"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
        />
        <Stack.Screen name="offer" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen
          name="share/[id]"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.ink },
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
