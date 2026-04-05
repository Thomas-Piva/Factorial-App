#!/usr/bin/env bash
# PreToolUse hook: block dangerous Bash patterns.
# Reads CLAUDE_TOOL_INPUT from stdin (JSON with a "command" field).

set -euo pipefail

cmd=$(echo "$CLAUDE_TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))")

DANGER_PATTERNS=(
  'rm -rf /'
  'DROP TABLE'
  'DROP DATABASE'
  '> /etc/passwd'
  'chmod 777 /'
  '> /dev/'
)

for danger in "${DANGER_PATTERNS[@]}"; do
  if echo "$cmd" | grep -qF "$danger"; then
    echo "BLOCKED: dangerous pattern detected: $danger" >&2
    exit 2
  fi
done

exit 0
