// App-wide constants. Timings are in milliseconds.

/** Watermark on shared images for non-subscribers. */
export const WATERMARK = 'doods';

export const APP_NAME = 'Doodlog';

/** Wait for a closing sheet before opening the next sheet or screen. */
export const SHEET_SWAP_MS = 250;

/** Back navigation slide time: wait for it before changing data the leaving screen shows. */
export const SCREEN_POP_MS = 400;

export const TOAST_MS = 2800;

/** A toast with "Geri al" stays longer, so there is time to tap it. */
export const UNDO_TOAST_MS = 5000;

/** Months listed in month view (calendar and notebook): current month first. */
export const MONTHS_SHOWN = 3;

/** A notebook is "idle" after this many days without a memory. */
export const IDLE_AFTER_DAYS = 7;

/** Brush packs, sold to everyone (pricing decision). */
export const BRUSH_PACKS = [
  { amount: 10, price: '$4,99' },
  { amount: 20, price: '$7,99' },
] as const;

/** Free brushes for a new account. The gift is the trial: no free trial period. */
export const GIFT_BRUSHES = 3;

/** Brushes a subscription gives each month, both plans. */
export const PLAN_BRUSHES = 50;

export type PlanId = 'yearly' | 'monthly';

export type PlanInfo = {
  label: string;
  /** Price with its period, e.g. "$59,99 / yıl". */
  price: string;
  /** Small line under the price. */
  note?: string;
  /** Badge on the best deal. */
  badge?: string;
};

// Yearly vs 12 × monthly: $59,99 vs $95,88, 37% less.
export const PLANS: Record<PlanId, PlanInfo> = {
  yearly: { label: 'Yıllık', price: '$59,99 / yıl', note: 'Ayda $4,99’a gelir', badge: '%37 indirim' },
  monthly: { label: 'Aylık', price: '$7,99 / ay' },
};

export const PLAN_ORDER: PlanId[] = ['yearly', 'monthly'];

/**
 * Mock drawing time in onboarding. Close to the real 10-20 s, so the questions
 * asked while it draws (name, goal, reminder) are seen.
 */
export const ONBOARDING_DRAW_MS = 14000;

/** Mock "slow" scenario: longer than LONG_WAIT_MS, so "Biraz uzun sürüyor" shows. */
export const SLOW_DRAW_MS = 50000;

/** Mock "fail" scenario: the drawing fails after this long. */
export const FAIL_DRAW_MS = 8000;

/** Home waits this long after the background drawing lands before opening it. */
export const PAYWALL_DELAY_MS = 1200;

/** After this long the wait screen offers to go home and get notified instead. */
export const LONG_WAIT_MS = 30000;

/**
 * One-time offer shown when the onboarding paywall is closed. A separate yearly product
 * in App Store Connect. The 24 hours must be real: the end time is stored, never reset.
 * 12 × $7,99 = $95,88, so $49,99 is 48% less (same base as the yearly badge).
 */
export const EXIT_OFFER = {
  price: '$49,99 / yıl',
  note: 'Ayda $4,16’ya gelir',
  /** Struck through, highest first, with what each price is. */
  was: [
    { price: '$95,88', label: 'aylık ödersen' },
    { price: '$59,99', label: 'yıllık plan' },
  ],
  /** $95,88 − $49,99 */
  saving: 'Yılda $45,89 cebinde kalır',
  badge: '%48 indirim',
  hours: 24,
} as const;

/** Doodlog Worker (worker/). Override with EXPO_PUBLIC_API_URL, e.g. a local `wrangler dev`. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://doodlog-api.wemolabs.workers.dev';

/** Photos are resized to this many pixels on the long side before drawing. */
export const DRAW_PHOTO_PX = 1536;

/** The real drawing takes about 10-20 s; the wait bar is paced for this. */
export const EXPECTED_DRAW_MS = 18000;

/** Paint reveal once the drawing has landed. */
export const REVEAL_MS = 1600;
