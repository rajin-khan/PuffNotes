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
} from 'lucide-react'

export default function App() {
  const [isEditorVisible, setIsEditorVisible] = useState(true)
  const [note, setNote] = useState("")
  const [noteName, setNoteName] = useState("untitled")
  const [fileList, setFileList] = useState([])
  const [showFileModal, setShowFileModal] = useState(false)
  const [isFirstSave, setIsFirstSave] = useState(true)

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
  }

  const handleSave = async () => {
    if (!folderHandle) {
      await pickFolder()
      await refreshFileList()
    }

    if (!noteName.trim()) return

    const filename = noteName.endsWith(".md") ? noteName : `${noteName}.md`
    await saveNote(filename, note)
    setIsFirstSave(false)
    refreshFileList()
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

  return (
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Top-right Buttons */}
      <div className="absolute top-4 right-6 z-20 flex items-center space-x-4">
        <button
          onClick={handleFolderButton}
          className="opacity-60 hover:opacity-100 transition"
          title="Open Folder"
        >
          <FolderOpen size={20} />
        </button>
        {isFirstSave ? (
          <button
            onClick={handleSave}
            className="opacity-60 hover:opacity-100 transition"
            title="Save Note"
          >
            <Save size={20} />
          </button>
        ) : (
          <Check size={20} className="text-green-600 opacity-70" />
        )}
        <button
          onClick={() => setIsEditorVisible((prev) => !prev)}
          className="opacity-60 hover:opacity-100 transition"
          title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
        >
          {isEditorVisible ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {/* File Explorer Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-30 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl border border-[#e6ddcc] w-[20rem] max-h-[60vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-serif text-lg">Your Notes</h2>
              <button
                onClick={() => setShowFileModal(false)}
                className="hover:opacity-80"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
            {fileList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No markdown files yet.</p>
            ) : (
              fileList.map((filename) => (
                <button
                  key={filename}
                  onClick={() => handleOpenFile(filename)}
                  className="block w-full text-left text-sm font-mono text-[#333] hover:bg-[#f8f6f2] px-2 py-1 rounded"
                >
                  {filename}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 transition-transform duration-500 ease-in-out ${
          isEditorVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white rounded-t-xl shadow-xl border border-[#e6ddcc] max-w-3xl mx-auto p-6 h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-serif text-2xl tracking-tight">puffnotes</h1>

            {/* Note Title Input */}
            <input
              type="text"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              className="text-center font-serif text-lg bg-transparent outline-none border-b border-dotted border-gray-400 w-1/2"
              placeholder="Note name..."
            />

            <div className="flex space-x-4 text-lg">
              <button title="Export as PDF">
                <FileDown size={20} />
              </button>
              <button title="New Note" onClick={handleNewNote}>
                <FilePlus size={20} />
              </button>
            </div>
          </div>

          <hr className="border-[#e0ddd5] mb-4" />

          {/* Textarea */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A quiet place to write. No cloud. No noise. Just thoughts, beautifully yours."
              className="w-full h-full font-mono text-base bg-transparent resize-none outline-none leading-relaxed placeholder:text-[#bbb] placeholder:italic"
            />
          </div>

          {/* Beautify FAB */}
          <div className="absolute bottom-6 right-6">
            <button
              title="Beautify with AI"
              className="text-lg p-2 rounded-full shadow-md hover:scale-105 transition-transform bg-[#fff7ee] border border-[#e0ddd5]"
            >
              <Wand2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}