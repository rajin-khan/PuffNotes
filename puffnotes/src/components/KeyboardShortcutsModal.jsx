// src/components/KeyboardShortcutsModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { action: 'Toggle Editor', keys: 'Cmd/Ctrl + .' },
  { action: 'Toggle Preview', keys: 'Cmd/Ctrl + P' },
  { action: 'Toggle Focus Mode', keys: 'Cmd/Ctrl + Shift + F' },
  { action: 'Beautify Note', keys: 'Cmd/Ctrl + Enter' },
  { action: 'Open Folder/Notes', keys: 'Cmd/Ctrl + O' },
  { action: 'New Note', keys: 'Cmd/Ctrl + K' },
  { action: 'Save Note', keys: 'Cmd/Ctrl + S' },
  { action: 'Export PDF', keys: 'Cmd/Ctrl + E' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

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
            className="bg-white border border-[#e6ddcc] rounded-xl shadow-2xl p-8 pt-6 w-full max-w-sm text-left font-serif relative overflow-y-auto max-h-[90vh]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl text-[#1a1a1a] mb-4 font-regular flex items-center gap-2">
              <Keyboard size={20} />
              Keyboard Shortcuts
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              {shortcuts.map((shortcut) => {
                const keyParts = shortcut.keys.split(' + ');

                return (
                  <div key={shortcut.action} className="flex justify-between items-center border-b border-gray-100 pb-1.5 min-h-[2.5rem]"> {/* Added min-height for alignment */}
                    <span>{shortcut.action}</span>
                    <span className="text-right flex items-center space-x-1"> {/* Use flex for alignment */}
                      {keyParts.map((part, index) => (
                        <React.Fragment key={index}>
                          <code>{part.trim()}</code>
                          {/* Render the separator outside the code tag */}
                          {index < keyParts.length - 1 && (
                            <span className="text-gray-400 mx-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Updated styles for the code tags */}
            <style jsx global>{`
              .shortcuts-modal-content code {
                display: inline-block;
                background-color: #ffffff; /* White background */
                padding: 4px 8px; /* Slightly more padding */
                border-radius: 6px; /* More rounded corners */
                border: 1px solid #d1d5db; /* border-gray-300 */
                box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05); /* Subtle shadow */
                font-size: 0.85em; /* Slightly smaller font */
                color: #374151; /* text-gray-700 */
                line-height: 1; /* Ensure tight line height */
                vertical-align: middle; /* Align with '+' */
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; /* Use system UI font */
              }
              /* Ensure parent has the class for scoping */
              .shortcuts-modal-content { display: none; }
            `}</style>
            {/* Add class to parent div to scope the style */}
            <div className="shortcuts-modal-content hidden"></div>

            <button
              onClick={onClose}
              className="mt-6 w-full text-center px-5 py-1.5 text-sm bg-[#fff7ee] border border-[#e0ddd5] rounded-full hover:bg-[#f0e9df] transition text-gray-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}