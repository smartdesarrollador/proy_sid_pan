# Ideas de Automatizaciones n8n — RBAC Subscription Platform

> Flujos organizados de menor a mayor complejidad.
> Cada flujo indica el **trigger**, los **endpoints** involucrados y el **valor de negocio**.

---

## Convenciones

- **Webhook entrante**: n8n expone una URL que tu backend llama (`POST https://n8n.tudominio.com/webhook/<id>`)
- **Webhook saliente**: n8n llama a tu API (`POST /api/v1/...` con `Authorization: Bearer <token>`)
- Todos los endpoints usan la base: `https://api.tudominio.com`

---

## NIVEL 1 — Básicos (notificaciones simples)

### 1.1 Alerta de nuevo tenant registrado

**Trigger**: Webhook desde `apps/auth_app` al completar `POST /api/v1/auth/register`

**Flujo**:
```
Webhook (POST) → Set node (formatea mensaje) → Send Email (admin)
                                              → Slack/Telegram (canal #nuevos-clientes)
```

**Payload esperado**:
```json
{
  "event": "tenant.created",
  "tenant_id": "uuid",
  "tenant_name": "Acme Corp",
  "admin_email": "owner@acme.com",
  "plan": "free",
  "created_at": "2026-06-05T10:00:00Z"
}
```

**Valor**: Visibilidad inmediata de nuevos registros sin revisar el Admin Panel.

---

### 1.2 Notificación de nuevo ticket de soporte

**Trigger**: Webhook desde `apps/support` al crear `SupportTicket`

**Flujo**:
```
Webhook (POST) → IF priority == 'urgente' → Slack #soporte-urgente + Email equipo
               → ELSE                     → Slack #soporte-general
```

**Payload esperado**:
```json
{
  "event": "ticket.created",
  "ticket_id": "uuid",
  "subject": "No puedo acceder al workspace",
  "priority": "urgente",
  "category": "acceso",
  "tenant_name": "Acme Corp",
  "user_email": "user@acme.com"
}
```

**Valor**: Respuesta rápida a tickets urgentes sin polling manual.

---

### 1.3 Alerta de usuario invitado

**Trigger**: Webhook desde `apps/auth_app` al enviar invitación (`POST /api/v1/auth/invite/`)

**Flujo**:
```
Webhook (POST) → Send Email personalizado al invitado (n8n como relay con template)
              → Log en Google Sheets (tenant, email, rol, fecha)
```

**Valor**: Email de bienvenida customizable sin tocar el backend de Django.

---

### 1.4 Alerta de login fallido repetido

**Trigger**: Webhook desde `apps/auth_app` cuando `AuditLog` registra 3+ fallos en 10 min

**Flujo**:
```
Webhook (POST) → Slack #seguridad + Email al admin del tenant
```

**Payload esperado**:
```json
{
  "event": "auth.brute_force_detected",
  "user_email": "user@acme.com",
  "tenant_id": "uuid",
  "failed_attempts": 5,
  "ip_address": "192.168.1.1",
  "detected_at": "2026-06-05T10:05:00Z"
}
```

**Valor**: Detección de ataques de fuerza bruta en tiempo real.

---

### 1.5 Confirmación de cambio de contraseña

**Trigger**: Webhook desde `apps/auth_app` al procesar `POST /api/v1/auth/change-password/`

**Flujo**:
```
Webhook (POST) → Send Email al usuario (confirma el cambio + enlace "no fui yo")
```

**Valor**: Mejora de seguridad percibida por el usuario final.

---

## NIVEL 2 — Intermedios (lógica condicional + múltiples pasos)

### 2.1 Onboarding secuencial de nuevo tenant

**Trigger**: Webhook `tenant.created` (mismo del flujo 1.1)

**Flujo**:
```
Webhook → Wait 0 min  → Email "Bienvenido, activa tu cuenta"
        → Wait 1 día  → IF email_verified == false → Email recordatorio de verificación
        → Wait 3 días → GET /api/v1/admin/clients/{id}/ → IF proyectos == 0
                          → Email "¿Necesitas ayuda para crear tu primer proyecto?"
        → Wait 7 días → IF plan == 'free' → Email con oferta de upgrade a Starter
```

**Llamadas API intermedias**:
- `GET /api/v1/admin/clients/{tenant_id}/` → verifica estado actual del tenant

**Valor**: Secuencia de onboarding automatizada que aumenta activación y retención.

