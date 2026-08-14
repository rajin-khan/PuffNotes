import { beautifyNoteWithGroq } from './groq.js';

export async function runBeautifyWorkflow({
  isRegeneration = false,
  originalNote,
  note,
  userApiKey,
  defaultApiKey,
  apiKeyInputRef,
  setApiKeyError,
  setApiKeySaveFeedback,
  setIsBeautifying,
  setIsPreviewMode,
  setOriginalNote,
  setPreviewNote,
  setShowBeautifyControls,
  setShowSettingsModal,
  beautifyNote = beautifyNoteWithGroq,
}) {
  const noteToProcess = isRegeneration ? (originalNote || note) : note;
  if (!noteToProcess.trim()) return;

  const keyToUse = userApiKey || defaultApiKey;
  if (!keyToUse) {
    console.error('No Groq API Key available (User or Default).');
    setApiKeyError(true);
    setApiKeySaveFeedback('');
    setShowSettingsModal(true);
    setTimeout(() => apiKeyInputRef.current?.focus(), 100);
    return;
  }

  setIsBeautifying(true);
  if (!isRegeneration) {
    setOriginalNote(note);
  }
  setApiKeyError(false);
  setApiKeySaveFeedback('');

  try {
    const result = await beautifyNote(noteToProcess, keyToUse);
    setPreviewNote(result);
    setShowBeautifyControls(true);
    setIsPreviewMode(false);
  } catch (error) {
    console.error('Beautify request failed:', error);
    let userMessage = `AI Beautify failed: ${error.message || 'Unknown error'}`;
    const isAuthOrRateLimitError = error.status === 401 || error.status === 403 || error.status === 429;

    if (!userApiKey && keyToUse === defaultApiKey && isAuthOrRateLimitError) {
      userMessage = 'The default AI key might be rate-limited or invalid. Please enter your own free Groq API key to continue.';
      setApiKeyError(true);
      setShowSettingsModal(true);
      setTimeout(() => apiKeyInputRef.current?.focus(), 100);
    } else if (userApiKey && keyToUse === userApiKey && isAuthOrRateLimitError) {
      userMessage = 'Your Groq API key seems invalid or rate-limited. Please check it or generate a new one.';
      setShowSettingsModal(true);
      setTimeout(() => apiKeyInputRef.current?.focus(), 100);
      alert(userMessage);
    } else {
      alert(userMessage);
    }

    setPreviewNote('');
    setShowBeautifyControls(false);
  } finally {
    setIsBeautifying(false);
  }
}
