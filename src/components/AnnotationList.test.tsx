import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FieldNote } from '../types';
import { AnnotationList } from './AnnotationList';

const testNote: FieldNote = {
  id: 'n1',
  createdAt: 1,
  route: '/',
  mode: 'element',
  comment: 'make it bigger',
  target: { label: 'button "Save"', domPath: 'button', rect: { x: 0, y: 0, w: 1, h: 1 } },
};

const testSource = { filePath: '/src/SaveButton.tsx', lineNumber: 12 };
const testNoteWithSource: FieldNote = { ...testNote, id: 'n2', target: { ...testNote.target, source: testSource } };

describe('AnnotationList', () => {
  beforeEach(() => {
    // Object.assign cannot override navigator.clipboard in jsdom (getter-only after first set).
    // Use Object.defineProperty with configurable:true so each test gets a fresh mock.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('renders each note comment', () => {
    render(
      <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByText('make it bigger')).toBeInTheDocument();
  });

  describe('when the user clicks Copy all', () => {
    test('writes markdown to the clipboard', async () => {
      const user = userEvent.setup();
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /copy all/i }));

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('make it bigger'));
    });

    test('shows copied feedback after a successful copy', async () => {
      const user = userEvent.setup();
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /copy all/i }));

      expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
    });

    test('restores the button label after the feedback delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ delay: null });
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );
      await user.click(screen.getByRole('button', { name: /copy all/i }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(screen.getByRole('button', { name: /copy all/i })).toBeInTheDocument();
    });

    describe('when the clipboard write fails', () => {
      test('shows failure feedback', async () => {
        const user = userEvent.setup();
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
        render(
          <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
        );

        await user.click(screen.getByRole('button', { name: /copy all/i }));

        expect(await screen.findByRole('button', { name: /copy failed/i })).toBeInTheDocument();
      });
    });
  });

  describe('when the user copies a single note', () => {
    const testOtherNote: FieldNote = {
      id: 'n2',
      createdAt: 2,
      route: '/settings',
      mode: 'element',
      comment: 'tighten the padding',
      target: { label: 'div "Card"', domPath: 'div', rect: { x: 0, y: 0, w: 1, h: 1 } },
    };

    test('writes that note to the clipboard', async () => {
      const user = userEvent.setup();
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      render(
        <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('tighten the padding'));
    });

    test('leaves the other notes out of the clipboard', async () => {
      const user = userEvent.setup();
      const writeText = vi.spyOn(navigator.clipboard, 'writeText');
      render(
        <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);

      expect(writeText).toHaveBeenCalledWith(expect.not.stringContaining('make it bigger'));
    });

    test('shows the copied state inside that note button', async () => {
      const user = userEvent.setup();
      render(
        <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);

      expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });

    test('keeps the other note buttons unchanged', async () => {
      const user = userEvent.setup();
      render(
        <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );
      await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);
      await screen.findByRole('button', { name: 'Copied' });

      expect(screen.getAllByRole('button', { name: 'Copy note' })).toHaveLength(1);
    });

    test('restores the button after the feedback delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ delay: null });
      render(
        <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );
      await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(screen.getAllByRole('button', { name: 'Copy note' })).toHaveLength(2);
    });

    describe('when the clipboard write fails', () => {
      test('shows failure feedback on that note button', async () => {
        const user = userEvent.setup();
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
        render(
          <AnnotationList notes={[testNote, testOtherNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
        );

        await user.click(screen.getAllByRole('button', { name: 'Copy note' })[1]!);

        expect(await screen.findByRole('button', { name: 'Copy failed, try again' })).toBeInTheDocument();
      });
    });
  });

  describe('when the user deletes a note', () => {
    test('calls onDelete with the note id', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <AnnotationList notes={[testNote]} onDelete={onDelete} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /delete note/i }));

      expect(onDelete).toHaveBeenCalledWith('n1');
    });
  });

  describe('when editing is not supported', () => {
    test('does not offer edit note', () => {
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      expect(screen.queryByRole('button', { name: 'Edit note' })).not.toBeInTheDocument();
    });
  });

  describe('when the user clicks edit note', () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    beforeEach(async () => {
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} onEdit={onEdit} />,
      );
      await user.click(screen.getByRole('button', { name: 'Edit note' }));
    });

    test('shows the comment in an editable box', () => {
      expect(screen.getByRole('textbox', { name: 'Note comment' })).toHaveValue('make it bigger');
    });

    describe('when the user changes the comment and saves', () => {
      beforeEach(async () => {
        const box = screen.getByRole('textbox', { name: 'Note comment' });
        await user.clear(box);
        await user.type(box, 'make it smaller');
        await user.click(screen.getByRole('button', { name: 'Save' }));
      });

      test('calls onEdit with the note id and new comment', () => {
        expect(onEdit).toHaveBeenCalledWith('n1', 'make it smaller');
      });

      test('closes the editable box', () => {
        expect(screen.queryByRole('textbox', { name: 'Note comment' })).not.toBeInTheDocument();
      });
    });

    describe('when the user clears the comment', () => {
      test('disables save', async () => {
        await user.clear(screen.getByRole('textbox', { name: 'Note comment' }));

        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      });
    });

    describe('when the user changes the comment and cancels', () => {
      beforeEach(async () => {
        await user.type(screen.getByRole('textbox', { name: 'Note comment' }), ' please');
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
      });

      test('does not call onEdit', () => {
        expect(onEdit).not.toHaveBeenCalled();
      });

      test('shows the original comment', () => {
        expect(screen.getByText('make it bigger')).toBeInTheDocument();
      });
    });
  });

  describe('when a note has a source and opening is supported', () => {
    test('opens the source when the user clicks open in editor', async () => {
      const user = userEvent.setup();
      const onOpenSource = vi.fn();
      render(
        <AnnotationList
          notes={[testNoteWithSource]}
          onDelete={vi.fn()}
          onClear={vi.fn()}
          onClose={vi.fn()}
          onOpenSource={onOpenSource}
        />,
      );

      await user.click(screen.getByRole('button', { name: /open in editor/i }));

      expect(onOpenSource).toHaveBeenCalledWith(testSource);
    });
  });

  describe('when a note has a source but opening is not supported', () => {
    test('does not offer open in editor', () => {
      render(
        <AnnotationList notes={[testNoteWithSource]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} />,
      );

      expect(screen.queryByRole('button', { name: /open in editor/i })).not.toBeInTheDocument();
    });
  });

  describe('when a note has no source', () => {
    test('does not offer open in editor', () => {
      render(
        <AnnotationList notes={[testNote]} onDelete={vi.fn()} onClear={vi.fn()} onClose={vi.fn()} onOpenSource={vi.fn()} />,
      );

      expect(screen.queryByRole('button', { name: /open in editor/i })).not.toBeInTheDocument();
    });
  });
});
