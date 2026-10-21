import React, { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { DEPT_TONE, isLead, isOfficeBearer } from '../../data/team';
import { Hand } from '../home/scrap';

const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('');

// A collectible card. Desktop: 3D tilt follows the cursor, a holographic sheen and glare
// sweep across, the photo shifts with depth. Click to flip; the back is the "stats" side.
export const MemberCard = ({ m, big = false }) => {
  const root = useRef(null);
  const flipped = useRef(false);
  const tone = DEPT_TONE[m.dept] || '#fff';
  const foil = isOfficeBearer(m);

  // Plain effect (not useGSAP) so the DOM listeners are really removed on unmount.
  useEffect(() => {
      const el = root.current;
      const fine = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion();
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.45, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.45, ease: 'power3.out' });
      const img = el.querySelector('.tcard-img');
      const ix = gsap.quickTo(img, 'x', { duration: 0.5, ease: 'power3.out' });
      const iy = gsap.quickTo(img, 'y', { duration: 0.5, ease: 'power3.out' });
      const base = () => (flipped.current ? 180 : 0);

      const move = (e) => {
        if (!fine) return;
        const b = el.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width;
        const py = (e.clientY - b.top) / b.height;
        rx((0.5 - py) * 16);
        ry((px - 0.5) * 16 + base());
        ix((0.5 - px) * 14);
        iy((0.5 - py) * 14);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      };
      const leave = () => { rx(0); ry(base()); ix(0); iy(0); };
      const flip = () => {
        flipped.current = !flipped.current;
        el.classList.toggle('is-flipped', flipped.current);
        gsap.to(el, { rotationY: base(), rotationX: 0, duration: 0.7, ease: 'back.out(1.4)', overwrite: 'auto' });
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      el.addEventListener('click', flip);
      return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); el.removeEventListener('click', flip); gsap.killTweensOf([el, img]); };
  }, []);

  return (
    <div className="card-wrap" style={{ perspective: '1000px' }}>
      <div
        ref={root}
        role="button"
        tabIndex={0}
        aria-label={`${m.name}, ${m.role}. Click to flip`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); root.current.click(); } }}
        className={`tcard relative cursor-pointer ${big ? 'aspect-[4/5]' : 'aspect-[3/4]'} ${foil ? 'tcard--foil' : ''}`}
        style={{ '--tone': tone, transformStyle: 'preserve-3d' }}
      >
        {/* front */}
        <div className="tcard-face absolute inset-0 overflow-hidden border-[3px] border-border bg-bg-surface shadow-[6px_6px_0_var(--border)]">
          <div className="h-3 border-b-[3px] border-border" style={{ background: tone }} />
          <div className="relative h-[calc(100%-0.75rem)] overflow-hidden">
            <img src={m.img} alt={m.name} loading="lazy" decoding="async" className="tcard-img w-full h-full object-cover object-top scale-[1.12]" />
            <div className="holo absolute inset-0 pointer-events-none" aria-hidden="true" />
            <div className="glare absolute inset-0 pointer-events-none" aria-hidden="true" />
            <span className="absolute top-2 left-2 font-mono text-[0.6rem] font-bold px-1.5 py-0.5 border-2 border-border text-secondary" style={{ background: tone }}>{m.deptLabel}</span>
            {isLead(m) && <span className="absolute top-2 right-2 w-7 h-7 rounded-full border-2 border-border bg-bg-surface text-fg-primary text-sm flex items-center justify-center">★</span>}
            {/* frosted nameplate */}
            <div className="nameplate absolute inset-x-0 bottom-0 px-4 py-3 border-t-2 border-ink/60">
              <Hand className={`block leading-none text-fg-primary ${big ? 'text-3xl' : 'text-2xl'}`}>{m.name}</Hand>
              <p className="font-mono text-[0.66rem] tracking-[0.16em] uppercase text-ink/80 mt-1">{m.role}</p>
            </div>
          </div>
        </div>

        {/* back */}
        <div className="tcard-face tcard-back absolute inset-0 overflow-hidden border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] flex flex-col justify-between p-5" style={{ background: tone }}>
          <div className="flex items-start justify-between">
            <span className="font-mono text-[0.62rem] font-bold tracking-widest uppercase border-2 border-border bg-bg-surface px-2 py-0.5">{m.deptLabel}</span>
            {isLead(m) && <span className="text-marker text-xl">★</span>}
          </div>
          <span className="font-bricolage font-extrabold leading-none text-[clamp(4rem,9vw,7rem)] text-ink/90 select-none" aria-hidden="true">{initials(m.name)}</span>
          <div>
            <Hand className="block text-3xl leading-none text-fg-primary">{m.name}</Hand>
            <p className="font-bricolage font-extrabold text-lg mt-1">{m.role}</p>
            <p className="font-mono text-[0.62rem] text-fg-secondary/70 mt-2">⎇ departments/{m.dept}/</p>
            <p className="font-mono text-[0.58rem] text-fg-secondary/50 mt-3">click to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
};
