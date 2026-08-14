// src/components/OnboardingModal.jsx
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Wand2 } from 'lucide-react';
import { THEMES } from '../lib/themeManager';
import { ModalFrame } from './ModalMotion';

// Animation variants for the text content
const textVariants = {
  enter: { y: 20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { ease: 'easeIn', duration: 0.3 } },
};

export default function OnboardingModal({ steps, onFinish, theme = THEMES.WARM }) {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <ModalFrame
      kind="help"
      theme={theme}
      panelClassName={`relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${theme === THEMES.GALAXY ? 'border-[#2d3561] bg-[#0f1642]' : theme === THEMES.KOMOREBI ? 'border-[#315047] bg-[#071c20]' : 'border-white/10 bg-[#121212]'}`}
    >
        {/* Top Part: Full-Width Video Showcase */}
        <div className="relative w-full aspect-video bg-black">
          <AnimatePresence>
            <motion.video
              key={steps[currentStep].video}
              className="absolute h-full w-full object-cover"
              src={steps[currentStep].video}
              autoPlay={!shouldReduceMotion}
              loop
              muted
              playsInline
              preload="auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeIn' } }}
            />
          </AnimatePresence>
        </div>
        
        {/* Bottom Part: Text Content and Navigation */}
        <div className="flex flex-col p-6 sm:p-8">
          <button aria-label="Close help" onClick={onFinish} className={`absolute top-4 right-4 transition-colors ${theme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : theme === THEMES.KOMOREBI ? 'text-[#b7cd9b] hover:text-[#f6eed0]' : 'text-white/50 hover:text-white'}`}>
            <X size={20} />
          </button>
          
          {/* Text content with a fixed height to prevent layout shifts */}
          <div className="h-40 sm:h-36">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center"
              >
                <p className={`font-mono text-xs font-semibold uppercase tracking-widest ${theme === THEMES.GALAXY ? 'text-[#9b59b6]/70' : theme === THEMES.KOMOREBI ? 'text-[#e7bd87]/80' : 'text-yellow-400/50'}`}>
                  Step {currentStep + 1} / {steps.length}
                </p>
                <h3 className={`mt-3 font-serif text-2xl font-medium sm:text-3xl ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]/90' : theme === THEMES.KOMOREBI ? 'text-[#f6eed0]/95' : 'text-[#F5F5DC]/90'}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {steps[currentStep].title}
                </h3>
                <p className={`mt-3 font-mono text-sm leading-relaxed ${theme === THEMES.GALAXY ? 'text-[#b8bfde]/70' : theme === THEMES.KOMOREBI ? 'text-[#d6dfca]/75' : 'text-[#F5F5DC]/60'}`} style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer and Navigation */}
          <div className="mt-auto">
            <div className={`relative h-1 w-full rounded-full ${theme === THEMES.GALAXY ? 'bg-[#2d3561]' : theme === THEMES.KOMOREBI ? 'bg-[#2e5d56]/45' : 'bg-white/10'}`}>
              <motion.div
                className={`absolute top-0 left-0 h-1 rounded-full ${theme === THEMES.GALAXY ? 'bg-[#9b59b6]' : theme === THEMES.KOMOREBI ? 'bg-[#e7bd87]' : 'bg-[#F5F5DC]'}`}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <AnimatePresence>
                {currentStep > 0 ? (
                  <motion.button
                    onClick={handleBack}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`group flex items-center gap-2 rounded-full px-4 py-2 font-mono text-sm transition-colors ${theme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : theme === THEMES.KOMOREBI ? 'text-[#b7cd9b] hover:text-[#f6eed0]' : 'text-white/60 hover:text-white'}`}
                  >
                    <ArrowLeft size={16} /> Back
                  </motion.button>
                ) : (
                  // Placeholder to keep the "Next" button on the right
                  <div />
                )}
              </AnimatePresence>
              <motion.button
                onClick={handleNext}
                className={`group flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-sm font-semibold transition-opacity hover:opacity-80 ${theme === THEMES.GALAXY ? 'bg-[#9b59b6] text-[#e8eaf6]' : theme === THEMES.KOMOREBI ? 'bg-[#f4ebd7] text-[#172a27]' : 'bg-[#F5F5DC] text-black'}`}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
              </motion.button>
            </div>
          </div>
        </div>
    </ModalFrame>
  );
}
