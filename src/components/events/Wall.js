import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { useDraggable } from '../home/useDraggable';
import { Hand, Tape } from '../home/scrap';

const TAPES = ['', 'blue', 'pink'];
const TILT = [-2.5, 2, -1.5, 2.5, -2, 1.5];

// All of the event's photos as big prints taped to a cork board, two across,
// staggered. Desktop: drag them around; click any to open the lightbox.
export const Wall = ({ event, images, onOpen }) => {
  const root = useRef(null);
  const single = images.length === 1;
  useDraggable(root, '.print', { deps: [event.id] });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray('.print', root.current).forEach((p, i) => {
        gsap.from(p, {
          y: 80, rotation: i % 2 ? 10 : -10, opacity: 0, duration: 0.9, ease: 'back.out(1.3)',
          scrollTrigger: { trigger: p, start: 'top 88%', once: true },
        });
      });
    },
    { scope: root, revertOnUpdate: true, dependencies: [event.id] }
  );

  return (
    <div ref={root} className="wall relative cork border-[3px] border-border shadow-[10px_10px_0_var(--border)] p-5 sm:p-8 md:p-12 overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
      <Hand className="absolute right-6 top-3 text-xl text-fg-secondary/70 hidden lg:block" rotate={-3}>drag the prints · click to open</Hand>
      <ul className={`grid gap-8 md:gap-12 ${single ? 'max-w-3xl mx-auto' : 'md:grid-cols-2'}`}>
        {images.map((src, i) => {
          const isPoster = /poster/i.test(src);
          return (
            <li key={src} className={`print relative ${i % 2 ? 'md:mt-20' : ''} ${isPoster && !single ? 'md:col-span-2 md:max-w-3xl md:mx-auto md:w-full' : ''}`}>
              <Tape rotate={i % 2 ? 3 : -3} tone={TAPES[i % 3]} stripe className="absolute -top-4 left-1/2 -translate-x-1/2 z-[2] !px-10 !py-2" />
              <button
                type="button"
                onClick={() => onOpen(i)}
                className="polaroid block w-full text-left !p-4 !pb-5 transition-transform duration-300 hover:scale-[1.02] hover:!rotate-0"
                style={{ '--r': `${TILT[i % TILT.length]}deg` }}
                aria-label={`Open photo ${i + 1}`}
              >
                <img src={src} alt={`${event.title} ${i + 1}`} loading="lazy" decoding="async" className={isPoster ? '!aspect-[1.41/1] !object-contain bg-bg-surface' : '!aspect-[4/3]'} />
                <figcaption className="polaroid__caption flex items-end justify-between gap-4 !mt-4 !text-2xl">
                  <span>{isPoster ? 'the poster' : i === 0 ? event.title : `frame ${String(i + 1).padStart(2, '0')}`}</span>
                  <span className="font-mono text-[0.65rem] text-secondary tracking-widest shrink-0">{event.date} · {String(i + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}</span>
                </figcaption>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
