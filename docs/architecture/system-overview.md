# System Architecture Overview

## High-Level Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client     │───▶│   API Layer │───▶│  LLM Layer  │
│  (UI/CLI)    │    │  (FastAPI)  │    │ (Agents)    │
└─────────────┘    └──────┬──────┘    └──────┬──────┘
                          │                   │
                   ┌──────▼──────┐    ┌──────▼──────┐
                   │  Data Layer │    │   External  │
                   │ (DB/Cache)  │    │   APIs/LLMs │
                   └─────────────┘    └─────────────┘
```

## Components

### API Layer (`src/api/`)
- REST endpoints for client interaction
- Request validation and authentication
- Response formatting

### Agent Layer (`src/agents/`)
- AI agent definitions and orchestration
- Tool registration and execution
- Context management

### LLM Layer (`src/llm/`)
- Provider abstraction (Claude, GPT, local)
- Token management and rate limiting
- Response parsing and validation

### Pipeline Layer (`src/pipelines/`)
- Data processing workflows
- RAG pipelines
- Evaluation pipelines

### Data Layer
- Vector database for embeddings (`data/embeddings/`)
- Cache layer for API responses (`data/cache/`)
- Persistent storage for results (`data/processed/`)

## Data Flow

1. Client sends request to API
2. API validates and routes to appropriate agent
3. Agent uses tools and LLM to process request
4. Results cached and returned to client
