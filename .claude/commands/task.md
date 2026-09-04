---
description: Generate a complete, self-contained implementation prompt for a task ID, ready to paste into a fresh session
argument-hint: T##-##
---

Generate an implementation prompt for task `$ARGUMENTS`. Output **only** the prompt block
below, fully filled in — no preamble, no explanation, nothing before or after it. The output
must be ready to copy and paste directly into a new Claude Code session and be immediately
actionable with zero other files read first.

To fill it in:

1. Find the epic file in `docs/tasks/` whose filename matches `$ARGUMENTS`'s epic number
   (e.g. `T03-05` → `docs/tasks/03-diagnostic.md`), and locate that specific task entry
   within it.
2. Read the full epic file (not just the one task) for shared context (the epic's opening
   paragraph, and any task this one depends on).
3. Identify every ADR this task's domain touches (check `docs/adr/` — e.g. a diagnostic task
   touches ADR 0005; an auth task touches ADR 0007; any UI task touches ADR 0010) and read
   each one.
4. Identify the relevant `docs/features/*.md` file(s) for this task's domain, or note
   explicitly that none applies (a pure-infrastructure task).
5. If the task cites a mockup file under `ui/mockups/`, resolve its exact path. If it cites
   an "inferred from" pattern instead, resolve which built screen that refers to.
6. Read `docs/roadmap.md`'s entry for this task's milestone, for one-sentence sequencing
   context (why this task is where it is).

Then emit exactly this structure, with every bracketed placeholder replaced by real content
(never left as a placeholder in the final output):

```
Read CLAUDE.md in full before starting anything else in this session — it defines the tech
stack, code conventions, quality gates, auth pattern, and the Task Completion Checklist and
Git Commit Protocol this task must follow exactly.

Then read the full epic file: docs/tasks/[epic-filename].md — this task is one part of a
larger epic; the epic's opening paragraph and any task listed as a dependency below give
context this prompt summarizes but does not replace.

# Task [Task ID] — [Task title]

## What to build
[The task's "Build:" line, copied verbatim from the epic file.]

## Input → Output contract
[The task's "Input → Output:" line, copied verbatim.]

## Acceptance criteria
[The task's "Acceptance criteria:" line, copied verbatim.]

## Size / Dependencies
[Size], depends on: [Dependencies — list each dependency task ID and, in one clause each,
what it provides that this task needs.]

## Architecture constraints
[Every relevant rule from CLAUDE.md's Code Conventions and Things NOT to Do sections that
applies to this specific task's domain — not the whole file, just what's relevant, quoted or
tightly paraphrased.]

## Relevant ADRs
[For each: "ADR NNNN — docs/adr/NNNN-slug.md — one-sentence statement of the decision this
task must follow."]

## Relevant feature specification
[Path to docs/features/[name].md, or: "No feature specification applies — this is an
infrastructure/scaffolding task."]

## Mockup / UI reference
[Exact path under ui/mockups/ this task builds to, or: "No dedicated mockup — infer from
[specific built screen path], per ui/screen-inventory.md's mapping," or: "Not applicable —
this task has no UI surface."]

## Coding standards
[Full list from CLAUDE.md's Code Conventions and Recurring Patterns sections, each annotated
inline with "(applies)" or "(not applicable to this task)" so nothing is silently skipped or
silently over-applied.]

## Task Completion Checklist
[The full checklist from CLAUDE.md's Task Completion Checklist section, copied verbatim.]

## Session boundary
Complete this task fully, then write the session summary file (docs/sessions/session-NN-
<topic>.md per CLAUDE.md's Session Management section) with the output of /task
[NEXT_TASK_ID] in its "Paste This to Continue" block, then stop. Do not begin the next task
in this same session.
```

If `$ARGUMENTS` is missing, malformed, or doesn't match any task in `docs/tasks/`, do not
guess — output a one-line error naming the exact problem instead of the prompt block.
