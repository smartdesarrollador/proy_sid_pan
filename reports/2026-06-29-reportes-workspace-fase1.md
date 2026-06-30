# Reportes Workspace — Fase 1 (widgets accionables)

**Fecha:** 2026-06-29
**App:** `apps/frontend_workspace` · `apps/backend_django`
**Plan:** `plans/implementa-todo-lo-recomendado-declarative-sedgewick.md`

## Contexto

La sección **Reportes** (`/reports`) era puramente descriptiva: 4 KPIs (Tareas Activas, Completadas,
Proyectos, **Almacenamiento**), "Distribución por Estado" y "Tendencias de Uso". El análisis reveló
que el backend **ya calculaba datos sin mostrar** y que había piezas rotas. Fase 1 la vuelve
accionable con el mejor ratio valor/esfuerzo, reusando lo existente. Sin flags nuevos: todo bajo el
`FeatureGate feature="analytics"` (Starter+).

## Cambios

### Backend (`apps/analytics/views.py`)
- **`_compute_summary`** → `overdue_tasks`: `Task.filter(tenant, due_date__lt=today).exclude(status='done').count()`
  (aprovecha el índice `tasks_tenant_due_date_idx`).
- **`_compute_usage`** → `overdue`: top 5 (`order_by('due_date')`, `values('id','title','due_date','priority')`)
  para el widget de lista. Misma respuesta cacheada (Redis 5 min); **sin URLs nuevas**.
- **Fix `ReportExportView`** (bug preexistente): leía `usage['resources']`, clave que `_compute_usage`
  ya no devuelve → **KeyError/500**. Ahora emite `tasks_by_status`/`tasks_by_priority`/`overdue`.

### Frontend (`src/features/reports/`)
- `types.ts`: `SummaryData.overdue_tasks?`, `UsageData.overdue?: OverdueTask[]`.
- `KpiCards.tsx`: 4ª tarjeta **Almacenamiento** (0 GB hardcodeado, sin backing real) → **Tareas
  Vencidas** (`AlertTriangle`, roja si >0 / gris si 0).
- `components/TaskPriorityChart.tsx` (NUEVO): barra vertical sobre `tasks_by_priority` (clon del
  patrón de `ResourceDistributionChart`), con `PRIORITY_COLORS`/`PRIORITY_LABELS`.
- `components/CompletionRateChart.tsx` (NUEVO): **donut** (recharts `PieChart`) Completadas vs
  Pendientes con **% al centro** (`completed/(completed+active)`), overlay absoluto.
- `components/OverdueTasksList.tsx` (NUEVO): lista top-5 (título, badge de prioridad, fecha en rojo);
  vacío → "Sin tareas vencidas 🎉".
- `ReportsPage.tsx`: 2º grid (Prioridad + Tasa de finalización) + card de vencidas. Datos vía los
  hooks ya existentes `useSummary`/`useUsageReport` (no se crean hooks).

## Verificación

- **Backend 8/8** (`apps/analytics/tests/test_reports.py`): reconciliados los 2 tests stale que
  asumían la forma vieja orientada a usuarios (`active_users`/`resources`/`forms`) → ahora task-oriented
  (`active_tasks`/`overdue_tasks`, `tasks_by_status`/`tasks_by_priority`/`overdue`). Nuevos:
  `overdue` cuenta solo vencidas no-`done` (excluye hechas, futuras y sin fecha); lista capada a 5 y
  ordenada por fecha; `export` → 200 (regresión del KeyError).
- **Frontend**: `ReportsPage.test.tsx` 7/7 (KPI Vencidas, headings nuevos, 75% de finalización, item
  de la lista); suite total **252 passed**; `typecheck` ✓; `vite build` ✓.
- Pre-existentes ajenos: 2 tests en `auth/` (`SSOCallbackPage`, `ProtectedRoute`).

## Deuda / siguiente

- **Export ejecutivo incoherente**: el botón descarga `.csv` pero el endpoint sirve JSON, y gatea con
  `analytics_export` mientras el backend exige `pdf_export`. Fase 1 solo evitó el 500; falta unificar
  formato + gate. (Anotado en `BACKLOG.md` › Deuda técnica.)
- **Roadmap Reportes**: Fase 2 (vencimientos SSL + secretos sin rotar + snippets más usados),
  Fase 3 (actividad desde `AuditLog` + panel "Uso vs plan" reusando `UsageMeters`), y transversales
  (filtro de fechas global, export por sección).
- Nota: el front usa `in_review` en `STATUS_COLORS` pero el modelo `Task` usa `review` — discrepancia
  menor de etiquetas en "Distribución por Estado" (no afecta Fase 1, pero conviene alinear).
