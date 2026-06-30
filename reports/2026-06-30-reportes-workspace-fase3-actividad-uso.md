# Reportes Workspace — Fase 3 (Actividad + Uso vs plan)

**Fecha:** 2026-06-30
**App:** `apps/frontend_workspace` · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`
**Relacionado:** cierra el roadmap iniciado en `reports/2026-06-29-reportes-workspace-fase1.md` y `…-fase2-devops.md`

## Contexto

Última fase del roadmap de Reportes. Añade dos bloques: **Actividad** (analítica agregada del
`AuditLog`) y un panel **"Uso vs plan"** (consumo vs límites). Ambos reaprovechan datos/patrones que
ya existían.

## Decisiones de diseño (de hallazgos en código)

- **El log de auditoría crudo ya existe** en el Workspace (`features/audit/`, ruta `/audit`). Por eso
  Actividad es **analítica agregada** (timeline + por acción), no otra tabla.
- **Gating Professional+** (`audit_logs`) para Actividad, coherente con que el log crudo ya exige esa
  feature (como Tendencias usa `analytics_trends`). El bloque se envuelve en `FeatureGate audit_logs`;
  en planes < Pro muestra el prompt de upgrade. **Tenant-wide** (la auditoría es del tenant).
- **Retención por plan**: `_compute_activity` capa el periodo a `audit_log_days` del plan.
- **"Uso vs plan"**: el endpoint `summary` **ya devolvía** el bloque `usage` (6 recursos + límites);
  solo se expuso en el tipo frontend `SummaryData` y se pintó. Panel **Starter+** (`analytics`).

## Cambios

### Backend (`apps/analytics/`)
- `_compute_activity(tenant, period_days)` + **`ActivityView`** en `GET /api/v1/app/reports/activity/`
  (`HasPermission('reports.read')` + `HasFeature('audit_logs')`, caché 5 min por periodo, param
  `period` máx 90). Devuelve `{period, requested_days, retention_days, total, by_day, by_action}`:
  - `by_day`: `TruncDate('created_at')` → `[{date,count}]` asc.
  - `by_action`: `values('action').annotate(count).order_by('-count')[:8]`.
- `urls.py`: `path('activity/', …)`.

### Frontend (`src/features/reports/`)
- `types.ts`: `ActivityReport`/`ActivityPoint`/`ActionCount`; `SummaryData.usage` (+ `PlanUsage`).
- `hooks/useActivityReport.ts` (espejo de `useTrends`, pero **envía el periodo numérico** — ver bug abajo).
- `components/ActivitySection.tsx`: `FeatureGate audit_logs` → `ActivityInner` (toggle 7/30/90d +
  timeline `LineChart` + "por acción" `BarChart` horizontal con humanizador de `action`).
- `components/PlanUsagePanel.tsx`: 6 barras verde/amarillo/rojo desde `summary.usage` (reusa la lógica
  de `PlanUsageBanner`); `*_limit === null` → "ilimitado" (barra azul).
- `ReportsPage.tsx`: sección **"Actividad"** + card **"Uso vs plan"**.

## Verificación

- **Backend 16/16** (`apps/analytics/tests/test_reports.py`, clase `TestActivityReport`, 3 casos):
  `total`/`by_action` ordenado; `by_day` agrupa fechas y respeta el periodo (evento de hace 200d fuera
  de la ventana de 30d); gate Starter (sin `audit_logs`) → 402.
- **Frontend**: `ReportsPage.test.tsx` 9/9 (sección Actividad, ambos charts, panel "Uso vs plan" con
  `role="progressbar"` e "ilimitado"); suite total **254 passed**; `typecheck` ✓; `vite build` ✓.
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`).

## Bug detectado (registrado en BACKLOG)

- **`useTrends` envía `?period=7d`** y el backend lo parsea con `int()` → `ValueError` → cae al default
  30. **El toggle 7/30/90 de "Tendencias de Uso" no surte efecto.** El nuevo `useActivityReport` evita
  el bug enviando el número (`period.replace('d','')`). Arreglar `useTrends` igual queda pendiente.

## Estado del roadmap de Reportes

- ✅ Fase 1 (vencidas / prioridad / tasa de finalización)
- ✅ Fase 2 (DevOps: SSL / secretos sin rotar / snippets por lenguaje)
- ✅ Fase 3 (Actividad / Uso vs plan)
- ⏳ Transversales: filtro de rango de fechas global, export por sección, export ejecutivo coherente,
  fix de `useTrends`, opción `usage_count` de snippets.
