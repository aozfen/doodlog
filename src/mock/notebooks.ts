import { createIdFromString } from '@evolu/common';

import type { Notebook } from '@/types';

import { drawings, type DrawingKey } from './images';

/** Stable Evolu ids, so restoring the mock data reuses the same rows. */
const seedId = (key: string): string => createIdFromString<'Notebook'>(`seed-${key}`);
const [n1, n2, n3, n4] = ['n1', 'n2', 'n3', 'n4'].map(seedId);

export const seedNotebooks: Notebook[] = [
  { id: n1, name: 'Sevgilimle', kind: 'partner', createdAt: '2025-01-12', cover: drawings.couple02 },
  { id: n2, name: 'Fıstık', kind: 'pet', createdAt: '2025-03-02', cover: drawings.dog01 },
  { id: n3, name: 'Kendim', kind: 'self', createdAt: '2025-01-12', cover: drawings.self01 },
  { id: n4, name: 'Ailem', kind: 'family', createdAt: '2026-01-04', cover: drawings.couple05 },
];

/** Mock of the backend guess: which notebook the faces in a photo belong to. */
export const NOTEBOOK_OF: Record<DrawingKey, string> = {
  couple01: n1,
  couple02: n1,
  couple03: n1,
  couple04: n1,
  couple05: n4,
  couple06: n1,
  couple07: n1,
  couple08: n1,
  dog01: n2,
  self01: n3,
  self05: n3,
};
