import { router } from 'expo-router';
import { Alert } from 'react-native';

import { routes } from '@/constants';

/** Placeholder for actions that are not built yet. */
export const comingSoon = (title: string, message = 'Yakında') => Alert.alert(title, message);

/** No fırça left for a drawing: offer the brush screen. */
export const noBrushes = () =>
  Alert.alert('Fırçan kalmadı', 'Çizmek için fırça gerekiyor.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Fırça al', onPress: () => router.push(routes.brushes) },
  ]);
