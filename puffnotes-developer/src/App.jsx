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
  Keyboard, // <-- Add Keyboard
} from 'lucide-react';
import { beautifyNoteWithGroq } from './lib/groq';
import { AnimatePresence, motion } from 'framer-motion';

import MarkdownPreview from './components/MarkdownPreview';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'; // <-- Import the shortcuts modal

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as ReactDOM from 'react-dom/client';

const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1';
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function App() {
  // --- State ---
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
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const apiKeyInputRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false); // <-- State for shortcuts modal

  const {
    folderHandle,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
  } = useFileSystemAccess();

  // --- Functions (Keep all existing functions) ---
  const refreshFileList = async () => { if (folderHandle) { try { const files = await listFiles(); setFileList(files || []); } catch (err) { console.error("Failed to refresh file list:", err); setFileList([]); } } else { setFileList([]); } };
  const handleOpenFile = async (filename) => { if (!filename) return; try { const content = await loadNote(filename); if (content === null) { alert(`Could not load file: ${filename}. Folder permissions might have changed.`); return; } const baseName = filename.replace(/\.md$/, ""); setNote(content); setNoteName(baseName); setIsFirstSave(false); setShowFileModal(false); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); } catch (err) { console.error("Error opening file:", err); alert(`Failed to open file: ${filename}. Error: ${err.message}`); } };
  const handleNewNote = () => { setNote(""); setNoteName("untitled"); setIsFirstSave(true); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); };
  const handleSave = async () => { let currentFolderHandle = folderHandle; if (!currentFolderHandle) { try { const picked = await pickFolder(); if (!picked) return; currentFolderHandle = picked; } catch (err) { console.error("Error picking folder during save:", err); if (err.name !== 'AbortError') { alert("Could not get permission to access the folder."); } return; } } if (!noteName.trim()) { alert("Please enter a name for your note before saving."); return; } const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`; try { const savedAs = await saveNote(filename, note, isFirstSave); if (savedAs) { const baseName = savedAs.replace(/\.md$/, ""); setNoteName(baseName); setIsFirstSave(false); refreshFileList(); setSaveIndicator(true); setTimeout(() => setSaveIndicator(false), 1500); } else if (isFirstSave) { console.log("Save As dialog cancelled."); } } catch (err) { console.error("Error saving file:", err); alert(`Failed to save note: ${filename}. Error: ${err.message}`); } };
  const handleBeautify = async (isRegeneration = false) => { const noteToProcess = isRegeneration ? (originalNote || note) : note; if (!noteToProcess.trim()) return; const keyToUse = userApiKey || DEFAULT_GROQ_API_KEY; if (!keyToUse) { console.error("No Groq API Key available (User or Default)."); setApiKeyError(true); setApiKeySaveFeedback(''); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); return; } setIsBeautifying(true); if (!isRegeneration) { setOriginalNote(note); } setApiKeyError(false); setApiKeySaveFeedback(''); try { const result = await beautifyNoteWithGroq(noteToProcess, keyToUse); setPreviewNote(result); setShowBeautifyControls(true); setIsPreviewMode(false); } catch (err) { console.error("Beautify request failed:", err); let userMessage = `AI Beautify failed: ${err.message || 'Unknown error'}`; const isAuthOrRateLimitError = err.status === 401 || err.status === 403 || err.status === 429; if (!userApiKey && keyToUse === DEFAULT_GROQ_API_KEY && isAuthOrRateLimitError) { userMessage = "The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue."; setApiKeyError(true); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); } else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) { userMessage = "Your Groq API key seems invalid or rate-limited. Please check it or generate a new one."; setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); alert(userMessage); } else { alert(userMessage); } setPreviewNote(""); setShowBeautifyControls(false); } finally { setIsBeautifying(false); } };
  const acceptBeautified = () => { setNote(previewNote); setPreviewNote(""); setOriginalNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const rejectBeautified = () => { setPreviewNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const regenerateBeautified = () => { handleBeautify(true); };
  const handleSaveUserApiKey = (key) => { const trimmedKey = key ? key.trim() : ''; localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey); setUserApiKey(trimmedKey); setApiKeyError(false); setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.'); setTimeout(() => setApiKeySaveFeedback(''), 2500); };
  const togglePreviewMode = () => { if (showBeautifyControls) return; setIsPreviewMode(prev => !prev); };
  const handleExportPdf = async () => { /* ... Keep existing PDF export function ... */ const contentToExport = showBeautifyControls ? previewNote : note; if (!contentToExport.trim() || isExportingPdf) return; setIsExportingPdf(true); const filename = (noteName.trim() || "untitled") + ".pdf"; const pageBackgroundColor = '#fdfbf7'; const headerTextColor = '#a8a29a'; const headerText = "puffnotes"; const headerFontSize = 9; const margin = 18; const headerTopMargin = 15; const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true, floatPrecision: 'smart' }); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight(); const contentWidthMM = pdfWidth - (margin * 2); const contentHeightMM = pdfHeight - (margin * 2) - 10; const contentWidthPX = Math.floor(contentWidthMM * 3.78); const tempContainerId = 'pdf-render-container'; let tempContainer = document.getElementById(tempContainerId); if (!tempContainer) { tempContainer = document.createElement('div'); tempContainer.id = tempContainerId; tempContainer.style.position = 'absolute'; tempContainer.style.left = '-9999px'; tempContainer.style.top = '-9999px'; tempContainer.style.border = '1px solid transparent'; document.body.appendChild(tempContainer); } else { tempContainer.innerHTML = ''; } tempContainer.style.width = `${contentWidthPX}px`; tempContainer.style.padding = `1px`; tempContainer.style.background = pageBackgroundColor; tempContainer.style.fontFamily = 'monospace'; tempContainer.style.fontSize = '14px'; tempContainer.style.lineHeight = '1.625'; tempContainer.style.color = '#1f2937'; tempContainer.style.height = 'auto'; tempContainer.style.display = 'inline-block'; const root = ReactDOM.createRoot(tempContainer); root.render(<MarkdownPreview markdownText={contentToExport} />); await new Promise(resolve => setTimeout(resolve, 500)); try { const selectorsAndColors = [ { selector: '.text-gray-800', color: '#1f2937' }, { selector: '.text-gray-600', color: '#4b5563' }, { selector: 'blockquote', color: '#4b5563' }, { selector: '.border-\\[\\#e6ddcc\\]', color: '#e6ddcc', styleProp: 'borderColor' }, { selector: '.bg-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'backgroundColor' }, { selector: '.text-\\[\\#9a8c73\\]', color: '#9a8c73' }, { selector: '.bg-\\[\\#fdf6ec\\]', color: '#fdf6ec', styleProp: 'backgroundColor' }, ]; selectorsAndColors.forEach(({ selector, color, styleProp = 'color' }) => { try { const elements = tempContainer.querySelectorAll(selector); elements.forEach(el => { const className = selector.startsWith('.') ? selector.substring(1).replace(/\\/g, '') : null; if ((className && el.classList.contains(className)) || !selector.startsWith('.')) { el.style[styleProp] = color; } }); } catch (e) { console.warn(`Failed override for selector: ${selector}`, e); } }); } catch (e) { console.warn("Error applying style overrides:", e); } try { const canvas = await html2canvas(tempContainer, { scale: 3, useCORS: true, logging: false, backgroundColor: pageBackgroundColor, width: tempContainer.scrollWidth, height: tempContainer.scrollHeight, windowWidth: tempContainer.scrollWidth, windowHeight: tempContainer.scrollHeight, scrollX: 0, scrollY: 0, removeContainer: false, imageTimeout: 15000, }); const imgData = canvas.toDataURL('image/png'); const imgProps = pdf.getImageProperties(imgData); const canvasWidthPX = canvas.width; const canvasHeightPX = canvas.height; const scaleFactor = contentWidthMM / canvasWidthPX; const totalHeightMM = canvasHeightPX * scaleFactor; const pixelsPerPage = contentHeightMM / scaleFactor; const addPageStyling = () => { pdf.setFillColor(pageBackgroundColor); pdf.rect(0, 0, pdfWidth, pdfHeight, 'F'); pdf.setFontSize(headerFontSize); try { pdf.setFont('times', 'normal'); } catch (e) { pdf.setFont('serif', 'normal'); } pdf.setTextColor(headerTextColor); pdf.text(headerText, margin, headerTopMargin); }; addPageStyling(); let remainingHeight = canvasHeightPX; let currentY = 0; while (remainingHeight > 0) { const heightToUse = Math.min(remainingHeight, pixelsPerPage); const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvasWidthPX; tempCanvas.height = heightToUse; const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage( canvas, 0, currentY, canvasWidthPX, heightToUse, 0, 0, canvasWidthPX, heightToUse ); const pageImgData = tempCanvas.toDataURL('image/png'); pdf.addImage( pageImgData, 'PNG', margin, margin, contentWidthMM, heightToUse * scaleFactor, undefined, 'FAST' ); currentY += heightToUse; remainingHeight -= heightToUse; if (remainingHeight > 0) { pdf.addPage(); addPageStyling(); } } pdf.save(filename); } catch (error) { console.error("Error generating PDF:", error); let message = `Failed to export PDF.`; if (error.message && error.message.includes('color function "oklch"')) { message += ' A style used in the note might not be supported.'; } else { message += ` ${error.message || 'Check console for details.'}`; } alert(message); } finally { root.unmount(); if (tempContainer && tempContainer.parentNode) { tempContainer.parentNode.removeChild(tempContainer); } setIsExportingPdf(false); } };
  const handleFolderButton = async () => { if (!folderHandle) { try { await pickFolder(); } catch(err) { if (err.name !== 'AbortError') { console.error("Error picking folder:", err); alert("Could not get permission to access the folder."); } } } else { setShowFileModal((prev) => !prev); if (!showFileModal) { refreshFileList(); } } };
  const toggleFocusMode = () => { setFocusMode(prev => !prev); };

  // --- useEffect Hooks ---
  useEffect(() => { /* Autosave */ const autoSave = async () => { if (!isFirstSave && folderHandle && noteName.trim() && !showBeautifyControls) { const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`; try { await saveNote(filename, note, false); } catch (err) { console.warn("Autosave failed:", err); } } }; const debounce = setTimeout(autoSave, 750); return () => clearTimeout(debounce); }, [note, noteName, isFirstSave, folderHandle, saveNote, showBeautifyControls]);
  useEffect(() => { /* Refresh File List */ if (folderHandle) refreshFileList(); else setFileList([]); }, [folderHandle]);

  // --- NEW: Keyboard Shortcuts useEffect Hook ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      // Allow shortcuts if focus is specifically on the main textarea
      const isMainTextareaFocused = document.activeElement.tagName === 'TEXTAREA' && document.activeElement === document.querySelector("div.flex-1.overflow-y-auto.relative textarea");

      // Block shortcuts if typing in input OR a textarea that ISN'T the main one
      if (isTyping && !isMainTextareaFocused) return;

      let handled = false; // Flag to check if a shortcut was handled

      if (ctrlOrCmd && e.key === 'Enter') {
        if (!isBeautifying && note.trim()) { handleBeautify(false); handled = true; }
      }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'p') {
        if (!showBeautifyControls) { setIsPreviewMode(prev => !prev); handled = true; }
      }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'e') {
        handleExportPdf(); handled = true;
      }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'k') {
        handleNewNote(); handled = true;
      }
      else if (ctrlOrCmd && e.key.toLowerCase() === 's') {
        handleSave(); handled = true;
      }
      // --- Updated Focus Mode shortcut to include Shift ---
      else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') {
        toggleFocusMode(); handled = true;
      }
      else if (ctrlOrCmd && e.key.toLowerCase() === 'o') {
        handleFolderButton(); handled = true;
      }
      // --- Updated Toggle Editor shortcut to use '.' ---
      else if (ctrlOrCmd && e.key === '.') {
         setDropAnimationComplete(false);
         setIsEditorVisible(prev => !prev);
         handled = true; // <-- Added handled flag
      }
      else if (ctrlOrCmd && e.key === '/') { // Toggle Shortcuts Modal
         setShowShortcutsModal(prev => !prev);
         handled = true; // <-- Added handled flag
      }

      if (handled) {
         e.preventDefault(); // Prevent default browser action only if a shortcut was handled
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ // Add necessary dependencies
    note, isBeautifying, showBeautifyControls, folderHandle, // State checks
    handleBeautify, togglePreviewMode, handleExportPdf, handleNewNote, handleSave, toggleFocusMode, handleFolderButton, // Handlers
    setShowShortcutsModal, setIsEditorVisible, setDropAnimationComplete // State setters used in shortcuts
  ]);
  // --- End Keyboard Shortcuts Hook ---


  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-left Buttons: Info and Shortcuts */}
      <div className="absolute top-4 left-4 z-50 flex space-x-2"> {/* Use flex container */}
        {/* Info Button (Beta's style) */}
        <motion.button
          onClick={() => { setApiKeyError(false); setShowInfoModal(true); setShowApiKeyInput(!!userApiKey); setApiKeySaveFeedback(''); }}
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full backdrop-blur-sm bg-white/30 border border-white/20 shadow-sm"
          title="About puffnotes (Cmd+/ for shortcuts)"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        >
          <Info size={17} strokeWidth={2} className="text-gray-200" />
        </motion.button>

        {/* NEW: Shortcuts Button (Beta's style) */}
        <motion.button
          onClick={() => setShowShortcutsModal(true)}
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full backdrop-blur-sm bg-white/30 border border-white/20 shadow-sm"
          title="Keyboard Shortcuts (Cmd+/)"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        >
          <Keyboard size={17} strokeWidth={2} className="text-gray-200" />
        </motion.button>
      </div>

      {/* Render the Modals */}
      <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
      />

      {/* Info Modal (Beta's styling - Glassmorphism) */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black bg-opacity-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-8 pt-6 w-full max-w-md text-center font-serif relative overflow-y-auto max-h-[90vh]" // Added overflow/max-h
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3 }}
              onClick={e => e.stopPropagation()}
            >
                <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition" aria-label="Close modal"> <X size={18} /> </button>
                <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2>
                <AnimatePresence> {apiKeyError && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-2 rounded-md text-xs my-3 text-left flex items-center gap-2 overflow-hidden"> <AlertTriangle size={14} className="flex-shrink-0" /> <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span> </motion.div> )} </AnimatePresence>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-4"> A serene space for note-taking — simple, offline, and distraction-free.<br /> Click the <Wand2 size={14} className="inline mb-0.5 text-[#9a8c73]" /> wand to magically expand and beautify your notes using AI. </p>
                <div className="text-left text-xs border-t border-white/30 pt-4 mt-4 space-y-2">
                    <div className="flex justify-between items-center"> <p className="text-gray-600 font-medium flex items-center gap-1.5"> <KeyRound size={14} /> <span>Personal AI key (Recommended)</span> </p> <button onClick={() => setShowApiKeyInput(prev => !prev)} className="text-gray-500 hover:text-gray-800 text-xs underline"> {showApiKeyInput ? 'Hide' : 'Add/Edit'} </button> </div>
                    <AnimatePresence> {showApiKeyInput && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2"> <p className="text-gray-500 leading-snug"> Add your free Groq API key for unlimited AI use. Get one in seconds at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline hover:text-[#a8a29a]">Groq Console</a>. </p> <div className="flex items-center gap-2"> <input ref={apiKeyInputRef} type="password" placeholder="Paste Groq API Key (gsk_...)" defaultValue={userApiKey} className="flex-grow px-2 py-1 text-xs bg-white/50 border border-white/40 rounded-md outline-none focus:ring-1 focus:ring-white/60 font-mono text-gray-700" /> <button onClick={() => handleSaveUserApiKey(apiKeyInputRef.current?.value || '')} className="px-3 py-1 text-xs bg-white/40 border border-white/30 rounded-md hover:bg-white/60 transition text-gray-700 whitespace-nowrap"> Save </button> </div> {apiKeySaveFeedback && ( <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-xs mt-1"> {apiKeySaveFeedback} </motion.p> )} </motion.div> )} </AnimatePresence>
                </div>
                <p className="text-[#8c6e54] text-xs italic mt-4 mb-2"> No accounts. No cloud. Just you and your thoughts. </p>
                <p className="text-[#9c8063] text-xs"> lovingly crafted by <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-200 transition"> Rajin Khan </a> </p>
                <button onClick={() => setShowInfoModal(false)} className="mt-5 px-5 py-1.5 text-sm bg-white/50 border border-white/30 rounded-full hover:bg-white/70 transition text-gray-700" > Close </button>
                <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-600 opacity-70"> Background video via <a href="https://moewalls.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">MoeWalls</a> </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest of the UI (Browser Warning, Video, Top-Right Buttons, File Modal, Peek Bar, Editor Sheet) */}
      {/* --- KEEP ALL BETA JSX BELOW THIS LINE --- */}
       {/* Original Browser Compatibility Warning */}
       {!window.showDirectoryPicker && ( <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow"> PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available. </div> )}
       {/* Original Background Video */}
       <video autoPlay muted loop playsInline preload="auto" className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"> <source src="/background.webm" type="video/webm" /> <source src="/background.mp4" type="video/mp4" /> Your browser does not support the video tag. </video>
       {/* Background decorative elements */}
       <motion.div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#f8e8d4] opacity-20" animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.15, 0.2] }} transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }} />
       <motion.div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#f8e8d4] opacity-20" animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.25, 0.2] }} transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }} />
       {/* Onboarding Overlay */}
       <AnimatePresence> {(!folderHandle || isFirstSave) && !showInfoModal && ( <motion.div className="fixed inset-0 bg-black/60 z-40 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} /> )} </AnimatePresence>
       {/* Top-right Buttons Area */}
       <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
         {/* Onboarding Message */}
         <AnimatePresence> {(!folderHandle || isFirstSave) && !showInfoModal && ( <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="font-serif text-sm text-gray-500 mr-3 bg-[#fff7ee] border border-[#e6ddcc] rounded-full px-4 py-1 shadow-sm" > {!folderHandle ? "Select a folder (Cmd/Ctrl + O)" : "Save Note (Cmd/Ctrl + S)"} </motion.span> )} </AnimatePresence>
         {/* FAB Container */}
         <div className="flex items-center space-x-3 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
           {/* Focus Mode Toggle */}
           <button onClick={toggleFocusMode} className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-100' : 'text-gray-600'}`} title={focusMode ? "Exit Focus Mode (Cmd+Shift+F)" : "Focus Mode (Cmd+Shift+F)"} > <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /> </svg> </button>
           {/* Folder Button */}
           <motion.button onClick={handleFolderButton} className="opacity-60 hover:opacity-100 transition text-gray-400" title={folderHandle ? "Open Notes Folder (Cmd+O)" : "Select Notes Folder (Cmd+O)"} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} > <FolderOpen size={20} /> </motion.button>
           {/* Save/Check Button */}
           {isFirstSave ? ( <motion.button onClick={handleSave} className={`opacity-60 transition text-gray-400 ${!noteName.trim() ? 'cursor-not-allowed opacity-30' : 'hover:opacity-100'}`} title="Save Note (Cmd+S)" whileHover={noteName.trim() ? { scale: 1.1 } : {}} whileTap={noteName.trim() ? { scale: 0.95 } : {}} disabled={!noteName.trim()} > <Save size={20} /> </motion.button> ) : ( <motion.div animate={{ rotate: saveIndicator ? [0, 20, 0] : 0, scale: saveIndicator ? [1, 1.2, 1] : 1, color: saveIndicator ? ["#6b7280", "#10b981", "#6b7280"] : "#9ca3af" }} transition={{ duration: 0.5 }} title="Note Autosaved" > <Check size={20} className="opacity-100" /> </motion.div> )}
           {/* Toggle Editor */}
           <motion.button onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }} className="opacity-60 hover:opacity-100 transition text-gray-400" title={isEditorVisible ? 'Hide Editor (Cmd+.)' : 'Show Editor (Cmd+.)'} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} > {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />} </motion.button>
         </div>
         {/* Info Modal Placeholder - Actual JSX is rendered near top-left buttons */}
       </div>
       {/* File Explorer Modal */}
       <AnimatePresence> {showFileModal && folderHandle && ( <motion.div className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setShowFileModal(false)} > <motion.div className="bg-white/60 backdrop-blur-2xl border-white/40 rounded-xl shadow-xl border border-[#e6ddcc] w-[20rem] max-h-[60vh] overflow-y-auto p-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", duration: 0.4 }} onClick={e => e.stopPropagation()} > <div className="flex justify-between items-center mb-3"> <h2 className="font-serif text-lg text-gray-800">Your Notes</h2> <motion.button onClick={() => setShowFileModal(false)} className="text-gray-500 hover:text-gray-800" title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}> <X size={18} /> </motion.button> </div> {fileList.length === 0 ? ( <p className="text-sm text-gray-500 italic px-2 py-1">No markdown notes (.md) found in the selected folder.</p> ) : ( <div className="space-y-1"> {fileList.map((filename, index) => ( <motion.button key={filename} onClick={() => handleOpenFile(filename)} className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1.5 rounded transition-colors duration-100" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 3 }} title={`Open ${filename}`} > {filename.replace(/\.md$/, "")} </motion.button> ))} </div> )} <button onClick={pickFolder} className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700 underline py-1"> Change Folder </button> </motion.div> </motion.div> )} </AnimatePresence>
       {/* Title peek bar */}
       <AnimatePresence> {!isEditorVisible && dropAnimationComplete && ( <motion.div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}> <motion.div className="bg-white/70 backdrop-blur-lg border-t border-white/30 rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer" onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }} whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}> <motion.span className="font-serif text-lg tracking-tight text-[#1a1a1a]" animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}> puffnotes </motion.span> <span className="text-gray-400">|</span> <span className="font-serif text-sm text-gray-500 max-w-[150px] sm:max-w-xs truncate" title={noteName || "untitled"}> {noteName || "untitled"} </span> </motion.div> </motion.div> )} </AnimatePresence>
       {/* Editor Sheet */}
       <motion.div className="fixed bottom-0 left-0 right-0 z-20" initial={false} animate={{ y: isEditorVisible ? 0 : '101%' }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }} onAnimationComplete={() => setDropAnimationComplete(true)} >
         <div className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative transition-all duration-500 ${focusMode ? 'bg-white/35 backdrop-blur-2xl' : 'bg-white/80 backdrop-blur-lg'}`} >
           {/* Editor Header */}
           <motion.div className="flex justify-between items-center mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: focusMode ? 'none' : 'auto' }} >
             <motion.h1 className="font-serif text-2xl tracking-tight text-[#1a1a1a] flex-shrink-0" whileHover={!focusMode ? { x: 2 } : {}}> puffnotes </motion.h1>
             <div className="flex-1 flex justify-center items-center gap-2 mx-4 min-w-0">
               <motion.input type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)} className={`text-center font-serif text-sm bg-transparent outline-none text-gray-500 w-full max-w-[70%] border-b border-transparent focus:border-gray-300 transition-opacity duration-300 ${focusMode || isPreviewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} placeholder="note name..." whileFocus={{ scale: 1.02 }} disabled={focusMode || isPreviewMode} />
               {!showBeautifyControls && !focusMode && note.trim() && ( <motion.button onClick={togglePreviewMode} title={isPreviewMode ? "Edit Note (Cmd+P)" : "Preview Markdown (Cmd+P)"} className="opacity-60 hover:opacity-100 transition text-gray-500 hover:text-gray-800 p-1 flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} > {isPreviewMode ? <Pen size={18} /> : <Eye size={18} />} </motion.button> )}
             </div>
             <div className="flex space-x-4 text-lg text-gray-600 flex-shrink-0">
               <motion.button title="Export as PDF (Cmd+E)" onClick={handleExportPdf} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900 p-1 disabled:opacity-30" disabled={!(showBeautifyControls ? previewNote : note).trim() || isExportingPdf} > {isExportingPdf ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={18} className="text-gray-400" /> </motion.div> ) : ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <polyline points="14 2 14 8 20 8"></polyline> <path d="M9 15h6"></path> <path d="M9 11h6"></path> </svg> )} </motion.button>
               <motion.button title="New Note (Cmd+K)" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900 p-1"> <FilePlus size={18} /> </motion.button>
             </div>
           </motion.div>
           <motion.hr className="border-[#e0ddd5] mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.2 : 1 }} />
           {/* Textarea/Preview Area */}
           <div className="flex-1 overflow-y-auto relative" > {isPreviewMode && !showBeautifyControls ? ( <MarkdownPreview markdownText={note} /> ) : ( <textarea value={showBeautifyControls ? previewNote : note} onChange={(e) => { if (!showBeautifyControls) { setNote(e.target.value); } }} placeholder="A quiet place to write. No cloud. No noise. Just thoughts, beautifully yours." className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-gray-400 placeholder:italic transition-all duration-300 text-gray-800 ${focusMode ? 'text-lg' : 'text-sm'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} readOnly={isBeautifying || showBeautifyControls} /> )} </div>
           {/* Beautify Floating Control */}
           {note.trim() && !focusMode && !isPreviewMode && ( <div className="absolute bottom-6 right-6 z-30 flex-shrink-0"> {!showBeautifyControls ? ( <motion.button title="Beautify with AI (Cmd+Enter)" onClick={() => handleBeautify(false)} disabled={isBeautifying || !note.trim()} className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] text-gray-700 ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`} whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}} whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}} animate={isBeautifying ? { rotate: 360 } : {}} transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}> {isBeautifying ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={20} className="text-[#9a8c73]" /> </motion.div> ) : ( <Wand2 size={20} /> )} </motion.button> ) : ( <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all"> <span className="font-serif text-sm text-gray-600 hidden sm:inline"> AI Preview: </span> <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <CheckCircle size={20} /> </motion.button> <motion.button title="Regenerate" onClick={regenerateBeautified} className={`bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df] transition-colors ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}> <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} /> </motion.button> <motion.button title="Reject Changes" onClick={rejectBeautified} className="bg-red-100 text-red-600 rounded-full p-2 border border-red-200 hover:bg-red-100 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <XCircle size={20} /> </motion.button> </motion.div> )} </div> )}
         </div>
       </motion.div>

    </div>
  );
}