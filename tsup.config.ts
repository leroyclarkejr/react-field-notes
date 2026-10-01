import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'react-grab'],
  // Every export is a client component or hook. The directive lets Next.js App
  // Router (and any RSC host) import the package straight from a server
  // layout instead of requiring a 'use client' wrapper file. Added as a banner
  // because bundling strips module-level directives from the source.
  banner: { js: "'use client';" },
});
