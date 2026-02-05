# ============================================
# Makefile - Project Task Automation
# ============================================

.PHONY: help install dev test lint format clean docker-up docker-down

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ---------- Setup ----------
install: ## Install project dependencies
	@echo "Installing dependencies..."
	# pip install -r requirements.txt
	# npm install

dev: ## Start development environment
	@echo "Starting development server..."
	# python -m uvicorn src.main:app --reload --port 8000
	# npm run dev

# ---------- Quality ----------
test: ## Run test suite
	@echo "Running tests..."
	# pytest tests/ -v
	# npm test

lint: ## Run linters
	@echo "Running linters..."
	# ruff check src/ tests/
	# npm run lint

format: ## Format code
	@echo "Formatting code..."
	# ruff format src/ tests/
	# npm run format

typecheck: ## Run type checking
	@echo "Running type checker..."
	# mypy src/
	# npx tsc --noEmit

# ---------- Docker ----------
docker-up: ## Start Docker services
	docker compose up -d

docker-down: ## Stop Docker services
	docker compose down

docker-build: ## Build Docker images
	docker compose build

# ---------- Data ----------
clean-cache: ## Clean data caches
	rm -rf data/cache/*
	@echo "Cache cleaned."

# ---------- Utilities ----------
clean: ## Clean build artifacts and caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	rm -rf dist/ build/ *.egg-info/
	@echo "Cleaned."

env-check: ## Verify environment variables are set
	@test -f .env || (echo "ERROR: .env file not found. Copy .env.example to .env" && exit 1)
	@echo "Environment file found."
