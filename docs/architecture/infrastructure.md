# Infraestructura y Deployment

[Volver al System Overview](system-overview.md)

---

## Tabla de Contenidos

1. [Diagrama de Deployment](#diagrama-de-deployment)
2. [Servicios de Desarrollo (docker-compose)](#servicios-de-desarrollo-docker-compose)
3. [CI/CD (GitHub Actions)](#cicd-github-actions)
4. [Monitoring](#monitoring)
5. [Escalado Horizontal](#escalado-horizontal)
6. [Base de Datos](#base-de-datos)
7. [Performance Targets](#performance-targets)

---

## Diagrama de Deployment

```
                             Internet
                                │
                    ┌───────────▼────────────┐
                    │   CDN (CloudFront /    │
                    │      Cloudflare)       │
                    │   - Assets estáticos   │
                    │   - Cache de páginas   │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │  Load Balancer         │
                    │  (AWS ALB / Nginx)     │
                    │  - TLS termination     │
                    │  - Health checks       │
                    │  - Routing por path    │
                    └──────────┬─────────────┘
                               │
              ┌────────────────┼──────────────────┐
              │                │                  │
   ┌──────────▼──────┐ ┌───────▼───────┐ ┌───────▼──────────┐
   │  Django API     │ │  Next.js SSR  │ │  Nginx (Static)  │
   │  (N instancias) │ │  (M instancias│ │  Admin + Client  │
   │  - /api/v1/     │ │  - /tarjeta/  │ │  React bundles   │
   │  - Stateless    │ │  - /landing/  │ │                  │
   │  - Celery       │ │  - /portafolio│ │                  │
   │    workers      │ │  - /cv/       │ │                  │
   └────────┬────────┘ └───────┬───────┘ └──────────────────┘
            │                  │
            └─────────┬────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼─────┐ ┌────▼─────────┐
│  PostgreSQL  │ │  Redis   │ │  S3 / MinIO  │
│  (Primary)   │ │  Cluster │ │  (Archivos)  │
│  + Read      │ │  - Cache │ │              │
│    Replicas  │ │  - Queue │ │              │
│  + PgBouncer │ │  - Limiter│ │              │
└──────────────┘ └──────────┘ └──────────────┘
```

### Routing del Load Balancer

| Path | Destino |
|------|---------|
| `/api/*` | Django API (port 8000) |
| `/tarjeta/*`, `/landing/*`, `/portafolio/*`, `/cv/*` | Next.js SSR (port 3000) |
| `/admin/*` | Nginx sirviendo Admin Panel (React bundle) |
| `/*` (default) | Nginx sirviendo Client Panel (React bundle) |

---

## Servicios de Desarrollo (docker-compose)

El `docker-compose.yml` del proyecto levanta los servicios de desarrollo locales:

```yaml
services:
  app:           # Django API (port 8000)
  redis:         # Cache + sessions (port 6379)   [profile: cache]
  ollama:        # LLM local opcional (port 11434) [profile: local-llm]
  chromadb:      # Vector DB opcional (port 8001)  [profile: vector-db]
```

### Comandos de desarrollo

```bash
# Levantar solo Django + Redis (caso más común)
docker-compose --profile cache up

# Levantar con LLM local
docker-compose --profile cache --profile local-llm up

# Levantar todo
docker-compose --profile cache --profile local-llm --profile vector-db up
```

### Variables de entorno

Las credenciales se cargan desde `.env` (nunca committear). Ver `.env.example` en la raíz del proyecto.

---

## CI/CD (GitHub Actions)

### Pipeline por rama

| Trigger | Jobs |
|---------|------|
| Pull Request | lint → typecheck → test → build |
| Push a `main` | lint → typecheck → test → build → deploy staging |
| Tag `v*.*.*` | lint → typecheck → test → build → deploy production |

### Jobs del pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    - ruff check src/
    - ruff format --check src/

  typecheck:
    - mypy src/

  test:
    - pytest tests/ --cov=src --cov-fail-under=80

  build:
    - docker build --target production .
    - Escaneo de vulnerabilidades (Trivy)

  deploy-staging:
    - docker push registry/api:sha-{SHA}
    - kubectl rollout (staging namespace)

  deploy-production:
    - docker push registry/api:v{VERSION}
    - kubectl rollout (production namespace)
    - Smoke tests post-deploy
```

---

## Monitoring

| Herramienta | Propósito | Alertas |
|------------|-----------|---------|
| **Sentry** | Error tracking (backend + frontend), performance traces | Errores 5xx, p95 > 500ms |
| **CloudWatch** | Métricas de infraestructura AWS (CPU, memoria, DB connections) | CPU > 80%, DB connections > 90% |
| **ELK Stack** | Centralización de logs (Django, Nginx, Next.js) | Logs de error, auditoría |
| **Health checks** | Endpoint `/health/` en Django para el Load Balancer | Unhealthy instance → drain + replace |

### Métricas SSR monitoreadas

```typescript
// tracking en Next.js
analytics.track('ssr_render', {
  service,        // 'tarjeta' | 'landing' | 'portafolio' | 'cv'
  username,
  render_time_ms,
  cache_hit,      // true/false
  timestamp,
});
```

Métricas SSR clave: SSR Render Time, Cache Hit/Miss Ratio, TTFB, FCP, LCP, CLS.

---

## Escalado Horizontal

### API Django (Stateless)

- Sin sesiones server-side (JWT-based)
- Escala a N instancias detrás del Load Balancer
- Auto-scaling basado en CPU/memoria (AWS Auto Scaling Groups o Kubernetes HPA)
- Target: 10,000+ usuarios concurrentes

### Next.js SSR

- Múltiples instancias detrás del Load Balancer
- Cache ISR compartido via Redis (todas las instancias invalidan el mismo cache)
- Escala independientemente de la API Django

### Celery Workers

- Workers para jobs asíncronos: envío de emails, procesamiento de billing, webhooks
- Escala horizontalmente: más workers = más throughput de tareas
- Broker: Redis (mismo cluster que el cache)

---

## Base de Datos

### PostgreSQL

| Componente | Propósito |
|-----------|-----------|
| **Primary** | Todas las escrituras |
| **Read Replicas** | Queries de lectura (reportes, analytics, listados) |
| **PgBouncer** | Connection pooling (evita saturación de conexiones) |

### Estrategia de backups

- Backups automáticos diarios (AWS RDS automated backups o pg_dump)
- Point-in-time recovery: retención de 7 días (staging), 30 días (producción)
- Backups encriptados con AES-256

### Índices críticos

Los índices en tablas multi-tenant incluyen `tenant_id` como primera columna para que el planner de PostgreSQL los use junto con las políticas RLS:

```sql
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_projects_tenant ON projects(tenant_id, status);
CREATE INDEX idx_audit_logs_tenant_ts ON audit_logs(tenant_id, timestamp DESC);
```

---

## Performance Targets

| Métrica | Target MVP | Target 6 meses | Estrategia |
|---------|-----------|----------------|-----------|
| **API Latency p95** | < 300ms | < 200ms | Índices, Redis cache, query optimization |
| **API Latency p99** | < 500ms | < 500ms | Auto-scaling, load balancing |
| **TTFB SSR (cached)** | < 200ms | < 200ms | ISR + Redis cache |
| **TTFB SSR (uncached)** | < 1s | < 800ms | Query optimization, RSC streaming |
| **LCP** | < 2.5s | < 2.0s | next/image, CDN, prefetch |
| **Cache hit ratio SSR** | > 80% | > 90% | ISR 60s + Redis 5min |
| **Uptime** | 99.5% | 99.9% | Multi-AZ, health checks, auto-recovery |
| **Usuarios concurrentes** | 1,000 | 10,000+ | Horizontal scaling |
| **Queries por request** | < 10 | < 10 | `select_related`, `prefetch_related` |
| **Test Coverage** | > 80% | > 90% | pytest + CI gate |

---

**Fuente**: [`prd/technical/architecture.md`](../../prd/technical/architecture.md) — secciones Scalability + DevOps + Performance Targets

**Última actualización**: 2026-02-26
