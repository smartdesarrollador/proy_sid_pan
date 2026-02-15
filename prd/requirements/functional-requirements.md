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
- [4.7 Internacionalización y Temas](#47-internacionalización-y-temas)
- [4.8 Digital Services (Public Profiles)](#48-digital-services-public-profiles)
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

### 4.7 Internacionalización y Temas

**FR-059: Soporte Multi-Idioma (i18n)**
- El sistema DEBE soportar al menos 2 idiomas: Español (es) e Inglés (en)
- El sistema DEBE usar Django i18n framework en backend (`django.utils.translation`)
- El sistema DEBE usar `react-i18next` en frontends React + Vite y `next-intl` en frontend Next.js
- El sistema DEBE detectar idioma del navegador en primera visita (`Accept-Language` header)
- El sistema DEBE permitir usuarios cambiar idioma manualmente desde UI
- Cambio de idioma DEBE aplicarse inmediatamente sin recargar página (SPA)
- El sistema DEBE formatear fechas/números según locale seleccionado
- El sistema DEBE traducir mensajes de error y validación
- Textos generados por usuarios (nombres de proyectos, tareas) NO DEBEN traducirse
- El sistema DEBE incluir fallback a español si traducción no existe

---

**FR-060: Gestión de Traducciones**
- Backend DEBE mantener archivos de traducción en `locale/es/LC_MESSAGES/django.po` y `locale/en/LC_MESSAGES/django.po`
- Frontend Admin DEBE mantener traducciones en `src/assets/i18n/es.json` y `src/assets/i18n/en.json`
- Frontend Cliente DEBE compartir mismos archivos de traducción del Admin para consistencia
- El sistema DEBE permitir agregar nuevos idiomas sin cambios de código (solo agregar archivos)
- Traducciones DEBEN organizarse por namespaces: `common`, `admin`, `client`, `auth`, `errors`
- El sistema DEBE validar que todas las keys de traducción existan en todos los idiomas
- Missing translations DEBEN loguearse pero no romper la aplicación
- El sistema DEBE soportar pluralización (`{count, plural, =1 {tarea} other {tareas}}`)
- El sistema DEBE soportar interpolación de variables (`Hola {username}`)

---

**FR-061: Dark Mode / Light Mode**
- El sistema DEBE soportar 3 modos de tema: Light, Dark, Auto
- Modo "Auto" DEBE respetar `prefers-color-scheme` del navegador/sistema
- Dark mode DEBE implementarse con Tailwind CSS usando `class` strategy
- Clase `dark` en `<html>` DEBE activar dark mode globalmente
- Todos los componentes DEBEN definir estilos dark con `dark:` prefix de Tailwind
- Contraste de colores DEBE cumplir WCAG 2.1 AA en ambos temas (4.5:1 para texto)
- Tema DEBE cambiar inmediatamente sin flash de contenido (FOUC)
- El sistema DEBE persistir tema en localStorage como fallback rápido
- Imágenes/logos DEBEN tener variantes para light/dark si es necesario

---

**FR-062: Persistencia de Preferencias de Usuario**
- El sistema DEBE almacenar preferencias de usuario en campo JSONB `users.preferences`
- Estructura de preferencias DEBE incluir: `{"language": "es"|"en", "theme": "light"|"dark"|"auto"}`
- Endpoint `PATCH /api/v1/users/me/preferences` DEBE permitir actualizar preferencias
- Cambios en preferencias DEBEN aplicarse inmediatamente sin logout/login
- El sistema DEBE sincronizar preferencias entre frontend (localStorage) y backend
- Si localStorage y backend difieren, backend DEBE tener precedencia
- El sistema DEBE enviar preferencias en respuesta de login/refresh token
- Preferencias DEBEN incluirse en JWT payload para acceso rápido (opcional)

---

### 4.8 Digital Services (Public Profiles)

**FR-063: Server-Side Rendering con Next.js App Router**
- El sistema DEBE utilizar Next.js App Router para renderizar las páginas públicas en el servidor
- HTML completo DEBE generarse server-side antes de enviar al cliente
- Next.js 14+ con App Router y React Server Components DEBE usarse para SSR
- Static Site Generation (SSG) DEBE aplicarse para rutas estáticas en build time
- Dynamic SSR DEBE usarse para rutas dinámicas (usernames)
- Incremental Static Regeneration (ISR) DEBE configurarse con revalidación de 60 segundos
- Automatic data deduplication DEBE aplicarse (no manual TransferState needed)
- Built-in metadata API DEBE usarse para SEO (meta tags, Open Graph, JSON-LD)

---

**FR-064: Generación de HTML Estático para Páginas Públicas**
- El sistema DEBE generar HTML estático completo con contenido renderizado en servidor
- HTML source DEBE ser visible sin JavaScript habilitado (indexable por buscadores)
- Meta tags DEBEN estar en `<head>` del HTML renderizado en servidor
- Contenido NO DEBE depender de client-side rendering para SEO
- No-JS fallback DEBE soportar funcionalidades básicas (navegación)

---

**FR-065: Caching de Páginas Renderizadas**
- El sistema DEBE cachear páginas SSR renderizadas en Redis con TTL de 5 minutos
- Cache key DEBE seguir formato: `ssr:{service}:{username}:{version}`
- Hit rate objetivo DEBE ser >80%
- Fallback DEBE renderizar directo si Redis está down (degradación graceful)
- Métricas de cache DEBEN trackearse: hit rate, miss rate, latency

---

**FR-066: Invalidación de Cache al Actualizar Perfil**
- El sistema DEBE invalidar cache de página pública inmediatamente al actualizar perfil
- Post-save hooks en modelos Django DEBEN borrar keys de Redis correspondientes
- Patrón de invalidación: `DELETE ssr:{service}:{username}:*`
- CDN purge DEBE ejecutarse si se usa Cloudflare/CloudFront
- Cambios DEBEN ser visibles en <1 minuto tras actualización

---

**FR-067: Patrón de URLs Públicas**
- El sistema DEBE seguir patrón de URL `/{servicio}/{username}` para páginas públicas
- URLs soportadas: `/tarjeta/{username}`, `/landing/{username}`, `/portafolio/{username}`, `/cv/{username}`
- URLs DEBEN ser limpias, memorables, y SEO-friendly
- Sistema DEBE manejar URLs con trailing slash y sin trailing slash idénticamente
- 404 page DEBE mostrarse si username no existe o perfil no es público

---

**FR-068: Validación de Username Único Global**
- El sistema DEBE validar que usernames sean únicos globalmente (cross-tenant)
- Constraint `UNIQUE` en `PublicProfile.username` a nivel de database
- Regex permitido: `^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$` (2-50 chars, lowercase, números, guiones)
- Sistema DEBE reservar usernames: `admin`, `api`, `www`, `app`, `dashboard`, `login`, `register`
- Si username tomado, DEBE sugerir alternativas: `username1`, `username2`, `user-name`

---

**FR-069: Templates Component-Based**
- El sistema DEBE soportar templates component-based con componentes React reutilizables
- Template DEBE definirse como JSON: `{ sections: [ { type: 'hero', props: {...} } ] }`
- Componentes React DEBEN usar props tipados (TypeScript interfaces)
- Dynamic imports con React.lazy() DEBEN usarse para lazy loading de componentes
- Server Components DEBEN usarse por defecto, Client Components solo cuando necesario ('use client')
- Templates DEBEN ser extensibles sin cambios en código core

**Ejemplo de implementación**:
```typescript
// components/sections/index.ts
export const SECTION_COMPONENTS = {
  hero: React.lazy(() => import('./HeroSection')),
  about: React.lazy(() => import('./AboutSection')),
  portfolio: React.lazy(() => import('./PortfolioSection')),
  contact: React.lazy(() => import('./ContactSection')),
} as const;

// app/[locale]/[username]/page.tsx
import { Suspense } from 'react';

export default function ProfilePage({ config }) {
  return (
    <>
      {config.sections.map((section, i) => {
        const Component = SECTION_COMPONENTS[section.type];
        return (
          <Suspense key={i} fallback={<SectionSkeleton />}>
            <Component {...section.props} />
          </Suspense>
        );
      })}
    </>
  );
}
```

---

**FR-070: Templates Responsive Mobile-First**
- Todos los templates DEBEN ser responsive con diseño mobile-first
- Breakpoints Tailwind: Mobile (<640px), Tablet (640-1024px), Desktop (>=1024px)
- Grid DEBE ajustarse: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- Touch targets DEBEN ser >=44x44px para mobile
- Testing DEBE incluir Chrome DevTools mobile emulation

---

**FR-071: Custom CSS para Professional+**
- El sistema DEBE permitir usuarios Professional+ agregar CSS personalizado
- CSS DEBE aplicarse en sandbox con scope al contenedor del usuario
- Validación DEBE prevenir: `<script>`, `background-image: url()` con JS, imports externos no seguros
- Editor DEBE incluir syntax highlighting
- Preview en tiempo real DEBE mostrar cambios antes de publicar
- CSS NO DEBE afectar otros usuarios (aislamiento)

---

**FR-072: Custom Templates para Enterprise**
- El sistema DEBE permitir usuarios Enterprise crear templates custom vía código HTML/CSS/TypeScript
- Solicitud de template custom DEBE hacerse vía ticket de soporte
- Revisión de código DEBE realizarse por equipo técnico antes de deploy
- Template custom DEBE deployarse como componente standalone
- Template DEBE estar aislado de otros usuarios

---

**FR-073: Generación Automática de Meta Tags**
- El sistema DEBE generar automáticamente meta tags para todas las páginas públicas
- Meta tags DEBEN incluir: title, description, Open Graph (og:title, og:description, og:image, og:url), Twitter Cards
- Override manual DEBE permitirse para Professional+
- Auto-generación de OG image DEBE usar título + foto de perfil si no se sube imagen custom
- Meta tags DEBEN validarse con Facebook Debugger y Twitter Card Validator

---

**FR-074: Sitemap.xml Dinámico**
- El sistema DEBE generar `sitemap.xml` dinámico incluyendo todas las páginas públicas
- Endpoint: `GET /sitemap.xml` (accesible públicamente)
- DEBE incluir solo perfiles con `is_public=True`
- Prioridad: 0.8 (landing/tarjeta), 0.6 (portfolio/CV)
- Changefreq: weekly
- Cache DEBE ser 24 horas
- Sitemap DEBE actualizarse automáticamente al crear/eliminar perfiles

---

**FR-075: Structured Data (JSON-LD)**
- El sistema DEBE incluir structured data en formato JSON-LD para páginas públicas
- Schema.org types: Person (tarjeta, landing, CV), CreativeWork (proyectos de portafolio), Organization
- JSON-LD DEBE estar en `<head>` del HTML renderizado
- Validación DEBE hacerse con Google Rich Results Test
- Structured data DEBE incluir: name, jobTitle, url, sameAs (social links)

---

**FR-076: Robots.txt Configurable**
- El sistema DEBE generar `robots.txt` configurable
- Default DEBE permitir indexación de servicios públicos: `/tarjeta/`, `/landing/`, `/portafolio/`, `/cv/`
- Default DEBE bloquear: `/api/`, `/admin/`
- Sitemap DEBE referenciarse: `Sitemap: https://domain.com/sitemap.xml`
- Professional+ DEBE poder configurar allow/disallow por servicio

---

**FR-077: Endpoints Públicos Sin Autenticación**
- Endpoints públicos para renderizar servicios digitales NO DEBEN requerir JWT
- Endpoints: `GET /tarjeta/{username}`, `GET /landing/{username}`, `GET /portafolio/{username}`, `GET /cv/{username}`
- Rate limiting DEBE aplicarse: 100 req/min por IP
- CORS DEBE permitir all origins para sharing
- Response DEBE ser HTML (SSR), no JSON

---

**FR-078: Endpoints Admin con Validación de Ownership**
- Endpoints de administración DEBEN validar que usuario autenticado sea owner del perfil
- Validación: `profile.user == request.user`, raise `PermissionDenied` si no match
- Endpoints admin: `POST /api/v1/app/digital-services/tarjeta`, `PATCH /api/v1/app/digital-services/tarjeta`, etc.
- JWT DEBE ser válido y no expirado
- Audit log DEBE registrar modificaciones

---

**FR-079: Tracking de Vistas y Visitantes**
- El sistema DEBE trackear views, unique visitors, clicks en enlaces para servicios digitales
- Métricas: page views (total, por día), unique visitors (por session cookie o IP), clicks en social links, clicks en proyectos, descargas de PDF
- Owner NO DEBE contarse en views (filtrar por session)
- Modelo `ServiceAnalytics`: service, date, views, unique_visitors, clicks (agregado diario)
- Performance: tracking NO DEBE afectar latencia de rendering (<10ms overhead)

---

**FR-080: Analytics por Plan**
- Analytics DEBEN estar disponibles según plan del usuario
- Free: Sin analytics
- Starter: Analytics básicas (7 días, totales)
- Professional: Analytics avanzadas (30 días, gráficos, por fuente/referrer)
- Enterprise: Analytics completas (ilimitado, export CSV, Google Analytics integration)
- Feature gate DEBE validar plan antes de mostrar analytics

---

**FR-081: Soporte para Custom Domains con CNAME**
- El sistema DEBE soportar dominios personalizados para usuarios Enterprise mediante CNAME
- Usuario DEBE configurar CNAME apuntando a: `proxy.platform.com`
- Validación DNS DEBE ejecutarse con retry cada 30 min (max 48h)
- Tabla `CustomDomain`: domain, tenant, verification_status, ssl_status, created_at
- Solo 1 custom domain activo DEBE permitirse por usuario (Enterprise)
- Validación DEBE prevenir dominios ya usados por otros usuarios

---

**FR-082: Provisión Automática de SSL**
- El sistema DEBE provisionar certificados SSL automáticamente para custom domains usando Let's Encrypt
- Validación DEBE usar HTTP-01 challenge o DNS-01
- Renovación automática DEBE ejecutarse 30 días antes de expiración
- Alertas DEBE enviarse si renovación falla
- SSL status DEBE ser `pending` → `active` → `renewing` → `active`
- Certificado DEBE ser válido para dominio + `www.dominio` (wildcard opcional)

---

### 4.7 Analytics de Negocio

**FR-083: Dashboard de Analytics en Tiempo Real**

**Descripción:**
El sistema debe proporcionar un dashboard de analytics con métricas de negocio calculadas en tiempo real desde la base de datos.

**Reglas de Negocio:**
- Cálculo de métricas:
  - **Clientes Activos**: Count de tenants con `status = 'active'`
  - **MRR Total**: Sum de `subscription.amount` donde `billing_cycle = 'monthly'` y `status = 'active'` + (annual/12)
  - **ARPC**: MRR Total / Clientes Activos
  - **Health Score**: Weighted average de factores (payment_on_time 40%, usage 30%, support_tickets 20%, nps 10%)
- % cambio vs mes anterior: comparar con snapshot del día 1 del mes anterior
- Gráficos actualizados con filtros sin reload de página
- Cache de métricas con TTL 5 minutos (invalidar en cambios de suscripción)

**Prioridad:** Alta

---

**FR-084: Filtros Dinámicos de Analytics**

**Descripción:**
Permitir filtrar todas las métricas y gráficos por plan de suscripción y estado de cliente.

**Reglas de Negocio:**
- Filtros disponibles:
  - Plan: `all`, `free`, `starter`, `professional`, `enterprise`
  - Estado: `all`, `active`, `trial`, `past_due`, `canceled`
- Combinación de filtros con lógica AND
- Filtros persisten en URL query params: `?plan=professional&status=active`
- Si filtros vacíos o inválidos, usar defaults: `plan=all&status=all`
- Al cambiar filtro, trigger query a backend con nuevos parámetros

**Prioridad:** Alta

---

**FR-085: Distribución Visual de Clientes**

**Descripción:**
Proveer gráficos de distribución de clientes por plan, estado, y MRR.

**Reglas de Negocio:**
- Gráficos requeridos:
  1. **Distribución por Plan**: Horizontal bar chart (count + %)
  2. **Distribución por Estado**: Horizontal bar chart (count + %)
  3. **MRR por Plan**: Stacked bar o pie chart con desglose $
- Colores semánticos:
  - Free: Gris, Starter: Azul, Professional: Púrpura, Enterprise: Naranja
  - Activo: Verde, Prueba: Azul, Pago Vencido: Rojo, Cancelado: Gris
- Totales deben sumar 100% para gráficos de porcentaje
- Si un plan tiene 0 clientes, no mostrarlo en gráfico

**Prioridad:** Alta

---

**FR-086: Ranking de Top Clientes**

**Descripción:**
Mostrar tabla con top 5 (o más) clientes ordenados por MRR descendente.

**Reglas de Negocio:**
- Ranking muestra:
  - Top 5 en dashboard principal
  - Top 10 en reporte exportado
- Criterio de ordenamiento: MRR descendente, alfabético en empates
- Columnas: ranking, nombre, plan, MRR, usuarios count
- Click en fila navega a `/admin/tenants/{tenant_id}`
- Permisos: Solo SuperAdmin y OrgAdmin ven este ranking

**Prioridad:** Media

---

**FR-087: Exportación de Reportes (Feature Gate)**

**Descripción:**
Permitir exportar reportes de analytics a PDF y Excel, gated por plan Professional+.

**Reglas de Negocio:**
- Feature gate:
  - Free/Starter: Botón deshabilitado con tooltip "Upgrade to Professional"
  - Professional/Enterprise: Funcionalidad completa
- Formato PDF:
  - Header con logo y nombre del tenant
  - KPIs en tabla resumen
  - Gráficos como imágenes PNG
  - Footer con fecha de generación
- Formato Excel:
  - Sheet 1: KPIs y métricas
  - Sheet 2: Tabla de clientes completa
  - Sheet 3: Datos raw para pivot tables
- Generación async con Celery task
- Notificación push cuando reporte está listo
- Link de descarga expira en 24h

**Prioridad:** Baja

---

### 4.8 Sistema de Promociones

**FR-088: CRUD de Promociones**

**Descripción:**
Sistema debe permitir crear, leer, actualizar y eliminar códigos promocionales con validaciones de negocio.

**Reglas de Negocio:**
- **Crear**:
  - Código único a nivel global (no solo por tenant)
  - Código alfanumérico: `^[A-Z0-9]{3,20}$` (uppercase)
  - Fechas: inicio < fin, fin >= hoy
  - Valor > 0 según tipo
  - Estado inicial: "Programada" si inicio > hoy, sino "Activa"
- **Actualizar**:
  - Solo editable si estado = Activa o Pausada
  - No permitir cambiar código (inmutable)
  - No permitir reducir límite de usos por debajo de usos actuales
  - Al editar fecha_fin, validar que sea >= hoy
- **Eliminar**:
  - Soft delete: set `deleted_at` timestamp
  - Solo eliminable si usos = 0
  - Si usos > 0, mostrar confirmación "Promoción tiene X usos registrados. ¿Eliminar de todos modos?"
- **Permisos**: SuperAdmin, Marketing Manager (custom role)

**Prioridad:** Alta

---

**FR-089: Estados Automáticos de Promociones**

**Descripción:**
Sistema debe actualizar automáticamente estados de promociones según reglas de negocio.

**Reglas de Negocio:**
- **Activa**: hoy >= fecha_inicio && hoy <= fecha_fin && current_uses < max_uses && !paused
- **Programada**: hoy < fecha_inicio
- **Agotada**: current_uses >= max_uses
- **Expirada**: hoy > fecha_fin
- **Pausada**: admin pausó manualmente (independiente de fechas/usos)
- Tarea Celery cada 1 hora actualiza estados de todas las promociones
- Eventos de webhook cuando promoción cambia de estado:
  - `promotion.activated`
  - `promotion.depleted` (agotada)
  - `promotion.expired`

**Prioridad:** Alta

---

**FR-090: Validación de Códigos en Checkout**

**Descripción:**
Backend debe validar códigos promocionales al aplicar en checkout y upgrades.

**Reglas de Negocio:**
- Validaciones en orden:
  1. Código existe y no eliminado
  2. Estado = Activa (400 Bad Request si otro estado)
  3. Vigencia: hoy >= fecha_inicio && hoy <= fecha_fin
  4. Usos: current_uses < max_uses (o max_uses = NULL = ilimitado)
  5. Plan seleccionado en planes_aplicables
  6. Si first_payment_only = true, validar que usuario no tiene suscripción previa
- Si todas las validaciones pasan:
  - Calcular descuento según tipo
  - Retornar precio original + precio con descuento
  - Reservar uso (increment tentative_uses, expira en 15min)
- Si pago exitoso:
  - Confirm uso: increment current_uses, clear tentative_uses
  - Crear registro PromoUsage
  - Aplicar descuento en invoice
- Si pago falla o expira:
  - Rollback: decrement tentative_uses

**Prioridad:** Alta

---

**FR-091: Tipos de Descuentos**

**Descripción:**
Soportar 3 tipos de promociones con lógica de cálculo diferenciada.

**Reglas de Negocio:**
- **Porcentaje (%)**:
  - Valor entre 1-100
  - Cálculo: `precio_final = precio_original * (1 - valor/100)`
  - Ejemplo: 20% sobre $100 = $80
  - Aplicable a cualquier plan
- **Monto fijo ($)**:
  - Valor en USD (u otra currency)
  - Cálculo: `precio_final = max(0, precio_original - valor)`
  - Ejemplo: $50 de descuento sobre $100 = $50
  - Si descuento > precio, precio final = $0 (free month)
- **Días adicionales**:
  - Valor en días (1-365)
  - Cálculo: Extender `trial_end_date` del tenant
  - Ejemplo: +30 días de trial gratuito
  - Solo aplicable a planes Free o en trial period
  - No afecta precio, solo extiende trial
- Campo `first_payment_only`:
  - true: solo aplica en primer invoice
  - false: aplica en cada invoice del período configurado

**Prioridad:** Alta

---

**FR-092: Analytics de Promociones**

**Descripción:**
Proveer métricas de efectividad de promociones para decisiones de marketing.

**Reglas de Negocio:**
- KPIs principales:
  - **Promociones Activas**: count(estado = Activa)
  - **Usos Totales**: sum(current_uses) de todas las promociones
  - **Ingresos Generados**: sum(discount_amount) de PromoUsage
- Métricas por promoción individual:
  - Usos en el tiempo (time series)
  - Conversión: users_applied / users_paid
  - Distribución por plan
  - Revenue impactado ($ descuentos)
  - Top users que usaron el código
- Analytics detallado gated por plan Professional+
- Exportar reporte individual (PDF/Excel)
- Dashboards visuales con charts (line, pie, bar)

**Prioridad:** Media

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
- XSS: CSP headers, React automatic escaping, DOMPurify en HTML user-generated
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

**Última actualización**: 2026-02-15
