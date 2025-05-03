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
  Eye, // <-- Import Eye icon
  Pen, // <-- Import Pen icon
} from 'lucide-react'; // Changed Edit to Pen for clarity if needed, or keep Edit
import { beautifyNoteWithGroq } from './lib/groq';
import { AnimatePresence, motion } from 'framer-motion';

// --- Import the new MarkdownPreview component ---
import MarkdownPreview from './components/MarkdownPreview'; // Adjust path if needed

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as ReactDOM from 'react-dom/client';

// --- Added Constants from Production ---
const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1';
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export default function App() {
  // --- Beta State ---
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [note, setNote] = useState("");
  const [noteName, setNoteName] = useState("untitled");
  const [fileList, setFileList] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);
  // const [showFileActions, setShowFileActions] = useState(false); // Beta had this, commented out as in prod
  const [previewNote, setPreviewNote] = useState("");
  const [showBeautifyControls, setShowBeautifyControls] = useState(false);
  const [originalNote, setOriginalNote] = useState("");
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // --- Added State from Production ---
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState('');
  const apiKeyInputRef = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const {
    folderHandle,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
  } = useFileSystemAccess();

  // --- Merged/Updated Functions ---
  const refreshFileList = async () => {
    // Keep beta logic, add production's error handling
    if (folderHandle) {
        try {
            const files = await listFiles();
            setFileList(files || []); // Ensure files is an array
        } catch (err) {
            console.error("Failed to refresh file list:", err);
            setFileList([]); // Reset on error
        }
    } else {
        setFileList([]); // Clear if no folder handle
    }
  };

  const handleOpenFile = async (filename) => {
    // Keep beta logic, add production's safety checks and preview reset
    if (!filename) return;
    try {
        const content = await loadNote(filename);
        if (content === null) {
             // Added specific error from prod
            alert(`Could not load file: ${filename}. Folder permissions might have changed.`);
            return;
        }
        const baseName = filename.replace(/\.md$/, "");
        setNote(content);
        setNoteName(baseName);
        setIsFirstSave(false);
        setShowFileModal(false);
        // --- Added resets from Production ---
        setPreviewNote("");
        setShowBeautifyControls(false);
        setOriginalNote("");
        setIsPreviewMode(false); // <-- Reset manual preview mode
    } catch (err) {
        console.error("Error opening file:", err);
        alert(`Failed to open file: ${filename}. Error: ${err.message}`);
    }
  };

  const handleNewNote = () => {
    // Keep beta logic, add production's resets
    setNote("");
    setNoteName("untitled");
    setIsFirstSave(true);
    setPreviewNote("");
    setShowBeautifyControls(false);
    // --- Added resets from Production ---
    setOriginalNote("");
    setIsPreviewMode(false); // <-- Reset manual preview mode
  };

  const handleSave = async () => {
     // Keep beta logic (already similar to prod, includes saveIndicator)
     // Added folder picking logic from prod if handle doesn't exist
    let currentFolderHandle = folderHandle;
    if (!currentFolderHandle) {
        try {
            const picked = await pickFolder();
            if (!picked) return; // User cancelled
            currentFolderHandle = picked; // Update local var, hook updates state
            // Refresh list after picking for the first time? Optional.
            // await refreshFileList();
        } catch (err) {
            console.error("Error picking folder during save:", err);
            if (err.name !== 'AbortError') {
                alert("Could not get permission to access the folder.");
            }
            return;
        }
    }

    if (!noteName.trim()) {
         alert("Please enter a name for your note before saving."); // Added from prod
         return;
    }

    const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
    try {
        const savedAs = await saveNote(filename, note, isFirstSave);
        if (savedAs) {
            const baseName = savedAs.replace(/\.md$/, "");
            setNoteName(baseName);
            setIsFirstSave(false);
            refreshFileList(); // Refresh list after successful save
            setSaveIndicator(true);
            setTimeout(() => setSaveIndicator(false), 1500);
        } else if (isFirstSave) {
            console.log("Save As dialog cancelled."); // Added from prod
        }
    } catch (err) {
        console.error("Error saving file:", err);
        alert(`Failed to save note: ${filename}. Error: ${err.message}`);
    }
  };

  const handleBeautify = async (isRegeneration = false) => { // Added isRegeneration from prod
    // Merged beta logic with production's API key checks and error handling
    const noteToProcess = isRegeneration ? (originalNote || note) : note; // Added from prod
    if (!noteToProcess.trim()) return; // Added from prod

    const keyToUse = userApiKey || DEFAULT_GROQ_API_KEY; // Added from prod
    if (!keyToUse) { // Added from prod
        console.error("No Groq API Key available (User or Default).");
        setApiKeyError(true);
        setApiKeySaveFeedback('');
        setShowInfoModal(true); // Show modal to add key
        setShowApiKeyInput(true); // Expand input section
        setTimeout(() => apiKeyInputRef.current?.focus(), 100); // Focus input
        return;
    }

    setIsBeautifying(true);
    if (!isRegeneration) { // Added from prod
         setOriginalNote(note);
    }
    setApiKeyError(false); // Reset API key error state
    setApiKeySaveFeedback(''); // Clear save feedback

    try {
      const result = await beautifyNoteWithGroq(noteToProcess, keyToUse); // Use noteToProcess & keyToUse
      setPreviewNote(result);
      setShowBeautifyControls(true);
      setIsPreviewMode(false); // Added from prod: Turn OFF manual preview
    } catch (err) {
      // Use production's detailed error handling
      console.error("Beautify request failed:", err);
      let userMessage = `AI Beautify failed: ${err.message || 'Unknown error'}`;
      const isAuthOrRateLimitError = err.status === 401 || err.status === 403 || err.status === 429;

      if (!userApiKey && keyToUse === DEFAULT_GROQ_API_KEY && isAuthOrRateLimitError) {
          userMessage = "The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue.";
          setApiKeyError(true); // Show specific error message in modal
          setShowInfoModal(true);
          setShowApiKeyInput(true);
          setTimeout(() => apiKeyInputRef.current?.focus(), 100);
      } else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) {
          userMessage = "Your Groq API key seems invalid or rate-limited. Please check it or generate a new one.";
          // Don't set apiKeyError here, just show alert and modal
          setShowInfoModal(true);
          setShowApiKeyInput(true);
          setTimeout(() => apiKeyInputRef.current?.focus(), 100);
          alert(userMessage); // Alert for user's own key issue
      } else {
          alert(userMessage); // General error alert
      }
      setPreviewNote("");
      setShowBeautifyControls(false);
    } finally {
      setIsBeautifying(false);
    }
  };

  const acceptBeautified = () => {
    // Keep beta logic, add production's resets
    setNote(previewNote);
    setPreviewNote("");
    setOriginalNote("");
    setShowBeautifyControls(false);
    setIsPreviewMode(false); // <-- Reset manual preview mode
  };

  const rejectBeautified = () => {
    // Keep beta logic, add production's resets
    setPreviewNote("");
    setShowBeautifyControls(false);
    setIsPreviewMode(false); // <-- Reset manual preview mode
  };

  const regenerateBeautified = () => {
    // Use production's logic which passes true
    handleBeautify(true);
  };

  // --- Added Functions from Production ---
  const handleSaveUserApiKey = (key) => {
    const trimmedKey = key ? key.trim() : '';
    localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey);
    setUserApiKey(trimmedKey);
    setApiKeyError(false); // Assume key is valid until proven otherwise
    setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.');
    setTimeout(() => setApiKeySaveFeedback(''), 2500); // Clear feedback after delay
  };

  const togglePreviewMode = () => {
    if (showBeautifyControls) return; // Prevent toggle when AI preview is shown
    setIsPreviewMode(prev => !prev);
  };

  const handleExportPdf = async () => {
    const contentToExport = showBeautifyControls ? previewNote : note;
    if (!contentToExport.trim() || isExportingPdf) return;
  
    setIsExportingPdf(true);
    const filename = (noteName.trim() || "untitled") + ".pdf";
  
    // --- PDF Styling Constants ---
    const pageBackgroundColor = '#fdfbf7';
    const headerTextColor = '#a8a29a';
    const headerText = "puffnotes";
    const headerFontSize = 9;
    const margin = 18; // Page margin in mm
    const headerTopMargin = 15; // Y position for header text
  
    // --- PDF Document Setup ---
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 'smart'
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidthMM = pdfWidth - (margin * 2);
    const contentHeightMM = pdfHeight - (margin * 2) - 10; // Reduced to avoid overflow
    
    // Approximate content width in pixels for html2canvas
    const contentWidthPX = Math.floor(contentWidthMM * 3.78);
  
    // 1. Prepare temporary container
    const tempContainerId = 'pdf-render-container';
    let tempContainer = document.getElementById(tempContainerId);
    if (!tempContainer) {
      tempContainer = document.createElement('div');
      tempContainer.id = tempContainerId;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.border = '1px solid transparent';
      document.body.appendChild(tempContainer);
    } else {
      tempContainer.innerHTML = '';
    }
  
    // Style container for accurate capture
    tempContainer.style.width = `${contentWidthPX}px`;
    tempContainer.style.padding = `1px`;
    tempContainer.style.background = pageBackgroundColor;
    tempContainer.style.fontFamily = 'monospace';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.625';
    tempContainer.style.color = '#1f2937';
    tempContainer.style.height = 'auto';
    tempContainer.style.display = 'inline-block';
  
    // 2. Render MarkdownPreview
    const root = ReactDOM.createRoot(tempContainer);
    root.render(<MarkdownPreview markdownText={contentToExport} />);
  
    // Allow rendering, style calculation, and layout stabilization
    await new Promise(resolve => setTimeout(resolve, 500));
  
    // 3. Apply Style Overrides
    try {
      const selectorsAndColors = [
        { selector: '.text-gray-800', color: '#1f2937' },
        { selector: '.text-gray-600', color: '#4b5563' },
        { selector: 'blockquote', color: '#4b5563' },
        { selector: '.border-\\[\\#e6ddcc\\]', color: '#e6ddcc', styleProp: 'borderColor' },
        { selector: '.bg-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'backgroundColor' },
        { selector: '.text-\\[\\#9a8c73\\]', color: '#9a8c73' },
        { selector: '.bg-\\[\\#fdf6ec\\]', color: '#fdf6ec', styleProp: 'backgroundColor' },
      ];
      selectorsAndColors.forEach(({ selector, color, styleProp = 'color' }) => {
        try {
          const elements = tempContainer.querySelectorAll(selector);
          elements.forEach(el => {
            const className = selector.startsWith('.') ? selector.substring(1).replace(/\\/g, '') : null;
            if ((className && el.classList.contains(className)) || !selector.startsWith('.')) {
              el.style[styleProp] = color;
            }
          });
        } catch (e) {
          console.warn(`Failed override for selector: ${selector}`, e);
        }
      });
    } catch (e) {
      console.warn("Error applying style overrides:", e);
    }
  
    try {
      // 4. Capture the entire rendered content
      const canvas = await html2canvas(tempContainer, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: pageBackgroundColor,
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        windowWidth: tempContainer.scrollWidth,
        windowHeight: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        imageTimeout: 15000,
      });
  
      // 5. Calculate dimensions and scaling factors
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const canvasWidthPX = canvas.width;
      const canvasHeightPX = canvas.height;
      
      // Calculate the height scaling to maintain aspect ratio
      const scaleFactor = contentWidthMM / canvasWidthPX;
      const totalHeightMM = canvasHeightPX * scaleFactor;
      
      // Calculate how many pixels of canvas can fit on one PDF page
      const pixelsPerPage = contentHeightMM / scaleFactor;
      
      // Add header and background to first page
      const addPageStyling = () => {
        pdf.setFillColor(pageBackgroundColor);
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F'); // Background
        pdf.setFontSize(headerFontSize);
        try {
          pdf.setFont('times', 'normal');
        } catch (e) {
          pdf.setFont('serif', 'normal');
        }
        pdf.setTextColor(headerTextColor);
        pdf.text(headerText, margin, headerTopMargin);
      };
  
      // Init first page
      addPageStyling();
      
      // 6. Slice and add the canvas to multiple pages if needed
      let remainingHeight = canvasHeightPX;
      let currentY = 0;
      
      while (remainingHeight > 0) {
        // Height to use from canvas for current page
        const heightToUse = Math.min(remainingHeight, pixelsPerPage);
        
        // Create a temporary canvas for this page slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidthPX;
        tempCanvas.height = heightToUse;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the relevant portion of the original canvas
        tempCtx.drawImage(
          canvas,
          0, currentY,                // Source x, y
          canvasWidthPX, heightToUse, // Source width, height
          0, 0,                       // Destination x, y
          canvasWidthPX, heightToUse  // Destination width, height
        );
        
        // Add the image slice to PDF
        const pageImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(
          pageImgData,
          'PNG',
          margin,
          margin,
          contentWidthMM,
          heightToUse * scaleFactor,
          undefined,
          'FAST'
        );
        
        // Update for next slice
        currentY += heightToUse;
        remainingHeight -= heightToUse;
        
        // Add a new page if there's more content
        if (remainingHeight > 0) {
          pdf.addPage();
          addPageStyling();
        }
      }
  
      // 7. Save the PDF
      pdf.save(filename);
  
    } catch (error) {
      console.error("Error generating PDF:", error);
      let message = `Failed to export PDF.`;
      if (error.message && error.message.includes('color function "oklch"')) {
        message += ' A style used in the note might not be supported.';
      } else {
        message += ` ${error.message || 'Check console for details.'}`;
      }
      alert(message);
    } finally {
      // 8. Clean up
      root.unmount();
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setIsExportingPdf(false);
    }
  };


  // --- Beta's useEffect Hooks ---
  useEffect(() => {
    const autoSave = async () => {
      // Added !showBeautifyControls check from prod
      if (!isFirstSave && folderHandle && noteName.trim() && !showBeautifyControls) {
        const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
        // Use production's simpler saveNote call for autosave
        try {
             await saveNote(filename, note, false); // Explicitly false for isFirstSave
        } catch (err) {
             console.warn("Autosave failed:", err); // Log warning on failure
        }
      }
    }
    // Keep beta's debounce logic, ensure `noteName` and `folderHandle` are dependencies
    const debounce = setTimeout(autoSave, 750);
    return () => clearTimeout(debounce);
  }, [note, noteName, isFirstSave, folderHandle, saveNote, showBeautifyControls]); // Added dependencies from prod

  useEffect(() => {
    // Keep beta's logic
    if (folderHandle) refreshFileList();
    else setFileList([]); // Added else from prod
  }, [folderHandle]);

  // --- Beta's handleFolderButton (keep beta logic) ---
  const handleFolderButton = async () => {
    if (!folderHandle) {
      try { // Added try/catch from prod
          await pickFolder();
          // Optional: refreshFileList() here? Prod doesn't explicitly here.
      } catch(err) {
          if (err.name !== 'AbortError') {
              console.error("Error picking folder:", err);
              alert("Could not get permission to access the folder.");
          }
      }
    } else {
      setShowFileModal((prev) => !prev);
      // Refresh list when opening modal (added from prod)
      if (!showFileModal) {
          refreshFileList();
      }
    }
  };

  // --- Beta's toggleFocusMode (keep beta logic) ---
  const toggleFocusMode = () => {
    setFocusMode(prev => !prev);
  };

  // --- Beta's Render Logic (with integrated production features) ---
  return (
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-left Info Button (Beta's style, Prod's onClick logic) */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          onClick={() => {
              setApiKeyError(false); // Added from prod
              setShowInfoModal(true);
              setShowApiKeyInput(!!userApiKey); // Added from prod
              setApiKeySaveFeedback(''); // Added from prod
          }}
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full backdrop-blur-sm bg-white/30 border border-white/20 shadow-sm" // Beta's class
          title="About puffnotes"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Use production's icon color/stroke */}
          <Info size={17} strokeWidth={2} className="text-gray-200" />
        </motion.button>
      </div>

      {/* Browser Compatibility Warning (Beta's text, Prod's check) */}
      {!window.showDirectoryPicker && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow">
          PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available.
        </div>
      )}

      {/* Background Video (Use Beta's source paths) */}
      <video
        autoPlay muted loop playsInline preload="auto" // Added preload from prod
        className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"
      >
        <source src="/background.webm" type="video/webm" /> {/* Keep Beta source */}
        <source src="/background.mp4" type="video/mp4" /> {/* Keep Beta source */}
        Your browser does not support the video tag.
      </video>

      {/* Background decorative elements (Keep Beta's elements) */}
      <motion.div /* ... beta's first decorative div ... */ className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#f8e8d4] opacity-20" animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.15, 0.2] }} transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }} />
      <motion.div /* ... beta's second decorative div ... */ className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#f8e8d4] opacity-20" animate={{ scale: [1, 1.03, 1], opacity: [0.2, 0.25, 0.2] }} transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }} />

      {/* Onboarding Overlay (Keep Beta's overlay) */}
      <AnimatePresence>
        {(!folderHandle || isFirstSave) && !showInfoModal && ( // Added !showInfoModal from prod
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Top-right Buttons Area (Beta's structure/styling) */}
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
        {/* Onboarding Message (Beta's position/styling, Prod's condition) */}
        <AnimatePresence>
          {(!folderHandle || isFirstSave) && !showInfoModal && ( // Added !showInfoModal from prod
            <motion.span
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="font-serif text-sm text-gray-500 mr-3 bg-[#fff7ee] border border-[#e6ddcc] rounded-full px-4 py-1 shadow-sm" // Beta's class
            >
              {/* Use Production's text logic */}
              {!folderHandle ? "Select a folder to save notes (or to close this message)" : "Save your note (autosaves after)"}
            </motion.span>
          )}
        </AnimatePresence>

        {/* FAB Container (Beta's styling) */}
        <div className="flex items-center space-x-3 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
            {/* Focus Mode Toggle (Beta's button) */}
            <button
              onClick={toggleFocusMode}
              className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-100' : 'text-gray-600'}`} // Merged text colors
              title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /> </svg>
            </button>

            {/* Folder Button (Beta's button) */}
            <motion.button
              onClick={handleFolderButton}
              className="opacity-60 hover:opacity-100 transition text-gray-400" // Added text color from prod
              title={folderHandle ? "Open Notes Folder" : "Select Notes Folder"} // Title from prod
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            >
              <FolderOpen size={20} />
            </motion.button>

            {/* Save/Check Button (Beta's structure, Prod's conditions/disable logic) */}
            {isFirstSave ? (
              <motion.button
                onClick={handleSave}
                className={`opacity-60 transition text-gray-400 ${!noteName.trim() ? 'cursor-not-allowed opacity-30' : 'hover:opacity-100'}`} // Added disabled state classes from prod
                title="Save Note"
                whileHover={noteName.trim() ? { scale: 1.1 } : {}} // Added condition from prod
                whileTap={noteName.trim() ? { scale: 0.95 } : {}} // Added condition from prod
                disabled={!noteName.trim()} // Added disabled prop from prod
              >
                <Save size={20} />
              </motion.button>
            ) : (
              <motion.div
                animate={{ // Use Prod's animation object
                  rotate: saveIndicator ? [0, 20, 0] : 0,
                  scale: saveIndicator ? [1, 1.2, 1] : 1,
                  color: saveIndicator ? ["#6b7280", "#10b981", "#6b7280"] : "#9ca3af" // Use Prod's colors
                }}
                transition={{ duration: 0.5 }}
                title="Note Autosaved" // Title from prod
              >
                <Check size={20} className="opacity-100" />
              </motion.div>
            )}

            {/* Toggle Editor (Beta's button) */}
            <motion.button
              onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }}
              className="opacity-60 hover:opacity-100 transition text-gray-400" // Added text color from prod
              title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            >
              {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </motion.button>
        </div>

        {/* Info Modal (Applying Glassmorphism) */}
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              // Outer overlay - keep semi-transparent black
              className="fixed inset-0 z-[60] bg-black bg-opacity-60 flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)} // Close on overlay click
            >
              {/* Inner Modal Content - Apply Glassmorphism */}
              <motion.div
                // --- MODIFIED CLASSES ---
                className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl p-8 pt-6 w-full max-w-md text-center font-serif relative" // Changed bg, added backdrop-blur, adjusted border/rounding
                // --- END MODIFIED CLASSES ---
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3 }}
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
              >
                  {/* Close button - style slightly adjusted for theme */}
                  <button onClick={() => setShowInfoModal(false)} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 transition" aria-label="Close modal"> <X size={18} /> </button> {/* Changed text color slightly */}
                  <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2>

                  {/* API Key Error Message - Adjusted background */}
                  <AnimatePresence>
                     {apiKeyError && (
                        <motion.div
                           initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                           // --- MODIFIED CLASSES ---
                           className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-2 rounded-md text-xs my-3 text-left flex items-center gap-2 overflow-hidden" // Adjusted bg/border opacity
                           // --- END MODIFIED CLASSES ---
                         >
                            <AlertTriangle size={14} className="flex-shrink-0" /> <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  <p className="text-[#6b7280] text-sm leading-relaxed mb-4"> A serene space for note-taking — simple, offline, and distraction-free.<br /> Click the <Wand2 size={14} className="inline mb-0.5 text-[#9a8c73]" /> wand to magically expand and beautify your notes using AI. </p>

                  {/* API Key Section */}
                  <div className="text-left text-xs border-t border-white/30 pt-4 mt-4 space-y-2"> {/* Adjusted border color */}
                      <div className="flex justify-between items-center"> <p className="text-gray-600 font-medium flex items-center gap-1.5"> <KeyRound size={14} /> <span>Personal AI key (Recommended)</span> </p> <button onClick={() => setShowApiKeyInput(prev => !prev)} className="text-gray-500 hover:text-gray-800 text-xs underline"> {showApiKeyInput ? 'Hide' : 'Add/Edit'} </button> </div>
                      <AnimatePresence>
                         {showApiKeyInput && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                               <p className="text-gray-500 leading-snug"> Add your free Groq API key for unlimited AI use. Get one in seconds at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline hover:text-[#a8a29a]">Groq Console</a>. </p> {/* Adjusted hover color */}
                               <div className="flex items-center gap-2">
                                  {/* Input - Style slightly adjusted */}
                                  <input ref={apiKeyInputRef} type="password" placeholder="Paste Groq API Key (gsk_...)" defaultValue={userApiKey} className="flex-grow px-2 py-1 text-xs bg-white/50 border border-white/40 rounded-md outline-none focus:ring-1 focus:ring-white/60 font-mono text-gray-700" />
                                  {/* Save Button - Style slightly adjusted */}
                                  <button onClick={() => handleSaveUserApiKey(apiKeyInputRef.current?.value || '')} className="px-3 py-1 text-xs bg-white/40 border border-white/30 rounded-md hover:bg-white/60 transition text-gray-700 whitespace-nowrap"> Save </button>
                               </div>
                               {apiKeySaveFeedback && ( <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-xs mt-1"> {apiKeySaveFeedback} </motion.p> )}
                            </motion.div>
                         )}
                      </AnimatePresence>
                  </div>

                  <p className="text-[#8c6e54] text-xs italic mt-4 mb-2"> No accounts. No cloud. Just you and your thoughts. </p>
                  <p className="text-[#9c8063] text-xs"> lovingly crafted by <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-200 transition"> Rajin Khan </a> </p>

                  {/* Close Button - Style adjusted for theme */}
                  <button
                     onClick={() => setShowInfoModal(false)}
                     // --- MODIFIED CLASSES ---
                     className="mt-5 px-5 py-1.5 text-sm bg-white/50 border border-white/30 rounded-full hover:bg-white/70 transition text-gray-700" // Adjusted style
                     // --- END MODIFIED CLASSES ---
                  >
                     Close
                  </button>

                  {/* Footer text - Adjusted opacity/color */}
                  <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-600 opacity-70"> {/* Adjusted color/opacity */}
                      Background video via <a href="https://moewalls.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">MoeWalls</a> {/* Adjusted hover */}
                  </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* File Explorer Modal (Beta's styling/animation) */}
      <AnimatePresence>
        {showFileModal && folderHandle && ( // Added folderHandle check from prod
          <motion.div
            className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center p-4" // Added padding from prod
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setShowFileModal(false)} // Close on overlay click
          >
            <motion.div
              className="bg-white/60 backdrop-blur-2xl border-white/40 rounded-xl shadow-xl border border-[#e6ddcc] w-[20rem] max-h-[60vh] overflow-y-auto p-4" // Beta's classes
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", duration: 0.4 }}
              onClick={e => e.stopPropagation()} // Prevent closing on inner click
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-serif text-lg text-gray-800">Your Notes</h2> {/* Added text color */}
                <motion.button onClick={() => setShowFileModal(false)} className="text-gray-500 hover:text-gray-800" title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}> <X size={18} /> </motion.button> {/* Added text color */}
              </div>
              {fileList.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-2 py-1">No markdown notes (.md) found in the selected folder.</p> // Text from prod
              ) : (
                <div className="space-y-1">
                  {fileList.map((filename, index) => (
                    <motion.button
                      key={filename} onClick={() => handleOpenFile(filename)}
                      className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1.5 rounded transition-colors duration-100" // Classes from prod
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ x: 3 }}
                      title={`Open ${filename}`} // Added title from prod
                    >
                      {filename.replace(/\.md$/, "")} {/* Added replace from prod */}
                    </motion.button>
                  ))}
                </div>
              )}
               {/* Added Change Folder button from prod */}
               <button onClick={pickFolder} className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700 underline py-1"> Change Folder </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title peek bar (Beta's styling/animation) */}
      <AnimatePresence>
        {!isEditorVisible && dropAnimationComplete && (
          <motion.div /* ... beta's peek bar wrapper ... */ className="fixed bottom-0 left-0 right-0 z-10 flex justify-center" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}>
            <motion.div /* ... beta's peek bar inner div ... */ className="bg-white/70 backdrop-blur-lg border-t border-white/30 rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer" onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }} whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}>
                <motion.span className="font-serif text-lg tracking-tight text-[#1a1a1a]" animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}> puffnotes </motion.span>
                <span className="text-gray-400">|</span>
                <span className="font-serif text-sm text-gray-500 max-w-[150px] sm:max-w-xs truncate" title={noteName || "untitled"}> {noteName || "untitled"} </span> {/* Added max-width/title from prod */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Sheet (Beta's animation/styling) */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-20" // Use z-20 from prod
        initial={false} animate={{ y: isEditorVisible ? 0 : '101%' }} // Use 101% from prod
        transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }} // Use prod's physics
        onAnimationComplete={() => setDropAnimationComplete(true)}
      >
        <div
          // Use Beta's dynamic background based on focusMode
          className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative transition-all duration-500 ${focusMode ? 'bg-white/35 backdrop-blur-2xl' : 'bg-white/80 backdrop-blur-lg'}`}
        >
          {/* Editor Header (Beta's structure, merge focus style) */}
          <motion.div
            className="flex justify-between items-center mb-4 flex-shrink-0" // Added flex-shrink-0 from prod
            animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }}
            style={{ pointerEvents: focusMode ? 'none' : 'auto' }} // Added pointerEvents from prod
          >
            {/* Left Title (Beta's) */}
            <motion.h1 className="font-serif text-2xl tracking-tight text-[#1a1a1a] flex-shrink-0" whileHover={!focusMode ? { x: 2 } : {}}> puffnotes </motion.h1> {/* Added flex-shrink */}

             {/* Center: Note Title Input / Preview Toggle (Merged) */}
             <div className="flex-1 flex justify-center items-center gap-2 mx-4 min-w-0"> {/* Structure from prod */}
                 {/* Note Title Input (Beta's styling, Prod's conditional visibility) */}
                 <motion.input
                   type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)}
                   // Merged classes: Beta base + Prod conditional opacity + Prod focus border
                   className={`text-center font-serif text-sm bg-transparent outline-none text-gray-500 w-full max-w-[70%] border-b border-transparent focus:border-gray-300 transition-opacity duration-300 ${focusMode || isPreviewMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                   placeholder="note name..." whileFocus={{ scale: 1.02 }}
                   disabled={focusMode || isPreviewMode} // Added disabled from prod
                 />
                 {/* Preview Toggle Button (Copied from Prod) */}
                 {!showBeautifyControls && !focusMode && note.trim() && (
                     <motion.button onClick={togglePreviewMode} title={isPreviewMode ? "Edit Note" : "Preview Markdown"} className="opacity-60 hover:opacity-100 transition text-gray-500 hover:text-gray-800 p-1 flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                         {isPreviewMode ? <Pen size={18} /> : <Eye size={18} />}
                     </motion.button>
                  )}
             </div>

            {/* Right side buttons (Beta's structure, Prod's PDF button logic) */}
            <div className="flex space-x-4 text-lg text-gray-600 flex-shrink-0"> {/* Added text color, flex-shrink */}
              {/* PDF Export Button (Merged) */}
              <motion.button
                title="Export as PDF"
                onClick={handleExportPdf} // Use the correct handler
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                className="hover:text-gray-900 p-1 disabled:opacity-30" // Added classes from prod
                disabled={!(showBeautifyControls ? previewNote : note).trim() || isExportingPdf} // Added disabled logic
              >
                {isExportingPdf ? ( // Added loading state
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <RotateCw size={18} className="text-gray-400" />
                  </motion.div>
                ) : (
                  // Use production's cleaner SVG icon for PDF download
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <polyline points="14 2 14 8 20 8"></polyline> <path d="M9 15h6"></path> <path d="M9 11h6"></path> </svg>
                )}
              </motion.button>
              {/* New Note Button (Beta's) */}
              <motion.button title="New Note" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900 p-1"> {/* Added classes */}
                <FilePlus size={18} />
              </motion.button>
            </div>
          </motion.div>

          {/* HR (Beta's styling, Prod's animation) */}
          <motion.hr className="border-[#e0ddd5] mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.2 : 1 }} />

          {/* Textarea/Preview Area (Merged) */}
          <div className="flex-1 overflow-y-auto relative" > {/* Added overflow-y-auto relative */}
             {isPreviewMode && !showBeautifyControls ? ( // Conditional rendering from Prod
                <MarkdownPreview markdownText={note} />
             ) : (
                <textarea
                  // Use production's value logic
                  value={showBeautifyControls ? previewNote : note}
                  // Use production's onChange logic
                  onChange={(e) => { if (!showBeautifyControls) { setNote(e.target.value); } }}
                  placeholder="A quiet place to write. No cloud. No noise. Just thoughts, beautifully yours." // Beta's placeholder
                  // Use production's className + scrollbar hide + Beta's focus style
                  className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-gray-400 placeholder:italic transition-all duration-300 text-gray-800 ${focusMode ? 'text-lg' : 'text-sm'} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
                  readOnly={isBeautifying || showBeautifyControls} // Added readOnly from prod
                />
             )}
          </div>

          {/* Beautify Floating Control (Beta's structure/styling, Prod's conditional visibility) */}
          {note.trim() && !focusMode && !isPreviewMode && ( // Added !isPreviewMode from Prod
            <div className="absolute bottom-6 right-6 z-30 flex-shrink-0"> {/* Added z-30, flex-shrink */}
              {!showBeautifyControls ? (
                  // Beta's button structure/styling
                  <motion.button
                    title="Beautify with AI"
                    onClick={() => handleBeautify(false)} // Use prod's call signature
                    disabled={isBeautifying || !note.trim()} // Added disable check from prod
                    // Merged classes from beta and prod's disable state
                    className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] text-gray-700 ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`}
                    whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}} // Added condition
                    whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}} // Added condition
                    animate={isBeautifying ? { rotate: 360 } : {}}
                    transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}} // Use prod's transition
                  >
                    {isBeautifying ?
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RotateCw size={20} className="text-[#9a8c73]" />
                      </motion.div>
                      : <Wand2 size={20} />
                    }
                  </motion.button>
              ) : (
                 // Use Production's AI preview controls structure/styling
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all">
                    <span className="font-serif text-sm text-gray-600 hidden sm:inline"> AI Preview: </span>
                    <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}> <CheckCircle size={20} /> </motion.button>
                    <motion.button title="Regenerate" onClick={regenerateBeautified} className={`bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df] transition-colors ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}> <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} /> </motion.button>
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