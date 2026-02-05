# CLAUDE.md - Project Configuration

## Project Overview

- **Name**: proy_temp
- **Description**: AI/ML Development Project
- **Language**: Python 3.11+
- **Framework**: FastAPI + LLM integrations (Anthropic, OpenAI, Ollama)

## Development Commands

```bash
# Setup
make install          # Install dependencies
scripts/setup.sh      # Full project setup (venv, deps, hooks)

# Development
make dev              # Start dev server
make test             # Run tests
make lint             # Run linters (ruff)
make format           # Format code (ruff)
make typecheck        # Type checking (mypy)

# Docker
make docker-up        # Start services
make docker-down      # Stop services
make docker-build     # Build images

# Utilities
make clean            # Clean build artifacts
make env-check        # Verify .env exists
```

## Code Style

- Use type hints for all function signatures
- Prefer Pydantic models over raw dicts
- Use async/await for I/O-bound operations
- Keep functions under 50 lines
- Follow ruff formatting rules (see pyproject.toml)
- See `.claude/rules/` for detailed rules

## Architecture

- See `docs/architecture/system-overview.md` for system design
- See `docs/adr/` for Architecture Decision Records
- See `schemas/` for data models and API schemas

## Source Code Layout

```
src/
├── agents/      # AI agent definitions and orchestration
├── llm/         # LLM provider clients (Claude, GPT, Ollama)
├── prompts/     # Prompt templates and engineering
├── tools/       # Agent tools (search, APIs, etc.)
├── pipelines/   # Data and AI workflow pipelines
├── api/         # REST/WebSocket endpoints
└── utils/       # Shared utilities (caching, logging, rate limiting)
```

## File Boundaries

- Source code: `src/`
- Tests: `tests/`
- Configuration: `config/` (models, prompts, logging)
- Data artifacts: `data/` (cache, embeddings, raw, processed)
- Notebooks: `notebooks/` (experimentation)
- Scripts: `scripts/`
- Documentation: `docs/`

## Workflow Rules

- Always run tests before committing (`make test`)
- Follow conventional commits format
- Create PRD before implementing features (see `prd/`)
- Document architectural decisions in `docs/adr/`
- Define prompts in `config/prompt_templates.yaml`, not inline
- Never commit secrets - use `.env` (see `.env.example`)

## Custom Tools & Skills

- Skills: `.claude/skills/` (code-review, testing-patterns, debugging)
- Commands: `.claude/commands/` (onboard, create-prd, generate-report, pr-review)
- Agents: `.claude/agents/` (code-reviewer, planner, researcher)
- Rules: `.claude/rules/` (code-style, security, ai-development)
- See `.claude/README.md` for full configuration reference
