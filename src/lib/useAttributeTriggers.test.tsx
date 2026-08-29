import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { useAttributeTriggers } from './useAttributeTriggers';

function Harness({ onTap, children }: { onTap: (n?: number) => void; children: React.ReactNode }) {
  useAttributeTriggers(true, onTap);
  return <>{children}</>;
}

describe('useAttributeTriggers', () => {
  const user = userEvent.setup();

  describe('when a marked element is clicked', () => {
    test('reports a tap', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <h1 data-field-notes-trigger>Acme</h1>
        </Harness>,
      );

      await user.click(screen.getByRole('heading', { name: 'Acme' }));

      expect(onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a descendant of a marked region is clicked', () => {
    test('reports a tap', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <aside data-field-notes-trigger>
            <span>chrome</span>
          </aside>
        </Harness>,
      );

      await user.click(screen.getByText('chrome'));

      expect(onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('when an interactive descendant of a marked region is clicked', () => {
    test('does not report a tap', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <aside data-field-notes-trigger>
            <button type="button">Settings</button>
          </aside>
        </Harness>,
      );

      await user.click(screen.getByRole('button', { name: 'Settings' }));

      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('when the marked element is itself interactive', () => {
    test('reports a tap', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <button type="button" data-field-notes-trigger>
            Brand
          </button>
        </Harness>,
      );

      await user.click(screen.getByRole('button', { name: 'Brand' }));

      expect(onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the region opts into counting interactive clicks', () => {
    test('reports a tap for a button inside it', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <aside data-field-notes-trigger="all">
            <button type="button">Settings</button>
          </aside>
        </Harness>,
      );

      await user.click(screen.getByRole('button', { name: 'Settings' }));

      expect(onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the element overrides the tap count', () => {
    test('passes the override through', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <h1 data-field-notes-trigger data-field-notes-taps="3">
            Acme
          </h1>
        </Harness>,
      );

      await user.click(screen.getByRole('heading', { name: 'Acme' }));

      expect(onTap).toHaveBeenCalledWith(3);
    });
  });

  describe('when an unmarked element is clicked', () => {
    test('does not report a tap', async () => {
      const onTap = vi.fn();
      render(
        <Harness onTap={onTap}>
          <h1>Acme</h1>
        </Harness>,
      );

      await user.click(screen.getByRole('heading', { name: 'Acme' }));

      expect(onTap).not.toHaveBeenCalled();
    });
  });
});
