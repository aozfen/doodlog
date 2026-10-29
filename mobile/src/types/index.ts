// Domain types shared by screens, components and mock data.
import type { ImageSource } from 'expo-image';

/** Local image: a `require()` result or a file URI. */
export type Picture = ImageSource | number;

/** Chosen when a notebook is created. Drives copy such as the invite button. */
export type NotebookKind = 'partner' | 'child' | 'family' | 'friends' | 'pet' | 'self' | 'other';

export type Notebook = {
  id: string;
  name: string;
  kind: NotebookKind;
  /** ISO day the notebook was created. */
  createdAt: string;
  /** Undefined until the first memory. The newest drawing becomes the cover. */
  cover?: Picture;
};

export type Memory = {
  id: string;
  notebookId: string;
  /** ISO day, e.g. "2026-10-25". */
  date: string;
  note: string;
  drawing: Picture;
  photo?: Picture;
};

export type NotebookStats = {
  count: number;
  thisWeek: number;
  /** Date of the first memory, undefined when the notebook is empty. */
  firstDate?: Date;
  /** Days since the newest memory, undefined when the notebook is empty. */
  idleDays?: number;
};

export type BrushBalance = {
  /** Subscription brushes left this period. */
  subscription: number;
  subscriptionMax: number;
  /** Pack brushes, they never expire. */
  pack: number;
  renewsOn: string;
};

/** How often the user wants to add a memory. Set in onboarding, drives reminders. */
export type Goal = 'weekly1' | 'weekly3' | 'daily';

export type User = {
  /** Empty when skipped in onboarding: greetings then drop the name. */
  name: string;
  subscriber: boolean;
  plan: string;
  planUntil: string;
  brushes: BrushBalance;
  goal: Goal;
  /** Evening reminder time ("21:00"), null when turned off. */
  reminderAt: string | null;
};

/** Brush balance as the Worker returns it (GET /v1/brushes). */
export type ServerBalance = { subscription: number; pack: number; total: number; renewsAt: number | null };

export type BrushMove = { title: string; when: string; delta: number };

/** A drawing being made by the backend. Lives outside screens, so leaving one keeps it going. */
export type DrawJob = {
  notebookId: string;
  /** Sent again with the same request id when the app restarts mid-drawing. */
  requestId: string;
  photo?: Picture;
  /** Undefined until the drawing lands. */
  drawing?: Picture;
  startedAt: number;
  /** Expected end (ms), drives the progress bar. */
  endsAt: number;
  status: 'drawing' | 'done' | 'failed';
};

/** Developer menu: how the mock first drawing behaves. */
export type DrawScenario = 'normal' | 'slow' | 'fail';
