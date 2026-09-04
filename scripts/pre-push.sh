#!/usr/bin/env bash
# Quality gate enforced on every manual push, since agents never push directly
# (see CLAUDE.md's Git Commit Protocol). Install once, per developer machine:
#
#   ln -sf ../../scripts/pre-push.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
#
# (Not installed automatically — .git/hooks/ isn't tracked by git, so this file is the
# source of truth; symlink it in after `git init`/`git clone`.)

set -euo pipefail

echo "pre-push: lint"
npm run lint

echo "pre-push: format check"
npm run format:check

echo "pre-push: type-check"
npm run typecheck

echo "pre-push: unit tests"
npm run test

echo "pre-push: all gates passed"
