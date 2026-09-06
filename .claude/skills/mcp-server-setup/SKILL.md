---
name: mcp-server-setup
description: MANDATORY before adding, removing, or troubleshooting any MCP server in this project, or before answering "should server X be enabled" — has the .mcp.json location/verification steps, the verification-tool choice for this project's type, per-server setup instructions, and the optional-servers list. Trigger on any MCP connection failure or any request touching server configuration.
---

This project uses MCP (Model Context Protocol) servers to extend agent capabilities.

**Config file location — do not get this wrong:** Claude Code's actual project-scope MCP
config file is **`.mcp.json` at the repository root.** It is _not_ `.claude/mcp.json` or
anything else under `.claude/` — Claude Code does not read any file in that directory for
server registration. A project whose config lives at the wrong path will have every server
silently fail to appear, with no error surfaced to the agent.

**Verify the file is actually being read** as part of setup: run `claude mcp list` in a
plain terminal, not nested inside an agent's own Bash tool. A correctly-registered server
shows as connected or **"⏸ Pending approval (run `claude` to approve)"**; a server absent
from the list entirely means the file is in the wrong place or isn't valid JSON.

**Newly added or changed servers need two things before they're usable:** a session
restart, _and_ explicit approval at the resulting startup prompt — an editing agent cannot
do either from inside its own session, so both fall to the human operator every time this
file changes.

## Essential Servers (Always Enabled)

These servers are configured in the root `.mcp.json` and should remain enabled:

- **Filesystem**: Required for reading and writing project files. Do not disable.
- **GitHub**: Required for version control operations (once the repo has a GitHub remote —
  omit/remove this server's block from `.mcp.json` until then, since it needs a real
  `GITHUB_PERSONAL_ACCESS_TOKEN`). Do not disable once added.
- **Database (PostgreSQL)**: Schema inspection and debugging against Railway's Postgres.
  Keep enabled — this project is DB-backed throughout.
- **Playwright MCP**: Verifies every real page/flow for real — the diagnostic's multi-step
  flow, the admin CMS usability bar (AC-6), cross-browser functional walkthroughs (AC-8).
  On by default per `docs/research/verification-tooling.md` — this project's stated,
  non-optional choice for a web app, over the deprecated Puppeteer MCP server.

## Choosing a Verification Tool by Project Type

This project is a **web app** (server-rendered/SPA via Next.js), so the configured
verification tool is **Playwright MCP** (`@playwright/mcp`), enabled by default in
`.mcp.json`. "It typechecks and the unit tests pass" is not the same claim as "I ran it and
watched it work" — every task that touches a real page, form, or admin screen must be
exercised through Playwright MCP before being called done (see the Task Completion
Checklist in CLAUDE.md).

**Setup:**

- Present in `.mcp.json` by default (see below) — no extra setup step for an agent to
  remember to turn it on.
- Points at a browser already installed on the build host via `--executable-path`, rather
  than assuming a fresh Chromium download succeeds in every sandboxed environment. If no
  system browser is available, fall back to `npx playwright install chromium` once, ahead of
  time, and drop `--executable-path`.
- **Adding/changing this server takes effect only after a session restart AND human
  approval at the startup prompt** — an agent that just edited `.mcp.json` cannot use the new
  tool in that same conversation; fall back to `curl`/direct shell invocation for the current
  task and leave the tool ready for the next session.
- Core operations an agent will use most: navigate to a URL, click, type/fill a form,
  snapshot the accessibility tree, screenshot a region for visual claims — see the tool's own
  descriptions when it's loaded; don't re-derive its interface from scratch each session.

To actually verify a change against the real running project:

1. Start the dev server: `npm run dev` (or use an already-running instance — check before
   starting a second one).
2. Use Playwright MCP to navigate to the real route you changed, interact with it as a real
   visitor or partner would (click through the diagnostic flow, submit a form, log into
   `/admin`, edit an offer), and confirm the actual rendered/functional result — not just
   that a test file passes.
3. For a visual/layout claim specifically, take a screenshot or read computed styles rather
   than re-reading the source and asserting it must look right — source and rendered output
   have diverged before on this project.
4. If Playwright MCP isn't usable in the current session (e.g. it was just added to
   `.mcp.json` and needs the restart+approval step a human must do), say so explicitly and
   fall back to the next-best real check (`curl` against an API route, manually inspecting a
   dev-server response) — never silently skip verification or claim it was done.

## Optional Servers (Enable When Needed)

Not present in `.mcp.json` today. Add each one's real JSON block only at the point it's
actually needed, then restart + approve:

- **Sequential Thinking**: for complex architectural decisions or multi-step refactoring.
- **Fetch**: for reading external documentation or API references.
- **Linear** or **Jira**: for issue tracking integration, if the firm/vendor adopts one.
- **Figma**: for design token/spec reading, if mockups ever move into Figma instead of
  staying as the HTML files under `ui/mockups/`.

## Server Setup Instructions

**Filesystem Server:**

```bash
npm install -g @modelcontextprotocol/server-filesystem
```

No additional configuration required.

**GitHub server** (once a remote exists):

```bash
npm install -g @modelcontextprotocol/server-github
```

Set `GITHUB_PERSONAL_ACCESS_TOKEN` in your real shell environment (`~/.bashrc`/`~/.zshrc`),
then reference it in `.mcp.json` via `${GITHUB_PERSONAL_ACCESS_TOKEN}` — never a literal
token value or placeholder string. (This project actually uses `${KAALBERT_GITHUB_TOKEN}` as
the env var name — same pattern, project-specific name.)

**Database Server (PostgreSQL):**

```bash
npm install -g @modelcontextprotocol/server-postgres
```

Set `DATABASE_URL` in your real shell environment and reference it as `${DATABASE_URL}` in
`.mcp.json` — same rule as above.

**Playwright MCP:**

```bash
# No global install needed — .mcp.json runs it via npx, e.g.:
npx -y @playwright/mcp@latest --browser chrome --executable-path <path-to-installed-browser> --headless --isolated
```

Adjust `--browser`/`--executable-path` to whatever browser is actually installed on the
build host.

## When to Use MCP Servers

- Always start with the Filesystem server enabled.
- Enable the GitHub server once this repo has a real remote and PRs are in play.
- Enable the Database server when debugging data issues or inspecting schema state.
- Use Playwright MCP whenever a task's completion checklist calls for confirming a change
  actually works — it's enabled by default, no extra setup needed.
- Enable other (Optional) servers only when their specific capabilities are required.

## MCP Discipline

- Remove servers not actively in use from `.mcp.json` entirely to reduce context noise —
  except Filesystem and Playwright MCP, which stay present by default.
- Never use MCP servers to modify production data or infrastructure.
- Prefer reading from the Filesystem over relying on conversation history.
