const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
export const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-10-25". Month is 0-based like Date. */
export const isoDay = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
export const toIsoDay = (d: Date) => isoDay(d.getFullYear(), d.getMonth(), d.getDate());
/** Local midnight of an ISO day. */
export const parseIsoDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const daysBetween = (from: Date, to: Date) =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);

/** Monday-first weekday index: Monday 0 … Sunday 6. */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;
export const dayName = (d: Date) => DAYS[d.getDay()];

/** "25 Ekim" */
export const dayMonth = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
/** "25 Ekim 2026" */
export const fullDate = (d: Date) => `${dayMonth(d)} ${d.getFullYear()}`;
/** "Ekim 2026" */
export const monthYear = (d: Date) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
/** "Pazar, 25 Ekim" */
export const longDay = (d: Date) => `${dayName(d)}, ${dayMonth(d)}`;
/** Months shown in month view, newest first: [{ year, month }]. */
export const recentMonths = (today: Date, count: number) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
