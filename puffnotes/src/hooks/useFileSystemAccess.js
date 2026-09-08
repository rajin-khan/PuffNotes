import { useCallback, useRef, useState } from 'react';

const isFileSystemAccessSupported = () => (
  typeof window !== 'undefined' && Boolean(window.showDirectoryPicker)
);

const drawingFilename = (filename) => `${filename.replace(/\.md$/, '')}.json`;

export default function useFileSystemAccess() {
  const [folderHandle, setFolderHandle] = useState(null);
  const folderHandleRef = useRef(null);
  const isSupported = isFileSystemAccessSupported();

  const pickFolder = useCallback(async () => {
    if (!isSupported) {
      console.warn('File System Access API not supported in this browser.');
      return undefined;
    }

    try {
      const handle = await window.showDirectoryPicker();
      folderHandleRef.current = handle;
      setFolderHandle(handle);
      return handle;
    } catch (error) {
      console.error('Folder access canceled or failed', error);
      return undefined;
    }
  }, [isSupported]);

  const fileExists = useCallback(async (filename) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder) return false;

    for await (const entry of activeFolder.values()) {
      if (entry.kind === 'file' && entry.name === filename) return true;
    }
    return false;
  }, []);

  const saveNote = useCallback(async (filename, content, isFirstSave = false) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder || !filename) return undefined;

    let finalName = filename;
    if (isFirstSave && await fileExists(finalName)) {
      const base = filename.replace(/\.md$/, '');
      let counter = 1;
      while (await fileExists(`${base}-${counter}.md`)) counter += 1;
      finalName = `${base}-${counter}.md`;
    }

    try {
      const fileHandle = await activeFolder.getFileHandle(finalName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return finalName;
    } catch (error) {
      console.error(`Failed to save "${finalName}":`, error);
      return null;
    }
  }, [fileExists]);

  const loadNote = useCallback(async (filename) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder) return null;
    const fileHandle = await activeFolder.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file.text();
  }, []);

  const saveHandwriting = useCallback(async (filename, document) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder || !filename) return undefined;
    const dataFolder = await activeFolder.getDirectoryHandle('.puffnotes', { create: true });
    const fileHandle = await dataFolder.getFileHandle(drawingFilename(filename), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(document));
    await writable.close();
    return true;
  }, []);

  const loadHandwriting = useCallback(async (filename) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder || !filename) return null;
    try {
      const dataFolder = await activeFolder.getDirectoryHandle('.puffnotes');
      const fileHandle = await dataFolder.getFileHandle(drawingFilename(filename));
      const file = await fileHandle.getFile();
      try {
        return JSON.parse(await file.text());
      } catch (error) {
        console.warn(`Ignoring unreadable handwriting data for "${filename}":`, error);
        return null;
      }
    } catch (error) {
      if (error.name === 'NotFoundError') return null;
      throw error;
    }
  }, []);

  const deleteHandwriting = useCallback(async (filename) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder || !filename) return false;
    try {
      const dataFolder = await activeFolder.getDirectoryHandle('.puffnotes');
      await dataFolder.removeEntry(drawingFilename(filename));
      return true;
    } catch (error) {
      if (error.name === 'NotFoundError') return true;
      throw error;
    }
  }, []);

  const listFiles = useCallback(async () => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder) return [];
    const files = [];
    for await (const entry of activeFolder.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.md')) files.push(entry.name);
    }
    return files;
  }, []);

  const deleteNote = useCallback(async (filename) => {
    const activeFolder = folderHandleRef.current;
    if (!activeFolder || !filename) return false;
    try {
      await activeFolder.removeEntry(filename);
      try {
        await deleteHandwriting(filename);
      } catch (error) {
        console.warn(`Deleted note but could not remove handwriting data for "${filename}":`, error);
      }
      return true;
    } catch (error) {
      console.error(`Failed to delete "${filename}":`, error);
      return false;
    }
  }, [deleteHandwriting]);

  return {
    folderHandle: isSupported ? folderHandle : null,
    pickFolder,
    saveNote,
    listFiles,
    loadNote,
    saveHandwriting,
    loadHandwriting,
    deleteNote,
  };
}
