# AGENTS.md - Agent Configuration (Open Standard)

This file follows the [AGENTS.md](https://agents.md/) open standard for guiding AI coding agents.

## Project Context

- **Name**: proy_temp
- **Description**: AI/ML Development Project
- **Primary Language**: Python 3.11+
- **Framework**: FastAPI + LLM integrations

## Coding Standards

- Use type hints for all function signatures
- Prefer Pydantic models or dataclasses over raw dicts
- Use async/await for I/O-bound operations
- Keep functions under 50 lines
- Prefer composition over inheritance
- Define prompts in config files, not inline

## Directory Structure

```
├── CLAUDE.md              # Claude Code project memory
├── AGENTS.md              # Open standard agent config (this file)
├── README.md              # Project documentation
├── pyproject.toml         # Dependencies and tool config
├── Makefile               # Task automation
├── Dockerfile             # Container definition
├── docker-compose.yml     # Service orchestration
├── .env.example           # Environment variable template
├── .editorconfig          # Editor consistency
├── .pre-commit-config.yaml # Git hooks for code quality
├── .gitignore             # Git ignore rules
│
├── src/                   # Source code
│   ├── agents/            #   AI agent definitions
│   ├── llm/               #   LLM provider clients
│   ├── prompts/           #   Prompt engineering
│   ├── tools/             #   Agent tools
│   ├── pipelines/         #   Data/AI pipelines
│   ├── api/               #   REST endpoints
│   └── utils/             #   Shared utilities
│
├── tests/                 # Test suite
├── config/                # Configuration files
│   ├── model_config.yaml  #   Model settings
│   ├── prompt_templates.yaml # Prompt patterns
│   └── logging_config.yaml   # Logging setup
│
├── data/                  # Data artifacts (gitignored)
│   ├── raw/               #   Raw input data
│   ├── processed/         #   Processed data
│   ├── cache/             #   API response cache
│   └── embeddings/        #   Vector embeddings
│
├── notebooks/             # Jupyter notebooks for experimentation
├── schemas/               # JSON schemas and data models
├── scripts/               # Automation scripts
├── prd/                   # Product Requirement Documents
├── reports/               # Generated reports
│
├── docs/                  # Documentation
│   ├── architecture/      #   System design
│   ├── guides/            #   How-to guides
│   ├── api/               #   API documentation
│   ├── adr/               #   Architecture Decision Records
│   └── runbooks/          #   Operational runbooks
│
├── .claude/               # Claude Code configuration
│   ├── agents/            #   Custom AI agents
│   ├── commands/          #   Slash commands
│   ├── skills/            #   Domain knowledge
│   ├── rules/             #   Modular instructions
│   └── hooks/             #   Automation hooks
│
├── .agent/                # Standardized agent context
│   ├── spec/              #   Requirements and tasks
│   ├── wiki/              #   Architecture docs
│   └── links/             #   External resources
│
└── .github/
    └── workflows/         # CI/CD pipelines
```

## Task Execution Rules

1. Read relevant files before making changes
2. Run tests after modifications (`make test`)
3. Follow conventional commits format
4. Document non-obvious decisions
5. Define prompts in config, not inline in code
6. Never hardcode secrets - use environment variables

## Available Commands

See `.claude/commands/` for available slash commands.

## Available Agents

See `.claude/agents/` for specialized agent definitions.
