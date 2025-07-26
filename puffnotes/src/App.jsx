import { useState, useEffect, useRef } from 'react';
import useFileSystemAccess from './hooks/useFileSystemAccess';
import {
  FilePlus,
  FileDown,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  X,
  Wand2,
  Save,
  Check,
  RotateCw,
  XCircle,
  CheckCircle,
  Info,
  KeyRound,
  AlertTriangle,
  Eye,
  Pen,
  Keyboard,
} from 'lucide-react';
import { beautifyNoteWithGroq } from './lib/groq';
import { AnimatePresence, motion } from 'framer-motion';

import MarkdownPreview from './components/MarkdownPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as ReactDOM from 'react-dom/client';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
// --- Import the new ThemeSwitcher component ---
import ThemeSwitcher from './components/ThemeSwitcher';

// --- Theme Configuration ---
const themes = [
  {
    name: 'default',
    video: '/backgroundsm3.webm',
    pdf: {
      bg: '#fdfbf7',
      headerText: '#a8a29a',
    },
    classes: {
      pageBg: 'bg-[#fdf6ec]',
      paperBg: 'bg-white',
      paperBgFocus: 'bg-[#fdfbf7]',
      border: 'border-[#e6ddcc]',
      textPrimary: 'text-[#1a1a1a]',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-400',
      textPlaceholder: 'placeholder:text-gray-400',
      textAccent: 'text-[#9a8c73]',
      textInfo: 'text-gray-200',
      infoButtonBorder: 'border-gray-300',
      onboarding: 'bg-[#fff7ee] border-[#e6ddcc] text-gray-600',
      fabContainer: 'border-[#e6ddcc]',
      focusIconActive: 'text-orange-200',
      editorButton: 'bg-[#fff7ee] border-[#e0ddd5] text-gray-700 hover:bg-[#f0e9df] hover:text-[#9a8c73]',
      modalBg: 'bg-white',
      modalButton: 'bg-[#fff7ee] border-[#e0ddd5] hover:bg-[#f0e9df] text-gray-700',
      fileListItem: 'text-[#333] hover:bg-[#f8f6f2]',
      peekBar: 'bg-white border-t border-[#e6ddcc]',
    }
  },
  {
    name: 'galaxy',
    video: '/galaxy.webm',
    pdf: {
      bg: '#0D0F1F',
      headerText: '#B55EFF',
    },
    classes: {
      pageBg: 'bg-[#0D0F1F]',
      paperBg: 'bg-[#181A2A]',
      paperBgFocus: 'bg-[#0D0F1F]',
      border: 'border-gray-700',
      textPrimary: 'text-gray-100',
      textSecondary: 'text-gray-400',
      textTertiary: 'text-gray-500',
      textPlaceholder: 'placeholder:text-gray-500',
      textAccent: 'text-[#ff8ccf]',
      textInfo: 'text-gray-300',
      infoButtonBorder: 'border-gray-700',
      onboarding: 'bg-gray-800/70 border-gray-700 text-gray-300',
      fabContainer: 'border-gray-700 bg-[#181A2A]',
      focusIconActive: 'text-hot-pink',
      editorButton: 'bg-[#2a203e] border-[#B55EFF]/30 text-[#ff8ccf] hover:bg-[#3c2d59] hover:text-white',
      modalBg: 'bg-[#181A2A]',
      modalButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300',
      fileListItem: 'text-gray-300 hover:bg-gray-700',
      peekBar: 'bg-[#181A2A] border-t border-gray-800',
    }
  }
];

