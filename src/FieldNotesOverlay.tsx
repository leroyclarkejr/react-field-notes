import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CaptureRect } from './types';
import { useFieldNotes } from './FieldNotesProvider';
import { buildElementTarget, getContextForElement } from './lib/elementContext';
import { buildRegionTargetWithContext, elementsInRect } from './lib/geometry';
import { FieldNotesToolbar } from './components/FieldNotesToolbar';
import { AnnotationComposer } from './components/AnnotationComposer';
import { AnnotationList } from './components/AnnotationList';
import { Launcher } from './components/Launcher';
import type { LauncherPosition } from './components/Launcher';
import { injectStyles } from './styles';

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * React 18 warns when useLayoutEffect runs during SSR, and the peer range
 * still includes 18.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface FieldNotesOverlayProps {
  launcher?: boolean;
  launcherPosition?: LauncherPosition;
}

/**
 *
 * Resolves the element under a point, ignoring the capture layer itself so
 * elementFromPoint returns the real app element beneath the overlay.
 *
 */
function elementUnderPoint(captureEl: HTMLElement | null, x: number, y: number): Element | null {
  const prev = captureEl?.style.pointerEvents;
  if (captureEl) captureEl.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  if (captureEl) captureEl.style.pointerEvents = prev ?? '';
  return el;
}

