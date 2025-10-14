import { motion } from 'framer-motion';
import { useState } from 'react';
import { Wand2, RotateCw } from 'lucide-react';

const MagicMoment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showTransformation, setShowTransformation] = useState(false);

  const handleMagicClick = () => {
    setIsProcessing(true);
    setShowTransformation(false);
    
    // Faster processing time to match app responsiveness
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
      setShowTransformation(true);
    }, 1200);
  };

  const resetDemo = () => {
    setIsProcessing(false);
    setIsComplete(false);
    setShowTransformation(false);
  };

  return (
    <div className="py-24 px-6" style={{ backgroundColor: '#F5E6D3' }}>
      <div className="text-center space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-4xl font-serif text-[#362112]/90">One tap. That's it.</h2>
          <p className="text-lg font-mono max-w-3xl mx-auto leading-relaxed text-[#362112]/80">
            Your scattered thoughts, rushed meeting notes, or late-night ideas — instantly transformed into structured, readable content. No editing required. No formatting headaches. Just pure magic (tap the wand).
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Demo Container */}
          <div className="relative">
            {/* Magic Wand Button - matches actual app styling */}
            <motion.button
              onClick={handleMagicClick}
              disabled={isProcessing}
              className={`absolute -top-4 -right-4 z-20 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
                isProcessing || !showTransformation 
                  ? 'bg-[#F5E6D3] border border-[#8B4513] text-[#362112]' 
                  : 'bg-[#F5E6D3] border border-[#8B4513] text-[#362112] hover:bg-[#E8D5C4] hover:text-[#2A1A0E]'
              }`}
              whileHover={!isProcessing ? { scale: 1.05, rotate: 5 } : {}}
              whileTap={!isProcessing ? { scale: 0.95 } : {}}
              animate={isProcessing ? { rotate: 360 } : {}}
              transition={isProcessing ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <RotateCw size={20} className="text-[#362112]" />
                </motion.div>
              ) : (
                <Wand2 size={20} />
              )}
            </motion.button>

            {/* Demo Card */}
            <motion.div 
              className="bg-[#362112] rounded-2xl shadow-xl border border-[#8B4513] p-8 relative overflow-hidden"
              whileHover={{ y: -2, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 w-2 h-2 bg-terracotta rounded-full"></div>
                <div className="absolute top-8 right-8 w-1 h-1 bg-amber rounded-full"></div>
                <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-burnt-orange rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-1 h-1 bg-terracotta rounded-full"></div>
                <div className="absolute top-12 left-12 w-0.5 h-0.5 bg-warm-brown rounded-full"></div>
                <div className="absolute bottom-12 right-12 w-0.5 h-0.5 bg-warm-brown rounded-full"></div>
              </div>
              
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-warm-cream/20 pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10">
                {/* Reset Demo Button */}
                {isComplete && (
                  <motion.div
                    className="flex justify-end mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <button
                      onClick={resetDemo}
                      className="text-xs font-mono text-[#8B4513] hover:text-[#A0522D] transition-colors"
                    >
                      Reset Demo
                    </button>
                  </motion.div>
                )}

                {/* Text Content */}
                <div className="min-h-[200px] flex items-center justify-center">
                  <motion.div
                    key={showTransformation ? 'transformed' : 'original'}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    {!showTransformation ? (
                      <div className="text-left">
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#E8D5C4]">
{`meeting notes
- project ideas?
- budget stuff  
- timeline unclear
- need to follow up

random thoughts:
- maybe add feature x
- check with team
- deadline??`}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-left">
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-[#E8D5C4]">
{`# Meeting Notes

## Project Ideas
- Research new features
- Evaluate user feedback  
- Plan Q1 roadmap

## Budget Considerations
- Allocate resources for development
- Review cost projections
- Optimize spending

## Timeline
- Set clear milestones
- Define deliverables
- Establish deadlines

## Action Items
- [ ] Schedule follow-up meeting
- [ ] Prepare budget proposal
- [ ] Update project timeline`}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Processing Animation - matches actual app */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-warm-white/90 backdrop-blur-sm flex items-center justify-center"
                  >
                    <div className="text-center space-y-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 mx-auto"
                      >
                        <RotateCw size={24} className="text-[#9a8c73]" />
                      </motion.div>
                      <p className="text-sm font-mono text-[#E8D5C4] font-medium">Beautifying your notes...</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
          className="inline-block"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-semibold text-[#8B4513]">
              Powered by
            </span>
            <motion.img 
              src="/groq-dark.png" 
              alt="Groq" 
              className="h-5 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MagicMoment;
