/**
 * PDF Parser - Extract text from PDF files using pdf.js
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// Note: Worker file is copied to dist folder during webpack build
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');

/**
 * Parse PDF file and extract text content
 * @param file - PDF file to parse
 * @returns Promise<string> - Extracted text content
 */
export async function parsePDF(file: File): Promise<string> {
  console.log(`[PDF Parser] Starting parse: ${file.name} (${file.size} bytes)`);

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(`[PDF Parser] Loaded PDF: ${pdf.numPages} pages`);

    // Extract text from all pages
    const textPages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Extract text items and reconstruct paragraph structure
      // PDF.js provides transform data that includes Y position
      let lastY = -1;
      let currentParagraph = '';
      const paragraphs: string[] = [];

      textContent.items.forEach((item: any) => {
        const str = item.str || '';
        if (str.trim().length === 0) return;

        // Get Y position from transform matrix
        const currentY = item.transform ? item.transform[5] : 0;

        // Detect paragraph break: significant Y position change (more than 10 units)
        // or if this is the first item
        if (lastY !== -1 && Math.abs(currentY - lastY) > 10) {
          // Y position changed significantly - likely a new paragraph
          if (currentParagraph.trim()) {
            paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
        }

        // Add space before text if not at start of paragraph
        if (currentParagraph.length > 0 && !currentParagraph.endsWith(' ')) {
          currentParagraph += ' ';
        }

        currentParagraph += str;
        lastY = currentY;
      });

      // Add final paragraph
      if (currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
      }

      // Join paragraphs with double newline
      const pageText = paragraphs.join('\n\n');
      textPages.push(pageText);

      console.log(`[PDF Parser] Page ${pageNum}/${pdf.numPages}: ${paragraphs.length} paragraphs, ${pageText.length} chars`);
    }

    // Join all pages with double newline
    const fullText = textPages.join('\n\n');

    console.log(`[PDF Parser] ✅ Parse complete: ${fullText.length} total chars`);

    return fullText;

  } catch (error) {
    console.error('[PDF Parser] ❌ Parse failed:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is a valid PDF
 * @param file - File to check
 * @returns boolean
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
