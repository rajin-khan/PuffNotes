import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WarmButton from './WarmButton';
import SectionWrapper from './SectionWrapper';

const HeroSection = ({ onStartOffline: _onStartOffline, onStartOnline: _onStartOnline }) => {
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const messyText = "meeting notes\n- project ideas?\n- budget stuff\n- timeline unclear\n- need to follow up";
  const cleanText = "# Meeting Notes\n\n## Project Ideas\n- Research new features\n- Evaluate user feedback\n- Plan Q1 roadmap\n\n## Budget Considerations\n- Allocate resources for development\n- Review cost projections\n- Optimize spending\n\n## Timeline\n- Set clear milestones\n- Define deliverables\n- Establish deadlines\n\n## Action Items\n- [ ] Schedule follow-up meeting\n- [ ] Prepare budget proposal\n- [ ] Update project timeline";

  useEffect(() => {
    if (isTyping) {
      // Type messy text - Speed increased from 30ms to 15ms
      let index = 0;
      const typeInterval = setInterval(() => {
        if (index <= messyText.length) {
          setCurrentText(messyText.slice(0, index));
          index++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setIsTyping(false), 1000);
        }
      }, 15);
      
      return () => clearInterval(typeInterval);
    } else {
      // Transform to clean text - Speed increased from 20ms to 10ms
      let index = 0;
      const transformInterval = setInterval(() => {
        if (index <= cleanText.length) {
          setCurrentText(cleanText.slice(0, index));
          index++;
        } else {
          clearInterval(transformInterval);
          setTimeout(() => setIsTyping(true), 2000);
        }
      }, 10);
      
      return () => clearInterval(transformInterval);
    }
  }, [isTyping]);

  const textAnimationVariants = {
    initial: { opacity: 0, filter: 'blur(4px)' },
    animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.5, ease: 'easeIn' } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/puff.mp4" type="video/mp4" />
        <source src="/puff.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark overlay - lighter opacity */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20 min-h-screen flex items-center py-24">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-12"
            >
              {/* Main title */}
              <div className="space-y-8">
                <motion.h1 
                  className="font-serif text-5xl lg:text-6xl font-light tracking-tight text-[#FFF8F0] leading-tight drop-shadow-2xl"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                >
                  puffnotes
                </motion.h1>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                  className="space-y-6"
                >
                  <h2 className="font-serif text-2xl lg:text-3xl font-medium text-[#FFF8F0] leading-relaxed drop-shadow-xl">
                    Your quiet place.
                  </h2>
                  <p className="text-lg font-mono text-white/95 max-w-lg leading-relaxed drop-shadow-lg">
                    AI-powered note-taking that works offline, syncs everywhere, and makes you look like a better writer than you are.
                  </p>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
                className="space-y-8"
              >
                <WarmButton
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = '/'}
                  className="w-full max-w-sm mx-auto"
                >
                  Start Writing Now
                </WarmButton>
                
                <p className="text-sm font-mono text-center sm:text-left text-white/90 drop-shadow-md">
                  Free Forever • Open Source • Privacy First
                </p>
              </motion.div>
            </motion.div>
            
            {/* Right side - Demo */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="relative"
            >
              <div className="bg-black/80 p-8 rounded-3xl border-2 border-[#D4A574] shadow-2xl">
                <motion.div 
                  layout
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="warm-bg-white rounded-2xl p-6 min-h-[320px] warm-border-light shadow-inner"
                >
                  <motion.div
                    key={isTyping ? 'messy' : 'clean'}
                    variants={textAnimationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-warm-brown">
                      {currentText}
                    </pre>
                  </motion.div>
                </motion.div>
                
                {!isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-4 -right-4"
                  >
                    <div className="bg-[#FFF8F0]/95 backdrop-blur-sm px-3 py-2 rounded-full border-2 border-[#FFF8F0] shadow-xl ring-2 ring-[#FFF8F0]/20 flex items-center gap-1">
                      <span className="text-s font-bold font-serif text-[#5C4A40]">AI</span>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-[#5C4A40]">
                        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
