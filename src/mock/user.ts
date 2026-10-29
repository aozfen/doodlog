import { GIFT_BRUSHES } from '@/constants';
import type { BrushMove, User } from '@/types';

// Matches the settings mockup: yearly subscriber, 38 subscription + 12 pack brushes.
// Set subscriber to false to see the watermark on shares.
export const seedUser: User = {
  name: 'Ahmet',
  subscriber: true,
  plan: 'Yıllık plan',
  planUntil: '12 Ekim 2027’ye kadar',
  brushes: { subscription: 38, subscriptionMax: 50, pack: 12, renewsOn: '1 Kasım' },
  goal: 'weekly3',
  reminderAt: '21:00',
};

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

export const brushMoves: BrushMove[] = [
  { title: 'Çizim · Sevgilimle', when: 'Bugün', delta: -1 },
  { title: 'Tekrar çizim', when: 'Dün', delta: -1 },
  { title: 'Çizim olmadı', when: '23 Ekim · iade', delta: 1 },
  { title: '20 fırça paketi', when: '14 Ekim', delta: 20 },
  { title: 'Yıllık plan', when: '12 Ekim', delta: 50 },
];
