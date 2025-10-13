import { useState } from 'react'

export default function useFileSystemAccess() {

  if (typeof window === 'undefined' || !window.showDirectoryPicker) {
      // Return dummy functions to prevent crashes in unsupported environments
      console.warn("File System Access API not supported in this browser.");
      return {
          folderHandle: null,
          pickFolder: async () => console.warn("Not supported."),
          saveNote: async () => console.warn("Not supported."),
          listFiles: async () => [],
          loadNote: async () => null,
          deleteNote: async () => console.warn("Not supported."),
      };
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
      return finalName
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

  // --- NEW: Function to delete a file ---
  const deleteNote = async (filename) => {
    if (!folderHandle || !filename) return false;
    try {
      await folderHandle.removeEntry(filename);
      return true;
    } catch (err) {
      console.error(`Failed to delete "${filename}":`, err);
      return false;
    }
  };

  return { folderHandle, pickFolder, saveNote, listFiles, loadNote, deleteNote }
}