import { useSyncExternalStore } from 'react';
import { hasReactDebugInfo } from './sourceLocation';

const DESKTOP_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function subscribeToPointer(onChange: () => void): () => void {
  if (!hasMatchMedia()) return () => {};
  const query = window.matchMedia(DESKTOP_POINTER_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getPointerSnapshot(): boolean {
  return hasMatchMedia() && window.matchMedia(DESKTOP_POINTER_QUERY).matches;
}

function getServerPointerSnapshot(): boolean {
  return false;
}

/**
 *
 * True on a device with a hovering, precise pointer. Opening a file in an
 * editor only makes sense on the machine that runs the editor, so a phone or
 * tablet pointed at the same dev server never sees the controls.
 *
 * Subscribed rather than read once: a hybrid laptop can switch between touch
 * and trackpad without a reload.
 *
 */
export function useDesktopPointer(): boolean {
  return useSyncExternalStore(subscribeToPointer, getPointerSnapshot, getServerPointerSnapshot);
}

const OVERLAY_ROOT_SELECTOR = '[data-rfn-overlay]';

function subscribeToNothing(): () => void {
  return () => {};
}

function getDebugBuildSnapshot(): boolean {
  return typeof document !== 'undefined' && hasReactDebugInfo(document.querySelector(OVERLAY_ROOT_SELECTOR));
}

/**
 *
 * True when the host runs a development build of React, the only kind that
 * records where JSX was written. Read off the overlay's own root element,
 * which the same React rendered, so no host element has to be guessed at.
 *
 * Nothing to subscribe to: a page does not change React builds. The snapshot
 * is re-read after each commit, which is what picks up the overlay root the
 * first time it mounts.
 *
 */
function useReactDebugBuild(): boolean {
  return useSyncExternalStore(subscribeToNothing, getDebugBuildSnapshot, getServerPointerSnapshot);
}

/**
 *
 * Whether "open in editor" can be offered: the overlay is active, the pointer
 * is a desktop one, and React is a development build that can say where an
 * element was written.
 *
 */
export function useSourceSupport(active: boolean): boolean {
  const isDesktop = useDesktopPointer();
  const isDebugBuild = useReactDebugBuild();
  return active && isDesktop && isDebugBuild;
}
