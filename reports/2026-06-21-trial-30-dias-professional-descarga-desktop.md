# Trial 30 Días Plan Professional + Descarga Desktop en Landing
**Fecha**: 2026-06-21  
**Componentes**: `apps/backend_django/apps/subscriptions/`, `apps/backend_django/apps/tenants/`, `apps/backend_django/apps/auth_app/`, `apps/frontend_next_hub/features/`  
**Tipo**: Nueva funcionalidad  
**Estado**: ✅ Implementado y verificado en producción  
**Decisión de arquitectura**: [ADR-006 — Trial Gratuito Plan Professional](../docs/adr/006-trial-gratuito-plan-professional.md)

---

## Resumen Ejecutivo

Se implementaron dos features relacionadas:

1. **Trial gratuito de 30 días del plan Professional** — disponible al momento del registro (nuevos usuarios con `?plan=professional&trial=true`) y desde la página de suscripción para usuarios existentes con plan Free. Al vencer, Celery hace downgrade automático a Free y envía email de notificación. Solo se permite un trial por organización, controlado por el campo `professional_trial_used` en el modelo `Tenant`.

2. **Sección de descarga de Desktop en la landing pública** — nueva sección `#download` con tarjetas para Windows, macOS y Linux, reutilizando los componentes `PlatformDownloadCard` y el hook `useLatestReleases` ya existentes. La CTA de la sección y el botón del plan Professional en pricing dirigen al registro con trial.

---

## Arquitectura implementada

### Flujo de registro con trial

```
[Usuario en /register?plan=professional&trial=true]
       ↓
[RegisterPageClient.tsx] — detecta isTrial via useSearchParams()
  muestra badge "30 días gratis" + precio "Gratis →" en tarjeta Professional
       ↓
[POST /api/v1/auth/register] { plan: 'professional', is_trial: true }
       ↓
[RegisterSerializer.save()] — valida professional_trial_used=False
  → Subscription.status='trialing', trial_end=now+30d
  → Tenant.plan='professional', Tenant.professional_trial_used=True
       ↓
[RegisterView] — retorna { trial_active: true, trial_end: '...' }
  (sin paso de Yape/pago)
       ↓
[RegisterPageClient.tsx] — Step 4 muestra banner "¡Prueba Professional activa!"
```

### Flujo de activación de trial para usuario Free existente

```
[Usuario en /subscription — plan Free, professional_trial_used=False]
       ↓
[PlanComparisonGrid] — botón "Probar 30 días gratis" en tarjeta Professional
       ↓
[useStartTrial.ts] POST /api/v1/admin/subscriptions/trial
       ↓
[StartTrialView] — valida plan=Free + trial no usado
  → Subscription: plan='professional', status='trialing', trial_end=now+30d
  → Tenant: plan='professional', professional_trial_used=True
       ↓
[CurrentPlanCard.tsx] — banner "Prueba Professional activa — Termina el <fecha>"
```

### Expiración automática de trials (Celery Beat)

```
Crontab 4AM diario → expire_professional_trials
  Busca: plan='professional', status='trialing', trial_end<=now
  Por cada suscripción encontrada:
    → Downgrade: plan='free', status='active', trial_end=None
    → Tenant.plan='free'
    → Envía email de notificación al owner

Crontab 10AM diario → remind_professional_trial_expiry
  Busca: status='trialing', trial_end en ventana [now+6d, now+8d]
  → Envía email de recordatorio 7 días antes del vencimiento
```

---

## Archivos modificados o creados

### Backend — `apps/backend_django/`

| Archivo | Cambio |
|---------|--------|
| `apps/tenants/models.py` | Campo `professional_trial_used = BooleanField(default=False)` en `Tenant` |
| `apps/tenants/migrations/0004_tenant_professional_trial_used.py` | Migración del campo |
| `apps/auth_app/serializers.py` | `RegisterSerializer`: campo `is_trial`, rama trial en `save()`, return 4-tupla |
| `apps/auth_app/views.py` | `RegisterView`: desempaqueta 4-tupla, retorna `trial_active=True` sin Yape |
| `apps/subscriptions/serializers.py` | `CurrentSubscriptionSerializer`: campo `professional_trial_used` |
| `apps/subscriptions/views.py` | Nueva clase `StartTrialView` |
| `apps/subscriptions/subscription_urls.py` | `path('trial', StartTrialView.as_view())` |
| `apps/subscriptions/tasks.py` | `expire_professional_trials` + `remind_professional_trial_expiry` |
| `config/settings/base.py` | Dos entradas en `CELERY_BEAT_SCHEDULE` (4AM y 10AM) |
| `apps/tenants/serializers.py` | **Bugfix**: `ClientSubscriptionSerializer` — removido `source='plan'` redundante; `get_mrr()` retorna 0 para `trialing` |

