# proy_temp

AI/ML Development Project with modern tooling and AI-assisted development support.

## Features

- Multi-provider LLM integration (Anthropic Claude, OpenAI, Ollama)
- AI agent orchestration with tool support
- Prompt versioning and template management
- Data pipelines for RAG and embeddings
- Full CI/CD with GitHub Actions
- Docker-based development environment
- AI coding agent support (Claude Code, Cursor, Copilot)

## Quick Start

```bash
# Option 1: Automated setup
./scripts/setup.sh

# Option 2: Manual setup
cp .env.example .env              # Configure API keys
python3 -m venv .venv             # Create virtual environment
source .venv/bin/activate         # Activate it
pip install -e ".[dev]"           # Install with dev dependencies
pre-commit install                # Set up git hooks
make test                         # Verify everything works
```

## Project Structure

```
.
├── src/                       # Source code
│   ├── agents/                #   AI agent definitions
│   ├── llm/                   #   LLM provider clients
│   ├── prompts/               #   Prompt engineering
│   ├── tools/                 #   Agent tools
│   ├── pipelines/             #   Data/AI pipelines
│   ├── api/                   #   REST endpoints
│   └── utils/                 #   Shared utilities
│
├── tests/                     # Test suite
├── config/                    # Model, prompt, logging config
├── data/                      # Data artifacts (gitignored)
├── notebooks/                 # Jupyter experimentation
├── schemas/                   # JSON schemas & data models
├── scripts/                   # Automation scripts
├── docs/                      # Documentation
├── prd/                       # Product Requirements
├── reports/                   # Generated reports
│
├── .claude/                   # Claude Code AI config
├── .agent/                    # Open standard agent context
├── .github/workflows/         # CI/CD pipelines
│
├── pyproject.toml             # Dependencies & tool config
├── Dockerfile                 # Container definition
├── docker-compose.yml         # Service orchestration
├── Makefile                   # Task automation
├── CLAUDE.md                  # AI agent project memory
└── AGENTS.md                  # Open standard agent config
```

## Development

```bash
make help          # See all available commands
make dev           # Start development server
make test          # Run test suite
make lint          # Run linters
make format        # Format code
make docker-up     # Start Docker services
```

## Docker Services

```bash
# Core app
docker compose up -d

# With local LLM (Ollama)
docker compose --profile local-llm up -d

# With vector database (ChromaDB)
docker compose --profile vector-db up -d

# With cache (Redis)
docker compose --profile cache up -d
```

## Documentation

- [Getting Started](docs/guides/getting-started.md)
- [AI Workflow Guide](docs/guides/ai-workflow.md)
- [System Architecture](docs/architecture/system-overview.md)
- [API Reference](docs/api/)
- [Architecture Decision Records](docs/adr/)
- [Deployment Runbook](docs/runbooks/deployment.md)

## Contributing

1. Create a feature branch from `main`
2. Write a PRD in `prd/` for significant features
3. Follow the coding standards in `CLAUDE.md` / `AGENTS.md`
4. Ensure `make test && make lint` passes
5. Submit a pull request
