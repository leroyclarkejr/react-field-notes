import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  __resetSourceLocationForTests,
  filePathFromUrl,
  hasReactDebugInfo,
  parseStackFrames,
  pickSourceFrame,
  resolveElementSource,
} from './sourceLocation';

const testOrigin = 'http://localhost:5173';

// Assembled at runtime so the test runner does not mistake this file's own
// fixtures for a source map reference and try to load it.
const SOURCE_MAP_PRAGMA = ['source', 'MappingURL'].join('');

const chromeStack = [
  'Error: react-stack-top-frame',
  '    at exports.jsxDEV (http://localhost:5173/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=8d983ae6:246:31)',
  '    at SaveButton (http://localhost:5173/src/components/SaveButton.tsx?t=1791663036912:18:26)',
  '    at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=8d983ae6:20259:20)',
].join('\n');

const safariStack = [
  'jsxDEV@http://localhost:5173/node_modules/.vite/deps/react_jsx-dev-runtime.js:246:31',
  'SaveButton@http://localhost:5173/src/components/SaveButton.tsx:18:26',
].join('\n');

const libraryOnlyStack = [
  'Error: react-stack-top-frame',
  '    at exports.jsxDEV (http://localhost:5173/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=8d983ae6:246:31)',
  '    at Button (http://localhost:5173/node_modules/.vite/deps/chunk-ABC123.js?v=8d983ae6:900:12)',
].join('\n');

function attachFiber(el: Element, fiber: object): void {
  Object.defineProperty(el, '__reactFiber$test', { value: fiber, configurable: true, enumerable: true });
}

describe('parseStackFrames', () => {
  test('reads the function name from a Chrome frame', () => {
    const result = parseStackFrames(chromeStack);

    expect(result[1]?.functionName).toBe('SaveButton');
  });

  test('reads the line from a Chrome frame', () => {
    const result = parseStackFrames(chromeStack);

    expect(result[1]?.line).toBe(18);
  });

  test('reads the url from a Safari or Firefox frame', () => {
    const result = parseStackFrames(safariStack);

    expect(result[1]?.url).toBe('http://localhost:5173/src/components/SaveButton.tsx');
  });

  test('skips lines that are not frames', () => {
    const result = parseStackFrames(chromeStack);

    expect(result).toHaveLength(3);
  });
});

describe('pickSourceFrame', () => {
  test('picks the first frame from the app own source', () => {
    const result = pickSourceFrame(parseStackFrames(chromeStack), testOrigin);

    expect(result?.functionName).toBe('SaveButton');
  });

  test('returns undefined when every frame is library code', () => {
    const result = pickSourceFrame(parseStackFrames(libraryOnlyStack), testOrigin);

    expect(result).toBeUndefined();
  });

  test('ignores frames served from another origin', () => {
    const result = pickSourceFrame(parseStackFrames(chromeStack), 'http://localhost:9999');

    expect(result).toBeUndefined();
  });
});

describe('filePathFromUrl', () => {
  test('returns a project-relative path without the query string', () => {
    const result = filePathFromUrl('http://localhost:5173/src/components/SaveButton.tsx?t=1791663036912');

    expect(result).toBe('src/components/SaveButton.tsx');
  });

  test('returns an absolute path for a file served from outside the project root', () => {
    const result = filePathFromUrl('http://localhost:5173/@fs/Users/lee/shared/Button.tsx');

    expect(result).toBe('/Users/lee/shared/Button.tsx');
  });

  test('decodes escaped characters in the path', () => {
    const result = filePathFromUrl('http://localhost:5173/src/my%20page/Home.tsx');

    expect(result).toBe('src/my page/Home.tsx');
  });
});

describe('hasReactDebugInfo', () => {
  test('is true for an element whose fiber carries a debug stack', () => {
    const el = document.createElement('div');
    attachFiber(el, { _debugStack: new Error('react-stack-top-frame') });

    const result = hasReactDebugInfo(el);

    expect(result).toBe(true);
  });

  test('is false for an element rendered by a production React build', () => {
    const el = document.createElement('div');
    attachFiber(el, {});

    const result = hasReactDebugInfo(el);

    expect(result).toBe(false);
  });

  test('is false for an element React did not render', () => {
    const result = hasReactDebugInfo(document.createElement('div'));

    expect(result).toBe(false);
  });
});

describe('resolveElementSource', () => {
  // Generated line 18 maps to original line 3.
  const testMappings = `${';'.repeat(17)}AAEA`;
  const testModule = `export {};\n//# ${SOURCE_MAP_PRAGMA}=data:application/json;base64,${btoa(
    JSON.stringify({ version: 3, mappings: testMappings }),
  )}`;
  const fetchMock = vi.fn<(input: string) => Promise<Response>>();

  function debugStack(stack: string): Error {
    const error = new Error('react-stack-top-frame');
    error.stack = stack;
    return error;
  }

  beforeEach(() => {
    __resetSourceLocationForTests();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(testModule));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { origin: testOrigin });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when the element was written in the app own source', () => {
    test('returns the project-relative file path', async () => {
      const el = document.createElement('button');
      attachFiber(el, { _debugStack: debugStack(chromeStack) });

      const result = await resolveElementSource(el);

      expect(result?.filePath).toBe('src/components/SaveButton.tsx');
    });

    test('maps the compiled line back to the original line', async () => {
      const el = document.createElement('button');
      attachFiber(el, { _debugStack: debugStack(chromeStack) });

      const result = await resolveElementSource(el);

      expect(result?.lineNumber).toBe(3);
    });

    test('names the component that rendered it', async () => {
      const el = document.createElement('button');
      attachFiber(el, { _debugStack: debugStack(chromeStack) });

      const result = await resolveElementSource(el);

      expect(result?.componentName).toBe('SaveButton');
    });
  });

  describe('when the element was rendered inside a library component', () => {
    test('walks up to the owner written in the app own source', async () => {
      const el = document.createElement('button');
      attachFiber(el, {
        _debugStack: debugStack(libraryOnlyStack),
        _debugOwner: { _debugStack: debugStack(chromeStack) },
      });

      const result = await resolveElementSource(el);

      expect(result?.filePath).toBe('src/components/SaveButton.tsx');
    });
  });

  describe('when the module source map cannot be fetched', () => {
    test('still returns the file path without a line', async () => {
      fetchMock.mockRejectedValue(new Error('offline'));
      const el = document.createElement('button');
      attachFiber(el, { _debugStack: debugStack(chromeStack) });

      const result = await resolveElementSource(el);

      expect(result).toEqual({ filePath: 'src/components/SaveButton.tsx', componentName: 'SaveButton' });
    });
  });

  describe('when React recorded the source directly (React 18)', () => {
    test('returns the recorded file and line', async () => {
      const el = document.createElement('button');
      attachFiber(el, { _debugSource: { fileName: '/Users/lee/app/src/SaveButton.tsx', lineNumber: 12 } });

      const result = await resolveElementSource(el);

      expect(result).toEqual({ filePath: '/Users/lee/app/src/SaveButton.tsx', lineNumber: 12 });
    });
  });

  describe('when no frame in the owner chain is app source', () => {
    test('returns undefined', async () => {
      const el = document.createElement('button');
      attachFiber(el, { _debugStack: debugStack(libraryOnlyStack) });

      const result = await resolveElementSource(el);

      expect(result).toBeUndefined();
    });
  });

  describe('when React did not render the element', () => {
    test('returns undefined', async () => {
      const result = await resolveElementSource(document.createElement('button'));

      expect(result).toBeUndefined();
    });
  });
});
