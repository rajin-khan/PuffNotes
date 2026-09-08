// src/components/OfflineApp.jsx
import { useCallback, useState, useEffect, useRef } from 'react';
import useFileSystemAccess from '../hooks/useFileSystemAccess';
import {
  Trash2, FilePlus, FolderOpen, ChevronDown, ChevronUp, X, Wand2, Save, Check,
  RotateCw, XCircle, CheckCircle, Info, KeyRound, AlertTriangle,
  Eye, Pen, Keyboard, Home, HelpCircle, Settings
} from 'lucide-react';
import { createNoteOperations } from '../lib/noteOperations';
import { runBeautifyWorkflow } from '../lib/beautifyWorkflow';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import MarkdownPreview from './MarkdownPreview';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import OnboardingModal from './OnboardingModal';
import ThemeSwitcher from './ThemeSwitcher';
import SettingsModal from './SettingsModal';
import WritingLinesControl from './WritingLinesControl';
import useWritingLines from '../hooks/useWritingLines';
import HandwritingEditor from './HandwritingEditor';
import NotePageSwitch from './NotePageSwitch';
import { ModalPresence } from './ModalMotion';
import ThemeBackground from './ThemeBackground';
import { THEMES, getStoredTheme, setStoredTheme } from '../lib/themeManager';
import {
  createHandwritingDocument, hasHandwriting, normalizeHandwritingDocument,
} from '../lib/handwriting';

const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1';
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

const offlineOnboardingSteps = [
  {
    title: "Welcome to Your Editor",
    description: "This is your creative space. Give your notes a name. Everything's saved automatically to your chosen folder.",
    video: "/videos/1.mp4",
  },
  {
    title: "AI-Powered Magic",
    description: (
      <>
        Click the <Wand2 size={14} className="inline-block text-yellow-300 -mt-1" /> wand to magically transform your rough notes into polished, detailed documents.
      </>
    ),
    video: "/videos/2.mp4",
  },
    {
    title: "Preview Your Markdown",
    description: "Use Markdown for formatting. Toggle the eye icon to see a clean, beautiful preview of your note.",
    video: "/videos/3.mp4",
  },
  {
    title: "Export to PDF",
    description: "Need to share or print? You can instantly export your beautifully formatted notes as a PDF document.",
    video: "/videos/4.mp4",
  },
  {
    title: "Focus When You Need It",
    description: "Hide the editor with the arrow button to enter a distraction-free focus mode or to simply admire the view.",
    video: "/videos/5.mp4",
  },
  {
    title: "Your Personal AI Key",
    description: "The default AI key has limits. Add your own free Groq API key in the Info panel for unlimited, private use.",
    video: "/videos/6.mp4",
  },
];

