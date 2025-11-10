#!/usr/bin/env bash
set -euo pipefail

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Checking for merge conflicts..."
else
  echo "Not inside a git repository" >&2
  exit 1
fi

conflict_index=$(git ls-files -u)
conflict_markers=$(rg --files-with-matches '^(<{7}|={7}|>{7})' || true)

if [[ -z "${conflict_index}" && -z "${conflict_markers}" ]]; then
  echo "No merge conflicts detected in tracked files."
else
  if [[ -n "${conflict_index}" ]]; then
    echo "Files with staged conflict entries:"
    printf '%s\n' "$conflict_index"
  fi
  if [[ -n "${conflict_markers}" ]]; then
    echo "Files containing conflict markers:"
    printf '%s\n' "$conflict_markers"
  fi
  exit 2
fi
