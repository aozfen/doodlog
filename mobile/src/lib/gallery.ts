// The user's photo library: today's photos for the "Anı ekle" sheet. Needs photo access;
// the "Tüm fotoğraflar" picker works without it.
import {
  Asset,
  AssetField,
  MediaSubtype,
  MediaType,
  Query,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library';
import { Linking } from 'react-native';

import { GALLERY_FETCH, RECENT_PHOTO_DAYS } from '@/constants';
import { DAY_MS, getToday, startOfDay } from '@/lib/date';

export type GalleryAccess = 'all' | 'limited' | 'denied';

/** Asks for photo access the first time; later only reads the answer. */
export async function galleryAccess(): Promise<GalleryAccess> {
  let permission = await getPermissionsAsync(false, ['photo']);
  if (permission.status === 'undetermined') permission = await requestPermissionsAsync(false, ['photo']);
  if (permission.status !== 'granted') return 'denied';
  return permission.accessPrivileges === 'limited' ? 'limited' : 'all';
}

/** Photos (no screenshots) taken since `since`, newest first, as `ph://` ids. */
async function photosSince(since: number) {
  const assets = await new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
    .gte(AssetField.CREATION_TIME, since)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(GALLERY_FETCH)
    .exeForMetadata();
  return assets.filter((a) => !a.mediaSubtypes?.includes(MediaSubtype.SCREENSHOT)).map((a) => a.id);
}

/** Today's photos. When there are none, the last few days' photos stand in (`today` is false). */
export async function recentPhotos(): Promise<{ ids: string[]; today: boolean }> {
  const midnight = startOfDay(getToday()).getTime();
  const today = await photosSince(midnight);
  if (today.length > 0) return { ids: today, today: true };
  return { ids: await photosSince(midnight - RECENT_PHOTO_DAYS * DAY_MS), today: false };
}

export const isGalleryId = (uri: string) => uri.startsWith('ph://');

/** A local file URI for a gallery photo (downloaded from iCloud when needed). */
export const galleryFileUri = (id: string) => new Asset(id).getUri();

export const openPhotoSettings = () => Linking.openSettings();