export default function OfflineApp({ onGoToLanding }) {
  const shouldReduceMotion = useReducedMotion();
  const shouldShowOnboardingOnEntry = useRef(
    !localStorage.getItem('puffnotes_onboarding_offline_complete')
  ).current;
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [currentTheme, setCurrentTheme] = useState(() => 
    getStoredTheme() || THEMES.WARM
  );

  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '');
  const [_showApiKeyInput, _setShowApiKeyInput] = useState(false);
  const [_apiKeyError, setApiKeyError] = useState(false);
  const [_apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const apiKeyInputRef = useRef(null);
  const autoSaveContextRef = useRef(null);
  const operationsRef = useRef(createNoteOperations());
  const [deletingNote, setDeletingNote] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [note, setNote] = useState("");
  const [noteName, setNoteName] = useState("untitled");
  const [fileList, setFileList] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [previewNote, setPreviewNote] = useState("");
  const [showBeautifyControls, setShowBeautifyControls] = useState(false);
  const [originalNote, setOriginalNote] = useState("");
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [writingLines, updateWritingLines] = useWritingLines();
  const [editorPage, setEditorPage] = useState('text');
  const [handwriting, setHandwriting] = useState(createHandwritingDocument);
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [activeFileName, setActiveFileName] = useState("");
  const hasCoveringModal = showSettingsModal || showShortcutsModal || showOnboarding || showFileModal;

  useEffect(() => {
    if (!shouldShowOnboardingOnEntry) return undefined;

    const onboardingTimer = window.setTimeout(
      () => setShowOnboarding(true),
      shouldReduceMotion ? 0 : 720,
    );
    return () => window.clearTimeout(onboardingTimer);
  }, [shouldReduceMotion, shouldShowOnboardingOnEntry]);
  
  const {
    folderHandle, pickFolder, saveNote,
    listFiles, loadNote, deleteNote, loadHandwriting, saveHandwriting,
  } = useFileSystemAccess();

  const handleFinishOnboarding = () => {
    localStorage.setItem('puffnotes_onboarding_offline_complete', 'true');
    setShowOnboarding(false);
  };

  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    setStoredTheme(newTheme);
  };

  const refreshFileList = useCallback(async () => operationsRef.current.run(async () => { if (folderHandle) { try { const files = await listFiles(); setFileList(files || []); } catch (err) { console.error("Failed to refresh file list:", err); setFileList([]); } } }), [folderHandle, listFiles]);
  const handleOpenFile = async (filename) => operationsRef.current.run(async () => {
    if (!filename) return;
    try {
      const [content, savedHandwriting] = await Promise.all([
        loadNote(filename),
        loadHandwriting(filename),
      ]);
      if (content === null) {
        alert(`Could not load file: ${filename}. Folder permissions might have changed.`);
        return;
      }
      setNote(content);
      setHandwriting(normalizeHandwritingDocument(savedHandwriting));
      setNoteName(filename.replace(/\.md$/, ''));
      setActiveFileName(filename);
      setIsFirstSave(false);
      setShowFileModal(false);
      setPreviewNote('');
      setShowBeautifyControls(false);
      setOriginalNote('');
      setIsPreviewMode(false);
      setEditorPage('text');
    } catch (err) {
      console.error('Error opening file:', err);
      alert(`Failed to open file: ${filename}. Error: ${err.message}`);
    }
  });
  const handleNewNote = useCallback(() => {
    if (operationsRef.current.deleting) return;
    setNote('');
    setHandwriting(createHandwritingDocument());
    setEditorPage('text');
    setNoteName('untitled');
    setActiveFileName('');
    setIsFirstSave(true);
    setPreviewNote('');
    setShowBeautifyControls(false);
    setOriginalNote('');
    setIsPreviewMode(false);
  }, []);
  const handleSave = useCallback(async () => operationsRef.current.run(async () => {
    if (!folderHandle) {
      try {
        if (!await pickFolder()) return;
      } catch (err) {
        console.error('Error picking folder:', err);
        if (err.name !== 'AbortError') alert('Could not get permission to access the folder.');
        return;
      }
    }
    if (!noteName.trim()) {
      alert('Please enter a name for your note before saving.');
      return;
    }
    const filename = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
    try {
      const savedAs = await saveNote(filename, note, isFirstSave);
      if (savedAs) {
        await saveHandwriting(savedAs, handwriting);
        setNoteName(savedAs.replace(/\.md$/, ''));
        setActiveFileName(savedAs);
        setIsFirstSave(false);
        await refreshFileList();
        setSaveIndicator(true);
        setTimeout(() => setSaveIndicator(false), 1500);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert(`Failed to save note: ${filename}. Error: ${err.message}`);
    }
  }), [folderHandle, handwriting, isFirstSave, note, noteName, pickFolder, refreshFileList, saveHandwriting, saveNote]);

  const handleDeleteNote = async (filename) => {
    if (operationsRef.current.busy) {
      alert('Please wait for the current save, file load, or AI request to finish, then try again.');
      return;
    }
    if (!window.confirm(`Permanently delete "${filename}" from this folder? This cannot be undone.`)) return;
    try {
      await operationsRef.current.remove(async () => {
        setDeletingNote(filename);
        if (!await deleteNote(filename)) throw new Error('Could not delete the note. Check your folder permissions and try again.');
        if (activeFileName === filename) {
          operationsRef.current.invalidate();
          autoSaveContextRef.current = { ...autoSaveContextRef.current, isFirstSave: true, activeFileName: '', note: '' };
          setNote(''); setNoteName('untitled'); setActiveFileName(''); setIsFirstSave(true);
          setHandwriting(createHandwritingDocument()); setEditorPage('text');
          setPreviewNote(''); setOriginalNote(''); setShowBeautifyControls(false); setIsPreviewMode(false);
        }
        setFileList(files => files.filter(item => item !== filename));
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingNote(null);
    }
  };

  const handleBeautify = useCallback(async (isRegeneration = false) => operationsRef.current.run(() => runBeautifyWorkflow({
    isRegeneration, originalNote, note, userApiKey, defaultApiKey: DEFAULT_GROQ_API_KEY,
    apiKeyInputRef, setApiKeyError, setApiKeySaveFeedback, setIsBeautifying,
    setIsPreviewMode, setOriginalNote, setPreviewNote, setShowBeautifyControls,
    setShowSettingsModal,
  })), [note, originalNote, userApiKey]);
  const acceptBeautified = () => { setNote(previewNote); setPreviewNote(""); setOriginalNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const rejectBeautified = () => { setPreviewNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const regenerateBeautified = () => { handleBeautify(true); };
  const handleSaveUserApiKey = (key) => { const trimmedKey = key ? key.trim() : ''; localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey); setUserApiKey(trimmedKey); setApiKeyError(false); setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.'); setTimeout(() => setApiKeySaveFeedback(''), 2500); };
  const handleFolderButton = useCallback(async () => { if (operationsRef.current.deleting) return; if (!folderHandle) { try { await pickFolder(); } catch (err) { if (err.name !== 'AbortError') { console.error("Error picking folder:", err); alert("Could not get permission to access the folder."); } } } else { setShowFileModal((prev) => !prev); if (!showFileModal) { refreshFileList(); } } }, [folderHandle, pickFolder, refreshFileList, showFileModal]);
  const toggleFocusMode = useCallback(() => { setFocusMode(prev => !prev); }, []);
  const togglePreviewMode = () => { if (showBeautifyControls) return; setIsPreviewMode(prev => !prev); };
  const handleExportPdf = useCallback(async () => {
    const { exportNoteToPdf } = await import('../lib/exportNoteToPdf');
    return exportNoteToPdf({
      contentToExport: showBeautifyControls ? previewNote : note,
      currentTheme, handwriting, isExportingPdf, noteName, setIsExportingPdf,
      showWritingLines: writingLines,
    });
  }, [currentTheme, handwriting, isExportingPdf, note, noteName, previewNote, showBeautifyControls, writingLines]);
  autoSaveContextRef.current = { activeFileName, deleteNote, folderHandle, handwriting, isFirstSave, note, noteName, refreshFileList, saveHandwriting, saveNote, showBeautifyControls };
  useEffect(() => {
    const revision = operationsRef.current.revision;
    const autoSave = () => operationsRef.current.run(async () => {
      const latest = autoSaveContextRef.current;
      if (latest.isFirstSave || !latest.folderHandle || !latest.noteName.trim() || latest.showBeautifyControls) return;
      const newFilename = latest.noteName.endsWith('.md') ? latest.noteName : `${latest.noteName}.md`;
      try {
        if (newFilename === latest.activeFileName) {
          await latest.saveNote(latest.activeFileName, latest.note, false);
          await latest.saveHandwriting(latest.activeFileName, latest.handwriting);
          return;
        }
        const savedAs = await latest.saveNote(newFilename, latest.note, true);
        if (!savedAs) return;
        await latest.saveHandwriting(savedAs, latest.handwriting);
        if (latest.activeFileName) await latest.deleteNote(latest.activeFileName);
        setNoteName(savedAs.replace(/\.md$/, ''));
        setActiveFileName(savedAs);
        await latest.refreshFileList();
      } catch (err) {
        console.error('Autosave failed:', err);
      }
    }, revision);
    const debounceTimeout = setTimeout(autoSave, 850);
    return () => clearTimeout(debounceTimeout);
  }, [deletingNote, handwriting, note, noteName]);
  useEffect(() => { if (folderHandle) { refreshFileList(); } else { setFileList([]); } }, [folderHandle, refreshFileList]);
  useEffect(() => { const handleKeyDown = (e) => { if (operationsRef.current.deleting) { e.preventDefault(); return; } const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0; const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey; const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName); if (isTyping && document.activeElement !== document.querySelector("textarea")) return; if (ctrlOrCmd && e.key === 'Enter') { e.preventDefault(); if (!isBeautifying && note.trim()) handleBeautify(false); } else if (ctrlOrCmd && e.key.toLowerCase() === 'p') { e.preventDefault(); if (!showBeautifyControls) setIsPreviewMode(prev => !prev); } else if (ctrlOrCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); handleExportPdf(); } else if (ctrlOrCmd && e.key.toLowerCase() === 'k') { e.preventDefault(); handleNewNote(); } else if (ctrlOrCmd && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); } else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFocusMode(); } else if (ctrlOrCmd && e.key.toLowerCase() === 'o') { e.preventDefault(); handleFolderButton(); } else if (ctrlOrCmd && e.key.toLowerCase() === '.') { setDropAnimationComplete(false); setIsEditorVisible(prev => !prev); } else if (ctrlOrCmd && e.key === '/') { setShowShortcutsModal(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [ note, isBeautifying, showBeautifyControls, handleBeautify, handleExportPdf, handleNewNote, handleSave, toggleFocusMode, handleFolderButton, setShowShortcutsModal ]);

  const drawingSurface = editorPage === 'handwriting' && !isPreviewMode;
  const drawingSurfaceColor = currentTheme === THEMES.GALAXY
    ? 'bg-[#f5f7ff]/95'
    : currentTheme === THEMES.KOMOREBI ? 'bg-[#f8f6ed]/95' : 'bg-[#fdfbf7]/95';
  const drawingInk = currentTheme === THEMES.GALAXY ? 'text-[#293047]' : 'text-[#443b32]';

  return (
    <>
      <AnimatePresence>
        {showOnboarding && <OnboardingModal steps={offlineOnboardingSteps} onFinish={handleFinishOnboarding} theme={currentTheme} />}
      </AnimatePresence>
      <motion.div
        data-app-stage="editor"
        data-puffnotes-theme={currentTheme}
        className={`min-h-screen ${currentTheme === THEMES.GALAXY ? 'bg-[#0a0e27]' : 'bg-[#fdf6ec]'} relative overflow-hidden transition-all duration-300 ${hasCoveringModal ? `blur-sm ${shouldReduceMotion ? '' : 'scale-105'}` : 'blur-0 scale-100'}`}
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          data-app-controls="utility"
          className="absolute left-3 top-3 z-50 flex items-center space-x-2 sm:left-4 sm:top-4"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.18 } }}
        >
          <motion.button onClick={onGoToLanding} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Back to Home" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Home size={17} strokeWidth={2} className="text-gray-200" />
          </motion.button>
          <motion.button onClick={() => setShowSettingsModal(true)} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Settings" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <Settings size={17} strokeWidth={2} className="text-gray-200" /> </motion.button> 
          <motion.button onClick={() => setShowShortcutsModal(true)} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Keyboard Shortcuts (Cmd+/)" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Keyboard size={17} strokeWidth={2} className="text-gray-200" />
          </motion.button>
        </motion.div>

        <motion.div
          data-app-controls="help"
          className="absolute bottom-4 left-4 z-50"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.26 } }}
        >
            <motion.button
                title="How does it work?"
                onClick={handleShowOnboarding}
                className="opacity-70 hover:opacity-90 transition p-2 rounded-full border border-gray-300 shadow-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <HelpCircle size={20} strokeWidth={2} className="text-gray-200" />
            </motion.button>
        </motion.div>

        {!window.showDirectoryPicker && ( <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow"> PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available. </div> )}
        <ThemeBackground
          theme={currentTheme}
          paused={hasCoveringModal}
          className="fixed inset-0 z-[10]"
        />

        {/* Theme Switcher - Fixed positioned on left and right edges */}
        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={handleThemeChange} />
        <motion.div
          data-app-controls="toolbar"
          className="absolute right-3 top-3 z-50 flex items-center space-x-2 sm:right-6 sm:top-4 sm:space-x-3"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.35, delay: shouldReduceMotion ? 0 : 0.22 } }}
        >
          <AnimatePresence> {(!folderHandle || isFirstSave) && !showSettingsModal && ( <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`me-3 hidden rounded-full px-4 py-1 font-serif text-sm shadow-sm min-[40rem]:block ${currentTheme === THEMES.GALAXY ? 'text-[#b8bfde] bg-[#2d3561] border border-[#4a5178]' : 'text-gray-600 bg-[#fff7ee] border border-[#e6ddcc]'}`}> {!folderHandle ? "Select a folder (Cmd/Ctrl + O)" : "Save Note (Cmd/Ctrl + S)"} </motion.span> )} </AnimatePresence>
          <div className={`flex items-center space-x-2 rounded-full border px-3 py-2 shadow-md transition-colors duration-500 sm:space-x-3 sm:px-4 ${currentTheme === THEMES.GALAXY ? 'border-[#4a5178] bg-[#0f1642]/80' : 'border-[#d4c4a8] bg-white/30'} ${currentTheme === THEMES.KOMOREBI ? 'komorebi-toolbar' : ''}`}>
            <button onClick={toggleFocusMode} className={`opacity-60 hover:opacity-100 transition ${focusMode ? (currentTheme === THEMES.GALAXY ? 'text-[#f39c12]' : 'text-orange-200') : (currentTheme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600')}`} title={focusMode ? "Exit Focus Mode" : "Focus Mode"}> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /> </svg> </button>
            <motion.button onClick={handleFolderButton} className={`opacity-60 hover:opacity-100 transition ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-400'}`} title={folderHandle ? "Open Notes Folder" : "Select Notes Folder"} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <FolderOpen size={20} /> </motion.button>
            {isFirstSave ? ( <motion.button onClick={handleSave} className={`opacity-60 transition ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-400'} ${!noteName.trim() ? 'cursor-not-allowed opacity-30' : 'hover:opacity-100'}`} title="Save Note" whileHover={noteName.trim() ? { scale: 1.1 } : {}} whileTap={noteName.trim() ? { scale: 0.95 } : {}} disabled={!noteName.trim()}> <Save size={20} /> </motion.button> ) : ( <motion.div animate={{ rotate: saveIndicator ? [0, 20, 0] : 0, scale: saveIndicator ? [1, 1.2, 1] : 1, color: saveIndicator ? (currentTheme === THEMES.GALAXY ? ["#8b9dc3", "#1abc9c", "#8b9dc3"] : currentTheme === THEMES.KOMOREBI ? ["#b7cd9b", "#f3d89e", "#b7cd9b"] : ["#6b7280", "#10b981", "#6b7280"]) : (currentTheme === THEMES.GALAXY ? "#8b9dc3" : currentTheme === THEMES.KOMOREBI ? "#b7cd9b" : "#9ca3af") }} transition={{ duration: 0.5 }} title="Note Autosaved"> <Check size={20} className="opacity-100" /> </motion.div> )}
            <motion.button onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }} className={`opacity-60 hover:opacity-100 transition ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-400'}`} title={isEditorVisible ? 'Hide Editor' : 'Show Editor'} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />} </motion.button>
          </div>
          <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} theme={currentTheme} />
          <SettingsModal 
            isOpen={showSettingsModal} 
            onClose={() => setShowSettingsModal(false)} 
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            userApiKey={userApiKey}
            onSaveApiKey={handleSaveUserApiKey}
            theme={currentTheme}
          />
        </motion.div>
        
        <ModalPresence
          isOpen={showFileModal && Boolean(folderHandle)}
          kind="notes"
          theme={currentTheme}
          onBackdropClick={() => { if (!operationsRef.current.deleting) setShowFileModal(false); }}
          panelClassName={`rounded-xl shadow-xl w-full max-w-xs max-h-[60vh] overflow-y-auto p-4 ${currentTheme === THEMES.GALAXY ? 'bg-[#0f1642] border border-[#2d3561]' : 'bg-white border border-[#e6ddcc]'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className={`font-serif text-lg ${currentTheme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-gray-800'}`}>Your Notes</h2>
            <motion.button onClick={() => { if (!operationsRef.current.deleting) setShowFileModal(false); }} className={`${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-500 hover:text-gray-800'}`} title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <X size={18} />
            </motion.button>
          </div>
          {deletingNote && <p role="status" className="px-2 py-1 text-xs opacity-60">Deleting note…</p>}
          {fileList.length === 0 ? (
            <p className={`text-sm italic px-2 py-1 ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-500'}`}>No markdown notes (.md) found in the selected folder.</p>
          ) : (
            <div className="space-y-1">
              {fileList.map((filename, index) => (
                <div key={filename} className="flex items-center gap-1">
                <motion.button disabled={Boolean(deletingNote)} onClick={() => handleOpenFile(filename)} className={`block min-w-0 flex-1 break-words w-full text-left text-sm font-mono px-2 py-1.5 rounded transition-colors duration-100 ${currentTheme === THEMES.GALAXY ? 'text-[#e8eaf6] hover:bg-[#2d3561]' : 'text-[#333] hover:bg-[#f8f6f2]'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 3 }} title={`Open ${filename}`}>
                  {filename.replace(/\.md$/, "")}
                </motion.button>
                <button type="button" onClick={() => handleDeleteNote(filename)}
                  disabled={Boolean(deletingNote)} aria-label={`Delete ${filename}`}
                  title={`Delete ${filename}`}
                  className={`shrink-0 rounded p-2 opacity-60 hover:opacity-100 hover:text-red-500 focus-visible:opacity-100 disabled:opacity-30 ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-500'}`}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
                </div>
              ))}
            </div>
          )}
          <button disabled={Boolean(deletingNote)} onClick={() => operationsRef.current.run(pickFolder)} className={`mt-4 w-full text-center text-xs underline py-1 ${currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-500 hover:text-gray-700'}`}>
            Change Folder
          </button>
        </ModalPresence>

        <AnimatePresence> {!isEditorVisible && dropAnimationComplete && ( <motion.div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}> <motion.div className={`relative after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-1 after:bg-inherit border-t rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer transition-colors duration-500 ${drawingSurface ? `${drawingSurfaceColor} border-black/10` : currentTheme === THEMES.GALAXY ? 'bg-[#0f1642] border-[#2d3561]' : 'bg-white border-[#e6ddcc]'} ${currentTheme === THEMES.KOMOREBI && !drawingSurface ? 'komorebi-editor-tab' : ''}`} onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }} whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}> <motion.span className={`font-serif text-lg tracking-tight ${drawingSurface ? drawingInk : currentTheme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`} animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 2, ease: "easeInOut" }}> puffnotes </motion.span> <span className={drawingSurface ? 'text-[#8a8177]' : currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-400'}>|</span> <span className={`font-serif text-sm max-w-[150px] sm:max-w-xs truncate ${drawingSurface ? drawingInk : currentTheme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-500'}`} title={noteName || "untitled"}> {noteName || "untitled"} </span> </motion.div> </motion.div> )} </AnimatePresence>

        <motion.div data-note-page-stage className="fixed bottom-0 left-0 right-0 z-20" initial={shouldReduceMotion ? false : { y: '100%' }} animate={{ y: isEditorVisible ? 0 : '101%' }} transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 35, mass: 0.8 }} onAnimationComplete={() => setDropAnimationComplete(true)}>
          <div data-note-page data-editor-page={editorPage} className={`relative mx-auto flex h-[88vh] max-w-full flex-col rounded-t-2xl p-4 shadow-2xl transition-colors duration-500 sm:h-[90vh] sm:max-w-3xl sm:p-6 ${drawingSurface ? drawingSurfaceColor : focusMode ? (currentTheme === THEMES.GALAXY ? 'bg-[#0d1235]/95' : 'bg-[#fdfbf7]/95') : (currentTheme === THEMES.GALAXY ? 'bg-[#0f1642]/95' : 'bg-white/95')} ${currentTheme === THEMES.KOMOREBI && !drawingSurface ? `komorebi-editor-surface ${focusMode ? 'komorebi-editor-focus' : ''}` : ''}`}>
            <motion.div className="mb-3 grid flex-shrink-0 grid-cols-[auto_1fr_auto] items-center gap-y-2 sm:mb-4 sm:flex sm:justify-between" animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: focusMode ? 'none' : 'auto' }}>
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <motion.h1 className={`font-serif text-xl tracking-tight sm:text-2xl ${drawingSurface ? drawingInk : currentTheme === THEMES.GALAXY ? 'text-[#e8eaf6]' : 'text-[#1a1a1a]'}`} whileHover={!focusMode ? { x: 2 } : {}}> puffnotes </motion.h1>
                {!focusMode && !isPreviewMode && <NotePageSwitch page={editorPage} onChange={setEditorPage} theme={currentTheme} />}
              </div>
              <div className="col-span-3 row-start-2 mx-0 flex min-w-0 items-center justify-center gap-2 sm:mx-4 sm:flex-1">
                 <motion.input type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)} className={`w-full max-w-[50%] border-b border-transparent bg-transparent text-center font-serif text-base outline-none transition-opacity duration-300 sm:max-w-[70%] sm:text-sm ${focusMode || isPreviewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${drawingSurface ? `${drawingInk} focus:border-[#8a8177]` : currentTheme === THEMES.GALAXY ? 'text-[#b8bfde] focus:border-[#9b59b6]' : 'text-gray-500 focus:border-gray-300'}`} placeholder="note name..." whileFocus={{ scale: 1.02 }} disabled={focusMode || isPreviewMode} />
                 {!showBeautifyControls && !focusMode && (note.trim() || hasHandwriting(handwriting)) && (
                     <motion.button onClick={togglePreviewMode} title={isPreviewMode ? "Edit Note" : "Preview Note"} className={`opacity-60 hover:opacity-100 transition p-1 flex-shrink-0 ${drawingSurface ? 'text-[#4f566b] hover:text-[#20263a]' : currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3] hover:text-[#e8eaf6]' : 'text-gray-500 hover:text-gray-800'}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                         {isPreviewMode ? <Pen size={18} /> : <Eye size={18} />}
                     </motion.button>
                  )}
                 {!focusMode && !isPreviewMode && <WritingLinesControl light={drawingSurface} value={writingLines} onChange={updateWritingLines} theme={currentTheme} />}
              </div>
              <div className={`col-start-3 flex flex-shrink-0 space-x-1 text-lg sm:space-x-4 ${drawingSurface ? drawingInk : currentTheme === THEMES.GALAXY ? 'text-[#8b9dc3]' : 'text-gray-600'}`}>
                <motion.button title="Export as PDF" onClick={handleExportPdf} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`p-1 disabled:opacity-30 ${drawingSurface ? 'hover:text-black' : currentTheme === THEMES.GALAXY ? 'hover:text-[#e8eaf6]' : 'hover:text-gray-900'}`} disabled={(!(showBeautifyControls ? previewNote : note).trim() && !hasHandwriting(handwriting)) || isExportingPdf}>
                  {isExportingPdf ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RotateCw size={18} className={currentTheme === THEMES.GALAXY ? "text-[#8b9dc3]" : "text-gray-400"} />
                    </motion.div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M9 15h6"></path>
                      <path d="M9 11h6"></path>
                    </svg>
                  )}
                </motion.button>
                <motion.button title="New Note" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`p-1 ${drawingSurface ? 'hover:text-black' : currentTheme === THEMES.GALAXY ? 'hover:text-[#e8eaf6]' : 'hover:text-gray-900'}`}>
                  <FilePlus size={18} />
                </motion.button>
              </div>
            </motion.div>
            <motion.hr className={`mb-4 flex-shrink-0 ${drawingSurface ? 'border-black/10' : currentTheme === THEMES.GALAXY ? 'border-[#2d3561]' : 'border-gray-200'}`} animate={{ opacity: focusMode ? 0.2 : 1 }} />
            <div className={`flex-1 relative ${editorPage === 'handwriting' && !isPreviewMode ? 'min-h-0 overflow-visible' : 'overflow-y-auto'}`}>
               {isPreviewMode && !showBeautifyControls ? (
                  <MarkdownPreview handwriting={handwriting} markdownText={note} showLines={writingLines} theme={currentTheme} />
               ) : editorPage === 'handwriting' ? (
                 <HandwritingEditor document={handwriting} onChange={setHandwriting} showLines={writingLines} theme={currentTheme} />
               ) : (
                  <textarea value={showBeautifyControls ? previewNote : note} onChange={(e) => { const val = e.target.value; if (!showBeautifyControls) { setNote(val); } }} placeholder="A quiet place to write..." className={`h-full w-full resize-none bg-transparent font-mono text-base outline-none placeholder:italic transition-[color,font-size,padding] duration-300 sm:text-sm ${writingLines ? 'ruled-writing-surface' : 'leading-relaxed'} ${focusMode ? 'px-2 text-base' : ''} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${currentTheme === THEMES.GALAXY ? 'text-[#e8eaf6] placeholder:text-[#6c7b95]' : 'text-gray-800 placeholder:text-gray-400'}`} readOnly={Boolean(deletingNote) || isBeautifying || showBeautifyControls} />
               )}
            </div>
             <AnimatePresence>
                {editorPage === 'text' && isEditorVisible && !focusMode && !isPreviewMode && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    {note.trim() && (
                      <div className="absolute bottom-4 right-4 z-30 flex-shrink-0">
                      {!showBeautifyControls ? (
                        <motion.button title="Beautify with AI" onClick={() => handleBeautify(false)} disabled={isBeautifying || !note.trim()} className={`text-lg p-3 rounded-full shadow-md transition-colors ${currentTheme === THEMES.GALAXY ? 'bg-[#2d3561] border border-[#4a5178] text-[#e8eaf6]' : 'bg-[#fff7ee] border border-[#e0ddd5] text-gray-700'} ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : (currentTheme === THEMES.GALAXY ? 'hover:bg-[#9b59b6] hover:text-[#e8eaf6]' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]')}`} whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}} whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}} animate={isBeautifying ? { rotate: 360 } : {}} transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}>
                          {isBeautifying ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={20} className="text-[#9a8c73]" /> </motion.div> ) : ( <Wand2 size={20} /> )}
                        </motion.button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-md transition-all ${currentTheme === THEMES.GALAXY ? 'bg-[#2d3561] border border-[#4a5178]' : 'bg-[#fff7ee] border border-[#e0ddd5]'}`}>
                          <span className={`font-serif text-sm hidden sm:inline ${currentTheme === THEMES.GALAXY ? 'text-[#b8bfde]' : 'text-gray-600'}`}> AI Preview: </span>
                          <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <CheckCircle size={20} /> </motion.button>
                          <motion.button title="Regenerate" onClick={regenerateBeautified} className={`rounded-full p-2 transition-colors ${currentTheme === THEMES.GALAXY ? 'bg-[#4a5178] text-[#e8eaf6] border border-[#6c5ce7] hover:bg-[#9b59b6]' : 'bg-[#f8f1e8] text-[#9a8c73] border border-[#e6ddcc] hover:bg-[#f0e9df]'} ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}> <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} /> </motion.button>
                          <motion.button title="Reject Changes" onClick={rejectBeautified} className="bg-red-100 text-red-600 rounded-full p-2 border border-red-200 hover:bg-red-100 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <XCircle size={20} /> </motion.button>
                        </motion.div>
                      )}
                    </div>
                    )}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