---

### 2.2 Alerta de límite de plan próximo a agotarse

**Trigger**: Cron en n8n — cada 6 horas

**Flujo**:
```
Cron (cada 6h) → GET /api/v1/admin/clients/?plan=starter,free
              → Loop por tenant
              → IF users_used / max_users >= 0.80
                  → Webhook saliente: Email al admin del tenant
                  → Slack #alertas-plan (interno)
              → IF projects_used / max_projects >= 0.90
                  → Email al admin del tenant con CTA de upgrade
```

**Llamadas API**:
- `GET /api/v1/admin/clients/` con filtros de plan
- Leer campo `usage` del ClientSerializer

**Valor**: Previene sorpresas al usuario y abre oportunidades de upsell.

---

### 2.3 Recordatorio de suscripción próxima a vencer

**Trigger**: Cron diario a las 9:00 AM

**Flujo**:
```
Cron (daily) → GET /api/v1/admin/subscriptions/?expires_in_days=7
             → Loop por tenant
             → IF plan != 'enterprise'
                 → Email al admin del tenant (plantilla con días restantes)
                 → IF plan == 'trial'
                     → Slack #ventas (oportunidad de conversión)
```

**Valor**: Reduce churn por olvido y facilita conversiones de trial.

---

### 2.4 Escalación automática de tickets sin respuesta

**Trigger**: Cron cada hora

**Flujo**:
```
Cron (cada 1h) → GET /api/v1/support/tickets/?status=open&created_before=4h
              → Loop por ticket
              → IF priority == 'urgente' AND sin respuesta > 1h
                  → PATCH /api/v1/support/tickets/{id}/ { "status": "escalated" }
                  → Slack #soporte-urgente con mención al responsable
              → IF priority == 'alta' AND sin respuesta > 4h
                  → Email al supervisor de soporte
```

**Valor**: SLA automático sin supervisión manual de la cola de tickets.

---

### 2.5 Sincronización de nuevos contactos con Google Contacts / HubSpot

**Trigger**: Webhook desde `apps/contacts` al crear contacto

**Flujo**:
```
Webhook (POST) → Google Contacts node (crear/actualizar contacto)
              → IF tenant.plan IN ['professional', 'enterprise']
                  → HubSpot node (crear/actualizar Deal + Contact)
```

**Payload esperado**:
```json
{
  "event": "contact.created",
  "contact_id": "uuid",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "+52 55 1234 5678",
  "tenant_id": "uuid"
}
```

**Valor**: CRM externo siempre sincronizado sin integración directa en Django.

---

### 2.6 Notificación de pago fallido

**Trigger**: Webhook de Stripe `invoice.payment_failed` → n8n

**Flujo**:
```
Stripe Webhook → n8n Webhook node
             → GET /api/v1/admin/clients/?stripe_customer={customer_id}
             → Email urgente al admin del tenant (asunto: "Problema con tu pago")
             → Slack #billing-alerts (equipo interno)
             → IF segundo_fallo
                 → PATCH /api/v1/admin/subscriptions/{id}/ { "status": "past_due" }
```

**Valor**: Comunicación proactiva de problemas de pago antes de suspensión.

---

## NIVEL 3 — Avanzados (flujos multi-sistema + lógica compleja)

### 3.1 Lifecycle completo de suscripción

**Trigger**: Webhooks de múltiples eventos

**Eventos**:
| Evento | Acción n8n |
|--------|-----------|
| `subscription.trial_started` | Email bienvenida + Onboarding sequence |
| `subscription.trial_ending` (3 días antes) | Email urgente + Oferta especial |
| `subscription.upgraded` | Email de confirmación + Slack #ventas (ingreso MRR) |
| `subscription.cancelled` | Email de win-back + encuesta de salida (Typeform) |
| `subscription.reactivated` | Email de bienvenida de vuelta + reset onboarding |

**Flujo principal** (`subscription.cancelled`):
```
Webhook → Set node (calcula MRR perdido)
        → Send Email "Lamentamos verte ir" + enlace encuesta Typeform
        → Wait 3 días
        → IF encuesta_completada == false → Segundo Email con oferta de descuento
        → Wait 7 días
        → IF still_cancelled → Slack #churn con resumen del tenant
        → Wait 30 días → Email final "¿Cambiaste de idea?" con código promo
```

**Valor**: Sistema completo de retención de clientes automatizado.

