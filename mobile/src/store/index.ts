// App data (Evolu backed, see store.ts). Screens read data only through these helpers.
// In render, read through the hooks in hooks/use-store.ts or the pure `...In` selectors below.
// The React Compiler caches a call with no reactive input, so `getTodayMemory()` in render
// keeps its first answer. The `get...` getters are for event handlers and the store.
import { getToday, isoDay, toIsoDay } from '@/lib/date';
import { notebookStats } from '@/lib/notebook-stats';

import type { Memory, Notebook } from '@/types';

import { getMemories, getNotebooks } from './store';

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
  getOfferEndsAt,
  getUser,
  isPaywallDue,
  loadStore,
  restartOnboarding,
  restoreDeletedDrawings,
  setPaywallDue,
  hasBrush,
  refreshBrushes,
  startFirstDrawing,
  startJournal,
  startOffer,
  subscribe,
} from './store';
export { totalBrushes } from './user';

// Pure selectors over lists from the hooks.
export const notebookIn = (notebooks: Notebook[], id: string | undefined) =>
  id === undefined ? undefined : notebooks.find((n) => n.id === id);
export const memoryIn = (memories: Memory[], id: string | undefined) =>
  id === undefined ? undefined : memories.find((m) => m.id === id);
export const statsIn = (memories: Memory[], notebookId: string) =>
  notebookStats(
    memories.filter((m) => m.notebookId === notebookId),
    getToday(),
  );
/** Newest memory of a day. */
const newestOn = (memories: Memory[], day: string) => memories.findLast((m) => m.date === day);
export const todayIn = (memories: Memory[]) => newestOn(memories, toIsoDay(getToday()));
export const onThisDayIn = (memories: Memory[]) => {
  const today = getToday();
  return newestOn(memories, isoDay(today.getFullYear() - 1, today.getMonth(), today.getDate()));
};

// Current values, for event handlers and the store. Not for render (see the top).
export const getNotebook = (id: string) => notebookIn(getNotebooks(), id);
export const getMemory = (id: string) => memoryIn(getMemories(), id);
export const memoriesOf = (notebookId: string) => getMemories().filter((m) => m.notebookId === notebookId);
export const statsOf = (notebookId: string) => statsIn(getMemories(), notebookId);
export const getTodayMemory = () => todayIn(getMemories());
