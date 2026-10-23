// Page behaviour (header, menu, reveal, counters, hero video, carousel, chips, WhatsApp pill, pinned chapters).
// Motion follows the Flor de Lis reference and is the same for everyone, on phones and desktops alike.
const d = document;
const $ = <T extends HTMLElement>(s: string, c: ParentNode = d) => c.querySelector<T>(s);
const $$ = <T extends HTMLElement>(s: string, c: ParentNode = d) => Array.from(c.querySelectorAll<T>(s));
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

import './booking';

/* ---------- Header: transparent over the hero, solid + blur after scrolling ---------- */
const header = $('#header');
const hero = $('.hero');
const media = $('#heroMedia');
const proof = $('#proof');
let ticking = false;
function onScroll() {
  header?.classList.toggle('is-scrolled', scrollY > 24);
  if (!fine && media && proof) {
    const y = Math.min(scrollY, innerHeight);
    media.style.transform = `translate3d(0,${Math.min(y * 0.06, 24).toFixed(1)}px,0)`;
    proof.style.transform = `translate3d(0,${(-y * 0.06).toFixed(1)}px,0)`;
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* ---------- Mobile menu: focus stays inside while it is open, the page behind is inert, Escape returns focus ---------- */
const burger = $('#burger');
const drawer = $('#drawer');
const behind = $$('main, footer, #waFloat, .skip'); // everything the open menu covers
const menuStops = () => [...$$<HTMLElement>('.header a, .header button'), ...(drawer ? $$<HTMLElement>('a', drawer) : [])];
function setMenu(open: boolean, restoreFocus = true) {
  d.body.classList.toggle('menu-open', open);
  burger?.setAttribute('aria-expanded', String(open));
  burger?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  drawer?.setAttribute('aria-hidden', String(!open));
  d.body.style.overflow = open ? 'hidden' : '';
  behind.forEach((el) => { (el as HTMLElement & { inert: boolean }).inert = open; });
  if (!open && restoreFocus) burger?.focus();
}
burger?.addEventListener('click', () => setMenu(!d.body.classList.contains('menu-open'), false));
drawer && $$('a', drawer).forEach((a) => a.addEventListener('click', () => setMenu(false, false)));
d.addEventListener('keydown', (e) => {
  if (!d.body.classList.contains('menu-open')) return;
  if (e.key === 'Escape') { setMenu(false); return; }
  if (e.key !== 'Tab') return;
  const stops = menuStops(), first = stops[0], last = stops[stops.length - 1];
  if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
});
matchMedia('(min-width:1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false, false); }); // menu does not exist on desktop

/* ---------- Scroll reveal (also used inside the chapters when they are not pinned) ---------- */
const revealEls = $$('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => io.observe(el));
} else revealEls.forEach((el) => el.classList.add('in'));

/* ---------- Counters: the HTML already has the final value; replay 0 → value on entry, always end on the final text ---------- */
const fmt = (v: number, dec: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function runCount(el: HTMLElement) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const to = parseFloat(el.dataset.to ?? ''), dec = parseInt(el.dataset.decimals ?? '0', 10);
  if (isNaN(to)) return;
  const finalTxt = fmt(to, dec), dur = 1200, t0 = performance.now();
  el.textContent = fmt(0, dec);
  (function step(now: number) {
    const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(to * e, dec);
    if (p < 1) requestAnimationFrame(step); else el.textContent = finalTxt;
  })(t0);
  setTimeout(() => { el.textContent = finalTxt; }, dur + 200);
}
if ('IntersectionObserver' in window) {
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCount(e.target as HTMLElement); cio.unobserve(e.target); } }), { threshold: 0.4 });
  $$('.count').forEach((el) => cio.observe(el));
}

