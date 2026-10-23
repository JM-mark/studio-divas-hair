// Run with: npm test   (node:test; Node 22.6+ strips the types)
import test from 'node:test';
import assert from 'node:assert/strict';
import { saoPauloMoment, slotsForWeekday, slotsForDate, upcomingDays, weekdayOf, SLOT_MINUTES } from './slots.ts';
import { hours } from '../data/site.ts';

// Brazil has had no daylight saving since 2019: São Paulo is UTC-3 all year.
const at = (iso: string) => saoPauloMoment(new Date(iso));
const brt = (day: string, hhmm: string) => `${day}T${hhmm}:00-03:00`;
// Week of 2026-10-19 (Mon) .. 2026-10-25 (Sun)

test('slots are 30 minutes apart', () => assert.equal(SLOT_MINUTES, 30));

test('Monday and Sunday offer no slots', () => {
  assert.deepEqual(slotsForWeekday(hours, 1), []);
  assert.deepEqual(slotsForWeekday(hours, 0), []);
});
test('Tuesday: 08:00 to 17:30, the last slot ends at 18:00', () => {
  const s = slotsForWeekday(hours, 2);
  assert.equal(s[0], '08:00'); assert.equal(s.at(-1), '17:30'); assert.equal(s.length, 20);
  assert.ok(!s.includes('18:00'));
});
test('Wednesday starts at 09:00 and ends 17:30', () => {
  const s = slotsForWeekday(hours, 3);
  assert.equal(s[0], '09:00'); assert.ok(!s.includes('08:00') && !s.includes('08:30')); assert.equal(s.at(-1), '17:30'); assert.equal(s.length, 18);
});
test('Thursday, Friday and Saturday: 08:00 to 18:30', () => {
  for (const wd of [4, 5, 6]) {
    const s = slotsForWeekday(hours, wd);
    assert.equal(s[0], '08:00'); assert.equal(s.at(-1), '18:30'); assert.equal(s.length, 22); assert.ok(!s.includes('19:00'));
  }
});
test('slots follow the hours data (change the data, the slots change)', () => {
  const custom = [{ day: 2, open: '10:00', close: '11:00' }];
  assert.deepEqual(slotsForWeekday(custom, 2), ['10:00', '10:30']);
  assert.deepEqual(slotsForWeekday(custom, 3), []);
});

test('weekday of a calendar date does not depend on the machine timezone', () => {
  assert.equal(weekdayOf('2026-10-19'), 1); assert.equal(weekdayOf('2026-10-21'), 3); assert.equal(weekdayOf('2026-10-25'), 0);
});

test('São Paulo time: UTC night belongs to the previous Brazilian day', () => {
  const m = at('2026-10-20T01:30:00Z'); // Monday 22:30 in São Paulo, already Tuesday in UTC
  assert.deepEqual([m.y, m.m, m.d, m.day, m.minutes], [2026, 10, 19, 1, 22 * 60 + 30]);
  const n = at('2026-10-20T23:30:00Z'); // Tuesday 20:30 in São Paulo
  assert.deepEqual([n.d, n.day, n.minutes], [20, 2, 20 * 60 + 30]);
});

test("today's past times are hidden, with a 1-hour buffer", () => {
  const now = at(brt('2026-10-20', '10:10')); // Tuesday
  const s = slotsForDate(hours, '2026-10-20', now);
  assert.equal(s[0], '11:30'); // needs to start at 11:10 or later
  assert.ok(!s.includes('11:00') && !s.includes('08:00'));
  assert.equal(s.at(-1), '17:30');
});
test('exactly one hour ahead is still bookable, one minute less is not', () => {
  assert.equal(slotsForDate(hours, '2026-10-20', at(brt('2026-10-20', '10:00')))[0], '11:00');
  assert.equal(slotsForDate(hours, '2026-10-20', at(brt('2026-10-20', '10:01')))[0], '11:30');
});
test('before opening, today keeps every slot; late in the day, none', () => {
  assert.equal(slotsForDate(hours, '2026-10-20', at(brt('2026-10-20', '06:00'))).length, 20);
  assert.deepEqual(slotsForDate(hours, '2026-10-20', at(brt('2026-10-20', '16:45'))), []); // needs >= 17:45
});
test('other days are untouched by the buffer; past dates offer nothing', () => {
  const now = at(brt('2026-10-20', '16:00'));
  assert.equal(slotsForDate(hours, '2026-10-22', now).length, 22);
  assert.deepEqual(slotsForDate(hours, '2026-10-19', now), []);
});

test('the next 30 days start today, closed days stay listed and flagged', () => {
  const days = upcomingDays(hours, at(brt('2026-10-20', '09:00')));
  assert.equal(days.length, 30);
  assert.equal(days[0].key, '2026-10-20'); assert.ok(days[0].isToday); assert.ok(!days[1].isToday);
  assert.equal(days[29].key, '2026-11-18');
  for (const d of days) {
    if (d.weekday === 0 || d.weekday === 1) { assert.equal(d.disabled, 'fechado'); assert.deepEqual(d.slots, []); }
    else { assert.equal(d.disabled, null); assert.ok(d.slots.length > 0); }
  }
  assert.equal(days.filter((d) => d.disabled === 'fechado').length, days.filter((d) => [0, 1].includes(d.weekday)).length);
});
test("today with no time left is flagged 'sem-horarios'", () => {
  const days = upcomingDays(hours, at(brt('2026-10-20', '17:00')));
  assert.equal(days[0].disabled, 'sem-horarios');
  assert.equal(days[1].disabled, null); // Wednesday
});
test('a Monday today is closed', () => {
  const days = upcomingDays(hours, at(brt('2026-10-19', '09:00')));
  assert.equal(days[0].disabled, 'fechado'); assert.equal(days[1].key, '2026-10-20');
});
test('the list crosses month and year boundaries correctly', () => {
  const days = upcomingDays(hours, at(brt('2026-12-20', '09:00')));
  assert.equal(days[11].key, '2026-12-31'); assert.equal(days[12].key, '2027-01-01'); assert.equal(days[29].key, '2027-01-18');
});
