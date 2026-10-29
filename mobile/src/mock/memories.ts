// Mock memories. October 2026 is hand written (same as the mockups), other months
// get a stable pseudo-random pattern (~27% of days). One memory from 2025 feeds "1 yıl önce".
import { daysInMonth, isoDay } from '@/lib/date';
import type { Memory } from '@/types';

import { drawings, photos, type DrawingKey } from './images';
import { NOTEBOOK_OF } from './notebooks';
import { SEED_TODAY } from './today';

type Seed = [day: number, drawing: DrawingKey, note: string];

const OCTOBER: Seed[] = [
  [3, 'couple03', 'Bebek odasının rengini seçtik.'],
  [5, 'dog01', 'Fıstık parkta ilk kez top getirdi.'],
  [7, 'couple07', 'Akşam yürüyüşü, yağmura yakalandık.'],
  [9, 'self01', 'Sabah koşusu, 5 km.'],
  [12, 'couple02', 'Koltukta film gecesi.'],
  [14, 'self05', 'Yeni kitaba başladım.'],
  [15, 'couple05', 'Annemlerde akşam yemeği.'],
  [18, 'couple04', 'Pazar kahvaltısı uzadı.'],
  [20, 'dog01', 'Fıstık veterinerde çok uslu durdu.'],
  [21, 'couple06', 'Doktor kontrolü, her şey yolunda.'],
  [24, 'couple08', 'Bebek için ilk alışveriş.'],
  [25, 'couple01', 'Sabah sandviç sürprizi. Teşekkürü öpücükle aldı.'],
];

const NOTES = [
  'Kahve ve uzun sohbet.',
  'Sahilde yürüyüş.',
  'Evde sakin bir gün.',
  'Pazarda alışveriş.',
  'Arkadaşlarla akşam yemeği.',
];
const POOL: DrawingKey[] = ['couple02', 'dog01', 'couple05', 'self01', 'couple07', 'couple04', 'self05', 'couple08'];

const rand = (m: number, d: number) => Math.abs(Math.sin((m * 31 + d) * 12.9898) * 43758.5453) % 1;

function toMemory(year: number, month: number, [day, key, note]: Seed): Memory {
  const id = isoDay(year, month, day);
  return { id, date: id, notebookId: NOTEBOOK_OF[key], drawing: drawings[key], photo: photos[key], note };
}

function seedYear(year: number): Memory[] {
  const out: Memory[] = [];
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth(year, m); d++) {
      if (new Date(year, m, d) > SEED_TODAY) return out;
      let seed: Seed | undefined;
      if (m === 9) seed = OCTOBER.find((s) => s[0] === d);
      else if (rand(m, d) < 0.27) {
        const k = Math.floor(rand(d, m) * 1000);
        seed = [d, POOL[k % POOL.length], NOTES[k % NOTES.length]];
      }
      if (seed) out.push(toMemory(year, m, seed));
    }
  }
  return out;
}

/** Seed memories, oldest first. */
export const seedMemories: Memory[] = [
  toMemory(2025, 9, [25, 'couple03', 'Bebek haberini bu masada verdin']),
  ...seedYear(2026),
];
