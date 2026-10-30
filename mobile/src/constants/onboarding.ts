// Onboarding content. The first notebook kind personalizes every later step.
// Design: design/a-onboarding.html.
import type { SampleKey } from './samples';
import type { Goal, NotebookKind } from '@/types';

export type OnboardingKind = Extract<NotebookKind, 'partner' | 'pet' | 'self' | 'friends'>;

export type OnboardingCopy = {
  /** Option label: "İlk defterin kimin için?" */
  label: string;
  /** Sample before/after on the photo step. */
  sample: SampleKey;
  /** Photo step: what kind of photo to pick. */
  ask: string;
  /** Photo step: reassures that any photo works (never asks for faces), then a light quality hint. */
  tip: string;
  goalQuestion: string;
  paywallTitle: string;
};

/** Options in grid order. Other kinds come later from "Yeni defter". */
export const ONBOARDING_KINDS: OnboardingKind[] = ['partner', 'pet', 'self', 'friends'];

export const isOnboardingKind = (kind: NotebookKind): kind is OnboardingKind =>
  (ONBOARDING_KINDS as NotebookKind[]).includes(kind);

export const ONBOARDING_COPY: Record<OnboardingKind, OnboardingCopy> = {
  partner: {
    label: 'Sevgilimle',
    sample: 'couple02',
    ask: 'Sevgilinle bir fotoğraf seç. Birkaç saniyede çizime dönüşür.',
    tip: 'El ele, sarılırken, her an olur. Net kareler daha güzel çizilir.',
    goalQuestion: 'İlişkinizi ne sıklıkla kaydetmek istersin?',
    paywallTitle: 'İkinizin her anı çizime dönüşsün',
  },
  pet: {
    label: 'Evcil hayvanım',
    sample: 'dog01',
    ask: 'Patili dostunun bir fotoğrafını seç. Tüyleri, renkleri korunur.',
    tip: 'Uyurken, koşarken, her hali olur. Net kareler daha güzel çizilir.',
    goalQuestion: 'Onun anılarını ne sıklıkla eklemek istersin?',
    paywallTitle: 'Patili dostunun her hali çizime dönüşsün',
  },
  self: {
    label: 'Kendim',
    sample: 'self01',
    ask: 'Kendinden bir kare seç. Günlüğün çizimle başlasın.',
    tip: 'Selfie de olur, manzara da. Net kareler daha güzel çizilir.',
    goalQuestion: 'Kendine ne sıklıkla not düşmek istersin?',
    paywallTitle: 'Her günün bir çizimle kalsın',
  },
  friends: {
    label: 'Arkadaşlarım',
    sample: 'self05',
    ask: 'Arkadaşlarınla bir fotoğraf seç. Herkes tanınır kalır.',
    tip: 'Kalabalık kareler de olur. Net kareler daha güzel çizilir.',
    goalQuestion: 'Ekibin anılarını ne sıklıkla eklemek istersin?',
    paywallTitle: 'Ekibin her buluşması çizime dönüşsün',
  },
};

export type GoalInfo = {
  label: string;
  hint: string;
  /** Reminder days, shown on the reminder step. */
  days: string;
  /** Reminder weekdays for the scheduler: 1 = Sunday … 7 = Saturday. */
  weekdays: number[];
};

export const GOALS: Record<Goal, GoalInfo> = {
  weekly1: { label: 'Haftada 1', hint: 'rahat', days: 'Pazar akşamı', weekdays: [1] },
  weekly3: { label: 'Haftada 3', hint: 'dengeli', days: 'Pazartesi, Çarşamba, Pazar', weekdays: [2, 4, 1] },
  daily: { label: 'Her gün', hint: 'günlük gibi', days: 'Her akşam', weekdays: [1, 2, 3, 4, 5, 6, 7] },
};

export const GOAL_ORDER: Goal[] = ['weekly1', 'weekly3', 'daily'];
export const DEFAULT_GOAL: Goal = 'weekly3';

export const REMINDER_TIMES = ['19:00', '20:00', '21:00', '22:00'] as const;
export const DEFAULT_REMINDER = '21:00';

/** Text of the evening reminder notification. */
export const REMINDER_COPY = {
  title: 'Bugünden bir an?',
  body: 'Bir fotoğraf seç, çizime dönüştürelim.',
} as const;

/** Shown while the user waits for the first drawing. */
export const DRAW_STAGES = ['Fotoğrafa bakıldı', 'Çizgiler atılıyor', 'Renkler veriliyor'] as const;
