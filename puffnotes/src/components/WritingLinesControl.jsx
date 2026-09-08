import { Rows3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { THEMES } from '../lib/themeManager';

export default function WritingLinesControl({ light = false, value, onChange, theme }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      aria-label={value ? 'Hide writing lines' : 'Show writing lines'}
      title={value ? 'Hide Writing Lines' : 'Show Writing Lines'}
      className={`opacity-60 hover:opacity-100 transition p-1 flex-shrink-0 ${light ? 'text-[#4f566b] hover:text-[#20263a]' : theme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-500 hover:text-gray-800'}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Rows3 size={17} strokeWidth={1.5} aria-hidden="true" />
    </motion.button>
  );
}
