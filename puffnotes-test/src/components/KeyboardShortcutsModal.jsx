// src/components/KeyboardShortcutsModal.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react'; // Import Keyboard icon

const shortcuts = [
  { action: 'Toggle Editor', keys: 'Cmd/Ctrl + .' },
  { action: 'Toggle Preview', keys: 'Cmd/Ctrl + P' },
  { action: 'Toggle Focus Mode', keys: 'Cmd/Ctrl + F' },
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
          className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4" // Increased z-index slightly
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close on overlay click
        >
          <motion.div
            className="bg-white border border-[#e6ddcc] rounded-xl shadow-2xl p-8 pt-6 w-full max-w-sm text-left font-serif relative overflow-y-auto max-h-[90vh]" // Adjusted max-w, text-align
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
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
              {shortcuts.map((shortcut) => (
                <div key={shortcut.action} className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                  <span>{shortcut.action}</span>
                  <span className="text-right">
                    <code>{shortcut.keys.split(' + ')[0]}</code> + <code>{shortcut.keys.split(' + ')[1]}</code>
                  </span>
                </div>
              ))}
            </div>

            {/* Style for the code tags - Simple production version */}
            <style jsx global>{`
              .shortcuts-modal-content code {
                display: inline-block; /* Prevents weird wrapping */
                background-color: #f3f4f6; /* bg-gray-100 */
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid #e5e7eb; /* border-gray-200 */
                font-size: 0.9em;
                color: #4b5563; /* text-gray-600 */
                margin-left: 2px; /* Add slight spacing */
              }
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