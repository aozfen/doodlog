import { GIFT_BRUSHES } from '@/constants';
import type { User } from '@/types';

/** Account made silently in onboarding: no plan, only the gift brushes. */
export const newUser = (): User => ({
  name: '',
  subscriber: false,
  plan: '',
  planUntil: '',
  brushes: { subscription: 0, subscriptionMax: 0, pack: GIFT_BRUSHES, renewsOn: '' },
  goal: 'weekly3',
  reminderAt: null,
});

export const totalBrushes = (u: User) => u.brushes.subscription + u.brushes.pack;
