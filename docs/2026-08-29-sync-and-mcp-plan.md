# Field Notes Sync + MCP — plan

Date: 2026-08-29
Status: plan, not yet approved for implementation

## The idea in one line

Notes captured in the browser reach a coding agent over MCP, so the person
annotating and the agent doing the work no longer have to be the same person on
the same machine at the same time.

## Why this is worth building

Removing a clipboard step saves about two seconds and is not, on its own, worth
building or paying for. What the network hop actually buys is that the clipboard
**cannot cross devices or people**, and this can:

- Annotate a staging build on a phone; the agent on the laptop picks it up.
- A non-technical reviewer (a client, a PM) files notes without running an agent.
- Notes outlive the session that made them.

**The differentiator is `file:line`.** Existing visual-feedback tools — BugHerd,
Marker.io, Pastel, Userback — produce a screenshot plus a sentence plus a ticket
a human must interpret. Because this package reads the React tree via react-grab,
its output is a component name and a source location: a work order an agent can
execute directly. A screenshot-based tool cannot retrofit that without rebuilding
its capture layer.

Positioning follows from that: **not "feedback tool with AI", but "the feedback
tool whose output is executable."**

## v1 scope

Decided:

- **Audience: one person — me, across my own devices.** No multi-tenant auth, no
  seats, no invite flow, no reviewer UI to polish.
- **Transport: explicit send, then agent pulls.** Notes stay local until a
  "Send" action pushes the batch. The agent reads them when asked. This keeps the
  offline-first behaviour the package already has, keeps the server to plain
  REST with no streaming, and preserves curation before anything ships.

Explicitly **not** in v1: a dashboard, guest links, Linear/GitHub/Notion
adapters, framework adapters beyond React, any billing, any second user.

The dashboard originally imagined is deliberately deferred. With a single user
and an agent consuming notes directly, a web UI to look at them is a debugging
tool, not a product surface. Build it when a second person needs to see notes.

## Architecture

Three pieces, two of them new.

### 1. `react-field-notes` — optional sync adapter (existing OSS package)

Stays fully functional with no server. Sync is additive and opt-in:

```tsx
<FieldNotes
  sync={{ endpoint: 'https://notes.example.workers.dev', token: '…' }}
/>
```

- Without `sync`, behaviour is exactly as today: localStorage plus markdown on
  the clipboard.
- With `sync`, the note list gains a **Send** action beside **Copy all**.
- Sending POSTs the batch, marks those notes as sent locally, and leaves them in
  place. Failure leaves them unsent and retryable — no silent data loss.

This is the only change to the published package, and it must not regress the
offline path.

### 2. `field-notes-server` — Cloudflare Worker (new repo)

- `POST /api/notes` — accepts a batch, authenticated by a bearer token.
- MCP endpoint over HTTP, same token.
- Storage: D1. A single-user note store is a table, not a coordination problem;
  Durable Objects would be reaching for concurrency guarantees nothing needs yet.

MCP tools:

| Tool | Purpose |
| --- | --- |
| `list_notes(status?)` | Open notes, newest first, grouped by route |
| `get_note(id)` | Full detail including `componentStack` and element summaries |
| `resolve_note(id, summary?, commit?)` | Mark fixed and record what was done |

`resolve_note` is what makes this a loop rather than an inbox, and it is cheap to
add at the same time as the reads. Include it in v1.

### 3. Agent side — configuration only

Add the MCP server URL and token to the agent's config. No code.

## Build order

Each phase is independently useful and independently abandonable.

**Phase 1 — Worker skeleton and ingest.** D1 schema, `POST /api/notes` with
bearer auth, deployed. Verified by curling a batch and reading the row back.
No package changes yet.

**Phase 2 — Sync adapter in the package.** The `sync` prop, the Send action,
sent-state tracking, retry on failure. Verified end to end: annotate on a phone
against staging, see rows land in D1.

**Phase 3 — MCP read tools.** `list_notes` and `get_note`. Verified by
connecting Claude Code and asking it to act on a note captured from the phone.
**This is the phase where the idea either proves itself or does not** — everything
before it is plumbing, and everything after it is refinement.

**Phase 4 — Round-trip.** `resolve_note`, plus surfacing resolved state in the
note list so the phone shows what has been fixed.

Stop after Phase 3 and use it for a week before building Phase 4. If the loop
does not feel better than copy-paste in real use, the honest answer is that the
premise was wrong and the remaining phases should not be built.

## Known problems to solve, not hand-wave

1. **The phone needs a reachable build.** `enabled` defaults to
   `NODE_ENV !== 'production'`, so a staging deploy has the overlay compiled out.
   Annotating staging from a phone requires passing `enabled` explicitly on that
   environment, and being deliberate that this ships the overlay to anyone who
   can reach staging.

2. **The token lives in the client bundle.** Anyone who can load the staging app
   can read it and post notes. Acceptable for a single-user staging tool; it is
   not acceptable the moment a real client build is involved. Fixing it properly
   means short-lived tokens or an auth handshake — deferred, but the constraint
   should be written down rather than discovered later.

3. **Notes reference code that moves.** A note captured against one commit may
   point at a line that has since shifted. Store the commit SHA or build ID with
   the note if it is available, so the agent can tell when a reference is stale.

4. **MCP is a moving target.** Pin to the current spec, expect to revise, and keep
   the tool surface small so revisions are cheap.

## On charging for it

The instinct to sell this at $9.99/month is worth interrogating before it shapes
the build.

Individual developers are among the hardest markets in software: low willingness
to pay, high churn, and heavy competition from tools bundled into editors and
agents that are moving fast enough to absorb this capability outright.

The value here spikes specifically when a **second person** is involved — a
client annotating a build, a PM filing notes without an agent. That suggests
pricing on collaboration rather than on usage: the local package free forever,
payment beginning when someone who is not you is invited.

**The stronger near-term play may not be SaaS at all.** For an agency, "annotate
our staging build and our AI fixes it overnight" is a capability that wins work
and justifies rate — with distribution that already exists, no marketing spend,
no support burden, and no competition to defend against. A subscription product
is a second business; a client-facing differentiator is leverage on the one
already running.

These are not mutually exclusive, but they imply different second phases. v1 is
identical either way, which is the main argument for building v1 first and
deciding this later with real usage data.

## Open questions

- Where does the sent/unsent state live — a flag on the existing `FieldNote`, or
  a separate synced-ids list? Affects the storage schema and the migration story
  for notes already in localStorage.
- Should `list_notes` mark notes as delivered, or is delivery tracked only by
  `resolve_note`? Marking on read is simpler but loses the ability to re-read.
- Is a route/build filter needed on `list_notes` in v1, or is newest-first enough
  at single-user volume?
