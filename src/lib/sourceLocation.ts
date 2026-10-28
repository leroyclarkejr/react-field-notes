import type { FieldNoteSource } from '../types';
import { originalLineFor, readInlineSourceMap } from './sourceMap';

const FIBER_KEY_PREFIX = '__reactFiber$';
const MAX_OWNER_DEPTH = 30;

const CHROME_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/;
const GECKO_FRAME = /^(.*?)@(.+?):(\d+):(\d+)$/;
const WINDOWS_DRIVE = /^[A-Za-z]:\//;

export interface StackFrame {
  functionName?: string;
  url: string;
  line: number;
  column: number;
}

/**
 *
 * The debug fields React attaches to a fiber in development builds. They are
 * React internals with no public API, so every read is narrowed from
 * `unknown`: a React version that renames or drops them makes source lookup
 * quietly return nothing instead of throwing inside a click handler.
 *
 */
interface DebugFiber {
  _debugStack?: unknown;
  _debugOwner?: unknown;
  _debugSource?: unknown;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function getFiber(el: Element): DebugFiber | undefined {
  const key = Object.keys(el).find((name) => name.startsWith(FIBER_KEY_PREFIX));
  if (!key) return undefined;
  const fiber: unknown = Reflect.get(el, key);
  return isObject(fiber) ? fiber : undefined;
}

function stackOf(fiber: DebugFiber): string | undefined {
  const debugStack = fiber._debugStack;
  if (!isObject(debugStack) || !('stack' in debugStack)) return undefined;
  return typeof debugStack.stack === 'string' ? debugStack.stack : undefined;
}

function recordedSourceOf(fiber: DebugFiber): FieldNoteSource | undefined {
  const source = fiber._debugSource;
  if (!isObject(source) || !('fileName' in source) || typeof source.fileName !== 'string') return undefined;
  if (source.fileName.includes('/node_modules/')) return undefined;
  const lineNumber = 'lineNumber' in source && typeof source.lineNumber === 'number' ? source.lineNumber : undefined;
  return { filePath: source.fileName, ...(lineNumber !== undefined && { lineNumber }) };
}

/**
 *
 * True when the element was rendered by a development build of React, the
 * only kind that records where JSX was written. Lets the overlay hide "open
 * in editor" outright in a production build instead of offering a control
 * that can never resolve anything.
 *
 */
export function hasReactDebugInfo(el: Element | null): boolean {
  if (!el) return false;
  const fiber = getFiber(el);
  if (!fiber) return false;
  return stackOf(fiber) !== undefined || recordedSourceOf(fiber) !== undefined || isObject(fiber._debugOwner);
}

/** Parses an Error stack in either the Chrome or the Safari/Firefox format. */
export function parseStackFrames(stack: string): StackFrame[] {
  const frames: StackFrame[] = [];
  for (const line of stack.split('\n')) {
    const match = CHROME_FRAME.exec(line) ?? GECKO_FRAME.exec(line);
    if (!match) continue;
    const [, functionName, url, lineText, columnText] = match;
    if (!url) continue;
    frames.push({
      ...(functionName && { functionName }),
      url,
      line: Number(lineText),
      column: Number(columnText),
    });
  }
  return frames;
}

function isAppSourceUrl(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== origin) return false;
    if (parsed.pathname.includes('/node_modules/')) return false;
    // Dev-server internals (`/@vite/client`, `/@react-refresh`) are not app
    // code. `/@fs/` is the exception: a real file outside the project root.
    return !parsed.pathname.startsWith('/@') || parsed.pathname.startsWith('/@fs/');
  } catch {
    return false;
  }
}

/**
 *
 * Picks the frame where the JSX was written: the first one served from the
 * app's own source. Frames above it are the JSX runtime, and a stack that is
 * library code throughout (a design-system button's inner markup) has none.
 *
 */
export function pickSourceFrame(frames: StackFrame[], origin: string): StackFrame | undefined {
  return frames.find((frame) => isAppSourceUrl(frame.url, origin));
}

/**
 *
 * Turns a dev-server module URL into the path the server's open-in-editor
 * endpoint expects: relative to the project root, or absolute for a file the
 * server exposes from outside it under `/@fs/`.
 *
 */
export function filePathFromUrl(url: string): string {
  const pathname = decodeURIComponent(new URL(url).pathname);
  if (pathname.startsWith('/@fs/')) {
    const outside = pathname.slice('/@fs/'.length);
    return WINDOWS_DRIVE.test(outside) ? outside : `/${outside}`;
  }
  return pathname.replace(/^\/+/, '');
}

const mappingsByUrl = new Map<string, Promise<string | undefined>>();

/** Test-only. Clears the per-module source map cache between cases. */
export function __resetSourceLocationForTests(): void {
  mappingsByUrl.clear();
}

function loadMappings(url: string): Promise<string | undefined> {
  const cached = mappingsByUrl.get(url);
  if (cached) return cached;
  const pending = fetch(url)
    .then((response) => (response.ok ? response.text() : undefined))
    .then((code) => (code === undefined ? undefined : readInlineSourceMap(code)))
    .catch(() => undefined);
  mappingsByUrl.set(url, pending);
  return pending;
}

async function sourceFromFrame(frame: StackFrame): Promise<FieldNoteSource> {
  const mappings = await loadMappings(frame.url);
  const lineNumber = mappings === undefined ? undefined : originalLineFor(mappings, frame.line, frame.column);
  return {
    filePath: filePathFromUrl(frame.url),
    ...(lineNumber !== undefined && { lineNumber }),
    ...(frame.functionName && { componentName: frame.functionName }),
  };
}

/**
 *
 * Finds the file and line where an element's JSX was written, the way
 * LocatorJS does, from the debug info a development build of React keeps on
 * each fiber.
 *
 * Starts at the element's own fiber and walks up its owners, so an element
 * rendered deep inside a library component resolves to the app code that
 * used that component rather than to a file in node_modules.
 *
 * Resolves undefined in a production build, for an element React did not
 * render, or when no owner was written in app source.
 *
 */
export async function resolveElementSource(el: Element): Promise<FieldNoteSource | undefined> {
  if (typeof window === 'undefined') return undefined;
  let fiber: DebugFiber | undefined = getFiber(el);

  for (let depth = 0; fiber && depth < MAX_OWNER_DEPTH; depth += 1) {
    const recorded = recordedSourceOf(fiber);
    if (recorded) return recorded;

    const stack = stackOf(fiber);
    const frame = stack === undefined ? undefined : pickSourceFrame(parseStackFrames(stack), window.location.origin);
    if (frame) return sourceFromFrame(frame);

    const owner: unknown = fiber._debugOwner;
    fiber = isObject(owner) ? owner : undefined;
  }

  return undefined;
}
