# Analytics del Admin Panel — de "Sin datos disponibles" a 4 paneles cross-tenant reales

**Fecha:** 2026-07-12
**App:** `apps/frontend_admin` · `apps/backend_django`
**Origen:** captura de pantalla del usuario mostrando la sección Analytics (`/reports`) vacía —
"Distribución de Roles" sin datos y "Tendencias de Uso" bloqueado.

## Contexto

La sección Analytics del Admin Panel (staff, `is_staff=True`) mostraba placeholders vacíos.
Investigar el porqué destapó una cadena de hallazgos que reordenó el alcance de la sesión: dos
bugs preexistentes (uno de ellos una vulnerabilidad real de control de acceso) y, resuelto eso,
cuatro paneles nuevos de analítica cross-tenant construidos desde cero, pedidos uno por uno por
el usuario a partir de una propuesta inicial.

## Hallazgos y fixes (antes de construir nada nuevo)

### 1. `RoleDistributionChart` — backend nunca devolvía `role_distribution`

`ReportsPage.tsx` esperaba `usage.role_distribution` pero `_compute_usage()`
(`apps/analytics/views.py`) solo devolvía desglose de tareas. Fix: `_compute_role_distribution(tenant)`
agrega `UserRole` (no expirados) por `role__name`, agregado al payload de `UsageView`.
1 test nuevo (`test_usage_returns_role_distribution`).

### 2. Control de acceso roto en `/api/v1/admin/clients/` (vulnerabilidad real)

Investigando el fix anterior se descubrió que `ClientListView`/`SuspendClientView`
(`apps/tenants/admin_views.py`) solo validaban el permiso RBAC `customers.read`/`customers.suspend`
— permiso que el rol de sistema **"Owner"** también tiene, y que se asigna automáticamente a
**todo** el que registra un tenant. Cualquier cliente pagante podía, llamando la API directo (sin
pasar por el `ProtectedRoute` del frontend, que es solo un guard de navegador), ver **todos los
demás tenants** del sistema y **suspenderlos**.

Fix: nueva clase `IsStaffUser` (`apps/rbac/permissions.py`) — exige `is_staff` o `is_superuser`
**además** del permiso RBAC. Aplicada a ambas vistas. Este patrón (`IsStaffUser` + `HasPermission`)
se reutilizó en las 4 vistas nuevas de analítica. 4 tests de regresión en
`test_clients_admin.py` (Owner no-staff con el permiso → 403; staff con el permiso → 200; staff
sin el permiso → 403).

### 3. Bug de prefijo de URL — el panel de KPIs nunca llegó al backend

`useSummary.ts`/`useUsageReport.ts`/`useTrends.ts` llamaban `apiClient.get('/reports/...')`, que
resuelve a `/api/v1/reports/...` (la baseURL del cliente es `/api/v1` a secas). El backend real
vive en `/api/v1/app/reports/...`. Era un 404 silencioso, no solo un desajuste de forma de datos
— por eso las KPI cards no aparecían en absoluto en la captura original, y el fix del punto 1
tampoco se veía en el navegador hasta corregir esto. Fix: agregado el prefijo `/app/` en los tres
hooks.

## Los 4 paneles nuevos (staff-only, cross-tenant)

Todos comparten el mismo patrón: `apps/analytics/admin_views.py` + `admin_urls.py`, bajo
`/api/v1/admin/reports/`, gateados por `[IsStaffUser, HasPermission('customers.analytics')]`
(permiso ya sembrado pero sin usar hasta ahora), caché Redis 5 min, y renderizados en
`ReportsPage.tsx` **fuera** de `<FeatureGate feature="analytics">` — son datos de staff sobre
todos los tenants, no dependen del plan del tenant actual.

### MRR / ARR / churn / usuarios (`AdminSummaryView`, `summary/`)

El único método de pago real es Yape (manual, sin recurrencia automática) y **no existe ninguna
tarea que expire una `Subscription` cuando su período vence sin renovación** — por eso las
métricas de ingresos se calculan desde `Invoice` (`status='paid'`, `period_end >= ahora`), nunca
desde `Subscription.status`, que puede quedar `'active'` indefinidamente aunque el cliente dejó de
pagar. `trial_conversions` se aproxima por la primera factura pagada de cada tenant (no por
`trial_end`, que se anula en toda transición terminal). 8 tests.

