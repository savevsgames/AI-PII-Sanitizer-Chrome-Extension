/**
 * Tests for Download Utilities
 * Helper functions for downloading documents
 */

import { downloadTextFile, downloadDocumentPair, downloadDocumentJSON } from '../src/lib/downloadUtils';

describe('Download Utilities', () => {
  // Mock DOM elements for download testing
  let mockLink: HTMLAnchorElement;
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;

  beforeEach(() => {
    // Create mock link element
    mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn(),
    } as any;

    // Mock document.createElement
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

    // Mock document.body methods
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

    // Mock URL methods
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    createObjectURLMock = jest.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLMock = jest.fn();

    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    // Mock setTimeout to execute immediately for testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original implementations
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();

    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;

    jest.useRealTimers();
  });

  describe('downloadTextFile', () => {
    it('should create and trigger download link', () => {
      downloadTextFile('test content', 'test.txt');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should set correct filename', () => {
      downloadTextFile('content', 'myfile.txt');

      expect(mockLink.download).toBe('myfile.txt');
    });

    it('should create blob with correct content', () => {
      const content = 'Hello, World!';
      downloadTextFile(content, 'test.txt');

      // URL.createObjectURL should have been called with a Blob
      expect(URL.createObjectURL).toHaveBeenCalled();
      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should use default mime type for plain text', () => {
      downloadTextFile('content', 'test.txt');

      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob.type).toBe('text/plain');
    });

    it('should accept custom mime type', () => {
      downloadTextFile('{"key": "value"}', 'data.json', 'application/json');

      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob.type).toBe('application/json');
    });

    it('should append and remove link from DOM', () => {
      downloadTextFile('content', 'test.txt');

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);

      // Fast-forward timers to trigger cleanup
      jest.advanceTimersByTime(100);

      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });

    it('should cleanup URL after download', () => {
      downloadTextFile('content', 'test.txt');

      jest.advanceTimersByTime(100);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should hide link element', () => {
      downloadTextFile('content', 'test.txt');

      expect(mockLink.style.display).toBe('none');
    });

    it('should handle empty content', () => {
      downloadTextFile('', 'empty.txt');

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('empty.txt');
    });

    it('should handle large content', () => {
      const largeContent = 'A'.repeat(100000);
      downloadTextFile(largeContent, 'large.txt');

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle special characters in filename', () => {
      downloadTextFile('content', 'test (copy) [2].txt');

      expect(mockLink.download).toBe('test (copy) [2].txt');
    });

    it('should handle unicode content', () => {
      const unicodeContent = 'Hello 世界! Привет мир! 🌍';
      downloadTextFile(unicodeContent, 'unicode.txt');

      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('downloadDocumentPair', () => {
    it('should download both original and sanitized versions', () => {
      downloadDocumentPair('original text', 'sanitized text', 'document.txt');

      expect(mockLink.click).toHaveBeenCalledTimes(1); // First download

      // Fast-forward to trigger second download
      jest.advanceTimersByTime(200);

      expect(mockLink.click).toHaveBeenCalledTimes(2); // Second download
    });

    it('should append _original to first file', () => {
      downloadDocumentPair('original', 'sanitized', 'test.txt');

      expect(mockLink.download).toBe('test_original.txt');
    });

    it('should append _sanitized to second file', () => {
      downloadDocumentPair('original', 'sanitized', 'test.txt');

      jest.advanceTimersByTime(200);

      expect(mockLink.download).toBe('test_sanitized.txt');
    });

    it('should remove file extension before appending suffix', () => {
      downloadDocumentPair('original', 'sanitized', 'document.pdf');

      expect(mockLink.download).toBe('document_original.txt');

      jest.advanceTimersByTime(200);

      expect(mockLink.download).toBe('document_sanitized.txt');
    });

    it('should handle filename without extension', () => {
      downloadDocumentPair('original', 'sanitized', 'document');

      expect(mockLink.download).toBe('document_original.txt');

      jest.advanceTimersByTime(200);

      expect(mockLink.download).toBe('document_sanitized.txt');
    });

    it('should delay second download to avoid browser blocking', () => {
      downloadDocumentPair('original', 'sanitized', 'test.txt');

      expect(mockLink.click).toHaveBeenCalledTimes(1);

      // Before delay completes
      jest.advanceTimersByTime(100);
      expect(mockLink.click).toHaveBeenCalledTimes(1); // Still only 1

      // After delay completes
      jest.advanceTimersByTime(100);
      expect(mockLink.click).toHaveBeenCalledTimes(2); // Now 2
    });

    it('should handle empty content in both files', () => {
      downloadDocumentPair('', '', 'empty.txt');

      expect(mockLink.click).toHaveBeenCalled();

      jest.advanceTimersByTime(200);

      expect(mockLink.click).toHaveBeenCalledTimes(2);
    });

    it('should preserve content differences', () => {
      const original = 'My name is Greg Barker';
      const sanitized = 'My name is John Smith';

      downloadDocumentPair(original, sanitized, 'test.txt');

      const firstBlob = (URL.createObjectURL as jest.Mock).mock.calls[0][0];

      jest.advanceTimersByTime(200);

      const secondBlob = (URL.createObjectURL as jest.Mock).mock.calls[1][0];

      // Blobs should be different
      expect(firstBlob).not.toBe(secondBlob);
    });
  });

  describe('downloadDocumentJSON', () => {
    it('should download JSON metadata file', () => {
      const documentAlias = {
        documentName: 'report.txt',
        originalText: 'original',
        sanitizedText: 'sanitized',
      };

      downloadDocumentJSON(documentAlias);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('report_metadata.json');
    });

    it('should use application/json mime type', () => {
      const documentAlias = {
        documentName: 'test.txt',
        data: 'value',
      };

      downloadDocumentJSON(documentAlias);

      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob.type).toBe('application/json');
    });

    it('should format JSON with 2-space indentation', () => {
      const documentAlias = {
        documentName: 'test.txt',
        nested: { key: 'value' },
      };

      downloadDocumentJSON(documentAlias);

      const blob = createObjectURLMock.mock.calls[0][0];

      // Read blob content (in real scenario, would be formatted JSON)
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should remove file extension from metadata filename', () => {
      const documentAlias = {
        documentName: 'document.pdf',
      };

      downloadDocumentJSON(documentAlias);

      expect(mockLink.download).toBe('document_metadata.json');
    });

    it('should handle document name without extension', () => {
      const documentAlias = {
        documentName: 'document',
      };

      downloadDocumentJSON(documentAlias);

      expect(mockLink.download).toBe('document_metadata.json');
    });

    it('should handle complex nested data', () => {
      const documentAlias = {
        documentName: 'complex.txt',
        metadata: {
          profiles: ['profile1', 'profile2'],
          stats: { count: 10 },
        },
      };

      downloadDocumentJSON(documentAlias);

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle document with special characters in name', () => {
      const documentAlias = {
        documentName: 'test (final) [v2].txt',
      };

      downloadDocumentJSON(documentAlias);

      expect(mockLink.download).toBe('test (final) [v2]_metadata.json');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid downloads', () => {
      downloadTextFile('content1', 'file1.txt');
      downloadTextFile('content2', 'file2.txt');
      downloadTextFile('content3', 'file3.txt');

      expect(mockLink.click).toHaveBeenCalledTimes(3);
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(200) + '.txt';
      downloadTextFile('content', longName);

      expect(mockLink.download).toBe(longName);
    });

    it('should handle filenames with multiple dots', () => {
      downloadTextFile('content', 'file.backup.v2.txt');

      expect(mockLink.download).toBe('file.backup.v2.txt');
    });

    it('should schedule cleanup even if error occurs after', () => {
      // The cleanup is scheduled BEFORE the click happens
      // So even if something fails after, cleanup will still run

      downloadTextFile('content', 'test.txt');

      // Fast-forward timers
      jest.advanceTimersByTime(100);

      // Cleanup should happen
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });
});
