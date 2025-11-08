/**
 * DOCX Parser using mammoth
 * Parses .docx files and extracts text content
 */

import mammoth from 'mammoth';

export async function parseDocx(file: File): Promise<string> {
  try {
    console.log('[DOCX Parser] Parsing file:', file.name);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });

    console.log('[DOCX Parser] Extracted', result.value.length, 'characters');

    if (result.messages && result.messages.length > 0) {
      console.warn('[DOCX Parser] Warnings:', result.messages);
    }

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in DOCX file');
    }

    return result.value;
  } catch (error) {
    console.error('[DOCX Parser] Error:', error);
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
