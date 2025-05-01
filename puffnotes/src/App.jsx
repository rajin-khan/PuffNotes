import { useState, useEffect } from 'react'
import useFileSystemAccess from './hooks/useFileSystemAccess'
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
} from 'lucide-react'
import { beautifyNoteWithGroq } from './lib/groq'
import { AnimatePresence, motion } from 'framer-motion' // Add this import

export default function App() {
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [note, setNote] = useState("")
  const [noteName, setNoteName] = useState("untitled")
  const [fileList, setFileList] = useState([])
  const [showFileModal, setShowFileModal] = useState(false)
  const [isFirstSave, setIsFirstSave] = useState(true)
  const [showFileActions, setShowFileActions] = useState(false)

  const [previewNote, setPreviewNote] = useState("")
  const [showBeautifyControls, setShowBeautifyControls] = useState(false)
  const [originalNote, setOriginalNote] = useState("")
  const [isBeautifying, setIsBeautifying] = useState(false)
  
  // Add these new state variables for animations and feedback
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [dropAnimationComplete, setDropAnimationComplete] = useState(true)

  const [showInfoModal, setShowInfoModal] = useState(false)


  const {
    folderHandle,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
  } = useFileSystemAccess()

  const refreshFileList = async () => {
    const files = await listFiles()
    setFileList(files)
  }

  const handleOpenFile = async (filename) => {
    const content = await loadNote(filename)
    const baseName = filename.replace(/\.md$/, "")
    setNote(content)
    setNoteName(baseName)
    setIsFirstSave(false)
    setShowFileModal(false)
  }

  const handleNewNote = () => {
    setNote("")
    setNoteName("untitled")
    setIsFirstSave(true)
    setPreviewNote("")
    setShowBeautifyControls(false)
  }

  const handleSave = async () => {
    if (!folderHandle) {
      await pickFolder()
      await refreshFileList()
    }

    if (!noteName.trim()) return

    const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`
    const savedAs = await saveNote(filename, note, isFirstSave)

    if (savedAs) {
      const baseName = savedAs.replace(/\.md$/, "")
      setNoteName(baseName)
      setIsFirstSave(false)
      refreshFileList()
      
      // Show save indicator animation
      setSaveIndicator(true)
      setTimeout(() => setSaveIndicator(false), 1500)
    }
  }

  const handleBeautify = async () => {
    setIsBeautifying(true)
    setOriginalNote(note)
    try {
      const result = await beautifyNoteWithGroq(note)
      setPreviewNote(result)
      setShowBeautifyControls(true)
    } catch (err) {
      console.error("Beautify failed", err)
      alert("Something went wrong with Groq beautify.")
      setPreviewNote("")
      setShowBeautifyControls(false)
    } finally {
      setIsBeautifying(false)
    }
  }

  const acceptBeautified = () => {
    setNote(previewNote)
    setPreviewNote("")
    setOriginalNote("")
    setShowBeautifyControls(false)
  }

  const rejectBeautified = () => {
    setPreviewNote("")
    setShowBeautifyControls(false)
  }

  const regenerateBeautified = () => {
    handleBeautify()
  }

  useEffect(() => {
    const autoSave = async () => {
      if (!isFirstSave && folderHandle && noteName.trim()) {
        const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`
        await saveNote(filename, note)
      }
    }

    const debounce = setTimeout(autoSave, 750)
    return () => clearTimeout(debounce)
  }, [note])

  useEffect(() => {
    if (folderHandle) refreshFileList()
  }, [folderHandle])

  const handleFolderButton = async () => {
    if (!folderHandle) {
      await pickFolder()
      await refreshFileList()
    } else {
      setShowFileModal((prev) => !prev)
    }
  }

  // Toggle focus mode - removes distractions
  const toggleFocusMode = () => {
    setFocusMode(prev => !prev)
  }

  return (
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-left Info Button */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          onClick={() => setShowInfoModal(true)}
          className="opacity-70 hover:opacity-90 transition p-1 rounded-full backdrop-blur-sm bg-white/30 border border-white/20 shadow-sm"
          title="About puffnotes"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Info size={17} strokeWidth={2} className="text-gray-100" />
        </motion.button>
      </div>

      {!window.showDirectoryPicker && (
        <div className="fixed top-0 left-0 right-0 bg-red-50 text-red-800 text-sm font-serif px-4 py-2 text-center z-50">
          PuffNotes requires a desktop browser (like Chrome or Edge) for full functionality.
        </div>
      )}

      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-[10] pointer-events-none"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Background decorative elements */}
      <motion.div 
        className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#f8e8d4] opacity-20"
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.15, 0.2] 
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <motion.div 
        className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#f8e8d4] opacity-20"
        animate={{ 
          scale: [1, 1.03, 1],
          opacity: [0.2, 0.25, 0.2] 
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />

      {/* Onboarding Overlay with fade animation */}
      <AnimatePresence>
        {(!folderHandle || isFirstSave) && (
          <motion.div 
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Top-right Buttons with inline guidance */}
      <div className="absolute top-4 right-6 z-50 flex items-center space-x-3">
      {/* Onboarding Message (outside FAB) */}
      <AnimatePresence>
        {(!folderHandle || isFirstSave) && (
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="font-serif text-sm text-gray-500 mr-3 bg-[#fff7ee] border border-[#e6ddcc] rounded-full px-4 py-1 shadow-sm"
          >
            {!folderHandle
              ? "Before you start, select a folder to use"
              : "Save your note (autosaves after)"}
          </motion.span>
        )}
      </AnimatePresence>

      {/* FAB-like Control Container */}
      <div className="flex items-center space-x-3 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-[#e6ddcc]">
        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className={`opacity-60 hover:opacity-100 transition ${focusMode ? 'text-orange-100' : ''}`}
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
          className="opacity-60 hover:opacity-100 transition"
          title="Open Folder"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FolderOpen size={20} />
        </motion.button>
    
        {/* Save/Check Button */}
        {/*
        <AnimatePresence>
          {saveIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute right-16 top-8 bg-[#f8f1e8] border border-[#e6ddcc] text-[#9a8c73] px-3 py-1.5 rounded-full shadow-md text-xs font-serif flex items-center gap-1.5"
            >
              <Check size={12} strokeWidth={3} className="text-green-600" />
              <span>Note saved</span>
            </motion.div>
          )}
        </AnimatePresence>
        */}
    
        {isFirstSave ? (
          <motion.button
            onClick={handleSave}
            className="opacity-60 hover:opacity-100 transition"
            title="Save Note"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={20} />
          </motion.button>
        ) : (
          <motion.div 
            animate={{ 
              rotate: saveIndicator ? [0, 20, 0] : 0,
              scale: saveIndicator ? [1, 1.2, 1] : 1,
              color: saveIndicator ? ["#9a8c73", "#4ade80", "#9a8c73"] : "#9a8c73"
            }}
            transition={{ duration: 0.5 }}
          >
            <Check size={20} className="opacity-100" title="Autosaved" />
          </motion.div>
        )}
    
        {/* Toggle Editor */}
        <motion.button
          onClick={() => {
            setDropAnimationComplete(false)
            setIsEditorVisible((prev) => !prev)
          }}
          className="opacity-60 hover:opacity-100 transition"
          title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showInfoModal && (
          <motion.div 
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white/70 backdrop-blur-2xl border border-[#e6ddcc] rounded-4xl shadow-2xl p-10 w-[95%] max-w-md text-center font-serif"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl text-[#1a1a1a] mb-3">puffnotes</h2>
              <p className="text-[#8c6e54] text-sm leading-relaxed mb-4">
                A serene space for note-taking — simple, offline, and distraction-free.<br />
                Click the <Wand2 size={14} className="inline mb-0.5" /> wand to magically expand and beautify your notes using AI.
              </p>
              <p className="text-[#8c6e54] text-xs italic mb-2">
                No accounts. No cloud. Just you and your thoughts.
              </p>
              <p className="text-[#9c8063] text-xs">
                lovingly crafted by{" "}
                <a
                  href="https://yourwebsite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-orange-100 transition"
                >
                  Rajin Khan
                </a>
              </p>
              <button 
                onClick={() => setShowInfoModal(false)}
                className="mt-5 px-5 py-1.5 text-sm bg-[#fff7ee] border border-[#e0ddd5] rounded-full hover:bg-[#f0e9df] transition"
              >
                Close
              </button>
              <p className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 opacity-50">
                Background video via&nbsp;
                <a
                  href="https://moewalls.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  MoeWalls
                </a>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>


      {/* File Explorer Modal with animation */}
      <AnimatePresence>
        {showFileModal && (
          <motion.div 
            className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="bg-white/60 backdrop-blur-2xl border-white/40 rounded-xl shadow-xl border border-[#e6ddcc] w-[20rem] max-h-[60vh] overflow-y-auto p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-serif text-lg">Your Notes</h2>
                <motion.button
                  onClick={() => setShowFileModal(false)}
                  className="hover:opacity-80"
                  title="Close"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={18} />
                </motion.button>
              </div>
              {fileList.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No markdown files yet.</p>
              ) : (
                <div className="space-y-1">
                  {fileList.map((filename, index) => (
                    <motion.button
                      key={filename}
                      onClick={() => handleOpenFile(filename)}
                      className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1 rounded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ x: 3 }}
                    >
                      {filename}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title peek bar - Only visible when editor is minimized */}
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
              className="bg-white/70 backdrop-blur-lg border-t border-white/30 rounded-t-2xl shadow-2xl px-6 py-3 flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                setDropAnimationComplete(false);
                setIsEditorVisible(true);
              }}
              whileHover={{ 
                y: -2,
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
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
                animate={{ y: [0, -1, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  duration: 2, 
                  ease: "easeInOut" 
                }}
              >
                puffnotes
              </motion.span>
              <span className="text-gray-400">|</span>
              <span className="font-serif text-sm text-gray-500 max-w-xs truncate">
                {noteName || "untitled"}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Sheet with enhanced animation */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-10"
        initial={false}
        animate={{ 
          y: isEditorVisible ? 0 : '100%',
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          mass: 0.8
        }}
        onAnimationComplete={() => setDropAnimationComplete(true)}
      >
        <div
          className={`rounded-t-2xl shadow-2xl max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative z-20 transition-all duration-500
            ${focusMode
              ? 'bg-white/20 backdrop-blur-2xl'
              : 'bg-white/80 backdrop-blur-lg'
            }`}
        >
          {/* Header with fade animations based on focus mode */}
          <motion.div 
            className="flex justify-between items-center mb-4"
            animate={{ opacity: focusMode ? 0.3 : 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1 
              className="font-serif text-2xl tracking-tight text-[#1a1a1a]"
              whileHover={{ x: 2 }}
            >
              puffnotes
            </motion.h1>

            {/* Note Title Input */}
            <motion.input
              type="text"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              className={`text-center font-serif text-sm bg-transparent outline-none text-gray-500 w-1/2 transition-colors duration-300 ${focusMode ? 'focus:bg-white focus:border-b focus:opacity-100' : ''}`}
              placeholder="note name..."
              whileFocus={{ scale: 1.02 }}
            />
            <div className="flex space-x-4 text-lg">
              <motion.button 
                title="Export as PDF"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileDown size={20} />
              </motion.button>
              <motion.button 
                title="New Note" 
                onClick={handleNewNote}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FilePlus size={20} />
              </motion.button>
            </div>
          </motion.div>

          <motion.hr 
            className="border-[#e0ddd5] mb-4"
            animate={{ opacity: focusMode ? 0.2 : 1 }}
          />

          {/* Textarea with improved focus handling */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={showBeautifyControls ? previewNote : note}
              onChange={(e) => {
                const val = e.target.value
                showBeautifyControls ? setPreviewNote(val) : setNote(val)
              }}
              placeholder="A quiet place to write. No cloud. No noise. Just thoughts, beautifully yours."
              className={`w-full h-full font-mono text-sm bg-transparent resize-none outline-none leading-relaxed placeholder:text-[#bbb] placeholder:italic transition-all duration-300 ${focusMode ? 'text-lg' : ''}`}
            />
          </div>

          {/* Beautify Floating Control with animations */}
          <div className="absolute bottom-6 right-6 z-20">
            {!showBeautifyControls ? (
                              <motion.button
                title="Beautify with AI"
                onClick={handleBeautify}
                disabled={isBeautifying}
                className={`text-lg p-3 rounded-full shadow-md transition-colors bg-[#fff7ee] border border-[#e0ddd5] ${isBeautifying ? 'opacity-70' : 'hover:bg-[#f0e9df] hover:text-[#9a8c73]'}`}
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                animate={isBeautifying ? { rotate: 360 } : {}}
                transition={isBeautifying ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
              >
                {isBeautifying ? 
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RotateCw size={20} className="text-[#9a8c73]" />
                  </motion.div> 
                  : <Wand2 size={20} />
                }
              </motion.button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center space-x-4 px-5 py-3.5 rounded-full bg-[#fff7ee] border border-[#e0ddd5] shadow-md transition-all"
              >
                <span className="font-serif text-sm text-gray-600">
                  preview mode
                </span>
                <motion.button 
                  title="Accept" 
                  onClick={acceptBeautified}
                  className="bg-green-50 text-green-600 rounded-full p-2 border border-green-200 hover:bg-green-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CheckCircle size={20} />
                </motion.button>
                <motion.button 
                  title="Regenerate" 
                  onClick={regenerateBeautified}
                  className="bg-[#f8f1e8] text-[#9a8c73] rounded-full p-2 border border-[#e6ddcc] hover:bg-[#f0e9df]"
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ rotate: { duration: 0.5 } }}
                >
                  <RotateCw size={20} />
                </motion.button>
                <motion.button 
                  title="Reject" 
                  onClick={rejectBeautified}
                  className="bg-red-50 text-red-500 rounded-full p-2 border border-red-200 hover:bg-red-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XCircle size={20} />
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}