---

### 3.2 Sistema de alertas de seguridad multi-capa

**Trigger**: Webhook desde `apps/audit` para eventos de seguridad

**Flujo**:
```
Webhook (evento AuditLog) → Switch por event_type:

  CASE 'auth.login_failed' × 3 en 5 min:
    → Slack #seguridad (baja prioridad)

  CASE 'auth.login_failed' × 10 en 10 min:
    → PATCH /api/v1/admin/users/{id}/suspend/ { "active": false }
    → Email al usuario + admin del tenant
    → PagerDuty/OpsGenie alert (crítico)

  CASE 'permission.denied' × 5 en 1 min (mismo usuario):
    → Slack #seguridad con contexto (¿reconocimiento de permisos?)
    → Log en Google Sheets (audit externo)

  CASE 'ssh_key.exported' o 'env_var.accessed':
    → Email inmediato al admin del tenant
    → Slack #seguridad con contexto completo

  CASE 'user.role_changed' (rol a Owner):
    → Email al nuevo Owner + al Owner anterior
    → Require confirmación: GET /api/v1/admin/audit-logs/{id}/
```

**Valor**: SIEM liviano sin necesidad de herramientas enterprise.

---

### 3.3 Reportes automáticos semanales por tenant

**Trigger**: Cron — Lunes 8:00 AM

**Flujo**:
```
Cron (lunes 8am) → GET /api/v1/admin/clients/?plan=starter,professional,enterprise
                → Loop por tenant (máx 10 en paralelo)
                → Para cada tenant:
                    → GET /api/v1/admin/reports/summary/   (KPIs)
                    → GET /api/v1/admin/audit-logs/?week=true  (actividad)
                    → GET /api/v1/support/tickets/?status=open  (tickets abiertos)
                    → HTTP Request node → Google Sheets (log semanal)
                    → Send Email al admin del tenant con HTML template:
                        - Usuarios activos esta semana
                        - Proyectos creados
                        - Tickets abiertos
                        - Uso de recursos vs límite del plan
```

**Valor**: Cada cliente recibe un "estado de cuenta" semanal sin trabajo manual.

---

### 3.4 Pipeline de detección de tenants inactivos y win-back

**Trigger**: Cron — Primer día del mes, 10:00 AM

**Flujo**:
```
Cron (mensual) → GET /api/v1/admin/clients/
              → Loop por tenant
              → GET /api/v1/admin/audit-logs/?tenant={id}&days=30
              → IF total_events < 10 AND plan != 'free'
                  → Clasificar como "en riesgo de churn"
                  → Email personalizado:
                      IF tenant.plan == 'starter'  → "¿Necesitas ayuda?"
                      IF tenant.plan == 'professional' → Oferta de sesión de onboarding
                  → Slack #customer-success con lista de tenants en riesgo
              → IF total_events == 0 AND plan == 'free' AND days_since_register > 14
                  → Email "¿Lograste lo que buscabas?" + enlace para cancelar limpio
              → Guardar resultados en Google Sheets (tracker de churn mensual)
```

**Valor**: Detecta churn antes de que suceda y activa recuperación proactiva.

---

### 3.5 Automatización de promociones basada en comportamiento

**Trigger**: Cron diario + Webhooks de eventos

**Sub-flujo A — Código promo por upgrade**:
```
Webhook 'subscription.plan_viewed' × 3 (mismo tenant, mismo plan) →
  → Verificar: no tiene código activo
  → POST /api/v1/admin/promotions/ (generar código 15% descuento, 48h TTL)
  → Email al admin del tenant con el código
```

**Sub-flujo B — Premio por referido**:
```
Webhook 'tenant.created' con campo referral_code →
  → GET /api/v1/admin/promotions/{code}/   (validar código)
  → PATCH /api/v1/admin/subscriptions/{referrer_tenant_id}/ (crédito al referidor)
  → Email al referidor: "¡Ganaste 1 mes gratis!"
  → Email al nuevo tenant: "Tu descuento de bienvenida está activo"
```

**Sub-flujo C — Reactivación con oferta**:
```
Webhook 'subscription.cancelled' →
  → Wait 7 días
  → POST /api/v1/admin/promotions/ (código único 30% descuento, 72h TTL)
  → Email de win-back con código personalizado
```

**Valor**: Promociones dinámicas sin modificar el código fuente.

---

