import { afterEach, describe, expect, test } from 'vitest';
import { buildElementTarget, computeDomPath, labelFromElement, textSnippet } from './elementContext';

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
});
