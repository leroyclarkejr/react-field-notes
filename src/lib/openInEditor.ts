import type { FieldNoteSource } from '../types';
import { formatSource } from './elementContext';

const OPEN_IN_EDITOR_ENDPOINT = '/__open-in-editor';

/**
 *
 * Asks the dev server to open a source file in the developer's editor, using
 * the endpoint Vite ships (`launch-editor-middleware`). The server resolves
 * the path against the project root and launches whichever editor it detects
 * or `LAUNCH_EDITOR` names, so nothing here needs to know the editor or the
 * absolute path.
 *
 * The line travels inside the `file` value as `path:line`, the only form that
 * endpoint reads; a separate `line` parameter is ignored and opens line 1.
 *
 * Resolves false rather than throwing when there is no such endpoint (a
 * non-Vite server, a production deploy) so the caller can say so.
 *
 */
export async function openInEditor(source: FieldNoteSource): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const response = await fetch(`${OPEN_IN_EDITOR_ENDPOINT}?file=${encodeURIComponent(formatSource(source))}`);
    return response.ok;
  } catch {
    return false;
  }
}
