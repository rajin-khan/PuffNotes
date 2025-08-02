// src/components/KeyboardShortcutsModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  // ... (shortcut data remains unchanged)
  { action: 'Toggle Editor', keys: 'Cmd/Ctrl + .' },
  { action: 'Toggle Preview', keys: 'Cmd/Ctrl + P' },
  { action: 'Toggle Focus Mode', keys: 'Cmd/Ctrl + Shift + F' },
  { action: 'Beautify Note', keys: 'Cmd/Ctrl + Enter' },
  { action: 'Open Folder/Notes', keys: 'Cmd/Ctrl + O' },
  { action: 'New Note', keys: 'Cmd/Ctrl + K' },
  { action: 'Save Note', keys: 'Cmd/Ctrl + S' },
  { action: 'Export PDF', keys: 'Cmd/Ctrl + E' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose, theme = 'default' }) {
  if (!isOpen) return null;

  const isDefaultTheme = theme === 'default';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`border rounded-xl shadow-2xl p-8 pt-6 w-full max-w-sm text-left font-serif relative overflow-y-auto max-h-[90vh] ${isDefaultTheme ? 'bg-white border-[#e6ddcc]' : 'bg-[#181A2A] border-gray-700'}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={`absolute top-3 right-3 transition ${isDefaultTheme ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            <h2 className={`text-xl mb-4 font-regular flex items-center gap-2 ${isDefaultTheme ? 'text-[#1a1a1a]' : 'text-gray-100'}`}>
              <Keyboard size={20} />
              Keyboard Shortcuts
            </h2>

            <div className={`space-y-2 text-sm ${isDefaultTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              {shortcuts.map((shortcut) => {
                const keyParts = shortcut.keys.split(' + ');

                return (
                  <div key={shortcut.action} className={`flex justify-between items-center border-b pb-1.5 min-h-[2.5rem] ${isDefaultTheme ? 'border-gray-100' : 'border-gray-700/50'}`}>
                    <span>{shortcut.action}</span>
                    <span className="text-right flex items-center space-x-1">
                      {keyParts.map((part, index) => (
                        <React.Fragment key={index}>
                          <code className={`inline-block px-2 py-1 rounded-md border text-[0.85em] leading-none align-middle shadow-sm font-sans ${isDefaultTheme ? 'bg-white border-gray-300 text-gray-700' : 'bg-gray-900/50 border-gray-600 text-gray-300'}`}>{part.trim()}</code>
                          {index < keyParts.length - 1 && (
                            <span className={`${isDefaultTheme ? 'text-gray-400' : 'text-gray-500'} mx-0.5`}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className={`mt-6 w-full text-center px-5 py-1.5 text-sm rounded-full transition ${isDefaultTheme ? 'bg-[#fff7ee] border border-[#e0ddd5] hover:bg-[#f0e9df] text-gray-700' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300'}`}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}