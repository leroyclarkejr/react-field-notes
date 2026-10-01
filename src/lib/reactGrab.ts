/**
 *
 * The subset of react-grab's programmatic API this package uses. Declared
 * structurally rather than imported from 'react-grab', so the package
 * typechecks in projects that have not installed it.
 *
 */
export interface ReactGrabAPI {
  getDisplayName(el: Element): string | null;
  getStackContext(el: Element): Promise<string>;
}

declare global {
  interface Window {
    __REACT_GRAB__?: ReactGrabAPI;
  }
}

interface ReactGrabModule {
  init(options: { enabled: boolean }): ReactGrabAPI;
}

let apiPromise: Promise<ReactGrabAPI | null> | null = null;

/** Test-only. Clears the memoised resolution between cases. */
export function resetReactGrabApiForTests(): void {
  apiPromise = null;
}

function importReactGrab(subpath: string): Promise<ReactGrabModule> {
  const specifier = ['react', 'grab'].join('-') + subpath;
  return import(/* @vite-ignore */ specifier) as Promise<ReactGrabModule>;
}

/**
 *
 * Lazily resolves react-grab's API. Prefers the global a host's own
 * `import('react-grab')` already installed; otherwise inits it disabled, so
 * react-grab's own overlay and hotkeys stay off and only its query methods are
 * used.
 *
 * Imports `react-grab/core` first: the main entry starts react-grab with its
 * full UI (including a bottom-centre toolbar) as a side effect of being
 * imported, before `init({ enabled: false })` can run. The main entry is only
 * a fallback for react-grab versions that predate `/core`.
 *
 * The specifier is built at runtime so bundlers cannot statically resolve it.
 * Without that, Vite and Rollup fail the build outright in projects that have
 * not installed react-grab, rather than letting the catch below handle it.
 *
 */
export async function getReactGrabApi(): Promise<ReactGrabAPI | null> {
  if (typeof window === 'undefined') return null;
  if (window.__REACT_GRAB__) return window.__REACT_GRAB__;
  apiPromise ??= importReactGrab('/core')
    .catch(() => importReactGrab(''))
    .then((mod) => mod.init({ enabled: false }))
    .catch(() => null);
  return apiPromise;
}
