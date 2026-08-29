import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { Launcher } from './Launcher';

describe('Launcher', () => {
  describe('when clicked', () => {
    test('calls onClick', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Launcher position="bottom-right" onClick={onClick} />);

      await user.click(screen.getByRole('button', { name: 'Open field notes' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('when given a position', () => {
    test('applies the matching modifier class', () => {
      render(<Launcher position="top-left" onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Open field notes' }).parentElement).toHaveClass(
        'rfn-launcher--top-left',
      );
    });
  });
});
