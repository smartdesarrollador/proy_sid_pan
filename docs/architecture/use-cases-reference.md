# Casos de Uso - Sistema RBAC y Suscripciones

**Documento relacionado:** `use-case-diagram.puml`
**PRD:** `/prd/rbac-subscription-system.md`
**Fecha:** 2026-02-09

---

## Índice de Casos de Uso

### 1. Autenticación y Onboarding (UC-001 a UC-008)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-001 | Registrar Nueva Organización | Usuario No Registrado | Alta |
| UC-002 | Login con JWT | Usuario No Registrado | Alta |
| UC-003 | Refresh Token | Usuario Registrado | Alta |
| UC-004 | Verificar Email | Sistema | Alta |
| UC-005 | Recuperar Contraseña | Usuario No Registrado | Media |
| UC-006 | Configurar MFA | Usuario Registrado | Media |
| UC-007 | Login con MFA | Usuario Registrado | Media |
| UC-008 | Gestionar Sesiones Activas | Usuario Registrado | Baja |

### 2. Gestión de Usuarios (UC-009 a UC-015)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-009 | Invitar Miembros | OrgAdmin | Alta |
| UC-010 | Aceptar Invitación | Usuario Registrado | Alta |
| UC-011 | Ver Lista de Usuarios | OrgAdmin | Alta |
| UC-012 | Editar Perfil de Usuario | Usuario Registrado | Media |
| UC-013 | Desactivar Usuario | OrgAdmin | Media |
| UC-014 | Asignar Rol a Usuario | OrgAdmin | Alta |
| UC-015 | Ver Perfil Propio | Usuario Registrado | Baja |

### 3. Roles y Permisos - RBAC (UC-016 a UC-025)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-016 | Crear Rol Personalizado | OrgAdmin | Alta |
| UC-017 | Editar Rol | OrgAdmin | Alta |
| UC-018 | Eliminar Rol | OrgAdmin | Media |
| UC-019 | Ver Lista de Roles | OrgAdmin | Alta |
| UC-020 | Asignar Permisos a Rol | OrgAdmin | Alta |
| UC-021 | Configurar Herencia de Roles | OrgAdmin | Media |
| UC-022 | Configurar Permisos Condicionales | OrgAdmin | Media |
| UC-023 | Delegar Permisos Temporalmente | Manager | Baja |
| UC-024 | Revocar Delegación | Manager | Baja |
| UC-025 | Crear Grupo de Permisos | OrgAdmin | Baja |

### 4. Suscripciones y Facturación (UC-026 a UC-036)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-026 | Ver Planes Disponibles | Usuario No Registrado / OrgAdmin | Alta |
| UC-027 | Seleccionar Plan en Onboarding | Usuario No Registrado | Alta |
| UC-028 | Upgrade de Plan | OrgAdmin | Alta |
| UC-029 | Downgrade de Plan | OrgAdmin | Media |
| UC-030 | Agregar Método de Pago | OrgAdmin | Alta |
| UC-031 | Ver Historial de Facturas | OrgAdmin | Media |
| UC-032 | Descargar Recibo PDF | OrgAdmin | Media |
| UC-033 | Cancelar Suscripción | OrgAdmin | Media |
| UC-034 | Ver Uso y Límites del Plan | OrgAdmin | Alta |
| UC-035 | Procesar Renovación Automática | Sistema | Alta |
| UC-036 | Reintentar Pago Fallido | Sistema | Alta |

### 5. Multi-Tenancy (UC-037 a UC-040)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-037 | Cambiar Entre Organizaciones | Usuario Registrado | Media |
| UC-038 | Configurar Branding de Tenant | OrgAdmin | Baja |
| UC-039 | Configurar Subdominio Personalizado | OrgAdmin | Baja |
| UC-040 | Ver Métricas de Tenant | OrgAdmin | Media |

### 6. Auditoría y Compliance (UC-041 a UC-046)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-041 | Ver Audit Logs | OrgAdmin | Alta |
| UC-042 | Filtrar y Buscar Audit Logs | OrgAdmin | Alta |
| UC-043 | Exportar Audit Logs a CSV | OrgAdmin | Media |
| UC-044 | Solicitar Datos Personales (GDPR) | Usuario Registrado | Media |
| UC-045 | Eliminar Cuenta (Derecho al Olvido) | Usuario Registrado | Media |
| UC-046 | Registrar Evento en Audit Log | Sistema | Alta |

### 7. Administración del Sistema (UC-047 a UC-051)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-047 | Ver Todos los Tenants | SuperAdmin | Alta |
| UC-048 | Acceder a Datos de Tenant | SuperAdmin | Alta |
| UC-049 | Suspender Tenant | SuperAdmin | Media |
| UC-050 | Ver Métricas Globales | SuperAdmin | Alta |
| UC-051 | Configurar Feature Flags | SuperAdmin | Media |

