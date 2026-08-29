import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FieldNotesProvider, useFieldNotes } from './FieldNotesProvider';
import { FieldNotesOverlay } from './FieldNotesOverlay';

/**
 * Reproduces the mechanism @zag-js/dismissable (Chakra v3, Ark) and Radix's
 * dismissable layer use while a modal dialog is open: `<body>` loses pointer
 * events, and an "outside interaction" handler is registered on `window` in
 * the capture phase for the given event type, dismissing the dialog on any
 * interaction it judges outside it. No UI library involved — this fakes the
 * mechanism only, so the test stays honest for a package with no dependency
 * on one.
 */
function openFakeModal(eventType: 'pointerdown' | 'focusin', onDismiss: () => void): () => void {
  document.body.style.pointerEvents = 'none';
  const handler = () => onDismiss();
  window.addEventListener(eventType, handler, true);
  return () => {
    document.body.style.pointerEvents = '';
    window.removeEventListener(eventType, handler, true);
  };
}

function Harness() {
  const { toggle, setMode } = useFieldNotes();
  return (
    <div>
      <button type="button" onClick={toggle}>
        arm
      </button>
      <button type="button" onClick={() => setMode('tap')}>
        arm-tap
      </button>
    </div>
  );
}

describe('FieldNotesOverlay inside a modal dialog', () => {
  let closeModal: (() => void) | null = null;

  afterEach(() => {
    closeModal?.();
    closeModal = null;
    document.body.style.pointerEvents = '';
    vi.restoreAllMocks();
  });

  describe('when the overlay mounts', () => {
    test('renders into document.body rather than the app container', () => {
      const { container } = render(
        <FieldNotesProvider enabled storageKey="test:dialogs-portal">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );

      expect(container.querySelector('.rfn-launcher')).toBeNull();
    });
  });

  describe('when a modal has disabled pointer events on the body', () => {
    test('the capture layer re-enables its own pointer events', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-capture-style">
          <Harness />
          <FieldNotesOverlay launcher={false} />
        </FieldNotesProvider>,
      );
      act(() => screen.getByText('arm').click());
      act(() => screen.getByText('arm-tap').click());
      closeModal = openFakeModal('pointerdown', () => {});

      const capture = screen.getByTestId('field-notes-capture');

      expect(getComputedStyle(capture).pointerEvents).toBe('auto');
    });
  });

  describe('when a capture-mode tap lands on the capture layer while a modal is open', () => {
    test('the modal is not dismissed', () => {
      const onDismiss = vi.fn();
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-capture-shield">
          <Harness />
          <FieldNotesOverlay launcher={false} />
        </FieldNotesProvider>,
      );
      act(() => screen.getByText('arm').click());
      act(() => screen.getByText('arm-tap').click());
      closeModal = openFakeModal('pointerdown', onDismiss);
      const captureLayer = screen.getByTestId('field-notes-capture');

      act(() => {
        captureLayer.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }),
        );
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('when the overlay is idle', () => {
    test('a tap on a host page element reaches the modal normally', () => {
      const onDismiss = vi.fn();
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-passthrough">
          <button type="button">host button</button>
          <FieldNotesOverlay launcher={false} />
        </FieldNotesProvider>,
      );
      closeModal = openFakeModal('pointerdown', onDismiss);
      const hostButton = screen.getByRole('button', { name: 'host button' });

      act(() => {
        hostButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }),
        );
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the overlay is idle and the launcher is visible', () => {
    test('a tap on the launcher does not dismiss the modal', () => {
      const onDismiss = vi.fn();
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-launcher-shield">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );
      closeModal = openFakeModal('pointerdown', onDismiss);
      const launcherButton = screen.getByRole('button', { name: 'Open field notes' });

      act(() => {
        launcherButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('when the overlay is active in navigate mode', () => {
    test('a tap on a toolbar button does not dismiss the modal', () => {
      const onDismiss = vi.fn();
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-toolbar-shield">
          <Harness />
          <FieldNotesOverlay launcher={false} />
        </FieldNotesProvider>,
      );
      act(() => screen.getByText('arm').click());
      closeModal = openFakeModal('pointerdown', onDismiss);
      const tapButton = screen.getByRole('button', { name: 'Tap' });

      act(() => {
        tapButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('when the modal registers a focusin dismiss handler', () => {
    test('a focusin inside our overlay does not dismiss the modal', () => {
      const onDismiss = vi.fn();
      render(
        <FieldNotesProvider enabled storageKey="test:dialogs-focusin-shield">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );
      closeModal = openFakeModal('focusin', onDismiss);
      const launcherButton = screen.getByRole('button', { name: 'Open field notes' });

      act(() => {
        launcherButton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});
