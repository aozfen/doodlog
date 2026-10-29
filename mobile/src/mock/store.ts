// App store backed by Evolu (local only, no sync yet).
// Screens read a synchronous in-memory copy, every change is written through to Evolu.
// loadStore() fills the copy from the database once at launch.
// When sync lands, subscribe to the Evolu queries here so changes from other devices show up.
import * as Evolu from '@evolu/common';

import { FAIL_DRAW_MS, ONBOARDING_DRAW_MS, SLOW_DRAW_MS } from '@/constants';
import { evoluPromise, memoriesQuery, notebooksQuery, profileQuery, type Db } from '@/db/evolu';
import { fromPictureRef, toPictureRef } from '@/db/picture';
import { MemoryId, NotebookId, PictureRef, profileId } from '@/db/schema';
import { fetchBrushes } from '@/lib/api';
import { dayMonth, toIsoDay } from '@/lib/date';
import { DrawError, drawPhoto, newRequestId } from '@/lib/drawing';
import type {
  DrawJob,
  DrawScenario,
  Goal,
  Memory,
  Notebook,
  NotebookKind,
  Picture,
  ServerBalance,
  User,
} from '@/types';

import { seedMemories } from './memories';
import { seedNotebooks } from './notebooks';
import { mockToday } from './today';
import { newUser, seedUser } from './user';

/**
 * Fresh install (empty database):
 * true: open onboarding. false: start on home with the full mock data.
 */
const ONBOARDING_ON_LAUNCH = true;

type State = {
  notebooks: Notebook[];
  memories: Memory[];
  user: User;
  /** The account is the developer mock account (seedUser), not a real new user. */
  demo: boolean;
  onboarded: boolean;
  /** End of the one-time exit offer (ms), null until it is shown. */
  offerEndsAt: number | null;
  /** The first drawing while it is made, and after (done or failed). Not saved. */
  job: DrawJob | null;
  /** Developer menu: how the next mock first drawing behaves. Not saved. */
  scenario: DrawScenario;
  /** Left onboarding before the drawing: show the paywall on home once it lands. Not saved. */
  paywallDue: boolean;
};

let state: State = {
  notebooks: [],
  memories: [],
  user: newUser(),
  demo: false,
  onboarded: false,
  offerEndsAt: null,
  job: null,
  scenario: 'normal',
  paywallDue: false,
};
let jobTimer: ReturnType<typeof setTimeout> | undefined;
let db: Db | undefined;

const listeners = new Set<() => void>();

const setState = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

const byDate = (a: Memory, b: Memory) => a.date.localeCompare(b.date);

/** Fresh-start fields shared by onboarding restarts and "Verilerimi sil". */
const resetJob = () => {
  clearTimeout(jobTimer);
  return { job: null, offerEndsAt: null, paywallDue: false };
};

// --- Evolu writes ---------------------------------------------------------------

const getDb = () => {
  if (!db) throw new Error('loadStore() must finish before the store is used');
  return db;
};

/** Trimmed text cut to fit the column, null when empty. */
const clip = (value: string, max: number) => value.trim().slice(0, max).trim();
const text100 = (value: string) => {
  const result = Evolu.NonEmptyTrimmedString100.fromUnknown(clip(value, 100));
  return result.ok ? result.value : null;
};
const text1000 = (value: string) => {
  const result = Evolu.NonEmptyTrimmedString1000.fromUnknown(clip(value, 1000));
  return result.ok ? result.value : null;
};
const pictureRef = (picture: Picture) => PictureRef.orThrow(toPictureRef(picture));
const day = (iso: string) => Evolu.PlainDateIso.orThrow(iso);
const count = (n: number) => Evolu.NonNegativeInt.orThrow(Math.max(0, Math.round(n)));

