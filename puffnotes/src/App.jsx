import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { beautifyNoteWithGroq } from './lib/groq';
import { AnimatePresence, motion } from 'framer-motion'; // Keep framer-motion for essential transitions

export default function App() {
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [note, setNote] = useState("");
  const [noteName, setNoteName] = useState("untitled");
  const [fileList, setFileList] = useState([]);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [showFileActions, setShowFileActions] = useState(false); // This state seems unused, but keeping it as requested

  const [previewNote, setPreviewNote] = useState("");
  const [showBeautifyControls, setShowBeautifyControls] = useState(false);
  const [originalNote, setOriginalNote] = useState("");
  const [isBeautifying, setIsBeautifying] = useState(false);

  // State variables for animations and feedback (kept)
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

  const refreshFileList = async () => {
    if (folderHandle) { // Ensure folderHandle exists before listing
      const files = await listFiles();
      setFileList(files);
    }
  };

  const handleOpenFile = async (filename) => {
    const content = await loadNote(filename);
    const baseName = filename.replace(/\.md$/, "");
    setNote(content);
    setNoteName(baseName);
    setIsFirstSave(false);
    setShowFileModal(false);
    // Reset beautify state when opening a new file
    setPreviewNote("");
    setShowBeautifyControls(false);
    setOriginalNote("");
  };

  const handleNewNote = () => {
    setNote("");
    setNoteName("untitled");
    setIsFirstSave(true);
    setPreviewNote("");
    setShowBeautifyControls(false);
    setOriginalNote(""); // Ensure original note is cleared
  };

  const handleSave = async () => {
    let currentFolderHandle = folderHandle;
    if (!currentFolderHandle) {
      currentFolderHandle = await pickFolder(); // Update local variable
      if (currentFolderHandle) { // Check if user selected a folder
         await refreshFileList();
      } else {
         return; // User cancelled folder picking
      }
    }

    if (!noteName.trim()) return;

    const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
    // Use the potentially updated currentFolderHandle for saving
    const savedAs = await saveNote(filename, note, isFirstSave, currentFolderHandle);

    if (savedAs) {
      const baseName = savedAs.replace(/\.md$/, "");
      setNoteName(baseName);
      setIsFirstSave(false);
      refreshFileList(); // Refresh list after successful save

      // Show save indicator animation
      setSaveIndicator(true);
      setTimeout(() => setSaveIndicator(false), 1500);
    }
  };

  const handleBeautify = async () => {
    if (!note.trim()) return; // Don't beautify empty notes
    setIsBeautifying(true);
    setOriginalNote(note); // Store original note before beautifying
    try {
      const result = await beautifyNoteWithGroq(note);
      setPreviewNote(result);
      setShowBeautifyControls(true);
    } catch (err) {
      console.error("Beautify failed", err);
      // Provide user feedback (consider a less intrusive way than alert)
      alert("Something went wrong with Groq beautify.");
      setPreviewNote(""); // Clear preview on error
      setShowBeautifyControls(false); // Hide controls on error
      setOriginalNote(""); // Clear original note backup on error
    } finally {
      setIsBeautifying(false);
    }
  };

  const acceptBeautified = () => {
    setNote(previewNote);
    setPreviewNote("");
    setOriginalNote(""); // Clear original note after accepting
    setShowBeautifyControls(false);
  };

  const rejectBeautified = () => {
    // No need to restore originalNote here, as `note` was never changed
    setPreviewNote("");
    setOriginalNote(""); // Clear original note after rejecting
    setShowBeautifyControls(false);
  };

  const regenerateBeautified = () => {
    // Use the originalNote for regeneration if available, otherwise use current note
    const noteToRegenerate = originalNote || note;
    if (!noteToRegenerate.trim()) return;
    setIsBeautifying(true); // Show loading state
    // No need to setOriginalNote again if it's already set
    if (!originalNote) setOriginalNote(note);

    // Call handleBeautify with the correct note content
    (async () => {
        try {
            const result = await beautifyNoteWithGroq(noteToRegenerate);
            setPreviewNote(result);
            // Keep controls visible
        } catch (err) {
            console.error("Regenerate failed", err);
            alert("Something went wrong trying to regenerate.");
            // Optionally revert or keep the previous preview
            // setPreviewNote("");
            // setShowBeautifyControls(false);
        } finally {
            setIsBeautifying(false);
        }
    })();
  };


  useEffect(() => {
    const autoSave = async () => {
      // Only auto-save if it's not the first save, folder exists, and name is valid
      if (!isFirstSave && folderHandle && noteName.trim()) {
        const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
        // Pass false for isFirstSave flag to avoid "Save As" dialog
        await saveNote(filename, note, false);
        // Optionally trigger save indicator here too, but might be too frequent
        // setSaveIndicator(true);
        // setTimeout(() => setSaveIndicator(false), 1000);
      }
    };

    // Debounce auto-save
    const debounceTimeout = setTimeout(autoSave, 750);

    // Clear timeout on cleanup
    return () => clearTimeout(debounceTimeout);
  }, [note, noteName, isFirstSave, folderHandle, saveNote]); // Added noteName, isFirstSave, folderHandle, saveNote dependencies

  useEffect(() => {
    // Refresh file list when folderHandle changes (e.g., after initial pick)
    if (folderHandle) {
      refreshFileList();
    } else {
      // Clear file list if folder access is revoked or lost
      setFileList([]);
    }
  }, [folderHandle]); // Removed listFiles from deps as refreshFileList calls it

  const handleFolderButton = async () => {
    if (!folderHandle) {
      await pickFolder();
      // refreshFileList() will be called by the useEffect watching folderHandle
    } else {
      // If folder is already selected, toggle the file modal
      setShowFileModal((prev) => !prev);
      // Refresh list when opening modal, in case files changed externally
      if (!showFileModal) {
          refreshFileList();
      }
    }
  };

  // Toggle focus mode - removes distractions
  const toggleFocusMode = () => {
    setFocusMode(prev => !prev);
  };

  return (
    // Base background color, relatively cheap
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-left Info Button - Removed blur and transparency */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          onClick={() => setShowInfoModal(true)}
          // Simplified background, kept subtle opacity hover
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full border border-gray-300 shadow-sm"
          title="About puffnotes"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Icon color adjusted for better contrast on white bg */}
          <Info size={17} strokeWidth={2} className="text-gray-200" />
        </motion.button>
      </div>

      {/* Browser Compatibility Warning - Kept as is */}
      {!window.showDirectoryPicker && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50 shadow">
          PuffNotes requires a desktop browser (like Chrome or Edge) for full file system access. Basic editing is available.
        </div>
      )}

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"
      >
        <source src="/backgroundsm3.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Onboarding Overlay - Removed blur, using simple opacity */}
      <AnimatePresence>
        {(!folderHandle || isFirstSave) && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-none" // Changed to bg-opacity
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} // Animate opacity directly
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Top-right Buttons - Removed blur and transparency from container */}
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
        {/* Onboarding Message - Kept as is */}
        <AnimatePresence>
          {(!folderHandle || isFirstSave) && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-sm text-gray-600 mr-3 bg-[#fff7ee] border border-[#e6ddcc] rounded-full px-4 py-1 shadow-sm"
            >
              {!folderHandle
                ? "Select a folder to save notes"
                : "Save your note (autosaves after)"}
            </motion.span>
          )}
        </AnimatePresence>

        {/* FAB-like Control Container - Solid background */}
        <div className="flex items-center space-x-3 px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
          {/* Focus Mode Toggle */}
          <button
            onClick={toggleFocusMode}
            // Adjusted colors for solid background
            className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-200' : 'text-gray-600'}`}
            title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </button>

          {/* Folder Button */}
          <motion.button
            onClick={handleFolderButton}
            className="opacity-60 hover:opacity-100 transition text-gray-400" // Ensure color contrast
            title={folderHandle ? "Open Notes Folder" : "Select Notes Folder"}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FolderOpen size={20} />
          </motion.button>

          {/* Save/Check Button - Kept animation logic */}
          {isFirstSave ? (
            <motion.button
              onClick={handleSave}
              className="opacity-60 hover:opacity-100 transition text-gray-400"
              title="Save Note"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              disabled={!noteName.trim()} // Disable if note name is empty
            >
              <Save size={20} />
            </motion.button>
          ) : (
            <motion.div
              animate={{
                rotate: saveIndicator ? [0, 20, 0] : 0,
                scale: saveIndicator ? [1, 1.2, 1] : 1,
                // Adjusted color for better visibility
                color: saveIndicator ? ["#6b7280", "#10b981", "#6b7280"] : "#9ca3af" // Gray -> Green -> Gray
              }}
              transition={{ duration: 0.5 }}
              title="Note Autosaved" // Add title for clarity
            >
              {/* Slightly dimmer checkmark when not animating */}
              <Check size={20} className="opacity-100" />
            </motion.div>
          )}

          {/* Toggle Editor */}
          <motion.button
            onClick={() => {
              setDropAnimationComplete(false);
              setIsEditorVisible((prev) => !prev);
            }}
            className="opacity-60 hover:opacity-100 transition text-gray-400"
            title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </motion.button>
        </div>

        {/* Info Modal Trigger - Moved inside the main div */}
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4" // Use opacity
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                // Solid background, removed blur
                className="bg-white border border-[#e6ddcc] rounded-xl shadow-2xl p-8 pt-6 w-full max-w-md text-center font-serif relative"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2>
                <p className="text-[#6b7280] text-sm leading-relaxed mb-4">
                  A serene space for note-taking — simple, offline, and distraction-free.<br />
                  Click the <Wand2 size={14} className="inline mb-0.5 text-[#9a8c73]" /> wand to magically expand and beautify your notes using AI.
                </p>
                <p className="text-[#8c6e54] text-xs italic mb-2">
                  No accounts. No cloud. Just you and your thoughts.
                </p>
                <p className="text-[#9c8063] text-xs">
                  lovingly crafted by{" "}
                  <a
                    href="https://rajinkhan.com" // Replace with actual link if available
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-200 transition"
                  >
                    Rajin Khan
                  </a>
                </p>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="mt-5 px-5 py-1.5 text-sm bg-[#fff7ee] border border-[#e0ddd5] rounded-full hover:bg-[#f0e9df] transition text-gray-700"
                >
                  Close
                </button>
                <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 opacity-50">
                  Background video via 
                  <a
                    href="https://moewalls.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    MoeWalls
                  </a>
                </p>
                 <button
                    onClick={() => setShowInfoModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                    aria-label="Close modal"
                 >
                     <X size={18} />
                 </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* File Explorer Modal - Removed blur, using solid background */}
      <AnimatePresence>
        {showFileModal && folderHandle && ( // Only show if folderHandle exists
          <motion.div
            className="fixed inset-0 z-30 bg-black bg-opacity-30 flex items-center justify-center p-4" // Use opacity
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowFileModal(false)} // Close on overlay click
          >
            <motion.div
              // Solid background
              className="bg-white rounded-xl shadow-xl border border-[#e6ddcc] w-full max-w-xs max-h-[60vh] overflow-y-auto p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-serif text-lg text-gray-800">Your Notes</h2>
                <motion.button
                  onClick={() => setShowFileModal(false)}
                  className="text-gray-500 hover:text-gray-800"
                  title="Close"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} />
                </motion.button>
              </div>
              {fileList.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-2 py-1">No markdown notes (.md) found in the selected folder.</p>
              ) : (
                <div className="space-y-1">
                  {fileList.map((filename, index) => (
                    <motion.button
                      key={filename}
                      onClick={() => handleOpenFile(filename)}
                      className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1.5 rounded transition-colors duration-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 3 }}
                      title={`Open ${filename}`}
                    >
                      {filename.replace(/\.md$/, "")} {/* Show name without extension */}
                    </motion.button>
                  ))}
                </div>
              )}
               <button
                  onClick={pickFolder} // Allow re-picking folder from modal
                  className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-700 underline py-1"
                >
                  Change Folder
                </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title peek bar - Removed blur, using solid background */}
      <AnimatePresence>
        {!isEditorVisible && dropAnimationComplete && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-10 flex justify-center"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 40,
              mass: 1
            }}
          >
            <motion.div
              // Solid background
              className="bg-white border-t border-[#e6ddcc] rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                setDropAnimationComplete(false);
                setIsEditorVisible(true);
              }}
              whileHover={{
                y: -2,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" // Adjusted shadow example
              }}
              whileTap={{
                scale: 0.98
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.span
                className="font-serif text-lg tracking-tight text-[#1a1a1a]"
                // Kept subtle animation
                animate={{ y: [0, -1, 0] }}
                transition={{
                  repeat: Infinity,
                  repeatType: "mirror", // Changed to mirror for smoother effect
                  duration: 2,
                  ease: "easeInOut"
                }}
              >
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

      {/* Editor Sheet - Kept animation, removed blur */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-20" // Increased z-index slightly
        initial={false}
        animate={{
          y: isEditorVisible ? 0 : '101%',
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 35, // Slightly adjusted damping
          mass: 0.8
        }}
        onAnimationComplete={() => setDropAnimationComplete(true)}
      >
        <div
          // Solid backgrounds, removed blur and transparency
          className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative transition-colors duration-500
            ${focusMode
              ? 'bg-[#fdfbf7]' // Slightly off-white for focus
              : 'bg-white'      // Standard white
            }`}
        >
          {/* Header with fade animations based on focus mode */}
          <motion.div
            className="flex justify-between items-center mb-4 flex-shrink-0" // Added flex-shrink-0
            animate={{ opacity: focusMode ? 0.3 : 1 }}
            transition={{ duration: 0.5 }}
            style={{ pointerEvents: focusMode ? 'none' : 'auto' }} // Disable interactions in focus mode
          >
            <motion.h1
              className="font-serif text-2xl tracking-tight text-[#1a1a1a]"
              whileHover={!focusMode ? { x: 2 } : {}} // Only hover effect if not in focus mode
            >
              puffnotes
            </motion.h1>

            {/* Note Title Input */}
            <motion.input
              type="text"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              // Simplified focus style, ensure contrast
              className={`text-center font-serif text-sm bg-transparent outline-none text-gray-500 w-1/3 sm:w-1/2 border-b border-transparent focus:border-gray-300 transition-colors duration-300 mx-2 ${focusMode ? 'opacity-0 pointer-events-none' : ''}`} // Hide in focus mode
              placeholder="note name..."
              whileFocus={{ scale: 1.02 }}
              disabled={focusMode}
            />
            <div className="flex space-x-4 text-lg text-gray-600">
              {/* Export Button - Placeholder, add actual export logic */}
              <motion.button
                title="Export as Markdown (.md)" // Changed title for clarity
                onClick={() => {
                   // Basic Markdown Export Logic
                   if (!note.trim()) return;
                   const filename = (noteName.trim() || "untitled") + ".md";
                   const blob = new Blob([note], { type: 'text/markdown' });
                   const link = document.createElement('a');
                   link.href = URL.createObjectURL(blob);
                   link.download = filename;
                   link.click();
                   URL.revokeObjectURL(link.href);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-gray-900"
              >
                <FileDown size={20} />
              </motion.button>
              <motion.button
                title="New Note"
                onClick={handleNewNote}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-gray-900"
              >
                <FilePlus size={20} />
              </motion.button>
            </div>
          </motion.div>

          <motion.hr
            // Simplified hr style
            className="border-gray-200 mb-4 flex-shrink-0"
            animate={{ opacity: focusMode ? 0.2 : 1 }}
          />

          {/* Textarea */}
          <div className="flex-1 overflow-y-auto relative" > {/* Ensure parent allows scrolling */}
            <textarea
              value={showBeautifyControls ? previewNote : note}
              onChange={(e) => {
                const val = e.target.value;
                // Update the correct state based on whether preview is active
                if (showBeautifyControls) {
                  setPreviewNote(val);
                } else {
                  setNote(val);
                }
              }}
              placeholder="A quiet place to write..."
              // Solid background, adjusted font size potentially for focus
              className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-gray-400 placeholder:italic transition-all duration-300 text-gray-800 ${focusMode ? 'text-base px-2' : 'text-sm'}`} // Slightly larger text in focus mode
              readOnly={isBeautifying} // Prevent editing while beautifying
            />
          </div>

          {/* Beautify Floating Control - Kept animations */}
          {/* Conditionally render container only if note has content */}
          {note.trim() && (
            <div className="absolute bottom-6 right-6 z-30 flex-shrink-0">
              {!showBeautifyControls ? (
                <motion.button
                  title="Beautify with AI"
                  onClick={handleBeautify}
                  disabled={isBeautifying || !note.trim()} // Also disable if note is empty
                  // Solid background for button
                  className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] text-gray-700 ${isBeautifying || !note.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`}
                  whileHover={!isBeautifying && note.trim() ? { scale: 1.05, rotate: 5 } : {}}
                  whileTap={!isBeautifying && note.trim() ? { scale: 0.95 } : {}}
                  // Keep loading animation
                  animate={isBeautifying ? { rotate: 360 } : {}}
                  transition={isBeautifying ? { duration: 1.5, repeat: Infinity, ease: "linear" } : {}}
                >
                  {isBeautifying ? (
                    <motion.div
                      // Inner rotation for loading indicator
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RotateCw size={20} className="text-[#9a8c73]" />
                    </motion.div>
                  ) : (
                    <Wand2 size={20} />
                  )}
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  // Solid background for controls container
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all"
                >
                  <span className="font-serif text-sm text-gray-600 hidden sm:inline">
                    AI Preview:
                  </span>
                  <motion.button
                    title="Accept Changes"
                    onClick={acceptBeautified}
                    className="bg-green-100 text-green-700 rounded-full p-2 border border-green-200 hover:bg-green-200 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isBeautifying} // Disable while regenerating
                  >
                    <CheckCircle size={20} />
                  </motion.button>
                  <motion.button
                    title="Regenerate"
                    onClick={regenerateBeautified}
                    className={`bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df] transition-colors ${isBeautifying ? 'opacity-50 cursor-wait animate-spin' : ''}`}
                    whileHover={!isBeautifying ? { scale: 1.1, rotate: 180 } : {}}
                    whileTap={!isBeautifying ? { scale: 0.9 } : {}}
                    transition={{ rotate: { duration: 0.4 } }}
                    disabled={isBeautifying}
                  >
                     {/* Show RotateCw normally, override with spinning animation if isBeautifying */}
                    <RotateCw size={20} className={isBeautifying ? 'invisible' : 'visible'} />
                  </motion.button>
                  <motion.button
                    title="Reject Changes"
                    onClick={rejectBeautified}
                    className="bg-red-100 text-red-600 rounded-full p-2 border border-red-200 hover:bg-red-200 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                     disabled={isBeautifying} // Disable while regenerating
                  >
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