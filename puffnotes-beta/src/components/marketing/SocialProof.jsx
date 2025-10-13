import { motion } from 'framer-motion';
import { Github, Shield, Heart, Coffee, Star } from 'lucide-react';

const SocialProof = () => {
  return (
    <div className="py-24 px-6" style={{ backgroundColor: '#362112' }}>
      <div className="text-center space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-4xl font-serif text-[#E8D5C4]/90">Built in the open, trusted by real people</h2>
          <p className="text-lg font-mono max-w-2xl mx-auto leading-relaxed text-[#E8D5C4]/90">
            No corporate backing. No hidden agendas. Just a developer who got tired of bloated note apps.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto items-stretch">
          {/* GitHub Star */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-12 h-12 rounded-full bg-[#362112] flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-[#362112]/20">
                <Github className="w-6 h-6 text-[#F5E6D3]" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-mono font-semibold text-[#362112]">Star on GitHub</span>
                <p className="text-xs font-mono text-[#4A2F1A]">Open source & transparent</p>
              </div>
            </div>
          </motion.div>
          
          {/* Privacy */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-12 h-12 rounded-full bg-[#362112] flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-[#362112]/20">
                <Shield className="w-6 h-6 text-[#F5E6D3]" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#362112]">No tracking</p>
                <p className="text-xs font-mono text-[#4A2F1A]">Your data stays yours</p>
              </div>
            </div>
          </motion.div>
          
          {/* Free Forever */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-12 h-12 rounded-full bg-[#362112] flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-[#362112]/20">
                <Heart className="w-6 h-6 text-[#F5E6D3]" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#362112]">100% free</p>
                <p className="text-xs font-mono text-[#4A2F1A]">Forever. Seriously.</p>
              </div>
            </div>
          </motion.div>
          
          {/* No BS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-12 h-12 rounded-full bg-[#362112] flex items-center justify-center mx-auto mb-4 shadow-lg ring-2 ring-[#362112]/20">
                <Coffee className="w-6 h-6 text-[#F5E6D3]" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#362112]">No ads</p>
                <p className="text-xs font-mono text-[#4A2F1A]">No BS. Just notes.</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-br from-[#F5E6D3] to-[#E8D5C4] rounded-3xl shadow-2xl border border-[#E8D5C4] p-8 max-w-lg mx-auto relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-2 h-2 bg-[#8B4513] rounded-full"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-[#8B4513] rounded-full"></div>
              <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-[#8B4513] rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-1 h-1 bg-[#8B4513] rounded-full"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#362112] flex items-center justify-center shadow-lg">
                  <Coffee className="w-4 h-4 text-[#F5E6D3]" />
                </div>
                <span className="text-sm font-mono font-semibold text-[#362112]">Notes beautified today</span>
              </div>
              
              <div className="text-center space-y-2">
                <motion.div 
                  className="text-5xl font-mono font-bold text-[#362112]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  {Math.floor(Math.random() * 1000) + 500}
                </motion.div>
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#4A2F1A]">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Just a random number generator.</span>
                </div>
              </div>
            </div>
          </div>
          
          
        </motion.div>
      </div>
    </div>
  );
};

export default SocialProof;
