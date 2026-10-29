import { IDLE_AFTER_DAYS } from '@/constants';
import type { Memory, NotebookStats } from '@/types';

import { daysBetween, parseIsoDay } from './date';

/** Counts for one notebook. `memories` must be sorted oldest first. */
export function notebookStats(memories: Memory[], today: Date): NotebookStats {
  const first = memories.at(0);
  const last = memories.at(-1);
  return {
    count: memories.length,
    thisWeek: memories.filter((m) => daysBetween(parseIsoDay(m.date), today) < 7).length,
    firstDate: first ? parseIsoDay(first.date) : undefined,
    idleDays: last ? daysBetween(parseIsoDay(last.date), today) : undefined,
  };
}

/** Short status under a notebook name: "21 anı · bu hafta 3", "12 gündür boş", "Henüz boş". */
export function notebookStatus({ count, thisWeek, idleDays }: NotebookStats) {
  if (!count || idleDays === undefined) return 'Henüz boş';
  if (idleDays >= IDLE_AFTER_DAYS) return `${idleDays} gündür boş`;
  return thisWeek ? `${count} anı · bu hafta ${thisWeek}` : `${count} anı`;
}
