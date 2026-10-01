// @vitest-environment node
import { build } from 'vite6';
import type { Rollup } from 'vite6';
import { describe, expect, test } from 'vitest';

/**
 *
 * Builds the package with Vite 6, the strictest common host bundler: Vite 8
 * also rewrites optional-chained reads, Vite 6 and webpack do not. Bundlers
 * only replace the exact member expression `process.env.NODE_ENV`; any other
 * spelling (optional chaining, a `typeof process` read) survives into the
 * browser, where `process` does not exist and the overlay's default flips
 * back on. Vite's define left `process?.env?.NODE_ENV` in place, so the
 * overlay shipped to production in 0.1.0 and 0.1.1.
 *
 */
describe('production bundle', () => {
  test('resolves every NODE_ENV read at build time', async () => {
    const result = (await build({
      configFile: false,
      logLevel: 'silent',
      mode: 'production',
      build: {
        write: false,
        minify: true,
        rollupOptions: {
          input: 'src/index.ts',
          external: [/^react(-dom|-grab)?(\/|$)/],
          preserveEntrySignatures: 'exports-only',
        },
      },
    })) as Rollup.RollupOutput;

    const code = result.output
      .filter((chunk): chunk is Rollup.OutputChunk => chunk.type === 'chunk')
      .map((chunk) => chunk.code)
      .join('\n');

    expect(code).not.toContain('NODE_ENV');
  });
});
