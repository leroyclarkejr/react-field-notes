# Third-party notices

`react-field-notes` ships with zero runtime dependencies. This file records
the third-party work it builds on, both what is bundled into `dist/` and what
it integrates with at runtime.

---

## Lucide — bundled

`src/icons.tsx` contains seven inline SVG icon components whose path data is
adapted from [Lucide](https://lucide.dev). This path data is compiled into
`dist/index.js`, so its licenses travel with this package.

Four of the seven are Lucide icons that originate in the
[Feather](https://feathericons.com) project and carry Feather's MIT license in
addition to Lucide's ISC:

| Component in this package | Lucide icon | Applicable license |
| --- | --- | --- |
| `IconCheck` | `check` | ISC (Lucide) + MIT (Feather) |
| `IconSquare` | `square` | ISC (Lucide) + MIT (Feather) |
| `IconTrash` | `trash-2` | ISC (Lucide) + MIT (Feather) |
| `IconX` | `x` | ISC (Lucide) + MIT (Feather) |
| `IconList` | `list` | ISC (Lucide) |
| `IconPointer` | `mouse-pointer` | ISC (Lucide) |
| `IconSquarePen` | `square-pen` | ISC (Lucide) |

### ISC License — Lucide

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### MIT License — Feather

Applies to the four Feather-derived icons listed above.

```
The MIT License (MIT)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## react-grab — optional peer dependency, not bundled

**[react-grab](https://react-grab.com)** by **Aiden Bai** — MIT licensed,
<https://github.com/aidenybai/react-grab>

react-grab is not bundled into this package and is never required. When a host
application has it installed, `react-field-notes` calls two methods on its
public API — `getDisplayName(element)` and `getStackContext(element)` — to
enrich a note with the React component's display name and its `file:line`
source references. Without it, notes fall back to a DOM path, an element
label, a text snippet and geometry.

That enrichment is what makes a note directly actionable by a coding agent:
it turns "the button in the header" into a component name and a source
location. This package would be substantially less useful without react-grab,
and the credit for that capability belongs to its author.

```
MIT License

Copyright (c) 2025 Aiden Bai

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## React — peer dependency, not bundled

**[React](https://react.dev)** — MIT licensed, Copyright (c) Meta Platforms, Inc.
and affiliates. Declared as a peer dependency and provided by the host
application; no React code is bundled into this package.
