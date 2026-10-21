import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import { useReveal } from '../../hooks/useReveal';
import { FACULTY } from '../../data/faculty';
import { TEAM, TEAM_DEPARTMENTS, DEPT_TONE, isLead } from '../../data/team';
import { useActiveCell } from './useActiveCell';
import { useDraggable } from './useDraggable';
import { SectionLabel, Hand, Tape, Stamp, StickerButton, Perforation } from './scrap';

// Deterministic scatter for the contributor pile (no Math.random → stable layout).
const scatter = (i) => {
  const col = i % 6, row = Math.floor(i / 6);
  return { left: `${3 + col * 16 + (row % 2) * 6}%`, top: `${5 + row * 26 + (col % 2) * 7}%`, r: ((i * 37) % 25) - 12 };
};

// One frame of the faculty film strip.
const Frame = ({ f, i }) => (
  <li className="frame relative shrink-0 w-[190px] md:w-[220px]">
    <a href={f.linkedin} target="_blank" rel="noreferrer" className="block group" aria-label={`${f.name} on LinkedIn`}>
      <div className="relative aspect-[3/4] overflow-hidden bg-[#222] border-[3px] border-border transition-colors duration-300 group-hover:border-accent">
        <img src={f.imgUrl} alt={f.name} loading="lazy" decoding="async" draggable={false} className={`w-full h-full object-cover ${f.imgPosition || 'object-top'} transition-transform duration-500 group-hover:scale-[1.06]`} />
        {i === 0 && <Stamp rotate={-8} color="var(--highlight)" className="absolute top-3 left-3 !opacity-100 bg-bg-surface/60 text-[0.6rem]">{f.role}</Stamp>}
        <span className="absolute top-2 right-2 font-mono text-[9px] text-paper/70">{String(i + 1).padStart(2, '0')}A</span>
        {/* hover: tape slides up over the photo */}
        <div className="frame-tag absolute left-2 right-2 bottom-3 translate-y-3 opacity-0 transition-all duration-300">
          <Tape rotate={-1.5} className="!normal-case !tracking-normal !text-[0.72rem] block text-center !bg-highlight">
            LinkedIn ↗
          </Tape>
        </div>
      </div>
<figcaption className="mt-2 px-1 text-fg-primary">
  <p className="font-hand text-xl leading-none truncate"><span className="mark" style={{ "--mark": "var(--marker)" }}>{f.name}</span></p>
  <p className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-fg-secondary/60 mt-1 truncate">{f.role}</p>
</figcaption>
    </a>
  </li>
);

