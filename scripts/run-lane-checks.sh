#!/usr/bin/env bash
# run-lane-checks.sh: verifier of one web lane (plans/261015-student-code-editor, Phase 0).
#
# Usage: bash scripts/run-lane-checks.sh [test files...]
#   Test files may be repo-relative (src/lib/x.test.ts) or workspace-relative (web/src/lib/x.test.ts); they run
#   first for fast feedback, then the full suite.
#
# Steps (stops at the first failure and prints which step failed):
#   1. npx vitest run <given files>
#   2. npx vitest run
#   3. npx tsc --noEmit
#   4. npm run lint
# NEVER `next build` / `next start` here: lane worktrees symlink node_modules to the main checkout, and a build
# there rewrites the shared node_modules.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 2

STEP="setup"
fail() {
  echo "[run-lane-checks] FAILED at step: $STEP" >&2
  exit 1
}
log() { echo "[run-lane-checks] $*"; }

[ -e node_modules ] || { echo "[run-lane-checks] no node_modules in $ROOT (symlink it to the main web checkout)" >&2; exit 2; }

if [ "$#" -gt 0 ]; then
  STEP="1 vitest (given files)"
  files=()
  for f in "$@"; do
    f="${f#web/}"
    f="${f#./}"
    [ -e "$f" ] || { STEP="1 resolve test file $f"; echo "[run-lane-checks] no such test file: $f" >&2; fail; }
    files+=("$f")
  done
  log "$STEP: ${files[*]}"
  npx vitest run "${files[@]}" || fail
fi

STEP="2 vitest run (full suite)"
log "$STEP"
npx vitest run || fail

STEP="3 tsc --noEmit"
log "$STEP"
npx tsc --noEmit || fail

STEP="4 npm run lint"
log "$STEP"
npm run lint || fail

log "all steps passed"
