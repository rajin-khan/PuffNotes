import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Cloud, Eye, FileDown, Focus, FolderLock, Github, PenLine, Sparkles } from 'lucide-react';
import { getStoredTheme, setStoredTheme, THEMES } from '../lib/themeManager';
import ThemeBackground from './ThemeBackground';

const themes = {
  [THEMES.WARM]: { name: 'Puff', sources: [{ src: '/puff.webm', type: 'video/webm' }, { src: '/puff.mp4', type: 'video/mp4' }] },
  [THEMES.GALAXY]: { name: 'Astralia', sources: [{ src: '/galaxy.webm', type: 'video/webm' }, { src: '/galaxy.mp4', type: 'video/mp4' }] },
  [THEMES.KOMOREBI]: { name: 'Komorebi', sources: [{ src: '/komorebi.webm', type: 'video/webm' }, { src: '/komorebi.mp4', type: 'video/mp4' }] },
};

const themeFallbacks = {
  [THEMES.WARM]: '#392116',
  [THEMES.GALAXY]: '#090f2b',
  [THEMES.KOMOREBI]: '#071c20',
};

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 },
  transition: { duration: 0.5, ease: [0.2, 0, 0, 1] },
};

function FeatureVideo({ src, caption }) {
  return (
    <figure className="overflow-hidden rounded-[1.25rem] bg-[#201813] p-2.5 text-[#fff8f0]">
      <video controls muted playsInline preload="metadata" className="aspect-video w-full rounded-[0.85rem] object-cover outline outline-1 outline-white/10">
        <source src={src} type="video/mp4" />
      </video>
      <figcaption className="px-2 pb-2 pt-3 font-mono text-sm leading-relaxed text-[#e6dbcf]">{caption}</figcaption>
    </figure>
  );
}