function insertNotebook(name: string, kind: NotebookKind): Notebook {
  const createdAt = toIsoDay(mockToday);
  const { id } = getDb().insert('notebook', {
    name: Evolu.NonEmptyTrimmedString100.orThrow(clip(name, 100)),
    kind,
    createdOn: day(createdAt),
  });
  return { id, name, kind, createdAt };
}

function insertMemory(memory: Omit<Memory, 'id'>): Memory {
  const { id } = getDb().insert('memory', {
    notebookId: NotebookId.orThrow(memory.notebookId),
    date: day(memory.date),
    note: text1000(memory.note),
    drawing: pictureRef(memory.drawing),
    photo: memory.photo ? pictureRef(memory.photo) : null,
  });
  return { ...memory, id };
}

const setNotebookDeleted = (id: string, deleted: boolean) =>
  getDb().update('notebook', { id: NotebookId.orThrow(id), isDeleted: Evolu.booleanToSqliteBoolean(deleted) });

const setMemoryDeleted = (id: string, deleted: boolean) =>
  getDb().update('memory', { id: MemoryId.orThrow(id), isDeleted: Evolu.booleanToSqliteBoolean(deleted) });

/** Soft-deletes every notebook and memory in the store. */
function deleteAllRows() {
  state.notebooks.forEach((n) => setNotebookDeleted(n.id, true));
  state.memories.forEach((m) => setMemoryDeleted(m.id, true));
}

/** Saves the user, onboarding, offer and drawing job fields of the current state. */
function saveProfile() {
  const { user, demo, onboarded, offerEndsAt, job } = state;
  getDb().upsert('profile', {
    jobNotebookId: job ? NotebookId.orThrow(job.notebookId) : null,
    jobRequestId: job ? text100(job.requestId) : null,
    jobDrawing: job?.drawing ? pictureRef(job.drawing) : null,
    jobPhoto: job?.photo ? pictureRef(job.photo) : null,
    jobStartedAt: job ? count(job.startedAt) : null,
    jobEndsAt: job ? count(job.endsAt) : null,
    jobStatus: job?.status ?? null,
    id: profileId,
    name: text100(user.name),
    goal: user.goal,
    reminderAt: user.reminderAt ? text100(user.reminderAt) : null,
    onboarded: Evolu.booleanToSqliteBoolean(onboarded),
    demo: Evolu.booleanToSqliteBoolean(demo),
    brushPack: count(user.brushes.pack),
    brushSubscription: count(user.brushes.subscription),
    offerEndsAt: offerEndsAt === null ? null : count(offerEndsAt),
  });
}

// --- Launch -------------------------------------------------------------------

/** Opens the database and fills the store. Call once before rendering screens. */
export async function loadStore() {
  db = await evoluPromise;
  const [notebookRows, memoryRows, profileRows] = await Promise.all([
    db.loadQuery(notebooksQuery),
    db.loadQuery(memoriesQuery),
    db.loadQuery(profileQuery),
  ]);

  const profile = profileRows[0];
  if (!profile) {
    if (!ONBOARDING_ON_LAUNCH) restoreMockData();
    return;
  }

  const notebooks: Notebook[] = notebookRows.flatMap((r) =>
    r.name && r.kind && r.createdOn
      ? [
          {
            id: r.id,
            name: r.name,
            kind: r.kind,
            createdAt: r.createdOn,
            cover: r.cover ? fromPictureRef(r.cover) : undefined,
          },
        ]
      : [],
  );
  const memories: Memory[] = memoryRows.flatMap((r) =>
    r.notebookId && r.date && r.drawing
      ? [
          {
            id: r.id,
            notebookId: r.notebookId,
            date: r.date,
            note: r.note ?? '',
            drawing: fromPictureRef(r.drawing),
            photo: r.photo ? fromPictureRef(r.photo) : undefined,
          },
        ]
      : [],
  );

  const demo = profile.demo === Evolu.sqliteTrue;
  const base = demo ? seedUser : newUser();
  const user: User = {
    ...base,
    name: profile.name ?? '',
    goal: profile.goal ?? base.goal,
    reminderAt: profile.reminderAt ?? null,
    brushes: {
      ...base.brushes,
      pack: profile.brushPack ?? base.brushes.pack,
      subscription: profile.brushSubscription ?? base.brushes.subscription,
    },
  };

  const job: DrawJob | null =
    profile.jobNotebookId && profile.jobStartedAt !== null && profile.jobEndsAt !== null
      ? {
          notebookId: profile.jobNotebookId,
          requestId: profile.jobRequestId ?? newRequestId(),
          drawing: profile.jobDrawing ? fromPictureRef(profile.jobDrawing) : undefined,
          photo: profile.jobPhoto ? fromPictureRef(profile.jobPhoto) : undefined,
          startedAt: profile.jobStartedAt,
          endsAt: profile.jobEndsAt,
          status: profile.jobStatus ?? 'drawing',
        }
      : null;

  setState({
    ...state,
    notebooks,
    memories,
    user,
    demo,
    onboarded: profile.onboarded === Evolu.sqliteTrue,
    offerEndsAt: profile.offerEndsAt ?? null,
    job,
  });

  // The app was closed while drawing. The same request id is sent again: the server either
  // returns the finished drawing for free or draws it, never charging twice.
  if (job?.status === 'drawing') void runJob(job);
  void refreshBrushes();
}

