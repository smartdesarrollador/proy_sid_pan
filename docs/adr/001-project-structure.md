# ADR-001: Project Structure for AI Development

## Status
Accepted

## Date
2026-02-05

## Context
We need a project structure that supports modern AI/LLM development workflows including:
- Multiple LLM providers
- Prompt engineering and versioning
- Data pipelines and embeddings
- Agent orchestration
- AI-assisted development (Claude Code, Copilot)

## Decision
Adopt a modular structure with clear separation:
- `src/` for all source code with submodules per concern
- `config/` for externalized configuration (models, prompts, logging)
- `data/` for all data artifacts (excluded from git)
- `tests/` for all test code
- `.claude/` for AI coding agent configuration
- `.agent/` for open-standard agent context

## Consequences
- Clear boundaries make it easy for both humans and AI agents to navigate
- Configuration externalized from code enables easy tuning
- Data directory with gitignore prevents accidental commits of large files
- Multiple AI agent config formats (.claude/, .agent/, AGENTS.md) support different tools
