# react-field-notes

A dev-time annotation overlay for React apps. Tap an element (or a hotkey), leave a
note, export markdown you can hand straight to your coding agent. Zero runtime
dependencies, tree-shakes out of production builds.

## Install

```bash
pnpm add -D react-field-notes
```

`react`, `react-dom`, and `react-grab` are peer dependencies. `react-grab` is
**optional** — see [Enhanced context with react-grab](#enhanced-context-with-react-grab)
below.

## Usage

The simplest integration is a single self-contained component. Drop it anywhere
in your tree — it renders its own provider and needs no children:

```tsx
import { FieldNotes } from 'react-field-notes';

export function App() {
  return (
    <>
      <YourApp />
      <FieldNotes />
    </>
  );
}
```

By default it's active outside production, opens with `Cmd/Ctrl+Shift+N` or a
seven-tap gesture on its floating launcher button, and stores notes in
`localStorage`.

### Composed form

If a host needs access to the field-notes context elsewhere in the tree (for
example, to show a custom "notes open" indicator, or to wire up its own
trigger UI), use the provider and overlay directly instead of `<FieldNotes />`:

```tsx
import { FieldNotesProvider, FieldNotesOverlay, useFieldNotes } from 'react-field-notes';

function NotesBadge() {
  const { notes } = useFieldNotes();
  return <span>{notes.length} notes</span>;
}

export function App() {
  return (
    <FieldNotesProvider enabled={process.env.NODE_ENV !== 'production'}>
      <YourApp />
      <NotesBadge />
      <FieldNotesOverlay />
    </FieldNotesProvider>
  );
}
```

## Props

All props are on `<FieldNotes />`. The composed form takes the same values
split between `FieldNotesProvider` (`enabled`, `storageKey`, `tapCount`,
`tapWindowMs`) and `FieldNotesOverlay` (`launcher`, `launcherPosition`).

| Prop               | Type                    | Default                                  | Description |
| ------------------ | ----------------------- | ----------------------------------------- | ------------ |
| `enabled`           | `boolean`               | `process.env.NODE_ENV !== 'production'`   | Whether the overlay is mounted at all. `false` renders nothing. |
| `hotkey`            | `string \| false`       | `'mod+shift+n'`                           | Keyboard shortcut that toggles the overlay. `mod` resolves to Cmd on macOS/iOS and Ctrl elsewhere. Pass `false` to disable. |
| `launcher`          | `boolean`               | `true`                                    | Whether to render the floating launcher button. |
| `launcherPosition`  | `LauncherPosition`      | `'bottom-right'`                          | One of `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'`. |
| `storageKey`        | `string`                | internal default key                      | `localStorage` key notes are persisted under. Set this if you run multiple field-notes instances or apps on the same origin. |
| `tapCount`          | `number`                | `7`                                       | Number of taps within `tapWindowMs` needed to toggle the overlay via the launcher or an attribute trigger. |
| `tapWindowMs`       | `number`                | `3000`                                    | Rolling window, in milliseconds, that taps must fall within to count toward `tapCount`. |
| `accent`            | `string`                | `'#e5484d'`                               | Overrides the `--rfn-accent` CSS custom property (see [Theming](#theming)). |

If both `launcher` and `hotkey` are disabled and no element on the page carries
`data-field-notes-trigger`, `<FieldNotes />` warns to the console — there would
otherwise be no way to open the overlay at all.

## Attribute triggers

Any element can become a tap target by adding `data-field-notes-trigger`,
independent of the launcher and hotkey:

```html
<div data-field-notes-trigger>
  <!-- seven taps anywhere in here (except on real controls) toggles the overlay -->
</div>
```

The contract:

- **Bare `data-field-notes-trigger`** counts a tap for any click landing inside
  the element, *except* one that lands on a real interactive descendant —
  `a, button, input, select, textarea, [role="button"], [contenteditable]` —
  so tapping a trigger wrapped around a whole screen doesn't eat your app's
  own buttons and links. A click on the trigger element itself always counts.
- **`data-field-notes-trigger="all"`** counts every click inside the element,
  including ones that land on those interactive descendants.
- **`data-field-notes-taps="N"`** overrides the tap count required for that
  specific element, instead of the global `tapCount` prop.

```html
<!-- five taps anywhere on this logo, including if it's a link -->
<img src="/logo.svg" data-field-notes-trigger="all" data-field-notes-taps="5" />
```

Trigger clicks are read from a capture-phase listener, so they work through
portals and are not affected by a host handler calling `stopPropagation`. The
host's own click handlers on the trigger still fire normally — nothing is
swallowed.

## Theming

The overlay's colors and shape come from CSS custom properties declared on
`:root`, with a dark default palette. Override any of them from your own
stylesheet to match your app:

```css
:root {
  --rfn-accent: #6366f1;
  --rfn-bg: #0b0b0d;
  --rfn-surface: #17171b;
  --rfn-surface-hover: #202024;
  --rfn-fg: #f4f4f5;
  --rfn-fg-muted: #a1a1aa;
  --rfn-border: #2a2a30;
  --rfn-radius: 10px;
  --rfn-shadow: 0 10px 30px rgb(0 0 0 / 0.4);
}
```

`--rfn-accent` can also be set at runtime via the `accent` prop, which is
handy when it should track a value only known at render time (a tenant's
brand color, for example).

## Enhanced context with react-grab

`react-grab` is an optional peer dependency. It is never a hard dependency —
`react-field-notes` builds its import specifier at runtime rather than
importing `react-grab` by name, so the package works and type-checks in
projects that haven't installed it at all.

**With `react-grab` installed**, notes captured on an element additionally
carry:

- the React component's display name, used as the note's label instead of a
  DOM tag description
- a `file:line` source reference for the component in the tree (its
  "component stack")

**Without it**, notes still capture everything else: a short DOM path to the
element, a text snippet, and its on-screen geometry — enough to locate and
describe what was annotated.

```bash
pnpm add -D react-grab
```

No further configuration needed — `react-field-notes` detects it automatically
and initializes it with its own overlay and hotkeys disabled, so only its
query API is used.

## Works inside modal dialogs

Annotating an element inside a modal dialog — Chakra UI v3, Ark, Radix, or
any dismissable-layer implementation with the same shape — works without
dismissing the dialog underneath. These libraries intercept "outside"
pointer and focus events at the window level to close the dialog; the overlay
registers its own capture-phase listeners first and shields its own subtree
so the dialog never sees them. Open a dialog, trigger the overlay, and tap an
element inside it — the dialog stays open and the note captures correctly.

## Dev-only, tree-shakes out of production

`<FieldNotes enabled={...} />` defaults `enabled` to
`process.env.NODE_ENV !== 'production'`. When `enabled` is `false` the
component renders `null` and does no work. Because the package has
`"sideEffects": false` and does no module-level side effects of its own, a
bundler that replaces `process.env.NODE_ENV` with `"production"` at build
time (Vite, webpack, Next.js, etc. all do this by default) can dead-code
eliminate the overlay's implementation entirely from a production bundle.

## License

MIT © Leroy Clarke Jr.
