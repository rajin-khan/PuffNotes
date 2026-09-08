import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as ReactDOM from 'react-dom/client';

import MarkdownPreview from '../components/MarkdownPreview';
import { handwritingPageDataUrl, nonEmptyHandwritingPages } from './handwriting.js';
import { findWhitespacePageBreak, isInkFreeRow } from './pdfPagination.js';
import { THEMES } from './themeManager';

const parseRgbColor = (color) => {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3 || channels[3] === 0) return null;
  return { red: channels[0], green: channels[1], blue: channels[2] };
};

export async function exportNoteToPdf({
  contentToExport,
  currentTheme,
  handwriting,
  isExportingPdf,
  noteName,
  setIsExportingPdf,
  showWritingLines = false,
}) {
  const hasText = Boolean(contentToExport.trim());
  const handwritingPages = nonEmptyHandwritingPages(handwriting);
  if ((!hasText && !handwritingPages.length) || isExportingPdf) return;
  setIsExportingPdf(true);

  const filename = (noteName.trim() || 'untitled') + '.pdf';
  const isGalaxyTheme = currentTheme === THEMES.GALAXY;
  const isKomorebiTheme = currentTheme === THEMES.KOMOREBI;
  const pageBackgroundColor = isGalaxyTheme ? '#0a0e27' : isKomorebiTheme ? '#352820' : '#fdfbf7';
  const headerTextColor = isGalaxyTheme ? '#6c7b95' : isKomorebiTheme ? '#b8aa90' : '#a8a29a';
  const headerText = 'puffnotes';
  const headerFontSize = 9;
  const margin = 18;
  const headerTopMargin = 15;
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 'smart',
  });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const contentWidthMM = pdfWidth - (margin * 2);
  const contentHeightMM = pdfHeight - (margin * 2) - 10;
  const contentWidthPX = Math.floor(contentWidthMM * 3.78);
  const tempContainerId = 'pdf-render-container';
  let tempContainer = document.getElementById(tempContainerId);

  if (!tempContainer) {
    tempContainer = document.createElement('div');
    tempContainer.id = tempContainerId;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.border = '1px solid transparent';
    document.body.appendChild(tempContainer);
  } else {
    tempContainer.innerHTML = '';
  }

  tempContainer.style.width = `${contentWidthPX}px`;
  tempContainer.style.padding = '1px';
  tempContainer.style.background = pageBackgroundColor;
  tempContainer.style.fontFamily = 'monospace';
  tempContainer.style.fontSize = '14px';
  tempContainer.style.lineHeight = '1.625';
  tempContainer.style.color = isGalaxyTheme ? '#e8eaf6' : isKomorebiTheme ? '#f4ebd7' : '#1f2937';
  tempContainer.style.height = 'auto';
  tempContainer.style.display = 'inline-block';
  tempContainer.dataset.puffnotesTheme = currentTheme;

  const root = ReactDOM.createRoot(tempContainer);
  root.render(<MarkdownPreview markdownText={contentToExport} theme={currentTheme} />);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    if (hasText) {
    try {
    const selectorsAndColors = isGalaxyTheme ? [
      { selector: '.text-\\[\\#e8eaf6\\]', color: '#e8eaf6' },
      { selector: '.text-\\[\\#b8bfde\\]', color: '#b8bfde' },
      { selector: 'blockquote', color: '#b8bfde' },
      { selector: '.border-\\[\\#4a5178\\]', color: '#4a5178', styleProp: 'borderColor' },
      { selector: '.bg-\\[\\#2d3561\\]', color: '#2d3561', styleProp: 'backgroundColor' },
      { selector: '.text-\\[\\#9b59b6\\]', color: '#9b59b6' },
      { selector: '.bg-\\[\\#0d1235\\]', color: '#0d1235', styleProp: 'backgroundColor' },
    ] : isKomorebiTheme ? [
      { selector: '.text-\\[\\#f4ebd7\\]', color: '#f4ebd7' },
      { selector: 'blockquote', color: '#b8aa90' },
      { selector: 'blockquote', color: '#685541', styleProp: 'borderColor' },
      { selector: 'a', color: '#b7cd9b' },
      { selector: 'code:not(pre > code)', color: '#b7cd9b' },
      { selector: 'code:not(pre > code)', color: '#44342a', styleProp: 'backgroundColor' },
      { selector: 'code:not(pre > code)', color: '#685541', styleProp: 'borderColor' },
      { selector: 'pre', color: '#f4ebd7' },
      { selector: 'pre', color: '#281e18', styleProp: 'backgroundColor' },
      { selector: 'pre', color: '#514233', styleProp: 'borderColor' },
      { selector: 'hr', color: '#514233', styleProp: 'borderColor' },
      { selector: 'th', color: '#f4ebd7' },
      { selector: 'th', color: '#44342a', styleProp: 'backgroundColor' },
      { selector: 'th', color: '#685541', styleProp: 'borderColor' },
      { selector: 'td', color: '#dfd2b9' },
      { selector: 'td', color: '#685541', styleProp: 'borderColor' },
    ] : [
      { selector: '.text-gray-800', color: '#1f2937' },
      { selector: '.text-gray-600', color: '#4b5563' },
      { selector: 'blockquote', color: '#4b5563' },
      { selector: '.border-\\[\\#e6ddcc\\]', color: '#e6ddcc', styleProp: 'borderColor' },
      { selector: '.bg-\\[\\#fff7ee\\]', color: '#fff7ee', styleProp: 'backgroundColor' },
      { selector: '.text-\\[\\#9a8c73\\]', color: '#9a8c73' },
      { selector: '.bg-\\[\\#fdf6ec\\]', color: '#fdf6ec', styleProp: 'backgroundColor' },
    ];

    selectorsAndColors.forEach(({ selector, color, styleProp = 'color' }) => {
      try {
        const elements = tempContainer.querySelectorAll(selector);
        elements.forEach((element) => {
          const className = selector.startsWith('.') ? selector.substring(1).replace(/\\/g, '') : null;
          if ((className && element.classList.contains(className)) || !selector.startsWith('.')) {
            element.style[styleProp] = color;
          }
        });
      } catch (error) {
        console.warn(`Failed override for selector: ${selector}`, error);
      }
    });
  } catch (error) {
    console.warn('Error applying style overrides:', error);
  }

  const foregroundColors = [...new Set(
    [tempContainer, ...tempContainer.querySelectorAll('*')]
      .map((element) => getComputedStyle(element).color),
  )].map(parseRgbColor).filter(Boolean);

    const canvas = await html2canvas(tempContainer, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: pageBackgroundColor,
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      windowWidth: tempContainer.scrollWidth,
      windowHeight: tempContainer.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      removeContainer: false,
      imageTimeout: 15000,
    });
    const imgData = canvas.toDataURL('image/png');
    pdf.getImageProperties(imgData);
    const canvasWidthPX = canvas.width;
    const canvasHeightPX = canvas.height;
    const scaleFactor = contentWidthMM / canvasWidthPX;
    const pixelsPerPage = contentHeightMM / scaleFactor;
    const sourceContext = canvas.getContext('2d', { willReadFrequently: true });

    const findPageEnd = (pageStartY) => {
      const idealEndY = Math.min(canvasHeightPX, Math.floor(pageStartY + pixelsPerPage));
      if (idealEndY >= canvasHeightPX) return canvasHeightPX;

      const minimumEndY = Math.floor(pageStartY + pixelsPerPage * 0.7);
      const scanHeight = idealEndY - minimumEndY;
      const scan = sourceContext.getImageData(0, minimumEndY, canvasWidthPX, scanHeight);

      return findWhitespacePageBreak({
        idealEndY,
        minimumEndY,
        minimumBlankRows: 6,
        isBlankRow: (absoluteRow) => isInkFreeRow({
          data: scan.data,
          foregroundColors,
          row: absoluteRow - minimumEndY,
          width: canvasWidthPX,
        }),
      });
    };

    const addPageStyling = () => {
      pdf.setFillColor(pageBackgroundColor);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.setFontSize(headerFontSize);
      try {
        pdf.setFont('times', 'normal');
      } catch {
        pdf.setFont('serif', 'normal');
      }
      pdf.setTextColor(headerTextColor);
      pdf.text(headerText, margin, headerTopMargin);
    };

    addPageStyling();
    let currentY = 0;
    while (currentY < canvasHeightPX) {
      const pageEndY = findPageEnd(currentY);
      const heightToUse = pageEndY - currentY;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasWidthPX;
      tempCanvas.height = heightToUse;
      const tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(
        canvas,
        0,
        currentY,
        canvasWidthPX,
        heightToUse,
        0,
        0,
        canvasWidthPX,
        heightToUse,
      );
      const pageImgData = tempCanvas.toDataURL('image/png');
      pdf.addImage(
        pageImgData,
        'PNG',
        margin,
        margin,
        contentWidthMM,
        heightToUse * scaleFactor,
        undefined,
        'FAST',
      );
      currentY = pageEndY;
      if (currentY < canvasHeightPX) {
        pdf.addPage();
        addPageStyling();
      }
    }
    }

    handwritingPages.forEach((page, index) => {
      if (hasText || index > 0) pdf.addPage();
      pdf.addImage(
        handwritingPageDataUrl(page, {
          showLines: showWritingLines,
          theme: currentTheme,
        }),
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST',
      );
    });
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    let message = 'Failed to export PDF.';
    if (error.message && error.message.includes('color function "oklch"')) {
      message += ' A style used in the note might not be supported.';
    } else {
      message += ` ${error.message || 'Check console for details.'}`;
    }
    alert(message);
  } finally {
    root.unmount();
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
    setIsExportingPdf(false);
  }
}
