import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ElementContext } from './elementContext';
import { buildRegionTarget, buildRegionTargetWithContext, elementsInRect, topMostElements } from './geometry';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function stubRect(el: Element, rect: { left: number; top: number; width: number; height: number }): void {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  });
}

describe('elementsInRect', () => {
  test('includes an element overlapping the capture rectangle', () => {
    document.body.innerHTML = '<button>In</button>';
    const button = document.querySelector('button') as Element;
    stubRect(button, { left: 10, top: 10, width: 20, height: 20 });

    const result = elementsInRect({ x: 0, y: 0, w: 100, h: 100 });

    expect(result).toContain(button);
  });

  test('excludes an element outside the capture rectangle', () => {
    document.body.innerHTML = '<button>Out</button>';
    const button = document.querySelector('button') as Element;
    stubRect(button, { left: 500, top: 500, width: 20, height: 20 });

    const result = elementsInRect({ x: 0, y: 0, w: 100, h: 100 });

    expect(result).not.toContain(button);
  });
});

describe('topMostElements', () => {
  test('drops an element whose ancestor is already in the set', () => {
    document.body.innerHTML = '<section><button>A</button></section>';
    const section = document.querySelector('section') as Element;
    const button = document.querySelector('button') as Element;

    const result = topMostElements([section, button]);

    expect(result).toEqual([section]);
  });

  test('keeps sibling elements with no ancestor in the set', () => {
    document.body.innerHTML = '<button>A</button><button>B</button>';
    const buttons = Array.from(document.querySelectorAll('button'));

    const result = topMostElements(buttons);

    expect(result).toEqual(buttons);
  });
});

describe('buildRegionTarget', () => {
  test('reports the number of elements inside the region', () => {
    document.body.innerHTML = '<button>A</button>';
    const button = document.querySelector('button') as Element;

    const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, [button]);

    expect(result.elementCount).toBe(1);
  });

  test('falls back to a body path when the region is empty', () => {
    const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, []);

    expect(result.domPath).toBe('body');
  });

  describe('when the region contains elements', () => {
    test('includes a labeled summary for a contained element', () => {
      document.body.innerHTML = '<button aria-label="Save">Save</button>';
      const button = document.querySelector('button') as Element;

      const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, [button]);

      expect(result.elements?.[0]?.label).toBe('button "Save"');
    });

    test('includes the dom path for a contained element', () => {
      document.body.innerHTML = '<button class="primary">Save</button>';
      const button = document.querySelector('button') as Element;

      const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, [button]);

      expect(result.elements?.[0]?.domPath).toContain('button.primary');
    });

    test('summarizes only top-most elements', () => {
      document.body.innerHTML = '<section><button>A</button></section>';
      const section = document.querySelector('section') as Element;
      const button = document.querySelector('button') as Element;

      const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, [section, button]);

      expect(result.elements).toHaveLength(1);
    });

    test('caps element summaries at ten', () => {
      document.body.innerHTML = Array.from({ length: 12 }, (_, i) => `<button>B${i}</button>`).join('');
      const buttons = Array.from(document.querySelectorAll('button'));

      const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, buttons);

      expect(result.elements).toHaveLength(10);
    });

    test('keeps the full element count when summaries are capped', () => {
      document.body.innerHTML = Array.from({ length: 12 }, (_, i) => `<button>B${i}</button>`).join('');
      const buttons = Array.from(document.querySelectorAll('button'));

      const result = buildRegionTarget({ x: 0, y: 0, w: 50, h: 50 }, buttons);

      expect(result.elementCount).toBe(12);
    });
  });
});

describe('buildRegionTargetWithContext', () => {
  const fakeContext: ElementContext = {
    domPath: 'section.hero',
    label: 'section',
    stackContext: 'in Hero (at src/components/Hero.tsx)',
  };

  test('attaches the primary element component stack', async () => {
    document.body.innerHTML = '<section><button>A</button></section>';
    const section = document.querySelector('section') as Element;
    const getContext = () => Promise.resolve(fakeContext);

    const result = await buildRegionTargetWithContext({ x: 0, y: 0, w: 50, h: 50 }, [section], getContext);

    expect(result.componentStack).toBe('in Hero (at src/components/Hero.tsx)');
  });

  test('omits the component stack for an empty region', async () => {
    const getContext = () => Promise.resolve(fakeContext);

    const result = await buildRegionTargetWithContext({ x: 0, y: 0, w: 50, h: 50 }, [], getContext);

    expect(result.componentStack).toBeUndefined();
  });
});
