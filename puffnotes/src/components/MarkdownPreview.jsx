// src/components/MarkdownPreview.jsx
import ReactMarkdown from 'react-markdown';
// Import remark-gfm for tables and other GitHub Flavored Markdown features
import remarkGfm from 'remark-gfm';

export default function MarkdownPreview({ markdownText }) {
  const textToRender = typeof markdownText === 'string' ? markdownText : '';
  
  return (
    // This outer div handles scrolling and fills available height
    <div className="w-full h-full font-mono text-sm leading-relaxed text-gray-800">
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
          [&_a]:text-[#9a8c73] [&_a]:underline hover:[&_a]:text-[#8c6e54]
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-[#e6ddcc] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3
          
          /* Code styling to match app theme */
          [&_code:not(pre>code)]:bg-[#fff7ee] [&_code:not(pre>code)]:text-[#9a8c73] [&_code:not(pre>code)]:px-1 [&_code:not(pre>code)]:py-0.5 [&_code:not(pre>code)]:rounded [&_code:not(pre>code)]:text-[0.9em] [&_code:not(pre>code)]:border [&_code:not(pre>code)]:border-[#e6ddcc]
          [&_pre]:bg-[#fdf6ec] [&_pre]:text-[#1a1a1a] [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-[#e6ddcc]
          [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_pre_code]:text-xs
          
          [&_hr]:my-4 [&_hr]:border-[#e6ddcc]
          
          /* Table styles */
          [&_table]:border-collapse [&_table]:w-auto [&_table]:my-3
          [&_th]:border [&_th]:border-[#e6ddcc] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#fff7ee] [&_th]:font-semibold
          [&_td]:border [&_td]:border-[#e6ddcc] [&_td]:px-2 [&_td]:py-1
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown
        >
          {textToRender}
        </ReactMarkdown>
      </div>
    </div>
  );
}