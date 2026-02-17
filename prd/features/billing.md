# Billing & Subscriptions Feature

[⬅️ Volver al README](../README.md)

---

## Índice
- [Planes de Suscripción](#planes-de-suscripción)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Feature Gates](#feature-gates)
- [Límites de Uso](#límites-de-uso)

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
- [ ] Durante onboarding, se muestra comparación de planes con features/límites
- [ ] Por defecto se selecciona Free Trial (14 días, no requiere tarjeta)
- [ ] Si elige plan pago, se solicita método de pago (Stripe Elements)
- [ ] Tras trial, si no upgradea, pasa a plan Free (limitado)
- [ ] Email recordatorio 7 días antes de fin de trial
- [ ] Dashboard muestra días restantes de trial con CTA "Upgrade Now"

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
- El sistema DEBE ofrecer trial de 14 días sin tarjeta (plan Professional)
- El sistema DEBE enviar emails días 7, 12, 13 recordando fin de trial
- Tras trial, si no upgradea, DEBE migrar a plan Free automáticamente
- Plan Free DEBE deshabilitar features Pro y aplicar límites

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

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Projects Feature](projects.md)
- [Ver Sharing & Collaboration](sharing-collaboration.md)

---

**Última actualización**: 2026-02-10
