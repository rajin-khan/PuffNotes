// src/lib/googleDrive.js

const FOLDER_NAME = 'puffnotes';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

/**
 * Finds or creates the dedicated "puffnotes" folder in the user's Google Drive.
 * @param {string} accessToken The user's OAuth2 access token.
 * @returns {Promise<string>} The ID of the "puffnotes" folder.
 */
export async function findOrCreatePuffnotesFolder(accessToken) {
  // 1. Search for the folder
  const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!searchResponse.ok) throw new Error('Failed to search for puffnotes folder.');
  const searchData = await searchResponse.json();

  if (searchData.files.length > 0) {
    return searchData.files[0].id; // Folder exists
  }

  // 2. Create the folder if it doesn't exist
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: FOLDER_MIME_TYPE
    })
  });

  if (!createResponse.ok) throw new Error('Failed to create puffnotes folder.');
  const createData = await createResponse.json();
  return createData.id;
}

/**
 * Lists all markdown (.md) files in the puffnotes folder.
 * @param {string} accessToken The user's OAuth2 access token.
 * @param {string} folderId The ID of the puffnotes folder.
 * @returns {Promise<Array<Object>>} A list of file objects { id, name }.
 */
export async function listNotes(accessToken, folderId) {
  const query = `'${folderId}' in parents and mimeType='text/markdown' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) throw new Error('Failed to list notes from Google Drive.');
  const data = await response.json();
  return data.files || [];
}

/**
 * Fetches the content of a specific note file.
 * @param {string} accessToken The user's OAuth2 access token.
 * @param {string} fileId The ID of the file to fetch.
 * @returns {Promise<string>} The text content of the note.
 */
export async function getNoteContent(accessToken, fileId) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) throw new Error('Failed to fetch note content.');
  return response.text();
}

/**
 * Creates or updates a note in Google Drive.
 * @param {string} accessToken The user's OAuth2 access token.
 * @param {string} folderId The ID of the puffnotes folder.
 * @param {string} content The markdown content of the note.
 * @param {string|null} fileId The ID of the file to update, or null to create a new one.
 * @param {string} fileName The name of the file.
 * @returns {Promise<Object>} The metadata of the created/updated file.
 */
export async function saveNoteContent(accessToken, folderId, content, fileId, fileName) {
    const metadata = {
        name: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
        mimeType: 'text/markdown',
    };

    if (!fileId) { // This is a new file
        metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/markdown' }));

    const url = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const method = fileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("Google Drive Save Error:", errorBody);
        throw new Error(`Failed to save note: ${errorBody.error.message}`);
    }

    return response.json();
}