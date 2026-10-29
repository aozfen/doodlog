import type { EventName } from '@/constants';

// No analytics SDK yet. Events are only logged in development.
export function track(event: EventName, props?: Record<string, string | number | boolean>) {
  if (__DEV__) console.log('[track]', event, props ?? '');
}
