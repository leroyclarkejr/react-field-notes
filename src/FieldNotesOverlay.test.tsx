import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FieldNotesProvider, useFieldNotes } from './FieldNotesProvider';
import { FieldNotesOverlay } from './FieldNotesOverlay';

const testDraftTarget = { label: 'test target', domPath: 'div.test', rect: { x: 0, y: 0, w: 10, h: 10 } };

function Controls() {
  const { registerLogoTap, setMode, beginDraft } = useFieldNotes();
  return (
    <>
      <button onClick={registerLogoTap}>tap</button>
      <button onClick={() => setMode('tap')}>set-tap</button>
      <button onClick={() => setMode('region')}>set-region</button>
      <button onClick={() => beginDraft({ mode: 'element', target: testDraftTarget })}>begin-draft</button>
    </>
  );
}

function setup(): {
  activate: () => void;
  chooseTapMode: () => void;
  chooseRegionMode: () => void;
  openComposer: () => void;
} {
  render(
    <FieldNotesProvider enabled storageKey="test:overlay" tapCount={1}>
      <Controls />
      <FieldNotesOverlay />
    </FieldNotesProvider>,
  );
  return {
    activate: () => act(() => screen.getByText('tap').click()),
    chooseTapMode: () => act(() => screen.getByText('set-tap').click()),
    chooseRegionMode: () => act(() => screen.getByText('set-region').click()),
    openComposer: () => act(() => screen.getByText('begin-draft').click()),
  };
}

