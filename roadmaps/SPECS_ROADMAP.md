# Specs Técnicos (rbac, subscriptions, auth, tenants) — Roadmap

**Carpeta destino**: `specs/`
**Contexto**: ver [`specs/README.md`](../specs/README.md) y el plan original en
`docs/guides/feature-development-workflow.md` (sección "Tasks con criterios
verificables"). Alcance limitado a las 4 apps de backend más críticas — el resto
sigue documentado en `prd/features/`.

Cada fase = un archivo spec. Se trabaja **una fase a la vez**, a pedido del
usuario ("hagamos la fase 2", "continúa con auth", etc.). No se avanza a la
siguiente fase sin que el usuario la solicite explícitamente.

---

## Progreso General

| Fase | Spec | Estado |
|------|------|--------|
| 0 | `specs/README.md` | ✅ Completado |
| 1 | `specs/rbac.md` | ✅ Completado (2026-06-16) |
| 2 | `specs/subscriptions.md` | ✅ Completado (2026-06-16) |
| 3 | `specs/auth.md` | ✅ Completado (2026-06-16) |
| 4 | `specs/tenants.md` | ✅ Completado (2026-06-16) |

---

## Formato común (aplica a las 4 fases)

```markdown
# Spec: <App> (`apps/backend_django/apps/<app>/`)

**Última actualización**: YYYY-MM-DD

## Propósito
## Modelos
## Serializers
## Endpoints
## Permisos y seguridad
## Reglas de negocio no obvias
## Relación con otras apps
## Specs / docs relacionados
```

---

## FASE 1 — `specs/rbac.md`

**Archivos fuente**: `apps/backend_django/apps/rbac/{models,permissions,views,serializers,urls,permission_urls}.py`

Pasos:
1. Documentar modelos: `Permission`, `Role` (herencia `inherits_from`, máx. 3
   niveles), `RolePermission` (scope all/own/department/custom), `UserRole`
   (con `expires_at`)
2. Documentar `HasPermission`, `HasFeature`, `check_plan_limit` — lógica de
   cache Redis 300s + fallback DB con recursión de herencia
3. Tabla de endpoints: `/api/v1/admin/roles/*`, `/api/v1/admin/permissions/`,
   `/api/v1/features/`
4. Reglas no obvias: roles de sistema inmutables desde la API, cache no se
   invalida manualmente al editar un rol
5. Relación con `auth_app` (UserRole → User) y `tenants` (scoping de roles
   custom por tenant)

**Criterio de verificación**: `specs/rbac.md` existe, sigue el formato común,
cita rutas de archivo reales.

---

## FASE 2 — `specs/subscriptions.md`

**Archivos fuente**: `apps/backend_django/apps/subscriptions/{models,views,serializers,stripe_client,yape_public_views,yape_admin_views,urls,subscription_urls,public_urls,yape_admin_urls,yape_public_urls}.py`

Pasos:
1. Documentar modelos: `Subscription` (incluye status `pending_payment`),
   `Invoice`, `PaymentMethod` (Stripe + LATAM, AES-256, único default por
   tenant), `YapePaymentProof`, `YapeConfig` (singleton), `Plan`
2. Documentar `StripeClient` (customer/subscription/upgrade/cancel/webhook) y
   los 4 eventos webhook manejados (siempre responde 200)
3. Documentar flujo Yape completo (activate/reject vía Telegram, admin
   review) con referencia a ADR-004
4. Tabla de endpoints: `/api/v1/admin/subscriptions/*`,
   `/api/v1/admin/billing/*`, `/api/v1/public/plans/`, endpoints Yape
   públicos y admin
5. Reglas no obvias: proration en upgrade, no se puede borrar el único
   payment method con suscripción activa, `admin_token` persistido en DB
   (no Redis) por validez multi-día

**Criterio de verificación**: `specs/subscriptions.md` existe, enlaza a
`docs/adr/004-pago-manual-yape.md` y al reporte de Yape en "Specs/docs
relacionados".

---

## FASE 3 — `specs/auth.md`

**Archivos fuente**: `apps/backend_django/apps/auth_app/{models,tokens,views,serializers,sso_views,admin_views,urls,sso_urls,admin_urls}.py`

Pasos:
1. Documentar modelos: `User` (UUID PK, tenant FK obligatorio, campos MFA),
   `MFARecoveryCode`, `SSOToken` (single-use, TTL 60s)
2. Documentar tokens efímeros en Redis (`tokens.py`): email_verify (24h),
   password_reset (1h), mfa_session (10 min), payment_upload (30 min) — todos
   single-use (delete on consume)
3. Documentar flujos complejos: registro (con webhook N8N async +
   payment_upload_token para planes pagados), login con bifurcación MFA,
   MFA enable→verify-setup→recovery codes, SSO token/validate
4. Tabla de endpoints: 16 públicos de auth + 8 admin de gestión de usuarios
5. Reglas no obvias: `DEBUG=True` auto-verifica email, referral creado en
   registro, tenant queda en `free` con `Subscription.status=pending_payment`
   hasta aprobación Yape (ADR-004)

**Criterio de verificación**: `specs/auth.md` existe, enlaza a
`docs/adr/004-pago-manual-yape.md`.

---

## FASE 4 — `specs/tenants.md`

**Archivos fuente**: `apps/backend_django/apps/tenants/{models,middleware,admin_views,serializers,admin_urls,organization_urls}.py`

Pasos:
1. Documentar modelo `Tenant` (slug/subdomain únicos, plan, `branding`
   JSONField, is_active)
2. Documentar `TenantMiddleware`: resolución vía header `X-Tenant-Slug`,
   cache Redis 5 min, intento de `SET app.tenant_id` para RLS (no
   garantizado), rutas públicas excluidas
3. Tabla de endpoints: `ClientListView`, `SuspendClientView`,
   `OrganizationView`
4. Reglas no obvias: no se puede autosuspender el propio tenant, logo/favicon
   se normalizan a URL absoluta vía `APP_BASE_URL` o `request.build_absolute_uri`
5. Relación con `subscriptions` (`tenant.subscription`) y `rbac`
   (`Role.tenant`)

**Criterio de verificación**: `specs/tenants.md` existe, sigue el formato
común.

---

## Cómo continuar

Pedir explícitamente la fase a trabajar, por ejemplo:

> "hagamos la fase 1" / "continúa con subscriptions" / "sigue con auth"

Al completar cada fase, esta tabla de Progreso General se actualiza marcando
✅ y la fecha.
