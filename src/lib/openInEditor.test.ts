import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { openInEditor } from './openInEditor';

describe('openInEditor', () => {
  const fetchMock = vi.fn<(input: string) => Promise<Response>>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the dev server accepts the request', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    });

    test('asks the dev server to open the file at its line', async () => {
      await openInEditor({ filePath: 'src/SaveButton.tsx', lineNumber: 12 });

      expect(fetchMock).toHaveBeenCalledWith('/__open-in-editor?file=src%2FSaveButton.tsx%3A12');
    });

    test('asks for the file alone when the line is unknown', async () => {
      await openInEditor({ filePath: 'src/SaveButton.tsx' });

      expect(fetchMock).toHaveBeenCalledWith('/__open-in-editor?file=src%2FSaveButton.tsx');
    });

    test('resolves true', async () => {
      const result = await openInEditor({ filePath: 'src/SaveButton.tsx', lineNumber: 12 });

      expect(result).toBe(true);
    });
  });

  describe('when the dev server has no open-in-editor endpoint', () => {
    test('resolves false', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

      const result = await openInEditor({ filePath: 'src/SaveButton.tsx', lineNumber: 12 });

      expect(result).toBe(false);
    });
  });

  describe('when the request fails', () => {
    test('resolves false instead of throwing', async () => {
      fetchMock.mockRejectedValue(new Error('offline'));

      const result = await openInEditor({ filePath: 'src/SaveButton.tsx', lineNumber: 12 });

      expect(result).toBe(false);
    });
  });
});
