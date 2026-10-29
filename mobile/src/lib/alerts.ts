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

/** A drawing did not come back. The brush is already refunded unless there was no answer. */
export const drawFailed = (kind: 'failed' | 'offline' | 'busy', onClose?: () => void) => {
  const copy = {
    failed: ['Çizemedik', 'Fırçan geri yüklendi. Başka bir fotoğrafla dene.'],
    offline: ['İnternet yok', 'Bağlanınca tekrar dene.'],
    busy: ['Hâlâ çiziliyor', 'Biraz sonra tekrar dene.'],
  } as const;
  const [title, message] = copy[kind];
  Alert.alert(title, message, [{ text: 'Tamam', onPress: onClose }], { cancelable: false });
};
