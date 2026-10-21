import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/gsap';
import { InstagramIcon, LinkedInIcon } from '../icons';
import { INSTAGRAM, LINKEDIN } from './Join';
import { WHATSAPP } from './scrap';

// 2D take on a physics lanyard (px, seconds). The strap is a chain of light links joined by
// springs that only pull, so it can go slack, whip and stretch a little; the card is a rigid
// body with mass and inertia that the strap tugs at its slot (torque included). Dragging pins
// a damped spring to the exact point you grabbed, so the card swings from your hand.
const ROPE = 200;
const LINKS = 10;
const SEG = ROPE / LINKS;
const G = 1800;
const LINK_MASS = 0.015;
const LINK_K = 1300;
const LINK_DAMP = 0.6;
const LINK_AIR = 0.6;
const AXIAL_DAMP = 2.6;
const AIR = 0.3;
const ANG_DAMP = 0.9;
const GRIP = 90;
const GRIP_DAMP = 17;
const MAX_V = 1600;
const STEP = 1 / 600;

const SOCIALS = [
  { label: 'Instagram', href: INSTAGRAM, bg: '#ff8fb1', Icon: InstagramIcon },
  { label: 'LinkedIn', href: LINKEDIN, bg: '#9bd7ff', Icon: LinkedInIcon },
  { label: 'WhatsApp', href: WHATSAPP, bg: '#3ae88a' },
];

