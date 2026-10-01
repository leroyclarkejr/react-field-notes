import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getReactGrabApi, resetReactGrabApiForTests } from './reactGrab';

// react-grab is mocked in every case below. Loading the real library in jsdom
// leaves its MutationObserver running past environment teardown, where it
// throws `ReferenceError: Node is not defined` into the test output.
describe('getReactGrabApi', () => {
  const fakeApi = { getDisplayName: () => 'Button', getStackContext: () => Promise.resolve('stack') };

  afterEach(() => {
    resetReactGrabApiForTests();
    delete window.__REACT_GRAB__;
    vi.doUnmock('react-grab');
    vi.resetModules();
  });

  describe('when react-grab has already installed its global', () => {
    test('returns the global instance', async () => {
      window.__REACT_GRAB__ = fakeApi;

      const result = await getReactGrabApi();

      expect(result).toBe(fakeApi);
    });
  });

  describe('when react-grab is installed but has not set its global', () => {
    const init = vi.fn(() => fakeApi);

    beforeEach(() => {
      init.mockClear();
      vi.doMock('react-grab', () => ({ init }));
    });

    test('initialises it with its own overlay disabled', async () => {
      await getReactGrabApi();

      expect(init).toHaveBeenCalledWith({ enabled: false });
    });

    test('returns the initialised api', async () => {
      const result = await getReactGrabApi();

      expect(result).toBe(fakeApi);
    });
  });

  describe('when react-grab is not installed', () => {
    beforeEach(() => {
      vi.doMock('react-grab', () => {
        throw new Error("Cannot find module 'react-grab'");
      });
    });

    test('resolves to null instead of throwing', async () => {
      const result = await getReactGrabApi();

      expect(result).toBeNull();
    });
  });
});
