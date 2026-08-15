// src/components/KeyboardShortcutsModal.jsx
import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { THEMES } from '../lib/themeManager';
import { ModalPresence } from './ModalMotion';

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

export default function KeyboardShortcutsModal({ isOpen, onClose, theme = THEMES.WARM }) {
  return (
    <ModalPresence
      isOpen={isOpen}
      kind="shortcuts"
      theme={theme}
      onBackdropClick={onClose}
      panelClassName={`border rounded-xl shadow-2xl p-8 pt-6 w-full max-w-sm text-left font-serif relative overflow-y-auto max-h-[90vh] ${theme === THEMES.GALAXY ? 'bg-[#0f1642] border-[#2d3561]' : 'bg-white border-[#e6ddcc]'} ${theme === THEMES.KOMOREBI ? 'komorebi-modal-surface' : ''}`}
    >
            <button
              onClick={onClose}
              className={`absolute top-3 right-3 transition ${theme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
            <h2 className={`text-xl mb-4 font-regular flex items-center gap-2 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
              <Keyboard size={20} />
              Keyboard Shortcuts
            </h2>

            <div className={`space-y-2 text-sm ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-700'}`}>
              {shortcuts.map((shortcut) => {
                const keyParts = shortcut.keys.split(' + ');

                return (
                  <div key={shortcut.action} className={`flex justify-between items-center border-b pb-1.5 min-h-[2.5rem] ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-100'}`}>
                    <span>{shortcut.action}</span>
                    <span className="text-right flex items-center space-x-1">
                      {keyParts.map((part, index) => (
                        <React.Fragment key={index}>
                          <code className={theme === THEMES.KOMOREBI ? 'bg-[#44342a] border border-[#685541] text-[#f4ebd7]' : ''}>{part.trim()}</code>
                          {index < keyParts.length - 1 && (
                            <span className={`mx-0.5 ${theme === THEMES.GALAXY ? 'text-[#6c7b95]' : 'text-gray-400'}`}>+</span>
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
              className={`mt-6 w-full text-center px-5 py-1.5 text-sm border rounded-full transition ${theme === THEMES.GALAXY ? 'bg-[#2d3561] border-[#4a5178] text-[#e8eaf6] hover:bg-[#9b59b6]' : 'bg-[#fff7ee] border-[#e0ddd5] text-gray-700 hover:bg-[#f0e9df]'}`}
            >
              Close
            </button>
    </ModalPresence>
  );
}
