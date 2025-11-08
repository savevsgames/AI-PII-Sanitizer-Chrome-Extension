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

      // Extract text items and join
      const pageText = textContent.items
        .map((item: any) => {
          // pdf.js returns items with 'str' property
          return item.str || '';
        })
        .filter(str => str.trim().length > 0)  // Remove empty strings
        .join(' ');

      textPages.push(pageText);

      console.log(`[PDF Parser] Page ${pageNum}/${pdf.numPages}: ${pageText.length} chars`);
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
