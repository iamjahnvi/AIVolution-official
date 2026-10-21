import React, { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap';
import { useReveal } from '../../hooks/useReveal';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { ABOUT_TAGLINE, ABOUT_TEXT, DIRECTIVES } from '../../data/about';
import { EVENTS } from '../../data/events';
import { DEPARTMENTS } from '../../data/departments';
import { TEAM } from '../../data/team';
import { FACULTY } from '../../data/faculty';
import { useActiveCell } from './useActiveCell';
import { SectionLabel, Hand, Stamp, Tape, Perforation } from './scrap';

const TAGLINE = ABOUT_TAGLINE.replace('// ', '').toLowerCase();

// Highlighted phrases in ABOUT_TEXT, each annotated with the real events behind it.
const PHRASES = [
  { text: 'hands-on learning', color: '#ffe85c', note: 'Metaverse game-dev workshop · DUCAT hands-on session' },
  { text: 'industry collaboration', color: '#9bd7ff', note: 'STMicroelectronics keynote · DUCAT · Neighborly' },
  { text: 'competitive challenges', color: '#ff8fb1', note: "Codex Hackathon '25 · Coding Triathlon · Algosphere" },
  { text: 'experiential projects', color: '#3ae88a', note: 'robotics / AI integration projects' },
  { text: 'AI users to AI creators', color: '#ffb86b', note: 'the whole point' },
];
const splitter = new RegExp(`(${PHRASES.map((p) => p.text).join('|')})`, 'g');

// Tokenise into words (tagged with their phrase), then wrap into editor lines of ~44 chars.
const TOKENS = ABOUT_TEXT.split(splitter).flatMap((part) => {
  const p = PHRASES.findIndex((x) => x.text === part);
  return part.split(/\s+/).filter(Boolean).map((w, i) => ({ w, p, first: p !== -1 && i === 0 }));
});
const LINES = TOKENS.reduce((acc, t) => {
  const cur = acc[acc.length - 1];
  const len = cur.reduce((n, x) => n + x.w.length + 1, 0);
  if (len + t.w.length > 44 && cur.length) acc.push([t]);
  else cur.push(t);
  return acc;
}, [[]]);
const RAW = `# ${TAGLINE}\n\n${ABOUT_TEXT.replace(splitter, '**$1**')}`;
const TABS = [['README.md', '#about'], ['departments/', '#departments'], ['events/', '#events'], ['CONTRIBUTORS.md', '#contributors']];

// README badges, all from data.
const BADGES = [
  ['events', EVENTS.length, '#ff5a1f'],
  ['departments', DEPARTMENTS.length, '#2f6bff'],
  ['core team', TEAM.length, '#3ae88a'],
  ['faculty', FACULTY.length, '#ff8fb1'],
  ['dept', 'CSE-AI', '#ffe85c'],
  ['branch', '⎇ main', '#9bd7ff'],
];

// One folder per directive.
const FOLDERS = [
  { tone: '#ffe85c', accent: 'var(--marker)', note: 'the why', label: 'the toolbox · what we’ve taught so far' },
  { tone: '#9bd7ff', accent: 'var(--pen)', note: 'the where', label: 'the path · how members grow' },
  { tone: '#3ae88a', accent: 'var(--redpen)', note: 'the how', label: 'the checklist · how we work' },
];
const CYCLE = 6;

// What each directive looks like in practice — every line traces to src/data/events.js.
const IN_PRACTICE = [
  'In practice: we get the newest AI tools into students’ hands, fast.',
  'In practice: a path from your first workshop to hackathon finalist to core team.',
  'In practice: three rules we hold ourselves to — with receipts.',
];
const MISSION_TOOLS = [
  ['Agentic AI', 'live tool-calling demo'],
  ['Computer vision', 'CNNs, object detection'],
  ['NLP', 'chatbots, sentiment analysis'],
  ['Game dev & VR', 'Metaverse workshop'],
  ['Git & GitHub', 'branching, PRs, conflicts'],
  ['Enterprise AI', 'AI-integrated ERP'],
];
const VISION_PATH = [
  ['join', 'Orientation — meet the core team, see the year’s roadmap'],
  ['learn', 'workshops, webinars, industrial visits'],
  ['build', 'hackathons — 60+ teams at Codex ’25, 12 finalists'],
  ['lead', 'join the core team and run it next year'],
];
const VALUE_RECEIPTS = [
  'Metaverse · Agentic AI · enterprise ERP sessions',
  'GitHub relay · bug bounty · live problem-solving at DUCAT',
  'Preparation Mantra by a senior member · mentoring at Codex',
];
const CHIP_TONES = ['#ffe85c', '#9bd7ff', '#ff8fb1', '#3ae88a', '#fff', '#ffb86b'];
const firstSentence = (s) => s.split(/(?<=\.)\s+/)[0];

const Panel = ({ i, body, accent }) => {
  if (i === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {MISSION_TOOLS.map(([name, detail], k) => (
          <div key={name} className="dir-pop border-2 border-ink bg-[var(--bg)] text-ink px-4 py-3 shadow-[4px_4px_0_var(--ink)]" style={{ '--bg': CHIP_TONES[k], transform: `rotate(${k % 2 ? 1.5 : -1.5}deg)` }}>
            <p className="font-bricolage font-extrabold text-lg md:text-xl leading-tight">{name}</p>
            <p className="font-mono text-[0.68rem] text-pencil mt-1">{detail}</p>
          </div>
        ))}
      </div>
    );
  }
  if (i === 1) {
    return (
      <ol className="relative">
        {VISION_PATH.map(([step, detail], k) => (
          <li key={step} className="dir-pop flex items-start gap-4 py-2.5" style={{ marginLeft: `${k * 1.5}rem` }}>
            <span className="shrink-0 w-10 h-10 rounded-full border-2 border-ink flex items-center justify-center font-mono text-xs font-bold" style={{ background: k === 3 ? accent : 'transparent', color: k === 3 ? '#fff' : 'inherit' }}>{k + 1}</span>
            <div className="border-b-2 border-dashed border-current/25 pb-2.5 flex-1">
              <p className="font-bricolage font-extrabold text-2xl md:text-3xl leading-none">{step} <span className="font-hand font-medium text-xl opacity-70">{k < 3 ? '↗' : '★'}</span></p>
              <p className="font-mono text-xs md:text-sm opacity-75 mt-1.5">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  const rules = body.split('. ').map((s) => s.replace(/\.$/, ''));
  return (
    <ul className="space-y-4">
      {rules.map((rule, k) => (
        <li key={rule} className="dir-pop flex items-start gap-4">
          <svg viewBox="0 0 40 40" className="draw w-10 h-10 shrink-0" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="34" height="34" rx="8" stroke="currentColor" />
            <path d="M11 21 L 18 28 L 30 13" stroke={accent} strokeWidth="5" />
          </svg>
          <div>
            <p className="font-bricolage font-extrabold text-xl md:text-2xl leading-tight">{rule}.</p>
            <Hand className="text-lg leading-tight mt-1" style={{ color: accent }}>{VALUE_RECEIPTS[k]}</Hand>
          </div>
        </li>
      ))}
    </ul>
  );
};

// The open folder's contents.
const FolderBody = ({ i }) => {
  const d = DIRECTIVES[i];
  const f = FOLDERS[i];
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-14 items-start">
      <div>
        <div className="dir-in flex flex-wrap items-center gap-3">
          <Stamp rotate={-6} color={f.accent}>{d.id}</Stamp>
          <Tape rotate={2} className="!text-[0.62rem]">README.md ## {d.title.toLowerCase()} · {f.note}</Tape>
        </div>
        <h3 className="dir-in mt-5 text-[clamp(2.4rem,5vw,4.6rem)] leading-[0.95]">{d.title.toLowerCase()}</h3>
        {i !== 2 && <p className="dir-in mt-4 text-base md:text-lg leading-relaxed opacity-85 max-w-xl">{d.body}</p>}
        <Hand className="dir-in block mt-4 text-2xl leading-tight" rotate={-1} color={f.accent}>{IN_PRACTICE[i]}</Hand>
      </div>
      <div className="dir-panel">
        <p className="dir-in font-mono text-[0.65rem] tracking-[0.2em] uppercase opacity-60 mb-4">{f.label}</p>
        <Panel i={i} body={d.body} accent={f.accent} />
      </div>
    </div>
  );
};

export const About = () => {
  const root = useRef(null);
  const folders = useRef(null);
  const lnRef = useRef(null);
  const colRef = useRef(null);
  const cycle = useRef(null);
  const [raw, setRaw] = useState(false);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const isMobile = useIsMobile();
  useReveal(root);
  useActiveCell(root);

  // The README "types itself" as you scroll: words ink in, a cursor and the
  // current-line highlight follow, the status bar reports Ln/Col; badges count up.
  useGSAP(
    () => {
      gsap.from('.badge-n', { innerText: 0, snap: 'innerText', duration: 1.2, ease: 'power2.out', stagger: 0.1, scrollTrigger: { trigger: '.badges', start: 'top 85%', once: true } });
      if (raw) return;
      const words = gsap.utils.toArray('.editor .w', root.current);
      const lines = gsap.utils.toArray('.editor .ln', root.current);
      const place = (i) => {
        words.forEach((w, j) => w.classList.toggle('is-cur', j === i));
        const line = words[i]?.closest('.ln');
        lines.forEach((l) => l.classList.toggle('is-cur', l === line));
        if (lnRef.current && line) {
          lnRef.current.textContent = line.dataset.n;
          colRef.current.textContent = words[i].dataset.col;
        }
      };
      if (prefersReducedMotion()) { place(words.length - 1); return; }
      gsap.from(words, {
        opacity: 0.08, stagger: 0.012, ease: 'none',
        scrollTrigger: { trigger: '.editor', start: 'top 75%', end: 'bottom 55%', scrub: 0.3, onUpdate: (self) => place(Math.min(words.length - 1, Math.floor(self.progress * words.length))) },
      });
      gsap.from('.editor .cmt', { x: 16, opacity: 0, stagger: 0.1, duration: 0.5, scrollTrigger: { trigger: '.editor', start: 'top 60%', once: true } });
    },
    { scope: root, revertOnUpdate: true, dependencies: [raw] }
  );

  // Folders: fan in on arrival; track whether the section is on screen (auto-cycle only then).
  useGSAP(
    () => {
      ScrollTrigger.create({ trigger: folders.current, start: 'top 80%', end: 'bottom 20%', onToggle: (self) => setInView(self.isActive) });
      if (prefersReducedMotion() || isMobile) return;
      gsap.from('.folder-tab', { y: 40, rotation: (i) => (i - 1) * 6, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.1, scrollTrigger: { trigger: folders.current, start: 'top 80%', once: true } });
      gsap.from('.folder-stack', { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2, scrollTrigger: { trigger: folders.current, start: 'top 80%', once: true } });
    },
    { scope: root, revertOnUpdate: true, dependencies: [isMobile] }
  );

  // Opening a folder: circle-wipe from its tab, contents stagger in, ticks draw.
  useGSAP(
    () => {
      if (isMobile) return;
      const origin = `${(active + 0.5) * (100 / 3)}% 0%`;
      const body = folders.current.querySelector('.folder-body');
      if (!prefersReducedMotion()) {
        gsap.fromTo(body, { clipPath: `circle(0% at ${origin})` }, { clipPath: `circle(150% at ${origin})`, duration: 0.8, ease: 'power2.inOut', clearProps: 'clipPath' });
        gsap.from('.folder-body .dir-in', { y: 24, opacity: 0, stagger: 0.07, duration: 0.45, delay: 0.25 });
        gsap.from('.folder-body .dir-pop', { scale: 0.6, opacity: 0, stagger: 0.06, duration: 0.45, ease: 'back.out(2)', delay: 0.35 });
        gsap.from('.folder-body .draw path, .folder-body .draw rect', { drawSVG: '0%', stagger: 0.05, duration: 0.5, ease: 'power2.inOut', delay: 0.45 });
      }
      // Auto-cycle: a ring fills on the active tab, then the next folder opens.
      if (!inView || prefersReducedMotion()) return;
      const ring = folders.current.querySelector('.folder-tab.is-active .ring-fill');
      const tl = gsap.timeline({ onComplete: () => setActive((a) => (a + 1) % DIRECTIVES.length) });
      if (ring) tl.fromTo(ring, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: CYCLE, ease: 'none' });
      else tl.to({}, { duration: CYCLE });
      cycle.current = tl;
    },
    { scope: root, revertOnUpdate: true, dependencies: [active, inView, isMobile] }
  );

  // Hovering the folders pauses the cycle (DOM listeners live in a plain effect).
  useEffect(() => {
    const el = folders.current;
    if (!el) return undefined;
    const pause = () => cycle.current && cycle.current.pause();
    const resume = () => cycle.current && cycle.current.resume();
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', resume);
    return () => { el.removeEventListener('pointerenter', pause); el.removeEventListener('pointerleave', resume); };
  }, []);

  let wordIndex = 0;
  return (
    <section id="about" ref={root} className="cell relative bg-bg-surface dotgrid">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-20 md:pt-28 pb-20 md:pb-28">
        <SectionLabel path="README.md" className="reveal" />

        {/* README as a code-editor window */}
        <div className="reveal relative mt-5 border-2 border-border bg-bg-elevated text-fg-primary shadow-[10px_10px_0_var(--border)] grain grain--light" style={{ '--reveal-i': 1 }}>
          {/* tab bar */}
<div className="relative z-[2] flex items-stretch justify-between border-b border-border/10 bg-bg-nav">
              <div className="flex items-stretch min-w-0 overflow-x-auto">
                <span className="flex items-center gap-1.5 px-4 shrink-0" aria-hidden="true">
                  <i className="w-3 h-3 rounded-full bg-redpen" /><i className="w-3 h-3 rounded-full bg-highlight" /><i className="w-3 h-3 rounded-full bg-mint" />
                </span>
                {TABS.map(([name, href], i) => (
                  <a key={name} href={href} className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs whitespace-nowrap border-r border-border/10 ${i === 0 ? 'bg-bg-elevated text-fg-primary border-t-2 border-t-accent' : 'text-fg-secondary/45 hover:text-fg-primary hover:bg-bg-surface/5'}`}>
                    <span className={i === 0 ? 'text-accent' : 'text-fg-secondary/30'}>{name.endsWith('/') ? '▸' : '●'}</span>{name}
                  </a>
                ))}
            </div>
            <div className="flex items-center gap-1 px-3 font-mono text-xs shrink-0" role="tablist" aria-label="README view">
              {['preview', 'raw'].map((m) => (
                <button key={m} type="button" role="tab" aria-selected={raw === (m === 'raw')} onClick={() => setRaw(m === 'raw')} className={`px-2.5 py-1 rounded ${raw === (m === 'raw') ? 'bg-mint text-ink' : 'text-[#eaf0ff]/60 hover:text-[#eaf0ff]'}`}>{m}</button>
              ))}
            </div>
          </div>

          {/* badges */}
<div className="badges relative z-[2] flex flex-wrap gap-2 px-6 md:px-10 pt-6">
              {BADGES.map(([label, value, color]) => (
                <span key={label} className="badge inline-flex items-stretch font-mono text-[0.68rem] font-bold border-2 border-border rounded overflow-hidden">
                  <span className="px-2 py-1 bg-border text-fg-primary/85">{label}</span>
                  <span className="px-2 py-1 text-fg-primary" style={{ background: color }}>{typeof value === 'number' ? <span className="badge-n">{value}</span> : value}</span>
                </span>
              ))}
            </div>

          {/* body */}
          <div className="relative z-[2] py-6 md:py-8">
            {raw ? (
              <pre className="font-mono text-sm md:text-base leading-relaxed whitespace-pre-wrap px-6 md:px-10">
                {RAW.split('\n').map((line, i) => (
                  <span key={i} className="block"><span className="inline-block w-10 text-[#eaf0ff]/30 select-none">{i + 1}</span>{line}</span>
                ))}
              </pre>
            ) : (
              <div className="editor">
                <div className="ln grid grid-cols-[3.5rem_1fr] md:grid-cols-[4rem_1fr_minmax(240px,0.5fr)] items-baseline pr-6">
                  <span className="ln-n font-mono text-xs text-[#eaf0ff]/30 text-right pr-4 select-none">1</span>
                  <Hand className="text-2xl md:text-3xl text-mint/80 py-1" rotate={-0.5}># {TAGLINE}</Hand>
                </div>
                <div className="ln grid grid-cols-[3.5rem_1fr] md:grid-cols-[4rem_1fr_minmax(240px,0.5fr)]">
                  <span className="ln-n font-mono text-xs text-[#eaf0ff]/30 text-right pr-4 select-none">2</span>
                </div>
                {LINES.map((line, li) => {
                  const firstPhrase = line.find((t) => t.first);
                  return (
                    <div key={li} data-n={li + 3} className="ln grid grid-cols-[3.5rem_1fr] md:grid-cols-[4rem_1fr_minmax(240px,0.5fr)] items-baseline pr-6">
                      <span className="ln-n font-mono text-xs text-[#eaf0ff]/30 text-right pr-4 select-none">{li + 3}</span>
                      <p className="font-bricolage font-extrabold text-[clamp(1.15rem,1.9vw,1.8rem)] leading-[1.4] tracking-[-0.01em] text-paper whitespace-nowrap">
                        {line.map((t, wi) => {
                          const col = line.slice(0, wi).reduce((n, x) => n + x.w.length + 1, 1);
                          const idx = wordIndex++;
                          return (
                            <React.Fragment key={idx}>
                              <span className={`w inline-block ${t.p !== -1 ? 'tok' : ''}`} data-col={col} style={t.p !== -1 ? { '--c': PHRASES[t.p].color } : undefined}>{t.w}</span>{' '}
                            </React.Fragment>
                          );
                        })}
                      </p>
                      {firstPhrase && (
                        <span className="cmt hidden md:flex items-baseline gap-2 font-mono text-sm pl-4">
                          <span className="text-[#eaf0ff]/30 shrink-0">{'//'}</span>
                          <Hand className="text-lg leading-tight" style={{ color: PHRASES[firstPhrase.p].color }}>{PHRASES[firstPhrase.p].note}</Hand>
                        </span>
                      )}
                    </div>
                  );
                })}
                <ul className="md:hidden mt-6 px-5 space-y-2 font-mono text-sm">
                  {PHRASES.slice(0, 4).map((p) => (
                    <li key={p.text} className="flex gap-2"><span className="text-[#eaf0ff]/30">{'//'}</span><Hand className="text-lg" style={{ color: p.color }}>{p.note}</Hand></li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* status bar */}
          <div className="relative z-[2] flex items-center justify-between gap-4 px-4 py-1.5 bg-[#141414] border-t border-white/10 font-mono text-[0.68rem] text-[#eaf0ff]/60">
            <div className="flex items-center gap-4"><span className="text-mint">⎇ main*</span><span className="hidden sm:inline">UTF-8</span><span className="hidden sm:inline">Markdown</span></div>
            <div className="flex items-center gap-4"><span>Ln <span ref={lnRef}>1</span>, Col <span ref={colRef}>1</span></span><span>{ABOUT_TEXT.split(' ').length} words</span><span className="text-mint">● no problems</span></div>
          </div>

          <Tape rotate={-3} tone="blue" className="absolute -top-4 right-28 hidden sm:inline-block z-[3]">last updated: this semester</Tape>
          <Stamp rotate={8} color="var(--mint)" className="absolute -bottom-5 right-8 hidden sm:inline-block z-[3] bg-screen">reviewed ✓</Stamp>
        </div>

        {/* mission / vision / values as a tabbed folder — all three tabs always in view */}
        <div ref={folders} className="folders relative mt-20 md:mt-24">
          <div className="reveal flex flex-wrap items-center gap-3 mb-5">
            <SectionLabel bare><span className="text-pen font-bold">README.md</span> ## mission · vision · values</SectionLabel>
            <Hand className="text-xl text-pencil" rotate={-2}>{isMobile ? 'three folders, all open' : 'click a tab — or wait, they take turns'}</Hand>
          </div>

          {isMobile ? (
            <div className="space-y-8">
              {DIRECTIVES.map((d, i) => (
                <article key={d.id} className="border-[3px] border-ink shadow-[6px_6px_0_var(--ink)] p-6 text-ink" style={{ background: FOLDERS[i].tone }}>
                  <FolderBody i={i} />
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 items-end" role="tablist" aria-label="Mission, vision, values">
                {DIRECTIVES.map((d, i) => {
                  const isActive = i === active;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActive(i)}
                      onPointerEnter={() => setActive(i)}
                      className={`folder-tab relative text-left border-[3px] border-b-0 border-border rounded-t-2xl px-5 pt-4 transition-[padding,background] duration-300 ${isActive ? 'is-active pb-6 text-fg-primary' : 'pb-3 bg-bg-surface text-fg-secondary/70 hover:bg-bg-elevated'}`}
                      style={{ background: isActive ? FOLDERS[i].tone : undefined, zIndex: isActive ? 3 : 1 }}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[0.62rem] tracking-[0.2em] uppercase opacity-70">{d.id}</span>
                        <svg viewBox="0 0 36 36" className="w-6 h-6 shrink-0" aria-hidden="true">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--ink)" strokeOpacity="0.2" strokeWidth="4" />
                          {isActive && <circle className="ring-fill" cx="18" cy="18" r="15" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset="100" transform="rotate(-90 18 18)" />}
                        </svg>
                      </span>
                      <span className="block font-bricolage font-extrabold text-2xl lg:text-3xl leading-none mt-1">{d.title.toLowerCase()}</span>
                      <span className={`block mt-2 text-sm leading-snug ${isActive ? 'opacity-90' : 'opacity-60'}`}>{firstSentence(d.body)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="folder-stack relative">
                <div className="absolute inset-x-4 -bottom-3 h-full border-[3px] border-border bg-bg-surface rotate-[0.6deg]" aria-hidden="true" />
                <div className="absolute inset-x-8 -bottom-6 h-full border-[3px] border-border bg-bg-elevated rotate-[-0.6deg]" aria-hidden="true" />
                <div key={active} className="folder-body relative border-[3px] border-border shadow-[10px_10px_0_var(--border)] p-8 lg:p-12 text-fg-primary min-h-[520px]" style={{ background: FOLDERS[active].tone }}>
                  <FolderBody i={active} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Perforation />
    </section>
  );
};