// --- Brushes ------------------------------------------------------------------

/** The server's balance replaces the local copy. */
export function applyBalance(balance: ServerBalance) {
  const brushes = {
    ...state.user.brushes,
    subscription: balance.subscription,
    pack: balance.pack,
    renewsOn: balance.renewsAt ? dayMonth(new Date(balance.renewsAt)) : '',
  };
  setState({ ...state, user: { ...state.user, brushes } });
  saveProfile();
}

/** Reads the balance from the server. Offline: the saved copy stays. */
export async function refreshBrushes() {
  try {
    applyBalance(await fetchBrushes());
  } catch (error) {
    console.warn('brushes_refresh_failed', error);
  }
}

// --- Reads --------------------------------------------------------------------

export const getNotebooks = () => state.notebooks;
export const getMemories = () => state.memories;
export const getUser = () => state.user;
export const isOnboarded = () => state.onboarded;
export const getOfferEndsAt = () => state.offerEndsAt;
export const getJob = () => state.job;
export const getScenario = () => state.scenario;
export const isPaywallDue = () => state.paywallDue;

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// --- Changes ------------------------------------------------------------------

export function setPaywallDue(paywallDue: boolean) {
  setState({ ...state, paywallDue });
}

export function setScenario(scenario: DrawScenario) {
  setState({ ...state, scenario });
}

/** Starts the exit offer clock once. Showing the offer again never resets it. */
export function startOffer(hours: number) {
  if (state.offerEndsAt !== null) return state.offerEndsAt;
  const endsAt = Date.now() + hours * 3_600_000;
  setState({ ...state, offerEndsAt: endsAt });
  saveProfile();
  return endsAt;
}

export function createNotebook(name: string, kind: NotebookKind): Notebook {
  const notebook = insertNotebook(name, kind);
  setState({ ...state, notebooks: [...state.notebooks, notebook] });
  return notebook;
}

/** The first drawing landed: it becomes today's memory and the notebook cover. */
function finishDrawing(job: DrawJob, drawing: Picture) {
  const { notebookId, photo } = job;
  const today = toIsoDay(mockToday);
  // One memory per day in onboarding: today's earlier memory is replaced.
  const replaced = state.memories.filter((m) => m.date === today);
  replaced.forEach((m) => setMemoryDeleted(m.id, true));
  const memory = insertMemory({ notebookId, date: today, note: '', drawing, photo });
  getDb().update('notebook', { id: NotebookId.orThrow(notebookId), cover: pictureRef(drawing) });
  setState({
    ...state,
    notebooks: state.notebooks.map((n) => (n.id === notebookId ? { ...n, cover: drawing } : n)),
    memories: [...state.memories.filter((m) => m.date !== today), memory],
    job: { ...job, drawing, status: 'done' },
  });
  saveProfile();
}

