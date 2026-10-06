import { afterEach, describe, expect, test } from 'vitest';
import { CSS, injectStyles } from './styles';

describe('injectStyles', () => {
  afterEach(() => {
    document.getElementById('rfn-styles')?.remove();
  });

  describe('when called for the first time', () => {
    test('adds a style element to the document head', () => {
      injectStyles();

      expect(document.getElementById('rfn-styles')).toBeInTheDocument();
    });
  });

  describe('when called repeatedly', () => {
    test('leaves only one style element in the document', () => {
      injectStyles();
      injectStyles();
      injectStyles();

      expect(document.querySelectorAll('#rfn-styles')).toHaveLength(1);
    });
  });
});

describe('CSS', () => {
  describe('when the composer textarea is focused on iOS', () => {
    test('renders the textarea at 16px so Safari does not zoom the page', () => {
      const textareaRule = /\.rfn-root textarea\s*\{[^}]*font-size:\s*16px/;

      expect(CSS).toMatch(textareaRule);
    });
  });

  describe('when the composer opens', () => {
    test('centres it in the viewport rather than docking it to the bottom edge', () => {
      const composerRule = /\.rfn-composer\s*\{[^}]*top:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\)/;

      expect(CSS).toMatch(composerRule);
    });
  });
});
