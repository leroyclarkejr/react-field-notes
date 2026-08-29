import { afterEach, describe, expect, test, vi } from 'vitest';
import { getReactGrabApi, resetReactGrabApiForTests } from './reactGrab';

describe('getReactGrabApi', () => {
  afterEach(() => {
    resetReactGrabApiForTests();
    delete window.__REACT_GRAB__;
    vi.resetModules();
  });

  describe('when react-grab has already installed its global', () => {
    test('returns the global instance', async () => {
      const api = { getDisplayName: () => 'Button', getStackContext: async () => 'stack' };
      window.__REACT_GRAB__ = api;

      const result = await getReactGrabApi();

      expect(result).toBe(api);
    });
  });

  describe('when react-grab is not installed', () => {
    test('resolves to null instead of throwing', async () => {
      const result = await getReactGrabApi();

      expect(result).toBeNull();
    });
  });
});
