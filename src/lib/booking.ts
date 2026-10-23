// Validation and message building for the guided booking form. Pure functions: no DOM, no storage, no network.
// A WhatsApp message can only be produced from a complete, validated request (buildMessage returns null otherwise).
import type { HourRow } from './hours';
import { slotsForDate, upcomingDays, type SaoPauloMoment } from './slots.ts';

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_LONG = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export const NAME_MAX = 60;
export const NOTE_MAX = 200;

/** Second choice: a time of that day, or "any time that day". Empty = none. */
export type SecondChoice = '' | 'any' | string;

export interface BookingInput {
  service?: string;
  dateKey?: string;
  time?: string;
  second?: SecondChoice;
  name?: string;
  note?: string;
}
export interface BookingContext { serviceNames: string[]; hours: HourRow[]; now: SaoPauloMoment }

export type MissingField = 'serviço' | 'dia' | 'horário' | 'seu nome';

/** Single line, no control characters, no WhatsApp formatting characters, collapsed spaces, capped length. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim();
}

/** At least 2 letters (any alphabet); numbers- or symbols-only entries are rejected. */
export function isValidName(raw: unknown): boolean {
  const name = cleanText(raw, NAME_MAX);
  return (name.match(/\p{L}/gu) ?? []).length >= 2;
}

/** What is still missing for a sendable request, in form order. Empty array = complete and valid right now. */
export function missingFields(input: BookingInput, ctx: BookingContext): MissingField[] {
  const missing: MissingField[] = [];
  if (!input.service || !ctx.serviceNames.includes(input.service)) missing.push('serviço');
  const day = input.dateKey ? upcomingDays(ctx.hours, ctx.now).find((d) => d.key === input.dateKey) : undefined;
  if (!day || day.disabled) missing.push('dia');
  const slots = day && !day.disabled ? slotsForDate(ctx.hours, day.key, ctx.now) : [];
  if (!input.time || !slots.includes(input.time)) missing.push('horário');
  if (!isValidName(input.name)) missing.push('seu nome');
  return missing;
}

const ddmm = (key: string) => key.slice(8, 10) + '/' + key.slice(5, 7);

/** The WhatsApp text, or null when anything required is missing or stale. Optional parts are left out when empty. */
export function buildMessage(input: BookingInput, ctx: BookingContext): string | null {
  if (missingFields(input, ctx).length > 0) return null;
  const day = upcomingDays(ctx.hours, ctx.now).find((d) => d.key === input.dateKey)!;
  const name = cleanText(input.name, NAME_MAX);
  const slots = slotsForDate(ctx.hours, day.key, ctx.now);
  let second = '';
  if (input.second === 'any') second = ' 2ª opção: qualquer horário nesse dia.';
  else if (input.second && input.second !== input.time && slots.includes(input.second)) second = ` 2ª opção: ${input.second}.`;
  const note = cleanText(input.note, NOTE_MAX);
  return (
    `Olá! Sou ${name} e gostaria de agendar *${input.service}* no dia *${ddmm(day.key)} (${WEEKDAY_LONG[day.weekday]})* às *${input.time}*.` +
    second +
    (note ? ` Observação: ${note}.` : '') +
    ' (pedido enviado pelo site)'
  );
}

/** wa.me URL for a message built by buildMessage. */
export function whatsappBookingUrl(whatsappNumber: string, message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
