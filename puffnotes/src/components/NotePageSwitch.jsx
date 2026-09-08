import { useState } from 'react';
import { FileText, PenLine } from 'lucide-react';
import { THEMES } from '../lib/themeManager';
import { isMobileDevice } from '../lib/deviceSupport';
import { ModalPresence } from './ModalMotion';

export default function NotePageSwitch({ page, onChange, theme }) {
  const [showMobileNotice, setShowMobileNotice] = useState(false);
  const handwriting = page === 'handwriting';
  const colors = theme === THEMES.GALAXY
    ? 'bg-[#242d63] text-[#eef1ff] ring-[#6471a4]'
    : theme === THEMES.KOMOREBI
      ? 'bg-[#493a2e] text-[#fff4df] ring-[#8d7357]'
      : 'bg-[#f4eee5] text-[#443b32] ring-[#cbbda9]';
  const thumb = theme === THEMES.GALAXY
    ? 'bg-[#f0f2ff] text-[#18204e]'
    : theme === THEMES.KOMOREBI
      ? 'bg-[#f4ead8] text-[#3b3027]'
      : 'bg-white text-[#443b32]';

  const switchPage = () => {
    if (!handwriting && isMobileDevice()) {
      setShowMobileNotice(true);
      return;
    }
    onChange(handwriting ? 'text' : 'handwriting');
  };
  const noticeColors = theme === THEMES.GALAXY
    ? 'border-[#4a5178] bg-[#0f1642] text-[#e8eaf6]'
    : theme === THEMES.KOMOREBI
      ? 'border-[#685541] bg-[#352820] text-[#f4ebd7]'
      : 'border-[#e6ddcc] bg-[#fffaf2] text-[#3d2e26]';

  return (
    <>
    <button
      type="button"
      onClick={switchPage}
      aria-label={handwriting ? 'Switch to typed note' : 'Switch to handwriting'}
      aria-pressed={handwriting}
      title={handwriting ? 'Switch to typed note' : 'Switch to handwriting'}
      className={`relative h-7 w-12 shrink-0 rounded-full ring-1 transition-[background-color,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${colors}`}
    >
      <span className={`absolute left-0.5 top-0.5 grid h-6 w-6 place-items-center rounded-full shadow-sm transition-transform duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${thumb} ${handwriting ? 'translate-x-5' : 'translate-x-0'}`}>
        <FileText className={`absolute transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${handwriting ? 'scale-25 opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'}`} size={13} strokeWidth={1.75} aria-hidden="true" />
        <PenLine className={`absolute transition-[opacity,scale,filter] duration-200 [transition-timing-function:cubic-bezier(0.2,0,0,1)] ${handwriting ? 'scale-100 opacity-100 blur-0' : 'scale-25 opacity-0 blur-[4px]'}`} size={13} strokeWidth={1.75} aria-hidden="true" />
      </span>
    </button>
    <ModalPresence
      isOpen={showMobileNotice}
      kind="drawing-unsupported"
      onBackdropClick={() => setShowMobileNotice(false)}
      theme={theme}
      panelClassName={`w-full max-w-xs rounded-2xl border px-6 py-7 text-center shadow-2xl ${noticeColors}`}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="drawing-unsupported-title">
        <PenLine className="mx-auto opacity-70" size={24} strokeWidth={1.5} aria-hidden="true" />
        <h2 id="drawing-unsupported-title" className="mt-4 font-serif text-xl">Drawing stays on desktop</h2>
        <div className="mx-auto mt-3 h-px w-16 bg-current opacity-25" aria-hidden="true" />
        <p className="mt-4 font-mono text-sm leading-relaxed opacity-70">
          Drawing notes are not supported on mobile. Open Puffnotes on a desktop to draw. Existing drawings still appear in Preview here.
        </p>
        <button type="button" autoFocus onClick={() => setShowMobileNotice(false)} className="mt-6 min-h-11 w-full rounded-full border border-current/25 px-5 font-mono text-sm transition-[background-color,scale] duration-150 hover:bg-current/10 active:scale-96 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Got it
        </button>
      </div>
    </ModalPresence>
    </>
  );
}
