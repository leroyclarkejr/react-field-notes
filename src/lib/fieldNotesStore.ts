import type { FieldNote } from '../types';

export const DEFAULT_STORAGE_KEY = 'react-field-notes:v1';

export function loadNotes(storageKey: string): FieldNote[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FieldNote[]) : [];
  } catch {
    return [];
  }
}

export function persistNotes(storageKey: string, notes: FieldNote[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  } catch {
    // Storage unavailable or over quota — notes stay in memory for this session.
  }
}

/**
 *
 * Serializes notes into Claude-Code-ready markdown, grouped by route.
 *
 */
export function toMarkdown(notes: FieldNote[]): string {
  const lines: string[] = [`## UI Edit Notes (${notes.length})`, ''];
  if (notes.length === 0) {
    lines.push('_No notes captured._');
    return lines.join('\n');
  }

  const byRoute = new Map<string, FieldNote[]>();
  for (const note of notes) {
    const existing = byRoute.get(note.route) ?? [];
    existing.push(note);
    byRoute.set(note.route, existing);
  }

  for (const [route, routeNotes] of byRoute) {
    lines.push(`### ${route}`, '');
    routeNotes.forEach((note, index) => {
      lines.push(`${index + 1}. ${note.target.label} — ${note.comment}`);
      lines.push(`   - path: ${note.target.domPath}`);
      if (note.target.componentStack) {
        lines.push(`   - stack: ${note.target.componentStack}`);
      }
      for (const el of note.target.elements ?? []) {
        lines.push(`   - ${el.label} — ${el.domPath}`);
      }
      const listed = note.target.elements?.length ?? 0;
      const omitted = (note.target.elementCount ?? 0) - listed;
      if (listed > 0 && omitted > 0) {
        lines.push(`   - … and ${omitted} more elements`);
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}
