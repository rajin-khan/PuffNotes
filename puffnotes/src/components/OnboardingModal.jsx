// src/components/OnboardingModal.jsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Wand2 } from 'lucide-react';

// Animation variants for the text content
const textVariants = {
  enter: { y: 20, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { ease: 'easeOut', duration: 0.5 } },
  exit: { y: -20, opacity: 0, transition: { ease: 'easeIn', duration: 0.3 } },
};

export default function OnboardingModal({ steps, onFinish }) {
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
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        // THE FIX: The layout is now a single column (flex-col) and has a more appropriate max-width for a vertical layout.
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121212] shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top Part: Full-Width Video Showcase */}
        <div className="relative w-full aspect-video bg-black">
          <AnimatePresence>
            <motion.video
              key={steps[currentStep].video}
              className="absolute h-full w-full object-cover"
              src={steps[currentStep].video}
              autoPlay
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
          <button onClick={onFinish} className="absolute top-4 right-4 text-white/50 transition-colors hover:text-white">
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
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-yellow-400/50">
                  Step {currentStep + 1} / {steps.length}
                </p>
                <h3 className="mt-3 font-serif text-2xl font-medium text-[#F5F5DC]/90 sm:text-3xl" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {steps[currentStep].title}
                </h3>
                <p className="mt-3 font-mono text-sm text-[#F5F5DC]/60 leading-relaxed" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer and Navigation */}
          <div className="mt-auto">
            <div className="relative h-1 w-full rounded-full bg-white/10">
              <motion.div
                className="absolute top-0 left-0 h-1 rounded-full bg-[#F5F5DC]"
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
                    className="group flex items-center gap-2 rounded-full px-4 py-2 font-mono text-sm text-white/60 transition-colors hover:text-white"
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
                className="group flex items-center gap-2 rounded-full bg-[#F5F5DC] px-5 py-2.5 font-mono text-sm font-semibold text-black transition-opacity hover:opacity-80"
                whileTap={{ scale: 0.95 }}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}