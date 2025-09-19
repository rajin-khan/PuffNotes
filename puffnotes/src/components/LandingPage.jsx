// src/components/LandingPage.jsx
import { useState, useRef, useEffect } from 'react'; // <-- Import useRef and useEffect
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, FolderLock, ArrowRight, ArrowLeft, Cloud, MonitorSmartphone, ShieldCheck, FileText } from 'lucide-react';

// Animation variants for the content inside
const itemVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { ease: 'easeIn', duration: 0.3 } },
};

// Variants for the container to orchestrate the children's animation
const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  exit: { opacity: 0 },
};


export default function LandingPage({ onStartOffline, onStartOnline, isOnlineLoading }) {
  const [showInfo, setShowInfo] = useState(false);
  
  // AUTOPLAY FIX: Create a ref for the video element
  const videoRef = useRef(null);

  // AUTOPLAY FIX: Add a useEffect to programmatically play the video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.warn("Video autoplay was prevented by the browser:", error);
      });
    }
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center overflow-y-auto bg-black p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Video */}
      <video
        // AUTOPLAY FIX: Attach the ref
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute top-0 left-0 h-full w-full object-cover"
      >
        {/* AUTOPLAY FIX: Add the MP4 source for Safari compatibility */}
        <source src="/puff.webm" type="video/webm" />
        <source src="/puff.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 h-full w-full bg-black/70"></div>

      {/* Main Content Panel */}
      <motion.div
        layout
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/80"
      >
        <AnimatePresence mode="wait" initial={false}>
          {!showInfo ? (
            // --- FRONT VIEW ---
            <motion.div
              key="front"
              className="flex flex-col items-center p-6 text-center sm:p-10"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.h1 className="font-serif text-5xl tracking-tight text-[#F5F5DC]/95 sm:text-6xl" style={{ textShadow: '0 2px 25px rgba(0, 0, 0, 0.5)' }} variants={itemVariants}>
                puffnotes
              </motion.h1>
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#F5F5DC]/50">Stable 2.0.0</p>
                <p className="mt-2 font-mono text-xs text-white/40">Created by{' '}<a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 transition-colors">Rajin Khan</a></p>
              </motion.div>
            </motion.div>
          ) : (
            // --- BACK VIEW (HOW IT WORKS) ---
            <motion.div
              key="back"
              className="flex flex-col p-6 text-left sm:p-8"
              variants={containerVariants}
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
    </motion.div>
  );
}