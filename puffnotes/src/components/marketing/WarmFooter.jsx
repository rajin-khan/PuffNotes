import { motion } from 'framer-motion';
import { Github, Mail, ExternalLink } from 'lucide-react';

const WarmFooter = () => {
  return (
    <footer className="py-8 px-6 border-t border-[#8B4513]" style={{ backgroundColor: '#F5E6D3' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="flex gap-6 text-[#362112]"
          >
            <a 
              href="https://github.com/rajin-khan/PuffNotes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#2A1A0E] transition-colors duration-200 group"
            >
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-mono font-medium">GitHub</span>
            </a>
            <a 
              href="mailto:hello@rajinkhan.com" 
              className="flex items-center gap-2 hover:text-[#2A1A0E] transition-colors duration-200 group"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-mono font-medium">Contact</span>
            </a>
            <a 
              href="https://rajinkhan.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[#2A1A0E] transition-colors duration-200 group"
            >
              <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm font-mono font-medium">About</span>
            </a>
          </motion.div>
          
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            viewport={{ once: true }}
            className="text-sm font-mono text-[#362112]/80 flex items-center gap-2"
          >
            © {new Date().getFullYear()} PuffNotes
            <span className="text-xs opacity-70">·</span>
            <span className="text-xs opacity-70">Created by <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="font-creator-signature underline transition-colors hover:text-[#2A1A0E]">Rajin Khan</a></span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default WarmFooter;
