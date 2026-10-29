import { useEffect, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

/** "23:59:59" from seconds. */
export const formatClock = (seconds: number) =>
  `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;

/** Whole seconds left until `endsAt` (ms), ticking every second. 0 when over or missing. */
export function useCountdown(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return endsAt === null ? 0 : Math.max(0, Math.floor((endsAt - now) / 1000));
}
