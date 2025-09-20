// src/components/OnlineApp.jsx
import { useState, useEffect, useRef } from 'react';
import {
  FilePlus, FolderOpen, ChevronDown, ChevronUp, X, Wand2, Check,
  RotateCw, XCircle, CheckCircle, Info, KeyRound, Eye, Pen,
  Keyboard, LogOut, AlertTriangle, Loader2, Home, HelpCircle
} from 'lucide-react';
import { beautifyNoteWithGroq } from '../lib/groq';
import { AnimatePresence, motion } from 'framer-motion';
import MarkdownPreview from './MarkdownPreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as ReactDOM from 'react-dom/client';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import OnboardingModal from './OnboardingModal';
import { signOut } from '../lib/firebase';
import { listNotes, getNoteContent, saveNoteContent } from '../lib/googleDrive';

const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1';
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

const onlineOnboardingSteps = [
  {
    title: "Welcome to Your Editor",
    description: "This is your creative space. Give your notes a name. Everything's saved automatically in Google Drive.",
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

export default function OnlineApp({ user, accessToken, folderId, onSignOut, onGoToLanding }) {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('puffnotes_onboarding_online_complete')
  );
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const apiKeyInputRef = useRef(null);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [note, setNote] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteName, setNoteName] = useState("untitled");
  const [fileList, setFileList] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [previewNote, setPreviewNote] = useState("");
  const [showBeautifyControls, setShowBeautifyControls] = useState(false);
  const [originalNote, setOriginalNote] = useState("");
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [focusMode, setFocusMode] = useState(false);
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isLoadingNote, setIsLoadingNote] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const noteContentRef = useRef(note);
  const videoRef = useRef(null);
  
  const handleFinishOnboarding = () => {
    localStorage.setItem('puffnotes_onboarding_online_complete', 'true');
    setShowOnboarding(false);
  };
  
  const handleShowOnboarding = () => {
    setShowOnboarding(true);
  };
  
  useEffect(() => { noteContentRef.current = note; }, [note]);
  useEffect(() => { if (videoRef.current) { videoRef.current.play().catch(error => { console.warn("Video autoplay was prevented by the browser:", error); }); } }, []);
  const refreshFileList = async () => { try { const files = await listNotes(accessToken, folderId); setFileList(files || []); return files; } catch (err) { console.error("Failed to refresh file list:", err); setFileList([]); return []; } };
  const handleOpenFile = async (file) => { if (!file || isLoadingNote) return; setIsLoadingNote(true); setShowFileModal(false); try { const content = await getNoteContent(accessToken, file.id); const baseName = file.name.replace(/\.md$/, ""); setNote(content); noteContentRef.current = content; setNoteName(baseName); setActiveNoteId(file.id); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); setSaveStatus('saved'); } catch (err) { console.error("Error opening file:", err); alert(`Failed to open file: ${file.name}. Error: ${err.message}`); } finally { setIsLoadingNote(false); } };
  const handleNewNote = () => { if (saveStatus === 'saving') return; setNote(""); noteContentRef.current = ""; setNoteName("untitled"); setActiveNoteId(null); setPreviewNote(""); setShowBeautifyControls(false); setOriginalNote(""); setIsPreviewMode(false); setSaveStatus('unsaved'); };
  const handleAutoSave = async (isNewNote = false) => { if (!noteName.trim()) { if (isNewNote) alert("Please name your note before saving."); return; } setSaveStatus('saving'); try { const savedFile = await saveNoteContent(accessToken, folderId, noteContentRef.current, activeNoteId, noteName); if (!activeNoteId) { setActiveNoteId(savedFile.id); } await refreshFileList(); setSaveStatus('saved'); } catch (err) { console.error("Autosave failed:", err); setSaveStatus('unsaved'); alert(`Failed to save note: ${err.message}`); } };
  const handleBeautify = async (isRegeneration = false) => { const noteToProcess = isRegeneration ? (originalNote || note) : note; if (!noteToProcess.trim()) return; const keyToUse = userApiKey || DEFAULT_GROQ_API_KEY; if (!keyToUse) { console.error("No Groq API Key available (User or Default)."); setApiKeyError(true); setApiKeySaveFeedback(''); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); return; } setIsBeautifying(true); if (!isRegeneration) { setOriginalNote(note); } setApiKeyError(false); setApiKeySaveFeedback(''); try { const result = await beautifyNoteWithGroq(noteToProcess, keyToUse); setPreviewNote(result); setShowBeautifyControls(true); setIsPreviewMode(false); } catch (err) { console.error("Beautify request failed:", err); let userMessage = `AI Beautify failed: ${err.message || 'Unknown error'}`; const isAuthOrRateLimitError = err.status === 401 || err.status === 403 || err.status === 429; if (!userApiKey && keyToUse === DEFAULT_GROQ_API_KEY && isAuthOrRateLimitError) { userMessage = "The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue."; setApiKeyError(true); setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); } else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) { userMessage = "Your Groq API key seems invalid or rate-limited. Please check it or generate a new one."; setShowInfoModal(true); setShowApiKeyInput(true); setTimeout(() => apiKeyInputRef.current?.focus(), 100); alert(userMessage); } else { alert(userMessage); } setPreviewNote(""); setShowBeautifyControls(false); } finally { setIsBeautifying(false); } };
  const acceptBeautified = () => { setNote(previewNote); setPreviewNote(""); setOriginalNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); setSaveStatus('unsaved'); };
  const rejectBeautified = () => { setPreviewNote(""); setShowBeautifyControls(false); setIsPreviewMode(false); };
  const regenerateBeautified = () => { handleBeautify(true); };
  const handleSaveUserApiKey = (key) => { const trimmedKey = key ? key.trim() : ''; localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey); setUserApiKey(trimmedKey); setApiKeyError(false); setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.'); setTimeout(() => setApiKeySaveFeedback(''), 2500); };
  const handleExportPdf = async () => { const contentToExport = showBeautifyControls ? previewNote : note; if (!contentToExport.trim() || isExportingPdf) return; setIsExportingPdf(true); const filename = (noteName.trim() || "untitled") + ".pdf"; const pageBackgroundColor = '#fdfbf7'; const headerTextColor = '#a8a29a'; const headerText = "puffnotes"; const headerFontSize = 9; const margin = 18; const headerTopMargin = 15; const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true, floatPrecision: 'smart' }); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight(); const contentWidthMM = pdfWidth - (margin * 2); const contentHeightMM = pdfHeight - (margin * 2) - 10; const contentWidthPX = Math.floor(contentWidthMM * 3.78); const tempContainerId = 'pdf-render-container'; let tempContainer = document.getElementById(tempContainerId); if (!tempContainer) { tempContainer = document.createElement('div'); tempContainer.id = tempContainerId; tempContainer.style.position = 'absolute'; tempContainer.style.left = '-9999px'; tempContainer.style.top = '-9999px'; tempContainer.style.border = '1px solid transparent'; document.body.appendChild(tempContainer); } else { tempContainer.innerHTML = ''; } tempContainer.style.width = `${contentWidthPX}px`; tempContainer.style.padding = `1px`; tempContainer.style.background = pageBackgroundColor; tempContainer.style.fontFamily = 'monospace'; tempContainer.style.fontSize = '14px'; tempContainer.style.lineHeight = '1.625'; tempContainer.style.color = '#1f2937'; tempContainer.style.height = 'auto'; tempContainer.style.display = 'inline-block'; const root = ReactDOM.createRoot(tempContainer); root.render(<MarkdownPreview markdownText={contentToExport} />); await new Promise(resolve => setTimeout(resolve, 500)); try { const selectorsAndColors = [ { selector: '.text-gray-800', color: '#1f2937' }, { selector: '.text-gray-600', color: '#4b5563' }, { selector: 'blockquote', color: '#4b5563' }, { selector: '.border-\\[\\#e6ddcc\\]', color: '#e6ddcc', styleProp: 'borderColor' }, { selector: '.bg-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'backgroundColor' }, { selector: '.text-\\[\\#9a8c73\\]', color: '#9a8c73' }, { selector: '.bg-\\[\\#fdf6ec\\]', color: '#fdf6ec', styleProp: 'backgroundColor' }, ]; selectorsAndColors.forEach(({ selector, color, styleProp = 'color' }) => { try { const elements = tempContainer.querySelectorAll(selector); elements.forEach(el => { const className = selector.startsWith('.') ? selector.substring(1).replace(/\\/g, '') : null; if ((className && el.classList.contains(className)) || !selector.startsWith('.')) { el.style[styleProp] = color; } }); } catch (e) { console.warn(`Failed override for selector: ${selector}`, e); } }); } catch (e) { console.warn("Error applying style overrides:", e); } try { const canvas = await html2canvas(tempContainer, { scale: 3, useCORS: true, logging: false, backgroundColor: pageBackgroundColor, width: tempContainer.scrollWidth, height: tempContainer.scrollHeight, windowWidth: tempContainer.scrollWidth, windowHeight: tempContainer.scrollHeight, scrollX: 0, scrollY: 0, removeContainer: false, imageTimeout: 15000 }); const imgData = canvas.toDataURL('image/png'); const imgProps = pdf.getImageProperties(imgData); const canvasWidthPX = canvas.width; const canvasHeightPX = canvas.height; const scaleFactor = contentWidthMM / canvasWidthPX; const totalHeightMM = canvasHeightPX * scaleFactor; const pixelsPerPage = contentHeightMM / scaleFactor; const addPageStyling = () => { pdf.setFillColor(pageBackgroundColor); pdf.rect(0, 0, pdfWidth, pdfHeight, 'F'); pdf.setFontSize(headerFontSize); try { pdf.setFont('times', 'normal'); } catch (e) { pdf.setFont('serif', 'normal'); } pdf.setTextColor(headerTextColor); pdf.text(headerText, margin, headerTopMargin); }; addPageStyling(); let remainingHeight = canvasHeightPX; let currentY = 0; while (remainingHeight > 0) { const heightToUse = Math.min(remainingHeight, pixelsPerPage); const tempCanvas = document.createElement('canvas'); tempCanvas.width = canvasWidthPX; tempCanvas.height = heightToUse; const tempCtx = tempCanvas.getContext('2d'); tempCtx.drawImage( canvas, 0, currentY, canvasWidthPX, heightToUse, 0, 0, canvasWidthPX, heightToUse ); const pageImgData = tempCanvas.toDataURL('image/png'); pdf.addImage( pageImgData, 'PNG', margin, margin, contentWidthMM, heightToUse * scaleFactor, undefined, 'FAST' ); currentY += heightToUse; remainingHeight -= heightToUse; if (remainingHeight > 0) { pdf.addPage(); addPageStyling(); } } pdf.save(filename); } catch (error) { console.error("Error generating PDF:", error); let message = `Failed to export PDF.`; if (error.message && error.message.includes('color function "oklch"')) { message += ' A style used in the note might not be supported.'; } else { message += ` ${error.message || 'Check console for details.'}`; } alert(message); } finally { root.unmount(); if (tempContainer && tempContainer.parentNode) { tempContainer.parentNode.removeChild(tempContainer); } setIsExportingPdf(false); } };
  const toggleFocusMode = () => setFocusMode(prev => !prev);
  const togglePreviewMode = () => { if (!showBeautifyControls) setIsPreviewMode(prev => !prev); };
  useEffect(() => { const loadInitialFiles = async () => { const files = await refreshFileList(); if (files.length > 0) { handleOpenFile(files[0]); } setIsInitialLoad(false); }; loadInitialFiles(); }, [folderId, accessToken]);
  useEffect(() => { if (isInitialLoad || saveStatus !== 'unsaved') { return; } const handler = setTimeout(() => { handleAutoSave(); }, 1500); return () => { clearTimeout(handler); }; }, [note, noteName, saveStatus, isInitialLoad]);
  const handleNoteChange = (e) => { const newContent = e.target.value; if (!showBeautifyControls) { setNote(newContent); setSaveStatus('unsaved'); } };
  const handleNoteNameChange = (e) => { setNoteName(e.target.value); setSaveStatus('unsaved'); };
  useEffect(() => { const handleKeyDown = (e) => { const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0; const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey; const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName); if (isTyping && document.activeElement !== document.querySelector("textarea")) return; if (ctrlOrCmd && e.key === 'Enter') { e.preventDefault(); if (!isBeautifying && note.trim()) handleBeautify(false); } else if (ctrlOrCmd && e.key.toLowerCase() === 'p') { e.preventDefault(); if (!showBeautifyControls) setIsPreviewMode(prev => !prev); } else if (ctrlOrCmd && e.key.toLowerCase() === 'e') { e.preventDefault(); handleExportPdf(); } else if (ctrlOrCmd && e.key.toLowerCase() === 'k') { e.preventDefault(); handleNewNote(); } else if (ctrlOrCmd && e.key.toLowerCase() === 's') { e.preventDefault(); if(saveStatus === 'unsaved') handleAutoSave(); } else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFocusMode(); } else if (ctrlOrCmd && e.key.toLowerCase() === 'o') { e.preventDefault(); setShowFileModal(p => !p); } else if (ctrlOrCmd && e.key.toLowerCase() === '.') { setDropAnimationComplete(false); setIsEditorVisible(prev => !prev); } else if (ctrlOrCmd && e.key === '/') { setShowShortcutsModal(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [note, isBeautifying, showBeautifyControls, saveStatus, handleBeautify, handleExportPdf, handleNewNote, handleAutoSave, toggleFocusMode, setShowShortcutsModal]);

  return (
    <>
      <AnimatePresence>
        {showOnboarding && <OnboardingModal steps={onlineOnboardingSteps} onFinish={handleFinishOnboarding} />}
      </AnimatePresence>
      <div className={`min-h-screen bg-[#fdf6ec] relative overflow-hidden transition-all duration-300 ${showOnboarding ? 'blur-sm scale-105' : 'blur-0 scale-100'}`}>
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50 flex items-center space-x-2">
            <motion.button onClick={onGoToLanding} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Back to Home" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Home size={17} strokeWidth={2} className="text-gray-200" />
            </motion.button>
            <motion.button onClick={() => { setApiKeyError(false); setShowInfoModal(true); setShowApiKeyInput(!!userApiKey); setApiKeySaveFeedback(''); }} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="About puffnotes" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <Info size={17} strokeWidth={2} className="text-gray-200" /> </motion.button>
            <motion.button onClick={() => setShowShortcutsModal(true)} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Keyboard Shortcuts (Cmd+/)" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Keyboard size={17} strokeWidth={2} className="text-gray-200" />
            </motion.button>
            <motion.button onClick={onSignOut} className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm" title="Sign Out" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <LogOut size={17} strokeWidth={2} className="text-gray-200" />
            </motion.button>
        </div>

        <video ref={videoRef} autoPlay muted loop playsInline preload="auto" className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none">
          <source src="/puff.webm" type="video/webm" />
          <source src="/puff.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* --- THE FIX: The Help Button is now here, on the main background div --- */}
        <div className="absolute bottom-4 left-4 z-50">
            <motion.button
                title="How does it work?"
                onClick={handleShowOnboarding}
                className="opacity-70 hover:opacity-90 transition p-2 rounded-full border border-gray-300 shadow-sm"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <HelpCircle size={20} strokeWidth={2} className="text-gray-200" />
            </motion.button>
        </div>

        <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-50 flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
                <button onClick={toggleFocusMode} className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-200' : 'text-gray-600'}`} title={focusMode ? "Exit Focus Mode" : "Focus Mode"}> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /> </svg> </button>
                <motion.button onClick={() => setShowFileModal(p => !p)} className="opacity-60 hover:opacity-100 transition text-gray-400" title="Open Notes Folder" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> <FolderOpen size={20} /> </motion.button>
                 <div title={saveStatus === 'saved' ? 'All changes saved' : (saveStatus === 'saving' ? 'Saving...' : 'Unsaved changes')} className="flex items-center">
                    {saveStatus === 'saving' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Loader2 size={20} className="text-gray-400" />
                        </motion.div>
                    ) : saveStatus === 'saved' ? (
                        <Check size={20} className="text-green-500 opacity-80" />
                    ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        </div>
                    )}
                </div>
                <motion.button onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }} className="opacity-60 hover:opacity-100 transition text-gray-400" title={isEditorVisible ? 'Hide Editor' : 'Show Editor'} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}> {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />} </motion.button>
            </div>
            <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
            <AnimatePresence> {showInfoModal && ( <motion.div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInfoModal(false)}> <motion.div className="bg-white border border-[#e6ddcc] rounded-xl shadow-2xl p-6 sm:p-8 pt-6 w-full max-w-md text-center font-serif relative" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3 }} onClick={e => e.stopPropagation()}> <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition" aria-label="Close modal"> <X size={18} /> </button> <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2> <AnimatePresence> {apiKeyError && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-xs my-3 text-left flex items-center gap-2 overflow-hidden"> <AlertTriangle size={14} className="flex-shrink-0" /> <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span> </motion.div> )} </AnimatePresence> <p className="text-[#6b7280] text-sm leading-relaxed mb-4"> A serene space for note-taking — simple, offline, and distraction-free.<br /> Click the <Wand2 size={14} className="inline mb-0.5 text-[#9a8c73]" /> wand to magically expand and beautify your notes using AI. </p> <div className="text-left text-xs border-t border-gray-200 pt-4 mt-4 space-y-2"> <div className="flex justify-between items-center"> <p className="text-gray-600 font-medium flex items-center gap-1.5"> <KeyRound size={14} /> <span>Personal AI key (Recommended)</span> </p> <button onClick={() => setShowApiKeyInput(prev => !prev)} className="text-gray-500 hover:text-gray-800 text-xs underline"> {showApiKeyInput ? 'Hide' : 'Add/Edit'} </button> </div> <AnimatePresence> {showApiKeyInput && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2"> <p className="text-gray-500 leading-snug"> Add your free Groq API key for unlimited AI use. Get one in seconds at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline hover:text-orange-400">Groq Console</a>. </p> <div className="flex items-center gap-2"> <input ref={apiKeyInputRef} type="password" placeholder="Paste Groq API Key (gsk_...)" defaultValue={userApiKey} className="flex-grow px-2 py-1 text-xs border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-300 font-mono" /> <button onClick={() => handleSaveUserApiKey(apiKeyInputRef.current?.value || '')} className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition text-gray-700 whitespace-nowrap"> Save </button> </div> {apiKeySaveFeedback && ( <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-xs mt-1"> {apiKeySaveFeedback} </motion.p> )} </motion.div> )} </AnimatePresence> </div> <p className="text-[#8c6e54] text-xs italic mt-4 mb-2"> No accounts. No cloud. Just you and your thoughts. </p> <p className="text-[#9c8063] text-xs"> lovingly crafted by <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-200 transition"> Rajin Khan </a> </p> <button onClick={() => setShowInfoModal(false)} className="mt-5 px-5 py-1.5 text-sm bg-[#fff7ee] border border-[#e0ddd5] rounded-full hover:bg-[#f0e9df] transition text-gray-700"> Close </button> <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 opacity-50"> Background video via <a href="https://moewalls.com" target="_blank" rel="noopener noreferrer" className="underline">MoeWalls</a> </p> </motion.div> </motion.div> )} </AnimatePresence>
        </div>
        
        <AnimatePresence> {showFileModal && ( <motion.div className="fixed inset-0 z-30 bg-black bg-opacity-30 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setShowFileModal(false)}> <motion.div className="bg-white rounded-xl shadow-xl border border-[#e6ddcc] w-full max-w-xs max-h-[60vh] overflow-y-auto p-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", duration: 0.4 }} onClick={e => e.stopPropagation()}> <div className="flex justify-between items-center mb-3"> <h2 className="font-serif text-lg text-gray-800">Your Notes</h2> <motion.button onClick={() => setShowFileModal(false)} className="text-gray-500 hover:text-gray-800" title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}> <X size={18} /> </motion.button> </div> {fileList.length === 0 ? ( <p className="text-sm text-gray-500 italic px-2 py-1">No notes found in your Google Drive's "puffnotes" folder.</p> ) : ( <div className="space-y-1"> {fileList.map((file, index) => ( <motion.button key={file.id} onClick={() => handleOpenFile(file)} className={`block w-full text-left text-sm font-mono hover:bg-[#f8f6f2] px-2 py-1.5 rounded transition-colors duration-100 ${activeNoteId === file.id ? 'text-orange-400' : 'text-[#333]'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 3 }} title={`Open ${file.name}`}> {file.name.replace(/\.md$/, "")} </motion.button> ))} </div> )} </motion.div> </motion.div> )} </AnimatePresence>

        <AnimatePresence> {!isEditorVisible && dropAnimationComplete && ( <motion.div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}> <motion.div className="bg-white border-t border-[#e6ddcc] rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer" onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }} whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}> <motion.span className="font-serif text-lg tracking-tight text-[#1a1a1a]" animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 2, ease: "easeInOut" }}> puffnotes </motion.span> <span className="text-gray-400">|</span> <span className="font-serif text-sm text-gray-500 max-w-[150px] sm:max-w-xs truncate" title={noteName || "untitled"}> {noteName || "untitled"} </span> </motion.div> </motion.div> )} </AnimatePresence>

        <motion.div className="fixed bottom-0 left-0 right-0 z-20" initial={false} animate={{ y: isEditorVisible ? 0 : '101%' }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }} onAnimationComplete={() => setDropAnimationComplete(true)}>
          <div className={`rounded-t-2xl shadow-2xl max-w-full sm:max-w-3xl mx-auto p-4 sm:p-6 h-[88vh] sm:h-[90vh] flex flex-col relative transition-colors duration-500 ${focusMode ? 'bg-[#fdfbf7]' : 'bg-white'}`}>
             <motion.div className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }} style={{ pointerEvents: focusMode ? 'none' : 'auto' }}>
              <motion.h1 className="font-serif text-xl sm:text-2xl tracking-tight text-[#1a1a1a] flex-shrink-0" whileHover={!focusMode ? { x: 2 } : {}}> puffnotes </motion.h1>
              <div className="flex-1 flex justify-center items-center gap-2 mx-2 sm:mx-4 min-w-0">
                 <motion.input type="text" value={noteName} onChange={handleNoteNameChange} className={`text-center font-serif text-xs sm:text-sm bg-transparent outline-none text-gray-500 w-full max-w-[50%] sm:max-w-[70%] border-b border-transparent focus:border-gray-300 transition-opacity duration-300 ${focusMode || isPreviewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} placeholder="note name..." whileFocus={{ scale: 1.02 }} disabled={focusMode || isPreviewMode} />
                 {!showBeautifyControls && !focusMode && note.trim() && (
                     <motion.button onClick={togglePreviewMode} title={isPreviewMode ? "Edit Note" : "Preview Markdown"} className="opacity-60 hover:opacity-100 transition text-gray-500 hover:text-gray-800 p-1 flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                         {isPreviewMode ? <Pen size={16} /> : <Eye size={16} />}
                     </motion.button>
                  )}
              </div>
              <div className="flex space-x-2 sm:space-x-4 text-lg text-gray-600 flex-shrink-0">
                <motion.button title="Export as PDF" onClick={handleExportPdf} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900 p-1 disabled:opacity-30" disabled={!(showBeautifyControls ? previewNote : note).trim() || isExportingPdf}>
                  {isExportingPdf ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RotateCw size={18} className="text-gray-400" />
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
                <motion.button title="New Note" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900 p-1">
                  <FilePlus size={18} />
                </motion.button>
              </div>
            </motion.div>
            <motion.hr className="border-gray-200 mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.2 : 1 }} />
            <div className="flex-1 overflow-y-auto relative" >
              {(isLoadingNote || isInitialLoad) ? (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 font-serif">Loading note...</div>
              ) : isPreviewMode && !showBeautifyControls ? (
                  <MarkdownPreview markdownText={note} />
               ) : (
                  <textarea value={showBeautifyControls ? previewNote : note} onChange={handleNoteChange} placeholder="A quiet place to write..." className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-gray-400 placeholder:italic transition-all duration-300 text-gray-800 ${focusMode ? 'text-base px-2' : 'text-sm'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`} readOnly={isBeautifying || showBeautifyControls} />
               )}
            </div>
             <AnimatePresence>
                {isEditorVisible && !focusMode && !isPreviewMode && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    {note.trim() && (
                      <div className="absolute bottom-4 right-4 z-30 flex-shrink-0">
                      {!showBeautifyControls ? (
                        <motion.button title="Beautify with AI" onClick={() => handleBeautify(false)} disabled={isBeautifying || !note.trim()} className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] text-gray-700 ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`} whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}} whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}} animate={isBeautifying ? { rotate: 360 } : {}} transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}>
                          {isBeautifying ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={20} className="text-[#9a8c73]" /> </motion.div> ) : ( <Wand2 size={20} /> )}
                        </motion.button>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all">
                          <span className="font-serif text-sm text-gray-600 hidden sm:inline"> AI Preview: </span>
                          <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <CheckCircle size={20} /> </motion.button>
                          <motion.button title="Regenerate" onClick={regenerateBeautified} className={`bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df] transition-colors ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}> <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} /> </motion.button>
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
      </div>
    </>
  );
}