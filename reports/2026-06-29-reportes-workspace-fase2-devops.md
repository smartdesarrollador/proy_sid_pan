# Reportes Workspace — Fase 2 (ángulo DevOps)

**Fecha:** 2026-06-29
**App:** `apps/frontend_workspace` · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`
**Relacionado:** continúa `reports/2026-06-29-reportes-workspace-fase1.md`

## Contexto

Tras Fase 1 (vencidas / prioridad / tasa de finalización), Fase 2 añade el **bloque DevOps** que
diferencia al producto: visibilidad de **certificados SSL por vencer**, **higiene de secretos**
(env vars / SSH keys / bóveda sin rotar) y **distribución de snippets por lenguaje**. Reaprovecha
modelos que ya existían y no se reportaban. Gating **Starter+** (`analytics`), igual que Fase 1.

## Decisiones de diseño (de hallazgos en código)

- **`CodeSnippet` no tiene contador de uso** → "más usados" no es medible hoy. Se implementa
  **distribución por lenguaje** (dato real). El contador de uso queda como opción futura en BACKLOG.
- **Escopado por-usuario**: los list views de `ssl_certs`/`env_vars`/`ssh_keys` filtran
  `tenant + user=request.user`, y la **bóveda es personal** (master password). Por eso el reporte
  DevOps se calcula sobre **los recursos del propio usuario** (no tenant-wide) — no expone metadata de
  secretos de otros. La **caché Redis incluye el `user.pk`** (`reports:devops:{tenant}:{user}`).
- **"Sin rotar" = `updated_at` (auto_now) > 90 días.** Editar un secreto = rotarlo.

## Cambios

### Backend (`apps/analytics/`)
- `_compute_devops(tenant, user)` + **`DevOpsView`** en `GET /api/v1/app/reports/devops/`
  (`HasPermission('reports.read')` + `HasFeature('analytics')`, caché 5 min per-usuario).
  - **SSL**: buckets `valid`/`expiring (≤30d)`/`expired` por fecha vs hoy (incl. `valid_until` nulo en
    `valid`) + `expiring_soon` top-5 (`valid_until <= hoy+30`, orden asc) con `days_until_expiry`.
  - **Secretos**: counts Env Vars/SSH Keys/Bóveda; `stale` = los tres con `updated_at < hoy-90d`;
    `oldest` = lista unificada (`{type,label,updated_at}`, label = `key`/`name`/`title`) top-5 asc.
  - **Snippets**: `values('language').annotate(count).order_by('-count')`.
- `urls.py`: `path('devops/', …)`.

### Frontend (`src/features/reports/`)
- `types.ts`: `DevOpsReport`, `SSLSummary`/`ExpiringCert`, `SecretsSummary`/`StaleSecret`, `SnippetLanguage`.
- `hooks/useDevOpsReport.ts` (espejo de `useUsageReport`, queryKey `['ws-reports-devops']`).
- Componentes nuevos: `SSLExpiryWidget` (3 chips + lista con badge de días, rojo vencido / ámbar ≤30d),
  `SecretsHygieneWidget` (counts + destacado "sin rotar >90d" + lista de más antiguos con antigüedad),
  `SnippetLanguageChart` (barra horizontal recharts, colores por lenguaje). Todos con empty states.
- `ReportsPage.tsx`: sección **"DevOps"** (grid SSL + Secretos, y Snippets debajo), dentro del
  `FeatureGate analytics` ya existente.

## Verificación

- **Backend 13/13** (`apps/analytics/tests/test_reports.py`, clase `TestDevOpsReport` con 5 casos):
  buckets SSL + `expiring_soon` ordenado; `stale`/`oldest` (backdate de `updated_at` vía
  `.update()` para saltar `auto_now`); `snippets_by_language`; **scoping** (recursos de otro usuario no
  cuentan); gate Free → 402.
- **Frontend**: `ReportsPage.test.tsx` 8/8 (mock de `useDevOpsReport`; assert sección DevOps, SSL,
  "sin rotar >90 días", snippet); suite total **253 passed**; `typecheck` ✓; `vite build` ✓.
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`).

## Deuda / siguiente

- **Fase 3**: actividad desde `AuditLog` + panel "Uso vs plan" (reusar `UsageMeters`).
- Transversales: filtro de rango de fechas global, export por sección.
- **Export ejecutivo** sigue incoherente (`.csv` vs JSON; gate `analytics_export` vs `pdf_export`).
- Opción futura: contador de uso de snippets (`usage_count`) para "más usados".
