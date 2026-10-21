import React, { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, HEAVY, prefersReducedMotion } from '../../lib/gsap';
import { EVENTS_DESC } from '../home/eventDate';
import { shortHash, Stamp, Tape, PostIt, Hand, Mark, Sticker } from '../home/scrap';
import { Lightbox } from './Lightbox';
import { Wall } from './Wall';
import { typeOf } from './eventType';

// Lead photo: first gallery shot that isn't the poster, else the poster.
const leadOf = (e) => (e.gallery || []).find((g) => !/poster/i.test(g)) || e.imgUrl;
const isPoster = (src) => /poster/i.test(src);

// Card tones adapted for dark theme - brand accents on dark surfaces.
const CARD_TONES = [
  { bg: 'var(--bg-elevated)', fg: 'var(--fg-primary)', accent: 'var(--accent)', stamp: 'var(--accent-muted)', tape: '' },
  { bg: 'var(--accent)', fg: '#0d0d0d', accent: '#fff', stamp: 'var(--accent-secondary)', tape: 'blue' },
  { bg: 'var(--accent-secondary)', fg: '#fff', accent: '#fff', stamp: 'var(--accent-muted)', tape: 'pink' },
  { bg: 'var(--fg-muted)', fg: 'var(--fg-primary)', accent: 'var(--accent)', stamp: 'var(--redpen)', tape: 'pink' },
  { bg: 'var(--accent-muted)', fg: 'var(--fg-primary)', accent: '#fff', stamp: 'var(--pen)', tape: 'blue' },
];
const CHIP_TONES = ['var(--accent)', 'var(--accent-secondary)', 'var(--accent)', 'var(--accent-muted)', 'var(--bg-surface)', 'var(--accent)'];

// Split prose into sentences (keeps abbreviations like "Mr." together well enough for our copy).
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z"])/).filter(Boolean);

// A text page renders differently depending on what the section actually is.
const TextPage = ({ s, n, total, fact, tone, dark, event }) => {
  const list = /takeaway|highlight/i.test(s.heading);
  const chips = !list && (s.body.match(/;/g) || []).length >= 3;
  const body = sentences(s.body);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <Tape rotate={-2} tone={tone.tape} className="!text-[0.62rem]">part {n + 1} of {total}</Tape>
        <span className="font-bricolage font-extrabold leading-none text-5xl opacity-25 select-none" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>
      </div>
      <h2 className="mt-7 text-[2rem] lg:text-[2.3rem] leading-[0.95]">{s.heading.toLowerCase()}</h2>
      <div className="mt-4 h-[3px] w-14 bg-current opacity-60" aria-hidden="true" />

      {list && (
        <ul className="mt-5 space-y-3">
          {body.map((line, k) => (
            <li key={k} className="flex items-start gap-3">
              <svg viewBox="0 0 40 40" className="draw w-7 h-7 shrink-0 mt-0.5" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="34" height="34" rx="8" stroke="currentColor" />
                <path d="M11 21 L 18 28 L 30 13" stroke={dark ? 'var(--mint)' : 'var(--marker)'} strokeWidth="5" />
              </svg>
              <span className="text-[1rem] leading-[1.6]">{line}</span>
            </li>
          ))}
        </ul>
      )}
      {chips && (
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {s.body.replace(/\.$/, '').split(/;\s*/).map((item, k) => (
            <li key={k}><Sticker className="!text-[0.85rem] !py-2 !px-3.5 !cursor-default !whitespace-normal text-ink" bg={CHIP_TONES[k % CHIP_TONES.length]}>{item.replace(/^and /i, '')}</Sticker></li>
          ))}
        </ul>
      )}
      {!list && !chips && (
        <p className="mt-5 text-[1.02rem] leading-[1.75] opacity-90">
          <Mark on color={tone.accent}>{body[0]}</Mark>{body.length > 1 ? ' ' + body.slice(1).join(' ') : ''}
        </p>
      )}

      {fact && <Stamp rotate={-8} color={tone.stamp} className="absolute -bottom-4 right-5 text-[0.62rem]" style={{ background: tone.bg }}>{fact}</Stamp>}
      {dark && <Hand className="absolute bottom-5 left-8 text-lg opacity-60" rotate={-3} color="#eaf0ff">{event.date} · {shortHash(event.id)}</Hand>}
    </>
  );
};

