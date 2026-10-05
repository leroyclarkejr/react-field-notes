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
});
