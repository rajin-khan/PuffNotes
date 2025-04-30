import { useState } from 'react'

export default function App() {
  const [isEditorVisible, setIsEditorVisible] = useState(true)

  return (
    <div className="min-h-screen bg-[#fdf6ec] relative overflow-hidden">

      {/* Slide Toggle Button */}
      <div className="absolute top-4 right-6 z-20">
        <button
          onClick={() => setIsEditorVisible((prev) => !prev)}
          className="text-xl opacity-60 hover:opacity-100 transition"
          title={isEditorVisible ? 'Hide Editor' : 'Show Editor'}
        >
          {isEditorVisible ? '⬇️' : '⬆️'}
        </button>
      </div>

      {/* Editor Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 transition-transform duration-500 ease-in-out ${
          isEditorVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >

        <div className="bg-white rounded-t-xl shadow-xl border border-[#e6ddcc] max-w-3xl mx-auto p-6 h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-serif text-2xl tracking-tight">puffnotes</h1>
            <div className="flex space-x-4 text-lg">
              <button title="Export as PDF">📄</button>
              <button title="Save Note">💾</button>
            </div>
          </div>

          <hr className="border-[#e0ddd5] mb-4" />

          {/* Textarea */}
          <div className="flex-1 overflow-hidden">
            <textarea
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
              ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
