# ADR-002: Auto-Documentation Hook for Claude Code

## Status
Accepted

## Date
2026-02-05

## Context
Documentation tends to drift out of sync with source code during development sessions. Developers modify source files but forget to update the corresponding docs, CLAUDE.md sections, or architecture guides. This is especially problematic in AI-assisted development where changes happen rapidly.

We needed an automated mechanism that:
- Detects when source changes affect documentation
- Triggers documentation updates without manual intervention
- Avoids infinite loops (doc updates triggering more doc updates)
- Works within the Claude Code hook system

## Decision
Implement a **Stop hook** with a hybrid approach:
- **Shell script** (`.claude/hooks/detect-doc-changes.sh`) handles detection and classification using `git diff`
- **Exit code 2** triggers a Claude Code continuation where the LLM intelligently updates the affected documents

### Key design choices:
1. **Git-based detection**: Uses `git diff`, `git diff --cached`, and `git ls-files --others` to capture all types of changes (modified, staged, untracked)
2. **Mapping table**: Source paths are mapped to target documentation files (e.g., `src/api/` -> `docs/api/README.md`)
3. **Three-layer anti-loop protection**:
   - `stop_hook_active` field in the event JSON
   - Session-based temp file (`/tmp/claude-doc-hook-$SESSION_ID`)
   - Doc-only change exclusion (if only docs changed, skip)
4. **Structured stderr instructions**: The script sends specific instructions to Claude about what to update and how

### Dependencies:
- `jq` for JSON parsing (fails silently if missing)
- `git` for change detection (fails silently if not in a repo)

## Consequences

### Positive
- Documentation stays in sync with code changes automatically
- No manual effort required from developers
- Only one extra Claude turn per session (when changes are detected)
- Graceful degradation: if jq or git is missing, hook exits cleanly

### Negative
- Adds one extra LLM turn when source changes are detected, increasing token usage slightly
- Requires `jq` to be installed on the development machine
- Mapping table needs manual maintenance when new source directories are added
