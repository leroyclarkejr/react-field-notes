import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { FieldNotesProvider, useFieldNotes } from './FieldNotesProvider';
import { FieldNotesOverlay } from './FieldNotesOverlay';
import * as editor from './lib/openInEditor';
import * as reactGrab from './lib/reactGrab';
import * as sourceLocation from './lib/sourceLocation';

const testSource = { filePath: 'src/SaveButton.tsx', lineNumber: 12, componentName: 'SaveButton' };
const testDraftTarget = {
  label: 'SaveButton',
  domPath: 'button',
  rect: { x: 0, y: 0, w: 10, h: 10 },
  source: { filePath: 'src/SaveButton.tsx', lineNumber: 12 },
};

function stubPointer(isDesktop: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: isDesktop,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function Controls() {
  const { registerLogoTap, beginDraft } = useFieldNotes();
  return (
    <>
      <button onClick={registerLogoTap}>tap</button>
      <button onClick={() => beginDraft({ mode: 'element', target: testDraftTarget })}>begin-draft</button>
      <button>host-save</button>
    </>
  );
}

async function setupActive(): Promise<void> {
  render(
    <FieldNotesProvider enabled storageKey="test:overlay-code" tapCount={1}>
      <Controls />
      <FieldNotesOverlay />
    </FieldNotesProvider>,
  );
  await act(async () => {
    screen.getByText('tap').click();
    await Promise.resolve();
  });
}

async function clickHostElementInCodeMode(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(await screen.findByRole('button', { name: /code/i }));
  const captureLayer = screen.getByTestId('field-notes-capture');
  await act(async () => {
    captureLayer.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('FieldNotesOverlay open in editor', () => {
  const user = userEvent.setup();
  let resolveElementSource: MockInstance<typeof sourceLocation.resolveElementSource>;
  let openInEditor: MockInstance<typeof editor.openInEditor>;

  beforeEach(() => {
    localStorage.clear();
    resolveElementSource = vi.spyOn(sourceLocation, 'resolveElementSource').mockResolvedValue(testSource);
    // Loading the real react-grab in jsdom leaks a MutationObserver past teardown.
    vi.spyOn(reactGrab, 'getReactGrabApi').mockResolvedValue(null);
    openInEditor = vi.spyOn(editor, 'openInEditor').mockResolvedValue(true);
    document.elementFromPoint = () => screen.getByText('host-save');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.style.overflow = '';
  });

  describe('on a touch pointer', () => {
    test('does not offer Code mode', async () => {
      stubPointer(false);

      await setupActive();

      expect(screen.queryByRole('button', { name: /code/i })).not.toBeInTheDocument();
    });

    test('does not offer open in editor in the composer', async () => {
      stubPointer(false);
      await setupActive();

      act(() => screen.getByText('begin-draft').click());

      expect(screen.queryByRole('button', { name: /open in editor/i })).not.toBeInTheDocument();
    });
  });

  describe('on a desktop pointer', () => {
    beforeEach(async () => {
      stubPointer(true);
      await setupActive();
    });

    describe('when the user clicks an element in Code mode', () => {
      beforeEach(async () => {
        await clickHostElementInCodeMode(user);
      });

      test('opens the element source at its line', () => {
        expect(openInEditor).toHaveBeenCalledWith(testSource);
      });

      test('does not open the composer', () => {
        expect(screen.queryByPlaceholderText('What do you want to change here?')).not.toBeInTheDocument();
      });

      test('confirms which file was opened', () => {
        expect(screen.getByRole('status')).toHaveTextContent('Opened src/SaveButton.tsx:12');
      });

      test('stays in Code mode for the next click', () => {
        expect(screen.getByRole('button', { name: /code/i })).toHaveAttribute('data-active', 'true');
      });
    });

    describe('when the user opens the source from the composer', () => {
      test('opens the draft target source', async () => {
        act(() => screen.getByText('begin-draft').click());

        await user.click(await screen.findByRole('button', { name: /open in editor/i }));

        expect(openInEditor).toHaveBeenCalledWith(testDraftTarget.source);
      });
    });
  });

  describe('on a desktop pointer when the element has no source', () => {
    test('says no source was found', async () => {
      stubPointer(true);
      resolveElementSource.mockResolvedValue(undefined);
      await setupActive();

      await clickHostElementInCodeMode(user);

      expect(screen.getByRole('status')).toHaveTextContent('No source found for this element');
    });
  });

  describe('on a desktop pointer when the editor cannot be opened', () => {
    test('reports the failure as an alert', async () => {
      stubPointer(true);
      openInEditor.mockResolvedValue(false);
      await setupActive();

      await clickHostElementInCodeMode(user);

      expect(screen.getByRole('alert')).toHaveTextContent('Could not open the editor');
    });
  });
});
