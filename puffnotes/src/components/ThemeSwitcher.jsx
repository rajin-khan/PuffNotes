// src/components/ThemeSwitcher.jsx
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ThemeSwitcher({ onPrev, onNext, theme }) {
  const iconColor = theme === 'default' ? 'text-gray-400' : 'text-gray-500';
  const hoverColor = theme === 'default' ? 'hover:text-gray-800' : 'hover:text-gray-200';
  const bgColor = theme === 'default' ? 'bg-white/30' : 'bg-black/20';
  const hoverBg = theme === 'default' ? 'hover:bg-white/70' : 'hover:bg-black/50';

  return (
    <>
      {/* Previous Theme Button */}
      <motion.button
        onClick={onPrev}
        className={`fixed left-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full backdrop-blur-sm transition-colors ${bgColor} ${hoverBg}`}
        title="Previous Theme"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.6, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <ChevronLeft size={24} className={`${iconColor} ${hoverColor} transition-colors`} />
      </motion.button>

      {/* Next Theme Button */}
      <motion.button
        onClick={onNext}
        className={`fixed right-2 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full backdrop-blur-sm transition-colors ${bgColor} ${hoverBg}`}
        title="Next Theme"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 0.6, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <ChevronRight size={24} className={`${iconColor} ${hoverColor} transition-colors`} />
      </motion.button>
    </>
  );
}