const BUSY_RETRY_MS = 15_000;
const BUSY_RETRIES = 8;

/**
 * Draws the job's photo in the background, so the result lands even when no screen is open.
 * `minMs`: the result is held until this long after the start (developer "slow" scenario).
 */
async function runJob(job: DrawJob, minMs = 0, retries = BUSY_RETRIES): Promise<void> {
  const current = () => state.job?.requestId === job.requestId;
  const fail = () => {
    if (!current()) return;
    setState({ ...state, job: { ...job, status: 'failed' } });
    saveProfile();
  };
  if (!job.photo) return fail();
  try {
    const { drawing, brushes } = await drawPhoto(job.photo, job.requestId);
    const wait = job.startedAt + minMs - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    applyBalance(brushes);
    if (current()) finishDrawing(job, drawing);
  } catch (error) {
    if (error instanceof DrawError && error.brushes) applyBalance(error.brushes);
    // The server is still drawing this request (sent before a restart): ask again later.
    if (error instanceof DrawError && error.kind === 'busy' && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, BUSY_RETRY_MS));
      if (current()) return runJob(job, minMs, retries - 1);
      return;
    }
    console.warn('first_drawing_failed', error);
    fail();
  }
}

/**
 * Quick local check before a drawing, so "no brushes" shows without a request.
 * The server spends the brush and has the final say.
 */
export function hasBrush(): boolean {
  const { brushes } = state.user;
  return brushes.subscription + brushes.pack > 0;
}

/**
 * Saves a finished drawing as a memory. The newest drawing is the notebook cover, so the
 * cover, today's card and the calendar show the same drawing.
 */
export function addMemory(memory: Omit<Memory, 'id'>): Memory {
  const saved = insertMemory(memory);
  const notebook = state.notebooks.find((n) => n.id === memory.notebookId);
  const newest = !state.memories.some((m) => m.notebookId === memory.notebookId && m.date > memory.date);
  const needsCover = notebook !== undefined && newest;
  if (needsCover)
    getDb().update('notebook', { id: NotebookId.orThrow(notebook.id), cover: pictureRef(memory.drawing) });
  setState({
    ...state,
    notebooks: needsCover
      ? state.notebooks.map((n) => (n.id === notebook.id ? { ...n, cover: memory.drawing } : n))
      : state.notebooks,
    memories: [...state.memories, saved].sort(byDate),
  });
  return saved;
}

/** Onboarding: a fresh account with the first, still empty notebook. */
export function startJournal(name: string, kind: NotebookKind): Notebook {
  clearTimeout(jobTimer);
  deleteAllRows();
  const notebook = insertNotebook(name, kind);
  setState({ ...state, notebooks: [notebook], memories: [], user: newUser(), demo: false, job: null });
  saveProfile();
  return notebook;
}

/**
 * Draws the first memory in the background. The result lands in the store even when
 * no screen is open, and becomes the notebook cover.
 * Developer scenarios: "fail" fails once without calling the server, "slow" holds the result.
 */
export function startFirstDrawing(notebookId: string, photo: Picture): DrawJob {
  clearTimeout(jobTimer);
  const { scenario } = state;
  const startedAt = Date.now();
  const job: DrawJob = {
    notebookId,
    requestId: newRequestId(),
    photo,
    startedAt,
    endsAt: startedAt + (scenario === 'slow' ? SLOW_DRAW_MS : ONBOARDING_DRAW_MS),
    status: 'drawing',
  };
  setState({ ...state, job, scenario: scenario === 'fail' ? 'normal' : scenario });
  saveProfile();

  if (scenario === 'fail') {
    jobTimer = setTimeout(() => {
      setState({ ...state, job: { ...job, status: 'failed' } });
      saveProfile();
    }, FAIL_DRAW_MS);
  } else {
    void runJob(job, scenario === 'slow' ? SLOW_DRAW_MS : 0);
  }
  return job;
}

