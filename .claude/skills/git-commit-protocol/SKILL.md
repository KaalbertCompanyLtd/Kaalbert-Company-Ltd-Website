---
name: git-commit-protocol
description: MANDATORY before running `git commit` in this repo — has the exact required message format (`<type>(T##-##): <description>`), what to stage, and what never gets committed. Invoke immediately before every commit; do not guess the format from memory or generic conventions.
---

## When to commit

Commit once per completed task — after every item in the Task Completion
Checklist (CLAUDE.md) has been satisfied. Never commit mid-task, never commit
untested code, never commit to fix a previous broken commit.

The commit sequence for every task is:

1. All checklist items pass
2. `git add` only the files changed by this task
3. `git commit` with the message format below
4. Write the session summary file
5. Stop — do not begin the next task in the same session

## Commit message format

```
<type>(<id>): <short description>
```

Types: `feat` (feature/capability), `chore` (setup/config/scaffolding),
`fix` (bug fix), `test` (tests only), `docs` (memory/session files),
`refactor` (restructuring without behaviour change).

`<id>` is one of three forms, mechanically enforced by
`.claude/hooks/validate-commit-message.py`:

- **`T##-##`** — a real task from `docs/tasks/*.md`. This is the default and normal case —
  the same task ID as the dotted `T[milestone].[task]` form used throughout
  `docs/roadmap.md` and `docs/tasks/*.md` (e.g. `T3.7`) — one ID, two representations for
  two contexts. Commit messages, session summary files, and memory entries always use the
  zero-padded dash form; never let a commit message drift to the dotted form or a doc
  cross-reference drift to the dash form.
- **`P#-#`** — a Phase 2 gated-capability ID from `docs/scope.md`/`docs/roadmap.md` (e.g.
  `P2-8`), used only for pre-task scoping/planning work on that capability (writing its
  feature spec, ADR, roadmap entry, epic file) — never for actually building it, since
  Phase 2 capabilities stay gated until their trigger is met (see "Things NOT to Do" in
  CLAUDE.md).
- **`process`** — a session that changes project process/tooling/scaffolding itself
  (CLAUDE.md, skills, hooks, memory-file conventions) with no task or capability
  attachment. Established at the session that first split CLAUDE.md into skills and added
  the commit-message hook (see `memory/decision-log.md`).

Examples:

```
chore(T01-01): scaffold Next.js app and deploy pipeline
feat(T03-05): add diagnostic submit endpoint with server-side scoring
test(T03-02): add scoring engine unit tests for threshold edge cases
docs(T02-01): update memory/completed-work.md for session 03
chore(T01-02): regenerate Prisma client after schema migration
docs(P2-8): scope and sequence Subscriber Outreach via Brevo Campaigns into Phase 2
docs(process): align project with updated planning framework
```

## Co-authorship trailer

Never add `Co-Authored-By:` trailers to commit messages. Commit messages
contain only the type, task ID, and description. Nothing else. This is a
deliberate, explicit project decision (not an oversight) — this project's
commit-message-format hook (`.claude/hooks/validate-commit-message.py`)
mechanically enforces it, so a commit carrying this trailer will be rejected
regardless of any other default in play for the current session.

## What to include in the commit

Include only files directly produced by this task: implementation files,
test files, migration files, memory file updates, session summary file.
Any generated artifacts (Prisma client, etc.) get their own separate commit,
e.g. `chore(T##-##): regenerate Prisma client and migration`.

## What never gets committed

Secrets and local-only files (`.env`, `.env.local`, `CLAUDE.local.md`) and build/dependency
artifacts (`node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`) — all covered by
`.gitignore`. Never include files from a different task in the same commit.

## Pushing to remote

`git push` must be blocked in `.claude/settings.json`. Claude Code commits
locally only. The developer reviews with `git log --oneline` and pushes
manually. This is the review gate between agent work and the remote repo.
