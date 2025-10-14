import { motion } from 'framer-motion';
import { Lock, Cloud, FilePen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WarmButton from './WarmButton';

const ModeChoice = ({ onStartOffline, onStartOnline }) => {
  const navigate = useNavigate();

  const handleOfflineClick = () => {
    onStartOffline();
    navigate('/');
  };

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
          <h2 className="text-4xl font-serif text-[#E8D5C4]/90">Choose your comfort zone</h2>
          <p className="text-lg font-mono max-w-2xl mx-auto leading-relaxed text-[#E8D5C4]/90">
            Whether you prefer keeping things private or syncing everywhere, you're covered.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Offline Mode */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-8 h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 font-mono">
              <div className="text-center space-y-6 flex-1">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#362112] flex items-center justify-center shadow-lg ring-2 ring-[#362112]/20">
                    <Lock className="w-8 h-8 text-[#F5E6D3]" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-serif text-[#362112]">Private. Instant. Yours.</h3>
                  <ul className="space-y-3 text-left text-sm text-[#4A2F1A]">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Nothing leaves your device. Ever.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Zero latency. Zero accounts.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Works in any Chromium browser</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Perfect for sensitive notes</span>
                    </li>
                  </ul>
                </div>
                
                <WarmButton
                  variant="primary"
                  onClick={handleOfflineClick}
                  className="w-full flex items-center justify-center gap-2 bg-[#362112] text-[#F5E6D3] hover:bg-[#2A1A0E] border-[#8B4513] hover:border-[#A0522D]"
                >
                  <FilePen size={16} />
                  <span>Start Writing Offline</span>
                </WarmButton>
              </div>
            </div>
          </motion.div>
          
          {/* Online Mode */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-[#F5E6D3] rounded-2xl shadow-xl border border-[#E8D5C4] p-8 h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 font-mono">
              <div className="text-center space-y-6 flex-1">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#362112] flex items-center justify-center shadow-lg ring-2 ring-[#362112]/20">
                    <Cloud className="w-8 h-8 text-[#F5E6D3]" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-serif text-[#362112]">Sync. Access. Everywhere.</h3>
                  <ul className="space-y-3 text-left text-sm text-[#4A2F1A]">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Auto-saves to Google Drive</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Access from any device</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Secure Google authentication</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#8B4513] mt-1.5 flex-shrink-0"></div>
                      <span>Never lose your work</span>
                    </li>
                  </ul>
                </div>
                
                <WarmButton
                  variant="secondary"
                  onClick={onStartOnline}
                  className="w-full flex items-center justify-center gap-2 bg-[#362112] text-[#F5E6D3] hover:bg-[#2A1A0E] border-[#8B4513] hover:border-[#A0522D]"
                >
                  <img src="/google-drive-icon-google-product-illustration-free-png.webp" alt="Google Drive" className="h-5 w-auto" />
                  <span>Connect Google Drive</span>
                </WarmButton>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xl font-mono italic text-[#E8D5C4]/90">
            Switch anytime. Your choice. Always.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ModeChoice;