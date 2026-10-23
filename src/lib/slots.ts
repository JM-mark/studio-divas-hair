// Appointment slots for the guided booking form.
//
// TODO(future): this module is the ONLY place that decides which times can be requested. Today it derives them from the
// opening hours (src/data/site.ts) in fixed 30-minute steps, so a slot means "the salon is open", NOT "the slot is free".
// To use a real availability source later (Google Agenda appointment page, a salon booking system, a small API), replace
// `slotsForDate` with a function that returns that source's free start times for the date (it can become async: the form
// only calls `slotsForDate`/`upcomingDays`). The rest of the form, the validation and the message builder do not change.
// Until then the page must keep saying that the time is confirmed by the Dri on WhatsApp.
import type { HourRow } from './hours';

export const SLOT_MINUTES = 30;
/** Today's slots must start at least this long from now. */
export const TODAY_BUFFER_MINUTES = 60;
export const BOOKING_DAYS = 30;

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const pad = (n: number) => String(n).padStart(2, '0');

/** The calendar date, weekday (0 = Sunday) and minutes since midnight in America/Sao_Paulo for an instant. */
export interface SaoPauloMoment { y: number; m: number; d: number; day: number; minutes: number }

export function saoPauloMoment(date: Date = new Date()): SaoPauloMoment {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    y: Number(get('year')), m: Number(get('month')), d: Number(get('day')),
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Weekday (0 = Sunday) of a YYYY-MM-DD calendar date (timezone independent). */
export function weekdayOf(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** All start times a day offers: from opening, every 30 min, the last one ending exactly at closing. Closed day = []. */
export function slotsForWeekday(hours: HourRow[], weekday: number): string[] {
  const row = hours.find((h) => h.day === weekday);
  if (!row || !row.open || !row.close) return [];
  const out: string[] = [];
  for (let t = toMin(row.open); t + SLOT_MINUTES <= toMin(row.close); t += SLOT_MINUTES) out.push(toHHMM(t));
  return out;
}

/** Slots a customer may request for a date: today loses what has passed (plus the buffer). */
export function slotsForDate(hours: HourRow[], key: string, now: SaoPauloMoment): string[] {
  const all = slotsForWeekday(hours, weekdayOf(key));
  if (key < dateKey(now.y, now.m, now.d)) return [];
  if (key > dateKey(now.y, now.m, now.d)) return all;
  return all.filter((t) => toMin(t) >= now.minutes + TODAY_BUFFER_MINUTES);
}

export interface BookingDay {
  key: string; y: number; m: number; d: number; weekday: number; isToday: boolean;
  slots: string[];
  /** why the day cannot be chosen, if it cannot */
  disabled: null | 'fechado' | 'sem-horarios';
}

/** The next `count` calendar days starting today (São Paulo). Closed days stay in the list, flagged. */
export function upcomingDays(hours: HourRow[], now: SaoPauloMoment, count: number = BOOKING_DAYS): BookingDay[] {
  const days: BookingDay[] = [];
  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(now.y, now.m - 1, now.d + i));
    const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    const key = dateKey(y, m, d);
    const weekday = dt.getUTCDay();
    const closed = slotsForWeekday(hours, weekday).length === 0;
    const slots = closed ? [] : slotsForDate(hours, key, now);
    days.push({ key, y, m, d, weekday, isToday: i === 0, slots, disabled: closed ? 'fechado' : slots.length === 0 ? 'sem-horarios' : null });
  }
  return days;
}
