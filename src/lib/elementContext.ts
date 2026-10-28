import { getReactGrabApi } from './reactGrab';
import { resolveElementSource } from './sourceLocation';
import type { FieldNoteSource, FieldNoteTarget } from '../types';

export interface ElementContext {
  domPath: string;
  label: string;
  text?: string;
  displayName?: string;
  stackContext?: string;
  source?: FieldNoteSource;
}

/** Renders a source location the way editors and stack traces do: `path:line`. */
export function formatSource(source: FieldNoteSource): string {
  return source.lineNumber == null ? source.filePath : `${source.filePath}:${source.lineNumber}`;
}

/**
 *
 * Builds a short, CSS-ish path to an element (id short-circuits; otherwise
 * tag + first class + nth-of-type), capped at 6 levels for readability.
 *
 */
export function computeDomPath(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  while (node && node.nodeType === 1 && parts.length < 6) {
    if (node.id) {
      parts.unshift(`#${node.id}`);
      break;
    }
    let selector = node.tagName.toLowerCase();
    const classes = (node.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      selector += `.${classes[0]}`;
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === node?.tagName);
      if (sameTag.length > 1) {
        selector += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
    }
    parts.unshift(selector);
    node = node.parentElement;
  }

  return parts.join(' > ');
}

export function textSnippet(el: Element, max = 60): string | undefined {
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function labelFromElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const aria = el.getAttribute('aria-label');
  if (aria) return `${tag} "${aria}"`;
  const text = textSnippet(el, 30);
  return text ? `${tag} "${text}"` : tag;
}

export async function getContextForElement(el: Element): Promise<ElementContext> {
  const domPath = computeDomPath(el);
  const text = textSnippet(el);
  // Resolved independently of react-grab: the source location comes from
  // React's own debug info, so it is available with or without that package.
  const source = await resolveElementSource(el).catch(() => undefined);
  try {
    const api = await getReactGrabApi();
    if (!api) return { domPath, text, source, label: labelFromElement(el) };
    const displayName = api.getDisplayName(el) ?? undefined;
    const stackContext = (await api.getStackContext(el)) || undefined;
    return { domPath, text, displayName, stackContext, source, label: displayName ?? labelFromElement(el) };
  } catch {
    return { domPath, text, source, label: labelFromElement(el) };
  }
}

export function buildElementTarget(el: Element, ctx: ElementContext): FieldNoteTarget {
  const r = el.getBoundingClientRect();
  return {
    label: ctx.label,
    domPath: ctx.domPath,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    text: ctx.text,
    componentStack: ctx.stackContext,
    source: ctx.source,
  };
}
