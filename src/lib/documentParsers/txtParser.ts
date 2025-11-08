/**
 * TXT Parser - Extract text from plain text files
 */

/**
 * Parse TXT file and extract text content
 * @param file - Text file to parse
 * @returns Promise<string> - File content
 */
export async function parseTXT(file: File): Promise<string> {
  console.log(`[TXT Parser] Starting parse: ${file.name} (${file.size} bytes)`);

  try {
    // Read file as text
    const text = await file.text();

    console.log(`[TXT Parser] ✅ Parse complete: ${text.length} chars`);

    return text;

  } catch (error) {
    console.error('[TXT Parser] ❌ Parse failed:', error);
    throw new Error(`Failed to parse TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is a text file
 * @param file - File to check
 * @returns boolean
 */
export function isTXT(file: File): boolean {
  return file.type === 'text/plain' ||
         file.name.toLowerCase().endsWith('.txt') ||
         file.name.toLowerCase().endsWith('.text');
}
