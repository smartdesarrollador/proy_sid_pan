# Getting Started

## Prerequisites

- Python 3.11+
- Docker (optional, for services)
- An LLM API key (Anthropic, OpenAI, or local Ollama)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd proy_temp
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Install dependencies**
   ```bash
   pip install -e ".[dev]"
   ```

4. **Set up pre-commit hooks**
   ```bash
   pre-commit install
   ```

5. **Run tests**
   ```bash
   make test
   ```

## Using Docker

```bash
# Start all services
docker compose up -d

# Start with local LLM
docker compose --profile local-llm up -d

# Start with vector database
docker compose --profile vector-db up -d
```

## Project Commands

Run `make help` to see all available commands.
