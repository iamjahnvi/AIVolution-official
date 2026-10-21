import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { useReveal } from '../../hooks/useReveal';
import { SPONSORS } from '../../data/sponsors';
import { useActiveCell } from './useActiveCell';
import { SectionLabel, Hand, StickerButton, WHATSAPP } from './scrap';

const Logo = ({ s, i }) => (
  <li className="shrink-0 flex items-center justify-center w-[200px] h-[96px] border-2 border-bg-surface bg-bg-surface px-6 shadow-[4px_4px_0_var(--border)] transition-transform duration-200 hover:-translate-y-1" style={{ transform: `rotate(${i % 2 ? 1 : -1}deg)` }}>
    <img src={s.logo} alt={s.name} loading="lazy" decoding="async" className="max-h-10 w-auto object-contain" />
  </li>
);

// Partners as a "Sponsor this repo" strip: a slow marquee that pauses on hover.
export const Sponsors = () => {
  const root = useRef(null);
  useReveal(root);
  useActiveCell(root);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tween = gsap.to('.logo-track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });
      const strip = root.current.querySelector('.logo-strip');
      strip.addEventListener('pointerenter', () => gsap.to(tween, { timeScale: 0, duration: 0.5 }));
      strip.addEventListener('pointerleave', () => gsap.to(tween, { timeScale: 1, duration: 0.5 }));
    },
    { scope: root }
  );

  return (
    <section id="sponsors" ref={root} className="cell relative bg-bg-surface">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-16 md:pt-20 pb-16">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel path="SPONSORS.md" />
            <h2 className="mt-3 text-[clamp(2rem,4.5vw,4rem)]">♥ sponsored by</h2>
            <p className="mt-2 text-secondary">The partners who've backed our events and platforms.</p>
          </div>
          <StickerButton href={WHATSAPP} target="_blank" rel="noreferrer" bg="var(--accent)" rotate={1.5}>partner with us →</StickerButton>
        </div>
      </div>
      <div className="logo-strip reveal border-y-2 border-border bg-bg-surface py-6 overflow-hidden" style={{ '--reveal-i': 1 }}>
        <ul className="logo-track nb-marquee !gap-8 !pr-8 px-4">
          {[...SPONSORS, ...SPONSORS].map((s, i) => <Logo key={`${s.name}-${i}`} s={s} i={i} />)}
        </ul>
      </div>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-5">
        <Hand className="text-xl text-secondary" rotate={-1}>hover to pause · {SPONSORS.map((s) => s.name.toLowerCase()).join(' · ')}</Hand>
      </div>
    </section>
  );
};