### 8. Notificaciones (UC-052 a UC-057)

| ID | Nombre | Actor Principal | Prioridad |
|----|--------|-----------------|-----------|
| UC-052 | Enviar Email de Verificación | Sistema | Alta |
| UC-053 | Enviar Email de Invitación | Sistema | Alta |
| UC-054 | Notificar Cambio de Rol | Sistema | Media |
| UC-055 | Notificar Fin de Trial | Sistema | Alta |
| UC-056 | Notificar Fallo de Pago | Sistema | Alta |
| UC-057 | Notificar Límite de Uso | Sistema | Media |

---

## Descripción Detallada de Casos de Uso Críticos

### UC-001: Registrar Nueva Organización

**Actor Principal:** Usuario No Registrado
**Precondiciones:** Ninguna
**Postcondiciones:** Nueva organización creada, usuario es OrgAdmin, plan Free Trial activo

**Flujo Principal:**
1. Usuario accede a página de registro
2. Usuario ingresa: nombre, email, contraseña, nombre organización
3. Sistema valida email único, contraseña fuerte (8+ chars)
4. Sistema crea tenant con subdomain único
5. Sistema crea usuario con rol OrgAdmin
6. Sistema inicia plan Free Trial (14 días)
7. Sistema envía email de verificación (UC-004)
8. Sistema redirige a onboarding wizard

**Flujos Alternativos:**
- 3a. Email ya existe → Mostrar error "Email already registered"
- 3b. Subdomain ya existe → Sugerir alternativa (append número)
- 4a. Fallo en creación → Rollback completo (transacción)

**Requisitos Especiales:**
- Tiempo respuesta: <2s
- Email enviado en <30s
- Subdomain: solo alfanumérico + guiones

---

### UC-016: Crear Rol Personalizado

**Actor Principal:** OrgAdmin
**Precondiciones:** Usuario autenticado con permiso `roles.create`, plan Professional+
**Postcondiciones:** Nuevo rol creado, evento registrado en audit log

**Flujo Principal:**
1. OrgAdmin accede a Settings → Roles
2. OrgAdmin hace clic en "Create Role"
3. OrgAdmin ingresa nombre, descripción
4. OrgAdmin selecciona permisos (checkboxes agrupados por módulo)
5. OrgAdmin opcionalmente selecciona rol padre (herencia)
6. OrgAdmin opcionalmente configura scopes condicionales
7. OrgAdmin hace clic en "Save"
8. Sistema valida nombre único en tenant
9. Sistema crea rol con permisos asociados
10. Sistema registra cambio en audit log (UC-046)
11. Sistema muestra confirmación "Role created successfully"

**Flujos Alternativos:**
- 4a. Plan Free/Starter → Mostrar "Upgrade to Professional to create custom roles"
- 8a. Nombre duplicado → Mostrar error "Role name must be unique"
- 9a. Herencia circular → Mostrar error "Circular inheritance detected"

**Requisitos Especiales:**
- Máximo 50 roles personalizados por tenant (Professional)
- Máximo 3 niveles de herencia
- UI debe mostrar preview de permisos efectivos (incluye heredados)

---

### UC-028: Upgrade de Plan

**Actor Principal:** OrgAdmin
**Precondiciones:** Usuario autenticado, plan actual < target plan, método de pago registrado (o se agrega)
**Postcondiciones:** Plan actualizado, cargo procesado con proration, features desbloqueadas

**Flujo Principal:**
1. OrgAdmin accede a Billing → Plans
2. OrgAdmin hace clic en "Upgrade" en plan superior (ej: Professional)
3. Sistema calcula proration: (días restantes / 30) × (precio_nuevo - precio_actual)
4. Sistema muestra desglose: "Starter remaining: -$15, Pro prorated: +$66, Charge today: $51"
5. OrgAdmin hace clic en "Confirm Upgrade"
6. Si no hay método de pago, sistema solicita agregar tarjeta (UC-030)
7. Sistema procesa cargo en Stripe
8. Sistema actualiza plan inmediatamente
9. Sistema invalida cache de features del tenant
10. Sistema envía email confirmación con recibo (UC-032)
11. Sistema registra evento en audit log (UC-046)
12. Sistema muestra "Plan upgraded successfully"

**Flujos Alternativos:**
- 7a. Cargo rechazado → Mostrar "Payment failed. Please update payment method."
- 7b. Stripe API error → Retry 2 veces, luego mostrar error genérico

