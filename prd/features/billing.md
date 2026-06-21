# Billing & Subscriptions Feature

[⬅️ Volver al README](../README.md)

---

## Índice
- [Planes de Suscripción](#planes-de-suscripción)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Feature Gates](#feature-gates)
- [Límites de Uso](#límites-de-uso)
- [Pago Manual vía Yape (implementado)](#pago-manual-vía-yape-implementado)

---

## Planes de Suscripción

### Free Plan ($0/mes)

**Límites:**
- 5 usuarios
- 1 GB storage
- 1,000 API calls/mes
- 2 proyectos
- 50 items
- 3 secciones por proyecto

**Features:**
- Roles predefinidos
- Autenticación básica
- Calendarioensaje personal (50 eventos/mes)
- Tareas personales (100 tareas activas)
- Notificaciones in-app (100/día)
- Dashboard básico

---

### Starter Plan ($29/mes)

**Límites:**
- 10 usuarios
- 5 GB storage
- 10,000 API calls/mes
- 10 proyectos
- 200 items
- 10 secciones por proyecto

**Features:**
- Todo lo de Free +
- MFA (TOTP)
- Calendarios compartidos (200 eventos/mes)
- Asignación de tareas
- Email notifications (500/día)
- Compartición con link público
- Exportar CSV
- Operaciones batch básicas

---

### Professional Plan ($99/mes)

**Límites:**
- 50 usuarios
- 50 GB storage
- 100,000 API calls/mes
- Proyectos ilimitados
- Items ilimitados
- Secciones ilimitadas

**Features:**
- Todo lo de Starter +
- Roles personalizados
- Jerarquía de roles
- Permisos condicionales
- Calendarios ilimitados con integración Google/Outlook
- Subtareas y dependencias
- Tableros Kanban
- Push notifications
- Control de versiones de archivos
- Custom branding
- Plantillas de proyectos
- Búsqueda full-text
- Operaciones batch avanzadas
- Exportar CSV/JSON

---

### Enterprise Plan (Custom pricing)

**Límites:**
- Usuarios ilimitados
- Storage ilimitado
- API calls ilimitados
- Todo ilimitado

**Features:**
- Todo lo de Professional +
- SSO/SAML integration
- Custom domains
- SLA 99.9%
- Priority support
- Webhooks
- Advanced analytics
- Compliance reports (SOC2, GDPR)
- Geo-redundancy
- Dedicated account manager
- Automatizaciones
- Integraciones Jira/Asana
- DLP (Data Loss Prevention)
- Watermarking
- Auditoría avanzada
- Compartición externa

---

## User Stories

### US-013: Selección de Plan Durante Onboarding

**Como** nuevo usuario, quiero elegir un plan (Free trial, Starter, Professional) durante el registro, para empezar con el plan adecuado a mis necesidades.

**Criterios de Aceptación:**
- [x] Durante onboarding, se muestra comparación de planes con features/límites
- [x] El plan Professional ofrece trial de 30 días gratis (`?plan=professional&trial=true`) — no requiere tarjeta ni Yape
- [x] Si elige plan Starter/Enterprise, continúa por flujo Yape (ver sección Pago Manual vía Yape)
- [x] Tras trial, si no upgradea, pasa a plan Free (Celery hace downgrade automático a las 4AM)
- [x] Email recordatorio 7 días antes de fin de trial
- [ ] Dashboard muestra días restantes de trial con CTA "Upgrade Now" (pendiente)

---

### US-014: Upgrade de Plan con Proration

**Como** admin en plan Starter, quiero hacer upgrade a Professional a mitad de mes, pagando solo la diferencia prorrateada, para aprovechar features inmediatamente sin pagar de más.

**Criterios de Aceptación:**
- [ ] Botón "Upgrade Plan" disponible en Billing settings
- [ ] Sistema calcula proration: (días restantes / días totales) * diferencia de precio
- [ ] Muestra breakdown: "Starter restante: -$X, Professional prorrateado: +$Y, Total hoy: $Z"
- [ ] Tras confirmar, se cobra proration inmediatamente
- [ ] Plan actualiza al instante (sin esperar a fin de mes)
- [ ] Siguiente factura será Professional completo (ciclo mensual/anual)
- [ ] Email confirmación con recibo PDF

---

### US-015: Downgrade de Plan con Límites

**Como** admin en plan Professional, quiero hacer downgrade a Starter, entendiendo que perderé features y ajustaré límites.

**Criterios de Aceptación:**
- [ ] Sistema valida límites del nuevo plan (ej: Starter = 10 usuarios, Pro = 50)
- [ ] Si excede límites, muestra advertencia: "Tienes 25 usuarios, Starter permite 10. Desactiva 15 usuarios para continuar."
- [ ] Tras confirmar, downgrade toma efecto al final del ciclo de facturación actual
- [ ] No se cobra proration (se mantiene Pro hasta fin de período pagado)
- [ ] Features de Pro permanecen activas hasta fin de ciclo
- [ ] Email confirmación con fecha efectiva del downgrade

---

### US-016: Gestión de Métodos de Pago

**Como** admin, quiero agregar/editar/eliminar tarjetas de crédito, para tener control sobre cómo se factura mi suscripción.

**Criterios de Aceptación:**
- [ ] Pantalla "Payment Methods" muestra tarjetas guardadas (últimos 4 dígitos, brand, exp)
- [ ] Puedo agregar nueva tarjeta con Stripe Elements (PCI-compliant)
- [ ] Puedo marcar una tarjeta como "Default" para futuros cargos
- [ ] Puedo eliminar tarjetas (excepto la default si hay suscripción activa)
- [ ] Webhook de Stripe notifica si tarjeta expira/es declinada
- [ ] Sistema intenta cobrar con tarjetas alternativas antes de suspender servicio

---

### US-017: Facturación Automática y Recibos

**Como** admin, quiero que el sistema facture automáticamente cada mes/año y me envíe recibos, para no preocuparme por renovaciones.

**Criterios de Aceptación:**
- [ ] Cronjob diario verifica suscripciones a renovar (fecha de facturación)
- [ ] Se crea cargo en Stripe con descripción del plan y período
- [ ] Tras cobro exitoso, se extiende fecha de próxima renovación
- [ ] Se genera PDF con recibo (logo empresa, desglose, impuestos)
- [ ] Email con recibo adjunto + link a descargar desde dashboard
- [ ] Si falla pago, se reintenta 3 veces (día 1, 3, 7) antes de suspender
- [ ] Email notificación de fallo de pago con link para actualizar método

---

### US-018: Cancelación de Suscripción

**Como** admin insatisfecho, quiero cancelar mi suscripción, manteniendo acceso hasta el final del período pagado.

**Criterios de Aceptación:**
- [ ] Botón "Cancel Subscription" en Billing settings
- [ ] Modal de confirmación explica: "Acceso hasta [fecha], luego pasarás a plan Free"
- [ ] Opcional: formulario de feedback sobre razón de cancelación
- [ ] Tras confirmar, suscripción marca como "canceled" pero activa hasta fin de período
- [ ] No se cobra siguiente ciclo
- [ ] Email confirmación con fecha de fin de acceso
- [ ] Al llegar fecha, tenant migra a plan Free (se deshabilitan features Pro)

---

### US-019: Feature Gates por Plan

**Como** desarrollador del sistema, quiero que features se habiliten/deshabiliten automáticamente según el plan, para monetizar correctamente.

**Criterios de Aceptación:**
- [ ] Tabla `features` define qué features están disponibles en qué planes
- [ ] Middleware backend valida feature gate en cada request (`@require_feature('advanced_roles')`)
- [ ] Si usuario intenta usar feature no disponible, respuesta 402 Payment Required con mensaje "Upgrade to Professional"
- [ ] Frontend consulta features disponibles al cargar (endpoint `/api/v1/features`)
- [ ] Componentes se ocultan/deshabilitan si feature no disponible
- [ ] Ejemplo features: custom_roles (Pro+), mfa (Starter+), sso (Enterprise), api_access (Pro+)

---

### US-020: Límites de Uso por Plan

**Como** admin en plan Starter, quiero ver cuánto he consumido de mis límites (usuarios, storage, API calls), para saber cuándo necesito upgrade.

**Criterios de Aceptación:**
- [ ] Dashboard muestra progress bars: "8/10 users", "2.3GB/5GB storage", "1,234/10,000 API calls"
- [ ] Límites se validan en tiempo real (ej: no puedo invitar usuario #11 en Starter)
- [ ] Al acercarse a límite (80%), email de advertencia
- [ ] Al alcanzar 100%, modal sugiere upgrade
- [ ] Tabla `usage_tracking` registra consumo diario para analytics
- [ ] Planes: Free (5 users, 1GB, 1k API), Starter (10/5GB/10k), Pro (50/50GB/100k), Enterprise (unlimited)

---

## Functional Requirements

### FR-014: Planes de Suscripción
- El sistema DEBE soportar planes: Free (0/mes), Starter ($29/mes), Professional ($99/mes), Enterprise (custom)
- Planes DEBEN definir límites: usuarios, storage, API calls/mes
- Planes DEBEN definir features: custom_roles, mfa, sso, api_access, custom_branding, priority_support
- El sistema DEBE permitir facturación mensual y anual (10% descuento anual)

### FR-015: Trial y Onboarding
- El sistema DEBE ofrecer trial de **30 días sin tarjeta** (plan Professional) ✅ implementado
- El trial DEBE estar disponible al registrarse (`?plan=professional&trial=true`) y para usuarios Free existentes desde `/subscription` ✅ implementado
- El trial solo aplica a tenants con `plan='free'` — no a Starter ni Enterprise ✅ implementado
- Solo se permite **un trial por organización** (`professional_trial_used` en `Tenant`) ✅ implementado
- El sistema DEBE enviar email de recordatorio 7 días antes del vencimiento ✅ implementado
- Tras trial, DEBE migrar a plan Free automáticamente (Celery Beat, crontab 4AM) ✅ implementado
- Plan Free DEBE deshabilitar features Pro y aplicar límites al vencer el trial ✅ implementado

### FR-016: Upgrade/Downgrade con Proration
- El sistema DEBE calcular proration al upgrade: (días restantes/días totales) * diferencia
- Upgrade DEBE ser inmediato tras confirmación
- Downgrade DEBE tomar efecto al final del período pagado
- El sistema DEBE validar límites al downgrade (ej: no downgrade si excede users)

### FR-017: Facturación Automática
- Cronjob diario DEBE verificar renovaciones pendientes
- El sistema DEBE cargar método de pago default vía Stripe
- El sistema DEBE generar recibo PDF con logo, desglose, impuestos
- El sistema DEBE enviar email con recibo tras cobro exitoso
- El sistema DEBE reintentar 3 veces (día 1, 3, 7) si fallo de pago
- Tras 3 fallos, DEBE suspender servicio (soft delete, datos preservados 30d)

### FR-018: Gestión de Métodos de Pago
- El sistema DEBE integrar Stripe Elements (PCI-compliant) para agregar tarjetas
- El sistema DEBE almacenar solo Stripe token, NO datos de tarjeta
- El sistema DEBE permitir múltiples tarjetas con una marcada como default
- Webhook DEBE notificar tarjetas expiradas/declinadas

### FR-019: Cancelación
- El sistema DEBE permitir cancelar suscripción manteniendo acceso hasta fin de período
- El sistema DEBE recopilar feedback (opcional) sobre razón de cancelación
- El sistema DEBE enviar email confirmación con fecha efectiva
- Al llegar fecha, DEBE migrar a plan Free (deshabilitar features, aplicar límites)

### FR-020: Feature Gates
- El sistema DEBE validar acceso a features según plan en backend (middleware/decorators)
- API DEBE responder 402 Payment Required si feature no disponible en plan
- Frontend DEBE ocultar/deshabilitar componentes de features no disponibles
- El sistema DEBE cachear features disponibles para performance

### FR-021: Límites de Uso
- El sistema DEBE trackear: usuarios activos, storage usado, API calls/mes
- El sistema DEBE bloquear acciones que excedan límites (ej: invitar usuario #11 en Starter)
- El sistema DEBE mostrar progress bars de límites en dashboard
- El sistema DEBE enviar emails al 80% y 100% de consumo

---

## Feature Gates

### Features por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Core** |
| Basic Auth | ✅ | ✅ | ✅ | ✅ |
| Predefined Roles | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| **Security** |
| MFA (TOTP) | ❌ | ✅ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ❌ | ✅ |
| **RBAC** |
| Custom Roles | ❌ | ❌ | ✅ | ✅ |
| Role Hierarchy | ❌ | ❌ | ✅ | ✅ |
| Conditional Permissions | ❌ | ❌ | ✅ | ✅ |
| Permission Delegation | ❌ | ❌ | ✅ | ✅ |
| **Services** |
| Shared Calendars | ❌ | ✅ | ✅ | ✅ |
| Calendar Integration | ❌ | ❌ | ✅ | ✅ |
| Task Assignment | ❌ | ✅ | ✅ | ✅ |
| Kanban Boards | ❌ | ❌ | ✅ | ✅ |
| Email Notifications | ❌ | ✅ | ✅ | ✅ |
| Push Notifications | ❌ | ❌ | ✅ | ✅ |
| Public Links | ❌ | ✅ | ✅ | ✅ |
| File Versioning | ❌ | ❌ | ✅ | ✅ |
| **Productivity Services** |
| Notas | 10 | 100 | 1.000 | ∞ |
| Contactos | 25 | 100 | ∞ | ∞ |
| Bookmarks | 20 | 100 | ∞ | ∞ |
| **DevOps Services** |
| Variables de Entorno | ❌ | 25 | ∞ | ∞ |
| Claves SSH | ❌ | 5 | ∞ | ∞ |
| Certificados SSL | ❌ | 10 | ∞ | ∞ |
| Snippets de Código | 10 | 50 | ∞ | ∞ |
| **Admin Services** |
| Formularios | 1 | 5 | 25 | ∞ |
| Log de Auditoría | ❌ | ❌ | 30 días retención | 365 días retención |
| Reportes del Sistema | ❌ | Básico | Avanzado | Personalizado |
| **Projects** |
| Batch Operations | ❌ | Basic | ✅ | ✅ |
| Project Templates | ❌ | ❌ | ✅ | ✅ |
| Full-text Search | ❌ | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ | ✅ |
| Export JSON | ❌ | ❌ | ✅ | ✅ |
| **Advanced** |
| Custom Branding | ❌ | ❌ | ✅ | ✅ |
| Custom Domains | ❌ | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ |
| Compliance Reports | ❌ | ❌ | ❌ | ✅ |

---

## Límites de Uso

### Límites por Plan

| Recurso | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Usuarios** | 5 | 10 | 50 | Unlimited |
| **Storage** | 1 GB | 5 GB | 50 GB | Unlimited |
| **API Calls/mes** | 1,000 | 10,000 | 100,000 | Unlimited |
| **Proyectos** | 2 | 10 | Unlimited | Unlimited |
| **Items** | 50 | 200 | Unlimited | Unlimited |
| **Secciones/proyecto** | 3 | 10 | Unlimited | Unlimited |
| **Eventos calendario/mes** | 50 | 200 | Unlimited | Unlimited |
| **Tareas activas** | 100 | 500 | Unlimited | Unlimited |
| **Notificaciones/día** | 100 | 500 | Unlimited | Unlimited |
| **Tamaño archivo** | 10 MB | 50 MB | 500 MB | 5 GB |
| **Sesiones concurrentes** | 3 | 5 | 10 | Unlimited |
| **Compartir usuarios max** | 5 | 20 | 50 | Unlimited |

---

## Panel de Historial Financiero

### Descripción
Panel UI administrativo dedicado a la gestión y visualización del historial financiero del workspace. Complementa la sección de "Gestión de Suscripciones" (plan actual y upgrades) con el historial detallado de transacciones, facturas descargables y estado de métodos de pago. Es la vista de facturación que los administradores consultan para reporting financiero y resolución de disputas.

**Diferenciación con SubscriptionManagement:**
- **SubscriptionManagement**: Plan actual, comparativa de planes, upgrade/downgrade → orientado a decisiones de compra
- **Panel de Historial Financiero**: Historial de pagos, facturas, transacciones, métodos registrados → orientado a accounting y compliance

### Características Clave
1. **Stats row**: 3 cards — Total Facturado (paid), Pendiente de Cobro (pending), Próxima Factura (fecha + monto estimado)
2. **Métodos de pago**: Cards con brand, últimos 4 dígitos, vencimiento, badge "Principal" para el predeterminado
3. **Agregar método**: Botón disponible solo con `billing.manage`; oculto (no deshabilitado) para `billing.read`
4. **Tabla de facturas**: # factura, período de cobertura, monto, badge de estado, botón descarga PDF
5. **Timeline de transacciones**: Lista vertical con dot de color por estado (verde/amarillo/rojo), monto, descripción y timestamp
6. **Ordenamiento**: Cronológico descendente (más reciente primero)

### Feature Gates por Plan

| Plan | Disponible | Historial facturas | Descarga PDF | Timeline transacciones |
|------|-----------|-------------------|-------------|----------------------|
| Free | ❌ | — | — | — |
| Starter | ✅ | 12 meses | ✅ | 30 días |
| Professional | ✅ | 24 meses | ✅ | 12 meses |
| Enterprise | ✅ | Ilimitado | ✅ | Ilimitado |

### User Stories Referenciadas
- **US-016**: Gestionar métodos de pago registrados
- **US-017**: Ver historial de facturación automática
- **US-112**: Panel de historial financiero admin con stats, métodos de pago y timeline

### Requerimientos Funcionales
- **FR-135**: Panel de historial financiero administrativo con stats cards, métodos de pago, tabla de facturas y timeline de transacciones

### Permisos RBAC por Rol

| Rol | Ver historial | Ver métodos de pago | Agregar método de pago | Descargar facturas |
|-----|--------------|--------------------|-----------------------|-------------------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ❌ | ❌ | ❌ | ❌ |
| Member | ❌ | ❌ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ |

> **Nota**: El permiso `billing.read` lo tienen Owner y, opcionalmente, roles personalizados configurados por el Owner. `billing.manage` es exclusivo del Owner por defecto.

---

## Trial Gratuito 30 Días Plan Professional (implementado)

### Descripción

Flujo de prueba gratuita de 30 días del plan Professional, disponible en dos puntos de entrada:

1. **Al registrarse**: `GET /register?plan=professional&trial=true` → el Step 3 muestra precio "Gratis →", badge "30 días gratis" y el Step 4 confirma la activación sin pasar por Yape.
2. **Usuario Free existente**: desde `/subscription` → botón "Probar 30 días gratis" en la tarjeta Professional → `POST /api/v1/admin/subscriptions/trial`.

Decisión de arquitectura documentada en [ADR-006 — Trial Gratuito Plan Professional](../../docs/adr/006-trial-gratuito-plan-professional.md).
Implementación documentada en [reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md](../../reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md).

### Reglas de negocio

- Solo disponible para tenants con `plan='free'` (no Starter ni Enterprise)
- Un trial por organización (`Tenant.professional_trial_used = True` tras activarse)
- Al vencer: Celery Beat (4AM) hace downgrade a Free automáticamente
- Recordatorio 7 días antes del vencimiento (Celery Beat, 10AM)
- `Subscription.status = 'trialing'` durante el período (MRR reportado como $0 en Admin Panel)

### User Stories

#### US-121: Registro con Trial Professional
**Como** nuevo usuario, quiero probar el plan Professional 30 días gratis al registrarme, sin necesidad de pagar.

**Criterios de Aceptación:**
- [x] URL `?plan=professional&trial=true` preselecciona Professional con badge "30 días gratis"
- [x] El precio muestra "Gratis →" en lugar del precio mensual
- [x] El Step 4 muestra banner "¡Prueba Professional activa por 30 días!" sin paso de pago
- [x] `Subscription.status = 'trialing'`, `trial_end = now + 30d`
- [x] `Tenant.professional_trial_used = True` para prevenir trials duplicados

#### US-122: Activación de Trial desde Suscripción (usuario Free existente)
**Como** usuario con plan Free, quiero activar un trial de 30 días de Professional desde mi panel de suscripción.

**Criterios de Aceptación:**
- [x] El botón "Probar 30 días gratis" aparece solo si `plan='free'` y `professional_trial_used=False`
- [x] El botón desaparece si ya se usó el trial (`professional_trial_used=True`)
- [x] Al confirmar, `CurrentPlanCard` muestra banner con fecha de vencimiento del trial
- [x] `POST /api/v1/admin/subscriptions/trial` requiere permiso `subscriptions.manage`

#### US-123: Expiración Automática del Trial
**Como** sistema, debo degradar automáticamente los trials vencidos a plan Free.

**Criterios de Aceptación:**
- [x] Celery Beat corre `expire_professional_trials` diario a las 4AM
- [x] Busca `status='trialing'`, `trial_end <= now()` → downgrade a `plan='free'`, `status='active'`
- [x] Email enviado al owner del tenant al vencer
- [x] Celery Beat corre `remind_professional_trial_expiry` diario a las 10AM
- [x] Busca trials con `trial_end` en ventana `[now+6d, now+8d]` → envía email de recordatorio

### Functional Requirements

#### FR-145: Trial Professional al Registro
- `RegisterSerializer` DEBE aceptar `is_trial: bool` (default False)
- Si `plan='professional'` e `is_trial=True`: crear suscripción `status='trialing'`, `trial_end=now+30d`, `tenant.plan='professional'`, `tenant.professional_trial_used=True`
- `RegisterView` DEBE retornar `{ trial_active: true, trial_end: '...' }` omitiendo el flujo de pago Yape
- Si `professional_trial_used=True`: rechazar con error 400 `trial_already_used`

#### FR-146: Trial Professional para Usuarios Existentes
- `StartTrialView` (`POST /api/v1/admin/subscriptions/trial`) DEBE validar `tenant.plan == 'free'`
- DEBE validar `tenant.professional_trial_used == False`
- DEBE ejecutar la actualización en `transaction.atomic()`
- DEBE retornar la suscripción actualizada via `CurrentSubscriptionSerializer`

#### FR-147: Expiración y Recordatorio de Trial
- `expire_professional_trials`: crontab `hour=4, minute=0`, downgrade atómico por tenant, email al owner
- `remind_professional_trial_expiry`: crontab `hour=10, minute=0`, ventana `[now+6d, now+8d]`
- Ambas tareas registradas en `CELERY_BEAT_SCHEDULE` con `DatabaseScheduler`

---

## Pago Manual vía Yape (implementado)

### Descripción

Mientras las US-013 a US-018 (Stripe, proration, facturación automática) representan
la **visión a futuro** del módulo de billing, el método de pago **actualmente
implementado y en producción** para planes pagados (Starter / Professional /
Enterprise) es un flujo **manual vía Yape** (billetera digital peruana), con
verificación asistida por IA y aprobación humana por Telegram — no Stripe.

Decisión de arquitectura documentada en
[ADR-004 — Pago Manual vía Yape con Verificación Asistida por IA + Telegram](../../docs/adr/004-pago-manual-yape.md).
Incidente de seguridad y fixes de lógica de negocio documentados en
[reports/2026-06-15-implementacion-pago-yape.md](../../reports/2026-06-15-implementacion-pago-yape.md).

### Flujo

```
1. Registro con plan pagado → tenant.plan = 'free' (acceso inmediato)
                              → subscription.plan = plan solicitado, status = 'pending_payment'
2. Usuario paga por Yape y sube comprobante (screenshot) desde el Hub
3. n8n: OpenAI Vision analiza el comprobante → Telegram recibe foto + análisis + botones
4. Admin aprueba o rechaza desde Telegram (página de confirmación GET → acción POST)
   ✅ Aprobado  → tenant.plan = plan solicitado, subscription.status = 'active'
   ❌ Rechazado → tenant.plan permanece 'free', subscription.status = 'active'
5. Email automático notifica al usuario el resultado
```

### User Stories

#### US-118: Registro con Plan Pagado Sin Bloqueo de Acceso

**Como** nuevo usuario que se registra con un plan pagado, quiero poder usar el
producto de inmediato con el plan Free mientras se verifica mi pago, en lugar de
quedar bloqueado esperando aprobación.

**Criterios de Aceptación:**
- [ ] Al registrarse con plan Starter/Professional/Enterprise, `tenant.plan` queda en `free`
- [ ] `subscription.plan` guarda el plan solicitado con `status = 'pending_payment'`
- [ ] El usuario puede iniciar sesión inmediatamente tras verificar su email
- [ ] El Hub muestra instrucciones de pago Yape (número + titular desde `YapeConfig`)

#### US-119: Subida y Verificación de Comprobante Yape

**Como** usuario con un plan pagado pendiente de pago, quiero subir el comprobante
de mi transferencia Yape y recibir una respuesta sobre el estado de mi pago.

**Criterios de Aceptación:**
- [ ] Endpoint `POST /api/v1/auth/yape-payment-proof` acepta `multipart/form-data`
- [ ] Se crea un `YapePaymentProof` con `admin_token` único y `status='pending'`
- [ ] Se dispara un webhook hacia n8n para iniciar el análisis con IA
- [ ] El comprobante y el análisis llegan a un grupo de Telegram con botones de acción

#### US-120: Aprobación/Rechazo Seguro por el Admin

**Como** administrador, quiero aprobar o rechazar un comprobante desde Telegram con
un solo clic, sin que un bot, crawler o vista previa de link active la cuenta por error.

**Criterios de Aceptación:**
- [ ] El link de Telegram lleva a una página de confirmación (`GET`) — no ejecuta ninguna acción
- [ ] La acción real (aprobar/rechazar) solo se ejecuta mediante `POST` desde el botón de confirmación
- [ ] Un comprobante ya procesado (`approved`/`rejected`) no puede volver a procesarse
- [ ] Aprobar activa `tenant.plan` y `subscription.status='active'`, envía email de activación
- [ ] Rechazar mantiene `tenant.plan='free'`, `subscription.status='active'`, envía email explicando que continúa en Free

### Functional Requirements

#### FR-141: Registro con Plan Pagado en Estado Pendiente
- El sistema DEBE crear el tenant siempre con `plan='free'` al registrarse, independientemente del plan solicitado
- El sistema DEBE guardar el plan solicitado en `Subscription.plan` con `status='pending_payment'`
- El sistema NO DEBE bloquear el login del usuario mientras el pago está pendiente

#### FR-142: Comprobante de Pago Yape
- El sistema DEBE permitir subir un comprobante (imagen) asociado a la suscripción pendiente
- El sistema DEBE generar un `admin_token` aleatorio de un solo uso por comprobante
- El sistema DEBE notificar a un canal de Telegram con el comprobante y un análisis automático (OpenAI Vision)

#### FR-143: Aprobación/Rechazo con Patrón GET-Confirmación / POST-Acción
- Los endpoints de aprobación/rechazo DEBEN separar `GET` (página de confirmación, sin efectos secundarios) de `POST` (acción real)
- El sistema DEBE rechazar cualquier intento de procesar un comprobante ya `approved` o `rejected`
- El sistema DEBE registrar auditoría (`AuditLog`) de cada aprobación/rechazo

#### FR-144: Estados Consistentes Tras Revisión
- Tras aprobación: `tenant.plan` = plan solicitado, `subscription.status='active'`, email de activación
- Tras rechazo: `tenant.plan` permanece `'free'`, `subscription.status='active'` (no `'canceled'`), email explicando que el usuario continúa con acceso Free

### Relación con el modelo Stripe (US-013 a US-018)

| Aspecto | Yape manual (implementado) | Stripe automatizado (visión a futuro, US-013–US-018) |
|---------|----------------------------|--------------------------------------------------------|
| Activación | Manual, vía aprobación humana en Telegram | Automática vía webhook de Stripe |
| Mercado | Perú (medio de pago local preferido) | Internacional / tarjetas |
| Proration / downgrade | No aplica aún | FR-016 (proration), FR-019 (cancelación) |
| Facturación recurrente | No — pago único verificado manualmente | FR-017 (cronjob de renovación automática) |

Ambos modelos pueden convivir: Yape para el segmento local sin tarjeta, Stripe como
canal adicional si se decide implementar (ver "Alternativas consideradas" en
ADR-004).

### Deuda técnica / mejoras pendientes

Ver `BACKLOG.md` — TTL de `admin_token`, alerta en Admin Panel para tenants
`pending_payment` con revisión atrasada, autenticación adicional en los endpoints
públicos de Yape.

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Projects Feature](projects.md)
- [Ver Sharing & Collaboration](sharing-collaboration.md)

---

**Última actualización**: 2026-06-21
