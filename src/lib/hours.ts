export interface HourRow { day: number; open: string | null; close: string | null }
export interface Now { day: number; minutes: number }
export interface Status { open: boolean; closesAt: string | null }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** Weekday (0 = Sunday) and minutes since midnight in America/Sao_Paulo for the given instant. */
export function saoPauloNow(date: Date = new Date()): Now {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { day: WEEKDAYS.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Open from `open` (inclusive) until `close` (exclusive); closed days have null times. */
export function openStatus(hours: HourRow[], now: Now): Status {
  const today = hours.find((h) => h.day === now.day);
  if (!today || !today.open || !today.close) return { open: false, closesAt: null };
  const open = now.minutes >= toMin(today.open) && now.minutes < toMin(today.close);
  return { open, closesAt: open ? today.close : null };
}