/* ---------- Hero: mouse parallax (desktop) + video that starts after load ---------- */
if (hero && media && proof && fine) {
  let mx = 0, my = 0, raf = 0; // one write per frame, from the latest pointer position
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      media.style.transform = `translate3d(${(-mx * 22).toFixed(1)}px,${(-my * 16).toFixed(1)}px,0)`;
      proof.style.transform = `translate3d(${(mx * 26).toFixed(1)}px,${(my * 20).toFixed(1)}px,0)`;
    });
  });
  hero.addEventListener('mouseleave', () => { media.style.transform = ''; proof.style.transform = ''; });
  media.style.transition = 'transform .6s cubic-bezier(.22,.8,.24,1)';
}
const video = $<HTMLVideoElement>('#heroVideo');
function startVideo() {
  if (!video || !media) return;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
  video.src = (matchMedia('(min-width:900px)').matches ? media.dataset.videoD : media.dataset.videoM) ?? '';
  video.muted = true;
  video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true }); // until then (or if the file fails) the poster stays
  video.play().catch(() => { /* autoplay blocked: the poster stays */ });
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) video.pause(); else video.play().catch(() => {});
    }), { threshold: 0.05 }).observe(hero);
  }
}
if (video) {
  const go = () => setTimeout(startVideo, 300);
  d.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
}

/* ---------- Service chips: collapsed on phones, expandable ---------- */
const mqPhone = matchMedia('(max-width:899px)');
$$('[data-chips]').forEach((ul) => {
  const btn = ul.nextElementSibling as HTMLButtonElement | null;
  const n = ul.children.length;
  if (!btn || n <= 5) return;
  const label = (collapsed: boolean) => (btn.textContent = collapsed ? `Ver todos (${n})` : 'Ver menos');
  const sync = () => {
    ul.classList.toggle('is-collapsed', mqPhone.matches);
    btn.hidden = !mqPhone.matches;
    btn.setAttribute('aria-expanded', 'false');
    label(true);
  };
  sync();
  mqPhone.addEventListener('change', sync);
  btn.addEventListener('click', () => {
    const collapsed = ul.classList.toggle('is-collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    label(collapsed);
  });
});

/* ---------- Reviews carousel ---------- */
const track = $('#track');
if (track) {
  const cards = $$('.quote', track), dots = $('#dots')!, ctrl = $('#ctrl')!;
  cards.forEach((_, i) => {
    const b = d.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', `Ir para o depoimento ${i + 1}`);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
  });
  const step = () => cards[0].getBoundingClientRect().width + 18;
  const goTo = (i: number) => track.scrollTo({ left: i * step(), behavior: 'smooth' });
  const idx = () => Math.min(cards.length - 1, Math.round(track.scrollLeft / step()));
  const paint = () => { const k = idx(); $$('button', dots).forEach((b, i) => b.classList.toggle('on', i === k)); };
  const toggleCtrl = () => { ctrl.hidden = track.scrollWidth <= track.clientWidth + 2; };
  track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
  $('#prev')!.addEventListener('click', () => goTo(Math.max(0, idx() - 1)));
  $('#next')!.addEventListener('click', () => goTo(Math.min(cards.length - 1, idx() + 1)));
  addEventListener('resize', toggleCtrl);
  paint(); toggleCtrl();
}

/* ---------- WhatsApp pill: steps aside while a CTA sits in the bottom strip of the screen ---------- */
const wa = $('#waFloat');
if (wa && 'IntersectionObserver' in window) {
  const zones = $$('.hero__actions .btn, .proof, .svc .btn, .loc__btns .btn, .cta__btns .btn, .chips__toggle, .arrow, .footer a, #agendar-horario');
  const behind = new Set<Element>();
  let obs: IntersectionObserver | undefined;
  const build = () => {
    obs?.disconnect(); behind.clear(); wa.classList.remove('is-away');
    const strip = 112;
    obs = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? behind.add(e.target) : behind.delete(e.target)));
      wa.classList.toggle('is-away', behind.size > 0);
    }, { rootMargin: `-${Math.max(0, innerHeight - strip)}px 0px 0px 0px` });
    zones.forEach((z) => obs!.observe(z));
  };
  build();
  let t: number | undefined;
  addEventListener('resize', () => { clearTimeout(t); t = window.setTimeout(build, 200); });
}

