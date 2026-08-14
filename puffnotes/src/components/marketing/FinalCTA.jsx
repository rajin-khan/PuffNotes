import { motion } from 'framer-motion';
import WarmButton from './WarmButton';

const FinalCTA = ({ onStartOffline: _onStartOffline, onStartOnline: _onStartOnline }) => {
  return (
    <div className="py-24 px-6" style={{ backgroundColor: '#362112' }}>
      
      {/* Main content */}
      <div className="relative z-10 text-center space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-5xl font-serif text-[#E8D5C4]/90">
            Ready to make your notes beautiful?
          </h2>
          <p className="text-xl font-mono max-w-2xl mx-auto leading-relaxed text-[#E8D5C4]/80">
            No credit card. No lengthy signup. Just start writing.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
          className="flex justify-center items-center"
        >
          <WarmButton
            variant="primary"
            size="lg"
            onClick={() => window.location.href = '/'}
            className="bg-[#F5E6D3] text-[#362112] hover:bg-[#E8D5C4] border-[#8B4513] hover:border-[#A0522D] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            Start Writing Now
          </WarmButton>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-lg font-mono italic text-[#E8D5C4]/90">
            Takes less than 10 seconds to get started
          </p>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#8B4513]"></div>
              <span className="text-sm font-mono text-[#E8D5C4]/80">No account required</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#8B4513]"></div>
              <span className="text-sm font-mono text-[#E8D5C4]/80">Works offline</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#8B4513]"></div>
              <span className="text-sm font-mono text-[#E8D5C4]/80">Free forever</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FinalCTA;