export function FieldNotesOverlay({
  launcher = true,
  launcherPosition = 'bottom-right',
}: FieldNotesOverlayProps) {
  const ctx = useFieldNotes();
  const {
    active,
    mode,
    notes,
    draft,
    showList,
    toggle,
    setMode,
    setShowList,
    beginDraft,
    cancelDraft,
    commitDraft,
    deleteNote,
    clearAll,
    exit,
  } = ctx;

  const captureRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState<CaptureRect | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  // The shield listeners are registered once and never re-registered, so they
  // read live state through this ref rather than through their closure.
  // Synced in a layout effect so the ref is current before the browser can
  // dispatch the next pointer event, without writing a ref during render.
  const live = useRef({ active, mode, draft, showList, beginDraft });
  useIsomorphicLayoutEffect(() => {
    live.current = { active, mode, draft, showList, beginDraft };
  });

  useEffect(() => {
    injectStyles();
  }, []);

  const isCapturing = useCallback(() => {
    const s = live.current;
    return s.active && s.mode !== 'off' && s.draft === null && !s.showList;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Swallow the event entirely so the host sees nothing: a dialog stays open,
    // buttons underneath do not activate, links do not navigate.
    const shield = (event: PointerEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    // The toolbar/composer/list are siblings of the capture layer in the
    // portal, stacked above it, so a pointer event over them still reaches
    // this window-level listener. Only events actually inside the capture
    // layer are ours to shield and act on with the full capture logic below.
    const isOnCaptureLayer = (target: EventTarget | null): boolean =>
      target instanceof Node && !!captureRef.current?.contains(target);

    // Anything else inside our own portal — the toolbar pill, the composer
    // sheet, the notes list — is still "inside the overlay" as far as a host
    // dialog is concerned, even though it isn't the capture layer.
    const isInsideOverlay = (target: EventTarget | null): boolean =>
      target instanceof Element && !!target.closest('[data-rfn-overlay]');

    const onPointerDown = (event: PointerEvent) => {
      if (isCapturing() && isOnCaptureLayer(event.target)) {
        shield(event);
        if (live.current.mode !== 'region') return;
        dragStart.current = { x: event.clientX, y: event.clientY };
        setHighlight({ x: event.clientX, y: event.clientY, w: 0, h: 0 });
        return;
      }

      // Not on the capture layer, but still somewhere in our own subtree —
      // the launcher, the toolbar pill, the composer sheet, the notes list.
      // Our overlay is not part of the host application, so a host dialog's
      // outside-dismiss listener (Zag's `isEventOutside`, which only spares
      // targets inside the dialog or points inside its rect) has no business
      // seeing this event at all, active or idle, capturing or navigate mode.
      // Only stop propagation — no preventDefault, so click generation,
      // focus and text selection on our own controls keep working normally.
      if (isInsideOverlay(event.target)) {
        event.stopImmediatePropagation();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isCapturing() && isOnCaptureLayer(event.target)) {
        shield(event);
        if (live.current.mode === 'tap') {
          const el = elementUnderPoint(captureRef.current, event.clientX, event.clientY);
          if (!el) return;
          const r = el.getBoundingClientRect();
          setHighlight({ x: r.x, y: r.y, w: r.width, h: r.height });
          return;
        }
        const start = dragStart.current;
        if (!start) return;
        setHighlight({
          x: Math.min(start.x, event.clientX),
          y: Math.min(start.y, event.clientY),
          w: Math.abs(event.clientX - start.x),
          h: Math.abs(event.clientY - start.y),
        });
        return;
      }

      if (isInsideOverlay(event.target)) {
        event.stopImmediatePropagation();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (isCapturing() && isOnCaptureLayer(event.target)) {
        shield(event);

        if (live.current.mode === 'tap') {
          const el = elementUnderPoint(captureRef.current, event.clientX, event.clientY);
          if (!el) return;
          void getContextForElement(el).then((elementCtx) => {
            live.current.beginDraft({ mode: 'element', target: buildElementTarget(el, elementCtx) });
            setHighlight(null);
          });
          return;
        }

        const start = dragStart.current;
        dragStart.current = null;
        if (!start) return;
        const rect: CaptureRect = {
          x: Math.min(start.x, event.clientX),
          y: Math.min(start.y, event.clientY),
          w: Math.abs(event.clientX - start.x),
          h: Math.abs(event.clientY - start.y),
        };
        const inside = elementsInRect(rect).filter((el) => !captureRef.current?.contains(el));
        void buildRegionTargetWithContext(rect, inside).then((target) => {
          live.current.beginDraft({ mode: 'region', target });
          setHighlight(null);
        });
        return;
      }

      // A release that lands off the capture layer while a mode is still
      // active (e.g. dragging a region selection and letting go over the
      // toolbar) must not leave a drag in progress or a highlight rectangle
      // painted until the next pointerdown.
      if (isCapturing() && dragStart.current !== null) {
        dragStart.current = null;
        setHighlight(null);
      }

      if (isInsideOverlay(event.target)) {
        event.stopImmediatePropagation();
      }
    };

    // @zag-js/interact-outside (Chakra v3 / Ark dialogs; Radix behaves the
    // same) also registers a `focusin` capture listener on non-touch devices
    // to dismiss on focus-outside, guarded by an `isPointerDown` flag that our
    // pointerdown shield above prevents Zag from ever setting. Without this,
    // AnnotationComposer's autoFocus textarea mounting outside the dialog
    // reads as focus-outside and the dialog closes under us. Registered in
    // this same effect, at the same time, for the same ordering reason as the
    // pointer listeners: it must be an earlier `window` capture-phase
    // listener than Zag's, which only holds if it is attached before any
    // dialog exists. Shielded unconditionally, like the pointer handlers
    // above — our subtree is never part of the host's own focus management.
    const onFocusIn = (event: FocusEvent) => {
      if (!isInsideOverlay(event.target)) return;
      event.stopImmediatePropagation();
    };

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('focusin', onFocusIn, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('focusin', onFocusIn, true);
    };
  }, [isCapturing]);

  // Lock background scroll while the overlay is modal (a capture mode is active,
  // or the composer/list is open). Navigate mode intentionally stays scrollable.
  useEffect(() => {
    const locked = active && (mode !== 'off' || draft !== null || showList);
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active, mode, draft, showList]);

  if (typeof document === 'undefined') return null;

  if (!active) {
    return launcher
      ? createPortal(
          <div data-rfn-overlay="">
            <Launcher position={launcherPosition} onClick={toggle} />
          </div>,
          document.body,
        )
      : null;
  }

  return createPortal(
    <div data-rfn-overlay="">
      {!draft && !showList && mode !== 'off' && (
        <div ref={captureRef} data-testid="field-notes-capture" className="rfn-root rfn-capture">
          {highlight && (
            <div
              className="rfn-highlight"
              style={{
                left: `${highlight.x}px`,
                top: `${highlight.y}px`,
                width: `${highlight.w}px`,
                height: `${highlight.h}px`,
              }}
            />
          )}
        </div>
      )}

      {!draft && !showList && (
        <FieldNotesToolbar
          mode={mode}
          count={notes.length}
          onModeChange={setMode}
          onShowList={() => setShowList(true)}
          onExit={exit}
        />
      )}

      {draft && (
        <AnnotationComposer target={draft.target} onSave={commitDraft} onCancel={cancelDraft} />
      )}

      {showList && (
        <AnnotationList
          notes={notes}
          onDelete={deleteNote}
          onClear={clearAll}
          onClose={() => setShowList(false)}
        />
      )}
    </div>,
    document.body,
  );
}
