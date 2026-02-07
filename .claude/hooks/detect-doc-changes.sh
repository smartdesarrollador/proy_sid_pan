#!/usr/bin/env bash
# Auto-documentation hook for Claude Code (Stop event)
# Detects source file changes and instructs Claude to update affected docs.
# Exit codes: 0 = stop normally, 2 = continue with instructions on stderr.

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Read JSON event from stdin
# ---------------------------------------------------------------------------
INPUT_JSON=""
if [ -t 0 ]; then
  INPUT_JSON="{}"
else
  INPUT_JSON="$(cat)"
fi

# ---------------------------------------------------------------------------
# 2. Guard: require jq and git
# ---------------------------------------------------------------------------
if ! command -v jq &>/dev/null; then
  exit 0
fi
if ! command -v git &>/dev/null; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 3. Determine project directory
# ---------------------------------------------------------------------------
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$PROJECT_DIR" || exit 0

# Verify we are inside a git repository
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Anti-loop layer 1: stop_hook_active field in event JSON
# ---------------------------------------------------------------------------
HOOK_ACTIVE=$(echo "$INPUT_JSON" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
if [ "$HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 5. Anti-loop layer 2: session-based temp file
# ---------------------------------------------------------------------------
SESSION_ID=$(echo "$INPUT_JSON" | jq -r '.session_id // empty' 2>/dev/null || true)
if [ -z "$SESSION_ID" ]; then
  SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
fi

LOCK_FILE="/tmp/claude-doc-hook-${SESSION_ID}"

if [ -f "$LOCK_FILE" ]; then
  rm -f "$LOCK_FILE"
  exit 0
fi

# ---------------------------------------------------------------------------
# 6. Collect changed files via git
# ---------------------------------------------------------------------------
MODIFIED=$(git diff --name-only HEAD 2>/dev/null || true)
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)

# Combine and deduplicate
ALL_CHANGES=$(printf '%s\n%s\n%s' "$MODIFIED" "$STAGED" "$UNTRACKED" | sort -u | grep -v '^$' || true)

if [ -z "$ALL_CHANGES" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 7. Anti-loop layer 3: exclude doc-only changes
# ---------------------------------------------------------------------------
NON_DOC_CHANGES=$(echo "$ALL_CHANGES" | grep -v -E '^(docs/|CLAUDE\.md|AGENTS\.md|README\.md)' || true)

if [ -z "$NON_DOC_CHANGES" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 8. Classify changes -> target docs
# ---------------------------------------------------------------------------
DOCS_TO_UPDATE=""
SOURCE_SUMMARY=""

add_doc() {
  local doc="$1"
  if ! echo "$DOCS_TO_UPDATE" | grep -qF "$doc"; then
    DOCS_TO_UPDATE="${DOCS_TO_UPDATE}${doc}"$'\n'
  fi
}

# Check each changed file against the mapping table
while IFS= read -r file; do
  case "$file" in
    src/api/*)
      add_doc "docs/api/README.md"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> docs/api/README.md"$'\n'
      ;;
    src/agents/*|src/llm/*|src/pipelines/*)
      add_doc "docs/architecture/system-overview.md"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> docs/architecture/system-overview.md"$'\n'
      ;;
    config/*)
      add_doc "docs/guides/"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> docs/guides/"$'\n'
      ;;
    # .claude/ -> CLAUDE.md is handled by sync-claude-md.sh hook
    .claude/agents/*|.claude/commands/*|.claude/skills/*|.claude/rules/*|.claude/hooks/*)
      ;;
    scripts/*|Makefile)
      add_doc "CLAUDE.md (Development Commands section)"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> CLAUDE.md (Development Commands)"$'\n'
      ;;
    schemas/*)
      add_doc "docs/api/README.md"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> docs/api/README.md"$'\n'
      ;;
    pyproject.toml)
      add_doc "CLAUDE.md"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> CLAUDE.md"$'\n'
      ;;
    Dockerfile*|docker-compose*)
      add_doc "docs/runbooks/deployment.md"
      SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} -> docs/runbooks/deployment.md"$'\n'
      ;;
    src/*/__init__.py)
      # New module detection: check if it's a new file (untracked)
      if echo "$UNTRACKED" | grep -qF "$file"; then
        add_doc "CLAUDE.md (Source Code Layout section)"
        add_doc "AGENTS.md"
        add_doc "docs/guides/project-structure.md"
        SOURCE_SUMMARY="${SOURCE_SUMMARY}  - ${file} (new module) -> CLAUDE.md, AGENTS.md, docs/guides/project-structure.md"$'\n'
      fi
      ;;
  esac
done <<< "$NON_DOC_CHANGES"

# Clean up empty lines
DOCS_TO_UPDATE=$(echo "$DOCS_TO_UPDATE" | grep -v '^$' || true)

if [ -z "$DOCS_TO_UPDATE" ]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 9. Set lock file before exit 2 (anti-loop layer 2)
# ---------------------------------------------------------------------------
touch "$LOCK_FILE"

# ---------------------------------------------------------------------------
# 10. Emit instructions on stderr and exit 2
# ---------------------------------------------------------------------------
cat >&2 <<INSTRUCTIONS
[Auto-Documentation Hook] Source changes detected that may require documentation updates.

## Changed source files and their target docs:
${SOURCE_SUMMARY}
## Documents to review and update:
${DOCS_TO_UPDATE}
## Instructions:
1. Read the current content of each target document listed above.
2. Read the changed source files to understand what was modified.
3. Update ONLY the sections of the target documents that are affected by the changes.
4. Maintain the existing style and format of each document.
5. Do NOT add speculative content or features that were not implemented.
6. If a target document does not exist yet, create it with appropriate content.
7. Keep updates minimal and accurate - reflect what actually changed.
INSTRUCTIONS

exit 2
