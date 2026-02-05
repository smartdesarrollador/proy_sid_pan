# ============================================
# Dockerfile - AI Development Project
# Multi-stage build for production
# ============================================

# ---------- Base ----------
FROM python:3.12-slim AS base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ---------- Dependencies ----------
FROM base AS deps

COPY pyproject.toml ./
RUN pip install --no-cache-dir . 2>/dev/null || echo "No dependencies to install yet"

# ---------- Development ----------
FROM deps AS development

RUN pip install --no-cache-dir .[dev] 2>/dev/null || echo "No dev dependencies yet"

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------- Production ----------
FROM deps AS production

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
