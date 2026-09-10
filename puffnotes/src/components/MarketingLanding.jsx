import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cloud, FolderLock, Github, Pause, PenLine, Play } from 'lucide-react';
import { getStoredTheme, setStoredTheme, THEMES } from '../lib/themeManager';

const themes = {
  [THEMES.WARM]: { name: 'Puff', video: '/puff.mp4', poster: '/preview.png' },
  [THEMES.GALAXY]: { name: 'Astralia', video: '/galaxy.mp4', poster: '/previewaltl.png' },
  [THEMES.KOMOREBI]: { name: 'Komorebi', video: '/komorebi.mp4', poster: '/preview.png' },
};

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.2, 0, 0, 1] },
};

export default function MarketingLanding({ onOpenApp }) {
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [isPlaying, setIsPlaying] = useState(!shouldReduceMotion);
  const activeTheme = themes[theme] || themes[THEMES.WARM];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldReduceMotion || !isPlaying) video.pause();
    else video.play().catch(() => setIsPlaying(false));
  }, [activeTheme.video, isPlaying, shouldReduceMotion]);

  const toggleVideo = () => setIsPlaying((playing) => !playing);
  const chooseTheme = (nextTheme) => {
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7efe5] text-[#34251c] antialiased">
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
        <section className="relative flex min-h-[100dvh] items-end overflow-hidden bg-[#17130f] text-[#fff8f0]">
          <video ref={videoRef} key={activeTheme.video} autoPlay={!shouldReduceMotion} muted loop playsInline poster={activeTheme.poster} className="absolute inset-0 h-full w-full object-cover" aria-hidden="true">
            <source src={activeTheme.video} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,13,10,0.92)_0%,rgba(18,13,10,0.38)_62%,rgba(18,13,10,0.56)_100%)]" />

          <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-5 pb-12 pt-32 sm:px-8 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.2, 0, 0, 1] }} className="max-w-3xl">
              <h1 className="text-balance font-serif text-[clamp(3.6rem,9vw,8rem)] leading-[0.88] tracking-[-0.045em]">Write messily.<br />Keep it beautifully.</h1>
              <p className="mt-7 max-w-[55ch] text-pretty font-mono text-base leading-relaxed text-[#fff8f0]/82 sm:text-lg">A quiet Markdown notebook for typed thoughts, handwritten pages, Google Drive sync, and local files.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button type="button" onClick={onOpenApp} className="min-h-12 rounded-full bg-[#fff8f0] px-7 font-mono text-sm font-semibold text-[#34251c] transition-[transform,background-color] duration-150 hover:bg-white active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Open Puffnotes</button>
                <a href="#how-it-works" className="min-h-12 rounded-full border border-white/45 px-7 py-3.5 font-mono text-sm text-white transition-[transform,background-color] duration-150 hover:bg-white/10 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">See how it works</a>
              </div>
            </motion.div>

            <div className="flex items-center gap-2 lg:flex-col lg:items-end">
              <div className="flex rounded-full border border-white/30 bg-black/25 p-1" aria-label="Landing atmosphere">
                {Object.entries(themes).map(([key, item]) => (
                  <button key={key} type="button" onClick={() => chooseTheme(key)} aria-pressed={theme === key} className={`min-h-10 rounded-full px-3 font-mono text-xs transition-colors duration-150 focus-visible:outline focus-visible:outline-2 ${theme === key ? 'bg-[#fff8f0] text-[#34251c]' : 'text-white hover:bg-white/10'}`}>{item.name}</button>
                ))}
              </div>
              <button type="button" onClick={toggleVideo} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2" aria-label={isPlaying ? 'Pause background video' : 'Play background video'}>
                {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-8 px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="max-w-3xl">
              <h2 className="text-balance font-serif text-4xl leading-tight tracking-tight sm:text-6xl">Your note can stay rough. Puffnotes handles the presentation.</h2>
              <p className="mt-5 max-w-[65ch] text-pretty font-mono leading-relaxed text-[#5f4b3f]">Write in Markdown, tidy a draft with AI, preview the result, then export it. Nothing forces you into a complicated document editor.</p>
            </motion.div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <motion.figure {...reveal} className="overflow-hidden rounded-2xl bg-[#201813] p-3 text-[#fff8f0]">
                <video controls muted playsInline preload="metadata" className="aspect-video w-full rounded-xl object-cover outline outline-1 outline-white/10"><source src="/videos/2.mp4" type="video/mp4" /></video>
                <figcaption className="px-2 pb-2 pt-4 font-mono text-sm text-white/75">Turn a scattered draft into a useful note.</figcaption>
              </motion.figure>
              <motion.figure {...reveal} className="overflow-hidden rounded-2xl bg-[#201813] p-3 text-[#fff8f0]">
                <video controls muted playsInline preload="metadata" className="aspect-video w-full rounded-xl object-cover outline outline-1 outline-white/10"><source src="/videos/3.mp4" type="video/mp4" /></video>
                <figcaption className="px-2 pb-2 pt-4 font-mono text-sm text-white/75">Switch between writing and a clean Markdown preview.</figcaption>
              </motion.figure>
              <motion.figure {...reveal} className="overflow-hidden rounded-2xl bg-[#201813] p-3 text-[#fff8f0] lg:col-span-2">
                <video controls muted playsInline preload="metadata" className="aspect-video w-full rounded-xl object-cover outline outline-1 outline-white/10"><source src="/videos/4.mp4" type="video/mp4" /></video>
                <figcaption className="px-2 pb-2 pt-4 font-mono text-sm text-white/75">Export the complete note as a PDF when it needs to leave Puffnotes.</figcaption>
              </motion.figure>
            </div>
          </div>
        </section>

        <section className="bg-[#34251c] px-5 py-24 text-[#fff8f0] sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <motion.div {...reveal}>
              <PenLine size={34} strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-7 text-balance font-serif text-4xl leading-tight sm:text-6xl">Words when they fit. Ink when they don’t.</h2>
              <p className="mt-5 max-w-[58ch] text-pretty font-mono leading-relaxed text-white/72">Each note holds a typed page and as many drawing pages as you need. Preview and PDF export keep them together, in that order.</p>
            </motion.div>
            <motion.div {...reveal} className="relative min-h-[28rem] overflow-hidden rounded-2xl bg-[#f9f5ee] p-8 text-[#34251c] outline outline-1 outline-white/10 sm:p-12">
              <p className="font-serif text-2xl">meeting fragments</p>
              <div className="mt-8 space-y-4 font-mono text-sm text-[#5f4b3f]"><p>• keep the idea loose</p><p>• draw the part words miss</p><p>• export it as one note</p></div>
              <svg viewBox="0 0 500 220" className="mt-8 w-full" role="img" aria-label="A loose handwritten line drawing">
                <path d="M25 145 C90 20 155 205 240 80 S390 32 470 130 M60 175 C145 80 220 205 330 115" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </motion.div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div {...reveal} className="max-w-2xl">
              <h2 className="text-balance font-serif text-4xl leading-tight sm:text-6xl">Choose where your notes live.</h2>
              <p className="mt-5 text-pretty font-mono leading-relaxed text-[#5f4b3f]">Both modes use the same editor. The difference is storage.</p>
            </motion.div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <motion.article {...reveal} className="rounded-2xl bg-[#eee0d2] p-7 sm:p-9">
                <FolderLock size={30} strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-8 font-serif text-3xl">Offline</h3>
                <p className="mt-3 max-w-[48ch] text-pretty font-mono text-sm leading-relaxed text-[#5f4b3f]">Pick a folder on a supported desktop browser. Puffnotes autosaves ordinary Markdown files there.</p>
              </motion.article>
              <motion.article {...reveal} className="rounded-2xl bg-[#d9e1d2] p-7 sm:p-9">
                <Cloud size={30} strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-8 font-serif text-3xl">Online</h3>
                <p className="mt-3 max-w-[48ch] text-pretty font-mono text-sm leading-relaxed text-[#465240]">Connect Google Drive to reach the same notes across desktop, tablet, and phone.</p>
              </motion.article>
            </div>
            <motion.div {...reveal} className="mt-10"><button type="button" onClick={onOpenApp} className="min-h-12 rounded-full bg-[#34251c] px-7 font-mono text-sm font-semibold text-[#fff8f0] transition-transform duration-150 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Choose a mode</button></motion.div>
          </div>
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
    </div>
  );
}
