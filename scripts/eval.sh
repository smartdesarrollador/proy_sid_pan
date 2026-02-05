#!/usr/bin/env bash
# ============================================
# eval.sh - Run prompt/model evaluations
# ============================================

set -euo pipefail

echo "Running evaluations..."

# Run prompt evaluations
# promptfoo eval --config config/eval_config.yaml

# Run pytest evaluation tests
# pytest tests/ -k "eval" -v

echo "Evaluations complete. Check reports/ for results."