**Requisitos Especiales:**
- Proration calculada al segundo (no solo días)
- Features desbloqueadas inmediatamente (sin cache stale)
- Siguiente factura es plan completo (no proration)

---

### UC-035: Procesar Renovación Automática

**Actor Principal:** Sistema (Cronjob diario)
**Precondiciones:** Suscripciones con `current_period_end = today`
**Postcondiciones:** Renovaciones procesadas, facturas generadas, emails enviados

**Flujo Principal:**
1. Cronjob se ejecuta a las 00:00 UTC diario
2. Sistema consulta tenants con `subscription_status = 'active'` AND `current_period_end = today`
3. Para cada tenant:
   a. Sistema obtiene precio del plan actual
   b. Sistema crea cargo en Stripe (`stripe.Charge.create`)
   c. Si exitoso:
      - Actualiza `current_period_end = today + 30 días`
      - Genera recibo PDF (UC-032)
      - Envía email "Payment Successful" con recibo adjunto
      - Registra evento en audit log
   d. Si falla (UC-036):
      - Registra intento fallido
      - Programa reintento para día +3 (cronjob separado)
      - Envía email "Payment Failed" (UC-056)
4. Sistema genera reporte de renovaciones (exitosas/fallidas) para dashboard SuperAdmin

**Flujos Alternativos:**
- 3b. Stripe API down → Skip y reintentar en próximo ciclo (1h después)
- 3c. Tarjeta expirada → Intentar con tarjetas alternativas del customer

**Requisitos Especiales:**
- Idempotencia: verificar que no se cargue 2 veces el mismo período
- Timeout: max 30s por tenant (no bloquear cron si tenant lento)
- Alertas: si >10% fallan, notificar equipo de ingeniería

---

### UC-041: Ver Audit Logs

**Actor Principal:** OrgAdmin
**Precondiciones:** Usuario autenticado con permiso `audit.read`
**Postcondiciones:** Logs visualizados, filtros aplicados

**Flujo Principal:**
1. OrgAdmin accede a Settings → Audit Logs
2. Sistema consulta últimos 100 logs del tenant (ordenados por timestamp DESC)
3. Sistema muestra tabla con columnas:
   - Timestamp
   - Usuario (actor)
   - Acción (ej: "create_role", "assign_role")
   - Recurso (ej: "Role: Content Editor")
   - Cambios (expandible JSON diff)
   - IP Address
4. OrgAdmin opcionalmente aplica filtros:
   - Usuario (dropdown de usuarios del tenant)
   - Acción (dropdown de acciones auditables)
   - Recurso (text search)
   - Rango de fechas (date picker)
5. Sistema recarga tabla con filtros aplicados
6. OrgAdmin opcionalmente hace clic en "Export to CSV" (UC-043)

**Flujos Alternativos:**
- 2a. >10,000 logs → Paginación obligatoria (100 per page)
- 4a. Filtro por fecha >7 años → Mostrar warning "Logs older than 7 years archived"

**Requisitos Especiales:**
- Logs son inmutables (no se pueden editar/eliminar desde UI)
- Performance: queries <500ms incluso con millones de logs (usar índices compuestos)
- Permisos: usuarios solo ven logs de su tenant (RLS enforcement)

---

### UC-046: Registrar Evento en Audit Log

**Actor Principal:** Sistema (Automático en cada cambio)
**Precondiciones:** Acción auditable ejecutada
**Postcondiciones:** Evento registrado inmutablemente

**Flujo Principal:**
1. Sistema detecta acción auditable vía:
   - Signal de Django (post_save, post_delete en modelos críticos)
   - Decorator `@audit_action` en views
   - Llamada explícita `AuditLog.create(...)`
2. Sistema captura contexto:
   - Request: tenant_id, user_id, IP, user_agent
   - Acción: action type, resource type, resource id
   - Cambios: JSON diff antes/después (si apply)
3. Sistema inserta registro en tabla `audit_logs`
4. Sistema NO permite updates/deletes en tabla (DB constraint)
5. Sistema opcionalmente publica evento a message queue (Kafka/RabbitMQ) para analytics

**Acciones Auditables:**
- **Roles:** create, update, delete, assign, revoke
- **Permissions:** grant, revoke
- **Users:** create, update, deactivate, login, logout, mfa_enable
- **Billing:** upgrade, downgrade, payment_success, payment_failed, cancel
- **Tenant:** create, update, suspend
- **SuperAdmin:** access_tenant_data (crítico para compliance)

**Requisitos Especiales:**
- Performance: insert asíncrono (no bloquear request principal)
- Retención: 7 años en DB hot storage, luego archivado a S3 Glacier
- Alertas: monitorear si rate de inserts cae (indica problema en auditoría)

