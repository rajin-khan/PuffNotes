// src/components/LandingPage.jsx
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Wifi, FolderLock, ArrowRight, ArrowLeft, Cloud, MonitorSmartphone, ShieldCheck, FileText } from 'lucide-react';
import { getStoredTheme } from '../lib/themeManager';
import ThemeBackground from './ThemeBackground';

// Animation variants
const itemVariants = {
  initial: { y: 12, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.42 } },
  exit: { y: -8, opacity: 0, transition: { ease: 'easeOut', duration: 0.2 } },
};

const viewVariants = {
  initial: (direction) => ({ opacity: 0, x: direction * 22, filter: 'blur(4px)' }),
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.065, delayChildren: 0.06 },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction * -14,
    filter: 'blur(3px)',
    transition: { duration: 0.22, ease: 'easeOut' },
  }),
};


export default function LandingPage({ onStartOffline, onStartOnline, isOnlineLoading }) {
  const shouldReduceMotion = useReducedMotion();
  const [showInfo, setShowInfo] = useState(false);
  const [homeTheme] = useState(() => getStoredTheme());
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
    const timer = window.setTimeout(() => {
      setIntroComplete(true);
      try {
        sessionStorage.setItem('puffnotes_intro_seen', 'true');
      } catch {
        // The intro can still finish when storage is unavailable.
      }
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [introComplete]);

  // --- NEW: Your simple, editable message ---
  const devMessage = 'Handwritten Notes are here! Draw away <3';

  return (
    <motion.div
      data-puffnotes-theme={homeTheme}
      data-landing-theme={homeTheme}
      data-app-stage="landing"
      className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center overflow-y-auto bg-black p-4"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <ThemeBackground theme={homeTheme} />
      <div className="absolute inset-0 h-full w-full bg-black/70"></div>

      <AnimatePresence mode="wait" initial={false}>
      {!introComplete ? (
        <motion.div
          key="opening-title"
          className="relative z-10 flex flex-col items-center text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Puffnotes is loading"
        >
          <motion.h1
            className="font-serif text-6xl tracking-tight text-[#f5f5dc] sm:text-7xl"
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            puffnotes
          </motion.h1>
          <motion.div
            className="mt-4 h-px w-32 origin-center bg-[#f5f5dc]/55"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden="true"
          />
        </motion.div>
      ) : (
      <motion.div
        key="mode-chooser"
        data-landing-content
        layout
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: isOnlineLoading ? 0 : 1, scale: isOnlineLoading && !shouldReduceMotion ? 0.98 : 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/80"
      >
        <AnimatePresence mode="wait" initial={false}>
          {!showInfo ? (
            // --- FRONT VIEW ---
            <motion.div
              key="front"
              className="flex flex-col items-center p-6 text-center sm:p-10"
              custom={-1}
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.h1 className="font-serif text-5xl tracking-tight text-[#F5F5DC]/95 sm:text-6xl" style={{ textShadow: '0 2px 25px rgba(0, 0, 0, 0.5)' }} variants={itemVariants}>
                puffnotes
              </motion.h1>
              <motion.div
                className="mt-3 h-px w-20 origin-center bg-[#f5f5dc]/30"
                initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.18, duration: shouldReduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
              />
              <motion.p className="mt-2 font-mono text-base text-[#F5F5DC]/60" variants={itemVariants}>
                Your quiet place.
              </motion.p>
              <motion.button onClick={() => setShowInfo(true)} className="mt-6 font-mono text-xs text-[#F5F5DC]/50 underline transition-colors hover:text-[#F5F5DC]/80" variants={itemVariants}>
                How does it work?
              </motion.button>
              <motion.div className="my-6 h-[1px] w-full bg-white/10" variants={itemVariants} />
              <motion.div className="grid w-full grid-cols-1 gap-4" variants={itemVariants}>
                <motion.button onClick={onStartOnline} disabled={isOnlineLoading} className="group flex items-center justify-between rounded-lg border border-white/20 bg-white/10 p-4 text-[#F5F5DC]/80 transition-all duration-300 hover:border-white/40 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-center gap-3 text-left">
                    <Wifi size={28} />
                    <div>
                      <span className="font-serif text-lg">{isOnlineLoading ? 'Connecting...' : 'Online'}</span>
                      <p className="font-mono text-xs text-[#F5F5DC]/50">Works anywhere.</p>
                      <p className="font-mono text-xs text-[#F5F5DC]/50">(file sync with Google Drive)</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="opacity-50 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </motion.button>
                <motion.button onClick={onStartOffline} className="group flex items-center justify-between rounded-lg border border-white/20 bg-white/10 p-4 text-[#F5F5DC]/80 transition-all duration-300 hover:border-white/40 hover:bg-white/20" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <div className="flex items-center gap-3 text-left">
                    <FolderLock size={28} />
                    <div>
                      <span className="font-serif text-lg">Offline</span>
                      <p className="font-mono text-xs text-[#F5F5DC]/50">Desktop & Chromium Browsers only.</p>
                      <p className="font-mono text-xs text-[#F5F5DC]/50">(Chrome, Arc...)</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="opacity-50 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                </motion.button>
              </motion.div>
              <motion.div className="mt-8 w-full text-center" variants={itemVariants}>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#F5F5DC]/50">Stable 2.2.0</p>
                <p className="mt-2 font-mono text-xs text-[#F5F5DC]/50 italic">
                  {devMessage}
                </p>
                <p className="mt-2 font-mono text-xs text-white/40">Created by{' '}<a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="font-creator-signature underline transition-colors hover:text-white/70">Rajin Khan</a></p>
                <p className="mt-1 font-mono text-xs text-white/30">
                  <a href="/" className="underline hover:text-white/50 transition-colors">About Puffnotes</a>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            // --- BACK VIEW (HOW IT WORKS) ---
            <motion.div
              key="back"
              className="flex flex-col p-6 text-left sm:p-8"
              custom={1}
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.h2 className="font-serif text-2xl text-[#F5F5DC]/90" variants={itemVariants}>How It Works</motion.h2>
              <motion.div className="my-4 h-[1px] w-full bg-white/10" variants={itemVariants} />
              <motion.div className="space-y-6 font-mono text-sm text-[#F5F5DC]/70" variants={itemVariants}>
                {/* Online Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-[#F5F5DC]/90">
                    <Cloud size={16} />
                    <span>Online Mode</span>
                  </div>
                  <div className="flex items-start gap-3 pl-1">
                    <FileText size={16} className="mt-0.5 flex-shrink-0 text-white/50" />
                    <p className="text-xs text-[#F5F5DC]/60">Notes are saved as `.md` (Markdown) files, which are text files with more formatting.</p>
                  </div>
                  <div className="flex items-start gap-3 pl-1">
                    <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-white/50" />
                    <p className="text-xs text-[#F5F5DC]/60">Your notes are stored securely in a dedicated 'puffnotes' folder inside your Google Drive.</p>
                  </div>
                  <div className="flex items-start gap-3 pl-1">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-white/50"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 12h4"></path></svg>
                    <p className="text-xs text-[#F5F5DC]/60">This allows you to access and edit your notes from any modern browser, including your phone.</p>
                  </div>
                </div>
                {/* Offline Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-[#F5F5DC]/90">
                    <MonitorSmartphone size={16} />
                    <span>Offline Mode</span>
                  </div>
                   <div className="flex items-start gap-3 pl-1">
                    <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-white/50" />
                    <p className="text-xs text-[#F5F5DC]/60">Your data never leaves your computer. You choose/create any local folder, and notes are saved there directly.</p>
                  </div>
                  <div className="flex items-start gap-3 pl-1">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-white/50"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                    <p className="text-xs text-[#F5F5DC]/60">This requires a desktop browser (Chromium based) with File System Access, like Chrome, Brave, Arc, Vivaldi, and more.</p>
                  </div>
                </div>
              </motion.div>
              <motion.button onClick={() => setShowInfo(false)} className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 py-2.5 font-mono text-sm text-white/80 transition-all duration-300 hover:bg-white/20" variants={itemVariants}>
                <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                Go Back
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
