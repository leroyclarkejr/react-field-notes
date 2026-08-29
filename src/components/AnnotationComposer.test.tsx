import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AnnotationComposer } from './AnnotationComposer';

const testTarget = { label: 'button "Save"', domPath: 'button', rect: { x: 0, y: 0, w: 1, h: 1 } };

describe('AnnotationComposer', () => {
  describe('when the user writes a comment and saves', () => {
    test('calls onSave with the comment text', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(
        <AnnotationComposer target={testTarget} onSave={onSave} onCancel={vi.fn()} />,
      );

      await user.type(screen.getByRole('textbox'), 'make it bigger');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(onSave).toHaveBeenCalledWith('make it bigger');
    });
  });

  describe('when the user cancels', () => {
    test('calls onCancel', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <AnnotationComposer target={testTarget} onSave={vi.fn()} onCancel={onCancel} />,
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  test('shows the target label', () => {
    render(
      <AnnotationComposer target={testTarget} onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByText(/button "Save"/)).toBeInTheDocument();
  });
});
