import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FieldNotes } from './FieldNotes';

describe('FieldNotes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when disabled', () => {
    test('renders nothing anywhere in the document', () => {
      render(<FieldNotes enabled={false} />);

      expect(screen.queryByRole('button', { name: 'Open field notes' })).not.toBeInTheDocument();
    });
  });

  describe('when enabled with the default launcher', () => {
    test('renders the launcher button', () => {
      render(<FieldNotes enabled />);

      expect(screen.getByRole('button', { name: 'Open field notes' })).toBeInTheDocument();
    });
  });

  describe('when the launcher is clicked', () => {
    test('opens the toolbar', async () => {
      const user = userEvent.setup();
      render(<FieldNotes enabled />);

      await user.click(screen.getByRole('button', { name: 'Open field notes' }));

      expect(screen.getByRole('button', { name: /exit field notes/i })).toBeInTheDocument();
    });
  });

  describe('when every activation path is disabled and no trigger exists', () => {
    test('warns that there is no way to open the overlay', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<FieldNotes enabled launcher={false} hotkey={false} />);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('data-field-notes-trigger'));
    });
  });

  describe('when the launcher is off but a trigger element exists', () => {
    test('does not warn', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <div>
          <h1 data-field-notes-trigger>Acme</h1>
          <FieldNotes enabled launcher={false} hotkey={false} />
        </div>,
      );

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('when only the launcher is off but the default hotkey is still active', () => {
    test('does not warn', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<FieldNotes enabled launcher={false} />);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('when only the hotkey is off but the default launcher is still active', () => {
    test('does not warn', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<FieldNotes enabled hotkey={false} />);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
