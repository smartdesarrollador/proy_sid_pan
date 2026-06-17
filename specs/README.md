# Specs

Esta carpeta contiene **specs técnicos** del estado *actual* de los módulos más
críticos del backend: `rbac`, `subscriptions`, `auth_app`, `tenants`. Son el
"plano" del sistema — qué modelos, endpoints, permisos y reglas de negocio existen
hoy, con referencia directa a los archivos de código.

Se limita a estas 4 apps (de las ~22 que tiene `apps/backend_django/apps/`) porque
son las que sostienen multi-tenancy, autenticación y billing — donde más vale tener
un plano preciso para futuras features u onboarding. El resto de apps sigue
apoyándose en los PRDs existentes en [`prd/features/`](../prd/features/).

## Cómo se relaciona con el resto de la documentación

| Carpeta | Pregunta que responde |
|---------|------------------------|
| `specs/` (aquí) | ¿Cómo es el módulo **ahora**? (modelos, endpoints, reglas) |
| `prd/` | ¿Qué problema resuelve una feature **nueva**? |
| `plans/` | ¿Cómo se implementa un cambio puntual? |
| `docs/adr/` | ¿Por qué se eligió este diseño sobre otros? |
| `reports/` | ¿Qué pasó y cómo se solucionó (bug/incidente)? |

Ver también [`docs/guides/feature-development-workflow.md`](../docs/guides/feature-development-workflow.md)
para la dinámica completa de trabajo.

Un spec se actualiza cuando el comportamiento del módulo cambia de forma
significativa (nuevo modelo, nuevo endpoint, regla de negocio nueva) — a diferencia
de los ADR, **no** es inmutable.

## Archivos

- [`rbac.md`](rbac.md) — Permisos, roles, herencia, scopes, feature gates
- [`subscriptions.md`](subscriptions.md) — Planes, billing Stripe, pago manual Yape
- [`auth.md`](auth.md) — Usuarios, JWT, MFA, SSO, registro
- [`tenants.md`](tenants.md) — Multi-tenancy, resolución de tenant, branding

## Resumen arquitectónico transversal

### Flujo Multi-Tenancy
`TenantMiddleware` (`apps/tenants/middleware.py`) resuelve el tenant desde el
header `X-Tenant-Slug` en cada request (excepto rutas públicas: `/api/v1/auth/`,
`/api/health/`, `/api/schema/`, `/api/docs/`, `/api/redoc/`, `/admin/`). Cachea en
Redis 5 min y además intenta `SET app.tenant_id` para Row-Level Security en
Postgres — **no garantizado** en todos los queries (ver nota crítica abajo).

### Flujo RBAC Engine
`HasPermission(codename)` (`apps/rbac/permissions.py`) verifica permisos: cache
Redis 300s → si no está, consulta DB recorriendo roles activos (no expirados) +
herencia (`inherits_from`, máx. 3 niveles) → `RolePermission` por codename.
Superusuarios siempre pasan. El cache no se invalida al cambiar un rol — expira solo.

### Flujo Billing / Plan Enforcement
`HasFeature(feature)` verifica un flag booleano del plan (`utils/plans.py`).
`check_plan_limit(user, resource, current_count)` lanza `PlanLimitExceeded` (402)
si se supera el límite numérico del plan. Ambos leen `tenant.plan`, no la tabla
`Subscription` — son conceptos relacionados pero independientes.

### Notas críticas de implementación

1. Límite de herencia de roles: máximo 3 niveles, para prevenir ciclos
2. Cache de permisos RBAC no se invalida al editar un rol — gap de hasta 300s
3. `StripeClient.upgrade_subscription()` usa `proration_behavior='create_prorations'`
4. Solo 1 `PaymentMethod` con `is_default=True` por tenant — enforced en `save()`
5. `YapePaymentProof.admin_token` se guarda en DB (no Redis) porque los links de
   aprobación/rechazo vía Telegram deben funcionar días después del envío
6. RLS de Postgres no está garantizado — el aislamiento real depende de filtrar
   por `tenant` en cada queryset
7. En `DEBUG=True`, el registro marca `email_verified=True` automáticamente
8. El registro crea un `ReferralCode` para el tenant y, si hay `ref_code`, un
   `Referral` pendiente
9. El webhook de N8N en registro (`N8N_WEBHOOK_REGISTRO_URL`) se llama en un
   thread aparte, sin bloquear la respuesta ni reintentar en caso de fallo
10. Registro con plan pagado: el tenant queda en `plan='free'` y la
    `Subscription` en `status='pending_payment'` hasta que un admin aprueba o
    rechaza el comprobante Yape (ver [`docs/adr/004-pago-manual-yape.md`](../docs/adr/004-pago-manual-yape.md))
