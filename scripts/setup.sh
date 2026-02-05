#!/usr/bin/env bash
# ============================================
# setup.sh - Project initialization script
# ============================================

set -euo pipefail

echo "Setting up proy_temp..."

# Check Python version
python3 --version 2>/dev/null || { echo "Python 3 is required"; exit 1; }

# Create .env from template if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from template. Please edit with your API keys."
else
    echo ".env already exists, skipping."
fi

# Create virtual environment
if [ ! -d .venv ]; then
    python3 -m venv .venv
    echo "Virtual environment created at .venv/"
fi

# Activate and install
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Create log directory
mkdir -p logs

echo ""
echo "Setup complete!"
echo "  Activate venv:  source .venv/bin/activate"
echo "  Run tests:      make test"
echo "  See commands:    make help"
