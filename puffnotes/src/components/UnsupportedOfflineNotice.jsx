import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Cloud } from 'lucide-react';
import ThemeBackground from './ThemeBackground';
import { getStoredTheme } from '../lib/themeManager';

export default function UnsupportedOfflineNotice({ onBack, onUseOnline }) {
  const shouldReduceMotion = useReducedMotion();
  const theme = getStoredTheme();

  return (
    <motion.main
      data-puffnotes-theme={theme}
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black p-5"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: 'easeOut' }}
    >
      <ThemeBackground theme={theme} />
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <section className="relative z-10 w-full max-w-sm rounded-2xl border border-white/15 bg-[#121212]/90 px-6 py-9 text-center shadow-2xl sm:px-9">
        <motion.h1
          className="font-serif text-5xl tracking-tight text-[#f5f5dc]"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          puffnotes
        </motion.h1>
        <motion.div
          className="mx-auto mt-3 h-px w-24 origin-center bg-[#f5f5dc]/45"
          initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: shouldReduceMotion ? 0 : 0.18, duration: 0.5, ease: 'easeOut' }}
          aria-hidden="true"
        />
        <h2 className="mt-7 font-serif text-xl text-[#f5f5dc]/90">Offline mode needs a desktop</h2>
        <p className="mx-auto mt-3 max-w-xs font-mono text-sm leading-relaxed text-[#f5f5dc]/65">
          This device cannot give Puffnotes access to a local notes folder. Use Online mode here to save and sync notes with Google Drive.
        </p>
        <button type="button" onClick={onUseOnline} className="mx-auto mt-7 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f5f5dc] px-5 font-mono text-sm text-[#171717] transition-[opacity,scale] duration-150 hover:opacity-90 active:scale-96 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f5f5dc]">
          <Cloud size={17} aria-hidden="true" />
          Use Online mode
        </button>
        <button type="button" onClick={onBack} className="mx-auto mt-3 flex min-h-11 items-center justify-center gap-2 px-4 font-mono text-xs text-[#f5f5dc]/60 transition-colors hover:text-[#f5f5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5dc]">
          <ArrowLeft size={15} aria-hidden="true" />
          Back
        </button>
      </section>
    </motion.main>
  );
}