/* ---------- Pinned chapters (GSAP 3.12.5 + ScrollTrigger from cdnjs), phones included ---------- */
type GsapLib = any; // loaded from the CDN at runtime
function loadScript(src: string, cb: () => void) {
  const s = d.createElement('script');
  s.src = src; s.async = true; s.onload = cb;
  d.head.appendChild(s); // if it fails, the chapters simply stay stacked
}
function initJourney() {
  const w = window as unknown as { gsap: GsapLib; ScrollTrigger: GsapLib };
  const { gsap, ScrollTrigger } = w;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const mm = gsap.matchMedia();
  mm.add('(min-width: 0px)', () => {
    const sec = $('#jornada')!, stage = $('#stage')!, chs = $$('.chapter', stage), dotEls = $$('.journey__dots b'), n = chs.length;
    sec.classList.add('is-pinned');
    const imgs = chs.map((c) => $('img', c)), txts = chs.map((c) => $('.chapter__content', c)),
      lbls = chs.map((c) => $('.chapter__label', c)), hints = chs.map((c) => $('.chapter__hint', c)).filter(Boolean);
    gsap.set(chs, { autoAlpha: 0 }); gsap.set(chs[0], { autoAlpha: 1 });
    gsap.set(imgs, { scale: 1.12 }); gsap.set(imgs[0], { scale: 1 });
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: stage, start: 'top top',
      end: () => '+=' + Math.round(stage.offsetHeight * (n - 1) * (matchMedia('(max-width:899px)').matches ? 1 : 1.15)),
      pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
      snap: { snapTo: 'labels', directional: false, duration: { min: 0.25, max: 0.7 }, delay: 0.12, ease: 'power1.inOut' },
      onUpdate: (self: { progress: number }) => { const k = Math.round(self.progress * (n - 1)); dotEls.forEach((b, i) => b.classList.toggle('on', i === k)); },
    } });
    tl.addLabel('c0', 0);
    for (let i = 1; i < n; i++) {
      const t = i - 1 + 0.45; // crossfade window inside each scroll "unit"
      tl.to(imgs[i - 1], { scale: 1.07, duration: 0.55 }, t)
        .to(txts[i - 1], { autoAlpha: 0, y: -34, duration: 0.3 }, t)
        .to(lbls[i - 1], { autoAlpha: 0, duration: 0.3 }, t)
        .to(chs[i - 1].querySelector('.chapter__hint') ?? {}, { autoAlpha: 0, duration: 0.2 }, t)
        .to(chs[i], { autoAlpha: 1, duration: 0.55 }, t)
        .fromTo(imgs[i], { scale: 1.14 }, { scale: 1, duration: 0.55 }, t)
        .fromTo(txts[i], { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.4 }, t + 0.2)
        .fromTo(lbls[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 0.2)
        .to(chs[i - 1], { autoAlpha: 0, duration: 0.01 }, t + 0.54)
        .addLabel('c' + i, i);
      const hint = chs[i].querySelector('.chapter__hint');
      if (hint) tl.fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 0.3);
    }
    tl.to({}, { duration: 0.35 }, n - 1); // breathing room before the page continues
    return () => { sec.classList.remove('is-pinned'); gsap.set([...chs, ...imgs, ...txts, ...lbls, ...hints], { clearProps: 'all' }); };
  });
  addEventListener('load', () => ScrollTrigger.refresh());
  ScrollTrigger.refresh();
}
if ($('#jornada')) {
  const start = () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', () =>
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', initJourney));
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600));
  d.readyState === 'complete' ? idle() : addEventListener('load', idle, { once: true });
}

onScroll();
