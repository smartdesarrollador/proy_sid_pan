# Functional Requirements & Non-Functional Requirements

[⬅️ Volver al README](../README.md)

---

## Índice
- [4.1 Gestión de Usuarios](#41-gestión-de-usuarios)
- [4.2 Sistema de Roles y Permisos (RBAC)](#42-sistema-de-roles-y-permisos-rbac)
- [4.3 Gestión de Suscripciones](#43-gestión-de-suscripciones)
- [4.4 Multi-Tenancy](#44-multi-tenancy)
- [4.5 Gestión de Proyectos](#45-gestión-de-proyectos)
- [4.6 Compartición y Colaboración](#46-compartición-y-colaboración)
- [5. Non-Functional Requirements](#5-non-functional-requirements)

---

## 4. Functional Requirements

### 4.1 Gestión de Usuarios

**FR-001: Registro Multi-Tenant**
- El sistema DEBE permitir registro con email/password creando simultáneamente usuario y tenant
- El sistema DEBE validar email único globalmente, subdomain único globalmente
- El sistema DEBE enviar email de verificación con token expirable (24h)
- El sistema DEBE asignar automáticamente rol OrgAdmin al primer usuario del tenant
- El sistema DEBE crear datos iniciales (plan Free Trial, roles predefinidos)

**FR-002: Autenticación JWT**
- El sistema DEBE emitir access token (exp 15min) y refresh token (exp 7d) tras login exitoso
- Access token DEBE incluir claims: user_id, tenant_id, roles, permissions (comprimido)
- El sistema DEBE validar firma JWT en cada request protegido (middleware)
- El sistema DEBE permitir refresh token rotation (invalidar viejo al emitir nuevo)
- El sistema DEBE bloquear cuenta tras 5 intentos fallidos por 15 minutos

**FR-003: MFA (Multi-Factor Authentication)**
- El sistema DEBE soportar TOTP (Time-Based One-Time Password) compatible con Google Authenticator
- El sistema DEBE generar 10 códigos de recuperación de un solo uso
- El sistema DEBE permitir admins forzar MFA obligatorio para todo el tenant
- El sistema DEBE registrar en audit log cuando MFA es habilitado/deshabilitado

**FR-004: Invitaciones**
- El sistema DEBE permitir admins invitar usuarios por email con rol preseleccionado
- El sistema DEBE validar límite de usuarios según plan antes de enviar invitación
- Invitaciones DEBEN expirar tras 7 días
- El sistema DEBE permitir invitados con email existente unirse a múltiples tenants
- El sistema DEBE enviar email recordatorio si invitación no aceptada en 3 días

**FR-005: Gestión de Sesiones**
- El sistema DEBE permitir usuarios ver sesiones activas (dispositivo, ubicación, última actividad)
- El sistema DEBE permitir revocar sesión individual o todas excepto actual
- El sistema DEBE limitar sesiones concurrentes según plan (default: 5)
- El sistema DEBE notificar usuario si login desde ubicación inusual (anomaly detection)

### 4.2 Sistema de Roles y Permisos (RBAC)

**FR-006: Roles Predefinidos**
- El sistema DEBE incluir roles: SuperAdmin (platform), OrgAdmin (tenant), Manager, Member, Guest
- SuperAdmin DEBE tener acceso cross-tenant con audit log obligatorio
- OrgAdmin DEBE poder gestionar usuarios/roles dentro de su tenant
- Roles predefinidos NO DEBEN ser editables pero SÍ asignables

**FR-007: Roles Personalizados**
- El sistema DEBE permitir OrgAdmins crear roles personalizados por tenant
- Roles DEBEN tener nombre, descripción, y conjunto de permisos
- El sistema DEBE validar unicidad de nombre rol dentro del tenant
- El sistema DEBE permitir usar rol existente como plantilla

**FR-008: Permisos Granulares**
- Permisos DEBEN seguir formato `resource.action` (ej: `users.create`, `documents.delete`)
- El sistema DEBE organizar permisos por módulos: Users, Roles, Content, Projects, Billing, Settings
- Acciones estándar: create, read, update, delete, list, export
- El sistema DEBE validar permisos en backend (middleware/decorators) y ocultar acciones en frontend

**FR-009: Jerarquía de Roles**
- El sistema DEBE permitir definir rol padre del cual heredar permisos
- Cambios en rol padre DEBEN propagarse automáticamente a roles hijos
- El sistema DEBE prevenir herencias circulares (validación)
- Máximo 3 niveles de herencia por performance

**FR-010: Permisos Condicionales**
- El sistema DEBE soportar scopes: `all`, `own`, `department`, `custom`
- Scope `own` DEBE filtrar recursos donde user_id = current_user
- Scope `department` DEBE usar relación department_id
- El sistema DEBE validar scope en queries (Django ORM filters)

**FR-011: Delegación Temporal**
- El sistema DEBE permitir usuarios delegar permisos específicos a otro usuario con fecha inicio/fin
- Delegaciones DEBEN expirar automáticamente (cronjob diario)
- Audit log DEBE registrar acciones como "por [Delegado] en nombre de [Original]"
- El sistema DEBE permitir revocar delegación antes de fecha fin

**FR-012: Grupos de Permisos**
- El sistema DEBE incluir grupos predefinidos: Basic, Financial, HR, Engineering, Sales
- El sistema DEBE permitir OrgAdmins crear grupos personalizados
- Asignar grupo DEBE otorgar todos sus permisos
- Cambios en grupo DEBEN propagarse a usuarios con ese grupo

**FR-013: Auditoría de Permisos**
- El sistema DEBE registrar en tabla inmutable: timestamp, actor, action, resource, changes, IP
- Acciones auditadas: create/update/delete role, assign/revoke role, change permissions
- Logs DEBEN ser insert-only (no updates/deletes)
- Retención: 7 años (compliance)
- El sistema DEBE permitir filtrar y exportar audit logs (CSV/JSON)

### 4.3 Gestión de Suscripciones

**FR-014: Planes de Suscripción**
- El sistema DEBE soportar planes: Free (0/mes), Starter ($29/mes), Professional ($99/mes), Enterprise (custom)
- Planes DEBEN definir límites: usuarios, storage, API calls/mes
- Planes DEBEN definir features: custom_roles, mfa, sso, api_access, custom_branding, priority_support
- El sistema DEBE permitir facturación mensual y anual (10% descuento anual)

**FR-015: Trial y Onboarding**
- El sistema DEBE ofrecer trial de 14 días sin tarjeta (plan Professional)
- El sistema DEBE enviar emails días 7, 12, 13 recordando fin de trial
- Tras trial, si no upgradea, DEBE migrar a plan Free automáticamente
- Plan Free DEBE deshabilitar features Pro y aplicar límites

**FR-016: Upgrade/Downgrade con Proration**
- El sistema DEBE calcular proration al upgrade: (días restantes/días totales) * diferencia
- Upgrade DEBE ser inmediato tras confirmación
- Downgrade DEBE tomar efecto al final del período pagado
- El sistema DEBE validar límites al downgrade (ej: no downgrade si excede users)

**FR-017: Facturación Automática**
- Cronjob diario DEBE verificar renovaciones pendientes
- El sistema DEBE cargar método de pago default vía Stripe
- El sistema DEBE generar recibo PDF con logo, desglose, impuestos
- El sistema DEBE enviar email con recibo tras cobro exitoso
- El sistema DEBE reintentar 3 veces (día 1, 3, 7) si fallo de pago
- Tras 3 fallos, DEBE suspender servicio (soft delete, datos preservados 30d)

**FR-018: Gestión de Métodos de Pago**
- El sistema DEBE integrar Stripe Elements (PCI-compliant) para agregar tarjetas
- El sistema DEBE almacenar solo Stripe token, NO datos de tarjeta
- El sistema DEBE permitir múltiples tarjetas con una marcada como default
- Webhook DEBE notificar tarjetas expiradas/declinadas

**FR-019: Cancelación**
- El sistema DEBE permitir cancelar suscripción manteniendo acceso hasta fin de período
- El sistema DEBE recopilar feedback (opcional) sobre razón de cancelación
- El sistema DEBE enviar email confirmación con fecha efectiva
- Al llegar fecha, DEBE migrar a plan Free (deshabilitar features, aplicar límites)

**FR-020: Feature Gates**
- El sistema DEBE validar acceso a features según plan en backend (middleware/decorators)
- API DEBE responder 402 Payment Required si feature no disponible en plan
- Frontend DEBE ocultar/deshabilitar componentes de features no disponibles
- El sistema DEBE cachear features disponibles para performance

**FR-021: Límites de Uso**
- El sistema DEBE trackear: usuarios activos, storage usado, API calls/mes
- El sistema DEBE bloquear acciones que excedan límites (ej: invitar usuario #11 en Starter)
- El sistema DEBE mostrar progress bars de límites en dashboard
- El sistema DEBE enviar emails al 80% y 100% de consumo

### 4.4 Multi-Tenancy

**FR-022: Row-Level Security (RLS)**
- Todas las tablas multi-tenant DEBEN tener columna `tenant_id UUID NOT NULL`
- PostgreSQL policies DEBEN aplicar `WHERE tenant_id = current_setting('app.tenant_id')::uuid`
- Middleware DEBE ejecutar `SET LOCAL app.tenant_id = X` al inicio de request
- Tests DEBEN verificar imposibilidad de acceso cross-tenant

**FR-023: Subdominios**
- El sistema DEBE generar subdomain slug único durante registro (basado en nombre org)
- Middleware DEBE identificar tenant por subdomain del request
- DNS wildcard *.plataforma.com DEBE apuntar a load balancer
- Plan Enterprise DEBE permitir custom domains (CNAME verification)

**FR-024: Tenant Switching**
- JWT DEBE incluir lista de tenants donde usuario tiene acceso
- El sistema DEBE permitir switch sin re-login (emitir nuevo access token)
- Audit log DEBE registrar tenant switches

**FR-025: Configuración por Tenant**
- El sistema DEBE permitir OrgAdmins configurar: logo, primary color, nombre organización
- Logo DEBE aplicarse a navbar, emails, PDFs
- Custom branding disponible en plan Professional+
- Plan Enterprise DEBE permitir ocultar "Powered by"

---

### 4.5 Gestión de Proyectos

**FR-050: Creación de Proyectos**
- El sistema DEBE permitir a usuarios crear proyectos con nombre, descripción, color
- El sistema DEBE asignar al creador como owner automáticamente
- El sistema DEBE validar límites del plan antes de crear (Free: 2, Starter: 10, Professional+: ilimitado)
- El sistema DEBE generar UUID único para cada proyecto

**FR-051: Organización por Secciones**
- El sistema DEBE permitir crear secciones/tags dentro de cada proyecto
- El sistema DEBE permitir nombres de sección únicos dentro del proyecto
- El sistema DEBE soportar reordenamiento de secciones con drag-and-drop
- El sistema DEBE respetar límites del plan (Free: 3 secciones, Starter: 10, Professional+: ilimitado)

**FR-052: Gestión de Items**
- El sistema DEBE soportar tipos de items: Credencial, Documento, Enlace, Nota, Configuración
- El sistema DEBE permitir campos customizables por item según su tipo
- El sistema DEBE encriptar valores de campos tipo "password" en base de datos (AES-256)
- El sistema DEBE validar límites de items según plan (Free: 50, Starter: 200, Professional+: ilimitado)

**FR-053: Operaciones de Item**
- El sistema DEBE permitir editar todos los campos de un item
- El sistema DEBE permitir clonar items duplicando todos sus datos
- El sistema DEBE permitir reordenar items dentro de su sección (mover arriba/abajo)
- El sistema DEBE solicitar confirmación antes de eliminar items
- El sistema DEBE registrar auditoría de todas las operaciones

**FR-054: Operaciones Batch (Professional+)**
- El sistema DEBE permitir seleccionar múltiples items con checkboxes
- El sistema DEBE soportar acciones batch: mover a sección, eliminar, exportar
- El sistema DEBE validar feature gate antes de permitir operaciones batch
- El sistema DEBE mostrar progreso durante operaciones batch extensas

**FR-055: Búsqueda y Filtros**
- El sistema DEBE implementar búsqueda full-text dentro del proyecto
- El sistema DEBE buscar en: título item, valores de campos, nombre sección
- El sistema DEBE soportar filtros por: tipo item, sección específica
- El sistema DEBE aplicar debounce de 300ms en búsqueda en tiempo real
- El sistema DEBE destacar texto coincidente en resultados

**FR-056: Compartición y Permisos**
- El sistema DEBE permitir a owner compartir proyecto con usuarios de la organización
- El sistema DEBE soportar roles de proyecto: Owner, Admin, Editor, Viewer
- El sistema DEBE validar permisos antes de cada operación según rol
- El sistema DEBE notificar a usuarios cuando se les comparte un proyecto

**FR-057: Importación y Exportación**
- El sistema DEBE permitir exportar proyecto a formatos CSV (Starter+) y JSON (Professional+)
- El sistema DEBE incluir en export: proyecto, secciones, items, fields
- El sistema DEBE encriptar passwords en archivos exportados
- El sistema DEBE permitir importar proyectos validando formato y límites del plan
- El sistema DEBE manejar errores de importación con mensajes claros

**FR-058: Auditoría y Seguridad**
- El sistema DEBE registrar todos los cambios en proyectos, secciones e items
- El sistema DEBE auditar accesos a items tipo "Credencial"
- El sistema DEBE almacenar: usuario, acción, timestamp, IP, detalles del cambio
- El sistema DEBE permitir consultar auditoría con filtros (usuario, fecha, acción)
- El sistema DEBE permitir exportar logs de auditoría (Enterprise only)

---

### 4.6 Gestión de Permisos y Compartición de Elementos

#### FR-032: Compartición de Elementos Individuales

**Descripción:**
Los usuarios pueden compartir elementos individuales (proyectos, tareas, eventos, archivos) con otros usuarios de su organización, asignando niveles de acceso específicos.

**Elementos compartibles:**
- Proyectos (project)
- Secciones de proyecto (project_section)
- Items de proyecto (project_item)
- Tareas (task)
- Eventos de calendario (event)
- Archivos (file)
- Documentos (document)
- Notas (note)

**Niveles de acceso:**
- **Viewer**: Solo lectura, no puede editar ni comentar
- **Commenter**: Ver + comentar/reaccionar (no editar contenido)
- **Editor**: Ver + editar contenido (no cambiar permisos)
- **Admin**: Todas las acciones + gestionar permisos de compartición

**Tabla de permisos por nivel:**

| Acción | Viewer | Commenter | Editor | Admin |
|--------|--------|-----------|--------|-------|
| Ver elemento | ✅ | ✅ | ✅ | ✅ |
| Comentar | ❌ | ✅ | ✅ | ✅ |
| Editar contenido | ❌ | ❌ | ✅ | ✅ |
| Eliminar elemento | ❌ | ❌ | ❌ | ✅* |
| Compartir con otros | ❌ | ❌ | ❌ | ✅ |
| Cambiar permisos | ❌ | ❌ | ❌ | ✅ |
| Revocar acceso | ❌ | ❌ | ❌ | ✅ |

*Solo si el owner original lo permite

**Validaciones:**
- Usuario compartidor debe tener nivel `admin` o ser owner del elemento
- Usuario receptor debe pertenecer a la misma organización (tenant)
- No se puede compartir con uno mismo
- No se puede asignar nivel superior al que tiene el compartidor
- Backend valida permisos en cada operación (no confiar solo en UI)

**Criterios de aceptación:**
- Usuario puede compartir elemento con 1+ usuarios internos
- Sistema valida permisos del compartidor antes de permitir compartición
- Usuario receptor recibe notificación de compartición
- Elemento aparece en sección "Compartidos conmigo" del receptor
- Permisos se aplican inmediatamente sin reiniciar sesión
- Audit log registra evento de compartición con timestamp, compartidor, receptor, nivel

---

#### FR-033: Compartición de Grupos de Elementos

**Descripción:**
Los usuarios pueden compartir grupos/colecciones de elementos con herencia de permisos en cascada.

**Grupos compartibles:**
- Proyecto completo → incluye todas sus secciones e items
- Sección de proyecto → incluye todos sus items
- Carpeta de archivos → incluye todos los archivos
- Colección de tareas → incluye todas las tareas
- Calendario completo → incluye todos los eventos

**Herencia de permisos:**
- **Permisos heredados**: Aplicados automáticamente desde el grupo padre
- **Permisos locales**: Configurados específicamente en un elemento hijo
- **Precedencia**: Permisos locales sobrescriben permisos heredados

**Ejemplo de herencia:**
```
Proyecto "Sistema de Autenticación" (shared con Alice: Editor)
  ├─ Sección "Credenciales Prod" (heredado: Editor)
  │   ├─ Item "Database Admin" (heredado: Editor)
  │   └─ Item "Redis Cache" (local: Admin) ← Alice tiene Admin aquí
  └─ Sección "Documentación" (local: Viewer) ← Alice tiene Viewer aquí
      └─ Item "Architecture Diagram" (heredado: Viewer)
```

**Conflictos de permisos:**
- Si usuario tiene acceso directo + heredado, se aplica el **más permisivo**
- Ejemplo: Usuario A tiene Viewer heredado + Editor local → Editor gana

**Validaciones:**
- Compartir grupo requiere permiso `element.share` + ser owner/admin
- Herencia se recalcula al cambiar permisos del padre
- Remover acceso al padre remueve acceso heredado a hijos (excepto locales)
- Backend indexa shares para performance en queries jerárquicos

**Criterios de aceptación:**
- Usuario puede compartir proyecto completo en 1 acción
- Permisos heredados se aplican automáticamente a elementos hijos
- Permisos locales sobrescriben heredados correctamente
- UI muestra claramente qué permisos son heredados vs locales
- Cambiar permisos del padre actualiza hijos en <2 segundos

---

#### FR-034: Límites de Compartición por Plan de Suscripción

**Descripción:**
Cada plan de suscripción define límites sobre compartición de elementos.

**Límites por plan:**

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Compartir elementos** | ❌ No disponible | ✅ Sí | ✅ Sí | ✅ Sí |
| **Niveles de acceso** | - | Viewer, Editor | Todos | Todos |
| **Max usuarios por elemento** | - | 5 | 50 | Ilimitado |
| **Compartir grupos** | ❌ | ❌ | ✅ Sí | ✅ Sí |
| **Permisos heredados** | ❌ | ❌ | ✅ Sí | ✅ Sí |
| **Compartición externa** | ❌ | ❌ | ❌ | ✅ Read-only links |
| **Expiración de acceso** | ❌ | ❌ | ✅ Manual | ✅ Automática |
| **Delegación de derechos** | ❌ | ❌ | ❌ | ✅ Sí |

**Feature gates a implementar:**
```python
# featuresByPlan
'free': {
    'canShareElements': False,
    'maxSharedUsersPerElement': 0,
    'shareAccessLevels': [],
    'canShareGroups': False,
    'canCreateExternalLinks': False
},
'starter': {
    'canShareElements': True,
    'maxSharedUsersPerElement': 5,
    'shareAccessLevels': ['viewer', 'editor'],
    'canShareGroups': False,
    'canCreateExternalLinks': False
},
'professional': {
    'canShareElements': True,
    'maxSharedUsersPerElement': 50,
    'shareAccessLevels': ['viewer', 'commenter', 'editor', 'admin'],
    'canShareGroups': True,
    'canCreateExternalLinks': False,
    'canSetExpirationDate': True
},
'enterprise': {
    'canShareElements': True,
    'maxSharedUsersPerElement': Infinity,
    'shareAccessLevels': ['viewer', 'commenter', 'editor', 'admin'],
    'canShareGroups': True,
    'canCreateExternalLinks': True,
    'canSetExpirationDate': True,
    'canDelegateShareRights': True
}
```

**Validaciones:**
- Backend verifica límites antes de permitir compartición
- Si límite alcanzado, mostrar UpgradePrompt con mensaje contextual
- Downgrade de plan revoca shares que excedan nuevos límites
- Sistema notifica usuarios afectados por revocación

**Criterios de aceptación:**
- Free plan no puede compartir elementos (feature disabled)
- Starter plan puede compartir con máx 5 usuarios por elemento
- Professional+ puede compartir grupos con herencia
- Enterprise puede crear links externos read-only
- UI muestra límites claramente antes de intentar compartir

---

#### FR-035: Auditoría de Compartición

**Descripción:**
Sistema registra todos los eventos de compartición en audit log inmutable para compliance.

**Eventos auditables:**
- `share.created`: Usuario compartió elemento con otro usuario
- `share.permission_changed`: Cambió nivel de acceso de share existente
- `share.revoked`: Revocó acceso a elemento compartido
- `share.accessed`: Usuario accedió a elemento compartido
- `share.group_inherited`: Permiso heredado desde grupo padre

**Metadatos en audit log:**
```json
{
  "event_type": "share.created",
  "timestamp": "2026-02-11T15:30:00Z",
  "actor_id": "user-001",
  "actor_name": "John Smith",
  "recipient_id": "user-003",
  "recipient_name": "Mike Chen",
  "resource_type": "project",
  "resource_id": "project-001",
  "resource_name": "Sistema de Autenticación",
  "access_level": "editor",
  "is_inherited": false,
  "parent_share_id": null,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "tenant_id": "tenant-001"
}
```

**Reportes de auditoría:**
- **Reporte de acceso**: Quién tiene acceso a qué elementos y con qué nivel
- **Reporte de actividad**: Historial de comparticiones en período de tiempo
- **Reporte de revocaciones**: Accesos removidos y motivos
- **Reporte de usuarios**: Todos los elementos compartidos con usuario X

**Criterios de aceptación:**
- Todos los eventos de compartición se registran inmutablemente
- Audit logs incluyen timestamp, actor, acción, recurso, metadatos
- Security Officer puede generar reportes CSV para compliance
- Reportes se generan en <30 segundos para 100k+ eventos
- Logs son append-only (no se pueden modificar retroactivamente)

---

#### FR-036: Revocación de Acceso

**Descripción:**
Usuarios con nivel `admin` o owners pueden revocar acceso a elementos compartidos.

**Métodos de revocación:**
- **Revocación individual**: Remover acceso de 1 usuario específico
- **Revocación en lote**: Remover acceso de múltiples usuarios
- **Revocación en cascada**: Remover acceso de grupo + heredados
- **Expiración automática**: Acceso expira tras fecha/hora configurada

**Efectos de revocación:**
- Usuario removido pierde acceso inmediatamente
- Sesiones activas del usuario se invalidan para ese recurso
- Elemento desaparece de "Compartidos conmigo" del usuario
- Notificación enviada al usuario revocado (opcional)
- Audit log registra evento de revocación

**Casos especiales:**
- **Revocar acceso heredado**: Requiere cambiar permiso del padre o agregar denegación explícita
- **Owner del elemento**: No se puede revocar (solo transferir ownership)
- **Último admin**: Sistema previene revocar último usuario con nivel admin

**Validaciones:**
- Solo owner/admin puede revocar acceso
- No se puede revocar propio acceso si es último admin
- Backend invalida tokens de acceso al recurso
- UI confirma antes de revocar acceso

**Criterios de aceptación:**
- Usuario admin puede revocar acceso de otro usuario
- Revocación es efectiva en <5 segundos
- Usuario revocado recibe notificación (si configurado)
- Elemento desaparece de lista "Compartidos conmigo"
- Audit log registra revocación con timestamp y motivo

---

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-001: Latency**
- API endpoints DEBEN responder en <200ms (p95), <500ms (p99)
- Database queries complejas DEBEN usar EXPLAIN ANALYZE para optimización
- Queries N+1 DEBEN eliminarse con `select_related`/`prefetch_related`
- Redis cache DEBE usarse para: session data, permissions, feature flags (TTL 5min)

**NFR-002: Throughput**
- El sistema DEBE soportar 1,000 requests/segundo por instancia backend
- Load balancer DEBE distribuir tráfico entre múltiples instancias
- Auto-scaling horizontal DEBE activarse al 70% CPU

**NFR-003: Database Performance**
- Indexes compuestos DEBEN incluir `tenant_id` como prefijo
- Queries DEBEN limitarse a 100ms (slow query log)
- Connection pooling: min 10, max 50 conexiones por instancia
- Read replicas para queries pesadas (reportes, analytics)

### 5.2 Scalability

**NFR-004: Horizontal Scaling**
- Backend DEBE ser stateless (sesiones en Redis, no en memoria)
- El sistema DEBE soportar 10,000+ tenants concurrentes
- Sharding de database considerado si >100M rows en tabla

**NFR-005: Vertical Scaling**
- Database DEBE escalar a 32 vCPUs, 128GB RAM sin código changes
- Redis cluster para cache distribuido si >50GB data

### 5.3 Security

**NFR-006: Encryption**
- Tráfico DEBE usar TLS 1.3 (cert auto-renovado con Let's Encrypt)
- Data at rest DEBE usar AES-256 encryption (PostgreSQL transparent encryption)
- Secrets DEBEN gestionarse con AWS Secrets Manager o Vault

**NFR-007: OWASP Compliance**
- SQL Injection: Django ORM exclusivamente, NO raw queries sin sanitización
- XSS: CSP headers, Angular sanitization, DOMPurify en HTML user-generated
- CSRF: Django CSRF tokens en forms, SameSite cookies
- Broken Auth: bcrypt para passwords (cost 12), rate limiting en login
- Sensitive Data: PII encriptado en DB, no logged, enmascarado en UI

**NFR-008: Rate Limiting**
- Public endpoints: 100 req/min por IP (registro, login)
- API endpoints: según plan (Free: 10/min, Starter: 100/min, Pro: 1000/min)
- Django Ratelimit middleware + Redis backend

**NFR-009: Security Headers**
- HSTS, X-Content-Type-Options, X-Frame-Options, CSP

### 5.4 Availability

**NFR-010: Uptime**
- SLA: 99.5% uptime (Free/Starter), 99.9% (Professional), 99.95% (Enterprise)
- Downtime permitido: 3.6h/mes (99.5%), 43min/mes (99.9%)
- Multi-AZ deployment en AWS (us-east-1a, us-east-1b)

**NFR-011: Disaster Recovery**
- Database backups diarios (retención 30 días), snapshots cada 6h
- RPO (Recovery Point Objective): <1 hora
- RTO (Recovery Time Objective): <4 horas
- Disaster recovery drill trimestral

**NFR-012: Monitoring**
- APM: New Relic o Datadog para métricas aplicación
- Logs: ELK stack (Elasticsearch, Logstash, Kibana)
- Error tracking: Sentry con alertas PagerDuty
- Uptime monitoring: Pingdom checks cada 1min
- Database: pgBadger para análisis de performance

### 5.5 Compliance

**NFR-013: GDPR**
- Derecho al olvido: endpoint DELETE /api/v1/users/me/gdpr-delete (anonimiza PII)
- Data portability: endpoint GET /api/v1/users/me/data-export (JSON + PDF)
- Consent management: checkboxes explícitos en registro
- Data Processing Agreement (DPA) en términos de servicio

**NFR-014: SOC2 Type II**
- Audit logs inmutables con retención 7 años
- Acceso a producción con MFA + bastion host + audit
- Automated security scanning (Snyk, OWASP ZAP) en CI/CD
- Incident response plan documentado

**NFR-015: ISO 27001**
- Risk assessment anual
- Employee security training trimestral
- Penetration testing anual por third party

---


---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Casos de Uso](use-cases.md)
- [➡️ Ver User Stories](user-stories.md)

---

**Última actualización**: 2026-02-10
