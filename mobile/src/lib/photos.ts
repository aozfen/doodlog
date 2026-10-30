import * as ImagePicker from 'expo-image-picker';

import type { Picture } from '@/types';

/**
 * Opens the system photo picker. No permission prompt on iOS: the picker runs outside the app.
 * Returns null when the user cancels.
 */
export async function pickPhoto(): Promise<Picture | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri } : null;
}

/** Route param for a picked photo: its file URI. */
export const photoParam = (photo: Picture) =>
  typeof photo === 'object' && photo && 'uri' in photo && photo.uri ? photo.uri : null;
