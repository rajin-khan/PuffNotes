import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { THEMES, getNextTheme, getPreviousTheme } from '../lib/themeManager';

const ThemeSwitcher = ({ currentTheme, onThemeChange }) => {
  const shouldReduceMotion = useReducedMotion();
  const handlePreviousTheme = () => {
    const prevTheme = getPreviousTheme(currentTheme);
    onThemeChange(prevTheme);
  };

  const handleNextTheme = () => {
    const nextTheme = getNextTheme(currentTheme);
    onThemeChange(nextTheme);
  };

  const getThemeName = (theme) => {
    switch (theme) {
      case THEMES.WARM:
        return 'Warm';
      case THEMES.GALAXY:
        return 'Galaxy';
      case THEMES.KOMOREBI:
        return 'Komorebi';
      default:
        return 'Warm';
    }
  };

  return (
    <>
      {/* Left Theme Button */}
      <motion.button
        onClick={handlePreviousTheme}
        className={`
          fixed left-2 top-1/2 transform -translate-y-1/2 z-50
          p-2 rounded-full transition-colors duration-500
          ${currentTheme === THEMES.GALAXY
            ? 'text-[#6c7b95] hover:text-[#b8bfde] hover:bg-[#2d3561]/30 bg-[#0f1642]/20'
            : currentTheme === THEMES.KOMOREBI
              ? 'text-[#b7cd9b] hover:text-[#f6eed0] hover:bg-[#12322e] bg-[#071c20] border border-[#b7cd9b]/30'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 bg-white/20'
          }
        `}
        title={`Switch to ${getThemeName(getPreviousTheme(currentTheme))} theme`}
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.22 } }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </motion.button>

      {/* Right Theme Button */}
      <motion.button
        onClick={handleNextTheme}
        className={`
          fixed right-2 top-1/2 transform -translate-y-1/2 z-50
          p-2 rounded-full transition-colors duration-500
          ${currentTheme === THEMES.GALAXY
            ? 'text-[#6c7b95] hover:text-[#b8bfde] hover:bg-[#2d3561]/30 bg-[#0f1642]/20'
            : currentTheme === THEMES.KOMOREBI
              ? 'text-[#b7cd9b] hover:text-[#f6eed0] hover:bg-[#12322e] bg-[#071c20] border border-[#b7cd9b]/30'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 bg-white/20'
          }
        `}
        title={`Switch to ${getThemeName(getNextTheme(currentTheme))} theme`}
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.22 } }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </motion.button>
    </>
  );
};

export default ThemeSwitcher;
