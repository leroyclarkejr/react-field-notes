import { useEffect } from 'react';

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 *
 * Matches a keydown against a combination like 'mod+shift+n'. `mod` is Cmd on
 * Apple platforms and Ctrl everywhere else. Modifiers must match exactly — an
 * extra one held down is a different shortcut, not this one.
 *
 */
export function matchesHotkey(event: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split('+').map((part) => part.trim());
  const key = parts[parts.length - 1];
  if (!key) return false;

  const wanted = new Set(parts.slice(0, -1));
  const mac = isMac();

  // 'mod' resolves to Cmd on Apple platforms and Ctrl elsewhere. Every
  // modifier is then compared for equality, so an unnamed modifier being held
  // is a different shortcut and must not match.
  const wantsCtrl = wanted.has('ctrl') || (wanted.has('mod') && !mac);
  const wantsMeta = wanted.has('meta') || (wanted.has('mod') && mac);

  if (event.ctrlKey !== wantsCtrl) return false;
  if (event.metaKey !== wantsMeta) return false;
  if (event.shiftKey !== wanted.has('shift')) return false;
  if (event.altKey !== wanted.has('alt')) return false;

  return event.key.toLowerCase() === key;
}

export function useHotkey(hotkey: string | false, onTrigger: () => void): void {
  useEffect(() => {
    if (!hotkey || typeof document === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!matchesHotkey(event, hotkey)) return;
      event.preventDefault();
      onTrigger();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkey, onTrigger]);
}
