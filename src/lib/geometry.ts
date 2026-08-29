import type { CaptureRect, FieldNoteTarget, RegionElementSummary } from '../types';
import type { ElementContext } from './elementContext';
import { computeDomPath, getContextForElement, labelFromElement, textSnippet } from './elementContext';

const MAX_ELEMENT_SUMMARIES = 10;

/**
 *
 * Returns every visible element whose bounding box intersects the capture
 * rectangle (viewport coordinates).
 *
 */
export function elementsInRect(rect: CaptureRect, root: Element = document.body): Element[] {
  const result: Element[] = [];
  const right = rect.x + rect.w;
  const bottom = rect.y + rect.h;

  root.querySelectorAll('*').forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const intersects = box.left < right && box.right > rect.x && box.top < bottom && box.bottom > rect.y;
    if (intersects) result.push(el);
  });

  return result;
}

/**
 *
 * Keeps only elements with no ancestor in the set — a region capture returns
 * every intersecting node, which is mostly nested wrappers of the same UI.
 *
 */
export function topMostElements(elements: Element[]): Element[] {
  const set = new Set(elements);
  return elements.filter((el) => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      if (set.has(parent)) return false;
    }
    return true;
  });
}

export function buildRegionTarget(rect: CaptureRect, elements: Element[]): FieldNoteTarget {
  const primary = elements[0];
  const summaries: RegionElementSummary[] = topMostElements(elements)
    .slice(0, MAX_ELEMENT_SUMMARIES)
    .map((el) => ({
      label: labelFromElement(el),
      domPath: computeDomPath(el),
      text: textSnippet(el),
    }));
  return {
    label: `Region (${elements.length} element${elements.length === 1 ? '' : 's'})`,
    domPath: primary ? computeDomPath(primary) : 'body',
    rect,
    elementCount: elements.length,
    elements: summaries,
  };
}

/**
 *
 * Region target enriched with the primary element's React component stack,
 * mirroring what tap-mode notes capture via react-grab.
 *
 */
export async function buildRegionTargetWithContext(
  rect: CaptureRect,
  elements: Element[],
  getContext: (el: Element) => Promise<ElementContext> = getContextForElement,
): Promise<FieldNoteTarget> {
  const target = buildRegionTarget(rect, elements);
  const primary = elements[0];
  if (primary) {
    const ctx = await getContext(primary);
    target.componentStack = ctx.stackContext;
  }
  return target;
}
