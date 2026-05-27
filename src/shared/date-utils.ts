const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date = new Date()): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const year = copy.getFullYear();
  const month = `${copy.getMonth() + 1}`.padStart(2, "0");
  const day = `${copy.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function daysBetween(startDateKey: string, endDateKey: string): number {
  const start = parseDateKey(startDateKey).getTime();
  const end = parseDateKey(endDateKey).getTime();
  return Math.floor((end - start) / DAY_MS);
}

export function planDay(startDateKey: string, todayKey = toDateKey()): number {
  return Math.max(1, daysBetween(startDateKey, todayKey) + 1);
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateVi(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
