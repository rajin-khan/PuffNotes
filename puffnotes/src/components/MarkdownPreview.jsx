// src/components/MarkdownPreview.jsx
import ReactMarkdown from 'react-markdown';
// Import remark-gfm for tables and other GitHub Flavored Markdown features
import remarkGfm from 'remark-gfm';
import { THEMES } from '../lib/themeManager';
import { handwritingPageDataUrl, nonEmptyHandwritingPages } from '../lib/handwriting';

export default function MarkdownPreview({ handwriting, markdownText, showLines = false, theme = THEMES.WARM }) {
  const textToRender = typeof markdownText === 'string' ? markdownText : '';
  const handwritingPages = nonEmptyHandwritingPages(handwriting);
  
  const isGalaxyTheme = theme === THEMES.GALAXY;
  const isKomorebiTheme = theme === THEMES.KOMOREBI;
  
  return (
    // This outer div handles scrolling and fills available height
    <div
      data-puffnotes-theme={theme}
      className={`puffnotes-markdown w-full h-full font-mono text-sm leading-relaxed ${isGalaxyTheme ? 'text-[#e8eaf6]' : isKomorebiTheme ? 'text-[#f4ebd7]' : 'text-gray-800'}`}
    >
      {/* Inner div for padding and applying markdown styles */}
      <div
        className={`
          p-1 /* Optional padding like textarea */
          [&>*:first-child]:mt-0
          
          /* Basic Markdown Styles */
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_li]:mb-1
          
          /* Theme-specific styles */
          ${isGalaxyTheme ? `
            [&_h1]:text-[#e8eaf6]
            [&_h2]:text-[#e8eaf6]
            [&_h3]:text-[#e8eaf6]
            [&_a]:text-[#9b59b6] [&_a]:underline hover:[&_a]:text-[#e74c3c]
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#4a5178] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#b8bfde] [&_blockquote]:my-3
            [&_code:not(pre>code)]:bg-[#2d3561] [&_code:not(pre>code)]:text-[#9b59b6] [&_code:not(pre>code)]:px-1 [&_code:not(pre>code)]:py-0.5 [&_code:not(pre>code)]:rounded [&_code:not(pre>code)]:text-[0.9em] [&_code:not(pre>code)]:border [&_code:not(pre>code)]:border-[#4a5178]
            [&_pre]:bg-[#0d1235] [&_pre]:text-[#e8eaf6] [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#4a5178]
            [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:text-xs
            [&_hr]:my-4 [&_hr]:border-[#4a5178]
          ` : `
            [&_a]:text-[#9a8c73] [&_a]:underline hover:[&_a]:text-[#8c6e54]
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#e6ddcc] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3
            [&_code:not(pre>code)]:bg-[#fff7ee] [&_code:not(pre>code)]:text-[#9a8c73] [&_code:not(pre>code)]:px-1 [&_code:not(pre>code)]:py-0.5 [&_code:not(pre>code)]:rounded [&_code:not(pre>code)]:text-[0.9em] [&_code:not(pre>code)]:border [&_code:not(pre>code)]:border-[#e6ddcc]
            [&_pre]:bg-[#fdf6ec] [&_pre]:text-[#1a1a1a] [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#e6ddcc]
            [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:text-xs
            [&_hr]:my-4 [&_hr]:border-[#e6ddcc]
          `}
          
          /* Table styles */
          [&_table]:border-collapse [&_table]:w-auto [&_table]:my-3
          ${isGalaxyTheme ? `
            [&_th]:border [&_th]:border-[#4a5178] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#2d3561] [&_th]:font-semibold [&_th]:text-[#e8eaf6]
            [&_td]:border [&_td]:border-[#4a5178] [&_td]:px-2 [&_td]:py-1 [&_td]:text-[#b8bfde]
          ` : `
            [&_th]:border [&_th]:border-[#e6ddcc] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#fff7ee] [&_th]:font-semibold
            [&_td]:border [&_td]:border-[#e6ddcc] [&_td]:px-2 [&_td]:py-1
          `}
        `}
      >
        {textToRender.trim() && (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {textToRender}
          </ReactMarkdown>
        )}
        {handwritingPages.map((page, index) => (
          <img
            key={page.id || index}
            src={handwritingPageDataUrl(page, { showLines, theme })}
            alt={`Handwriting page ${index + 1}`}
            className={`${textToRender.trim() || index ? 'mt-6' : ''} block h-auto w-full outline outline-1 outline-black/10`}
          />
        ))}
      </div>
    </div>
  );
}
