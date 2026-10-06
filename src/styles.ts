const STYLE_ID = 'rfn-styles';

const Z_CAPTURE = 2147483640;
const Z_LAUNCHER = 2147483645;
const Z_LIST = 2147483646;
const Z_CHROME = 2147483647;

export const CSS = `
/*
 * Declared on :root rather than on .rfn-root so the \`accent\` prop can override
 * --rfn-accent with an inline custom property on documentElement. Declaring
 * them on .rfn-root would shadow that inline value and silently ignore it.
 * Every name is --rfn- prefixed, so this cannot collide with a host's tokens.
 */
:root {
  --rfn-accent: #e5484d;
  --rfn-bg: #16161a;
  --rfn-surface: #212127;
  --rfn-surface-hover: #2a2a31;
  --rfn-fg: #ededf0;
  --rfn-fg-muted: #9c9ca6;
  --rfn-border: #33333b;
  --rfn-radius: 8px;
  --rfn-shadow: 0 10px 30px rgb(0 0 0 / 0.4);
}
.rfn-root {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--rfn-fg);
  letter-spacing: normal;
  text-transform: none;
}
.rfn-root, .rfn-root *, .rfn-root *::before, .rfn-root *::after {
  box-sizing: border-box;
}
.rfn-root button, .rfn-root textarea {
  font: inherit;
  color: inherit;
  margin: 0;
}
/*
 * iOS Safari zooms the page when a focused control renders below 16px and does
 * not zoom back out, so the composer's autofocused textarea zoomed the whole
 * host app at the inherited 14px. Hosts cannot fix this from outside: their own
 * 16px floor (usually a bare \`textarea\` selector) loses to .rfn-root textarea.
 */
.rfn-root textarea {
  font-size: 16px;
}
.rfn-root button {
  cursor: pointer;
  border: 1px solid var(--rfn-border);
  background: var(--rfn-surface);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  white-space: nowrap;
}
.rfn-root button:hover:not(:disabled) { background: var(--rfn-surface-hover); }
.rfn-root button:focus-visible { outline: 2px solid var(--rfn-accent); outline-offset: 2px; }
.rfn-root button:disabled { opacity: 0.45; cursor: not-allowed; }
.rfn-root button[data-active="true"] {
  background: var(--rfn-accent);
  border-color: var(--rfn-accent);
  color: #fff;
}

/* Capture layer */
.rfn-capture {
  position: fixed;
  inset: 0;
  z-index: ${Z_CAPTURE};
  cursor: crosshair;
  touch-action: none;
}
/*
 * Modal dialogs (Zag/Chakra v3, Ark, Radix) set pointer-events:none on <body>
 * while open and re-enable it only on the dialog content. pointer-events
 * inherits, so without these overrides every overlay surface goes dead the
 * moment a dialog is open. Each fixed root re-enables itself explicitly.
 */
.rfn-capture, .rfn-toolbar, .rfn-composer, .rfn-list, .rfn-launcher {
  pointer-events: auto;
}
.rfn-highlight {
  position: fixed;
  border: 2px solid var(--rfn-accent);
  background: color-mix(in srgb, var(--rfn-accent) 12%, transparent);
  pointer-events: none;
}

/* Toolbar */
.rfn-toolbar {
  position: fixed;
  top: calc(0.75rem + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: ${Z_CHROME};
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  background: var(--rfn-bg);
  border: 1px solid var(--rfn-border);
  border-radius: calc(var(--rfn-radius) + 2px);
  box-shadow: var(--rfn-shadow);
  max-width: calc(100vw - 16px);
  overflow-x: auto;
}
.rfn-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--rfn-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

/* Composer */
.rfn-composer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: ${Z_CHROME};
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 16px;
  background: var(--rfn-bg);
  border: 1px solid var(--rfn-border);
  border-radius: calc(var(--rfn-radius) + 2px);
  box-shadow: var(--rfn-shadow);
}
.rfn-composer-label {
  font-weight: 600;
  margin: 0 0 8px;
  word-break: break-word;
}
.rfn-composer textarea {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 8px 10px;
  margin-bottom: 12px;
  background: var(--rfn-surface);
  border: 1px solid var(--rfn-border);
  border-radius: var(--rfn-radius);
}
.rfn-composer textarea:focus-visible { outline: 2px solid var(--rfn-accent); outline-offset: 1px; }
.rfn-actions { display: flex; justify-content: flex-end; gap: 8px; }

/* List */
.rfn-list {
  position: fixed;
  inset: 0;
  z-index: ${Z_LIST};
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: var(--rfn-bg);
  overflow-y: auto;
}
.rfn-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.rfn-list-title { font-weight: 600; margin: 0; }
.rfn-list-toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
.rfn-notes { display: flex; flex-direction: column; gap: 12px; }
.rfn-note {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--rfn-surface);
  border: 1px solid var(--rfn-border);
  border-radius: var(--rfn-radius);
}
.rfn-note-label { font-weight: 600; word-break: break-word; }
.rfn-note-comment { word-break: break-word; }
.rfn-note-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--rfn-fg-muted);
  word-break: break-all;
}
.rfn-note-actions { display: flex; flex-shrink: 0; gap: 2px; }
.rfn-icon-btn { padding: 5px; border-color: transparent; background: transparent; }

/* Launcher */
.rfn-launcher { position: fixed; z-index: ${Z_LAUNCHER}; }
.rfn-launcher--bottom-right { right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); }
.rfn-launcher--bottom-left  { left: 16px;  bottom: calc(16px + env(safe-area-inset-bottom)); }
.rfn-launcher--top-right    { right: 16px; top: calc(16px + env(safe-area-inset-top)); }
.rfn-launcher--top-left     { left: 16px;  top: calc(16px + env(safe-area-inset-top)); }
.rfn-launcher button {
  width: 40px;
  height: 40px;
  padding: 0;
  justify-content: center;
  border-radius: 999px;
  background: var(--rfn-bg);
  box-shadow: var(--rfn-shadow);
  opacity: 0.55;
}
.rfn-launcher button:hover { opacity: 1; }

@media (prefers-reduced-motion: no-preference) {
  .rfn-root button { transition: background 120ms ease, opacity 120ms ease; }
}
`;

/**
 *
 * Injects the package stylesheet once per document. Idempotent by element id,
 * and never removed — a second overlay mount reuses the same tag, and tearing
 * it down on unmount would restyle a remounting overlay mid-flight.
 *
 */
export function injectStyles(doc: Document = document): void {
  if (typeof document === 'undefined') return;
  if (doc.getElementById(STYLE_ID)) return;
  const el = doc.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  doc.head.appendChild(el);
}
