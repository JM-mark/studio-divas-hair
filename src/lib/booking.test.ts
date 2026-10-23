// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessage, missingFields, isValidName, cleanText, whatsappBookingUrl, type BookingInput } from './booking.ts';
import { saoPauloMoment } from './slots.ts';
import { hours, serviceGroups, business } from '../data/site.ts';

const serviceNames = serviceGroups.flatMap((g) => g.items.map((s) => s.name));
// Tuesday 2026-10-20, 09:00 in São Paulo
const ctx = { serviceNames, hours, now: saoPauloMoment(new Date('2026-10-20T09:00:00-03:00')) };
const full: BookingInput = { service: 'Progressiva', dateKey: '2026-10-22', time: '14:30', second: '', name: 'Maria Souza', note: '' };

test('names: at least 2 letters, numbers or symbols alone are rejected', () => {
  for (const ok of ['Jo', 'Maria', '  Ana  ', 'João da Silva', "D'Ávila", 'Li Wei', 'Zoë', 'Ana-Clara', 'A1b']) assert.ok(isValidName(ok), ok);
  for (const bad of ['', ' ', 'A', '12', '123456', '!!', '---', '😀😀', 'A1', '   7   ', '@#$', undefined, null, 42]) assert.ok(!isValidName(bad as never), String(bad));
});

test('a complete request has nothing missing and builds the exact message', () => {
  assert.deepEqual(missingFields(full, ctx), []);
  assert.equal(
    buildMessage(full, ctx),
    'Olá! Sou Maria Souza e gostaria de agendar *Progressiva* no dia *22/10 (quinta-feira)* às *14:30*. (pedido enviado pelo site)',
  );
});

test('every combination of missing required fields is impossible to send', () => {
  const required = ['service', 'dateKey', 'time', 'name'] as const;
  for (let mask = 0; mask < 16; mask++) {
    const input: BookingInput = { ...full };
    required.forEach((k, i) => { if (mask & (1 << i)) delete input[k]; });
    const msg = buildMessage(input, ctx);
    if (mask === 0) assert.ok(msg, 'complete request builds');
    else {
      assert.equal(msg, null, `mask ${mask.toString(2)}`);
      assert.ok(missingFields(input, ctx).length > 0);
    }
  }
});

test('empty, blank, junk and stale values count as missing', () => {
  const m = (patch: BookingInput) => missingFields({ ...full, ...patch }, ctx);
  assert.deepEqual(m({ service: '' }), ['serviço']);
  assert.deepEqual(m({ service: 'Serviço que não existe' }), ['serviço']);
  assert.deepEqual(m({ dateKey: '' }), ['dia', 'horário']);
  assert.deepEqual(m({ dateKey: '2026-10-26' }), ['dia', 'horário']); // Monday: closed
  assert.deepEqual(m({ dateKey: '2026-10-25' }), ['dia', 'horário']); // Sunday: closed
  assert.deepEqual(m({ dateKey: '2026-10-19' }), ['dia', 'horário']); // yesterday
  assert.deepEqual(m({ dateKey: '2027-03-01' }), ['dia', 'horário']); // beyond 30 days
  assert.deepEqual(m({ time: '' }), ['horário']);
  assert.deepEqual(m({ time: '07:00' }), ['horário']);  // before opening
  assert.deepEqual(m({ time: '19:00' }), ['horário']);  // Thursday closes 19:00: no slot starts then
  assert.deepEqual(m({ name: ' 12 ' }), ['seu nome']);
  assert.deepEqual(m({ name: undefined }), ['seu nome']);
});

test('a time that does not exist on the chosen day is not sendable (Wednesday starts 09:00, Tuesday ends 17:30)', () => {
  assert.equal(buildMessage({ ...full, dateKey: '2026-10-21', time: '08:30' }, ctx), null); // Wednesday
  assert.ok(buildMessage({ ...full, dateKey: '2026-10-21', time: '09:00' }, ctx));
  assert.equal(buildMessage({ ...full, dateKey: '2026-10-27', time: '18:00' }, ctx), null); // Tuesday
  assert.ok(buildMessage({ ...full, dateKey: '2026-10-27', time: '17:30' }, ctx));
});

test("today's passed times can no longer be sent (checked against the current time)", () => {
  const late = { ...ctx, now: saoPauloMoment(new Date('2026-10-20T15:00:00-03:00')) };
  assert.equal(buildMessage({ ...full, dateKey: '2026-10-20', time: '15:30' }, late), null); // inside the 1h buffer
  assert.ok(buildMessage({ ...full, dateKey: '2026-10-20', time: '16:00' }, late));
});

test('optional parts: second choice and note are left out cleanly, or added', () => {
  const msg = (patch: BookingInput) => buildMessage({ ...full, ...patch }, ctx)!;
  assert.ok(!msg({ second: '' }).includes('2ª'));
  assert.ok(msg({ second: '16:00' }).includes(' 2ª opção: 16:00. '));
  assert.ok(msg({ second: 'any' }).includes('2ª opção: qualquer horário nesse dia.'));
  assert.ok(!msg({ second: '14:30' }).includes('2ª'), 'second choice equal to the first is dropped');
  assert.ok(!msg({ second: '23:00' }).includes('2ª'), 'a second choice that does not exist is dropped');
  assert.ok(!msg({ note: '   ' }).includes('Observação'));
  assert.ok(msg({ note: 'primeira vez, cabelo longo' }).includes(' Observação: primeira vez, cabelo longo. (pedido enviado pelo site)'));
});

test('a complete message never contains placeholders, empty brackets or double spaces', () => {
  const variants: BookingInput[] = [full, { ...full, second: '16:00' }, { ...full, second: 'any', note: 'primeira vez' }, { ...full, note: 'x' }];
  for (const v of variants) {
    const msg = buildMessage(v, ctx)!;
    for (const bad of ['{', '}', 'undefined', 'null', 'NaN', '[]', '()', '**', '  ', '\n', '$']) assert.ok(!msg.includes(bad), `${bad} in: ${msg}`);
    assert.ok(msg.startsWith('Olá! Sou ') && msg.endsWith('(pedido enviado pelo site)'));
  }
});

test('names and notes are cleaned: no WhatsApp formatting, no line breaks, capped length', () => {
  assert.equal(cleanText('  *Maria*   _S_\n\n~Souza~ `x`  ', 60), 'Maria S Souza x');
  const msg = buildMessage({ ...full, name: '*Maria*\nSouza', note: 'a\nb *c*' }, ctx)!;
  assert.ok(msg.includes('Sou Maria Souza e') && msg.includes('Observação: a b c.') && !msg.includes('\n'));
  assert.equal(cleanText('x'.repeat(500), 200).length, 200);
});

test('every real service name can be requested', () => {
  for (const service of serviceNames) assert.ok(buildMessage({ ...full, service }, ctx)!.includes(`*${service}*`));
});

test('the URL targets the salon number and carries the exact message', () => {
  const msg = buildMessage(full, ctx)!;
  const url = whatsappBookingUrl(business.whatsappNumber, msg);
  assert.ok(url.startsWith('https://wa.me/5519993458629?text='));
  assert.equal(decodeURIComponent(url.split('?text=')[1]), msg);
});