describe('FieldNotesOverlay', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  test('does not render the toolbar while inactive', () => {
    render(
      <FieldNotesProvider enabled storageKey="test:overlay">
        <FieldNotesOverlay />
      </FieldNotesProvider>,
    );

    expect(screen.queryByRole('button', { name: /exit field notes/i })).not.toBeInTheDocument();
  });

  test('renders the toolbar once active', () => {
    const { activate } = setup();

    activate();

    expect(screen.getByRole('button', { name: /exit field notes/i })).toBeInTheDocument();
  });

  test('does not render the capture layer in navigate mode', () => {
    const { activate } = setup();

    activate();

    expect(screen.queryByTestId('field-notes-capture')).not.toBeInTheDocument();
  });

  test('renders the capture layer after a mode is chosen', () => {
    const { activate, chooseTapMode } = setup();

    activate();
    chooseTapMode();

    expect(screen.getByTestId('field-notes-capture')).toBeInTheDocument();
  });

  test('locks background scroll when a capture mode is active', () => {
    const { activate, chooseTapMode } = setup();

    activate();
    chooseTapMode();

    expect(document.body.style.overflow).toBe('hidden');
  });

  test('does not lock background scroll in navigate mode', () => {
    const { activate } = setup();

    activate();

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  describe('when the overlay is inactive and the launcher is enabled', () => {
    test('renders the launcher button', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:launcher">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );

      expect(screen.getByRole('button', { name: 'Open field notes' })).toBeInTheDocument();
    });
  });

  describe('when the overlay is active', () => {
    test('hides the launcher button', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:launcher-hidden" tapCount={1}>
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );

      act(() => {
        screen.getByRole('button', { name: 'Open field notes' }).click();
      });

      expect(screen.queryByRole('button', { name: 'Open field notes' })).not.toBeInTheDocument();
    });
  });

  describe('window listener registration', () => {
    test('keeps its own pointerdown listener ahead of one registered after mount, across state changes', () => {
      const { activate, chooseTapMode } = setup();
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);

      activate();
      chooseTapMode();
      const captureLayer = screen.getByTestId('field-notes-capture');
      act(() => {
        captureLayer.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when the overlay is idle', () => {
    test('lets other window pointerdown listeners receive a pointerdown on a real host element', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:idle-shield">
          <button>host button</button>
          <FieldNotesOverlay launcher={false} />
        </FieldNotesProvider>,
      );
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);
      const hostButton = screen.getByRole('button', { name: 'host button' });

      act(() => {
        hostButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a capture mode is active', () => {
    test('ignores a pointer sequence that lands on the toolbar', async () => {
      const { activate, chooseRegionMode } = setup();
      activate();
      chooseRegionMode();
      const exitButton = screen.getByRole('button', { name: /exit field notes/i });

      await act(async () => {
        exitButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
        exitButton.dispatchEvent(
          new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }),
        );
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByPlaceholderText('What do you want to change here?')).not.toBeInTheDocument();
    });
  });

  describe('when the composer is open', () => {
    test('does not let a pointerdown on the composer textarea escape to a competing window listener', () => {
      const { activate, openComposer } = setup();
      activate();
      openComposer();
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);
      const textarea = screen.getByPlaceholderText('What do you want to change here?');

      act(() => {
        textarea.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).not.toHaveBeenCalled();
    });

    test('still lets the user type into the composer textarea', async () => {
      const user = userEvent.setup();
      const { activate, openComposer } = setup();
      activate();
      openComposer();
      const textarea = screen.getByPlaceholderText('What do you want to change here?');

      await user.click(textarea);
      await user.type(textarea, 'hello');

      expect(textarea).toHaveValue('hello');
    });
  });

  describe('when dragging a region selection', () => {
    test('clears the highlight if the pointer is released over the toolbar', () => {
      const { activate, chooseRegionMode } = setup();
      activate();
      chooseRegionMode();
      const captureLayer = screen.getByTestId('field-notes-capture');
      const exitButton = screen.getByRole('button', { name: /exit field notes/i });

      act(() => {
        captureLayer.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
        exitButton.dispatchEvent(
          new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }),
        );
      });

      expect(document.querySelector('.rfn-highlight')).not.toBeInTheDocument();
    });
  });

  describe('when the overlay is idle and the launcher is enabled', () => {
    test('does not let a pointerdown on the launcher escape to a competing window listener', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:launcher-shield">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);
      const launcherButton = screen.getByRole('button', { name: 'Open field notes' });

      act(() => {
        launcherButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).not.toHaveBeenCalled();
    });

    test('still activates the overlay when the launcher is clicked', async () => {
      const user = userEvent.setup();
      render(
        <FieldNotesProvider enabled storageKey="test:launcher-activates">
          <FieldNotesOverlay launcher />
        </FieldNotesProvider>,
      );
      const launcherButton = screen.getByRole('button', { name: 'Open field notes' });

      await user.click(launcherButton);

      expect(screen.getByRole('button', { name: /exit field notes/i })).toBeInTheDocument();
    });
  });

  describe('when the overlay is active in navigate mode', () => {
    test('does not let a pointerdown on a toolbar button escape to a competing window listener', () => {
      const { activate } = setup();
      activate();
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);
      const tapButton = screen.getByRole('button', { name: 'Tap' });

      act(() => {
        tapButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).not.toHaveBeenCalled();
    });

    test('still switches to tap mode when the "Tap" button is clicked', async () => {
      const user = userEvent.setup();
      const { activate } = setup();
      activate();
      const tapButton = screen.getByRole('button', { name: 'Tap' });

      await user.click(tapButton);

      expect(screen.getByTestId('field-notes-capture')).toBeInTheDocument();
    });

    test('lets other window pointerdown listeners receive a pointerdown on a host page element', () => {
      render(
        <FieldNotesProvider enabled storageKey="test:navigate-host" tapCount={1}>
          <button>host button</button>
          <Controls />
          <FieldNotesOverlay />
        </FieldNotesProvider>,
      );
      act(() => screen.getByText('tap').click());
      const spy = vi.fn();
      window.addEventListener('pointerdown', spy, true);
      const hostButton = screen.getByRole('button', { name: 'host button' });

      act(() => {
        hostButton.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 1, clientY: 1 }),
        );
      });
      window.removeEventListener('pointerdown', spy, true);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
