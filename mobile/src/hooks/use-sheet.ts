import { useCallback, useState } from 'react';

import { SHEET_SWAP_MS } from '@/constants';

/**
 * One open sheet at a time. `then` closes the current sheet and runs the next
 * step (open another sheet, navigate, alert) once it has slid away.
 */
export function useSheet<T extends string>() {
  const [current, setCurrent] = useState<T | null>(null);
  const close = useCallback(() => setCurrent(null), []);
  const then = useCallback((next: T | (() => void)) => {
    setCurrent(null);
    setTimeout(() => (typeof next === 'function' ? next() : setCurrent(next)), SHEET_SWAP_MS);
  }, []);
  return { current, open: setCurrent, close, then, is: (name: T) => current === name };
}
