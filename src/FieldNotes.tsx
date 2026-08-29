import { useEffect } from 'react';
import { FieldNotesProvider, useFieldNotes } from './FieldNotesProvider';
import { FieldNotesOverlay } from './FieldNotesOverlay';
import type { LauncherPosition } from './components/Launcher';
import { useAttributeTriggers } from './lib/useAttributeTriggers';
import { useHotkey } from './lib/useHotkey';

export interface FieldNotesProps {
  enabled?: boolean;
  hotkey?: string | false;
  launcher?: boolean;
  launcherPosition?: LauncherPosition;
  storageKey?: string;
  tapCount?: number;
  tapWindowMs?: number;
  accent?: string;
}

// The package has zero runtime dependencies and no @types/node, so `process`
// is not a known global here. This declares just enough of its shape,
// module-scoped rather than global, to type-check the read below without
// pulling in Node's ambient types or asserting `any`.
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/**
 *
 * Reads NODE_ENV without assuming a bundler defined `process`. Anything that is
 * not an explicit "production" leaves the overlay on, so a misconfigured
 * environment fails toward the tool being available rather than silently gone.
 *
 */
function defaultEnabled(): boolean {
  try {
    return process?.env?.NODE_ENV !== 'production';
  } catch {
    return true;
  }
}

function Activation({
  hotkey,
  launcher,
  launcherPosition,
  accent,
}: Required<Pick<FieldNotesProps, 'hotkey' | 'launcher' | 'launcherPosition'>> & { accent?: string }) {
  const { toggle, registerTap } = useFieldNotes();

  useHotkey(hotkey, toggle);
  useAttributeTriggers(true, registerTap);

  useEffect(() => {
    if (launcher || hotkey) return;
    if (typeof document === 'undefined') return;
    if (document.querySelector('[data-field-notes-trigger]')) return;
    console.warn(
      '[react-field-notes] No way to open the overlay: launcher and hotkey are both disabled ' +
        'and no element carries the data-field-notes-trigger attribute.',
    );
  }, [launcher, hotkey]);

  useEffect(() => {
    if (!accent || typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--rfn-accent', accent);
  }, [accent]);

  return <FieldNotesOverlay launcher={launcher} launcherPosition={launcherPosition} />;
}

/**
 *
 * Self-contained entry point. Renders its own provider and takes no children,
 * so it can sit anywhere in the tree. Use FieldNotesProvider + FieldNotesOverlay
 * directly when the host needs context access.
 *
 */
export function FieldNotes({
  enabled = defaultEnabled(),
  hotkey = 'mod+shift+n',
  launcher = true,
  launcherPosition = 'bottom-right',
  storageKey,
  tapCount,
  tapWindowMs,
  accent,
}: FieldNotesProps) {
  if (!enabled) return null;

  return (
    <FieldNotesProvider
      enabled
      storageKey={storageKey}
      tapCount={tapCount}
      tapWindowMs={tapWindowMs}
    >
      <Activation
        hotkey={hotkey}
        launcher={launcher}
        launcherPosition={launcherPosition}
        accent={accent}
      />
    </FieldNotesProvider>
  );
}