export default function MarketingLanding({ onOpenApp }) {
  const shouldReduceMotion = useReducedMotion();
  const videoRefs = useRef({});
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [visibleTheme, setVisibleTheme] = useState(() => getStoredTheme());
  const [readyThemes, setReadyThemes] = useState({});
  const [introComplete, setIntroComplete] = useState(() => {
    try {
      return sessionStorage.getItem('puffnotes_intro_seen') === 'true'
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (introComplete) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => {
      setIntroComplete(true);
      try {
        sessionStorage.setItem('puffnotes_intro_seen', 'true');
      } catch {
        // The intro can still finish when storage is unavailable.
      }
    }, 2200);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [introComplete]);

  useEffect(() => {
    if (readyThemes[theme]) setVisibleTheme(theme);
  }, [readyThemes, theme]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return;
      if (shouldReduceMotion || !introComplete || key !== visibleTheme) video.pause();
      else video.play().catch(() => {});
    });
  }, [introComplete, shouldReduceMotion, visibleTheme]);

  const markThemeReady = (key) => {
    setReadyThemes((ready) => (ready[key] ? ready : { ...ready, [key]: true }));
  };

  const chooseTheme = (nextTheme) => {
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  return (
    <>
      <AnimatePresence>
        {!introComplete && (
          <motion.div
            key="opening-title"
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            role="status"
            aria-label="Puffnotes is loading"
          >
            <ThemeBackground theme={theme} />
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.p
                className="font-serif text-6xl tracking-tight text-[#f5f5dc] sm:text-7xl"
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                puffnotes
              </motion.p>
              <motion.div
                className="mt-4 h-px w-32 origin-center bg-[#f5f5dc]/55"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    <motion.div
      className="min-h-[100dvh] overflow-x-hidden bg-[#f7efe5] text-[#34251c] antialiased"
      initial={shouldReduceMotion || introComplete ? false : { opacity: 0 }}
      animate={{ opacity: introComplete ? 1 : 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={!introComplete}
      inert={introComplete ? undefined : true}
    >
      <a href="#main-content" className="fixed start-4 top-4 z-[100] -translate-y-24 rounded-full bg-[#fff8f0] px-4 py-2 font-mono text-sm text-[#34251c] transition-transform focus:translate-y-0">Skip to content</a>

      <header className="absolute inset-x-0 top-0 z-30">
        <nav aria-label="Main navigation" className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 text-[#fff8f0] sm:px-8">
          <a href="/" className="font-serif text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">puffnotes</a>
          <div className="flex items-center gap-2 sm:gap-6">
            <a href="#how-it-works" className="hidden font-mono text-sm underline-offset-4 hover:underline sm:inline">How it works</a>
            <a href="https://github.com/rajin-khan/PuffNotes" target="_blank" rel="noopener noreferrer" className="hidden font-mono text-sm underline-offset-4 hover:underline sm:inline">GitHub</a>
            <button type="button" onClick={onOpenApp} className="min-h-11 rounded-full bg-[#fff8f0] px-5 font-mono text-sm font-semibold text-[#34251c] transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Open app</button>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative flex min-h-[100dvh] items-end overflow-hidden text-[#fff8f0]" style={{ backgroundColor: themeFallbacks[theme] }}>
          <div className="absolute inset-0" aria-hidden="true">
            {Object.entries(themes).map(([key, item]) => (
              <video
                key={key}
                ref={(node) => { videoRefs.current[key] = node; }}
                muted loop playsInline preload="auto" autoPlay={!shouldReduceMotion && introComplete && key === theme}
                onLoadedData={() => markThemeReady(key)}
                onCanPlay={() => markThemeReady(key)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${!shouldReduceMotion && readyThemes[key] && visibleTheme === key ? 'opacity-100' : 'opacity-0'}`}
              >
                {item.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />)}
              </video>
            ))}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,13,10,0.93)_0%,rgba(18,13,10,0.34)_64%,rgba(18,13,10,0.58)_100%)]" />

          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-32 sm:px-8 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.2, 0, 0, 1] }} className="max-w-3xl">
              <h1 className="text-balance font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[0.94] tracking-[-0.04em]">Write messily.<br />Keep it beautifully.</h1>
              <p className="mt-7 max-w-[55ch] text-pretty font-mono text-base leading-relaxed text-[#fff8f0]/85 sm:text-lg">A quiet Markdown notebook with AI cleanup, handwritten pages, Google Drive sync, and local files.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button type="button" onClick={onOpenApp} className="min-h-12 rounded-full bg-[#fff8f0] px-7 font-mono text-sm font-semibold text-[#34251c] transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Open Puffnotes</button>
                <a href="#how-it-works" className="min-h-12 rounded-full border border-white/45 px-7 py-3.5 font-mono text-sm text-white transition-[transform,background-color] duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">See how it works</a>
              </div>
            </motion.div>

            <div className="flex rounded-full border border-white/35 bg-black/30 p-1" aria-label="Landing atmosphere">
              {Object.entries(themes).map(([key, item]) => (
                <button key={key} type="button" onClick={() => chooseTheme(key)} aria-pressed={theme === key} className={`min-h-10 rounded-full px-3 font-mono text-xs transition-colors duration-150 focus-visible:outline focus-visible:outline-2 ${theme === key ? 'bg-[#fff8f0] text-[#34251c]' : 'text-white hover:bg-white/10'}`}>{item.name}</button>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-8 bg-[#251a14] px-5 py-24 text-[#fff8f0] sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8f0] px-3 py-2 font-mono text-xs font-semibold text-[#34251c]"><Sparkles size={15} strokeWidth={2} aria-hidden="true" /> AI cleanup</div>
                <h2 className="mt-7 max-w-[12ch] text-balance font-serif text-4xl leading-[1.02] tracking-tight sm:text-6xl">Rough notes in. Structured Markdown out.</h2>
              </div>
              <div className="max-w-2xl lg:justify-self-end">
                <p className="text-pretty font-mono text-base leading-relaxed text-[#e6dbcf] sm:text-lg">Drop in fragments, misspellings, or half a thought. Puffnotes uses AI to expand the useful parts, add missing context, and return an organized note you can edit.</p>
                <p className="mt-4 font-mono text-sm text-[#cbbcaf]">Review the result before it replaces anything. Bring your own free Groq key whenever the shared allowance runs out.</p>
              </div>
            </motion.div>

            <motion.div {...reveal} className="mt-14 grid gap-5 rounded-[1.75rem] bg-[#f7efe5] p-3 text-[#34251c] sm:p-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div className="px-5 py-7 sm:px-8 sm:py-10">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#846b5c]">One click, then your call</p>
                <ol className="mt-7 space-y-7">
                  <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="font-mono text-sm text-[#9a4038]">01</span><div><h3 className="font-serif text-2xl">Write the bad first draft</h3><p className="mt-2 font-mono text-sm leading-relaxed text-[#5f4b3f]">Lists, fragments, and shorthand are all fair game.</p></div></li>
                  <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="font-mono text-sm text-[#9a4038]">02</span><div><h3 className="font-serif text-2xl">Tap the wand</h3><p className="mt-2 font-mono text-sm leading-relaxed text-[#5f4b3f]">AI turns the raw material into clear Markdown.</p></div></li>
                  <li className="grid grid-cols-[2rem_1fr] gap-3"><span className="font-mono text-sm text-[#9a4038]">03</span><div><h3 className="font-serif text-2xl">Accept it or keep yours</h3><p className="mt-2 font-mono text-sm leading-relaxed text-[#5f4b3f]">You see the rewrite before the note changes.</p></div></li>
                </ol>
              </div>
              <FeatureVideo src="/videos/2.mp4" caption="AI cleanup turns a scattered draft into a full, editable note." />
            </motion.div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="max-w-3xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#846b5c]">The notebook</p>
              <h2 className="mt-5 text-balance font-serif text-4xl leading-[1.04] tracking-tight sm:text-6xl">Useful when you need it. Quiet when you don’t.</h2>
              <p className="mt-5 max-w-[65ch] text-pretty font-mono leading-relaxed text-[#5f4b3f]">Write in Markdown without a crowded toolbar. Preview, focus, and export are there when the note is ready for them.</p>
            </motion.div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <motion.article {...reveal} className="rounded-[1.5rem] bg-[#eadbcd] p-4 sm:p-5">
                <div className="flex items-start gap-4 px-2 pb-5 pt-2 sm:px-4 sm:pt-4"><Eye size={25} strokeWidth={1.5} aria-hidden="true" /><div><h3 className="font-serif text-3xl">Preview without leaving</h3><p className="mt-2 max-w-[48ch] font-mono text-sm leading-relaxed text-[#5f4b3f]">Switch between raw Markdown and the finished note in the same editor.</p></div></div>
                <FeatureVideo src="/videos/3.mp4" caption="The preview keeps headings, lists, links, and code readable." />
              </motion.article>

              <motion.article {...reveal} className="rounded-[1.5rem] bg-[#dce4d6] p-4 sm:p-5">
                <div className="flex items-start gap-4 px-2 pb-5 pt-2 sm:px-4 sm:pt-4"><FileDown size={25} strokeWidth={1.5} aria-hidden="true" /><div><h3 className="font-serif text-3xl">Send a proper PDF</h3><p className="mt-2 max-w-[48ch] font-mono text-sm leading-relaxed text-[#465240]">Export typed text and drawing pages together, with the active theme carried through.</p></div></div>
                <FeatureVideo src="/videos/4.mp4" caption="Export the whole note when it needs to leave Puffnotes." />
              </motion.article>
            </div>

            <motion.div {...reveal} className="mt-6 grid gap-8 rounded-[1.5rem] bg-[#34251c] p-7 text-[#fff8f0] sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <Focus size={32} strokeWidth={1.5} aria-hidden="true" />
              <div><h3 className="font-serif text-3xl">The buttons can leave.</h3><p className="mt-2 max-w-[62ch] font-mono text-sm leading-relaxed text-[#e6dbcf]">Focus mode tucks the controls away. Your note gets the room back.</p></div>
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-[#cbbcaf]">One tap to focus</div>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#dfe7d9] px-5 py-24 text-[#2e382b] sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div {...reveal} className="relative min-h-[28rem] overflow-hidden rounded-[1.5rem] bg-[#fbf9f3] p-6 shadow-[0_18px_50px_rgba(46,56,43,0.12)] outline outline-1 outline-black/10 sm:p-10">
              <div className="flex items-center justify-between font-mono text-xs text-[#667260]"><span>drawing pages</span><span>2 / 3</span></div>
              <svg viewBox="0 0 620 360" className="mt-7 w-full" role="img" aria-label="A handwritten diagram connecting a rough idea to a finished note">
                <path d="M72 82 C142 40 190 42 246 90 C290 128 334 126 384 82 C427 44 478 50 545 106" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <path d="M104 248 C152 166 229 159 284 220 C330 271 403 267 492 190" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <circle cx="72" cy="82" r="13" fill="#fbf9f3" stroke="currentColor" strokeWidth="4" /><circle cx="545" cy="106" r="13" fill="#fbf9f3" stroke="currentColor" strokeWidth="4" /><circle cx="104" cy="248" r="13" fill="#fbf9f3" stroke="currentColor" strokeWidth="4" /><circle cx="492" cy="190" r="13" fill="#fbf9f3" stroke="currentColor" strokeWidth="4" />
                <path d="M296 42 V318" fill="none" stroke="#9daf96" strokeWidth="2" strokeDasharray="7 9" />
              </svg>
              <div className="absolute bottom-5 start-6 rounded-full bg-[#2e382b] px-4 py-2 font-mono text-xs text-[#f7f2e8] sm:bottom-8 sm:start-10">pen, eraser, zoom, more pages</div>
            </motion.div>

            <motion.div {...reveal}>
              <PenLine size={34} strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-7 text-balance font-serif text-4xl leading-[1.04] tracking-tight sm:text-6xl">Some thoughts arrive as shapes.</h2>
              <p className="mt-5 max-w-[58ch] text-pretty font-mono leading-relaxed text-[#4d5b48]">Switch the same note to a full-width drawing canvas. Add pages, zoom in, move around, erase precisely, then return to typing whenever you want.</p>
              <p className="mt-4 max-w-[58ch] font-mono text-sm leading-relaxed text-[#5f6c59]">Preview and PDF export place the drawing pages after the typed page, so the note stays one note.</p>
            </motion.div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="max-w-2xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#846b5c]">Storage</p>
              <h2 className="mt-5 text-balance font-serif text-4xl leading-[1.04] tracking-tight sm:text-6xl">Your notes. Your call.</h2>
              <p className="mt-5 text-pretty font-mono leading-relaxed text-[#5f4b3f]">Use the same editor either way. Pick the home that fits the device.</p>
            </motion.div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <motion.article {...reveal} className="rounded-[1.5rem] bg-[#d9e1d2] p-7 sm:p-9">
                <Cloud size={30} strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#5b6b54]">Best across devices</p><h3 className="mt-3 font-serif text-4xl">Online</h3>
                <p className="mt-3 max-w-[48ch] text-pretty font-mono text-sm leading-relaxed text-[#465240]">Connect Google Drive to reach the same notes across desktop, tablet, and phone. Puffnotes keeps them in a dedicated Drive folder.</p>
              </motion.article>
              <motion.article {...reveal} className="rounded-[1.5rem] bg-[#eee0d2] p-7 sm:p-9">
                <FolderLock size={30} strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#7a6254]">Best on desktop</p><h3 className="mt-3 font-serif text-4xl">Offline</h3>
                <p className="mt-3 max-w-[48ch] text-pretty font-mono text-sm leading-relaxed text-[#5f4b3f]">Pick a local folder in a supported desktop browser. Puffnotes autosaves ordinary Markdown files there, with no account.</p>
              </motion.article>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 sm:pb-32">
          <motion.div {...reveal} className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[1.75rem] bg-[#34251c] px-7 py-12 text-[#fff8f0] sm:px-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="font-mono text-xs uppercase tracking-[0.14em] text-[#cbbcaf]">The thought is already leaving</p><h2 className="mt-5 max-w-[12ch] text-balance font-serif text-4xl leading-[1.04] sm:text-6xl">Catch it before it gets tidy.</h2></div>
            <button type="button" onClick={onOpenApp} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#fff8f0] px-7 font-mono text-sm font-semibold text-[#34251c] transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 lg:self-auto">Open Puffnotes <ArrowRight size={17} aria-hidden="true" /></button>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-[#34251c]/15 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 font-mono text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Puffnotes. Created by <a className="font-creator-signature underline" href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer">Rajin Khan</a>.</p>
          <div className="flex flex-wrap gap-5">
            <a className="inline-flex items-center gap-2 underline-offset-4 hover:underline" href="https://github.com/rajin-khan/PuffNotes" target="_blank" rel="noopener noreferrer"><Github size={16} aria-hidden="true" />GitHub</a>
            <a className="underline-offset-4 hover:underline" href="https://github.com/rajin-khan/PuffNotes/discussions/1" target="_blank" rel="noopener noreferrer">Request a theme</a>
          </div>
        </div>
      </footer>
    </motion.div>
    </>
  );
}