export const Contributors = () => {
  const root = useRef(null);
  const pile = useRef(null);
  useReveal(root);
  useActiveCell(root);
  useDraggable(pile, '.avatar');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // Film strip glides; scroll speed fast-forwards / rewinds it; hovering slows it to a crawl.
      // One owner of the speed (quickTo) so scroll and hover never fight and nothing flickers.
      const film = gsap.to('.film-track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      const setSpeed = gsap.quickTo(film, 'timeScale', { duration: 0.7, ease: 'power2.out' });
      const clamp = gsap.utils.clamp(-5, 5);
      let hovered = false;
      const settle = gsap.delayedCall(0.2, () => { if (!hovered) setSpeed(1); }).pause();
      ScrollTrigger.create({
        trigger: '.film', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => { if (hovered) return; setSpeed(clamp(1 + self.getVelocity() / 350)); settle.restart(true); },
      });
      const strip = root.current.querySelector('.film');
      strip.addEventListener('pointerenter', () => { hovered = true; if (!scrubbing) setSpeed(0.25); });
      strip.addEventListener('pointerleave', () => { hovered = false; if (!scrubbing) setSpeed(1); });

      // Manual control while paused: wheel over the strip, drag it, or use the ← → buttons.
      // The loop's position is the tween's progress, so we just nudge that (wrapping 0→1).
      const wrap = gsap.utils.wrap(0, 1);
      const half = () => root.current.querySelector('.film-track').scrollWidth / 2;
      const nudge = (px) => film.progress(wrap(film.progress() + px / half()));
      // Horizontal wheel/trackpad swipe (or shift+wheel) moves the strip; a plain vertical
      // wheel still scrolls the page, so hovering the strip never traps you.
      strip.addEventListener('wheel', (e) => {
        const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!horizontal && !e.shiftKey) return;
        e.preventDefault();
        nudge(horizontal ? e.deltaX : e.deltaY);
      }, { passive: false });
      let drag = null;
      let moved = false;
      strip.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { drag = e.clientX; moved = false; e.preventDefault(); } });
      window.addEventListener('pointermove', (e) => { if (drag !== null) { if (Math.abs(e.clientX - drag) > 3) moved = true; nudge(drag - e.clientX); drag = e.clientX; } });
      window.addEventListener('pointerup', () => { drag = null; });
      // A drag must not open the LinkedIn link underneath.
      strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
      // Slider: scrub the strip by hand; it follows the auto-glide the rest of the time.
      const slider = root.current.querySelector('.film-slider');
      let scrubbing = false;
      const sync = () => { if (!scrubbing) slider.value = Math.round(film.progress() * 1000); };
      gsap.ticker.add(sync);
      slider.addEventListener('pointerdown', () => { scrubbing = true; setSpeed(0); });
      slider.addEventListener('input', () => film.progress(slider.value / 1000));
      const release = () => { if (!scrubbing) return; scrubbing = false; setSpeed(hovered ? 0.25 : 1); };
      slider.addEventListener('pointerup', release);
      slider.addEventListener('pointercancel', release);
      slider.addEventListener('keydown', (e) => { if (e.key.startsWith('Arrow')) { scrubbing = true; setSpeed(0); setTimeout(release, 800); } });

      // Sticker pile: pop in, then idle float so it never looks parked.
      const avatars = gsap.utils.toArray('.avatar', pile.current);
      gsap.from(avatars, {
        scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.05, from: 'random' },
        scrollTrigger: { trigger: pile.current, start: 'top 75%', once: true },
      });
      avatars.forEach((a, i) => gsap.to(a.querySelector('.avatar-img'), { y: i % 2 ? 7 : -7, duration: 2.2 + (i % 4) * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.15 }));
    },
    { scope: root }
  );

  return (
    <section id="contributors" ref={root} className="cell relative bg-bg-surface paper-ruled">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-20 md:pt-28">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel path="CONTRIBUTORS.md" />
            <h2 className="mt-4 text-[clamp(2.6rem,6vw,6rem)]">the people.</h2>
          </div>
          <Hand className="text-2xl text-pencil" rotate={-2}>{FACULTY.length} faculty · {TEAM.length} core team members</Hand>
        </div>

        <div className="reveal mt-10 flex flex-wrap items-center justify-between gap-3" style={{ '--reveal-i': 1 }}>
          <div className="flex items-center gap-3">
            <Stamp rotate={-4} color="var(--pen)">faculty</Stamp>
            <p className="font-mono text-xs text-pencil">auto-slides · hover to slow down · drag the slider to browse · click for LinkedIn</p>
          </div>
          <label className="flex items-center gap-3 font-mono text-[0.65rem] tracking-widest uppercase text-pencil">
            slide
            <input type="range" min="0" max="1000" defaultValue="0" className="film-slider w-44 md:w-64" aria-label="Scrub the faculty strip" />
          </label>
        </div>
      </div>

      {/* faculty film strip (full-bleed) */}
      <div className="film reveal relative mt-5 bg-[#111] py-3 overflow-hidden" style={{ '--reveal-i': 2 }}>
        <div className="sprockets h-4 mb-3" aria-hidden="true" />
        <ul className="film-track flex w-max gap-4 px-4 [&>li]:group cursor-grab active:cursor-grabbing select-none">
          {[...FACULTY, ...FACULTY].map((f, i) => <Frame key={`${f.name}-${i}`} f={f} i={i % FACULTY.length} />)}
        </ul>
        <div className="sprockets h-4 mt-4" aria-hidden="true" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-16 pb-24">
        {/* contributors = core team, a pile of stickers you can push around */}
        <div className="reveal" style={{ '--reveal-i': 3 }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Stamp rotate={-4}>core team</Stamp>
              <p className="font-mono text-xs text-pencil">{TEAM.length} members · drag them · click for LinkedIn</p>
            </div>
            <StickerButton to="/team" bg="var(--highlight)" rotate={1.5}>meet the whole team →</StickerButton>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
            {TEAM_DEPARTMENTS.map((d) => (
              <li key={d.key} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-border" style={{ background: DEPT_TONE[d.key] }} />{d.label}</li>
            ))}
            <li className="flex items-center gap-2"><span className="text-marker text-xl leading-none">★</span>heads</li>
          </ul>
          <div ref={pile} className="relative mt-5 h-[520px] sm:h-[600px] border-2 border-dashed border-ink/30 overflow-hidden dotgrid">
            <Hand className="absolute right-5 bottom-4 text-xl text-secondary hidden lg:block" rotate={-3}>grab one. throw it. no rules ↗</Hand>
            {TEAM.map((m, i) => {
              const s = scatter(i);
              const tone = DEPT_TONE[m.dept];
              return (
                <a
                  key={`${m.dept}-${m.name}`}
                  href={m.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${m.name} on LinkedIn`}
                  className="avatar absolute flex flex-col items-center cursor-grab active:cursor-grabbing"
                  style={{ left: s.left, top: s.top }}
                  data-r={s.r}
                  data-linkedin={m.linkedin}
                  onClick={(e) => {
                    // Desktop GSAP drag handles the open on tap-without-drag.
                    if (window.matchMedia('(pointer: fine)').matches) e.preventDefault();
                  }}
                >
                  <div className="avatar-img relative">
                    <img src={m.img} alt={m.name} loading="lazy" decoding="async" draggable={false} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover object-top border-[3px] border-ink shadow-[4px_4px_0_var(--ink)]" style={{ background: tone }} />
                    {isLead(m) && <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full border-2 border-ink bg-marker text-paper text-sm flex items-center justify-center" title={m.role}>★</span>}
                  </div>
                  <figcaption className="mt-2 text-center">
                    <span className="block font-mono text-[0.68rem] px-2.5 py-1 border-2 border-ink whitespace-nowrap font-bold" style={{ background: tone }}>{m.name.split(' ')[0]}</span>
                    <span className="block mt-1 font-hand text-base leading-none text-pencil">{m.role}</span>
                  </figcaption>
                </a>
              );
            })}
          </div>
          <Tape rotate={-2} tone="blue" className="mt-5">this could be you — next semester's commit</Tape>
        </div>
      </div>
      <Perforation color="var(--paper)" />
    </section>
  );
};