// Photo pages come in three flavours, cycled: one big print / a mini cork board with two
// prints / the poster pinned up as a flyer.
const PhotoPage = ({ page, event, total, onOpen, i }) => {
  if (page.layout === 'flyer') {
    return (
      <div className="relative w-full lg:w-[560px] p-6">
        <span className="pushpin absolute top-3 left-5" /><span className="pushpin absolute top-3 right-5" />
        <button type="button" onClick={() => onOpen(page.shots[0].n)} className="block w-full border-[3px] border-border bg-bg-surface shadow-[8px_8px_0_var(--border)] hover:-translate-y-1 transition-transform" style={{ transform: 'rotate(-1.5deg)' }} aria-label="Open the poster">
          <img src={page.shots[0].src} alt={`${event.title} poster`} loading="lazy" decoding="async" className="w-full h-auto" />
        </button>
        <Tape rotate={3} className="absolute -bottom-2 right-10 !px-6">the poster</Tape>
      </div>
    );
  }
  if (page.layout === 'board') {
    const [a, b] = page.shots;
    return (
      <div className="relative w-full lg:w-[700px] cork border-[3px] border-ink shadow-[8px_8px_0_var(--ink)] p-6 lg:p-8 lg:h-[560px]">
        <span className="pushpin absolute top-3 left-1/2 -translate-x-1/2" />
        <button type="button" onClick={() => onOpen(a.n)} className="polaroid block w-[62%] lg:absolute lg:left-6 lg:top-8 !p-3 !pb-4 hover:z-[3] hover:scale-[1.03] transition-transform" style={{ '--r': '-5deg' }} aria-label={`Open photo ${a.n + 1}`}>
          <img src={a.src} alt={`${event.title} ${a.n + 1}`} loading="lazy" decoding="async" className="!aspect-[4/3]" />
          <figcaption className="polaroid__caption !text-lg !mt-2">{a.n === 0 ? event.title : `frame ${String(a.n + 1).padStart(2, '0')}`}</figcaption>
        </button>
        {b && (
          <button type="button" onClick={() => onOpen(b.n)} className="polaroid block w-[58%] ml-auto -mt-10 lg:mt-0 lg:absolute lg:right-6 lg:bottom-8 !p-3 !pb-4 hover:z-[3] hover:scale-[1.03] transition-transform" style={{ '--r': '5deg' }} aria-label={`Open photo ${b.n + 1}`}>
            <img src={b.src} alt={`${event.title} ${b.n + 1}`} loading="lazy" decoding="async" className="!aspect-[4/3]" />
            <figcaption className="polaroid__caption !text-lg !mt-2">frame {String(b.n + 1).padStart(2, '0')}</figcaption>
          </button>
        )}
        <PostIt rotate={4} tone="blue" className="absolute left-6 bottom-6 hidden lg:block text-lg">{String(a.n + 1).padStart(2, '0')}{b ? `–${String(b.n + 1).padStart(2, '0')}` : ''} of {total}<br />click to open</PostIt>
      </div>
    );
  }
  const shot = page.shots[0];
  return (
    <div className="relative w-full lg:w-[640px]">
      <Tape rotate={i % 2 ? 3 : -3} tone={['', 'blue', 'pink'][shot.n % 3]} stripe className="absolute -top-4 left-1/2 -translate-x-1/2 z-[2] !px-10 !py-2" />
      <button type="button" onClick={() => onOpen(shot.n)} className="polaroid block w-full text-left !p-4 !pb-5 transition-transform duration-300 hover:scale-[1.02]" style={{ '--r': `${i % 2 ? 1.5 : -1.5}deg` }} aria-label={`Open photo ${shot.n + 1}`}>
        <img src={shot.src} alt={`${event.title} ${shot.n + 1}`} loading="lazy" decoding="async" className="!aspect-[4/3]" />
        <figcaption className="polaroid__caption flex items-end justify-between gap-4 !mt-4 !text-2xl">
          <span>{shot.n === 0 ? event.title : `frame ${String(shot.n + 1).padStart(2, '0')}`}</span>
          <span className="font-mono text-[0.65rem] text-pencil tracking-widest shrink-0">{String(shot.n + 1).padStart(2, '0')}/{String(total).padStart(2, '0')} · click to open</span>
        </figcaption>
      </button>
    </div>
  );
};

