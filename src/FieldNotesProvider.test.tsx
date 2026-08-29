import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FieldNotesProvider, useFieldNotes } from './FieldNotesProvider';

function enabledWrapper({ children }: { children: ReactNode }) {
  return <FieldNotesProvider enabled storageKey="test:notes">{children}</FieldNotesProvider>;
}

function disabledWrapper({ children }: { children: ReactNode }) {
  return <FieldNotesProvider enabled={false} storageKey="test:notes">{children}</FieldNotesProvider>;
}

describe('FieldNotesProvider tap gate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('activates after seven taps within the window', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    act(() => {
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
    });

    expect(result.current.active).toBe(true);
  });

  test('does not activate when an early tap ages out of the window', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    act(() => {
      result.current.registerLogoTap();
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
    });

    expect(result.current.active).toBe(false);
  });

  test('ignores taps when disabled', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: disabledWrapper });

    act(() => {
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
    });

    expect(result.current.active).toBe(false);
  });
});

describe('FieldNotesProvider notes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds a note when a draft is committed', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    act(() => {
      result.current.beginDraft({ mode: 'element', target: { label: 'button', domPath: 'button', rect: { x: 0, y: 0, w: 1, h: 1 } } });
    });
    act(() => {
      result.current.commitDraft('make it bigger');
    });

    expect(result.current.notes).toHaveLength(1);
  });

  test('loads persisted notes on mount', () => {
    localStorage.setItem(
      'test:notes',
      JSON.stringify([{ id: 'x', createdAt: 1, route: '/', mode: 'element', comment: 'hi', target: { label: 'b', domPath: 'b', rect: { x: 0, y: 0, w: 1, h: 1 } } }]),
    );

    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    expect(result.current.notes).toHaveLength(1);
  });
});

describe('useFieldNotes without a provider', () => {
  test('returns an inert default so host components stay mountable', () => {
    const { result } = renderHook(() => useFieldNotes());

    expect(result.current.active).toBe(false);
  });
});

describe('FieldNotesProvider capture mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to navigate (off) mode', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    expect(result.current.mode).toBe('off');
  });

  test('resets to navigate mode after the overlay is deactivated', () => {
    const { result } = renderHook(() => useFieldNotes(), { wrapper: enabledWrapper });

    act(() => {
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
    });
    act(() => {
      result.current.setMode('region');
    });
    act(() => {
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
      result.current.registerLogoTap();
    });

    expect(result.current.mode).toBe('off');
  });
});

describe('FieldNotesProvider toggle', () => {
  describe('when toggle is called', () => {
    test('flips the overlay from inactive to active', () => {
      const { result } = renderHook(() => useFieldNotes(), {
        wrapper: ({ children }) => (
          <FieldNotesProvider enabled storageKey="test:toggle">
            {children}
          </FieldNotesProvider>
        ),
      });

      act(() => result.current.toggle());

      expect(result.current.active).toBe(true);
    });
  });
});

describe('FieldNotesProvider registerTap', () => {
  describe('when registerTap is given a count override', () => {
    test('activates after that many taps instead of the provider default', () => {
      const { result } = renderHook(() => useFieldNotes(), {
        wrapper: ({ children }) => (
          <FieldNotesProvider enabled storageKey="test:override" tapCount={7}>
            {children}
          </FieldNotesProvider>
        ),
      });

      act(() => {
        result.current.registerTap(2);
        result.current.registerTap(2);
      });

      expect(result.current.active).toBe(true);
    });
  });
});
