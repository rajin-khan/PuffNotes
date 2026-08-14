// src/components/OnlineSetupModal.jsx
import { motion } from 'framer-motion';
import { Check, Loader } from 'lucide-react';
import { THEMES } from '../lib/themeManager';

export default function OnlineSetupModal({ steps, theme = THEMES.WARM }) {
  return (
    <motion.div
      data-puffnotes-theme={theme}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`font-serif rounded-lg p-8 shadow-2xl text-center ${theme === THEMES.GALAXY ? 'bg-[#0f1642] border border-[#2d3561]' : theme === THEMES.KOMOREBI ? 'bg-[#352820] border border-[#685541]' : 'bg-[#fdf6ec]'}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className={`text-2xl mb-6 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : theme === THEMES.KOMOREBI ? 'text-[#f4ebd7]' : 'text-gray-800'}`}>Setting up your space...</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              className={`flex items-center space-x-4 ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : theme === THEMES.KOMOREBI ? 'text-[#dfd2b9]' : 'text-gray-600'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.3 }}
            >
              {step.status === 'loading' && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader className={theme === THEMES.GALAXY ? "text-[#8b9dc3]" : theme === THEMES.KOMOREBI ? "text-[#b7cd9b]" : "text-gray-400"} size={20} />
                </motion.div>
              )}
              {step.status === 'complete' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="text-green-500" size={20} />
                </motion.div>
              )}
              <span>{step.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
