import { useSyncExternalStore } from 'react';

import {
  getJob,
  getMemories,
  getNotebooks,
  getOfferEndsAt,
  getScenario,
  getUser,
  isOnboarded,
  isPaywallDue,
  memoryIn,
  notebookIn,
  onThisDayIn,
  subscribe,
  todayIn,
} from '@/mock';

/** All notebooks; re-renders when one is added, deleted or restored. */
export const useNotebooks = () => useSyncExternalStore(subscribe, getNotebooks);

/** All memories, oldest first; re-renders when they change. */
export const useMemories = () => useSyncExternalStore(subscribe, getMemories);

/** One notebook by id; re-renders when it changes (renamed, new cover, deleted). */
export const useNotebook = (id: string | undefined) => notebookIn(useNotebooks(), id);

/** One memory by id; re-renders when it changes (note) or is deleted. */
export const useMemory = (id: string | undefined) => memoryIn(useMemories(), id);

/** Newest memory of today. */
export const useTodayMemory = () => todayIn(useMemories());

/** Newest memory of this day one year ago. */
export const useOnThisDayMemory = () => onThisDayIn(useMemories());

/** The account: name, plan, brushes, goal. */
export const useUser = () => useSyncExternalStore(subscribe, getUser);

/** false until onboarding is finished (and again after "Verilerimi sil"). */
export const useOnboarded = () => useSyncExternalStore(subscribe, isOnboarded);

/** End of the exit offer (ms), null until it is shown. */
export const useOfferEndsAt = () => useSyncExternalStore(subscribe, getOfferEndsAt);

/** The first drawing job: drawing, done or failed. null before it starts. */
export const useDrawJob = () => useSyncExternalStore(subscribe, getJob);

/** Developer menu: mock first drawing scenario. */
export const useScenario = () => useSyncExternalStore(subscribe, getScenario);

/** The paywall is owed to someone who left onboarding before the drawing landed. */
export const usePaywallDue = () => useSyncExternalStore(subscribe, isPaywallDue);
