import { useState, useEffect, useRef } from 'react'; // Add useRef
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
  KeyRound, // <-- Import needed icon
  AlertTriangle, // <-- Import needed icon
} from 'lucide-react';
import { beautifyNoteWithGroq } from './lib/groq';
import { AnimatePresence, motion } from 'framer-motion';

// --- Constants for API Key Management ---
const USER_API_KEY_STORAGE_KEY = 'puffnotes_groqUserApiKey_v1'; // Use a unique key
const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''; // Get default key from .env

export default function App() {
  // --- State for API Key Management ---
  const [userApiKey, setUserApiKey] = useState(
    () => localStorage.getItem(USER_API_KEY_STORAGE_KEY) || ''
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState(false); // To toggle input in modal
  const [apiKeyError, setApiKeyError] = useState(false); // Flag if default key failed
  const [apiKeySaveFeedback, setApiKeySaveFeedback] = useState(''); // Feedback message on save

  // Ref for the API key input field to focus it
  const apiKeyInputRef = useRef(null);

  // --- Existing State (Copied from your provided code) ---
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [note, setNote] = useState("");
  const [noteName, setNoteName] = useState("untitled");
  const [fileList, setFileList] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [showFileActions, setShowFileActions] = useState(false); // Still seems unused

  const [previewNote, setPreviewNote] = useState("");
  const [showBeautifyControls, setShowBeautifyControls] = useState(false);
  const [originalNote, setOriginalNote] = useState("");
  const [isBeautifying, setIsBeautifying] = useState(false);

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true);

  const [showInfoModal, setShowInfoModal] = useState(false);

  const {
    folderHandle,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
  } = useFileSystemAccess();

  // --- Existing Functions (Copied from your provided code) ---
  const refreshFileList = async () => {
    if (folderHandle) {
      try {
        const files = await listFiles();
        setFileList(files || []);
      } catch (err) {
         console.error("Failed to refresh file list:", err);
         setFileList([]);
      }
    }
  };

  const handleOpenFile = async (filename) => {
     if (!filename) return;
     try {
        const content = await loadNote(filename);
        if (content === null) {
             alert(`Could not load file: ${filename}. Folder permissions might have changed.`);
             return;
        }
        const baseName = filename.replace(/\.md$/, "");
        setNote(content);
        setNoteName(baseName);
        setIsFirstSave(false);
        setShowFileModal(false);
        setPreviewNote("");
        setShowBeautifyControls(false);
        setOriginalNote("");
     } catch (err) {
        console.error("Error opening file:", err);
        alert(`Failed to open file: ${filename}. Error: ${err.message}`);
     }
  };

  const handleNewNote = () => {
    setNote("");
    setNoteName("untitled");
    setIsFirstSave(true);
    setPreviewNote("");
    setShowBeautifyControls(false);
    setOriginalNote("");
  };

  const handleSave = async () => {
    let currentFolderHandle = folderHandle;
    if (!currentFolderHandle) {
      try {
        const picked = await pickFolder();
        if (!picked) return; // User cancelled
        currentFolderHandle = picked;
        // useEffect will refresh list
      } catch (err) {
        console.error("Error picking folder:", err);
         if (err.name !== 'AbortError') {
             alert("Could not get permission to access the folder.");
         }
        return;
      }
    }

    if (!noteName.trim()) {
        // Maybe focus the input instead of alert?
        alert("Please enter a name for your note before saving.");
        return;
    }

    const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;

    try {
      // Pass handle explicitly if needed by saveNote implementation
      const savedAs = await saveNote(filename, note, isFirstSave);

      if (savedAs) {
        const baseName = savedAs.replace(/\.md$/, "");
        setNoteName(baseName);
        setIsFirstSave(false);
        refreshFileList();

        setSaveIndicator(true);
        setTimeout(() => setSaveIndicator(false), 1500);
      } else if (isFirstSave) {
        console.log("Save As dialog cancelled.");
      }
    } catch (err) {
        console.error("Error saving file:", err);
        alert(`Failed to save note: ${filename}. Error: ${err.message}`);
    }
  };

 // --- Modified Beautify Logic ---
 const handleBeautify = async (isRegeneration = false) => {
    const noteToProcess = isRegeneration ? (originalNote || note) : note;
    if (!noteToProcess.trim()) return;

    // Determine which API key to use
    const keyToUse = userApiKey || DEFAULT_GROQ_API_KEY;

    // Check if any key is available
    if (!keyToUse) {
       console.error("No Groq API Key available (User or Default).");
       setApiKeyError(true); // Set flag to show message in modal
       setApiKeySaveFeedback(''); // Clear any old feedback
       setShowInfoModal(true); // Open the modal
       setShowApiKeyInput(true); // Ensure the input section is visible
       setTimeout(() => apiKeyInputRef.current?.focus(), 100); // Focus input
       return; // Stop processing
    }

    setIsBeautifying(true);
    if (!isRegeneration) {
      setOriginalNote(note); // Store original note only on first beautify
    }
    setApiKeyError(false); // Reset error flag before the attempt
    setApiKeySaveFeedback(''); // Clear feedback

    try {
      // Pass the determined key to the groq function
      const result = await beautifyNoteWithGroq(noteToProcess, keyToUse);
      setPreviewNote(result);
      setShowBeautifyControls(true);

    } catch (err) {
      console.error("Beautify request failed:", err);
      let userMessage = `AI Beautify failed: ${err.message || 'Unknown error'}`;

      // Check response status if available (from modified groq.js)
      const isAuthOrRateLimitError = err.status === 401 || err.status === 403 || err.status === 429;

      // Scenario 1: Default key failed with auth/rate limit error
      if (!userApiKey && keyToUse === DEFAULT_GROQ_API_KEY && isAuthOrRateLimitError) {
        userMessage = "The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue.";
        setApiKeyError(true); // Set flag to show specific message in modal
        setShowInfoModal(true); // Open modal automatically
        setShowApiKeyInput(true); // Ensure input is visible
        setTimeout(() => apiKeyInputRef.current?.focus(), 100);
      }
      // Scenario 2: User's key failed with auth/rate limit error
      else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) {
         userMessage = "Your Groq API key seems invalid or rate-limited. Please check it or generate a new one.";
         // Don't set apiKeyError flag, but open modal for user to fix
         setShowInfoModal(true);
         setShowApiKeyInput(true);
         setTimeout(() => apiKeyInputRef.current?.focus(), 100);
         // Alert the user as well
         alert(userMessage);
      }
      // Scenario 3: Other errors
      else {
          alert(userMessage); // Use standard alert for other errors
      }

      // Reset state on failure
      setPreviewNote("");
      setShowBeautifyControls(false);
      // Keep originalNote so user can retry
    } finally {
      setIsBeautifying(false);
    }
  };


  const acceptBeautified = () => {
    setNote(previewNote);
    setPreviewNote("");
    setOriginalNote("");
    setShowBeautifyControls(false);
  };

  const rejectBeautified = () => {
    setPreviewNote("");
    // Keep originalNote for potential regeneration
    setShowBeautifyControls(false);
  };

  // Modified regenerateBeautified to call the main handleBeautify function
  const regenerateBeautified = () => {
    handleBeautify(true); // Pass true to indicate regeneration
  };


  // --- API Key Management Function ---
  const handleSaveUserApiKey = (key) => {
    const trimmedKey = key ? key.trim() : '';
    localStorage.setItem(USER_API_KEY_STORAGE_KEY, trimmedKey);
    setUserApiKey(trimmedKey);
    setApiKeyError(false); // Clear error state after user saves a key
    setApiKeySaveFeedback(trimmedKey ? 'API Key saved!' : 'API Key removed.');
    // Hide feedback after a delay
    setTimeout(() => setApiKeySaveFeedback(''), 2500);
    // Keep the input section open after saving
  };


  // --- Existing useEffect Hooks (Copied from your provided code) ---
  useEffect(() => {
    const autoSave = async () => {
      // Only auto-save if it's not the first save, folder exists, and name is valid
      // And ensure we are not saving while previewing AI changes
      const shouldSave = !isFirstSave && folderHandle && noteName.trim() && !showBeautifyControls;

      if (shouldSave) {
        const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
        try {
            await saveNote(filename, note, false);
        } catch (err) {
             console.warn("Autosave failed:", err);
        }
      }
    };

    const debounceTimeout = setTimeout(autoSave, 750);
    return () => clearTimeout(debounceTimeout);
  }, [note, noteName, isFirstSave, folderHandle, saveNote, showBeautifyControls]); // Added showBeautifyControls dependency


  useEffect(() => {
    if (folderHandle) {
      refreshFileList();
    } else {
      setFileList([]);
    }
  }, [folderHandle]);

  const handleFolderButton = async () => {
    if (!folderHandle) {
        try {
             await pickFolder();
        } catch (err) {
             if (err.name !== 'AbortError') {
                 console.error("Error picking folder:", err);
                 alert("Could not get permission to access the folder.");
             }
        }
    } else {
      setShowFileModal((prev) => !prev);
      if (!showFileModal) {
          refreshFileList();
      }
    }
  };

  const toggleFocusMode = () => {
    setFocusMode(prev => !prev);
  };

  // --- Render Logic ---
  return (
    // Base background color - Original
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-left Info Button - Original Styling */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          onClick={() => {
             // Reset API error state when manually opening
             setApiKeyError(false);
             setShowInfoModal(true);
             // Optionally decide if input should show based on key presence
             setShowApiKeyInput(!!userApiKey);
             setApiKeySaveFeedback(''); // Clear feedback
          }}
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm"
          title="About puffnotes"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Original Icon Styling */}
          <Info size={17} strokeWidth={2} className="text-gray-200" />
          {/* Optionally add a small indicator if apiKeyError is true, but keeping UI minimal */}
          {/* {apiKeyError && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>} */}
        </motion.button>
      </div>

      {/* Browser Compatibility Warning - Original */}
      {!window.showDirectoryPicker && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow">
          PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available.
        </div>
      )}

      {/* Background Video - Original */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto" // Reverted preload
        className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"
      >
        <source src="/backgroundsm3.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Onboarding Overlay - Original (Commented out as per your last request) */}
      {/*
      <AnimatePresence>
        {(!folderHandle || isFirstSave) && (
          <motion.div ... />
        )}
      </AnimatePresence>
      */}

      {/* Top-right Buttons - Original Styling */}
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
        {/* Onboarding Message - Original */}
        <AnimatePresence>
          {(!folderHandle || isFirstSave) && !showInfoModal && ( // Added !showInfoModal check
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-sm text-gray-600 mr-3 bg-[#fff7ee] border border-[#e6ddcc] rounded-full px-4 py-1 shadow-sm"
            >
              {!folderHandle
                ? "Select a folder to save notes (or to close this message)"
                : "Save your note (autosaves after)"}
            </motion.span>
          )}
        </AnimatePresence>

        {/* FAB-like Control Container - Original */}
        <div className="flex items-center space-x-3 px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
          {/* Focus Mode Toggle - Original */}
          <button
            onClick={toggleFocusMode}
            className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-200' : 'text-gray-600'}`}
            title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
            </svg>
          </button>

          {/* Folder Button - Original */}
          <motion.button
            onClick={handleFolderButton}
            className="opacity-60 hover:opacity-100 transition text-gray-400"
            title={folderHandle ? "Open Notes Folder" : "Select Notes Folder"}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          > <FolderOpen size={20} /> </motion.button>

          {/* Save/Check Button - Original */}
          {isFirstSave ? (
            <motion.button
              onClick={handleSave}
              className={`opacity-60 transition text-gray-400 ${!noteName.trim() ? 'cursor-not-allowed opacity-30' : 'hover:opacity-100'}`} // Applied disable style logic
              title="Save Note"
              whileHover={noteName.trim() ? { scale: 1.1 } : {}}
              whileTap={noteName.trim() ? { scale: 0.95 } : {}}
              disabled={!noteName.trim()}
            > <Save size={20} /> </motion.button>
          ) : (
            <motion.div
              animate={{ rotate: saveIndicator ? [0, 20, 0] : 0, scale: saveIndicator ? [1, 1.2, 1] : 1, color: saveIndicator ? ["#6b7280", "#10b981", "#6b7280"] : "#9ca3af" }}
              transition={{ duration: 0.5 }} title="Note Autosaved"
            > <Check size={20} className="opacity-100" /> </motion.div>
          )}

          {/* Toggle Editor - Original */}
          <motion.button
            onClick={() => { setDropAnimationComplete(false); setIsEditorVisible((prev) => !prev); }}
            className="opacity-60 hover:opacity-100 transition text-gray-400"
            title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          > {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />} </motion.button>
        </div>

        {/* --- Modified Info Modal --- */}
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4" // Original overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)} // Close on overlay click
            >
              <motion.div
                // Original modal styling
                className="bg-white border border-[#e6ddcc] rounded-xl shadow-2xl p-8 pt-6 w-full max-w-md text-center font-serif relative"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={e => e.stopPropagation()} // Prevent close on modal click
              >
                {/* Original Close Button */}
                 <button
                    onClick={() => setShowInfoModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                    aria-label="Close modal"
                 > <X size={18} /> </button>

                {/* Original Content */}
                <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2>

                {/* --- Added API Key Error Message --- */}
                <AnimatePresence>
                {apiKeyError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-xs my-3 text-left flex items-center gap-2 overflow-hidden" // Added margin, text-left
                    >
                        <AlertTriangle size={14} className="flex-shrink-0" />
                        <span>To keep this AI feature free for everyone, the shared access has limits. Please add your own (also free!) Groq API key below for best results.</span>
                    </motion.div>
                )}
                </AnimatePresence>
                {/* --- End API Key Error Message --- */}


                <p className="text-[#6b7280] text-sm leading-relaxed mb-4">
                  A serene space for note-taking — simple, offline, and distraction-free.<br />
                  Click the <Wand2 size={14} className="inline mb-0.5 text-[#9a8c73]" /> wand to magically expand and beautify your notes using AI.
                </p>

                {/* --- Added API Key Section --- */}
                 <div className="text-left text-xs border-t border-gray-200 pt-4 mt-4 space-y-2">
                     <div className="flex justify-between items-center">
                        <p className="text-gray-600 font-medium flex items-center gap-1.5">
                            <KeyRound size={14} />
                            <span>Personal AI key (Recommended)</span>
                        </p>
                        <button
                            onClick={() => setShowApiKeyInput(prev => !prev)}
                            className="text-gray-500 hover:text-gray-800 text-xs underline"
                        >
                            {showApiKeyInput ? 'Hide' : 'Add/Edit'}
                        </button>
                     </div>

                    <AnimatePresence>
                     {showApiKeyInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden space-y-2" // Added space-y
                        >
                            <p className="text-gray-500 leading-snug">
                                Add your free Groq API key for unlimited AI use. Get one in seconds at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-gray-500 underline hover:text-orange-400">Groq Console</a>.
                            </p>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={apiKeyInputRef}
                                    type="password"
                                    placeholder="Paste Groq API Key (gsk_...)"
                                    defaultValue={userApiKey}
                                    className="flex-grow px-2 py-1 text-xs border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-300 font-mono" // Simple input style
                                />
                                <button
                                    onClick={() => handleSaveUserApiKey(apiKeyInputRef.current?.value || '')}
                                    className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition text-gray-700 whitespace-nowrap" // Simple button style
                                >
                                    Save
                                </button>
                            </div>
                             {apiKeySaveFeedback && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-xs mt-1">
                                    {apiKeySaveFeedback}
                                </motion.p>
                             )}
                        </motion.div>
                     )}
                     </AnimatePresence>
                  </div>
                {/* --- End API Key Section --- */}


                <p className="text-[#8c6e54] text-xs italic mt-4 mb-2"> {/* Added mt-4 */}
                  No accounts. No cloud. Just you and your thoughts.
                </p>
                <p className="text-[#9c8063] text-xs">
                  lovingly crafted by{" "}
                  <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-200 transition">
                    Rajin Khan
                  </a>
                </p>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="mt-5 px-5 py-1.5 text-sm bg-[#fff7ee] border border-[#e0ddd5] rounded-full hover:bg-[#f0e9df] transition text-gray-700"
                >
                  Close
                </button>
                {/* Original Attribution */}
                <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 opacity-50">
                  Background video via <a href="https://moewalls.com" target="_blank" rel="noopener noreferrer" className="underline">MoeWalls</a>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* --- End Modified Info Modal --- */}
      </div>


      {/* File Explorer Modal - Original */}
      <AnimatePresence>
        {showFileModal && folderHandle && (
          <motion.div
            className="fixed inset-0 z-30 bg-black bg-opacity-30 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} onClick={() => setShowFileModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl border border-[#e6ddcc] w-full max-w-xs max-h-[60vh] overflow-y-auto p-4"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }} onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-serif text-lg text-gray-800">Your Notes</h2>
                <motion.button onClick={() => setShowFileModal(false)} className="text-gray-500 hover:text-gray-800" title="Close" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <X size={18} />
                </motion.button>
              </div>
              {fileList.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-2 py-1">No markdown notes (.md) found in the selected folder.</p>
              ) : (
                <div className="space-y-1">
                  {fileList.map((filename, index) => (
                    <motion.button
                      key={filename} onClick={() => handleOpenFile(filename)}
                      className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1.5 rounded transition-colors duration-100"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 3 }} title={`Open ${filename}`}
                    > {filename.replace(/\.md$/, "")} </motion.button>
                  ))}
                </div>
              )}
               <button onClick={pickFolder} className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700 underline py-1">
                  Change Folder
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title peek bar - Original */}
      <AnimatePresence>
        {!isEditorVisible && dropAnimationComplete && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-10 flex justify-center"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: "spring", stiffness: 400, damping: 40, mass: 1 }}
          >
            <motion.div
              className="bg-white border-t border-[#e6ddcc] rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer"
              onClick={() => { setDropAnimationComplete(false); setIsEditorVisible(true); }}
              whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}
            >
              <motion.span className="font-serif text-lg tracking-tight text-[#1a1a1a]" animate={{ y: [0, -1, 0] }} transition={{ repeat: Infinity, repeatType: "mirror", duration: 2, ease: "easeInOut" }}>
                puffnotes
              </motion.span>
              <span className="text-gray-400">|</span>
              <span className="font-serif text-sm text-gray-500 max-w-[150px] sm:max-w-xs truncate" title={noteName || "untitled"}>
                {noteName || "untitled"}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Sheet - Original */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-20"
        initial={false} animate={{ y: isEditorVisible ? 0 : '101%' }}
        transition={{ type: "spring", stiffness: 300, damping: 35, mass: 0.8 }}
        onAnimationComplete={() => setDropAnimationComplete(true)}
      >
        <div
          className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative transition-colors duration-500 ${focusMode ? 'bg-[#fdfbf7]' : 'bg-white'}`}
        >
          {/* Header - Original */}
          <motion.div
            className="flex justify-between items-center mb-4 flex-shrink-0"
            animate={{ opacity: focusMode ? 0.3 : 1 }} transition={{ duration: 0.5 }}
            style={{ pointerEvents: focusMode ? 'none' : 'auto' }}
          >
            <motion.h1 className="font-serif text-2xl tracking-tight text-[#1a1a1a]" whileHover={!focusMode ? { x: 2 } : {}}>
              puffnotes
            </motion.h1>
            <motion.input
              type="text" value={noteName} onChange={(e) => setNoteName(e.target.value)}
              className={`text-center font-serif text-sm bg-transparent outline-none text-gray-500 w-1/3 sm:w-1/2 border-b border-transparent focus:border-gray-300 transition-colors duration-300 mx-2 ${focusMode ? 'opacity-0 pointer-events-none' : ''}`}
              placeholder="note name..." whileFocus={{ scale: 1.02 }} disabled={focusMode}
            />
            <div className="flex space-x-4 text-lg text-gray-600">
              <motion.button title="Export as Markdown (.md)" onClick={() => { /* Original Export Logic */
                   if (!note.trim() && !previewNote.trim()) return;
                   const contentToExport = showBeautifyControls ? previewNote : note; // Export preview if shown
                   const filename = (noteName.trim() || "untitled") + ".md";
                   const blob = new Blob([contentToExport], { type: 'text/markdown;charset=utf-8' });
                   const link = document.createElement('a');
                   link.href = URL.createObjectURL(blob);
                   link.download = filename;
                   document.body.appendChild(link);
                   link.click();
                   document.body.removeChild(link);
                   URL.revokeObjectURL(link.href);
                }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900" disabled={!note.trim() && !previewNote.trim()} // Disable if nothing to export
              > <FileDown size={20} /> </motion.button>
              <motion.button title="New Note" onClick={handleNewNote} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="hover:text-gray-900">
                <FilePlus size={20} />
              </motion.button>
            </div>
          </motion.div>

          <motion.hr className="border-gray-200 mb-4 flex-shrink-0" animate={{ opacity: focusMode ? 0.2 : 1 }} />

          {/* Textarea - Original */}
          <div className="flex-1 overflow-y-auto relative" >
            <textarea
              value={showBeautifyControls ? previewNote : note}
              onChange={(e) => {
                const val = e.target.value;
                showBeautifyControls ? setPreviewNote(val) : setNote(val);
              }}
              placeholder="A quiet place to write..."
              className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-gray-400 placeholder:italic transition-all duration-300 text-gray-800 ${focusMode ? 'text-base px-2' : 'text-sm'}`}
              readOnly={isBeautifying}
            />
          </div>

          {/* Beautify Floating Control - Original */}
          {note.trim() && !focusMode && ( // Added !focusMode check
            <div className="absolute bottom-6 right-6 z-30 flex-shrink-0">
              {!showBeautifyControls ? (
                <motion.button
                  title="Beautify with AI"
                  onClick={() => handleBeautify(false)} // Call with false for isRegeneration
                  disabled={isBeautifying || !note.trim()}
                  className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] text-gray-700 ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`}
                  whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}}
                  whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}}
                  animate={isBeautifying ? { rotate: 360 } : {}}
                  transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}
                >
                  {isBeautifying ? ( <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}> <RotateCw size={20} className="text-[#9a8c73]" /> </motion.div> ) : ( <Wand2 size={20} /> )}
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all"
                >
                  <span className="font-serif text-sm text-gray-600 hidden sm:inline"> AI Preview: </span>
                  <motion.button title="Accept Changes" onClick={acceptBeautified} className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}>
                    <CheckCircle size={20} />
                  </motion.button>
                  <motion.button title="Regenerate" onClick={regenerateBeautified} className={`bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df] transition-colors ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`} whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}} whileTap={!isBeautifying ? { scale: 0.9 } : {}} transition={{ rotate: { duration: 0.4 } }} disabled={isBeautifying}>
                    <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} />
                  </motion.button>
                  <motion.button title="Reject Changes" onClick={rejectBeautified} className="bg-red-100 text-red-600 rounded-full p-2 border border-red-200 hover:bg-red-200 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} disabled={isBeautifying}>
                    <XCircle size={20} />
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}