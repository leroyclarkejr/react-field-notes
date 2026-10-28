/**
 *
 * The small slice of the source map v3 format needed to turn a compiled
 * position into an original line.
 *
 * React's debug stack reports where a JSX element was created in the code the
 * browser actually ran, which a dev server has already transformed: line 18
 * of the served module, not line 3 of the file on disk. Opening an editor at
 * the compiled line lands in the wrong place, so the line is mapped back here.
 * Written out rather than pulled in as a dependency because the package ships
 * with none.
 *
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const VLQ_CONTINUATION_BIT = 32;
const VLQ_VALUE_MASK = 31;
const VLQ_SHIFT = 5;

const INLINE_SOURCE_MAP = /\/\/[#@] sourceMappingURL=data:application\/json[^,]*;base64,([A-Za-z0-9+/=]+)\s*$/;

/** Decodes one comma-separated segment of a `mappings` string into its fields. */
export function decodeVlq(segment: string): number[] {
  const fields: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64_CHARS.indexOf(char);
    if (digit === -1) return fields;
    value += (digit & VLQ_VALUE_MASK) << shift;
    if (digit & VLQ_CONTINUATION_BIT) {
      shift += VLQ_SHIFT;
      continue;
    }
    fields.push(value & 1 ? -(value >> 1) : value >> 1);
    value = 0;
    shift = 0;
  }
  return fields;
}

/**
 *
 * Finds the original line for a generated position, both 1-based the way
 * stack traces report them. Picks the closest mapping at or before the
 * column, which is how devtools resolve a frame.
 *
 * The original line is a running total across the whole map, so every earlier
 * generated line has to be walked even though only one is wanted.
 *
 */
export function originalLineFor(mappings: string, generatedLine: number, generatedColumn: number): number | undefined {
  const lines = mappings.split(';');
  if (generatedLine < 1 || generatedLine > lines.length) return undefined;

  let originalLine = 0;
  let match: number | undefined;

  for (let lineIndex = 0; lineIndex < generatedLine; lineIndex += 1) {
    const isTargetLine = lineIndex === generatedLine - 1;
    let column = 0;
    for (const segment of (lines[lineIndex] ?? '').split(',')) {
      if (!segment) continue;
      const [columnDelta, , originalLineDelta] = decodeVlq(segment);
      column += columnDelta ?? 0;
      if (originalLineDelta === undefined) continue;
      originalLine += originalLineDelta;
      if (!isTargetLine) continue;
      if (match === undefined || column <= generatedColumn - 1) match = originalLine + 1;
    }
  }

  return match;
}

/** Reads the `mappings` string out of a module's inline base64 source map. */
export function readInlineSourceMap(code: string): string | undefined {
  const encoded = INLINE_SOURCE_MAP.exec(code)?.[1];
  if (!encoded) return undefined;
  try {
    const parsed: unknown = JSON.parse(atob(encoded));
    if (typeof parsed !== 'object' || parsed === null || !('mappings' in parsed)) return undefined;
    return typeof parsed.mappings === 'string' ? parsed.mappings : undefined;
  } catch {
    return undefined;
  }
}
