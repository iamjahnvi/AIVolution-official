import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { useReveal } from '../../hooks/useReveal';
import { EVENTS_DESC, eventTime } from './eventDate';
import { useActiveCell } from './useActiveCell';
import { SectionLabel, Hand, Tape, Polaroid, Perforation, shortHash } from './scrap';

// Event type → lane colour + label. (Algosphere is typed "gallery" in the data but is a hackathon.)
const TYPE = {
  competition: ['competition', '#ff5a1f'],
  gallery: ['competition', '#ff5a1f'],
  workshop: ['workshop', '#2f6bff'],
  webinar: ['webinar', '#3ae88a'],
  visit: ['industrial visit', '#ff8fb1'],
};
const typeOf = (e) => TYPE[e.type] || [e.type, '#6b6860'];

// GitHub-style contribution grid over the span of the events (weeks × 7 days).
const DAY = 86400000;
const times = EVENTS_DESC.map((e) => eventTime(e, true));
const first = new Date(Math.min(...times));
first.setDate(first.getDate() - first.getDay() - 14);
const last = new Date(Math.max(...times));
last.setDate(last.getDate() + 21);
const WEEKS = Math.ceil((last - first) / (7 * DAY));
const counts = new Map(times.map((t) => { const d = new Date(t); return [Math.floor((d - first) / DAY), 1]; }));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabels = Array.from({ length: WEEKS }, (_, w) => {
  const d = new Date(first.getTime() + w * 7 * DAY);
  return d.getDate() <= 7 ? MONTHS[d.getMonth()] : '';
});
const fmt = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const Heatmap = () => (
  <div className="heat border-2 border-border bg-bg-surface p-4 md:p-5 shadow-[6px_6px_0_var(--border)] overflow-x-auto">
    <div className="flex items-baseline justify-between gap-4 mb-3">
      <p className="font-bricolage font-extrabold text-lg">{EVENTS_DESC.length} events · {fmt(first)} → {fmt(last)}</p>
      <p className="font-mono text-[0.65rem] text-secondary hidden sm:block">less <span className="inline-block w-2.5 h-2.5 bg-border/10 align-middle mx-0.5" /><span className="inline-block w-2.5 h-2.5 bg-marker align-middle mx-0.5" /> more</p>
    </div>
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, 11px)`, gridTemplateRows: 'auto repeat(7, 11px)' }}>
      {monthLabels.map((m, w) => <span key={`m${w}`} className="font-mono text-[9px] text-pencil leading-none h-3">{m}</span>)}
      {Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: WEEKS }, (_, w) => {
          const idx = w * 7 + day;
          const hit = counts.has(idx);
          return <span key={`${w}-${day}`} className={`heat-cell w-[11px] h-[11px] rounded-[2px] ${hit ? 'bg-marker' : 'bg-ink/10'}`} style={{ gridColumn: w + 1, gridRow: day + 2 }} />;
        })
      )}
    </div>
  </div>
);

export const Events = () => {
  const root = useRef(null);
  useReveal(root);
  useActiveCell(root);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.heat-cell', {
        scale: 0, duration: 0.4, ease: 'back.out(2)', stagger: { each: 0.004, from: 'start' },
        scrollTrigger: { trigger: '.heat', start: 'top 80%', once: true },
      });
      // The git line draws down as you scroll; each commit pops when reached.
      gsap.from('.git-line', { scaleY: 0, transformOrigin: 'top', ease: 'none', scrollTrigger: { trigger: '.git-log', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      gsap.utils.toArray('.commit', root.current).forEach((c, i) => {
        const side = c.dataset.side === 'r' ? 1 : -1;
        const st = { trigger: c, start: 'top 78%', once: true };
        gsap.from(c.querySelector('.commit-node'), { scale: 0, duration: 0.5, ease: 'back.out(3)', scrollTrigger: st });
        gsap.from(c.querySelector('.commit-card'), { x: side * 60, opacity: 0, duration: 0.7, scrollTrigger: st });
        gsap.from(c.querySelector('.polaroid'), { rotation: side * 14, y: 30, opacity: 0, duration: 0.8, ease: 'back.out(1.4)', delay: 0.15, scrollTrigger: st });
      });
    },
    { scope: root }
  );

  return (
    <section id="events" ref={root} className="cell relative bg-bg-surface dotgrid">
      <div className="relative z-[2] max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-20 md:pt-28 pb-24">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel path="events/" />
            <h2 className="mt-4 text-[clamp(2.6rem,6vw,6rm)]">commit history.</h2>
            <p className="mt-4 max-w-xl text-lg text-secondary">Every event we've run, newest first. Click any commit for the full report and photos.</p>
          </div>
          <Link to="/events" className="btn-sticker" style={{ '--bg': 'var(--bg-surface)' }}>all event reports →</Link>
        </div>

        <div className="reveal mt-10" style={{ '--reveal-i': 1 }}><Heatmap /></div>

        {/* git graph */}
        <div className="git-log relative mt-16 md:mt-24">
          <div className="git-line absolute left-5 md:left-1/2 top-0 bottom-0 w-1 md:-ml-0.5 bg-border" aria-hidden="true" />
          <ol className="space-y-14 md:space-y-20">
            {EVENTS_DESC.map((e, i) => {
              const [label, color] = typeOf(e);
              const right = i % 2 === 1;
              return (
                <li key={e.id} data-side={right ? 'r' : 'l'} className={`commit relative md:grid md:grid-cols-2 md:gap-16 items-center ${right ? '' : 'md:[direction:rtl]'}`}>
                  <span className="commit-node absolute left-5 md:left-1/2 top-8 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-6 h-6 rounded-full border-[3px] border-ink z-[2]" style={{ background: color }} aria-hidden="true" />
                  <div className="md:[direction:ltr] pl-14 md:pl-0">
                    <Link to={`/events?e=${e.id}`} className="commit-card group block border-2 border-border bg-bg-surface p-5 md:p-7 shadow-[6px_6px_0_var(--border)] transition-transform duration-200 hover:-translate-y-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs">
                        <span className="text-marker font-bold">{shortHash(e.id)}</span>
                        <span className="text-pencil">{e.date}</span>
                        <Tape rotate={-1} className="!text-[0.62rem] !py-1 !px-2.5" style={{ background: color }}>{label}</Tape>
                        {i === 0 && <span className="px-2 py-0.5 border border-ink bg-highlight text-[0.62rem] font-bold">HEAD → main</span>}
                      </div>
                      <h3 className="mt-3 text-2xl md:text-[2rem] leading-[0.95] group-hover:underline decoration-marker decoration-4 underline-offset-4">{e.title}</h3>
                      <p className="mt-3 text-pencil leading-relaxed">{e.summary}</p>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {e.facts.slice(0, 4).map((f) => <li key={f} className="font-mono text-[0.65rem] px-2 py-1 border border-border/30 bg-bg-surface">{f}</li>)}
                      </ul>
                    </Link>
                  </div>
                  <div className="md:[direction:ltr] hidden md:flex justify-center">
                    <Polaroid src={e.imgUrl} alt={e.title} caption={e.title} sub={e.date} rotate={right ? -4 : 4} className="w-[260px] lg:w-[300px]" />
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="relative mt-14 pl-14 md:pl-0 md:text-center">
            <span className="absolute left-5 md:left-1/2 top-1 -translate-x-1/2 w-4 h-4 rounded-full border-[3px] border-border bg-bg-surface" aria-hidden="true" />
            <Hand className="text-2xl text-secondary" rotate={-2}>initial commit — Orientation, Sep 2024</Hand>
          </div>
        </div>
      </div>
      <Perforation />
    </section>
  );
};
