// src/components/SettingsModal.jsx
import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, KeyRound, AlertTriangle, Check, Wand2, Palette, Monitor, Info } from 'lucide-react';
import { THEMES } from '../lib/themeManager';

const themeData = {
  [THEMES.WARM]: {
    name: 'Puff', // Puff means warm
    description: 'Cozy and inviting with warm tones',
    colors: ['#fdf6ec', '#9a8c73', '#e6ddcc'],
    video: '/puff.mp4'
  },
  [THEMES.GALAXY]: {
    name: 'Astralia', // Astralia means galaxy
    description: 'Cosmic and mysterious with deep blues',
    colors: ['#0a0e27', '#9b59b6', '#4a5178'],
    video: '/galaxy.webm'
  }
};

export default function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange, userApiKey, onSaveApiKey, theme = THEMES.WARM }) {
  const [activeTab, setActiveTab] = useState('themes');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const [localApiKey, setLocalApiKey] = useState(userApiKey || '');
  const apiKeyInputRef = useRef(null);

  // Force video reload when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          video.load();
          video.play().catch(err => {
            console.warn('Video autoplay failed:', err);
          });
        });
      }, 100);
    }
  }, [isOpen, activeTab]);

  const handleSaveApiKey = (key) => {
    const trimmedKey = key ? key.trim() : '';
    onSaveApiKey(trimmedKey);
    setApiKeyError(false);
    setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.');
    setTimeout(() => setApiKeySaveFeedback(''), 2500);
  };

  const handleThemeSelect = (themeKey) => {
    onThemeChange(themeKey);
  };

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
            className={`border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] text-left font-serif relative overflow-hidden ${theme === THEMES.GALAXY ? 'bg-[#0f1642] border-[#2d3561]' : 'bg-white border-[#e6ddcc]'}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`}>
              <h2 className={`text-2xl font-medium ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                Settings
              </h2>
              <button
                onClick={onClose}
                className={`transition ${theme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className={`flex border-b ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`}>
              <button
                onClick={() => setActiveTab('themes')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'themes'
                    ? theme === THEMES.GALAXY
                      ? 'text-[#e8eaf6] border-b-2 border-[#9b59b6]'
                      : 'text-[#1a1a1a] border-b-2 border-[#9a8c73]'
                    : theme === THEMES.GALAXY
                    ? 'text-[#8b9dc3] hover:text-[#e8eaf6]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Palette size={16} />
                Themes
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'ai'
                    ? theme === THEMES.GALAXY
                      ? 'text-[#e8eaf6] border-b-2 border-[#9b59b6]'
                      : 'text-[#1a1a1a] border-b-2 border-[#9a8c73]'
                    : theme === THEMES.GALAXY
                    ? 'text-[#8b9dc3] hover:text-[#e8eaf6]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Wand2 size={16} />
                AI Settings
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'about'
                    ? theme === THEMES.GALAXY
                      ? 'text-[#e8eaf6] border-b-2 border-[#9b59b6]'
                      : 'text-[#1a1a1a] border-b-2 border-[#9a8c73]'
                    : theme === THEMES.GALAXY
                    ? 'text-[#8b9dc3] hover:text-[#e8eaf6]'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Info size={16} />
                About
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'themes' && (
                  <motion.div
                    key="themes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-medium mb-4 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                        Choose Your Theme
                      </h3>
                      <p className={`text-sm mb-6 ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                        Select a theme that matches your mood and style. Each theme includes a unique background video and color palette.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(themeData).map(([themeKey, themeInfo]) => (
                          <motion.div
                            key={themeKey}
                            className={`relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden ${
                              currentTheme === themeKey
                                ? theme === THEMES.GALAXY
                                  ? 'border-[#9b59b6] bg-[#2d3561]/30'
                                  : 'border-[#9a8c73] bg-[#fff7ee]'
                                : theme === THEMES.GALAXY
                                ? 'border-[#4a5178] hover:border-[#6c5ce7]'
                                : 'border-[#e6ddcc] hover:border-[#d4c4a8]'
                            }`}
                            onClick={() => handleThemeSelect(themeKey)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Video Preview */}
                            <div className="relative h-32 bg-black">
                              <video
                                key={themeKey}
                                className="w-full h-full object-cover relative z-10"
                                muted
                                loop
                                playsInline
                                preload="auto"
                                onError={(e) => {
                                  console.warn(`Failed to load video for ${themeKey}:`, e);
                                  e.target.style.display = 'none';
                                }}
                                onLoadStart={() => {
                                  console.log(`Loading video for ${themeKey}: ${themeInfo.video}`);
                                }}
                                onCanPlay={(e) => {
                                  console.log(`Video can play for ${themeKey}`);
                                  e.target.play().catch(err => {
                                    console.warn(`Autoplay failed for ${themeKey}:`, err);
                                  });
                                }}
                                onLoadedData={(e) => {
                                  console.log(`Video data loaded for ${themeKey}`);
                                  e.target.play().catch(err => {
                                    console.warn(`Autoplay failed for ${themeKey}:`, err);
                                  });
                                }}
                                src={themeInfo.video}
                              />
                              {/* Fallback background color if video fails */}
                              <div 
                                className="absolute inset-0 w-full h-full z-0"
                                style={{ backgroundColor: themeInfo.colors[0] }}
                              />
                              <div className="absolute inset-0 bg-black/20 z-20" />
                              
                              {/* Color Palette Dots */}
                              <div className="absolute top-3 right-3 flex gap-1 z-30">
                                {themeInfo.colors.map((color, index) => (
                                  <div
                                    key={index}
                                    className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              
                              {/* Selected Indicator */}
                              {currentTheme === themeKey && (
                                <div className="absolute top-3 left-3 z-30">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    theme === THEMES.GALAXY ? 'bg-[#9b59b6]' : 'bg-[#9a8c73]'
                                  }`}>
                                    <Check size={14} className="text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Theme Info */}
                            <div className="p-4">
                              <h4 className={`font-medium mb-1 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                                {themeInfo.name}
                              </h4>
                              <p className={`text-sm ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                                {themeInfo.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-medium mb-4 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                        AI Configuration
                      </h3>
                      <p className={`text-sm mb-6 ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                        Configure your AI settings for the best experience. Add your own Groq API key for unlimited usage.
                      </p>
                      
                      <AnimatePresence>
                        {apiKeyError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4 flex items-center gap-2"
                          >
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className={`border rounded-lg p-4 ${theme === THEMES.GALAXY ? 'border-[#2d3561] bg-[#0d1235]' : 'border-[#e6ddcc] bg-[#fdfbf7]'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <KeyRound size={16} className={theme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-600'} />
                          <span className={`font-medium ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                            Personal AI Key (Recommended)
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-4 ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                          Add your free Groq API key for unlimited AI use. Get one in seconds at{' '}
                          <a 
                            href="https://console.groq.com/keys" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`underline hover:opacity-80 ${theme === THEMES.GALAXY ? 'text-[#9b59b6]' : 'text-[#9a8c73]'}`}
                          >
                            Groq Console
                          </a>.
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <input
                            ref={apiKeyInputRef}
                            type="password"
                            placeholder="Paste Groq API Key (gsk_...)"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            className={`flex-grow px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 font-mono ${
                              theme === THEMES.GALAXY
                                ? 'border-[#4a5178] bg-[#0f1642] text-[#e8eaf6] focus:ring-[#9b59b6]'
                                : 'border-gray-300 bg-white text-gray-800 focus:ring-[#9a8c73]'
                            }`}
                          />
                          <button
                            onClick={() => handleSaveApiKey(localApiKey)}
                            className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                              theme === THEMES.GALAXY
                                ? 'border-[#4a5178] bg-[#2d3561] text-[#e8eaf6] hover:bg-[#9b59b6]'
                                : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Save
                          </button>
                        </div>
                        
                        <AnimatePresence>
                          {apiKeySaveFeedback && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-green-600 text-sm mt-2"
                            >
                              {apiKeySaveFeedback}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className={`text-lg font-medium mb-4 ${theme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`}>
                        About puffnotes
                      </h3>
                      
                      <div className={`border rounded-lg p-6 ${theme === THEMES.GALAXY ? 'border-[#2d3561] bg-[#0d1235]' : 'border-[#e6ddcc] bg-[#fdfbf7]'}`}>
                        <p className={`text-sm leading-relaxed mb-4 ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                          A serene space for note-taking — simple, offline, and distraction-free.
                        </p>
                        
                        <div className="flex items-center gap-2 mb-4">
                          <Wand2 size={16} className={theme === THEMES.GALAXY ? 'text-[#9b59b6]' : 'text-[#9a8c73]'} />
                          <p className={`text-sm ${theme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}>
                            Click the wand to magically expand and beautify your notes using AI.
                          </p>
                        </div>
                        
                        <div className={`border-t pt-4 ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`}>
                          <p className={`text-xs italic mb-2 ${theme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-[#8c6e54]'}`}>
                            No accounts. No cloud. Just you and your thoughts.
                          </p>
                          <p className={`text-xs ${theme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-[#9c8063]'}`}>
                            Lovingly crafted by{' '}
                            <a 
                              href="https://rajinkhan.com" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`underline hover:opacity-80 transition ${theme === THEMES.GALAXY ? 'text-[#9b59b6]' : 'text-[#9a8c73]'}`}
                            >
                              Rajin Khan
                            </a>
                          </p>
                        </div>
                        
                        <div className={`mt-4 pt-4 border-t ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`}>
                          <p className={`text-[10px] ${theme === THEMES.GALAXY ? 'text-[#6c7b95]' : 'text-gray-500'} opacity-50`}>
                            Background videos via{' '}
                            <a 
                              href="https://moewalls.com" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="underline hover:opacity-80"
                            >
                              MoeWalls
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between p-6 border-t ${theme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`}>
              <p className={`text-xs ${theme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-500'}`}>
                Settings are automatically saved
              </p>
              <button
                onClick={onClose}
                className={`px-6 py-2 text-sm border rounded-full transition-colors ${
                  theme === THEMES.GALAXY
                    ? 'border-[#4a5178] bg-[#2d3561] text-[#e8eaf6] hover:bg-[#9b59b6]'
                    : 'border-[#e0ddd5] bg-[#fff7ee] text-gray-700 hover:bg-[#f0e9df]'
                }`}
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
