import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  buildElementTarget,
  computeDomPath,
  formatSource,
  getContextForElement,
  labelFromElement,
  textSnippet,
} from './elementContext';
import { resetReactGrabApiForTests } from './reactGrab';
import * as sourceLocation from './sourceLocation';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('computeDomPath', () => {
  test('uses the id when an element has one', () => {
    document.body.innerHTML = '<div id="root"><span></span></div>';
    const span = document.querySelector('span') as Element;

    const result = computeDomPath(span);

    expect(result).toContain('#root');
  });

  test('includes the first class name for an element', () => {
    document.body.innerHTML = '<button class="swatch primary"></button>';
    const button = document.querySelector('button') as Element;

    const result = computeDomPath(button);

    expect(result).toContain('button.swatch');
  });
});

describe('textSnippet', () => {
  test('collapses whitespace and trims', () => {
    document.body.innerHTML = '<p>  hello   world  </p>';
    const p = document.querySelector('p') as Element;

    const result = textSnippet(p);

    expect(result).toBe('hello world');
  });

  test('returns undefined for empty text', () => {
    document.body.innerHTML = '<div></div>';
    const div = document.querySelector('div') as Element;

    const result = textSnippet(div);

    expect(result).toBeUndefined();
  });
});

describe('labelFromElement', () => {
  test('prefers the aria-label', () => {
    document.body.innerHTML = '<button aria-label="Close">x</button>';
    const button = document.querySelector('button') as Element;

    const result = labelFromElement(button);

    expect(result).toContain('Close');
  });
});

describe('buildElementTarget', () => {
  test('uses the context label and dom path', () => {
    document.body.innerHTML = '<button>Save</button>';
    const button = document.querySelector('button') as Element;

    const result = buildElementTarget(button, { label: 'button "Save"', domPath: 'button', text: 'Save' });

    expect(result.label).toBe('button "Save"');
  });

  test('carries the component stack into the target', () => {
    document.body.innerHTML = '<button>Save</button>';
    const button = document.querySelector('button') as Element;

    const result = buildElementTarget(button, { label: 'x', domPath: 'button', stackContext: '<App>' });

    expect(result.componentStack).toBe('<App>');
  });

  test('carries the source location into the target', () => {
    document.body.innerHTML = '<button>Save</button>';
    const button = document.querySelector('button') as Element;
    const testSource = { filePath: '/src/SaveButton.tsx', lineNumber: 12 };

    const result = buildElementTarget(button, { label: 'x', domPath: 'button', source: testSource });

    expect(result.source).toEqual(testSource);
  });
});

describe('formatSource', () => {
  test('joins the file path and line number', () => {
    const result = formatSource({ filePath: '/src/SaveButton.tsx', lineNumber: 12 });

    expect(result).toBe('/src/SaveButton.tsx:12');
  });

  test('uses the file path alone when the line is unknown', () => {
    const result = formatSource({ filePath: '/src/SaveButton.tsx' });

    expect(result).toBe('/src/SaveButton.tsx');
  });
});

describe('getContextForElement', () => {
  const testSource = { filePath: 'src/SaveButton.tsx', lineNumber: 12, componentName: 'SaveButton' };

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__REACT_GRAB__;
    resetReactGrabApiForTests();
  });

  describe('when the element source can be resolved', () => {
    test('returns the source location', async () => {
      document.body.innerHTML = '<button>Save</button>';
      const button = document.querySelector('button') as Element;
      vi.spyOn(sourceLocation, 'resolveElementSource').mockResolvedValue(testSource);

      const result = await getContextForElement(button);

      expect(result.source).toEqual(testSource);
    });

    test('still labels the element with the react-grab display name', async () => {
      document.body.innerHTML = '<button>Save</button>';
      const button = document.querySelector('button') as Element;
      vi.spyOn(sourceLocation, 'resolveElementSource').mockResolvedValue(testSource);
      window.__REACT_GRAB__ = { getDisplayName: () => 'SaveButton', getStackContext: () => Promise.resolve('') };

      const result = await getContextForElement(button);

      expect(result.label).toBe('SaveButton');
    });
  });

  describe('when the element source cannot be resolved', () => {
    test('leaves the source undefined', async () => {
      document.body.innerHTML = '<button>Save</button>';
      const button = document.querySelector('button') as Element;
      vi.spyOn(sourceLocation, 'resolveElementSource').mockResolvedValue(undefined);

      const result = await getContextForElement(button);

      expect(result.source).toBeUndefined();
    });
  });

  describe('when resolving the source throws', () => {
    test('still returns the dom path', async () => {
      document.body.innerHTML = '<button>Save</button>';
      const button = document.querySelector('button') as Element;
      vi.spyOn(sourceLocation, 'resolveElementSource').mockRejectedValue(new Error('boom'));

      const result = await getContextForElement(button);

      expect(result.domPath).toBe('html > body > button');
    });
  });
});
