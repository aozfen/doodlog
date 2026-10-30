// Bundled sample drawings and their photos: onboarding illustrations, the before/after on
// the photo step and the notebook kind cards. Never user data.
import type { Picture } from '@/types';

export const SAMPLE_DRAWINGS = {
  couple01: require('@/assets/samples/couple_01.png'),
  couple02: require('@/assets/samples/couple_02.png'),
  couple06: require('@/assets/samples/couple_06.png'),
  couple08: require('@/assets/samples/couple_08.png'),
  dog01: require('@/assets/samples/dog_01.png'),
  self01: require('@/assets/samples/self_01.png'),
  self05: require('@/assets/samples/self_05.png'),
} satisfies Record<string, Picture>;

export type SampleKey = keyof typeof SAMPLE_DRAWINGS;

/** The photo each sample drawing was made from, where there is one. */
export const SAMPLE_PHOTOS: Partial<Record<SampleKey, number>> = {
  couple02: require('@/assets/samples/photo_couple_02.jpg'),
  self01: require('@/assets/samples/photo_self_01.jpg'),
  self05: require('@/assets/samples/photo_self_05.jpg'),
};
