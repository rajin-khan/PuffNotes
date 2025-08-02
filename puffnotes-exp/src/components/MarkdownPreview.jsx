// src/components/MarkdownPreview.jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownPreview({ markdownText, theme = 'default' }) {
  const textToRender = typeof markdownText === 'string' ? markdownText : '';

  // Theme-specific classes
  const themeClasses = {
    default: {
      text: 'text-gray-800',
      link: 'text-[#9a8c73] hover:[&_a]:text-[#8c6e54]',
      blockquote: 'border-[#e6ddcc] text-gray-600',
      codeInlineBg: 'bg-[#fff7ee]',
      codeInlineText: 'text-[#9a8c73]',
      codeInlineBorder: 'border-[#e6ddcc]',
      codeBlockBg: 'bg-transparent', // Seamless
      codeBlockText: 'text-[#1a1a1a]',
      tableHeaderBg: 'bg-transparent', // Seamless
      hr: 'border-[#e6ddcc]',
    },
    galaxy: {
      text: 'text-gray-200',
      link: 'text-[#ff8ccf] hover:[&_a]:text-hot-pink',
      blockquote: 'border-gray-600 text-gray-400',
      codeInlineBg: 'bg-gray-800/50',
      codeInlineText: 'text-[#ff8ccf]',
      codeInlineBorder: 'border-gray-700',
      // --- THE KEY FIX FOR GALAXY THEME ---
      codeBlockBg: 'bg-transparent', // Use the editor's background for a seamless look
      codeBlockText: 'text-gray-300',
      tableHeaderBg: 'bg-transparent', // Use the editor's background for a seamless look
      hr: 'border-gray-700',
    }
  };

  const current = themeClasses[theme] || themeClasses.default;
  
  return (
    <div className={`w-full h-full font-mono text-sm leading-relaxed ${current.text}`}>
      <div
        className={`
          p-1
          [&>*:first-child]:mt-0
          
          /* Basic Markdown Styles */
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
          [&_p]:mb-3
          [&_a]:underline ${current.link}
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-3 ${current.blockquote}
          
          /* Code styling */
          [&_code:not(pre>code)]:px-1 [&_code:not(pre>code)]:py-0.5 [&_code:not(pre>code)]:rounded [&_code:not(pre>code)]:text-[0.9em] [&_code:not(pre>code)]:border ${current.codeInlineBg} ${current.codeInlineText} ${current.codeInlineBorder}
          [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border ${current.codeBlockBg} ${current.codeBlockText} ${current.codeInlineBorder}
          [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:text-xs
          
          [&_hr]:my-4 ${current.hr}
          
          /* Table styles */
          [&_table]:border-collapse [&_table]:w-auto [&_table]:my-3
          [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold ${current.codeInlineBorder} ${current.tableHeaderBg}
          [&_td]:border [&_td]:px-2 [&_td]:py-1 ${current.codeInlineBorder}
        `}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {textToRender}
        </ReactMarkdown>
      </div>
    </div>
  );
}