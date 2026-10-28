import { describe, expect, test } from 'vitest';
import { decodeVlq, originalLineFor, readInlineSourceMap } from './sourceMap';

// Assembled at runtime so the test runner does not mistake this file's own
// fixtures for a source map reference and try to load it.
const SOURCE_MAP_PRAGMA = ['source', 'MappingURL'].join('');

describe('decodeVlq', () => {
  test('decodes a segment of single-digit fields', () => {
    const result = decodeVlq('AACA');

    expect(result).toEqual([0, 0, 1, 0]);
  });

  test('decodes a negative field', () => {
    const result = decodeVlq('D');

    expect(result).toEqual([-1]);
  });

  test('decodes a field that spans two characters', () => {
    const result = decodeVlq('gB');

    expect(result).toEqual([16]);
  });
});

describe('originalLineFor', () => {
  // Generated line 1 has no mappings. Line 2 maps column 0 to original line 3,
  // and column 4 to original line 5. Line 3 maps column 2 to original line 6.
  const testMappings = ';AAEA,IAEA;EACA';

  test('maps a generated position to its original line', () => {
    const result = originalLineFor(testMappings, 2, 1);

    expect(result).toBe(3);
  });

  test('uses the closest mapping at or before the column', () => {
    const result = originalLineFor(testMappings, 2, 9);

    expect(result).toBe(5);
  });

  test('carries the original line across generated lines', () => {
    const result = originalLineFor(testMappings, 3, 3);

    expect(result).toBe(6);
  });

  test('returns undefined for a generated line with no mappings', () => {
    const result = originalLineFor(testMappings, 1, 1);

    expect(result).toBeUndefined();
  });

  test('returns undefined for a line past the end of the map', () => {
    const result = originalLineFor(testMappings, 40, 1);

    expect(result).toBeUndefined();
  });
});

describe('readInlineSourceMap', () => {
  const testMap = { version: 3, mappings: ';AAEA' };
  const testCode = `export const a = 1;\n//# ${SOURCE_MAP_PRAGMA}=data:application/json;base64,${btoa(JSON.stringify(testMap))}`;

  test('reads the mappings from an inline base64 source map', () => {
    const result = readInlineSourceMap(testCode);

    expect(result).toBe(';AAEA');
  });

  test('returns undefined when the code carries no inline source map', () => {
    const result = readInlineSourceMap('export const a = 1;');

    expect(result).toBeUndefined();
  });

  test('returns undefined when the inline source map is not valid JSON', () => {
    const result = readInlineSourceMap(`//# ${SOURCE_MAP_PRAGMA}=data:application/json;base64,${btoa('nope')}`);

    expect(result).toBeUndefined();
  });
});
