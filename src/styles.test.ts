import { afterEach, describe, expect, test } from 'vitest';
import { injectStyles } from './styles';

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
