# AGENTS.md

Platform-agnostic project instructions — usable by OpenAI Codex, Cursor, Windsurf, GitHub
Copilot, Claude Code, and any future agentic development tool. Claude Code should prefer
`CLAUDE.md` (a superset of this file with Claude-Code-specific MCP/slash-command detail);
every other tool should treat this file as authoritative.

## Project

**kaalbert.com** — the qualification-and-authority website for Kaalbert & Company Ltd, a
Ghana-rooted business advisory firm. Built around two conversion instruments — a public,
scored Business Health Check diagnostic completable in under six minutes, and an Insights
publishing engine — surrounded by three fee-transparent core offer pages, a capabilities
overview, and a full paid-advertising measurement layer so every enquiry traces back to the
page, article, or advertisement that produced it. See `docs/vision.md` for the full picture,
`docs/roadmap.md` and `docs/tasks/*.md` for what to build and in what order, `docs/
dashboard.md` for current status.

## Tech Stack

TypeScript on Node.js; Next.js (App Router) for the public site, diagnostic, and hand-built
`/admin` area; PostgreSQL via Prisma (Railway's bundled, always-on instance); Railway
hosting behind Cloudflare CDN/proxy (R2 for object storage once needed); Tailwind CSS v4
(CSS-first, no config file) + shadcn/ui on Base UI + Lucide icons; hand-built TOTP admin
auth; a custom in-app, data-driven diagnostic scoring engine; Google Tag Manager as the
single measurement container with a custom server-side Meta Conversions API integration;
Vitest + React Testing Library for unit/component tests, Playwright Test for end-to-end;
ESLint + Prettier; npm.

**The governing rule** (ADR 0001): packages and external APIs are building blocks inside
code this team writes and owns. No product — a CMS, a booking widget, a hosted checkout
page, an identity service — is ever allowed to own the admin UI, the data model, or the
routes. Infrastructure (hosting, database, CDN, storage) is the deliberate exception: running
custom code on a managed platform is not the same as depending on a pre-built product to
define what that code does.

## Architecture Rules

- Business logic lives in `lib/`, never in a route handler or component beyond calling into
  `lib/` and rendering the result.
- Every entity field named in a `docs/features/*.md` "Data requirements" section maps to a
  schema field of the same name.
- Diagnostic scoring configuration (questions/dimensions/weights/thresholds) is data; the
  scoring algorithm is a developer change — never blur that line.
- Fee amounts are always a structured min/max band + currency + scope cap — never a single
  number or free text.
- Firm-editable content (contact details, response-time commitment, fee bands, page copy) is
  never hard-coded — it lives in the database, edited via `/admin`.
- Do not build a Phase 2 (gated) capability until `docs/roadmap.md`/`scope.md` confirms its
  evidence trigger has been met — they are fully planned in `docs/tasks/10-16*.md`, but
  planned is not scheduled.
- Do not design or test the application as portable to a second hosting provider (ADR 0008).
- Do not hand-roll TOTP/password cryptography — a vetted library covers the cryptographic
  core only; everything around it is hand-built.
- Every UI task builds to its cited mockup under `ui/mockups/`, or the named inferred-from
  pattern in `ui/screen-inventory.md` — never invented layout.

## Coding Standards

- WCAG 2.1 AA is a hard requirement — use Base UI's primitives for interactive elements
  rather than hand-building ARIA/focus management.
- Lint: ESLint (`eslint-config-next`), must exit 0 across the whole tree. Format: Prettier.
  Type-check: `tsc --noEmit`, zero errors.
- Tests: Vitest for `lib/` logic and components; Playwright Test for end-to-end flows against
  a real running instance.
- Commit messages: `<type>(T##-##): <short description>` — types `feat`/`chore`/`fix`/
  `test`/`docs`/`refactor`. No co-authorship trailers. One commit per completed task, only
  after its full completion checklist passes.
- Agents never push to the remote directly — a human reviews with `git log --oneline` and
  pushes manually. This is the review gate between agent work and the remote repo.

## Knowledge Management Responsibilities

Agents must treat repository documentation as the primary source of truth.

When work changes project knowledge:

- Update memory/completed-work.md
- Update memory/decision-log.md when decisions are made
- Update memory/architecture-decisions.md when architectural decisions change
- Update docs/architecture.md when system architecture changes
- Update relevant feature specifications when requirements evolve
- Update memory/technical-debt.md when shortcuts or compromises are introduced
- Update memory/known-bugs.md when unresolved issues remain

Do not rely on conversation history as project memory.

Documentation and memory updates are part of task completion.

A task is not considered complete until required documentation updates have been made.

### Capture durable rules the moment you meet them (prevent knowledge loss)

As the project grows, hard-won facts get forgotten between sessions and the same
regressions recur. Whenever you discover — or the user gives you — a rule, gate,
convention, or gotcha that will matter beyond the current task, record it immediately in
the same session, in the right place:

- CLAUDE.md / AGENTS.md — for anything that changes how work is done every time: a required
  command/quality gate, a coding convention, a workflow step, a recurring pitfall.
- MEMORY.md (+ a memory/<slug>.md file) — for user preferences, feedback, and project
  facts not derivable from the code.
- memory/technical-debt.md / memory/known-bugs.md / memory/decision-log.md — for
  shortcuts, unresolved issues, and decisions respectively.

If you catch yourself thinking "I'll remember this" or "next time I should…", that is the
signal to write it down now. Prefer updating an existing entry over adding a duplicate.
Treat this capture step as part of task completion — a rule that only lives in the
conversation is already lost.

## Rollback/Revision Protocol

When a previous decision needs to be reversed or significantly changed during implementation:

1. Create a new ADR that supersedes the old one, with:
   - Status: "Superseded by ADR [N+1]"
   - Explanation of why the original decision is being reversed
   - New decision and reasoning
2. Update all affected artifacts (architecture.md, relevant feature specs, etc.)
3. Add an entry in `memory/decision-log.md` explaining the reversal and why
4. If the change affects tasks already completed, add a note to `memory/technical-debt.md` unless the work is being re-done immediately

Example ADR supersedence format:

```md
# ADR 5: [New Title]

Status: Accepted
Supersedes: ADR 2
Context: [Original ADR 2 decision is causing problems because...]
Decision: [New decision]
Consequences: [What changes, what remains]
```

This project's ADR 0009 (Phase 2 client-portal auth) is explicitly preliminary and must go
through this exact protocol the moment Phase 2 client-portal build work begins.

## Deprecation Handling

### When You Encounter a Deprecation

If you discover a deprecated API, pattern, or package during implementation:

1. **Note it in `memory/technical-debt.md`** with:
   - What is deprecated
   - The current recommended alternative
   - Impact level (critical/high/medium/low)
   - Timeline for migration (if known)

2. **Update this section** by adding a new row to the deprecation table below

3. **Update the affected documentation** to reflect the new recommended approach

4. **If the deprecation is critical**, create a new ADR documenting the migration decision

**Deprecation table:**

| Deprecated                        | Alternative | Impact | Migration timeline |
| --------------------------------- | ----------- | ------ | ------------------ |
| _(none yet — pre-implementation)_ |             |        |                    |

## Task Completion Checklist

Before marking work complete:

```
[ ] Implementation finished
[ ] Tests updated or created
[ ] Project linter/formatter passes with exit 0 across the whole tree, not just changed
    files (npm run lint && npm run format:check) — this is a hard gate. Fix pre-existing
    lint failures too, so the branch stays clean.
[ ] npx tsc --noEmit passes with zero errors
[ ] Prisma schema/client regenerated (npx prisma generate) if the schema changed
[ ] If this change touches a real, runnable interface, it was exercised for real against a
    running instance (Playwright, or this tool's equivalent real-browser/real-request
    capability) — not confirmed only by static analysis or mocked tests. If no such tool is
    usable this session, say so explicitly rather than silently skipping this step.
[ ] memory/completed-work.md updated
[ ] memory/decision-log.md updated (if applicable)
[ ] memory/technical-debt.md updated (if applicable)
[ ] memory/known-bugs.md updated (if applicable)
[ ] Session summary written to docs/sessions/session-NN-<topic>.md
[ ] git commit made with format: <type>(T##-##): <short description>
```

Work is not complete until all applicable items are addressed.

## Session Management

At the end of every working session — or when a conversation is getting long — automatically produce a session summary file without being asked.

### When to Write a Session File

- After completing one or more tasks
- When switching to a significantly different area of the codebase
- When the conversation context is becoming long
- When stopping work for the day

### How to Name the File

```
docs/sessions/session-NN-<short-topic>.md
```

Where `NN` is the next sequential number (check existing files in `docs/sessions/`) and
`<short-topic>` is 2–4 words describing what was done.

### Session File Format

```md
# Session NN — [Topic]

# Date: YYYY-MM-DD

# Tasks completed: T##-## [, T##-##]

## What Was Built

[2–3 sentences describing what was implemented this session.]

## Files Changed

- path/to/file.<ext> — what was added or changed

## Decisions Made

- [Any deviation from the plan, or choice between options, with one-line reasoning]
- [If none: "No deviations from plan."]

## Current State

[One sentence describing where the project stands.]

## Blockers

[Any unresolved issues, or "None."]

## Next Task

T##-## — [Task title]
File: docs/tasks/[epic-file].md

## Paste This to Continue

[The full self-contained implementation prompt for the next task — everything a fresh
session needs: task description, contract, acceptance criteria, relevant architecture
constraints/ADRs/feature spec/mockup reference, coding standards, and the completion
checklist — not a bare "read AGENTS.md and continue" line.]
```

### Rules for Session Files

- Write the session file **before** ending the conversation — not after.
- The "Paste This to Continue" block must be a complete, self-contained prompt, not a bare
  instruction — a new session pasting it should have everything needed to begin immediately.
- Never rely on conversation history to carry context between sessions; the session file is
  the handoff.
- If multiple tasks were completed in one session, list all of them and summarize all files
  changed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
