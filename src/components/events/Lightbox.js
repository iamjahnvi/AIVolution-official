import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

// Full-screen photo viewer: Esc closes, ←/→ navigate, click outside closes.
export const Lightbox = ({ images, index, title, onClose, onIndex }) => {
  const root = useRef(null);
  const n = images.length;
  const go = (d) => onIndex((index + d + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.lb-img', { scale: 0.92, opacity: 0, duration: 0.35, ease: 'power3.out' });
    },
    { scope: root, revertOnUpdate: true, dependencies: [index] }
  );

  return createPortal(
    <div ref={root} className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" style={{ background: 'rgba(13,13,13,0.93)' }} onClick={onClose} role="dialog" aria-modal="true" aria-label={`${title} photos`}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 btn-sticker !py-2 !px-4 text-sm" style={{ '--bg': '#fff' }} aria-label="Close">esc ✕</button>
      {n > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 btn-sticker !py-2 !px-4" style={{ '--bg': '#ffe85c' }} aria-label="Previous">←</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 btn-sticker !py-2 !px-4" style={{ '--bg': '#ffe85c' }} aria-label="Next">→</button>
        </>
      )}
      <figure className="lb-img max-w-full" onClick={(e) => e.stopPropagation()}>
        <div className="polaroid !p-3 !pb-3 bg-bg-surface" style={{ '--r': '0deg' }}>
          <img key={index} src={images[index]} alt={`${title} ${index + 1}`} className="!aspect-auto max-h-[78vh] max-w-[92vw] w-auto h-auto object-contain" />
          <figcaption className="flex items-center justify-between mt-3 font-mono text-xs text-fg-primary">
            <span className="font-hand text-xl">{title}</span>
            <span>{String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
          </figcaption>
        </div>
      </figure>
    </div>,
    document.body
  );
};
