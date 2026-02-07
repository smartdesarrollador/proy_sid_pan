#!/usr/bin/env bash
# Hook: Sync CLAUDE.md "Custom Tools & Skills" section automatically.
# Triggers on Stop event. Scans .claude/ directories and updates CLAUDE.md
# with the actual list of skills, commands, agents, rules, and hooks.
# This is self-contained and does NOT depend on Claude following instructions.

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Read JSON event from stdin (required by hook protocol)
# ---------------------------------------------------------------------------
if [ ! -t 0 ]; then
  cat > /dev/null
fi

# ---------------------------------------------------------------------------
# 2. Determine project directory
# ---------------------------------------------------------------------------
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$PROJECT_DIR" || exit 0

CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
[ -f "$CLAUDE_MD" ] || exit 0

# ---------------------------------------------------------------------------
# 3. Check if .claude/ files changed (avoid unnecessary rewrites)
# ---------------------------------------------------------------------------
CLAUDE_DIR_CHANGES=""
CLAUDE_DIR_CHANGES="${CLAUDE_DIR_CHANGES}$(git diff --name-only HEAD -- .claude/ 2>/dev/null || true)"$'\n'
CLAUDE_DIR_CHANGES="${CLAUDE_DIR_CHANGES}$(git diff --cached --name-only -- .claude/ 2>/dev/null || true)"$'\n'
CLAUDE_DIR_CHANGES="${CLAUDE_DIR_CHANGES}$(git ls-files --others --exclude-standard -- .claude/ 2>/dev/null || true)"

CLAUDE_DIR_CHANGES=$(echo "$CLAUDE_DIR_CHANGES" | sort -u | sed '/^$/d' || true)

if [ -z "$CLAUDE_DIR_CHANGES" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Scan directories and collect items
# ---------------------------------------------------------------------------

# Skills: list subdirectory names under .claude/skills/
SKILLS=""
if [ -d "$PROJECT_DIR/.claude/skills" ]; then
  for d in "$PROJECT_DIR/.claude/skills"/*/; do
    [ -d "$d" ] || continue
    name=$(basename "$d")
    [ "$name" = "*" ] && continue
    SKILLS="${SKILLS:+$SKILLS, }$name"
  done
fi

# Commands: list .md files under .claude/commands/
COMMANDS=""
if [ -d "$PROJECT_DIR/.claude/commands" ]; then
  for f in "$PROJECT_DIR/.claude/commands"/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    COMMANDS="${COMMANDS:+$COMMANDS, }$name"
  done
fi

# Agents: list .md files under .claude/agents/
AGENTS=""
if [ -d "$PROJECT_DIR/.claude/agents" ]; then
  for f in "$PROJECT_DIR/.claude/agents"/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    AGENTS="${AGENTS:+$AGENTS, }$name"
  done
fi

# Rules: list .md files under .claude/rules/
RULES=""
if [ -d "$PROJECT_DIR/.claude/rules" ]; then
  for f in "$PROJECT_DIR/.claude/rules"/*.md; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .md)
    RULES="${RULES:+$RULES, }$name"
  done
fi

# Hooks: list .sh and .py files under .claude/hooks/
HOOKS=""
if [ -d "$PROJECT_DIR/.claude/hooks" ]; then
  for f in "$PROJECT_DIR/.claude/hooks"/*.sh "$PROJECT_DIR/.claude/hooks"/*.py; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    HOOKS="${HOOKS:+$HOOKS, }$name"
  done
fi

# ---------------------------------------------------------------------------
# 5. Build the replacement section
# ---------------------------------------------------------------------------
NEW_SECTION="## Custom Tools & Skills

- Skills: \`.claude/skills/\` (${SKILLS:-none})
- Commands: \`.claude/commands/\` (${COMMANDS:-none})
- Agents: \`.claude/agents/\` (${AGENTS:-none})
- Rules: \`.claude/rules/\` (${RULES:-none})
- Hooks: \`.claude/hooks/\` (${HOOKS:-none})
- See \`.claude/README.md\` for full configuration reference"

# ---------------------------------------------------------------------------
# 6. Replace section in CLAUDE.md using awk
#    Handles both mid-file sections and end-of-file sections.
# ---------------------------------------------------------------------------
awk -v new_section="$NEW_SECTION" '
BEGIN { in_section = 0; printed = 0 }
/^## Custom Tools & Skills/ {
  printf "%s\n", new_section
  in_section = 1
  printed = 1
  next
}
in_section && /^## / {
  in_section = 0
  print
  next
}
in_section { next }
!in_section { print }
' "$CLAUDE_MD" > "${CLAUDE_MD}.tmp"

# Verify the tmp file is not empty and has content
if [ -s "${CLAUDE_MD}.tmp" ]; then
  mv "${CLAUDE_MD}.tmp" "$CLAUDE_MD"
fi

exit 0
