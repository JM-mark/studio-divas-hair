// Guided booking form: service, day, time, name -> a WhatsApp message built only from validated values.
// No backend: nothing is stored or sent anywhere except the wa.me link the visitor opens. Rules live in src/lib/*.
import { business, hours, serviceGroups } from '../data/site';
import { saoPauloMoment, upcomingDays, slotsForDate, type BookingDay } from '../lib/slots';
import {
  buildMessage, missingFields, whatsappBookingUrl, isValidName, cleanText, WEEKDAY_SHORT, WEEKDAY_LONG, NAME_MAX, NOTE_MAX,
  type BookingInput, type MissingField,
} from '../lib/booking';

const d = document;
const section = d.getElementById('agendar-horario');
const form = d.getElementById('bookForm') as HTMLFormElement | null;
const behavior: ScrollBehavior = 'smooth';
const serviceNames = serviceGroups.flatMap((g) => g.items.map((s) => s.name));

/* ---------- deep link from a service card: /agendar/?categoria=cabelo highlights that category ---------- */
function cueCategory() {
  const category = new URLSearchParams(location.search).get('categoria');
  const group = category ? form!.querySelector<HTMLElement>(`.svc-group[data-category="${category.replace(/[^a-z-]/g, '')}"]`) : null;
  if (!group) return;
  group.classList.add('is-cue');
  setTimeout(() => group.scrollIntoView({ behavior, block: 'center' }), 350);
  setTimeout(() => group.classList.remove('is-cue'), 2600);
}

if (section && form) init(form);

