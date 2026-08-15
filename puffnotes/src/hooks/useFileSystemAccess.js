import { useCallback, useState } from 'react';

const isFileSystemAccessSupported = () => (
  typeof window !== 'undefined' && Boolean(window.showDirectoryPicker)
);

export default function useFileSystemAccess() {
  const [folderHandle, setFolderHandle] = useState(null);
  const isSupported = isFileSystemAccessSupported();

  const pickFolder = useCallback(async () => {
    if (!isSupported) {
      console.warn('File System Access API not supported in this browser.');
      return undefined;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setFolderHandle(handle);
      return handle;
    } catch (error) {
      console.error('Folder access canceled or failed', error);
      return undefined;
    }
  }, [isSupported]);

  const fileExists = useCallback(async (filename) => {
    if (!folderHandle) return false;

    for await (const entry of folderHandle.values()) {
      if (entry.kind === 'file' && entry.name === filename) return true;
    }
    return false;
  }, [folderHandle]);

  const saveNote = useCallback(async (filename, content, isFirstSave = false) => {
    if (!folderHandle || !filename) return undefined;

    let finalName = filename;
    if (isFirstSave && await fileExists(finalName)) {
      const base = filename.replace(/\.md$/, '');
      let counter = 1;
      while (await fileExists(`${base}-${counter}.md`)) counter += 1;
      finalName = `${base}-${counter}.md`;
    }

    try {
      const fileHandle = await folderHandle.getFileHandle(finalName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return finalName;
    } catch (error) {
      console.error(`Failed to save "${finalName}":`, error);
      return null;
    }
  }, [fileExists, folderHandle]);

  const loadNote = useCallback(async (filename) => {
    if (!folderHandle) return null;
    const fileHandle = await folderHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }, [folderHandle]);

  const listFiles = useCallback(async () => {
    if (!folderHandle) return [];
    const files = [];
    for await (const entry of folderHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.md')) files.push(entry.name);
    }
    return files;
  }, [folderHandle]);

  const deleteNote = useCallback(async (filename) => {
    if (!folderHandle || !filename) return false;
    try {
      await folderHandle.removeEntry(filename);
      return true;
    } catch (error) {
      console.error(`Failed to delete "${filename}":`, error);
      return false;
    }
  }, [folderHandle]);

  return {
    folderHandle: isSupported ? folderHandle : null,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
    deleteNote,
  };
}
