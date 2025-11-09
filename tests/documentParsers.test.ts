/**
 * Tests for Document Parsers (PDF, DOCX, TXT)
 * Handles text extraction from various document formats
 */

import { parseTXT } from '../src/lib/documentParsers/txtParser';
import { parsePDF } from '../src/lib/documentParsers/pdfParser';
import { parseDocx } from '../src/lib/documentParsers/docxParser';
import { parseDocument, getSupportedExtensions, isSupportedFileType } from '../src/lib/documentParsers/index';

// Mock pdf.js for testing
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn((src: any) => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: jest.fn((pageNum: number) => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [
            { str: `Page ${pageNum} text` },
            { str: ' content here' },
          ]
        }))
      }))
    })
  })),
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Mock mammoth for DOCX parsing
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(() => Promise.resolve({
    value: 'DOCX document content extracted successfully',
    messages: []
  }))
}));

describe('Document Parsers', () => {
  describe('TXT Parser', () => {
    it('should parse plain text file', async () => {
      const file = new File(['Hello world!\nThis is a test.'], 'test.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe('Hello world!\nThis is a test.');
    });

    it('should handle empty text file', async () => {
      const file = new File([''], 'empty.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe('');
    });

    it('should preserve newlines and formatting', async () => {
      const content = 'Line 1\n\nLine 3\n  Indented line';
      const file = new File([content], 'formatted.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe(content);
    });

    it('should handle unicode characters', async () => {
      const content = 'Hello 世界! Привет мир! 🌍';
      const file = new File([content], 'unicode.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe(content);
    });

    it('should handle large text files', async () => {
      const content = 'A'.repeat(100000); // 100k characters
      const file = new File([content], 'large.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result.length).toBe(100000);
      expect(result).toBe(content);
    });
  });

  describe('PDF Parser', () => {
    it('should parse PDF file and extract text', async () => {
      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' });

      const result = await parsePDF(file);

      // Mocked PDF returns "Page X text content here" for each page
      expect(result).toContain('Page 1 text');
      expect(result).toContain('content here');
    });

    it('should handle multi-page PDFs', async () => {
      const file = new File(['fake pdf content'], 'multipage.pdf', { type: 'application/pdf' });

      const result = await parsePDF(file);

      // Mocked PDF has 2 pages
      expect(result).toContain('Page 1');
      expect(result).toContain('Page 2');
    });

    it('should separate pages with newlines', async () => {
      const file = new File(['fake pdf content'], 'test.pdf', { type: 'application/pdf' });

      const result = await parsePDF(file);

      // Pages should be separated by newlines
      expect(result.includes('\n')).toBe(true);
    });

    it('should throw error for invalid PDF', async () => {
      // PDF parser should handle errors from pdf.js
      const pdfjs = require('pdfjs-dist');
      pdfjs.getDocument.mockImplementationOnce(() => ({
        promise: Promise.reject(new Error('Invalid PDF'))
      }));

      const file = new File(['invalid'], 'invalid.pdf', { type: 'application/pdf' });

      await expect(parsePDF(file)).rejects.toThrow('Invalid PDF');
    });
  });

  describe('DOCX Parser', () => {
    it('should parse DOCX file and extract text', async () => {
      const file = new File(['fake docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await parseDocx(file);

      // Mocked mammoth returns this text
      expect(result).toBe('DOCX document content extracted successfully');
    });

    it('should throw error for empty DOCX', async () => {
      const mammoth = require('mammoth');
      mammoth.extractRawText.mockImplementationOnce(() => Promise.resolve({
        value: '',
        messages: []
      }));

      const file = new File(['fake docx'], 'empty.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Parser throws error when DOCX has no text content
      await expect(parseDocx(file)).rejects.toThrow('No text content found in DOCX file');
    });

    it('should throw error for invalid DOCX', async () => {
      const mammoth = require('mammoth');
      mammoth.extractRawText.mockImplementationOnce(() =>
        Promise.reject(new Error('Invalid DOCX format'))
      );

      const file = new File(['invalid'], 'invalid.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await expect(parseDocx(file)).rejects.toThrow('Invalid DOCX format');
    });
  });

  describe('parseDocument (Main Parser)', () => {
    it('should route to TXT parser for text files', async () => {
      const file = new File(['text content'], 'test.txt', { type: 'text/plain' });

      const result = await parseDocument(file);

      expect(result).toBe('text content');
      expect(typeof result).toBe('string');
    });

    it('should route to PDF parser for PDF files', async () => {
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      const result = await parseDocument(file);

      expect(result).toContain('Page 1');
      expect(typeof result).toBe('string');
    });

    it('should route to DOCX parser for DOCX files', async () => {
      const file = new File(['docx content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await parseDocument(file);

      expect(result).toBe('DOCX document content extracted successfully');
      expect(typeof result).toBe('string');
    });

    it('should handle file extension fallback when MIME type missing', async () => {
      const file = new File(['content'], 'test.txt', { type: '' });

      const result = await parseDocument(file);

      // Should detect .txt extension and parse as text
      expect(result).toBe('content');
    });

    it('should throw error for unsupported file type', async () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

      await expect(parseDocument(file)).rejects.toThrow('Unsupported file type');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return supported file extensions', () => {
      const extensions = getSupportedExtensions();

      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.txt');
      expect(extensions).toContain('.docx');
      expect(typeof extensions).toBe('string');
    });

    it('should return comma-separated string', () => {
      const extensions = getSupportedExtensions();

      expect(extensions.includes(',')).toBe(true);
    });

    it('should include at least 3 extensions', () => {
      const extensions = getSupportedExtensions();
      const extensionArray = extensions.split(',');

      expect(extensionArray.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isSupportedFileType', () => {
    it('should return true for supported file types', () => {
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const docxFile = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      expect(isSupportedFileType(txtFile)).toBe(true);
      expect(isSupportedFileType(pdfFile)).toBe(true);
      expect(isSupportedFileType(docxFile)).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      const exeFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const zipFile = new File(['content'], 'test.zip', { type: 'application/zip' });

      expect(isSupportedFileType(exeFile)).toBe(false);
      expect(isSupportedFileType(zipFile)).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle File object with null content', async () => {
      const file = new File([null as any], 'test.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      // Should handle gracefully
      expect(typeof result).toBe('string');
    });

    it('should handle very small files', async () => {
      const file = new File(['a'], 'tiny.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe('a');
    });

    it('should handle files with special characters in name', async () => {
      const file = new File(['content'], 'test (copy) [2].txt', { type: 'text/plain' });

      const result = await parseDocument(file);

      // Should parse successfully despite special characters in filename
      expect(result).toBe('content');
      expect(typeof result).toBe('string');
    });

    it('should preserve exact text content without modification', async () => {
      const content = 'Exact\tcontent\nwith\ttabs\nand\nnewlines';
      const file = new File([content], 'preserve.txt', { type: 'text/plain' });

      const result = await parseTXT(file);

      expect(result).toBe(content);
    });

    it('should handle concurrent parsing of multiple files', async () => {
      const file1 = new File(['content 1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content 2'], 'test2.txt', { type: 'text/plain' });
      const file3 = new File(['content 3'], 'test3.txt', { type: 'text/plain' });

      const results = await Promise.all([
        parseDocument(file1),
        parseDocument(file2),
        parseDocument(file3),
      ]);

      expect(results[0]).toBe('content 1');
      expect(results[1]).toBe('content 2');
      expect(results[2]).toBe('content 3');
    });
  });
});
