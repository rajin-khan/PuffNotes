import { FileText, PenLine } from 'lucide-react';
import { THEMES } from '../lib/themeManager';

export default function NotePageSwitch({ page, onChange, theme }) {
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

  return (
    <button
      type="button"
      onClick={() => onChange(handwriting ? 'text' : 'handwriting')}
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
  );
}