// The society's ID card, hanging on a lanyard from the footer's tear line. It drops in once
// the line is 30% up the screen; drag it anywhere and it swings back. Connect = orbiting socials.
export const IdCard = ({ className = '' }) => {
  const hang = useRef(null);
  const card = useRef(null);
  const strap = useRef(null);
  const stitch = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = card.current;
    const H = el.offsetHeight;
    const I = (el.offsetWidth ** 2 + H ** 2) / 12;
    // Card: centre position/velocity, angle (clockwise, like CSS) and spin. Links: the strap.
    const c = { x: 0, y: ROPE + H / 2, vx: 0, vy: 0, a: 0, w: 0 };
    const links = Array.from({ length: LINKS - 1 }, (_, i) => ({ x: 0, y: (i + 1) * SEG, vx: 0, vy: 0 }));
    let hooked = true;
    let drag = null;
    let awake = false;

    const rot = (x, y) => [x * Math.cos(c.a) - y * Math.sin(c.a), x * Math.sin(c.a) + y * Math.cos(c.a)];
    const slot = () => { const [rx, ry] = rot(0, -H / 2); return { x: c.x + rx, y: c.y + ry, rx, ry }; };
    const payOut = () => { hooked = true; links.forEach((l) => Object.assign(l, { x: 0, y: 0, vx: 0, vy: 0 })); };

    const render = () => {
      const p = slot();
      el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${c.a}rad)`;
      if (!hooked) { strap.current.setAttribute('d', ''); stitch.current.setAttribute('d', ''); return; }
      const [ex, ey] = rot(0, 10);
      const pts = [{ x: 0, y: 0 }, ...links, { x: p.x + ex, y: p.y + ey }];
      let d = 'M0 0';
      for (let i = 1; i < pts.length - 1; i++) d += ` Q ${pts[i].x} ${pts[i].y} ${(pts[i].x + pts[i + 1].x) / 2} ${(pts[i].y + pts[i + 1].y) / 2}`;
      d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
      strap.current.setAttribute('d', d);
      stitch.current.setAttribute('d', d);
    };

    if (prefersReducedMotion()) { render(); return undefined; }

    // Tension-only spring from a to b; returns the force on b (a gets the opposite).
    const pull = (a, b) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d <= SEG) return [0, 0];
      const ux = dx / d;
      const uy = dy / d;
      const f = LINK_K * (d - SEG) + LINK_DAMP * ((b.vx - a.vx) * ux + (b.vy - a.vy) * uy);
      return [-f * ux, -f * uy];
    };

    const step = (dt) => {
      const p = slot();
      // the slot's velocity = v + w × r
      const end = { x: p.x, y: p.y, vx: c.vx - c.w * p.ry, vy: c.vy + c.w * p.rx };
      let fx = 0;
      let fy = G;
      let tq = 0;
      const lf = links.map(() => [0, LINK_MASS * G]);
      if (hooked) {
        const chain = [{ x: 0, y: 0, vx: 0, vy: 0 }, ...links, end];
        for (let i = 1; i < chain.length; i++) {
          const [bx, by] = pull(chain[i - 1], chain[i]);
          if (i >= 2) { lf[i - 2][0] -= bx; lf[i - 2][1] -= by; }
          if (i < chain.length - 1) { lf[i - 1][0] += bx; lf[i - 1][1] += by; continue; }
          // Strap end on the card: force at the slot pushes and twists it. Damping along the
          // strap makes a drop or a tug bounce a few times, then settle.
          let tx = bx;
          let ty = by;
          if (bx || by) {
            const prev = chain[i - 1];
            const ul = Math.hypot(p.x - prev.x, p.y - prev.y) || 1;
            const ux = (p.x - prev.x) / ul;
            const uy = (p.y - prev.y) / ul;
            const along = end.vx * ux + end.vy * uy;
            tx -= AXIAL_DAMP * along * ux;
            ty -= AXIAL_DAMP * along * uy;
          }
          fx += tx;
          fy += ty;
          tq += p.rx * ty - p.ry * tx;
        }
      }
      if (drag) {
        const [rx, ry] = rot(drag.lx, drag.ly);
        const gx = GRIP * (drag.tx - (c.x + rx)) - GRIP_DAMP * (c.vx - c.w * ry);
        const gy = GRIP * (drag.ty - (c.y + ry)) - GRIP_DAMP * (c.vy + c.w * rx);
        fx += gx;
        fy += gy;
        tq += rx * gy - ry * gx;
      }
      c.vx += (fx - AIR * c.vx) * dt;
      c.vy += (fy - AIR * c.vy) * dt;
      const v = Math.hypot(c.vx, c.vy);
      if (v > MAX_V) { c.vx *= MAX_V / v; c.vy *= MAX_V / v; }
      c.w += (tq / I - ANG_DAMP * c.w) * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.a += c.w * dt;
      links.forEach((l, i) => {
        l.vx += (lf[i][0] / LINK_MASS - LINK_AIR * l.vx) * dt;
        l.vy += (lf[i][1] / LINK_MASS - LINK_AIR * l.vy) * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
      });
      // Falling in from above the line: the strap pays out from the clip once the slot passes it.
      if (!hooked && slot().y > 0) payOut();
    };

    // Fixed timestep: the same motion at any frame rate, no jitter from uneven frames.
    let acc = 0;
    const tick = (time, deltaMs) => {
      if (!awake) { acc = 0; return; }
      acc += Math.min(deltaMs / 1000, 0.05);
      while (acc >= STEP) { step(STEP); acc -= STEP; }
      render();
      // Sleep only once hanging straight and still (a swing's turning point is also "still").
      const still = Math.hypot(c.vx, c.vy) < 3 && Math.abs(c.w) < 0.01 && Math.abs(c.a) < 0.004 && Math.abs(c.x) < 0.5;
      if (!drag && hooked && still && links.every((l) => Math.abs(l.vx) + Math.abs(l.vy) < 4)) awake = false;
    };
    gsap.ticker.add(tick);

    // Before the drop it waits above the line (clipped), a little to the right, and swings in.
    Object.assign(c, { x: 60, y: -H / 2 - 40, vx: -50, vy: 0, a: 0.12, w: -0.15 });
    hooked = false;
    render();
    // Drops once the tear line is 30% up the screen (an observer stays right as pages change height).
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { awake = true; io.disconnect(); }
    }, { rootMargin: '0px 0px -30% 0px' });
    io.observe(hang.current);

    // Pointer coordinates are relative to the anchor: the top-centre of the hanger.
    const local = (e) => {
      const b = hang.current.getBoundingClientRect();
      return { x: e.clientX - (b.left + b.width / 2), y: e.clientY - b.top };
    };
    const down = (e) => {
      if (e.target.closest('a, button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = local(e);
      // grab point in the card's own frame, so the card hangs from where you hold it
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const cos = Math.cos(c.a);
      const sin = Math.sin(c.a);
      drag = { lx: dx * cos + dy * sin, ly: -dx * sin + dy * cos, tx: p.x, ty: p.y };
      if (!hooked) payOut();
      awake = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-grabbed');
    };
    const move = (e) => {
      if (!drag) return;
      const p = local(e);
      drag.tx = p.x;
      drag.ty = p.y;
    };
    const up = () => { drag = null; el.classList.remove('is-grabbed'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, []);

  // Open orbit closes on Escape or a press anywhere off the card.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (!card.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <div ref={hang} className={`pointer-events-none ${className}`}>
      <svg className="absolute left-1/2 top-0 w-px h-px overflow-visible" aria-hidden="true">
        <path ref={strap} fill="none" stroke="var(--ink)" strokeWidth="14" strokeLinecap="round" />
        <path ref={stitch} fill="none" stroke="var(--paper)" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="5 5" />
      </svg>
      {/* the clip the lanyard hangs from, on the tear line */}
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-9 h-4 rounded-sm bg-[#555] border-2 border-border z-[1]" aria-hidden="true" />

      <div
        ref={card}
        className="idc absolute left-1/2 top-0 -ml-[125px] w-[250px] pointer-events-auto cursor-grab select-none"
        style={{ transformOrigin: '50% 0', touchAction: 'none' }}
      >
        {/* metal ring through the slot */}
        <span className="absolute left-1/2 -top-3 -translate-x-1/2 w-6 h-8 rounded-full border-[3px] border-[#9a9a9a] z-[2]" aria-hidden="true" />
        <div className="relative border-[3px] border-border bg-bg-surface text-fg-primary rounded-2xl shadow-[8px_8px_0_var(--border)] px-5 pt-4 pb-5">
          <div className="mx-auto w-14 h-3 rounded-full bg-bg-surface border-2 border-border" aria-hidden="true" />
          <div className="mt-3 flex items-center justify-between font-mono text-[0.58rem] tracking-[0.2em] uppercase text-fg-secondary/55">
            <span>member pass</span>
            <span className="text-[#9bd7ff]">⎇ main</span>
          </div>
          <div className="mt-3 h-[150px] overflow-hidden rounded-lg border border-border/10 bg-bg-surface flex items-center justify-center">
            <img src="/main-logo-no-bg.png" alt="AIvolutions logo" width="1280" height="1061" loading="lazy" decoding="async" draggable={false} className="w-full h-full object-contain scale-[1.55]" />
          </div>
          <p className="mt-4 font-bricolage font-extrabold text-[2rem] leading-none tracking-[-0.03em]">AIvolutions</p>
          <p className="mt-1.5 font-mono text-[0.62rem] tracking-[0.14em] uppercase text-fg-secondary/60">official AI society · MAIT</p>
          <div className="mt-4 h-5 bg-[repeating-linear-gradient(90deg,bg-bg-surface_0_2px,transparent_2px_5px,bg-bg-surface_5px_6px,transparent_6px_9px)] opacity-50" aria-hidden="true" />

          <div className="relative mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="btn-sticker !py-2.5 !px-5 text-base relative z-[2]"
              style={{ '--bg': open ? '#fff' : 'var(--highlight)' }}
            >
              {open ? 'close ✕' : 'connect ✦'}
            </button>
            {/* three socials orbiting the button; hovering one pauses the orbit */}
            <div className={`idc-orbit ${open ? 'is-open' : ''}`} aria-hidden={!open}>
              <ul className="idc-spin">
                {SOCIALS.map(({ label, href, bg, Icon }, i) => (
                  <li key={label} style={{ '--a': `${i * 120 - 90}deg`, '--i': i }}>
                    <span className="idc-counter">
                      <span className="idc-pop">
                        <a href={href} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1} className="btn-sticker !py-2 !px-3.5 !text-sm whitespace-nowrap" style={{ '--bg': bg }}>
                          {Icon && <Icon className="w-4 h-4" />}{label}
                        </a>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