### 3.6 Integración bidireccional con Slack (ChatOps)

**Trigger**: Slash command en Slack + Webhooks del sistema

**Flujo A — Consulta desde Slack**:
```
Slack /rbac status @tenant:acme →
  → n8n Webhook recibe comando
  → GET /api/v1/admin/clients/?search=acme
  → Formato rich Slack Block Kit con:
      - Plan, MRR, usuarios activos
      - Tickets abiertos
      - Último login del admin
  → Respond to Slack
```

**Flujo B — Acción desde Slack**:
```
Slack /rbac suspend-tenant acme →
  → n8n Webhook
  → Pedir confirmación con botones interactivos (Sí / No)
  → IF confirmado:
      → POST /api/v1/admin/clients/{id}/suspend/ { "active": false }
      → Log en #audit-actions
  → IF cancelado: "Acción cancelada"
```

**Flujo C — Alerta → Slack con acciones**:
```
Webhook 'subscription.past_due' →
  → Slack mensaje con botones:
      [Enviar email de cobro] [Ver historial] [Suspender]
  → Cada botón dispara su propio Webhook en n8n
```

**Valor**: Operaciones críticas sin abrir el Admin Panel.

---

### 3.7 Sincronización de audit logs a sistema externo (SIEM / Data Warehouse)

**Trigger**: Cron cada 15 minutos

**Flujo**:
```
Cron (15 min) → GET /api/v1/admin/audit-logs/?since={last_sync_timestamp}
             → IF registros > 0:
                 → Loop por lote de 100
                 → HTTP Request → BigQuery / ElasticSearch / Datadog Logs
                 → Guardar `last_sync_timestamp` en n8n Static Data
             → IF error en envío:
                 → Reintentar con backoff (3 intentos)
                 → Slack #infra si persiste el error
```

**Valor**: Audit log redundante e independiente del sistema principal para compliance.

---

## Resumen de flujos por complejidad

| # | Nombre | Complejidad | Trigger | Servicios externos |
|---|--------|-------------|---------|-------------------|
| 1.1 | Nuevo tenant | Básico | Webhook | Email, Slack |
| 1.2 | Ticket creado | Básico | Webhook | Slack |
| 1.3 | Usuario invitado | Básico | Webhook | Email, Sheets |
| 1.4 | Login fallido | Básico | Webhook | Slack, Email |
| 1.5 | Cambio contraseña | Básico | Webhook | Email |
| 2.1 | Onboarding secuencial | Intermedio | Webhook + Wait | Email |
| 2.2 | Límite de plan | Intermedio | Cron | Email, Slack |
| 2.3 | Suscripción próxima a vencer | Intermedio | Cron | Email, Slack |
| 2.4 | Escalación de tickets | Intermedio | Cron | API propia, Slack |
| 2.5 | Sync contactos | Intermedio | Webhook | Google Contacts, HubSpot |
| 2.6 | Pago fallido | Intermedio | Stripe Webhook | Email, Slack, API propia |
| 3.1 | Lifecycle suscripción | Avanzado | Multi-webhook | Email, Typeform, Slack |
| 3.2 | Alertas de seguridad | Avanzado | Webhook Audit | Slack, PagerDuty, API propia |
| 3.3 | Reportes semanales | Avanzado | Cron | Email, Sheets, API propia |
| 3.4 | Detección inactivos | Avanzado | Cron | Email, Slack, Sheets |
| 3.5 | Promociones por comportamiento | Avanzado | Cron + Webhook | Email, API propia |
| 3.6 | ChatOps Slack | Avanzado | Slack Slash | Slack, API propia |
| 3.7 | Sync audit a SIEM | Avanzado | Cron | BigQuery/Elastic, Slack |

---

## Próximos pasos para implementar

1. **Exponer webhooks desde Django**: agregar llamadas a n8n en los signals de Django (`post_save`, `post_delete`) o en los ViewSets con un `WebhookService` centralizado.
2. **Autenticación de webhooks**: usar un `WEBHOOK_SECRET` compartido en el header `X-Webhook-Signature` (HMAC SHA-256) para verificar que las llamadas vienen de tu backend.
3. **Empezar por los básicos** (1.1 → 1.2 → 2.1) para validar la integración antes de implementar los flujos avanzados.
4. **Token de servicio**: crear un usuario de tipo `service_account` en el Admin Panel con permisos mínimos necesarios para que n8n pueda llamar a la API.
