import type { DayMap, Memory } from '@/types';

/** Groups memories by ISO day. Keeps the input order, so with a sorted list the last one is the newest. */
export function groupByDay(memories: Memory[]): DayMap {
  const map: DayMap = new Map();
  for (const m of memories) {
    const day = map.get(m.date);
    if (day) day.push(m);
    else map.set(m.date, [m]);
  }
  return map;
}

/** Number of different days with at least one memory. */
export const countDays = (memories: Memory[]) => new Set(memories.map((m) => m.date)).size;
