import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import { useReveal } from '../hooks/useReveal';
import { useDraggable } from '../components/home/useDraggable';
import { SectionLabel, Hand, PostIt, Stamp, Sticker, StickerButton, Perforation, WHATSAPP } from '../components/home/scrap';

// Terminal lines that type themselves in.
const LINES = [
  ['$ ls research/', 'cmd'],
  ['.gitkeep', ''],
  ['$ git log --oneline research/', 'cmd'],
  ['fatal: your current branch has no commits here yet', 'dim'],
  ['$ echo "soon."', 'cmd'],
];

// Draft page: pencil lines that write themselves (no words — nothing to claim yet).
const DRAFT_LINES = [220, 300, 260, 180, 290, 240, 120];

export const ResearchPage = () => {
  const root = useRef(null);
  useReveal(root);
  useDraggable(root, '.rs-sticker');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const lines = gsap.utils.toArray('.term-line', root.current);
      const tl = gsap.timeline({ delay: 0.3 });
      lines.forEach((el, i) => tl.to(el, { duration: 0.32, scrambleText: { text: LINES[i][0], chars: '01<>/█▒', speed: 0.6 } }, i * 0.35));
      tl.from('.draft-line', { drawSVG: '0%', duration: 0.5, stagger: 0.18, ease: 'power1.inOut' }, 0.6)
        .to('.pencil', { x: 230, duration: 3.2, ease: 'none' }, 0.6)
        .from('.draft-stamp', { scale: 2.4, opacity: 0, rotation: -20, duration: 0.5, ease: 'back.out(1.6)' }, '-=0.6');
      gsap.to('.pencil', { y: 2, duration: 0.18, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    },
    { scope: root }
  );

  return (
    <main ref={root} className="nb min-h-screen bg-bg-surface dotgrid overflow-hidden">
      <div className="relative z-[2] max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-28 md:pt-36 pb-24">
        <div className="reveal">
          <SectionLabel path="research/" />
          <h2 className="mt-4 text-[clamp(3rem,9vw,9rem)] leading-[0.9]">coming<br />soon.</h2>
          <p className="mt-6 max-w-xl text-lg text-pencil">
            We are currently building something extraordinary. Our research publications and technical
            whitepapers will be available here shortly.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-10 items-start">
          {/* terminal */}
          <div className="reveal screen grain grain--light border-2 border-border shadow-[8px_8px_0_var(--border)] font-mono text-sm md:text-base" style={{ '--reveal-i': 1 }}>
            <div className="relative z-[2] flex items-center gap-2 px-4 py-2.5 border-b border-border/10 bg-[#141414]">
              <i className="w-3 h-3 rounded-full bg-redpen" /><i className="w-3 h-3 rounded-full bg-highlight" /><i className="w-3 h-3 rounded-full bg-mint" />
              <span className="ml-3 text-xs text-[#d7f5e3]/60">zsh — aivolutions/research</span>
            </div>
            <div className="relative z-[2] p-5 md:p-6 leading-8 min-h-[14rem]">
              {LINES.map(([, kind], i) => (
                <p key={i} className={`term-line min-h-[2rem] ${kind === 'cmd' ? 'text-mint' : kind === 'dim' ? 'text-fg-secondary/55' : 'text-fg-secondary}'}` />
              ))}
              <p className="caret text-mint" />
            </div>
          </div>

          {/* the draft being written */}
          <div className="reveal relative" style={{ '--reveal-i': 2 }}>
            <div className="paper-ruled border-2 border-border shadow-[8px_8px_0_var(--border)] p-8 pl-16 pt-10 relative" style={{ transform: 'rotate(-1.2deg)' }}>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-pencil mb-4">research/draft-01.md</p>
              <svg viewBox="0 0 320 232" className="w-full max-w-[320px]" fill="none" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                {DRAFT_LINES.map((w, i) => (
                  <path key={i} className="draft-line" d={`M4 ${16 + i * 32} h ${w}`} stroke="var(--pencil)" strokeOpacity="0.55" />
                ))}
                <g className="pencil" transform="translate(0 196)">
                  <path d="M0 10 l 28 -24 l 8 8 l -28 24 z" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2" />
                  <path d="M0 10 l 4 4 l 4 -8 z" fill="var(--ink)" />
                </g>
              </svg>
              <Stamp rotate={-10} color="var(--redpen)" className="draft-stamp absolute top-6 right-6">draft · WIP</Stamp>
            </div>
            <PostIt rotate={4} tone="blue" className="absolute -bottom-6 -right-2 md:right-6 text-lg">no publications filed yet —<br />watch this folder.</PostIt>
          </div>
        </div>

        <div className="reveal mt-20 flex flex-wrap items-center gap-5" style={{ '--reveal-i': 3 }}>
          <StickerButton href={WHATSAPP} target="_blank" rel="noreferrer" bg="var(--highlight)" rotate={-1.5}>watch this repo →</StickerButton>
          <Link to="/events?e=CMP_002" className="squiggle font-bricolage font-extrabold text-lg">meanwhile, the events →</Link>
          <Hand className="text-xl text-pencil ml-auto" rotate={-2}>dept. of CSE-AI · MAIT</Hand>
        </div>
      </div>

      <Sticker className="rs-sticker absolute z-[3] top-[18%] right-[8%] hidden lg:inline-flex" bg="#ff8fb1" data-r={-7}>under construction</Sticker>
      <Sticker className="rs-sticker absolute z-[3] bottom-[14%] left-[5%] hidden lg:inline-flex" bg="#141414" fg="#f3eee2" data-r={5}>TODO: science</Sticker>
      <Perforation color="var(--cream)" />
    </main>
  );
};
