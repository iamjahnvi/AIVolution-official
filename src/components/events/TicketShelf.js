import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { EVENTS_DESC } from '../home/eventDate';
import { shortHash, Hand } from '../home/scrap';
import { typeOf, splitDate } from './eventType';

const Ticket = ({ e, i, active, onPick }) => {
  const [label, color] = typeOf(e);
  const d = splitDate(e.date);
  const photos = e.gallery ? e.gallery.length : 1;
  return (
    <button
      type="button"
      onClick={(ev) => onPick(e, ev.currentTarget)}
      aria-pressed={active}
      className={`ticket group relative shrink-0 flex text-left border-2 border-border shadow-[5px_5px_0_var(--border)] transition-transform duration-200 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 ${active ? 'bg-border text-fg-primary' : 'bg-bg-surface text-fg-secondary'}`}
      style={{ '--tone': color, transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}
    >
      {/* date block */}
      <span className="flex flex-col items-center justify-center w-[88px] md:w-[104px] px-2 py-4 border-r-2 border-dashed border-current/40 ticket-stub">
        <span className="font-bricolage font-extrabold text-4xl md:text-5xl leading-none">{d.day}</span>
        <span className="font-mono text-xs uppercase tracking-widest mt-1">{d.month}</span>
        <span className="font-mono text-[0.6rem] opacity-60">{d.year}</span>
      </span>
      {/* body */}
      <span className="ticket-body flex flex-col justify-between w-[230px] md:w-[270px] px-4 py-3">
        <span className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 text-[0.6rem] font-mono font-bold uppercase tracking-widest text-ink" style={{ background: color }}>{label}</span>
          <span className="flex items-center gap-2">
            {i === 0 && <span className={`px-1.5 py-0.5 text-[0.58rem] font-mono font-bold border ${active ? 'border-paper/60 text-paper' : 'border-ink bg-highlight'}`}>HEAD</span>}
            <img src={e.imgUrl} alt="" loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover border-2 border-current" />
          </span>
        </span>
        <span className="font-bricolage font-extrabold text-lg md:text-xl leading-[1.05] mt-2 line-clamp-2">{e.title}</span>
        <span className="flex items-center justify-between font-mono text-[0.62rem] mt-3 opacity-70">
          <span>{shortHash(e.id)} · {photos} photo{photos === 1 ? '' : 's'}</span>
          <span className="tracking-[0.2em]">ADMIT ONE</span>
        </span>
      </span>
    </button>
  );
};

// A shelf of ticket stubs, newest first. Scroll it sideways: mouse wheel over the shelf,
// trackpad swipe, drag with the mouse, or the ← → buttons. Never hijacks the page scroll.
export const TicketShelf = ({ activeId, onSelect }) => {
  const row = useRef(null);
  const drag = useRef({ on: false, x: 0, left: 0, moved: false });
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = row.current;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
    };
    update();
    // Vertical wheel over the shelf scrolls it sideways while it still has room; at the
    // ends the page scrolls as usual.
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const canGo = e.deltaY > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
      if (!canGo) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('scroll', update, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); el.removeEventListener('wheel', onWheel); window.removeEventListener('resize', update); };
  }, []);

  // Mouse drag-to-scroll (touch already scrolls natively).
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { on: true, x: e.clientX, left: row.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.on) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    row.current.scrollLeft = d.left - dx;
  };
  const onPointerUp = () => { drag.current.on = false; };
  const by = (dir) => row.current.scrollBy({ left: dir * 380, behavior: 'smooth' });

  const pick = (e, el) => {
    if (drag.current.moved) { drag.current.moved = false; return; }
    if (prefersReducedMotion()) { onSelect(e.id); return; }
    // Tear: the stub rips off and snaps back, then the report changes.
    const stub = el.querySelector('.ticket-stub');
    // Hand off outside GSAP's tick so the report's pinned strip measures a settled layout.
    gsap.timeline({ onComplete: () => requestAnimationFrame(() => onSelect(e.id)) })
      .to(stub, { rotation: -14, x: -18, y: 6, transformOrigin: 'bottom right', duration: 0.22, ease: 'power2.in' })
      .to(el, { rotation: 0, scale: 1.04, duration: 0.2 }, 0)
      .to(stub, { rotation: 0, x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1, 0.45)' })
      .to(el, { scale: 1, duration: 0.3 }, '<');
  };

  return (
    <div className="relative -mx-5 sm:-mx-8 md:-mx-12">
      <div className="flex items-center justify-between gap-4 px-5 sm:px-8 md:px-12 mb-2">
        <Hand className="text-lg text-secondary" rotate={-2}>scroll the shelf sideways →</Hand>
        <div className="flex gap-2">
          <button type="button" onClick={() => by(-1)} disabled={edges.start} className="btn-sticker !py-1.5 !px-3.5 text-sm disabled:opacity-30" style={{ '--bg': 'var(--bg-surface)' }} aria-label="Scroll tickets left">←</button>
          <button type="button" onClick={() => by(1)} disabled={edges.end} className="btn-sticker !py-1.5 !px-3.5 text-sm disabled:opacity-30" style={{ '--bg': 'var(--bg-surface)' }} aria-label="Scroll tickets right">→</button>
        </div>
      </div>
      <div
        ref={row}
        className="flex gap-6 md:gap-8 overflow-x-auto px-5 sm:px-8 md:px-12 py-6 pr-16 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {EVENTS_DESC.map((e, i) => <Ticket key={e.id} e={e} i={i} active={e.id === activeId} onPick={pick} />)}
      </div>
      {/* shelf position */}
      <div className="mx-5 sm:mx-8 md:mx-12 h-1.5 bg-border/10" aria-hidden="true">
        <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${Math.max(8, progress * 100)}%` }} />
      </div>
    </div>
  );
};
