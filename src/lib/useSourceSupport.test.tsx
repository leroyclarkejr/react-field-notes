import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import * as sourceLocation from './sourceLocation';
import { useSourceSupport } from './useSourceSupport';

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

function Probe({ active }: { active: boolean }) {
  const supported = useSourceSupport(active);
  return <div data-rfn-overlay="">{supported ? 'supported' : 'unsupported'}</div>;
}

describe('useSourceSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('on a desktop pointer in a development build of React', () => {
    test('reports support', () => {
      stubPointer(true);

      render(<Probe active />);

      expect(screen.getByText('supported')).toBeInTheDocument();
    });
  });

  describe('on a touch pointer', () => {
    test('reports no support', () => {
      stubPointer(false);

      render(<Probe active />);

      expect(screen.getByText('unsupported')).toBeInTheDocument();
    });
  });

  describe('in a production build of React', () => {
    test('reports no support', () => {
      stubPointer(true);
      vi.spyOn(sourceLocation, 'hasReactDebugInfo').mockReturnValue(false);

      render(<Probe active />);

      expect(screen.getByText('unsupported')).toBeInTheDocument();
    });
  });

  describe('while the overlay is inactive', () => {
    test('reports no support', () => {
      stubPointer(true);

      render(<Probe active={false} />);

      expect(screen.getByText('unsupported')).toBeInTheDocument();
    });
  });

  describe('when the browser has no matchMedia', () => {
    test('reports no support', () => {
      render(<Probe active />);

      expect(screen.getByText('unsupported')).toBeInTheDocument();
    });
  });
});
