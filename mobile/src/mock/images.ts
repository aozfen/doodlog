// Mock images from design/assets. Drawings are transparent PNGs, photos are the originals.

export const drawings = {
  couple01: require('@/assets/mock/couple_01.png'),
  couple02: require('@/assets/mock/couple_02.png'),
  couple03: require('@/assets/mock/couple_03.png'),
  couple04: require('@/assets/mock/couple_04.png'),
  couple05: require('@/assets/mock/couple_05.png'),
  couple06: require('@/assets/mock/couple_06.png'),
  couple07: require('@/assets/mock/couple_07.png'),
  couple08: require('@/assets/mock/couple_08.png'),
  dog01: require('@/assets/mock/dog_01.png'),
  self01: require('@/assets/mock/self_01.png'),
  self05: require('@/assets/mock/self_05.png'),
} as const;

export type DrawingKey = keyof typeof drawings;

/** Original photos (the user's gallery in the real app). Key = drawing the mock "Gemini" returns. */
export const photos: Partial<Record<DrawingKey, number>> = {
  couple01: require('@/assets/mock/photo_couple_01.jpg'),
  couple02: require('@/assets/mock/photo_couple_02.jpg'),
  couple03: require('@/assets/mock/photo_couple_03.jpg'),
  couple04: require('@/assets/mock/photo_couple_04.jpg'),
  couple05: require('@/assets/mock/photo_couple_05.jpg'),
  couple06: require('@/assets/mock/photo_couple_06.jpg'),
  couple07: require('@/assets/mock/photo_couple_07.jpg'),
  couple08: require('@/assets/mock/photo_couple_08.jpg'),
  self01: require('@/assets/mock/photo_self_01.jpg'),
  self05: require('@/assets/mock/photo_self_05.jpg'),
};
