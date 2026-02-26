export type SnippetLanguage = "javascript" | "python" | "bash" | "sql" | "css";

export interface Snippet {
  id: string;
  title: string;
  language: SnippetLanguage;
  description: string;
  code: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LANGUAGE_LABELS: Record<SnippetLanguage, string> = {
  javascript: "JavaScript",
  python: "Python",
  bash: "Bash",
  sql: "SQL",
  css: "CSS",
};

export const LANGUAGE_COLORS: Record<SnippetLanguage, string> = {
  javascript: "bg-yellow-500/20 text-yellow-300",
  python: "bg-blue-500/20 text-blue-300",
  bash: "bg-green-500/20 text-green-300",
  sql: "bg-orange-500/20 text-orange-300",
  css: "bg-purple-500/20 text-purple-300",
};

export const MOCK_SNIPPETS: Snippet[] = [
  {
    id: "snip-1",
    title: "JWT Token Verification Middleware",
    language: "javascript",
    description: "Express middleware that verifies JWT tokens from Authorization header and attaches decoded user to request object",
    code: `const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}`,
    tags: ["auth", "middleware", "express"],
    isFavorite: true,
    createdAt: "2026-01-15",
    updatedAt: "2026-02-10",
  },
  {
    id: "snip-2",
    title: "Async PostgreSQL Query Helper",
    language: "python",
    description: "Async helper function using asyncpg for executing parameterized PostgreSQL queries with connection pooling",
    code: `import asyncpg

async def execute_query(pool, query, *args):
    async with pool.acquire() as conn:
        return await conn.fetch(query, *args)

async def create_pool():
    return await asyncpg.create_pool(
        dsn="postgresql://user:pass@localhost/db",
        min_size=5, max_size=20
    )`,
    tags: ["database", "async", "postgresql"],
    isFavorite: false,
    createdAt: "2026-01-20",
    updatedAt: "2026-01-20",
  },
  {
    id: "snip-3",
    title: "Deploy to Production Script",
    language: "bash",
    description: "Automated deployment script with health checks, rollback capability and Slack notifications",
    code: `#!/bin/bash
set -euo pipefail

APP="my-app"
ENV="production"

echo "Deploying $APP to $ENV..."
docker build -t $APP:latest .
docker push registry.example.com/$APP:latest
kubectl rollout restart deployment/$APP
kubectl rollout status deployment/$APP --timeout=120s
echo "Deploy complete!"`,
    tags: ["devops", "docker", "kubernetes"],
    isFavorite: true,
    createdAt: "2026-02-01",
    updatedAt: "2026-02-15",
  },
  {
    id: "snip-4",
    title: "Find Slow Queries - PostgreSQL",
    language: "sql",
    description: "Query to identify slow-running PostgreSQL queries using pg_stat_statements with execution stats",
    code: `SELECT query,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;`,
    tags: ["performance", "monitoring", "dba"],
    isFavorite: false,
    createdAt: "2026-02-05",
    updatedAt: "2026-02-05",
  },
  {
    id: "snip-5",
    title: "CSS Skeleton Loading Animation",
    language: "css",
    description: "Pure CSS skeleton loading placeholder with shimmer animation effect for content loading states",
    code: `.skeleton {
  background: linear-gradient(
    90deg,
    #1a1a2e 25%,
    #2a2a3e 50%,
    #1a1a2e 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
    tags: ["ui", "loading", "animation"],
    isFavorite: false,
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
  },
];