// Build the spread: text page, photo page, text, photo… Photo pages alternate big print /
// mini board (two shots); leftovers follow; the poster closes as a flyer.
const buildPages = (event, images) => {
  const shots = images.map((src, n) => ({ src, n })).filter((x) => !isPoster(x.src));
  const poster = images.map((src, n) => ({ src, n })).find((x) => isPoster(x.src));
  const pages = [];
  let layoutIdx = 0;
  const nextPhoto = () => {
    if (!shots.length) return null;
    const layout = layoutIdx++ % 2 === 0 ? 'single' : 'board';
    const take = layout === 'board' ? Math.min(2, shots.length) : 1;
    return { kind: 'photo', layout: take === 1 ? 'single' : 'board', shots: shots.splice(0, take) };
  };
  event.sections.forEach((s, n) => {
    pages.push({ kind: 'text', s, n });
    const p = nextPhoto();
    if (p) pages.push(p);
  });
  let p;
  while ((p = nextPhoto())) pages.push(p);
  if (poster) pages.push({ kind: 'photo', layout: 'flyer', shots: [poster] });
  return pages;
};

// The magazine spread for one event: photo hero → lead → sliding spread → the wall.
export const Report = ({ event, onSelect }) => {
  const root = useRef(null);
  const cardsWrap = useRef(null);
  const cardsTrack = useRef(null);
  const [open, setOpen] = useState(null);
  const [label, color] = typeOf(event);
  const idx = EVENTS_DESC.findIndex((e) => e.id === event.id);
  const prev = EVENTS_DESC[idx - 1];
  const next = EVENTS_DESC[idx + 1];
  const words = event.title.split(' ');
  const images = event.gallery && event.gallery.length ? event.gallery : [event.imgUrl];
  const pages = buildPages(event, images);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.rep-hero-img', { clipPath: 'inset(0 0 100% 0)', scale: 1.2 }, { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 1.1, ease: 'power3.inOut' })
        .from('.rep-word > span', { yPercent: 110, duration: 0.8, stagger: 0.06 }, 0.45)
        .from('.rep-meta > *', { y: 16, opacity: 0, stagger: 0.06, duration: 0.5 }, 0.7)
        .from('.rep-n', { x: 40, opacity: 0, duration: 0.6 }, 0.6)
        .from('.rep-lead', { y: 24, opacity: 0, duration: 0.6 }, 0.9)
        .from('.rep-card', { x: 80, rotation: 6, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'back.out(1.4)' }, 1.0);
      gsap.to('.rep-hero-img', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.rep-hero', start: 'top bottom', end: 'bottom top', scrub: true } });

      // Checklist ticks draw in when their card scrolls into view.
      gsap.utils.toArray('.rep-card .draw', root.current).forEach((svg) => {
        gsap.from(svg.querySelectorAll('path, rect'), { drawSVG: '0%', duration: 0.6, stagger: 0.08, ease: 'power2.inOut', scrollTrigger: { trigger: svg, start: 'top 90%', once: true } });
      });

      // Desktop: the spread pins and slides sideways while you scroll down.
      const mm = gsap.matchMedia();
      mm.add(HEAVY, () => {
        const travel = () => Math.max(0, cardsTrack.current.scrollWidth - cardsWrap.current.clientWidth);
        gsap.to(cardsTrack.current, {
          x: () => -travel(),
          ease: 'none',
          scrollTrigger: { trigger: cardsWrap.current, start: 'top top', end: () => `+=${travel()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        gsap.fromTo('.rep-progress', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: cardsWrap.current, start: 'top top', end: () => `+=${travel()}`, scrub: true, invalidateOnRefresh: true } });
        gsap.delayedCall(0.6, () => ScrollTrigger.refresh());
      });
    },
    { scope: root, revertOnUpdate: true, dependencies: [event.id] }
  );

  return (
    <article ref={root} id="report" className="scroll-mt-24">
      {/* hero */}
      <div className="rep-hero relative h-[72vh] min-h-[460px] overflow-hidden border-[3px] border-border shadow-[10px_10px_0_var(--border)] bg-bg-surface">
        <img key={event.id} src={leadOf(event)} alt="" className="rep-hero-img absolute inset-0 w-full h-[118%] -top-[9%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/35 to-transparent" aria-hidden="true" />
        <span className="rep-n absolute top-5 right-6 font-bricolage font-extrabold leading-none text-[clamp(4rem,14vw,12rem)] text-transparent select-none" style={{ WebkitTextStroke: '2px rgba(243,238,226,0.55)' }} aria-hidden="true">
          {String(EVENTS_DESC.length - idx).padStart(2, '0')}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col gap-5">
          <div className="rep-meta flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-fg-primary border-2 border-border" style={{ background: color }}>{label}</span>
            <span className="font-mono text-sm text-fg-secondary/80">{event.date}</span>
            <span className="font-mono text-xs text-fg-secondary/50">{shortHash(event.id)}</span>
            {idx === 0 && <span className="px-2 py-0.5 text-[0.62rem] font-mono font-bold border border-border/60 text-fg-primary">HEAD → main</span>}
          </div>
          <h1 className="text-fg-primary text-[clamp(2.4rem,7vw,7.5rem)] max-w-[16ch] leading-[0.92]">
            {words.map((w, i) => <span key={i} className="rep-word mask-line !inline-block mr-[0.22em] align-top"><span>{w}</span></span>)}
          </h1>
          <div className="rep-meta flex flex-wrap gap-2">
            {event.facts.map((f, i) => (
              <Tape key={f} rotate={i % 2 ? 1.5 : -1.5} tone={['', 'blue', 'pink'][i % 3]} className="!normal-case !tracking-normal !text-[0.72rem] !py-1.5 !px-3">{f}</Tape>
            ))}
          </div>
        </div>
      </div>

      {/* lead + navigation */}
      <div className="mt-10 grid lg:grid-cols-[1fr_auto] gap-8 items-start">
        <p className="rep-lead font-bricolage font-extrabold text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.3] max-w-4xl">
          <Mark on color={color === '#ff5a1f' ? 'var(--highlight)' : color}>{event.summary}</Mark>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={!prev} onClick={() => prev && onSelect(prev.id)} className="btn-sticker !py-2.5 !px-4 text-sm disabled:opacity-30" style={{ '--bg': 'var(--bg-surface)' }}>← newer</button>
          <button type="button" disabled={!next} onClick={() => next && onSelect(next.id)} className="btn-sticker !py-2.5 !px-4 text-sm disabled:opacity-30" style={{ '--bg': 'var(--bg-surface)' }}>older →</button>
        </div>
      </div>

      {/* the spread: full-bleed; desktop pins and slides it sideways as you scroll down */}
      <div ref={cardsWrap} className="rep-cards-wrap relative mt-14 w-screen ml-[calc(50%-50vw)] lg:h-[100svh] lg:flex lg:flex-col lg:justify-center overflow-hidden bg-bg-surface">
        <div className="flex items-center justify-between gap-4 mb-6 px-5 sm:px-8 md:px-12 lg:px-[6vw]">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-secondary">the report · {event.sections.length} parts · {images.length} photos</p>
          <Hand className="text-lg text-secondary hidden lg:block" rotate={-2}>keep scrolling ↓ the spread slides</Hand>
        </div>
        <ul ref={cardsTrack} className="rep-cards flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 lg:w-max px-5 sm:px-8 md:px-12 lg:px-[6vw] pb-8 pt-4">
          {pages.map((pg, i) => {
            if (pg.kind === 'photo') {
              return <li key={`p${pg.shots[0].n}`} className="rep-card shrink-0 w-full lg:w-auto"><PhotoPage page={pg} event={event} total={images.length} onOpen={setOpen} i={i} /></li>;
            }
            const tone = CARD_TONES[pg.n % CARD_TONES.length];
            return (
              <li key={pg.s.heading} className="rep-card relative shrink-0 w-full lg:w-[520px] border-[3px] border-border shadow-[8px_8px_0_var(--border)] p-7 lg:p-10 pb-12" style={{ background: tone.bg, color: tone.fg, transform: `rotate(${i % 2 ? 0.7 : -0.7}deg)` }}>
                <TextPage s={pg.s} n={pg.n} total={event.sections.length} fact={event.facts[pg.n]} tone={tone} dark={tone.bg === 'var(--screen)'} event={event} />
              </li>
            );
          })}
          <li className="rep-card shrink-0 w-[300px] self-center flex items-center justify-center">
            <PostIt rotate={3} tone="mint" className="text-2xl">end of report —<br />all photos below ↓</PostIt>
          </li>
        </ul>
        <div className="hidden lg:block absolute left-0 right-0 bottom-0 h-1.5 bg-border/10" aria-hidden="true">
          <div className="rep-progress h-full bg-accent origin-left" />
        </div>
      </div>

      {/* the wall */}
      <div className="mt-14">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-secondary">all photos · {images.length}</p>
          <Hand className="text-lg text-secondary" rotate={-2}>pin them up however you like</Hand>
        </div>
        <Wall event={event} images={images} onOpen={setOpen} />
      </div>

      {open !== null && <Lightbox images={images} index={open} title={event.title} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </article>
  );
};
