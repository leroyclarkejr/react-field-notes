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
    vi.doUnmock('react-grab/core');
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
    const coreInit = vi.fn(() => fakeApi);
    const mainEntryLoaded = vi.fn();

    beforeEach(() => {
      coreInit.mockClear();
      mainEntryLoaded.mockClear();
      vi.doMock('react-grab/core', () => ({ init: coreInit }));
      vi.doMock('react-grab', () => {
        mainEntryLoaded();
        return { init: vi.fn(() => fakeApi) };
      });
    });

    test('initialises the core entry with its own overlay disabled', async () => {
      await getReactGrabApi();

      expect(coreInit).toHaveBeenCalledWith({ enabled: false });
    });

    test('never loads the main entry, which would start react-grab with its toolbar', async () => {
      await getReactGrabApi();

      expect(mainEntryLoaded).not.toHaveBeenCalled();
    });

    test('returns the initialised api', async () => {
      const result = await getReactGrabApi();

      expect(result).toBe(fakeApi);
    });
  });

  describe('when the installed react-grab predates the core entry', () => {
    const mainInit = vi.fn(() => fakeApi);

    beforeEach(() => {
      mainInit.mockClear();
      vi.doMock('react-grab/core', () => {
        throw new Error("Cannot find module 'react-grab/core'");
      });
      vi.doMock('react-grab', () => ({ init: mainInit }));
    });

    test('falls back to the main entry', async () => {
      const result = await getReactGrabApi();

      expect(result).toBe(fakeApi);
    });
  });

  describe('when react-grab is not installed', () => {
    beforeEach(() => {
      vi.doMock('react-grab/core', () => {
        throw new Error("Cannot find module 'react-grab/core'");
      });
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
