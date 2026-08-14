import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { THEMES, getNextTheme, getPreviousTheme } from '../lib/themeManager';

const ThemeSwitcher = ({ currentTheme, onThemeChange }) => {
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
          p-2 rounded-full transition-all duration-200
          ${currentTheme === THEMES.GALAXY 
            ? 'text-[#6c7b95] hover:text-[#b8bfde] hover:bg-[#2d3561]/30 bg-[#0f1642]/20' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 bg-white/20'
          }
        `}
        title={`Switch to ${getThemeName(getPreviousTheme(currentTheme))} theme`}
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
          p-2 rounded-full transition-all duration-200
          ${currentTheme === THEMES.GALAXY 
            ? 'text-[#6c7b95] hover:text-[#b8bfde] hover:bg-[#2d3561]/30 bg-[#0f1642]/20' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 bg-white/20'
          }
        `}
        title={`Switch to ${getThemeName(getNextTheme(currentTheme))} theme`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </motion.button>
    </>
  );
};

export default ThemeSwitcher;