### Adopción de servicios (`ServiceAdoptionView`, `service-adoption/`)

Adquirido (`TenantService.status='active'`) vs. activado (SSO usado para workspace/vista;
`DesktopAppLicense` con `hardware_id`+`activated_at` para desktop, que nunca pasa por SSO). Reveló
que `provision_free_services` auto-otorga los 3 servicios a todo tenant nuevo — la señal real es
la activación, no la adquisición. 11 tests.

### Tráfico de Vista (`VistaTrafficView`, `vista-traffic/`)

Vistas/únicas (`session_hash` distinct)/compartidos por tipo de página pública
(tarjeta/landing/portafolio/cv) + top-10 referrers, generalizando la lógica ya existente de
`build_service_analytics` (analítica por-creador) a nivel plataforma. 10 tests.

### Licencias Desktop (`DesktopLicenseFunnelView`, `desktop-licenses/`)

Embudo a nivel de licencia individual: enviadas/activadas/pendientes/revocadas — pregunta
distinta de "Adopción de Servicios" (esa cuenta tenants que *alguna vez* activaron desktop; esta
cuenta el estado *actual* de cada licencia, con la misma prioridad "revocada gana" que la propia
`DesktopAppLicense.status`). Una licencia revocada que fue activada antes cuenta como "revocada"
aquí, no como "activada" — a propósito, documentado en el código. 7 tests.

## Frontend

`apps/frontend_admin/src/features/reports/`: 4 hooks nuevos (`useServiceAdoption`,
`useVistaTraffic`, `useDesktopLicenseFunnel`, más el `useSummary` corregido), componentes nuevos
(`ServiceAdoptionChart`, `VistaTrafficChart` + `ReferrerList` — este último porta el patrón de
lista-con-barra-proporcional de `frontend_next_vista/features/analytics/components/TopReferrers.tsx`
—, `DesktopLicenseStats`, que mirror exacto de `KpiCards.tsx` ya que es una sola categoría con 4
estados, no varias categorías para comparar visualmente). `ReportsPage.tsx` ahora tiene 4
secciones cross-tenant fuera del `FeatureGate`, más las 2 originales (Distribución de Roles /
Tendencias de Uso) que siguen dentro, correctamente gateadas por plan.

## Verificación

- Backend: suite completa **760 tests**, mismos **10 fallos preexistentes y no relacionados**
  (throttles de `auth_app`, `chat_assistant`, un test de `support`) en cada corrida de la sesión —
  confirmado que no tocan ninguno de los archivos modificados.
- Frontend: `features/reports` 7/7, `tsc --noEmit` limpio en cada iteración.
- Manual: capturas del usuario confirmando KPIs y Distribución de Roles con datos reales tras el
  primer fix.

## Deuda / siguiente

- **Yape sin expiración automática de período:** un tenant que deja de pagar mantiene su plan
  pagado indefinidamente (`Subscription.status` nunca baja). Afecta feature-gating real, no solo
  las métricas de este reporte — candidato a tarea propia.
- **`trial_conversions` es una aproximación:** no puede distinguir "convirtió desde trial" de
  "primer pago de un tenant que estuvo en free un tiempo", porque no existe un log de eventos de
  transición de plan.
- **`UsageTrendsChart` con contrato desalineado:** tras corregir el prefijo `/app/`, el gráfico ya
  llega a datos reales, pero `_compute_trends` devuelve `{active_tasks, completed_tasks,
  new_projects}` y el componente pinta `active_users`/`new_projects`/`api_requests` — dos de tres
  líneas quedan vacías. Mismo tipo de deuda que el botón Exportar (`analytics_export` vs.
  `pdf_export`, ya trackeado).
- **`customers.create`/`update`/`delete`/`export` sin usar:** permisos sembrados junto a
  `customers.read`/`suspend`/`analytics` pero sin ninguna vista que los consuma todavía.
