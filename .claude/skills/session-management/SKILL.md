---
name: session-management
description: MANDATORY before writing a docs/sessions/session-NN-*.md file — has the exact filename numbering convention and the required markdown template, including the "Paste This to Continue" block. Invoke the moment you're about to end a session or write its summary; do not freehand the format.
---

At the end of every working session — or when a conversation is getting long — automatically produce a session summary file without being asked.

## When to Write a Session File

- After completing one or more tasks
- When switching to a significantly different area of the codebase
- When the conversation context is becoming long
- When stopping work for the day

## How to Name the File

```
docs/sessions/session-NN-<short-topic>.md
```

Where `NN` is the next sequential number (check existing files in `docs/sessions/` to determine it) and `<short-topic>` is 2–4 words describing what was done.

Examples:

- `session-01-django-init.md`
- `session-02-user-model-auth.md`
- `session-03-project-milestone-api.md`

## Session File Format

````md
# Session NN — [Topic]

# Date: YYYY-MM-DD

# Tasks completed: T##-## [, T##-##]

## What Was Built

[2–3 sentences describing what was implemented this session.]

## Files Changed

- path/to/file.<ext> — what was added or changed
- path/to/another — what was added or changed
- ...

## Decisions Made

- [Any deviation from the plan, or choice between options, with one-line reasoning]
- [If none: "No deviations from plan."]

## Current State

[One sentence describing where the project stands, e.g. "Core module scaffolded and unit-tested, ready for T01-03."]

## Blockers

[Any unresolved issues, or "None."]

## Next Task

T##-## — [Task title]
File: docs/tasks/[epic-file].md

## Paste This to Continue

```
[Output of /task T##-## goes here — the full generated prompt for the next task,
not a bare instruction. Run /task [NEXT_TASK_ID] and paste its entire output here.]
```
````

## Rules for Session Files

- Write the session file **before** ending the conversation — not after
- The "Paste This to Continue" block must contain the full output of `/task [NEXT_TASK_ID]` — not a bare "read CLAUDE.md and continue" line. Run the `/task` command for the next task and paste its complete output into the block.
- A new Claude Code session pasting the block gets full task context, architecture constraints, acceptance criteria, coding standards, and documentation requirements — everything needed to begin immediately without reading additional files first.
- Never rely on the conversation history to carry context between sessions; the session file is the handoff
- If multiple tasks were completed in one session, list all of them under "Tasks completed" and summarize all files changed
- **The session file is a living document for the rest of that session, not a one-time
  write.** Once it exists, re-sync it — in the same turn, without being asked — every time
  something happens that would make it stale: a new commit, a resolved or newly-discovered
  blocker, a decision made, a file touched that isn't yet listed, a `memory/*.md` update.
  Concretely: after every commit past the first one in a session, check whether "What Was
  Built," "Files Changed," "Decisions Made," "Current State," and "Blockers" still match
  reality, and fix whichever don't — don't let the file freeze at whatever the state was
  when it was first written. A session file that only reflects the session's opening state
  is functionally the same as not having one, for anything that happened after.