function init(form: HTMLFormElement) {
  const $ = <T extends HTMLElement>(id: string) => d.getElementById(id) as T;
  const daysEl = $('days'), timesEl = $('times'), secondEl = $<HTMLSelectElement>('second'), notice = $('timeNotice');
  const nameEl = $<HTMLInputElement>('bookName'), noteEl = $<HTMLTextAreaElement>('bookNote'), nameErr = $('nameErr');
  const sendBtn = $<HTMLButtonElement>('bookSend'), missingEl = $('bookMissing'), sentEl = $('bookSent'), sentLink = $<HTMLAnchorElement>('bookSentLink');
  const sumEl = $('sum'), sumLine = $('sumLine');
  const steps = { serviço: 'stepService', dia: 'stepDay', horário: 'stepTime', 'seu nome': 'stepData' } as const;
  const messages: Record<MissingField, string> = {
    serviço: 'Escolha um serviço para continuar.',
    dia: 'Escolha um dia para continuar.',
    horário: 'Escolha um horário para continuar.',
    'seu nome': 'Digite o seu nome para continuar (pelo menos 2 letras).',
  };

  const state: Required<BookingInput> = { service: '', dateKey: '', time: '', second: '', name: '', note: '' };
  let days: BookingDay[] = [];
  const ctx = () => ({ serviceNames, hours, now: saoPauloMoment() });
  const dayOf = (key: string) => days.find((x) => x.key === key);

  /* ----- day strip ----- */
  function renderDays() {
    const scroll = daysEl.scrollLeft;
    days = upcomingDays(hours, saoPauloMoment());
    daysEl.replaceChildren();
    daysEl.setAttribute('role', 'radiogroup'); daysEl.setAttribute('aria-label', 'Dia do atendimento');
    for (const day of days) {
      const label = d.createElement('label'); label.className = 'day' + (day.disabled ? ' is-off' : '');
      const input = d.createElement('input'); input.type = 'radio'; input.name = 'dia'; input.value = day.key;
      input.disabled = !!day.disabled; input.checked = state.dateKey === day.key;
      const dm = `${String(day.d).padStart(2, '0')}/${String(day.m).padStart(2, '0')}`;
      input.setAttribute('aria-label', `${WEEKDAY_LONG[day.weekday]}, ${dm}${day.isToday ? ', hoje' : ''}${day.disabled === 'fechado' ? ', fechado' : day.disabled ? ', sem horários' : ''}`);
      const box = d.createElement('span'); box.className = 'day__box';
      const tag = day.disabled === 'fechado' ? 'Fechado' : day.disabled ? 'Sem horários' : day.isToday ? 'Hoje' : '';
      for (const [cls, text] of [['day__w', WEEKDAY_SHORT[day.weekday]], ['day__d', dm], ['day__t', tag]] as const) {
        const s = d.createElement('span'); s.className = cls; s.textContent = text; box.append(s);
      }
      label.append(input, box); daysEl.append(label);
    }
    daysEl.scrollLeft = scroll;
    daysEl.setAttribute('aria-busy', 'false');
  }
  const stripBy = (dir: number) => daysEl.scrollBy({ left: dir * daysEl.clientWidth * 0.8, behavior });
  $('daysPrev').addEventListener('click', () => stripBy(-1));
  $('daysNext').addEventListener('click', () => stripBy(1));

  /* ----- time grid + second choice ----- */
  const slotsNow = () => (state.dateKey ? slotsForDate(hours, state.dateKey, saoPauloMoment()) : []);
  function renderTimes() {
    const slots = slotsNow();
    timesEl.replaceChildren();
    if (!state.dateKey || slots.length === 0) {
      const p = d.createElement('p'); p.className = 'times__empty';
      p.textContent = state.dateKey ? 'Sem horários livres neste dia. Escolha outro dia.' : 'Escolha um dia para ver os horários.';
      timesEl.append(p); timesEl.removeAttribute('role');
    } else {
      timesEl.setAttribute('role', 'radiogroup'); timesEl.setAttribute('aria-label', 'Horários disponíveis');
      slots.forEach((t, i) => {
        const label = d.createElement('label'); label.className = 'slot'; label.style.setProperty('--n', String(Math.min(i, 12)));
        const input = d.createElement('input'); input.type = 'radio'; input.name = 'hora'; input.value = t; input.checked = state.time === t;
        const span = d.createElement('span'); span.textContent = t;
        label.append(input, span); timesEl.append(label);
      });
    }
    renderSecond(slots);
  }
  function renderSecond(slots: string[]) {
    secondEl.replaceChildren();
    const add = (value: string, text: string) => { const o = d.createElement('option'); o.value = value; o.textContent = text; secondEl.append(o); };
    add('', 'Sem 2ª opção');
    if (state.time) { add('any', 'Qualquer horário nesse dia'); slots.filter((t) => t !== state.time).forEach((t) => add(t, t)); }
    if (![...secondEl.options].some((o) => o.value === state.second)) state.second = '';
    secondEl.value = state.second;
    secondEl.disabled = !state.time;
  }

  /* ----- keep the choice consistent with the day and with the clock ----- */
  function reconcile(reason: 'day' | 'clock') {
    const day = dayOf(state.dateKey);
    if (state.dateKey && (!day || day.disabled)) { state.dateKey = ''; state.time = ''; state.second = ''; notice.textContent = 'Esse dia não está mais disponível. Escolha outro.'; return; }
    if (state.time && !slotsNow().includes(state.time)) {
      state.time = ''; state.second = '';
      notice.textContent = reason === 'day' ? 'O horário que você escolheu não existe nesse dia. Escolha outro.' : 'Esse horário já passou. Escolha outro.';
    }
  }

  /* ----- summary, checklist, button ----- */
  const missing = () => missingFields(state, ctx());
  function dayLabel() {
    const day = dayOf(state.dateKey); if (!day) return '';
    return `${WEEKDAY_SHORT[day.weekday]} ${String(day.d).padStart(2, '0')}/${String(day.m).padStart(2, '0')}`;
  }
  const secondLabel = () => (state.second === 'any' ? 'qualquer horário nesse dia' : state.second);
  function update() {
    const miss = missing();
    sendBtn.setAttribute('aria-disabled', String(miss.length > 0));
    sendBtn.classList.toggle('is-ready', miss.length === 0);
    missingEl.textContent = miss.length ? `Falta escolher: ${miss.join(' · ')}` : 'Tudo certo! Pode enviar o pedido.';
    const rows: { label: string; value: string; step: string; cta: string }[] = [
      { label: 'Serviço', value: state.service, step: steps.serviço, cta: 'Escolher' },
      { label: 'Dia', value: dayLabel(), step: steps.dia, cta: 'Escolher' },
      { label: 'Horário', value: state.time, step: steps.horário, cta: 'Escolher' },
      ...(state.time ? [{ label: '2ª opção', value: secondLabel(), step: steps.horário, cta: 'Editar' }] : []),
      { label: 'Nome', value: cleanText(state.name, NAME_MAX), step: steps['seu nome'], cta: 'Escolher' },
      ...(cleanText(state.note, NOTE_MAX) ? [{ label: 'Observação', value: cleanText(state.note, NOTE_MAX), step: steps['seu nome'], cta: 'Editar' }] : []),
    ];
    sumEl.replaceChildren();
    for (const r of rows) {
      const row = d.createElement('div'); row.className = 'sum__row';
      const dt = d.createElement('dt'); dt.textContent = r.label;
      const dd = d.createElement('dd');
      if (r.value) dd.textContent = r.value; else { dd.className = 'is-empty'; dd.textContent = r.label === '2ª opção' ? 'Sem 2ª opção' : 'Falta escolher'; }
      const b = d.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.dataset.edit = r.step;
      b.textContent = r.value ? 'Editar' : r.cta; b.setAttribute('aria-label', `${b.textContent} ${r.label.toLowerCase()}`);
      const act = d.createElement('dd'); act.append(b); // a <dl> row may only hold <dt>/<dd>
      row.append(dt, dd, act); sumEl.append(row);
    }
    if (miss.length === 0) {
      sumLine.hidden = false;
      sumLine.textContent = [state.service, dayLabel(), state.time, state.second ? `2ª opção ${secondLabel()}` : ''].filter(Boolean).join(' · ');
    } else sumLine.hidden = true;
    for (const [field, id] of Object.entries(steps) as [MissingField, string][]) {
      const el = d.getElementById(id)!;
      const done = !miss.includes(field);
      el.classList.toggle('is-done', done);
      if (done) clearMissing(el);
    }
  }
  sumEl.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('[data-edit]'); if (b) goToStep(b.dataset.edit!, true); });

  /* ----- steps: move, advance, highlight what is missing ----- */
  function goToStep(id: string, focus: boolean) {
    const el = d.getElementById(id)!;
    el.scrollIntoView({ behavior, block: 'start' });
    if (!focus) return;
    const target = el.querySelector<HTMLElement>('input:checked:not(:disabled), input:not(:disabled), select:not(:disabled), textarea');
    target?.focus({ preventScroll: true });
  }
  function advance(next: string, nextDone: boolean) { if (!nextDone) goToStep(next, false); }
  function clearMissing(el: HTMLElement) {
    el.classList.remove('is-missing');
    const msg = el.querySelector<HTMLElement>('.step__msg'); if (msg) { msg.hidden = true; msg.textContent = ''; }
  }
  function flagMissing(field: MissingField) {
    const el = d.getElementById(steps[field])!;
    el.classList.add('is-missing');
    const msg = el.querySelector<HTMLElement>('.step__msg')!; msg.textContent = messages[field]; msg.hidden = false;
    goToStep(steps[field], true);
  }

  /* ----- events ----- */
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'servico') { state.service = t.value; update(); advance(steps.dia, !!state.dateKey); }
    else if (t.name === 'dia') { state.dateKey = t.value; notice.textContent = ''; reconcile('day'); renderTimes(); update(); advance(steps.horário, !!state.time); }
    else if (t.name === 'hora') { state.time = t.value; notice.textContent = ''; renderSecond(slotsNow()); update(); advance(steps['seu nome'], isValidName(state.name)); }
    else if (t.id === 'second') { state.second = t.value; update(); }
  });
  nameEl.addEventListener('input', () => { state.name = nameEl.value; nameErr.hidden = true; update(); });
  nameEl.addEventListener('blur', () => { nameErr.hidden = !state.name.trim() || isValidName(state.name); });
  noteEl.addEventListener('input', () => { state.note = noteEl.value; update(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // the only path to WhatsApp: validated here, right now, against the current clock
    const miss = missing();
    if (miss.length) { flagMissing(miss[0]); return; }
    const message = buildMessage(state, ctx());
    if (!message) { flagMissing('horário'); return; }
    const url = whatsappBookingUrl(business.whatsappNumber, message);
    sentLink.href = url; sentEl.hidden = false;
    sentLink.click(); // opens WhatsApp inside this user gesture; the visible link is the fallback
  });

  /* ----- start, and tick: today's list and the day strip follow the clock ----- */
  renderDays(); renderTimes(); update(); cueCategory();
  setInterval(() => {
    const before = days[0]?.key + days[0]?.disabled;
    renderDays(); reconcile('clock'); renderTimes(); update();
    if (before !== days[0]?.key + days[0]?.disabled) notice.textContent ||= '';
  }, 30_000);
}