---

## Jerarquía de Actores

```
Usuario No Registrado (Guest)
    |
    v
Usuario Registrado (User)
    |
    +-- Member (usuario básico de organización)
    |      |
    |      v
    |   Manager (gestor con permisos elevados)
    |      |
    |      v
    |   OrgAdmin (administrador de tenant)
    |
    +-- SuperAdmin (administrador de plataforma)
```

**Herencia de Permisos:**
- Member hereda todos los permisos de User
- Manager hereda todos los permisos de Member + permisos adicionales
- OrgAdmin hereda todos los permisos de Manager + permisos de administración
- SuperAdmin tiene permisos especiales cross-tenant (auditado)

---

## Relaciones entre Casos de Uso

### Relaciones <<include>>
Indica que un caso de uso siempre ejecuta otro como parte de su flujo:

- UC-001 (Registrar) **include** UC-004 (Verificar Email)
- UC-001 (Registrar) **include** UC-052 (Enviar Email Verificación)
- UC-009 (Invitar) **include** UC-053 (Enviar Email Invitación)
- UC-014 (Asignar Rol) **include** UC-054 (Notificar Cambio Rol)
- UC-016/017/018/020 (Cambios Roles) **include** UC-046 (Audit Log)
- UC-035 (Renovación) **include** UC-032 (Generar Recibo)
- UC-036 (Reintentar Pago) **include** UC-056 (Notificar Fallo)

### Relaciones <<extend>>
Indica que un caso de uso puede extender opcionalmente a otro:

- UC-003 (Refresh Token) **extends** UC-002 (Login) - cuando token expira
- UC-007 (Login MFA) **extends** UC-002 (Login) - si MFA habilitado
- UC-030 (Agregar Pago) **extends** UC-028 (Upgrade) - si no tiene método
- UC-036 (Reintentar) **extends** UC-035 (Renovación) - si pago falla
- UC-057 (Notificar Límite) **extends** UC-034 (Ver Uso) - al alcanzar 80%

---

## Priorización para Desarrollo

### Fase 1 - MVP (Semanas 1-4)
**Críticos (Must Have):**
- UC-001, UC-002, UC-003, UC-004: Autenticación básica
- UC-009, UC-010, UC-011, UC-014: Gestión usuarios básica
- UC-016, UC-019, UC-020: RBAC básico
- UC-046: Auditoría básica

### Fase 2 - Subscription (Semanas 5-8)
**Críticos (Must Have):**
- UC-026, UC-027, UC-028, UC-030: Billing core
- UC-034, UC-035, UC-036: Uso y renovaciones
- UC-031, UC-032, UC-033: Gestión facturas

### Fase 3 - Advanced RBAC (Semanas 9-12)
**Importantes (Should Have):**
- UC-017, UC-018: Edición roles
- UC-021, UC-022: Herencia y scopes
- UC-023, UC-024: Delegación temporal
- UC-006, UC-007, UC-008: MFA y sesiones
- UC-041, UC-042, UC-043: Auditoría avanzada

### Fase 4 - Enterprise (Post-MVP)
**Deseables (Nice to Have):**
- UC-037: Multi-org switching
- UC-038, UC-039: Branding personalizado
- UC-040: Métricas tenant
- UC-047, UC-048, UC-049, UC-050, UC-051: SuperAdmin features
- UC-044, UC-045: GDPR compliance

---

## Visualización del Diagrama

Para visualizar el diagrama PlantUML, puedes usar:

### Opción 1: VS Code
1. Instalar extensión "PlantUML"
2. Abrir `use-case-diagram.puml`
3. Presionar `Alt+D` para preview

### Opción 2: Online
1. Visitar http://www.plantuml.com/plantuml/uml/
2. Copiar contenido de `use-case-diagram.puml`
3. Pegar y visualizar

### Opción 3: CLI (generar PNG/SVG)
```bash
# Instalar PlantUML
brew install plantuml  # macOS
apt-get install plantuml  # Ubuntu

# Generar imagen
plantuml use-case-diagram.puml
# Output: use-case-diagram.png

# Generar SVG (mejor calidad)
plantuml -tsvg use-case-diagram.puml
# Output: use-case-diagram.svg
```

---

## Referencias

- **PRD Completo:** `/prd/rbac-subscription-system.md`
- **User Stories Detalladas:** Ver sección 3 del PRD
- **Functional Requirements:** Ver sección 4 del PRD
- **Technical Implementation:** Ver sección 6 del PRD

---

**Última Actualización:** 2026-02-09
**Versión:** 1.0
**Autor:** Product Team
