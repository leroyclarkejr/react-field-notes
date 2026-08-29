import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { FieldNotesToolbar } from './FieldNotesToolbar';

describe('FieldNotesToolbar', () => {
  test('shows the note count', () => {
    render(
      <FieldNotesToolbar mode="tap" count={3} onModeChange={vi.fn()} onShowList={vi.fn()} onExit={vi.fn()} />,
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  describe('when the user switches to region mode', () => {
    test('calls onModeChange with region', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      render(
        <FieldNotesToolbar mode="tap" count={0} onModeChange={onModeChange} onShowList={vi.fn()} onExit={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /region/i }));

      expect(onModeChange).toHaveBeenCalledWith('region');
    });
  });

  describe('when the user clicks the already-active mode', () => {
    test('toggles back to navigate (off) mode', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      render(
        <FieldNotesToolbar mode="tap" count={0} onModeChange={onModeChange} onShowList={vi.fn()} onExit={vi.fn()} />,
      );

      await user.click(screen.getByRole('button', { name: /tap/i }));

      expect(onModeChange).toHaveBeenCalledWith('off');
    });
  });

  describe('when the user exits', () => {
    test('calls onExit', async () => {
      const user = userEvent.setup();
      const onExit = vi.fn();
      render(
        <FieldNotesToolbar mode="tap" count={0} onModeChange={vi.fn()} onShowList={vi.fn()} onExit={onExit} />,
      );

      await user.click(screen.getByRole('button', { name: /exit/i }));

      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });
});