// --- Constants for API Key Management ---
const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1';
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function App() {
  // --- New Theme State ---
  const [themeIndex, setThemeIndex] = useState(0);
  const currentTheme = themes[themeIndex];

  // --- State for API Key Management (No Changes) ---
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const apiKeyInputRef = useRef(null);

  // --- Existing State (No Changes) ---
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
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const {
    folderHandle,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
  } = useFileSystemAccess();

  // --- New Theme Functions ---
  const handleNextTheme = () => {
    setThemeIndex((prevIndex) => (prevIndex + 1) % themes.length);
  };
  const handlePrevTheme = () => {
    setThemeIndex((prevIndex) => (prevIndex - 1 + themes.length) % themes.length);
  };
  
  // --- Existing Functions (with minor PDF export change) ---
  const refreshFileList = async () => { if (folderHandle) { try { const files = await listFiles(); setFileList(files || []); } catch (err) { console.error("Failed to refresh file list:", err); setFileList([]); } } };
  const handleOpenFile = async (filename) => { if (!filename) return; try { const content = await loadNote(filename); if (content === null) { alert(`Could not load file: ${filename}. Folder permissions might have changed.`); return; } const baseName = filename.replace(/\.md$/, ""); setNote(content); setNoteName(baseName); setIsFirstSave(false); setShowFileModal(false); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); } catch (err) { console.error("Error opening file:", err); alert(`Failed to open file: ${filename}. Error: ${err.message}`); } };
  const handleNewNote = () => { setNote(""); setNoteName("untitled"); setIsFirstSave(true); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); };
  const handleSave = async () => { let currentFolderHandle = folderHandle; if (!currentFolderHandle) { try { const picked = await pickFolder(); if (!picked) return; currentFolderHandle = picked; } catch (err) { console.error("Error picking folder:", err); if (err.name !== 'AbortError') { alert("Could not get permission to access the folder."); } return; } } if (!noteName.trim()) { alert("Please enter a name for your note before saving."); return; } const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`; try { const savedAs = await saveNote(filename, note, isFirstSave); if (savedAs) { const baseName = savedAs.replace(/\.md$/, ""); setNoteName(baseName); setIsFirstSave(false); refreshFileList(); setSaveIndicator(true); setTimeout(() => setSaveIndicator(false), 1500); } else if (isFirstSave) { console.log("Save As dialog cancelled."); } } catch (err) { console.error("Error saving file:", err); alert(`Failed to save note: ${filename}. Error: ${err.message}`); } };
  const handleBeautify = async (isRegeneration = false) => { const noteToProcess = isRegeneration ? (originalNote || note) : note; if (!noteToProcess.trim()) return; const keyToUse = userApiKey || DEFAULT_GROQ_API_KEY; if (!keyToUse) { console.error("No Groq API Key available (User or Default)."); setApiKeyError(true); setApiKeySaveFeedback(''); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); return; } setIsBeautifying(true); if (!isRegeneration) { setOriginalNote(note); } setApiKeyError(false); setApiKeySaveFeedback(''); try { const result = await beautifyNoteWithGroq(noteToProcess, keyToUse); setPreviewNote(result); setShowBeautifyControls(true); setIsPreviewMode(false); } catch (err) { console.error("Beautify request failed:", err); let userMessage = `AI Beautify failed: ${err.message || 'Unknown error'}`; const isAuthOrRateLimitError = err.status === 401 || err.status === 403 || err.status === 429; if (!userApiKey && keyToUse === DEFAULT_GROQ_API_KEY && isAuthOrRateLimitError) { userMessage = "The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue."; setApiKeyError(true); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); } else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) { userMessage = "Your Groq API key seems invalid or rate-limited. Please check it or generate a new one."; setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); alert(userMessage); } else { alert(userMessage); } setPreviewNote(""); setShowBeautifyControls(false); } finally { setIsBeautifying(false); } };
  const acceptBeautified = () => { setNote(previewNote); setPreviewNote(""); setOriginalNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const rejectBeautified = () => { setPreviewNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const regenerateBeautified = () => { handleBeautify(true); };
  const handleSaveUserApiKey = (key) => { const trimmedKey = key ? key.trim() : ''; localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey); setUserApiKey(trimmedKey); setApiKeyError(false); setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.'); setTimeout(() => setApiKeySaveFeedback(''), 2500); };
  const handleFolderButton = async () => { if (!folderHandle) { try { await pickFolder(); } catch (err) { if (err.name !== 'AbortError') { console.error("Error picking folder:", err); alert("Could not get permission to access the folder."); } } } else { setShowFileModal((prev) => !prev); if (!showFileModal) { refreshFileList(); } } };
  const toggleFocusMode = () => { setFocusMode(prev => !prev); };
  const togglePreviewMode = () => { if (showBeautifyControls) return; setIsPreviewMode(prev => !prev); };

  const handleExportPdf = async () => {
    const contentToExport = showBeautifyControls ? previewNote : note;
    if (!contentToExport.trim() || isExportingPdf) return;
  
    setIsExportingPdf(true);
    const filename = (noteName.trim() || "untitled") + ".pdf";
  
    const pageBackgroundColor = currentTheme.pdf.bg;
    const headerTextColor = currentTheme.pdf.headerText;
    const headerText = "puffnotes";
    const headerFontSize = 9;
    const margin = 18;
    const headerTopMargin = 15;
  
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true, floatPrecision: 'smart' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidthMM = pdfWidth - (margin * 2);
    const contentHeightMM = pdfHeight - (margin * 2) - 10;
    const contentWidthPX = Math.floor(contentWidthMM * 3.78);
  
    const tempContainerId = 'pdf-render-container';
    let tempContainer = document.getElementById(tempContainerId);
    if (!tempContainer) { tempContainer = document.createElement('div'); tempContainer.id = tempContainerId; tempContainer.style.position = 'absolute'; tempContainer.style.left = '-9999px'; tempContainer.style.top = '-9999px'; tempContainer.style.border = '1px solid transparent'; document.body.appendChild(tempContainer); } else { tempContainer.innerHTML = ''; }
  
    tempContainer.style.width = `${contentWidthPX}px`;
    tempContainer.style.padding = `1px`;
    tempContainer.style.background = pageBackgroundColor;
    tempContainer.style.fontFamily = 'monospace';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.625';
    tempContainer.style.color = currentTheme.name === 'galaxy' ? '#e5e7eb' : '#1f2937';
    tempContainer.style.height = 'auto';
    tempContainer.style.display = 'inline-block';
  
    const root = ReactDOM.createRoot(tempContainer);
    root.render(<MarkdownPreview markdownText={contentToExport} theme={currentTheme.name} />);
  
    await new Promise(resolve => setTimeout(resolve, 500));
  
    try {
      // Base overrides for colors and borders, using original logic
      const baseOverrides = {
        default: [
          { selector: '.text-gray-800', color: '#1f2937' },
          { selector: '.text-gray-600', color: '#4b5563' },
          { selector: 'blockquote', color: '#4b5563' },
          { selector: '.border-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'borderColor' },
          { selector: '.text-\\[\\#0f0a02ff\\]', color: '#0f0a02ff' },
          { selector: '.bg-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'backgroundColor' }, // For inline code
        ],
        galaxy: [
          { selector: '.text-gray-200', color: '#e5e7eb' },
          { selector: '.text-gray-400', color: '#9ca3af' },
          { selector: 'blockquote', color: '#9ca3af' },
          { selector: '.border-gray-700', color: '#374151', styleProp: 'borderColor' },
          { selector: '.text-\\[\\#ff8ccf\\]', color: '#ff8ccf' },
          { selector: '.bg-gray-800\\/50', color: 'rgba(31, 41, 55, 0.5)', styleProp: 'backgroundColor' }, // For inline code
        ]
      };

      let selectorsAndColors = baseOverrides[currentTheme.name];

      // **THE CRITICAL FIX**: Add specific overrides to make block backgrounds match the page background
      if (currentTheme.name === 'default') {
        selectorsAndColors.push({ selector: '.bg-\\[\\#fdf6ec\\]', color: pageBackgroundColor, styleProp: 'backgroundColor' });
        selectorsAndColors.push({ selector: '.bg-\\[\\#fff7ee\\]', color: pageBackgroundColor, styleProp: 'backgroundColor' }); // also target table header
      } else if (currentTheme.name === 'galaxy') {
        selectorsAndColors.push({ selector: '.bg-\\[\\#0D0F1F\\]', color: pageBackgroundColor, styleProp: 'backgroundColor' });
        selectorsAndColors.push({ selector: '.bg-gray-800\\/50', color: pageBackgroundColor, styleProp: 'backgroundColor' }); // also target table header
      }

      // Apply all overrides
      selectorsAndColors.forEach(({ selector, color, styleProp = 'color' }) => {
        try {
          const elements = tempContainer.querySelectorAll(selector);
          elements.forEach(el => {
            el.style[styleProp] = color;
          });
        } catch (e) {
          console.warn(`Failed override for selector: ${selector}`, e);
        }
      });
    } catch (e) {
      console.warn("Error applying style overrides:", e);
    }
  
    try {
      const canvas = await html2canvas(tempContainer, {
        scale: 3, useCORS: true, logging: false, backgroundColor: pageBackgroundColor, width: tempContainer.scrollWidth, height: tempContainer.scrollHeight, windowWidth: tempContainer.scrollWidth, windowHeight: tempContainer.scrollHeight, scrollX: 0, scrollY: 0, removeContainer: false, imageTimeout: 15000
      });
  
      const imgData = canvas.toDataURL('image/png');
      const canvasWidthPX = canvas.width;
      const canvasHeightPX = canvas.height;
      const scaleFactor = contentWidthMM / canvasWidthPX;
      const pixelsPerPage = contentHeightMM / scaleFactor;
  
      const addPageStyling = () => {
        pdf.setFillColor(pageBackgroundColor);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        pdf.setFontSize(headerFontSize);
        try { pdf.setFont('times', 'normal'); } catch (e) { pdf.setFont('serif', 'normal'); }
        pdf.setTextColor(headerTextColor);
        pdf.text(headerText, margin, headerTopMargin);
      };
  
      addPageStyling();
      let remainingHeight = canvasHeightPX;
      let currentY = 0;
      while (remainingHeight > 0) {
        const heightToUse = Math.min(remainingHeight, pixelsPerPage);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidthPX;
        tempCanvas.height = heightToUse;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage( canvas, 0, currentY, canvasWidthPX, heightToUse, 0, 0, canvasWidthPX, heightToUse );
        const pageImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage( pageImgData, 'PNG', margin, margin, contentWidthMM, heightToUse * scaleFactor, undefined, 'FAST' );
        currentY += heightToUse;
        remainingHeight -= heightToUse;
        if (remainingHeight > 0) { pdf.addPage(); addPageStyling(); }
      }
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      let message = `Failed to export PDF. ${error.message || 'Check console for details.'}`;
      alert(message);
    } finally {
      root.unmount();
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsExportingPdf(false);
    }
  };

  // --- useEffect Hooks ---
  useEffect(() => { const autoSave = async () => { const shouldSave = !isFirstSave && folderHandle && noteName.trim() && !showBeautifyControls; if (shouldSave) { const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`; try { await saveNote(filename, note, false); } catch (err) { console.warn("Autosave failed:", err); } } }; const debounceTimeout = setTimeout(autoSave, 750); return () => clearTimeout(debounceTimeout); }, [note, noteName, isFirstSave, folderHandle, saveNote, showBeautifyControls]);
  useEffect(() => { if (folderHandle) { refreshFileList(); } else { setFileList([]); } }, [folderHandle]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (isTyping && document.activeElement !== document.querySelector("textarea")) return;
      
      let handled = false;
      if (ctrlOrCmd && e.key === 'Enter') { e.preventDefault(); if (!isBeautifying && note.trim()) handleBeautify(false); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'p') { e.preventDefault(); if (!showBeautifyControls) setIsPreviewMode(prev => !prev); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); handleExportPdf(); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'k') { e.preventDefault(); handleNewNote(); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); handled = true; }
      else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFocusMode(); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'o') { e.preventDefault(); handleFolderButton(); handled = true; }
      else if (ctrlOrCmd && e.key.toLowerCase() === '.') { e.preventDefault(); setDropAnimationComplete(false); setIsEditorVisible(prev => !prev); handled = true; }
      else if (ctrlOrCmd && e.key === '/') { e.preventDefault(); setShowShortcutsModal(prev => !prev); handled = true; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, isBeautifying, showBeautifyControls, handleBeautify, handleExportPdf, handleNewNote, handleSave, toggleFocusMode, handleFolderButton, setShowShortcutsModal]);

  return (
    <div className={`min-h-screen relative overflow-hidden ${currentTheme.classes.pageBg}`}>
      {/* --- RENDER THEME SWITCHER --- */}
      <ThemeSwitcher onNext={handleNextTheme} onPrev={handlePrevTheme} theme={currentTheme.name} />

      <div className="absolute top-4 left-4 z-50 flex items-center space-x-2">
        <motion.button onClick={() => { setApiKeyError(false); setShowInfoModal(true); setShowApiKeyInput(!!userApiKey); setApiKeySaveFeedback(''); }} className={`opacity-70 hover:opacity-90 transition p-1 rounded-full border shadow-sm ${currentTheme.classes.infoButtonBorder}`} title="About puffnotes" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <Info size={17} strokeWidth={2} className={currentTheme.classes.textInfo} /> </motion.button>
        <motion.button onClick={() => setShowShortcutsModal(true)} className={`opacity-70 hover:opacity-90 transition p-1 rounded-full border shadow-sm ${currentTheme.classes.infoButtonBorder}`} title="Keyboard Shortcuts (Cmd+/)" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} > <Keyboard size={17} strokeWidth={2} className={currentTheme.classes.textInfo} /> </motion.button>
      </div>
      
      {!window.showDirectoryPicker && ( <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow"> PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available. </div> )}
      
      {/* --- DYNAMIC BACKGROUND VIDEO --- */}
      <video key={currentTheme.video} autoPlay muted loop playsInline preload="auto" className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"> <source src={currentTheme.video} type="video/webm" /> Your browser does not support the video tag. </video>

      <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
        <AnimatePresence> {(!folderHandle || isFirstSave) && !showInfoModal && ( <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`font-serif text-sm mr-3 rounded-full px-4 py-1 shadow-sm ${currentTheme.classes.onboarding}`}> {!folderHandle ? "Select a folder (Cmd/Ctrl + O)" : "Save Note (Cmd/Ctrl + S)"} </motion.span> )} </AnimatePresence>
        
        <div className={`flex items-center space-x-3 px-4 py-2 rounded-full shadow-md border ${currentTheme.classes.fabContainer}`}>
          <button onClick={toggleFocusMode} className={`opacity-60 hover:opacity-100 transition ${focusMode ? currentTheme.classes.focusIconActive : currentTheme.classes.textSecondary}`} title={focusMode ? "Exit Focus Mode" : "Focus Mode"}> <svg xmlns="http://www.w.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /> </svg> </button>
          <motion.button onClick={handleFolderButton} className={`opacity-60 hover:opacity-100 transition ${currentTheme.classes.textTertiary}`} title={folderHandle ? "Open Notes Folder" : "Select Notes Folder"} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <FolderOpen size={20} /> </motion.button>
          {isFirstSave ? ( <motion.button onClick={handleSave} className={`opacity-60 transition ${currentTheme.classes.textTertiary} ${!noteName.trim() ? 'cursor-not-allowed opacity-30' : 'hover:opacity-100'}`} title="Save Note" whileHover={noteName.trim() ? { scale: 1.1 } : {}} whileTap={noteName.trim() ? { scale: 0.95 } : {}} disabled={!noteName.trim()}> <Save size={20} /> </motion.button> ) : ( <motion.div animate={{ rotate: saveIndicator ? [0, 20, 0] : 0, scale: saveIndicator ? [1, 1.2, 1] : 1, color: saveIndicator ? ["#6b7280", "#10b981", "#6b7280"] : "#9ca3af" }} transition={{ duration: 0.5 }} title="Note Autosaved"> <Check size={20} className="opacity-100" /> </motion.div> )}
          <motion.button onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }} className={`opacity-60 hover:opacity-100 transition ${currentTheme.classes.textTertiary}`} title={isEditorVisible ? 'Hide Editor' : 'Show Editor'} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />} </motion.button>
        </div>
        
        <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} theme={currentTheme.name} />
        
        <AnimatePresence> {showInfoModal && ( <motion.div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)}> <motion.div className={`border rounded-xl shadow-2xl p-8 pt-6 w-full max-w-md text-center font-serif relative ${currentTheme.classes.modalBg} ${currentTheme.classes.border}`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3 }} onClick={e => e.stopPropagation()}> <button onClick={() => setShowInfoModal(false)} className={`absolute top-3 right-3 ${currentTheme.classes.textSecondary} hover:text-gray-600 transition`} aria-label="Close modal"> <X size={18} /> </button> <h2 className={`text-2xl mb-3 ${currentTheme.classes.textPrimary}`}>puffnotes</h2> <AnimatePresence> {apiKeyError && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-xs my-3 text-left flex items-center gap-2 overflow-hidden"> <AlertTriangle size={14} className="flex-shrink-0" /> <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span> </motion.div> )} </AnimatePresence> <p className={`${currentTheme.classes.textSecondary} text-sm leading-relaxed mb-4`}> A serene space for note-taking — simple, offline, and distraction-free.<br /> Click the <Wand2 size={14} className={`inline mb-0.5 ${currentTheme.classes.textAccent}`} /> wand to magically expand and beautify your notes using AI. </p> <div className="text-left text-xs border-t pt-4 mt-4 space-y-2 border-gray-200 dark:border-gray-700"> <div className="flex justify-between items-center"> <p className={`${currentTheme.classes.textSecondary} font-medium flex items-center gap-1.5`}> <KeyRound size={14} /> <span>Personal AI key (Recommended)</span> </p> <button onClick={() => setShowApiKeyInput(prev => !prev)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 text-xs underline"> {showApiKeyInput ? 'Hide' : 'Add/Edit'} </button> </div> <AnimatePresence> {showApiKeyInput && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2"> <p className="text-gray-500 dark:text-gray-400 leading-snug"> Add your free Groq API key for unlimited AI use. Get one in seconds at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-500 dark:text-gray-400 underline hover:text-orange-400">Groq Console</a>. </p> <div className="flex items-center gap-2"> <input ref={apiKeyInputRef} type="password" placeholder="Paste Groq API Key (gsk_...)" defaultValue={userApiKey} className="flex-grow px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md outline-none focus:ring-1 focus:ring-blue-300 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono" /> <button onClick={() => handleSaveUserApiKey(apiKeyInputRef.current?.value || '')} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-200 whitespace-nowrap"> Save </button> </div> {apiKeySaveFeedback && ( <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-xs mt-1"> {apiKeySaveFeedback} </motion.p> )} </motion.div> )} </AnimatePresence> </div> <p className={`text-xs italic mt-4 mb-2 ${currentTheme.classes.textAccent}`}> No accounts. No cloud. Just you and your thoughts. </p> <p className={`text-xs ${currentTheme.classes.textAccent}`}> lovingly crafted by <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-200 transition"> Rajin Khan </a> </p> <button onClick={() => setShowInfoModal(false)} className={`mt-5 px-5 py-1.5 text-sm rounded-full transition ${currentTheme.classes.modalButton}`}> Close </button> <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 opacity-50"> Background video via <a href="https://moewalls.com" target="_blank" rel="noopener noreferrer" className="underline">MoeWalls</a> </p> </motion.div> </motion.div> )} </AnimatePresence>
      </div>

      <AnimatePresence> {showFileModal && folderHandle && ( <motion.div className="fixed inset-0 z-30 bg-black bg-opacity-30 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setShowFileModal(false)}> <motion.div className={`rounded-xl shadow-xl border w-full max-w-xs max-h-[60vh] overflow-y-auto p-4 ${currentTheme.classes.modalBg} ${currentTheme.classes.border}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", duration: 0.4 }} onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-3"> <h2 className={`font-serif text-lg ${currentTheme.classes.textPrimary}`}>Your Notes</h2> <motion.button onClick={() => setShowFileModal(false)} className={`${currentTheme.classes.textSecondary} hover:text-gray-800 dark:hover:text-gray-300`} title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}> <X size={18} /> </motion.button> </div> {fileList.length === 0 ? ( <p className="text-sm text-gray-500 italic px-2 py-1">No markdown notes (.md) found in the selected folder.</p> ) : ( <div className="space-y-1"> {fileList.map((filename, index) => ( <motion.button key={filename} onClick={() => handleOpenFile(filename)} className={`block w-full text-left text-sm font-mono px-2 py-1.5 rounded transition-colors duration-100 ${currentTheme.classes.fileListItem}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 3 }} title={`Open ${filename}`}> {filename.replace(/\.md$/, "")} </motion.button> ))} </div> )} <button onClick={pickFolder} className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 underline py-1"> Change Folder </button> </motion.div> </motion.div> )} </AnimatePresence>

      <AnimatePresence> {!isEditorVisible && dropAnimationComplete && ( <motion.div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}> <motion.div className={`rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer ${currentTheme.classes.peekBar}`} onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }} whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}> <motion.span className={`font-serif text-lg tracking-tight ${currentTheme.classes.textPrimary}`} animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 2, ease: "easeInOut" }}> puffnotes </motion.span> <span className={`${currentTheme.classes.textTertiary}`}>|</span> <span className={`font-serif text-sm max-w-[150px] sm:max-w-xs truncate ${currentTheme.classes.textSecondary}`} title={noteName || "untitled"}> {noteName || "untitled"} </span> </motion.div> </motion.div> )} </AnimatePresence>

      <motion.div className="fixed bottom-0 left-0 right-0 z-20" initial={false} animate={{ y: isEditorVisible ? 0 : '101%' }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }} onAnimationComplete={() => setDropAnimationComplete(true)} >
        <div className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative transition-colors duration-500 ${focusMode ? currentTheme.classes.paperBgFocus : currentTheme.classes.paperBg}`} >
          <motion.div className="flex justify-between items-center mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: focusMode ? 'none' : 'auto' }} >
             <motion.h1 className={`font-serif text-2xl tracking-tight flex-shrink-0 ${currentTheme.classes.textPrimary}`} whileHover={!focusMode ? { x: 2 } : {}}> puffnotes </motion.h1>
             <div className="flex-1 flex justify-center items-center gap-2 mx-4 min-w-0">
                 <motion.input type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)} className={`text-center font-serif text-sm bg-transparent outline-none w-full max-w-[70%] border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 transition-opacity duration-300 ${currentTheme.classes.textSecondary} ${focusMode || isPreviewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} placeholder="note name..." whileFocus={{ scale: 1.02 }} disabled={focusMode || isPreviewMode} />
                 {!showBeautifyControls && !focusMode && note.trim() && (
                     <motion.button onClick={togglePreviewMode} title={isPreviewMode ? "Edit Note" : "Preview Markdown"} className={`opacity-60 hover:opacity-100 transition p-1 flex-shrink-0 ${currentTheme.classes.textSecondary} hover:${currentTheme.classes.textPrimary}`} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} > {isPreviewMode ? <Pen size={18} /> : <Eye size={18} />} </motion.button>
                  )}
             </div>
            <div className={`flex space-x-4 text-lg flex-shrink-0 ${currentTheme.classes.textSecondary}`}>
              <motion.button title="Export as PDF" onClick={handleExportPdf} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`hover:${currentTheme.classes.textPrimary} p-1 disabled:opacity-30`} disabled={!(showBeautifyControls ? previewNote : note).trim() || isExportingPdf} > {isExportingPdf ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={18} className="text-gray-400" /> </motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <polyline points="14 2 14 8 20 8"></polyline> <path d="M9 15h6"></path> <path d="M9 11h6"></path> </svg> )} </motion.button>
              <motion.button title="New Note" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={`hover:${currentTheme.classes.textPrimary} p-1`}> <FilePlus size={18} /> </motion.button>
            </div>
          </motion.div>
          <motion.hr className={`mb-4 flex-shrink-0 ${currentTheme.classes.border}`} animate={{ opacity: focusMode ? 0.2 : 1 }} />
          <div className="flex-1 overflow-y-auto relative" >
             {isPreviewMode && !showBeautifyControls ? (
                <MarkdownPreview markdownText={note} theme={currentTheme.name} />
             ) : (
                <textarea value={showBeautifyControls ? previewNote : note} onChange={(e) => { const val = e.target.value; if (!showBeautifyControls) { setNote(val); } }} placeholder="A quiet place to write..." className={`w-full h-full font-mono bg-transparent resize-none outline-none leading-relaxed italic transition-all duration-300 ${currentTheme.classes.textPrimary} ${currentTheme.classes.textPlaceholder} ${focusMode ? 'text-base px-2' : 'text-sm'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} readOnly={isBeautifying || showBeautifyControls} />
             )}
          </div>
          {note.trim() && !focusMode && !isPreviewMode && (
            <div className="absolute bottom-6 right-6 z-30 flex-shrink-0">
              {!showBeautifyControls ? (
                <motion.button title="Beautify with AI" onClick={() => handleBeautify(false)} disabled={isBeautifying || !note.trim()} className={`text-lg p-3 rounded-full shadow-md transition-colors ${currentTheme.classes.editorButton} ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}} whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}} animate={isBeautifying ? { rotate: 360 } : {}} transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}>
                  {isBeautifying ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={20} className={currentTheme.classes.textAccent} /> </motion.div> ) : ( <Wand2 size={20} /> )}
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`flex items-center space-x-3 px-4 py-2.5 rounded-full border shadow-md transition-all ${currentTheme.classes.modalButton} ${currentTheme.classes.border}`}>
                  <span className={`font-serif text-sm hidden sm:inline ${currentTheme.classes.textSecondary}`}> AI Preview: </span>
                  <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <CheckCircle size={20} /> </motion.button>
                  <motion.button title="Regenerate" onClick={regenerateBeautified} className={`rounded-full p-2 border transition-colors ${currentTheme.classes.modalButton} ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}> <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} /> </motion.button>
                  <motion.button title="Reject Changes" onClick={rejectBeautified} className="bg-red-100 text-red-600 rounded-full p-2 border border-red-200 hover:bg-red-100 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <XCircle size={20} /> </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}