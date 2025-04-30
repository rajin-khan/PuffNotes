import { useState } from 'react'

export default function useFileSystemAccess() {
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

  const saveNote = async (filename, content) => {
    if (!folderHandle || !filename) return
    const fileHandle = await folderHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
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