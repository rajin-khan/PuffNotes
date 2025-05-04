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
  { action: 'Toggle Shortcuts', keys: 'Cmd/Ctrl + /' }, // Added shortcut for modal itself
];

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // Outer overlay (standard semi-transparent black)
          className="fixed inset-0 z-[70] bg-black bg-opacity-60 flex items-center justify-center p-4" // Increased z-index slightly
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close on overlay click
        >
          {/* Inner Modal Content - Apply Glassmorphism */}
          <motion.div
            // --- MODIFIED CLASSES for Glassmorphism ---
            className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-8 pt-6 w-full max-w-sm text-left font-serif relative overflow-y-auto max-h-[90vh]" // Adjusted bg, added blur, adjusted border/rounding
            // --- END MODIFIED CLASSES ---
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Close button - adjusted text color */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            {/* Title */}
            <h2 className="text-xl text-[#1a1a1a] mb-4 font-regular flex items-center gap-2">
              <Keyboard size={20} />
              Keyboard Shortcuts
            </h2>

            {/* Shortcuts List */}
            <div className="space-y-2 text-sm text-gray-700">
              {shortcuts.map((shortcut) => {
                const keyParts = shortcut.keys.split(' + ');

                return (
                  // --- MODIFIED CLASSES for border ---
                  <div key={shortcut.action} className="flex justify-between items-center border-b border-white/30 pb-1.5 min-h-[2.5rem]"> {/* Changed border */}
                  {/* --- END MODIFIED CLASSES --- */}
                    <span>{shortcut.action}</span>
                    <span className="text-right flex items-center space-x-1">
                      {keyParts.map((part, index) => (
                        <React.Fragment key={index}>
                          <code>{part.trim()}</code>
                          {index < keyParts.length - 1 && (
                            // Adjusted separator color/style
                            <span className="text-gray-500 mx-0.5">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Updated styles for the code tags (Glassmorphism) */}
            <style jsx global>{`
              .shortcuts-modal-content-glass code {
                display: inline-block;
                /* Slightly translucent white background */
                background-color: rgba(255, 255, 255, 0.5);
                padding: 4px 8px;
                border-radius: 6px;
                 /* Translucent white border */
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
                font-size: 0.85em;
                /* Darker text for contrast on light bg */
                color: #1f2937; /* text-gray-800 */
                line-height: 1;
                vertical-align: middle;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
              }
              /* Ensure parent has the class for scoping */
              .shortcuts-modal-content-glass { display: none; }
            `}</style>
            {/* Add class to parent div to scope the style */}
            <div className="shortcuts-modal-content-glass hidden"></div>

            {/* Close Button - Style adjusted for theme */}
            <button
              onClick={onClose}
              // --- MODIFIED CLASSES for Glassmorphism ---
              className="mt-6 w-full text-center px-5 py-1.5 text-sm bg-white/50 border border-white/30 rounded-full hover:bg-white/70 transition text-gray-700" // Adjusted style
              // --- END MODIFIED CLASSES ---
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}