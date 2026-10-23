// Run with: npm test   (node:test; Node 22.6+ strips the types)
import test from 'node:test';
import assert from 'node:assert/strict';
import { openStatus, saoPauloNow } from './hours.ts';
import { hours } from '../data/site.ts';

// Brazil has had no daylight saving since 2019, so São Paulo is UTC-3 all year.
const at = (iso: string) => openStatus(hours, saoPauloNow(new Date(iso)));
const brt = (day: string, hhmm: string) => `${day}T${hhmm}:00-03:00`;

// Week of 2026-10-19 (Mon) .. 2026-10-25 (Sun)
test('Monday and Sunday are closed all day', () => {
  for (const t of ['00:00', '08:00', '12:00', '18:59']) {
    assert.equal(at(brt('2026-10-19', t)).open, false, `Mon ${t}`);
    assert.equal(at(brt('2026-10-25', t)).open, false, `Sun ${t}`);
  }
});
test('Tuesday 08:00-18:00: edges', () => {
  assert.equal(at(brt('2026-10-20', '07:59')).open, false);
  assert.equal(at(brt('2026-10-20', '08:00')).open, true);
  assert.equal(at(brt('2026-10-20', '17:59')).open, true);
  assert.equal(at(brt('2026-10-20', '18:00')).open, false);
});
test('Wednesday opens later (09:00) and closes at 18:00', () => {
  assert.equal(at(brt('2026-10-21', '08:30')).open, false);
  assert.equal(at(brt('2026-10-21', '09:00')).open, true);
  assert.equal(at(brt('2026-10-21', '17:59')).open, true);
  assert.equal(at(brt('2026-10-21', '18:00')).open, false);
});
test('Thursday to Saturday 08:00-19:00: edges and closing time reported', () => {
  for (const d of ['2026-10-22', '2026-10-23', '2026-10-24']) {
    assert.equal(at(brt(d, '07:59')).open, false);
    assert.equal(at(brt(d, '08:00')).open, true);
    assert.deepEqual(at(brt(d, '18:59')), { open: true, closesAt: '19:00' });
    assert.equal(at(brt(d, '19:00')).open, false);
  }
});
test('uses São Paulo time, not the machine time zone', () => {
  // 21:59Z on Friday = 18:59 in São Paulo (open); 22:00Z = 19:00 (closed)
  assert.equal(at('2026-10-23T21:59:00Z').open, true);
  assert.equal(at('2026-10-23T22:00:00Z').open, false);
  // 02:30Z Saturday is still Friday 23:30 in São Paulo: today is Friday, closed
  const now = saoPauloNow(new Date('2026-10-24T02:30:00Z'));
  assert.equal(now.day, 5);
  assert.equal(openStatus(hours, now).open, false);
  // 03:00Z Saturday = 00:00 Saturday in São Paulo
  assert.equal(saoPauloNow(new Date('2026-10-24T03:00:00Z')).day, 6);
});
test('only one weekday is "today"', () => {
  const now = saoPauloNow(new Date('2026-10-21T15:00:00Z'));
  assert.equal(hours.filter((h) => h.day === now.day).length, 1);
  assert.equal(now.day, 3);
});
