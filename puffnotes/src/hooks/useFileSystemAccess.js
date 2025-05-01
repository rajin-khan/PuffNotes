import { useState } from 'react'

export default function useFileSystemAccess() {

  if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      alert("PuffNotes requires a desktop Chromium browser (like Chrome or Edge). This browser doesn't support local folder access.")
      throw new Error("File System Access API not supported")
    }    

  const [folderHandle, setFolderHandle] = useState(null)

  const pickFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker()
      setFolderHandle(handle)
      return handle
    } catch (err) {
      console.error("Folder access canceled or failed", err)
    }
  }

  const saveNote = async (filename, content, isFirstSave = false) => {
    if (!folderHandle || !filename) return
  
    let finalName = filename
  
    // Only perform deduplication on first save
    if (isFirstSave) {
      if (await fileExists(finalName)) {
        const base = filename.replace(/\.md$/, "")
        let counter = 1
        while (await fileExists(`${base}-${counter}.md`)) {
          counter++
        }
        finalName = `${base}-${counter}.md`
      }
    }
  
    try {
      const fileHandle = await folderHandle.getFileHandle(finalName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return finalName // return what was saved
    } catch (err) {
      console.error(`Failed to save "${finalName}":`, err)
      return null
    }
  }
  
  const fileExists = async (filename) => {
    for await (const entry of folderHandle.values()) {
      if (entry.kind === 'file' && entry.name === filename) {
        return true
      }
    }
    return false
  }
  

  const loadNote = async (filename) => {
    if (!folderHandle) return null
    const fileHandle = await folderHandle.getFileHandle(filename)
    const file = await fileHandle.getFile()
    const text = await file.text()
    return text
  }  
  

  const listFiles = async () => {
    if (!folderHandle) return []
    const files = []
    for await (const entry of folderHandle.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".md")) {
        files.push(entry.name)
      }
    }
    return files
  }

  return { folderHandle, pickFolder, saveNote, listFiles, loadNote }
}