### Frontend Hub — `apps/frontend_next_hub/`

| Archivo | Cambio |
|---------|--------|
| `types/auth.ts` | `RegisterRequest.is_trial?`, `RegisterResponse.trial_active?` y `trial_end?` |
| `features/auth/AuthContext.tsx` | Pasa `is_trial` en el body del POST de registro |
| `features/auth/RegisterPageClient.tsx` | Badge "30 días gratis", precio "Gratis →", banner Step 4, fix hidratación SSR |
| `features/subscription/hooks/useStartTrial.ts` | **Archivo nuevo** — `useMutation` para `POST /admin/subscriptions/trial` |
| `features/subscription/types.ts` | `CurrentSubscription.professional_trial_used?` |
| `features/subscription/components/CurrentPlanCard.tsx` | Banner de trial activo con fecha de vencimiento |
| `features/subscription/components/PlanComparisonGrid.tsx` | Botón "Probar 30 días gratis" para plan Professional |
| `features/subscription/SubscriptionPageClient.tsx` | `canTrial` + `handleTrial` + props a `PlanComparisonGrid` |
| `features/landing/LandingPageClient.tsx` | Sección `#download`, nav "Descargar", CTA trial en Professional y en desktop |
| `i18n/locales/es.ts` + `en.ts` | Claves: `proTrialCta`, `navDownload`, `downloadTitle`, `downloadSub`, `downloadTrialCta` |

---

## Pasos de deploy ejecutados

1. Push del código → Dokploy rebuild automático del backend
2. `python manage.py migrate` → aplicó `0004_tenant_professional_trial_used`
3. Celery Beat registró las dos nuevas tareas en BD al reiniciar (`DatabaseScheduler`)
4. Push del código Hub → Dokploy rebuild automático del frontend

No se requirieron variables de entorno adicionales.

---

## Decisiones técnicas relevantes

### Un trial por organización (no por usuario)
`professional_trial_used` vive en `Tenant` (no en `Subscription` ni en `User`) para que persista aunque el tenant cambie de plan o se recree la suscripción. Si viviera en `Subscription`, resetear la suscripción permitiría abusar del trial.

### Trial solo disponible para plan Free
`StartTrialView` rechaza con `400 ineligible_plan` si `tenant.plan != 'free'`. Evita el problema de "¿a qué plan reverto al vencer?" — siempre se vuelve a Free.

### Celery Beat con DatabaseScheduler
Las tareas se registran automáticamente en la BD al reiniciar `celery-beat` porque se usa `django_celery_beat.schedulers:DatabaseScheduler`, que sincroniza `CELERY_BEAT_SCHEDULE` de settings en cada arranque.

### Componentes reutilizados en landing
La sección Desktop usa los componentes `PlatformDownloadCard` y `useLatestReleases` ya existentes en `features/desktop/`. No se crearon nuevos componentes. Las tarjetas muestran "Próximamente" mientras no haya releases publicados en la API (`GET /public/desktop/latest/`).

---

## Incidencias durante la implementación

| Incidencia | Causa | Solución |
|-----------|-------|----------|
| Badge "30 días gratis" y precio "Gratis →" no aparecían en Step 3 | `useState(isTrial && preSelectedPlan === 'professional')` — Next.js App Router calcula el estado inicial durante SSR donde `useSearchParams()` retorna params vacíos; React preserva ese `false` en hidratación | `useState(false)` + `useEffect(() => { if (isTrial && ...) setTrialActive(true) }, [isTrial, preSelectedPlan])` |
| Admin Panel mostraba clientes en trial como "Activo" con MRR $99 | `ClientSubscriptionSerializer` tenía `plan = serializers.CharField(source='plan')` que lanza `AssertionError` silencioso; el `except` del `get_subscription()` siempre caía al fallback hardcodeado `status: 'active'` | Removido `source='plan'`; `get_mrr()` retorna `0` cuando `obj.status == 'trialing'` |
| `PlatformDownloadCard` — TypeScript error "Module has no default export" | El componente usa export nombrado, no default | `import { PlatformDownloadCard }` en lugar de `import PlatformDownloadCard` |

---

## Deuda técnica generada

- Email de expiración de trial (`expire_professional_trials`) usa `send_mail` con template básico. Pendiente diseñar template HTML consistente con el resto de emails de la plataforma.
- No existe panel en Admin para ver tenants en estado `trialing` con fecha de vencimiento próxima. Útil para seguimiento comercial (oportunidad de conversión).
- Agregar `professional_trial_used` a la vista de detalle de cliente en el Admin Panel para que los admins puedan ver si un cliente ya usó su trial sin entrar a la BD.