export function finishOnboarding(profile: Pick<User, 'name' | 'goal' | 'reminderAt'>) {
  setState({ ...state, user: { ...state.user, ...profile }, onboarded: true });
  saveProfile();
}

/** Reminder time ("21:00"), or null to turn reminders off. */
export function setReminderAt(reminderAt: string | null) {
  setState({ ...state, user: { ...state.user, reminderAt } });
  saveProfile();
}

/** How often the user wants to add a memory: sets the reminder days. */
export function setGoal(goal: Goal) {
  setState({ ...state, user: { ...state.user, goal } });
  saveProfile();
}

/** Developer menu: show onboarding again. Its first drawing replaces the data. */
export function restartOnboarding() {
  setState({ ...state, ...resetJob(), onboarded: false });
  saveProfile();
}

/** Developer menu: back to the full mock data, onboarding skipped. */
export function restoreMockData() {
  const evolu = getDb();
  deleteAllRows();
  for (const n of seedNotebooks) {
    const id = NotebookId.orThrow(n.id);
    evolu.upsert('notebook', {
      id,
      name: Evolu.NonEmptyTrimmedString100.orThrow(n.name),
      kind: n.kind,
      createdOn: day(n.createdAt),
      cover: n.cover ? pictureRef(n.cover) : null,
    });
    // Stable seed ids: a restore after a delete brings the same row back.
    evolu.update('notebook', { id, isDeleted: Evolu.sqliteFalse });
  }
  const memories = seedMemories.map(({ id: _seedId, ...m }) => insertMemory(m));
  setState({
    ...state,
    ...resetJob(),
    notebooks: seedNotebooks,
    memories,
    user: seedUser,
    demo: true,
    onboarded: true,
  });
  saveProfile();
}

/** "Verilerimi sil": everything goes, the app starts over at onboarding. */
export function eraseEverything() {
  deleteAllRows();
  setState({ ...state, ...resetJob(), notebooks: [], memories: [], user: newUser(), demo: false, onboarded: false });
  saveProfile();
}

/**
 * Deletes a notebook. Its memories move to `moveTo`, or are deleted without it.
 * Returns an undo that puts the notebook back in place with its memories.
 */
export function deleteNotebook(id: string, moveTo?: string): (() => void) | undefined {
  const evolu = getDb();
  const index = state.notebooks.findIndex((n) => n.id === id);
  if (index < 0) return undefined;
  const notebook = state.notebooks[index];
  const owned = state.memories.filter((m) => m.notebookId === id);

  setNotebookDeleted(id, true);
  owned.forEach((m) =>
    moveTo
      ? evolu.update('memory', { id: MemoryId.orThrow(m.id), notebookId: NotebookId.orThrow(moveTo) })
      : setMemoryDeleted(m.id, true),
  );
  setState({
    ...state,
    notebooks: state.notebooks.filter((n) => n.id !== id),
    memories: moveTo
      ? state.memories.map((m) => (m.notebookId === id ? { ...m, notebookId: moveTo } : m))
      : state.memories.filter((m) => m.notebookId !== id),
  });

  return () => {
    setNotebookDeleted(id, false);
    owned.forEach((m) =>
      evolu.update('memory', {
        id: MemoryId.orThrow(m.id),
        notebookId: NotebookId.orThrow(id),
        isDeleted: Evolu.sqliteFalse,
      }),
    );
    const ownedIds = new Set(owned.map((m) => m.id));
    const notebooks = [...state.notebooks];
    notebooks.splice(Math.min(index, notebooks.length), 0, notebook);
    setState({
      ...state,
      notebooks,
      memories: [...state.memories.filter((m) => !ownedIds.has(m.id)), ...owned].sort(byDate),
    });
  };
}
