import { beforeEach, describe, expect, test } from 'vitest';
import type { FieldNote } from '../types';
import { DEFAULT_STORAGE_KEY, loadNotes, persistNotes, toMarkdown } from './fieldNotesStore';

const testKey = 'test:fieldnotes';

function makeNote(overrides: Partial<FieldNote> = {}): FieldNote {
  return {
    id: 'n1',
    createdAt: 1,
    route: '/brands/abc/profile',
    mode: 'element',
    comment: 'make swatches bigger',
    target: { label: 'button "Red"', domPath: 'section.color > button', rect: { x: 0, y: 0, w: 10, h: 10 } },
    ...overrides,
  };
}

describe('fieldNotesStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('persistNotes then loadNotes', () => {
    test('round-trips the saved notes', () => {
      persistNotes(testKey, [makeNote()]);

      const result = loadNotes(testKey);

      expect(result).toEqual([makeNote()]);
    });
  });

  describe('loadNotes', () => {
    test('returns an empty array when nothing is stored', () => {
      const result = loadNotes(testKey);

      expect(result).toEqual([]);
    });

    test('returns an empty array when stored value is malformed', () => {
      localStorage.setItem(testKey, '{ not json');

      const result = loadNotes(testKey);

      expect(result).toEqual([]);
    });
  });

  describe('toMarkdown', () => {
    test('renders a placeholder for an empty list', () => {
      const result = toMarkdown([]);

      expect(result).toContain('UI Edit Notes (0)');
    });

    test('groups notes under their route heading', () => {
      const result = toMarkdown([makeNote()]);

      expect(result).toContain('### /brands/abc/profile');
    });

    test('includes the comment text', () => {
      const result = toMarkdown([makeNote()]);

      expect(result).toContain('make swatches bigger');
    });

    test('includes the component stack when present', () => {
      const result = toMarkdown([makeNote({ target: { ...makeNote().target, componentStack: '<ColorPaletteSection>' } })]);

      expect(result).toContain('stack: <ColorPaletteSection>');
    });

    describe('region notes with element summaries', () => {
      function makeRegionNote(elementCount: number): FieldNote {
        return makeNote({
          mode: 'region',
          target: {
            ...makeNote().target,
            label: `Region (${elementCount} elements)`,
            elementCount,
            elements: [
              { label: 'button "Save"', domPath: 'form > button.save' },
              { label: 'input "Email"', domPath: 'form > input.email' },
            ],
          },
        });
      }

      test('lists a contained element with its path', () => {
        const result = toMarkdown([makeRegionNote(2)]);

        expect(result).toContain('- button "Save" — form > button.save');
      });

      test('notes how many elements were omitted beyond the summaries', () => {
        const result = toMarkdown([makeRegionNote(22)]);

        expect(result).toContain('… and 20 more elements');
      });

      test('omits the overflow line when all elements are listed', () => {
        const result = toMarkdown([makeRegionNote(2)]);

        expect(result).not.toContain('more elements');
      });
    });
  });

  test('DEFAULT_STORAGE_KEY is namespaced to the package', () => {
    expect(DEFAULT_STORAGE_KEY).toBe('react-field-notes:v1');
  });
});
