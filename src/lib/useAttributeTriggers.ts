import { useEffect } from 'react';

const TRIGGER_SELECTOR = '[data-field-notes-trigger]';
const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [contenteditable]';

/**
 *
 * Counts clicks on any element carrying `data-field-notes-trigger`.
 *
 * One delegated listener on `document`, in the capture phase so a host calling
 * stopPropagation() between the click target and the trigger cannot hide taps
 * from it, and at document level so triggers rendered into portals work without
 * special handling and remounts need no re-registration.
 *
 * It never calls preventDefault or stopPropagation: the host's own handlers on
 * the trigger keep running, including on the activating tap.
 *
 */
export function useAttributeTriggers(enabled: boolean, onTap: (tapCount?: number) => void): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest<HTMLElement>(TRIGGER_SELECTOR);
      if (!trigger) return;

      // A trigger can wrap a whole region, so a click that landed on a real
      // control inside it is the user using the app, not tapping the trigger.
      // The trigger itself being interactive is deliberate and still counts.
      if (trigger.dataset.fieldNotesTrigger !== 'all') {
        const interactive = target.closest(INTERACTIVE_SELECTOR);
        if (interactive && interactive !== trigger && trigger.contains(interactive)) return;
      }

      const override = Number(trigger.dataset.fieldNotesTaps);
      onTap(Number.isFinite(override) && override > 0 ? override : undefined);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [enabled, onTap]);
}
