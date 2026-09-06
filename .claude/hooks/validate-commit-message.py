#!/usr/bin/env python3
"""PreToolUse hook (matcher: Bash) enforcing this project's Git Commit Protocol.

Blocks a `git commit` whose message header doesn't match
`<type>(<id>): <short description>` (types: feat, chore, fix, test, docs, refactor; `<id>` is
a real task ID `T##-##`, a Phase 2 capability ID `P#-#` for pre-task scoping/planning work
like P2-8, or the literal `process` for framework/tooling/process-only sessions with no
task or capability attachment), or whose message contains a `Co-Authored-By` trailer
(explicitly forbidden in CLAUDE.md's Git Commit Protocol / the git-commit-protocol skill,
regardless of any attribution default a given session otherwise carries).

Never blocks on its own parsing uncertainty: anything that isn't a `git commit` invocation,
is a `--amend`, or whose message can't be confidently extracted is allowed silently.
"""

import json
import re
import sys

TYPE_PATTERN = re.compile(
    r"^(feat|chore|fix|test|docs|refactor)\((T\d{2}-\d{2}|P\d+-\d+|process)\): .+"
)


def extract_commit_message(command: str) -> str | None:
    # Heredoc form: git commit -m "$(cat <<'EOF' ... EOF)"
    heredoc = re.search(
        r"<<[-]?\s*['\"]?(\w+)['\"]?\s*\n(.*?)\n\s*\1\b",
        command,
        re.DOTALL,
    )
    if heredoc:
        return heredoc.group(2)

    # -m "..." (double-quoted, first occurrence — the header/body start)
    m = re.search(r'-m\s+"((?:[^"\\]|\\.)*)"', command)
    if m:
        return m.group(1).replace('\\"', '"')

    # -m '...' (single-quoted)
    m = re.search(r"-m\s+'((?:[^'\\]|\\.)*)'", command)
    if m:
        return m.group(1)

    return None


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return

    if data.get("tool_name") != "Bash":
        return

    command = (data.get("tool_input") or {}).get("command", "") or ""

    if not re.search(r"\bgit\s+commit\b", command):
        return

    if re.search(r"--amend\b", command):
        return

    message = extract_commit_message(command)
    if message is None:
        return

    first_line = message.strip().split("\n", 1)[0].strip()

    problems = []

    if not TYPE_PATTERN.match(first_line):
        problems.append(
            "Commit message header does not match the required "
            "'<type>(<id>): <description>' format (types: feat, chore, fix, test, docs, "
            "refactor; <id> is a task ID T##-##, a Phase 2 capability ID P#-#, or the "
            f"literal 'process'). Got: {first_line!r}. See the git-commit-protocol skill."
        )

    if re.search(r"co-authored-by", message, re.IGNORECASE):
        problems.append(
            "Commit message contains a 'Co-Authored-By' trailer — this project's Git Commit "
            "Protocol explicitly forbids it (see the git-commit-protocol skill), regardless "
            "of any attribution default the current session otherwise carries."
        )

    if problems:
        deny(" ".join(problems))


if __name__ == "__main__":
    main()
