// App repository (Evolu backed, see store.ts). Screens read data only through these helpers.
import { getToday, isoDay, toIsoDay } from '@/lib/date';
import { notebookStats } from '@/lib/notebook-stats';

import type { DrawingKey } from './images';
import { NOTEBOOK_OF } from './notebooks';
import { getMemories, getNotebooks } from './store';

export { drawings, photos, type DrawingKey } from './images';
export {
  addMemory,
  applyBalance,
  createNotebook,
  deleteMemory,
  deleteNotebook,
  eraseEverything,
  finishOnboarding,
  setGoal,
  setMemoryNote,
  setReminderAt,
  getMemories,
  getJob,
  getNotebooks,
  getScenario,
  getOfferEndsAt,
  getUser,
  isOnboarded,
  isPaywallDue,
  loadStore,
  restartOnboarding,
  restoreDeletedDrawings,
  restoreMockData,
  setPaywallDue,
  setScenario,
  hasBrush,
  refreshBrushes,
  startFirstDrawing,
  startJournal,
  startOffer,
  subscribe,
} from './store';
export { brushMoves, totalBrushes } from './user';

export const getNotebook = (id: string) => getNotebooks().find((n) => n.id === id);
export const getMemory = (id: string) => getMemories().find((m) => m.id === id);
export const memoriesOf = (notebookId: string) => getMemories().filter((m) => m.notebookId === notebookId);
export const statsOf = (notebookId: string) => notebookStats(memoriesOf(notebookId), getToday());

/** Newest memory of a day. */
const memoryOn = (day: string) => getMemories().findLast((m) => m.date === day);
export const getTodayMemory = () => memoryOn(toIsoDay(getToday()));
export const getOnThisDayMemory = () =>
  memoryOn(isoDay(getToday().getFullYear() - 1, getToday().getMonth(), getToday().getDate()));

/** Photos taken today, shown first in the picker. */
export const todayPhotos: DrawingKey[] = ['couple01', 'couple02', 'couple04', 'couple05', 'couple06', 'couple08'];

export const isDrawingKey = (key: string): key is DrawingKey => key in NOTEBOOK_OF;
export const guessNotebook = (key: DrawingKey) => NOTEBOOK_OF[key];
