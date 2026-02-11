# PRD: Sistema Avanzado de Gestión de Roles, Permisos y Suscripciones Multi-Tenant

**Version:** 2.0.0
**Date:** 2026-02-10
**Status:** Draft
**Owner:** Product Team
**Tech Stack:** Django REST Framework, PostgreSQL, Angular (Admin + Cliente), React (Prototipos), Tailwind CSS

---

## 1. Executive Summary

### 1.1 Visión del Producto

Construir una plataforma SaaS empresarial que permita a organizaciones gestionar usuarios, roles, permisos y suscripciones con aislamiento completo de datos (multi-tenant), escalabilidad horizontal, y cumplimiento de estándares de seguridad modernos. El sistema ofrecerá:

1. **Panel Administrativo (RBAC)**: Modelo RBAC (Role-Based Access Control) avanzado con permisos granulares, jerarquía de roles, delegación temporal, y auditoría completa para administradores de organizaciones.

2. **Suite de Servicios para Clientes**: Herramientas productivas (Calendario, Tareas, Notificaciones, Archivos, Portafolio) disponibles para usuarios finales según su plan de suscripción.

### 1.2 Objetivos del Negocio

1. **Monetización**: Generar revenue recurrente mediante suscripciones escalonadas (Free, Starter, Pro, Enterprise)
2. **Retención**: Reducir churn mediante onboarding fluido y valor inmediato en trial
3. **Escalabilidad**: Soportar 10,000+ tenants con latencias <200ms en p95
4. **Seguridad**: Lograr certificaciones SOC2 Type II y cumplimiento GDPR
5. **Time-to-Market**: Lanzar MVP en 12 semanas, features enterprise en 24 semanas

### 1.3 Propuesta de Valor

**Para Administradores de Organizaciones:**
- Control granular sobre qué usuarios pueden hacer qué acciones en qué recursos
- Auditoría completa de cambios en permisos y accesos
- Gestión simplificada de suscripciones con facturación automática
- Reducción de 80% del tiempo administrativo vs gestión manual

**Para Usuarios Finales:**
- Onboarding en <5 minutos desde registro hasta primer valor
- Seguridad de que sus datos están aislados de otros tenants
- Experiencia fluida con permisos contextuales (sin ver acciones no permitidas)

**Para Desarrolladores:**
- APIs RESTful documentadas con OpenAPI 3.0
- SDKs y webhooks para integraciones
- Rate limiting transparente por tier de suscripción

### 1.4 Métricas de Éxito (KPIs)

| Categoría | Métrica | Target MVP | Target 6 meses |
|-----------|---------|------------|----------------|
| **Negocio** | MRR (Monthly Recurring Revenue) | $10k | $100k |
| | Conversion Trial → Paid | 15% | 25% |
| | Churn Rate (mensual) | <8% | <5% |
| | CAC Payback Period | <6 meses | <4 meses |
| **Producto** | Time to First Value | <10 min | <5 min |
| | Feature Adoption (Roles Personalizados) | 30% | 60% |
| | NPS (Net Promoter Score) | >30 | >50 |
| **Técnico** | API Latency p95 | <300ms | <200ms |
| | System Uptime | 99.5% | 99.9% |
| | Security Incidents | 0 critical | 0 critical |
| | Test Coverage | >80% | >90% |

---

## 2. Product Overview

### 2.1 Descripción Detallada

El sistema es una plataforma SaaS multi-tenant que combina cuatro pilares fundamentales:

1. **Identity & Access Management (IAM)**: Gestión completa del ciclo de vida de usuarios, desde registro hasta offboarding, con autenticación robusta (JWT + refresh tokens + MFA opcional).

2. **RBAC Avanzado**: Sistema de roles y permisos que soporta:
   - Roles predefinidos del sistema (SuperAdmin, OrgAdmin, Manager, Member, Guest)
   - Roles personalizados por tenant con permisos granulares
   - Jerarquía de roles con herencia de permisos
   - Permisos condicionales basados en contexto (ej: "puede editar documentos que él creó")
   - Delegación temporal de permisos con fecha de expiración
   - Auditoría inmutable de todos los cambios

3. **Subscription Management**: Sistema completo de monetización con:
   - Múltiples planes con feature gates
   - Facturación automática con Stripe/PayPal
   - Trials de 14 días sin tarjeta
   - Upgrades/downgrades con proration
   - Gestión de límites por plan (usuarios, storage, API calls)

4. **Servicios de Suscripción** (Customer-Facing Features): Suite de herramientas productivas incluidas según el plan:
   - **Calendario**: Gestión de eventos, reuniones, recordatorios
   - **Tareas**: Sistema de task management con estados, prioridades, asignaciones
   - **Notificaciones**: Centro de notificaciones en tiempo real (email, in-app, push)
   - **Archivos**: Almacenamiento de documentos con control de versiones y compartición
   - **Dashboard Usuario**: Panel personalizado con métricas y actividad reciente
   - **Portafolio**: Gestión de proyectos y colecciones de trabajo

**Arquitectura Clave:**
- **Multi-tenancy**: Row-Level Security (RLS) en PostgreSQL garantiza aislamiento de datos
- **Escalabilidad**: Arquitectura stateless con Redis para cache/sessions
- **Seguridad**: Encriptación en tránsito (TLS 1.3) y en reposo (AES-256)
- **Arquitectura Dual Frontend**:
  - **Frontend Admin** (Angular): Gestión de RBAC, usuarios, suscripciones, billing, auditoría
  - **Frontend Cliente** (Angular): Servicios productivos para usuarios finales (calendario, tareas, archivos)
  - **Backend Unificado** (Django): API única que sirve a ambos frontends

### 2.2 Usuarios Objetivo (Personas)

#### Persona 1: Elena - Fundadora de Startup SaaS
- **Demografía**: 32 años, CEO/CTO de startup de 8 personas
- **Objetivos**: Lanzar producto rápido, gestionar equipo pequeño, controlar costos
- **Pain Points**: No tiene tiempo para configuraciones complejas, necesita algo que "simplemente funcione"
- **Uso**: Plan Starter, roles básicos (Admin/Member), facturación mensual
- **Quote**: "Necesito concentrarme en mi producto, no en gestionar permisos"

#### Persona 2: Carlos - IT Manager en Empresa Mediana
- **Demografía**: 45 años, responsable de IT en empresa de 200 empleados
- **Objetivos**: Cumplimiento de políticas de seguridad, auditorías, control granular
- **Pain Points**: Necesita permisos complejos (ej: managers aprueban gastos de su departamento), reportes de auditoría
- **Uso**: Plan Professional, roles personalizados con jerarquía, MFA obligatorio
- **Quote**: "Necesito demostrar a auditoría quién tiene acceso a qué y cuándo"

#### Persona 3: Patricia - Platform Architect en Enterprise
- **Demografía**: 38 años, arquitecta de plataforma en corp de 5,000+ empleados
- **Objetivos**: Integración con SSO/SAML, compliance (SOC2/ISO), SLAs estrictos
- **Pain Points**: Necesita multi-tenancy para diferentes divisiones, APIs robustas para integraciones
- **Uso**: Plan Enterprise, SSO/SAML, soporte dedicado, SLA 99.9%
- **Quote**: "Necesitamos una solución enterprise-grade que escale con nosotros"

### 2.3 Casos de Uso Principales

#### CU-001: Onboarding de Nueva Organización
**Actor**: Fundador/Admin
**Flujo**:
1. Usuario visita landing page y hace click en "Start Free Trial"
2. Completa formulario (nombre, email, contraseña, nombre organización)
3. Recibe email de verificación y activa cuenta
4. Asistente de onboarding guía: invitar equipo, configurar roles básicos, explorar features
5. Usuario invita a 3 miembros de equipo
6. Miembros reciben emails, activan cuentas, son asignados a roles
7. Admin explora dashboard y primeras features
**Tiempo objetivo**: <10 minutos hasta primer valor

#### CU-002: Configuración de Roles Personalizados
**Actor**: Admin de Organización
**Flujo**:
1. Admin accede a Settings → Roles & Permissions
2. Crea nuevo rol "Content Editor" desde plantilla o scratch
3. Asigna permisos granulares: `content.create`, `content.edit_own`, `content.publish` (requiere aprobación)
4. Configura herencia: "Content Editor" hereda permisos de "Member"
5. Asigna rol a 5 usuarios del equipo de contenido
6. Sistema registra cambio en audit log con timestamp, autor, permisos modificados
**Criterio de éxito**: Usuario puede crear rol funcional en <5 minutos

#### CU-003: Upgrade de Plan con Cambio de Límites
**Actor**: Admin de Organización
**Flujo**:
1. Organización en plan Starter (límite 10 usuarios) intenta invitar usuario #11
2. Sistema muestra mensaje: "Límite alcanzado. Upgrade a Professional para hasta 50 usuarios"
3. Admin hace click en "Upgrade Now"
4. Revisa comparación de planes y features desbloqueados
5. Confirma upgrade, ingresa método de pago si no existe
6. Sistema calcula proration: $X por días restantes del ciclo actual
7. Procesa pago, actualiza plan inmediatamente
8. Admin puede invitar usuarios adicionales sin fricción
9. Factura reflejará upgrade prorated + siguiente ciclo completo
**Criterio de éxito**: Upgrade completado en <3 minutos, sin downtime

#### CU-004: Delegación Temporal de Permisos
**Actor**: Manager
**Flujo**:
1. Manager va de vacaciones por 2 semanas
2. Accede a "Delegate Permissions" y selecciona colega de confianza
3. Configura: permisos a delegar (ej: `approvals.expenses`), fecha inicio/fin
4. Sistema notifica al delegado vía email
5. Durante 2 semanas, delegado puede aprobar gastos
6. Audit log registra cada aprobación como "Aprobado por [Delegado] en nombre de [Manager]"
7. Tras 2 semanas, permisos expiran automáticamente
8. Manager recibe resumen de acciones tomadas por delegado
**Criterio de éxito**: Delegación configurada en <2 minutos, auto-expira sin intervención

#### CU-005: Auditoría de Cambios en Permisos (Compliance)
**Actor**: Security Officer
**Flujo**:
1. Auditor externo solicita reporte de "quién tuvo acceso a datos financieros en Q4 2025"
2. Security Officer accede a Audit Logs → Permissions
3. Aplica filtros: recurso=`financial_data`, acción=`read`, fecha=Q4 2025
4. Sistema genera reporte CSV con: timestamp, usuario, acción, recurso, resultado (allow/deny), IP, user-agent
5. Reporte incluye cambios en asignación de roles que afectan ese permiso
6. Exporta y entrega a auditor
**Criterio de éxito**: Reporte generado en <30 segundos, inmutable (no modificable retroactivamente)

### 2.4 Alcance del MVP y Fases Futuras

#### MVP (12 semanas) - Core Features
- ✅ Autenticación JWT con refresh tokens
- ✅ Registro multi-tenant con tenant isolation (RLS)
- ✅ 5 roles predefinidos (SuperAdmin, OrgAdmin, Manager, Member, Guest)
- ✅ Permisos granulares básicos (CRUD en recursos principales)
- ✅ 3 planes de suscripción (Free, Starter, Professional)
- ✅ Facturación con Stripe (monthly/annual)
- ✅ Dashboard básico con métricas de organización
- ✅ Invitaciones por email
- ✅ Audit log básico (cambios en roles/permisos)
- ✅ API REST documentada con Swagger
- ✅ Frontend Angular con Tailwind (login, dashboard, user/role management)

#### Fase 2 (16 semanas) - Advanced RBAC
- ✅ Roles personalizados por tenant
- ✅ Jerarquía de roles con herencia
- ✅ Permisos condicionales (ej: edit_own, approve_department)
- ✅ Grupos de usuarios para asignación masiva
- ✅ Delegación temporal de permisos
- ✅ MFA (TOTP/SMS)
- ✅ Advanced audit logs con búsqueda y filtros
- ✅ Webhooks para eventos de autenticación/autorización

#### Fase 3 (24 semanas) - Enterprise Features
- ✅ SSO/SAML integration
- ✅ Plan Enterprise con SLA 99.9%
- ✅ Multi-tenant switching (usuarios en múltiples orgs)
- ✅ Custom branding por tenant (logo, colores, dominio)
- ✅ Advanced analytics dashboard
- ✅ API rate limiting granular por endpoint
- ✅ Geo-redundancy y disaster recovery
- ✅ Compliance reports (SOC2, GDPR)

#### Future Phases (Post-MVP)
- Attribute-Based Access Control (ABAC)
- Machine learning para detección de anomalías en accesos
- Mobile apps (iOS/Android)
- Marketplace de integraciones
- White-label solution para partners

---

## 2.5 Servicios de Suscripción - Customer Features

Los usuarios finales (clientes) de las organizaciones acceden a una suite de servicios productivos según su plan de suscripción. Estos servicios están disponibles en el **Frontend Cliente** (separado del panel administrativo).

### 2.5.1 Calendario (Calendar Service)

**Descripción**: Sistema de gestión de eventos, reuniones y recordatorios con sincronización en tiempo real.

**Features por Plan:**
- **Free**: Calendario personal, hasta 50 eventos/mes
- **Starter**: Calendarios compartidos de equipo, hasta 200 eventos/mes, recordatorios por email
- **Professional**: Calendarios ilimitados, integración con Google Calendar/Outlook, reserva de recursos (salas), recordatorios multi-canal
- **Enterprise**: Calendarios con aprobaciones, sincronización bidireccional, webhooks de eventos

**Funcionalidades Clave:**
- Creación de eventos con título, descripción, fecha/hora inicio/fin, ubicación
- Vista mensual, semanal, diaria, agenda
- Invitación de participantes internos y externos
- Recordatorios configurables (15min, 1h, 1día antes)
- Eventos recurrentes (diario, semanal, mensual)
- Categorías/etiquetas de eventos con colores
- Exportación a iCal/ICS
- Búsqueda y filtros por categoría, participante, fecha

**Permisos RBAC:**
- `calendar.create`: Crear eventos
- `calendar.read`: Ver calendarios
- `calendar.update`: Editar eventos
- `calendar.delete`: Eliminar eventos
- `calendar.share`: Compartir calendarios con otros usuarios

### 2.5.2 Tareas (Task Management)

**Descripción**: Sistema de gestión de tareas con estados, prioridades, asignaciones y seguimiento de progreso.

**Features por Plan:**
- **Free**: Tareas personales, hasta 100 tareas activas
- **Starter**: Asignación de tareas a miembros, listas de tareas, hasta 500 tareas
- **Professional**: Subtareas, dependencias, tableros Kanban, tareas ilimitadas, plantillas
- **Enterprise**: Automatizaciones, reportes de productividad, integraciones con Jira/Asana

**Funcionalidades Clave:**
- Creación de tareas con título, descripción, fecha límite, prioridad (baja/media/alta)
- Estados configurables: To Do, In Progress, In Review, Done
- Asignación a uno o múltiples usuarios
- Etiquetas/tags para categorización
- Adjuntar archivos a tareas (hasta límite de storage del plan)
- Comentarios y menciones (@usuario)
- Filtros y búsqueda avanzada
- Notificaciones de vencimiento y cambios de estado
- Vista de lista, tablero Kanban, calendario de tareas
- Historial de cambios con auditoría

**Permisos RBAC:**
- `tasks.create`: Crear tareas
- `tasks.read`: Ver tareas
- `tasks.update`: Editar tareas
- `tasks.delete`: Eliminar tareas
- `tasks.assign`: Asignar tareas a otros
- `tasks.complete`: Marcar tareas como completadas

### 2.5.3 Notificaciones (Notification Center)

**Descripción**: Centro de notificaciones unificado con múltiples canales y preferencias configurables.

**Features por Plan:**
- **Free**: Notificaciones in-app, hasta 100 notificaciones/día
- **Starter**: Email notifications, hasta 500 notificaciones/día
- **Professional**: Notificaciones push, webhooks, notificaciones ilimitadas
- **Enterprise**: Canales personalizados, integración con Slack/Teams, digest personalizado

**Tipos de Notificaciones:**
- **Sistema**: Invitaciones, cambios de rol, actualizaciones de suscripción
- **Tareas**: Asignaciones, vencimientos, cambios de estado, menciones
- **Calendario**: Recordatorios de eventos, cambios en eventos compartidos
- **Archivos**: Comparticiones, comentarios en documentos, vencimiento de links
- **Auditoría**: Cambios de permisos (solo para admins)

**Funcionalidades Clave:**
- Centro de notificaciones in-app con contador de no leídas
- Preferencias por tipo de notificación (email, in-app, push)
- Marcado de leído/no leído
- Archivo de notificaciones antiguas
- Búsqueda y filtros por tipo, fecha, estado
- Agrupación inteligente de notificaciones similares
- Modo "No molestar" con horarios configurables

**Permisos RBAC:**
- `notifications.read`: Ver notificaciones propias
- `notifications.manage`: Gestionar preferencias de notificaciones

### 2.5.4 Archivos (File Storage & Sharing)

**Descripción**: Sistema de almacenamiento de archivos con control de versiones, compartición y colaboración.

**Features por Plan:**
- **Free**: 1 GB storage, archivos hasta 10 MB
- **Starter**: 5 GB storage, archivos hasta 50 MB, compartición con link público
- **Professional**: 50 GB storage, archivos hasta 500 MB, control de versiones, comentarios en archivos
- **Enterprise**: Storage ilimitado, archivos hasta 5 GB, watermarking, DLP (Data Loss Prevention)

**Funcionalidades Clave:**
- Upload de archivos drag & drop
- Organización en carpetas jerárquicas
- Preview de archivos (imágenes, PDFs, documentos office)
- Compartición con usuarios internos (con permisos: ver, editar, comentar)
- Links públicos con expiración y contraseña opcional
- Control de versiones (historial de cambios)
- Búsqueda por nombre, tipo, fecha, propietario
- Etiquetas/tags para categorización
- Papelera de reciclaje (30 días)
- Descarga de carpetas completas (ZIP)

**Permisos RBAC:**
- `files.upload`: Subir archivos
- `files.read`: Ver archivos
- `files.update`: Editar archivos
- `files.delete`: Eliminar archivos
- `files.share`: Compartir archivos
- `files.download`: Descargar archivos

### 2.5.5 Dashboard Usuario

**Descripción**: Panel personalizado con métricas de actividad y accesos rápidos a servicios.

**Widgets Disponibles:**
- **Tareas Pendientes**: Lista de tareas asignadas con prioridad
- **Próximos Eventos**: Calendario de los próximos 7 días
- **Notificaciones Recientes**: Últimas 10 notificaciones
- **Archivos Recientes**: Últimos archivos subidos/editados
- **Actividad del Equipo**: Timeline de actividad de colaboradores
- **Métricas Personales**: Tareas completadas, eventos asistidos, archivos compartidos

**Personalización:**
- Drag & drop para reorganizar widgets
- Ocultar/mostrar widgets según preferencia
- Temas: claro, oscuro, auto (según OS)

### 2.5.6 Portafolio (Projects/Collections) - Gestión de Proyectos

**Descripción**: Sistema completo de gestión de proyectos con organización jerárquica por tags/secciones, control granular de items con campos customizables, operaciones batch y auditoría completa.

**Features por Plan:**
- **Free**:
  - 2 proyectos
  - 50 items totales
  - 3 secciones por proyecto
  - Sin operaciones batch
  - Sin exportación

- **Starter**:
  - 10 proyectos
  - 200 items totales
  - 10 secciones por proyecto
  - Operaciones batch básicas (selección múltiple, eliminar lotes)
  - Exportar a CSV

- **Professional**:
  - Proyectos ilimitados
  - Items ilimitados
  - Secciones ilimitadas
  - Operaciones batch avanzadas (mover sección, editar en masa)
  - Plantillas reutilizables de proyectos
  - Exportar a CSV/JSON
  - Búsqueda full-text

- **Enterprise**:
  - Todo lo de Professional +
  - Webhooks de cambios en proyectos
  - Integración API para sincronización externa
  - Auditoría avanzada con exportación de logs
  - Dashboards analíticos de proyectos
  - Compartición externa (read-only links)

**Funcionalidades Clave:**

1. **Gestión de Proyectos**:
   - Creación de proyectos con nombre, descripción, color/icono identificador
   - Estados del proyecto: Activo, Archivado, En Pausa
   - Filtrado por estado y búsqueda por nombre

2. **Organización por Secciones/Tags**:
   - Creación de secciones/tags configurables dentro de cada proyecto
   - Agrupación lógica de items relacionados
   - Colapsar/expandir secciones
   - Ordenamiento de secciones

3. **Gestión de Items**:
   - Tipos de items: Credenciales, Documentos, Enlaces, Notas, Configuraciones
   - Campos customizables por tipo: usuario, contraseña, email, URL, descripción, fecha vencimiento
   - Campos de contraseña con ocultación/mostrar

4. **Operaciones por Item**:
   - Editar: modificar todos los campos del item
   - Copiar/Clonar: duplicar item con todos sus datos
   - Reordenar: mover item arriba/abajo dentro de la sección
   - Eliminar: remover item con confirmación
   - Ver información: mostrar metadata (creado por, fecha, última modificación)

5. **Operaciones Batch** (Professional+):
   - Selección múltiple de items
   - Mover items seleccionados a otra sección
   - Editar en masa campos comunes
   - Eliminar múltiples items
   - Exportar selección

6. **Búsqueda y Filtros**:
   - Búsqueda global dentro del proyecto
   - Filtrar por sección/tag específico
   - Filtrar por tipo de item
   - Buscar en campos específicos (usuario, email, etc.)

7. **Compartición y Colaboración**:
   - Compartir proyecto con miembros del equipo
   - Permisos granulares por miembro: Ver, Editar, Admin
   - Notificaciones de cambios en proyectos compartidos
   - Historial de actividad

8. **Auditoría y Seguridad**:
   - Historial completo de cambios: quién modificó qué y cuándo
   - Log de accesos a items sensibles (credenciales)
   - Encriptación de campos de contraseña
   - Backup automático de proyectos

9. **Importación/Exportación**:
   - Importar proyectos desde CSV/JSON
   - Exportar proyecto completo o por sección
   - Plantillas de proyectos reutilizables

10. **Vistas Personalizadas**:
    - Vista Lista (por defecto): items en lista vertical
    - Vista Tabla: grid con todas las columnas visibles
    - Vista Compacta: solo títulos de items

11. **Integraciones** (Enterprise):
    - Webhooks para sincronización con sistemas externos
    - API REST para gestión programática
    - Conectores con password managers (1Password, LastPass)

12. **Notificaciones**:
    - Alertas de items próximos a vencer
    - Notificaciones de cambios en proyectos compartidos
    - Recordatorios de contraseñas a renovar

**Permisos RBAC:**
- `projects.create`: Crear nuevos proyectos
- `projects.read`: Ver proyectos asignados
- `projects.update`: Editar detalles de proyecto (nombre, descripción)
- `projects.delete`: Eliminar proyectos (solo propietario)
- `projects.manage_sections`: Crear/editar/eliminar secciones/tags
- `projects.manage_items`: Crear, editar, reordenar items
- `projects.delete_items`: Eliminar items del proyecto
- `projects.manage_members`: Agregar/remover miembros, asignar permisos
- `projects.export`: Exportar datos del proyecto

---

## 2.6 Arquitectura Dual Frontend

El sistema implementa una arquitectura de **dos aplicaciones frontend separadas** que consumen una **API unificada en Django**.

### 2.6.1 Frontend Admin (Angular)

**Propósito**: Panel de administración para gestión de RBAC, usuarios, suscripciones y configuración organizacional.

**Tecnologías:**
- Angular 17+ (Standalone Components)
- Tailwind CSS + Angular Material
- RxJS para manejo de estado
- Angular Guards para protección de rutas según permisos

**Módulos Principales:**
- **Dashboard Admin**: Métricas de tenants, usuarios, roles, uso de storage/API
- **User Management**: CRUD de usuarios, invitaciones, asignación de roles
- **Role Management**: Creación de roles personalizados, gestión de permisos
- **Permission Management**: Catálogo de permisos, asignación granular
- **Subscription Management**: Comparación de planes, upgrade/downgrade, facturación
- **Audit Logs**: Timeline de eventos, filtros, exportación
- **Settings**: Branding, integraciones, configuración general

**Acceso:**
- URL: `admin.plataforma.com` o `{subdomain}.plataforma.com/admin`
- Usuarios con roles: SuperAdmin, OrgAdmin, Manager (según permisos)

**Repositorio**: `/frontend-admin` (proyecto Angular separado)

### 2.6.2 Frontend Cliente (Angular)

**Propósito**: Aplicación para usuarios finales que consumen los servicios de suscripción.

**Tecnologías:**
- Angular 17+ (Standalone Components)
- Tailwind CSS
- RxJS + Signals para estado reactivo
- Angular Guards para feature gates según plan

**Módulos Principales:**
- **Landing Page**: Marketing, precios, registro
- **Dashboard Usuario**: Widgets personalizables, actividad reciente
- **Calendario**: Gestión de eventos, vistas múltiples
- **Tareas**: Tableros Kanban, listas, filtros
- **Notificaciones**: Centro de notificaciones, preferencias
- **Archivos**: Explorador de archivos, upload, compartición
- **Portafolio**: Gestión de proyectos, vistas personalizadas
- **Perfil**: Configuración de cuenta, seguridad, preferencias

**Acceso:**
- URL: `app.plataforma.com` o `{subdomain}.plataforma.com`
- Usuarios: Todos los miembros de la organización (Member, Manager, OrgAdmin)

**Repositorio**: `/frontend-cliente` (proyecto Angular separado)

### 2.6.3 Backend Unificado (Django)

**Propósito**: API única que sirve a ambos frontends con endpoints diferenciados.

**Estructura de APIs:**
```
/api/v1/admin/          # Endpoints para frontend admin
  /tenants              # Gestión de tenants (SuperAdmin)
  /users                # CRUD de usuarios
  /roles                # CRUD de roles
  /permissions          # CRUD de permisos
  /subscriptions        # Gestión de planes y facturación
  /audit-logs           # Logs de auditoría
  /analytics            # Métricas y reportes

/api/v1/app/            # Endpoints para frontend cliente
  /calendar             # CRUD de eventos
  /tasks                # CRUD de tareas
  /notifications        # Centro de notificaciones
  /files                # Upload, download, gestión de archivos
  /projects             # Gestión de portafolio/proyectos
  /dashboard            # Widgets y métricas del usuario

/api/v1/auth/           # Autenticación compartida
  /login
  /logout
  /refresh-token
  /register
  /verify-email
  /reset-password
```

**Seguridad:**
- Misma autenticación JWT para ambos frontends
- Middleware RBAC verifica permisos según endpoint
- Feature gates validan plan de suscripción antes de acceso a endpoints premium
- RLS (Row-Level Security) garantiza aislamiento de datos por tenant

### 2.6.4 Prototipos React

**Propósito**: Prototipos estáticos para demo y validación de UX antes del desarrollo Angular.

**Prototipos:**
1. **Prototipo Admin** (`docs/ui-ux/prototype-react/`):
   - Ya implementado con login simulado, RBAC, gestión de usuarios/roles, suscripciones
   - Datos mock, sin backend

2. **Prototipo Cliente** (`docs/ui-ux/prototype-customer/`):
   - Nuevo prototipo a implementar
   - Servicios: Calendario, Tareas, Notificaciones, Archivos, Dashboard, Portafolio
   - Datos mock de servicios

**Tecnologías:**
- React 18 + Vite
- Tailwind CSS (misma paleta que prototipos Angular)
- Datos mock en archivos JS
- Sin backend, solo simulación client-side

**Uso:**
- Demos con stakeholders
- Validación de flujos UX
- Referencia para desarrollo Angular final

---

## 3. User Stories

### 3.1 Autenticación y Gestión de Usuarios

**US-001: Registro de Nueva Organización**
Como fundador de startup, quiero registrarme con email/contraseña y crear mi organización, para empezar a usar el producto en menos de 5 minutos.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre, email, contraseña, nombre organización
- [ ] Validación de email único, contraseña fuerte (8+ chars, mayúscula, número, símbolo)
- [ ] Se crea tenant con subdomain `organizacion.plataforma.com`
- [ ] Usuario recibe email de verificación con link expirable (24h)
- [ ] Tras verificar, usuario es redirigido a onboarding wizard
- [ ] Se crea automáticamente rol OrgAdmin y se asigna al usuario

---

**US-002: Login con JWT y Refresh Token**
Como usuario registrado, quiero hacer login con email/contraseña y obtener tokens JWT, para acceder de forma segura sin re-autenticarme constantemente.

**Criterios de Aceptación:**
- [ ] Endpoint POST /api/v1/auth/login recibe email/password
- [ ] Respuesta incluye access_token (exp 15min), refresh_token (exp 7d), user profile
- [ ] Access token incluye claims: user_id, tenant_id, roles, permissions
- [ ] Refresh token permite obtener nuevo access token sin re-login
- [ ] Tras 5 intentos fallidos, cuenta se bloquea temporalmente (15 min)
- [ ] Se registra login en audit log con IP, user-agent, timestamp

---

**US-003: Invitación de Miembros de Equipo**
Como admin de organización, quiero invitar miembros por email con rol asignado, para construir mi equipo rápidamente.

**Criterios de Aceptación:**
- [ ] Formulario permite ingresar emails (múltiples) y seleccionar rol
- [ ] Sistema valida límite de usuarios según plan actual
- [ ] Se envían emails con link de invitación (expira 7 días)
- [ ] Invitado puede aceptar, crear contraseña, y acceder inmediatamente
- [ ] Si email ya existe en otro tenant, puede aceptar y tener acceso a ambos
- [ ] Admin ve estado de invitaciones: pending, accepted, expired

---

**US-004: Activación de MFA (Multi-Factor Auth)**
Como usuario preocupado por seguridad, quiero habilitar MFA con TOTP (Google Authenticator), para proteger mi cuenta contra accesos no autorizados.

**Criterios de Aceptación:**
- [ ] En perfil de usuario, opción "Enable MFA"
- [ ] Sistema genera QR code con secret para escanear con app TOTP
- [ ] Usuario ingresa código de 6 dígitos para verificar configuración
- [ ] Tras habilitar, login requiere email/password + código TOTP
- [ ] Se generan 10 códigos de recuperación de un solo uso
- [ ] Admin puede forzar MFA obligatorio para toda la organización

---

**US-005: Gestión de Sesiones Concurrentes**
Como usuario que accede desde múltiples dispositivos, quiero ver mis sesiones activas y poder cerrarlas remotamente, para controlar dónde estoy autenticado.

**Criterios de Aceptación:**
- [ ] Pantalla "Active Sessions" muestra: dispositivo, navegador, IP, última actividad
- [ ] Usuario puede cerrar sesión individual con botón "Revoke"
- [ ] Botón "Revoke All" cierra todas excepto la actual
- [ ] Cerrar sesión invalida refresh token asociado
- [ ] Límite de 5 sesiones concurrentes (configurable por plan)
- [ ] Notificación si se detecta login desde ubicación inusual

---

### 3.2 Sistema de Roles y Permisos (RBAC)

**US-006: Creación de Rol Personalizado**
Como admin de organización, quiero crear roles personalizados con permisos específicos, para adaptar el control de acceso a mi estructura organizacional.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre rol, descripción, permisos
- [ ] Permisos organizados por recurso (Users, Content, Projects, Billing) y acción (create, read, update, delete)
- [ ] Vista previa muestra resumen de lo que el rol puede hacer
- [ ] Puedo seleccionar rol existente como plantilla
- [ ] Se valida que nombre de rol sea único en el tenant
- [ ] Cambios se registran en audit log

---

**US-007: Asignación de Rol a Usuario**
Como admin, quiero asignar roles a usuarios, para controlar qué pueden hacer en la plataforma.

**Criterios de Aceptación:**
- [ ] Desde perfil de usuario, selector de rol(es) disponibles
- [ ] Usuario puede tener múltiples roles (permisos se suman)
- [ ] Cambio de rol es efectivo inmediatamente (sin re-login)
- [ ] Se notifica al usuario vía email si cambia su rol
- [ ] No puedo remover último OrgAdmin (prevenir lockout)
- [ ] Audit log registra quién cambió rol de quién y cuándo

---

**US-008: Permisos Condicionales (Context-Aware)**
Como admin, quiero configurar permisos que dependan del contexto (ej: "editar solo documentos propios"), para tener control granular sin crear muchos roles.

**Criterios de Aceptación:**
- [ ] Al asignar permiso `document.edit`, puedo seleccionar scope: "all", "own", "department"
- [ ] Scope "own" solo permite editar documentos donde user_id = creador
- [ ] Scope "department" usa campo department_id del usuario y documento
- [ ] Backend valida scope en cada request mediante middleware
- [ ] Frontend oculta/deshabilita acciones no permitidas según scope
- [ ] Se pueden definir scopes personalizados (custom logic en código)

---

**US-009: Jerarquía de Roles con Herencia**
Como admin, quiero definir que "Manager" herede todos los permisos de "Member" más permisos adicionales, para simplificar gestión de roles.

**Criterios de Aceptación:**
- [ ] Al crear/editar rol, puedo seleccionar "Inherits from" otro rol
- [ ] Permisos heredados se muestran en color diferente (no editables directamente)
- [ ] Puedo agregar permisos adicionales sobre los heredados
- [ ] Cambios en rol padre se propagan automáticamente a roles hijos
- [ ] No se permiten herencias circulares (validación)
- [ ] Máximo 3 niveles de herencia (performance consideration)

---

**US-010: Delegación Temporal de Permisos**
Como manager que va de vacaciones, quiero delegar mis permisos de aprobación a un colega temporalmente, para que el trabajo no se detenga.

**Criterios de Aceptación:**
- [ ] Opción "Delegate Permissions" con selector de usuario y fecha inicio/fin
- [ ] Puedo seleccionar qué permisos delegar (no necesariamente todos)
- [ ] Delegado recibe notificación por email
- [ ] Durante el período, delegado puede ejercer esos permisos
- [ ] Audit log registra acciones como "por [Delegado] en nombre de [Original]"
- [ ] Tras fecha fin, permisos expiran automáticamente (cronjob diario)
- [ ] Puedo revocar delegación antes de tiempo

---

**US-011: Grupos de Permisos Predefinidos**
Como admin, quiero usar grupos de permisos predefinidos (ej: "Financial Access", "HR Access"), para asignar múltiples permisos relacionados de una vez.

**Criterios de Aceptación:**
- [ ] Sistema incluye grupos predefinidos: Basic Access, Financial, HR, Engineering, Sales
- [ ] Al asignar grupo a usuario, se otorgan todos los permisos del grupo
- [ ] Puedo crear grupos personalizados para mi organización
- [ ] Cambios en grupo se propagan a todos los usuarios con ese grupo
- [ ] Usuario ve permisos individuales, no solo nombre del grupo
- [ ] Puedo quitar permisos individuales de un grupo sin afectar el grupo base

---

**US-012: Auditoría Completa de Cambios en Permisos**
Como security officer, quiero ver un log inmutable de todos los cambios en roles/permisos, para cumplir con auditorías de compliance.

**Criterios de Aceptación:**
- [ ] Tabla audit_logs registra: timestamp, actor_user_id, action, resource_type, resource_id, changes (JSON), IP, user_agent
- [ ] Cambios en roles: creación, edición, eliminación
- [ ] Cambios en asignaciones: usuario X recibió/perdió rol Y
- [ ] Cambios en permisos de rol: permisos agregados/removidos
- [ ] Logs son inmutables (insert-only, no updates/deletes)
- [ ] UI permite filtrar por: usuario, acción, recurso, rango de fechas
- [ ] Exportación a CSV/JSON para entregar a auditores
- [ ] Retención: 7 años (compliance SOC2/GDPR)

---

### 3.3 Gestión de Suscripciones y Facturación

**US-013: Selección de Plan Durante Onboarding**
Como nuevo usuario, quiero elegir un plan (Free trial, Starter, Professional) durante el registro, para empezar con el plan adecuado a mis necesidades.

**Criterios de Aceptación:**
- [ ] Durante onboarding, se muestra comparación de planes con features/límites
- [ ] Por defecto se selecciona Free Trial (14 días, no requiere tarjeta)
- [ ] Si elige plan pago, se solicita método de pago (Stripe Elements)
- [ ] Tras trial, si no upgradea, pasa a plan Free (limitado)
- [ ] Email recordatorio 7 días antes de fin de trial
- [ ] Dashboard muestra días restantes de trial con CTA "Upgrade Now"

---

**US-014: Upgrade de Plan con Proration**
Como admin en plan Starter, quiero hacer upgrade a Professional a mitad de mes, pagando solo la diferencia prorrateada, para aprovechar features inmediatamente sin pagar de más.

**Criterios de Aceptación:**
- [ ] Botón "Upgrade Plan" disponible en Billing settings
- [ ] Sistema calcula proration: (días restantes / días totales) * diferencia de precio
- [ ] Muestra breakdown: "Starter restante: -$X, Professional prorrateado: +$Y, Total hoy: $Z"
- [ ] Tras confirmar, se cobra proration inmediatamente
- [ ] Plan actualiza al instante (sin esperar a fin de mes)
- [ ] Siguiente factura será Professional completo (ciclo mensual/anual)
- [ ] Email confirmación con recibo PDF

---

**US-015: Downgrade de Plan con Límites**
Como admin en plan Professional, quiero hacer downgrade a Starter, entendiendo que perderé features y ajustaré límites.

**Criterios de Aceptación:**
- [ ] Sistema valida límites del nuevo plan (ej: Starter = 10 usuarios, Pro = 50)
- [ ] Si excede límites, muestra advertencia: "Tienes 25 usuarios, Starter permite 10. Desactiva 15 usuarios para continuar."
- [ ] Tras confirmar, downgrade toma efecto al final del ciclo de facturación actual
- [ ] No se cobra proration (se mantiene Pro hasta fin de período pagado)
- [ ] Features de Pro permanecen activas hasta fin de ciclo
- [ ] Email confirmación con fecha efectiva del downgrade

---

**US-016: Gestión de Métodos de Pago**
Como admin, quiero agregar/editar/eliminar tarjetas de crédito, para tener control sobre cómo se factura mi suscripción.

**Criterios de Aceptación:**
- [ ] Pantalla "Payment Methods" muestra tarjetas guardadas (últimos 4 dígitos, brand, exp)
- [ ] Puedo agregar nueva tarjeta con Stripe Elements (PCI-compliant)
- [ ] Puedo marcar una tarjeta como "Default" para futuros cargos
- [ ] Puedo eliminar tarjetas (excepto la default si hay suscripción activa)
- [ ] Webhook de Stripe notifica si tarjeta expira/es declinada
- [ ] Sistema intenta cobrar con tarjetas alternativas antes de suspender servicio

---

**US-017: Facturación Automática y Recibos**
Como admin, quiero que el sistema facture automáticamente cada mes/año y me envíe recibos, para no preocuparme por renovaciones.

**Criterios de Aceptación:**
- [ ] Cronjob diario verifica suscripciones a renovar (fecha de facturación)
- [ ] Se crea cargo en Stripe con descripción del plan y período
- [ ] Tras cobro exitoso, se extiende fecha de próxima renovación
- [ ] Se genera PDF con recibo (logo empresa, desglose, impuestos)
- [ ] Email con recibo adjunto + link a descargar desde dashboard
- [ ] Si falla pago, se reintenta 3 veces (día 1, 3, 7) antes de suspender
- [ ] Email notificación de fallo de pago con link para actualizar método

---

**US-018: Cancelación de Suscripción**
Como admin insatisfecho, quiero cancelar mi suscripción, manteniendo acceso hasta el final del período pagado.

**Criterios de Aceptación:**
- [ ] Botón "Cancel Subscription" en Billing settings
- [ ] Modal de confirmación explica: "Acceso hasta [fecha], luego pasarás a plan Free"
- [ ] Opcional: formulario de feedback sobre razón de cancelación
- [ ] Tras confirmar, suscripción marca como "canceled" pero activa hasta fin de período
- [ ] No se cobra siguiente ciclo
- [ ] Email confirmación con fecha de fin de acceso
- [ ] Al llegar fecha, tenant migra a plan Free (se deshabilitan features Pro)

---

**US-019: Feature Gates por Plan**
Como desarrollador del sistema, quiero que features se habiliten/deshabiliten automáticamente según el plan, para monetizar correctamente.

**Criterios de Aceptación:**
- [ ] Tabla `features` define qué features están disponibles en qué planes
- [ ] Middleware backend valida feature gate en cada request (`@require_feature('advanced_roles')`)
- [ ] Si usuario intenta usar feature no disponible, respuesta 403 con mensaje "Upgrade to Professional"
- [ ] Frontend consulta features disponibles al cargar (endpoint `/api/v1/features`)
- [ ] Componentes se ocultan/deshabilitan si feature no disponible
- [ ] Ejemplo features: custom_roles (Pro+), mfa (Starter+), sso (Enterprise), api_access (Pro+)

---

**US-020: Límites de Uso por Plan**
Como admin en plan Starter, quiero ver cuánto he consumido de mis límites (usuarios, storage, API calls), para saber cuándo necesito upgrade.

**Criterios de Aceptación:**
- [ ] Dashboard muestra progress bars: "8/10 users", "2.3GB/5GB storage", "1,234/10,000 API calls"
- [ ] Límites se validan en tiempo real (ej: no puedo invitar usuario #11 en plan Starter)
- [ ] Al acercarse a límite (80%), email de advertencia
- [ ] Al alcanzar 100%, modal sugiere upgrade
- [ ] Tabla `usage_tracking` registra consumo diario para analytics
- [ ] Planes: Free (5 users, 1GB, 1k API), Starter (10/5GB/10k), Pro (50/50GB/100k), Enterprise (unlimited)

---

### 3.4 Multi-Tenancy y Aislamiento de Datos

**US-021: Aislamiento Completo de Datos con RLS**
Como usuario de tenant A, nunca debo poder ver/modificar datos de tenant B, incluso si hay bug en código.

**Criterios de Aceptación:**
- [ ] PostgreSQL RLS policies en todas las tablas multi-tenant
- [ ] Policy: `CREATE POLICY tenant_isolation ON table USING (tenant_id = current_setting('app.tenant_id')::uuid)`
- [ ] Middleware Django establece `SET LOCAL app.tenant_id = X` al inicio de cada request
- [ ] Tests de seguridad verifican que queries no filtren datos entre tenants
- [ ] SuperAdmin puede acceder a cualquier tenant (con flag explícito + audit log)
- [ ] Indexes incluyen tenant_id como prefijo para performance

---

**US-022: Subdominios Personalizados por Tenant**
Como admin de organización "Acme Corp", quiero que mi equipo acceda via `acme.plataforma.com`, para branding profesional.

**Criterios de Aceptación:**
- [ ] Durante onboarding, se genera subdomain basado en nombre organización (slug)
- [ ] Validación: solo alfanumérico-guiones, único, no keywords reservadas
- [ ] DNS wildcard *.plataforma.com apunta a load balancer
- [ ] Middleware detecta subdomain del request, identifica tenant, establece contexto
- [ ] Si subdomain no existe, redirect a landing page
- [ ] Plan Enterprise permite custom domain completo (ej: portal.acmecorp.com) con CNAME

---

**US-023: Tenant Switching para Usuarios Multi-Org**
Como consultor que trabaja con 3 clientes, quiero cambiar entre organizaciones sin cerrar sesión, para ser más productivo.

**Criterios de Aceptación:**
- [ ] Dropdown en navbar muestra organizaciones donde tengo acceso
- [ ] Cambiar organización recarga app con nuevo contexto (sin re-login)
- [ ] JWT incluye `available_tenants: [{id, name, role}]`
- [ ] Al cambiar, se genera nuevo access token con tenant_id actualizado
- [ ] Navegación no pierde estado de la app
- [ ] Audit log registra tenant switches

---

**US-024: Configuración por Tenant (Branding)**
Como admin, quiero personalizar logo, colores, y nombre de organización, para que la plataforma se sienta como nuestra.

**Criterios de Aceptación:**
- [ ] Settings → Branding permite subir logo (PNG/SVG, max 500KB)
- [ ] Color picker para primary color (aplica a botones, links)
- [ ] Preview en tiempo real de cambios
- [ ] Logo se muestra en navbar, emails, y reportes PDF
- [ ] Custom branding solo disponible en plan Professional+
- [ ] Plan Enterprise permite ocultar "Powered by [Plataforma]"

---

**US-025: Métricas por Tenant para Analytics**
Como Product Manager, quiero ver métricas agregadas por tenant (usuarios activos, features usadas, churn), para identificar patrones.

**Criterios de Aceptación:**
- [ ] Dashboard SuperAdmin muestra: MAU por tenant, plan distribution, MRR, churn rate
- [ ] Drill-down en tenant individual: usuarios activos últimos 30d, features más usadas, tickets de soporte
- [ ] Alertas si tenant grande (>100 users) está en riesgo de churn (poco uso, tickets abiertos)
- [ ] Export a CSV para análisis en BI tools
- [ ] Datos anonimizados para compliance (no PII sin consentimiento)

---

### 3.5 Gestión de Proyectos (Cliente)

**US-26: Crear Proyecto**
- Como usuario cliente
- Quiero crear un nuevo proyecto con nombre y descripción
- Para organizar mis credenciales, documentos y enlaces

**Criterios de Aceptación:**
- [ ] Usuario puede crear proyecto desde botón "+ Nuevo Proyecto"
- [ ] Formulario solicita: nombre (requerido), descripción (opcional), color
- [ ] Sistema valida límites del plan (Free: 2 proyectos max)
- [ ] Proyecto creado aparece en lista "Mis Proyectos"
- [ ] Usuario es asignado como owner del proyecto automáticamente

---

**US-27: Organizar Items por Secciones**
- Como usuario con proyecto existente
- Quiero crear secciones/tags para agrupar items relacionados
- Para mantener organizado el contenido del proyecto

**Criterios de Aceptación:**
- [ ] Usuario puede crear sección desde panel del proyecto
- [ ] Sección tiene nombre único dentro del proyecto
- [ ] Usuario puede colapsar/expandir secciones
- [ ] Items se muestran agrupados por sección
- [ ] Sistema respeta límites del plan (Free: 3 secciones max)

---

**US-28: Gestionar Items de Credenciales**
- Como usuario del proyecto
- Quiero agregar items con campos customizables (usuario, password, email)
- Para almacenar credenciales de forma segura

**Criterios de Aceptación:**
- [ ] Usuario puede crear item dentro de una sección
- [ ] Item tipo "Credencial" tiene campos: usuario, password, email, URL, notas
- [ ] Campo password se muestra oculto por defecto (•••)
- [ ] Usuario puede mostrar/ocultar password con botón
- [ ] Passwords se almacenan encriptados en base de datos
- [ ] Sistema respeta límites del plan (Free: 50 items max)

---

**US-29: Operaciones de Item Individual**
- Como usuario con permisos de edición
- Quiero editar, copiar, reordenar y eliminar items
- Para gestionar el contenido del proyecto eficientemente

**Criterios de Aceptación:**
- [ ] Botón editar (✏️) abre modal con formulario de campos
- [ ] Botón copiar (📋) duplica el item con sufijo "(copia)"
- [ ] Botones ordenar (↑↓) mueven item arriba/abajo dentro de sección
- [ ] Botón info (ℹ️) muestra metadata (creado por, fecha)
- [ ] Botón eliminar (🗑️) solicita confirmación antes de borrar
- [ ] Auditoría registra todas las operaciones

---

**US-30: Operaciones Batch (Professional+)**
- Como usuario con plan Professional
- Quiero seleccionar múltiples items y aplicar acciones masivas
- Para ahorrar tiempo en gestión de proyectos grandes

**Criterios de Aceptación:**
- [ ] Checkboxes disponibles para selección múltiple
- [ ] Barra de acciones aparece al seleccionar items
- [ ] Acciones disponibles: Mover a sección, Eliminar, Exportar
- [ ] Confirmación requerida para operaciones destructivas
- [ ] Feature gate valida plan Professional antes de permitir

---

**US-31: Búsqueda y Filtros**
- Como usuario con muchos items
- Quiero buscar y filtrar dentro del proyecto
- Para encontrar información rápidamente

**Criterios de Aceptación:**
- [ ] Barra de búsqueda disponible en vista de proyecto
- [ ] Búsqueda en tiempo real (debounce 300ms)
- [ ] Busca en: título item, campos de texto, nombre sección
- [ ] Filtros laterales por: tipo item, sección/tag
- [ ] Resultados destacan texto coincidente

---

**US-32: Exportar/Importar Proyectos**
- Como usuario con plan Starter+
- Quiero exportar proyecto a CSV/JSON e importar desde archivo
- Para backup y migración de datos

**Criterios de Aceptación:**
- [ ] Botón "Exportar" genera archivo descargable
- [ ] Formatos soportados: CSV (Starter+), JSON (Professional+)
- [ ] Export incluye: proyecto, secciones, items, fields
- [ ] Passwords exportados quedan encriptados en archivo
- [ ] Importar valida formato y límites del plan
- [ ] Importar permite mapeo de campos si difieren

---

**US-33: Compartir Proyecto con Equipo**
- Como owner de proyecto
- Quiero compartir el proyecto con miembros de mi organización
- Para colaborar en la gestión de credenciales y documentos

**Criterios de Aceptación:**
- [ ] Botón "Compartir" abre modal de gestión de miembros
- [ ] Owner puede agregar usuarios de la organización
- [ ] Roles disponibles: Viewer, Editor, Admin
- [ ] Viewer: solo lectura
- [ ] Editor: leer, crear, editar items (no eliminar proyecto)
- [ ] Admin: todas las operaciones excepto eliminar proyecto
- [ ] Miembros reciben notificación de acceso

---

**US-34: Auditoría de Cambios en Proyecto**
- Como owner o admin de proyecto
- Quiero ver historial completo de cambios
- Para auditoría de seguridad y cumplimiento

**Criterios de Aceptación:**
- [ ] Panel "Actividad" muestra timeline de cambios
- [ ] Cada entrada registra: usuario, acción, timestamp, detalles
- [ ] Acciones auditadas: crear, editar, eliminar items/secciones
- [ ] Accesos a items sensibles (credenciales) se registran
- [ ] Filtros por: usuario, tipo acción, rango de fechas
- [ ] Export de logs disponible para plan Enterprise

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

## 6. Technical Approach

### 6.1 Backend Architecture (Django REST Framework)

#### 6.1.1 Estructura de Modelos

**Base Models con Herencia:**
```python
# core/models.py
class TenantAwareModel(models.Model):
    """Abstract base para modelos multi-tenant"""
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, db_index=True)

    class Meta:
        abstract = True

class TimestampedModel(models.Model):
    """Abstract base para timestamps"""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class AuditedModel(TimestampedModel):
    """Abstract base con auditoría"""
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='+')

    class Meta:
        abstract = True
```

**Modelos Principales:**
```python
# accounts/models.py
class Tenant(TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    subdomain = models.SlugField(unique=True, db_index=True)
    logo = models.ImageField(upload_to='tenants/logos/', blank=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    settings = models.JSONField(default=dict)  # Custom settings

    # Subscription
    subscription_plan = models.CharField(max_length=50, choices=PLAN_CHOICES)
    subscription_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    trial_ends_at = models.DateTimeField(null=True)
    subscription_current_period_end = models.DateTimeField(null=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)

class User(AbstractBaseUser, PermissionsMixin, TimestampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True)

    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=32, blank=True)

    # Multi-tenant
    tenants = models.ManyToManyField(Tenant, through='TenantMembership')

class TenantMembership(TenantAwareModel, AuditedModel):
    """Relación User-Tenant con roles"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    roles = models.ManyToManyField('Role')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'tenant')
        indexes = [models.Index(fields=['tenant', 'user'])]

# rbac/models.py
class Role(TenantAwareModel, AuditedModel):
    """Roles por tenant"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=False)  # Predefined roles
    parent_role = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    permissions = models.ManyToManyField('Permission')

    class Meta:
        unique_together = ('tenant', 'name')
        indexes = [models.Index(fields=['tenant', 'name'])]

class Permission(models.Model):
    """Permisos globales (resource.action)"""
    codename = models.CharField(max_length=100, unique=True)  # e.g., 'users.create'
    name = models.CharField(max_length=255)
    resource = models.CharField(max_length=50, db_index=True)  # e.g., 'users'
    action = models.CharField(max_length=50)  # e.g., 'create'
    description = models.TextField(blank=True)

class PermissionGrant(TenantAwareModel, AuditedModel):
    """Permisos con scope condicional"""
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='all')
    # Scopes: 'all', 'own', 'department', 'custom'

    class Meta:
        unique_together = ('role', 'permission', 'scope')

class AuditLog(models.Model):
    """Audit trail inmutable"""
    id = models.BigAutoField(primary_key=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, db_index=True)
    actor_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50, db_index=True)  # 'create_role', 'assign_role'
    resource_type = models.CharField(max_length=50)  # 'role', 'user', 'permission'
    resource_id = models.UUIDField(null=True)
    changes = models.JSONField()  # Before/after snapshot
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'timestamp']),
            models.Index(fields=['tenant', 'actor_user', 'timestamp']),
            models.Index(fields=['tenant', 'resource_type', 'timestamp']),
        ]

# services/models.py - Modelos para Servicios de Suscripción
class Event(TenantAwareModel, AuditedModel):
    """Eventos de calendario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    is_all_day = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=255, blank=True)  # iCal RRULE
    category = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    participants = models.ManyToManyField(User, related_name='events')
    reminders = models.JSONField(default=list)  # [{'minutes_before': 15, 'method': 'email'}]

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'start_time']),
            models.Index(fields=['tenant', 'organizer', 'start_time']),
        ]

class Task(TenantAwareModel, AuditedModel):
    """Tareas"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('in_review', 'In Review'),
        ('done', 'Done')
    ], default='todo', db_index=True)
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ], default='medium', db_index=True)
    due_date = models.DateTimeField(null=True, blank=True, db_index=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    project = models.ForeignKey('Project', on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')
    tags = models.JSONField(default=list)  # ['frontend', 'bug', 'urgent']
    attachments = models.ManyToManyField('File', blank=True)
    parent_task = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subtasks')

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'status', 'due_date']),
            models.Index(fields=['tenant', 'assignee', 'status']),
        ]

class Notification(TenantAwareModel):
    """Notificaciones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, db_index=True)  # 'task_assigned', 'event_reminder', etc.
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)  # Link para ir al recurso
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)  # Datos adicionales específicos del tipo

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'user', 'is_read', 'created_at']),
            models.Index(fields=['tenant', 'user', 'type', 'created_at']),
        ]
        ordering = ['-created_at']

class File(TenantAwareModel, AuditedModel):
    """Archivos almacenados"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='files/%Y/%m/%d/')
    file_size = models.BigIntegerField()  # Bytes
    mime_type = models.CharField(max_length=100)
    folder = models.ForeignKey('Folder', null=True, blank=True, on_delete=models.CASCADE, related_name='files')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_files')
    shared_with = models.ManyToManyField(User, through='FileShare', related_name='shared_files')
    tags = models.JSONField(default=list)
    version = models.IntegerField(default=1)
    parent_file = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='versions')
    is_deleted = models.BooleanField(default=False)  # Soft delete
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'owner', 'is_deleted']),
            models.Index(fields=['tenant', 'folder', 'is_deleted']),
        ]

class Folder(TenantAwareModel, AuditedModel):
    """Carpetas para organización de archivos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    parent_folder = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subfolders')
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

class FileShare(TenantAwareModel):
    """Compartición de archivos"""
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.CharField(max_length=20, choices=[
        ('view', 'View'),
        ('comment', 'Comment'),
        ('edit', 'Edit')
    ])
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares_created')
    shared_at = models.DateTimeField(auto_now_add=True)

class Project(TenantAwareModel, AuditedModel):
    """Proyectos/Portafolio"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed')
    ], default='planning', db_index=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    members = models.ManyToManyField(User, related_name='projects')
    color = models.CharField(max_length=7, default='#3B82F6')

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'owner', 'status']),
        ]

class ProjectSection(TenantAwareModel, TimestampedModel):
    """Tags/Secciones dentro de un proyecto"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)  # ej: "admin_test", "clonar_angular"
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)  # para ordenamiento
    color = models.CharField(max_length=7, blank=True)  # hex color opcional

    class Meta:
        ordering = ['order', 'name']
        unique_together = [['project', 'name']]
        indexes = [
            models.Index(fields=['project', 'order']),
        ]

class ProjectItem(TenantAwareModel, AuditedModel):
    """Items dentro de una sección de proyecto"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    section = models.ForeignKey(ProjectSection, on_delete=models.CASCADE, related_name='items')
    type = models.CharField(max_length=50, choices=[
        ('credential', 'Credencial'),
        ('document', 'Documento'),
        ('link', 'Enlace'),
        ('note', 'Nota'),
        ('config', 'Configuración'),
    ])
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)  # para credenciales

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['section', 'order']),
            models.Index(fields=['section', 'type']),
        ]

class ProjectItemField(models.Model):
    """Campos customizables de un item"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    item = models.ForeignKey(ProjectItem, on_delete=models.CASCADE, related_name='fields')
    field_name = models.CharField(max_length=50)  # ej: "usuario", "password", "email"
    field_type = models.CharField(max_length=20, choices=[
        ('text', 'Texto'),
        ('password', 'Contraseña'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('date', 'Fecha'),
        ('number', 'Número'),
    ])
    field_value = models.TextField()  # almacenado encriptado si field_type='password'
    is_encrypted = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'field_name']
        unique_together = [['item', 'field_name']]

class ProjectMember(TenantAwareModel, TimestampedModel):
    """Miembros con acceso a un proyecto"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=[
        ('owner', 'Propietario'),
        ('admin', 'Administrador'),
        ('editor', 'Editor'),
        ('viewer', 'Visualizador'),
    ])

    class Meta:
        unique_together = [['project', 'user']]
        indexes = [
            models.Index(fields=['project', 'role']),
        ]
```

#### 6.1.2 Managers Personalizados

```python
# core/managers.py
class TenantAwareManager(models.Manager):
    """Manager que filtra automáticamente por tenant"""
    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = get_current_tenant_id()  # From thread-local storage
        if tenant_id:
            return qs.filter(tenant_id=tenant_id)
        return qs

    def all_tenants(self):
        """Bypass tenant filtering (SuperAdmin only)"""
        return super().get_queryset()
```

#### 6.1.3 Middleware de Tenant Switching

```python
# core/middleware.py
class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Identificar tenant por subdomain
        host = request.get_host().split(':')[0]
        subdomain = host.split('.')[0] if '.' in host else None

        try:
            tenant = Tenant.objects.get(subdomain=subdomain)
            request.tenant = tenant
            set_current_tenant_id(tenant.id)  # Thread-local storage

            # Establecer RLS en PostgreSQL
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL app.tenant_id = %s", [str(tenant.id)])
        except Tenant.DoesNotExist:
            return HttpResponseNotFound("Tenant not found")

        response = self.get_response(request)
        return response
```

#### 6.1.4 Serializers con Validaciones Complejas

```python
# rbac/serializers.py
class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_grants = PermissionGrantSerializer(many=True, write_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'parent_role', 'permissions', 'permission_grants']

    def validate_name(self, value):
        # Validar unicidad dentro del tenant
        tenant = self.context['request'].tenant
        if Role.objects.filter(tenant=tenant, name=value).exists():
            raise serializers.ValidationError("Role name must be unique within organization")
        return value

    def validate_parent_role(self, value):
        # Prevenir herencias circulares
        if value:
            current_parent = value.parent_role
            depth = 1
            while current_parent:
                if depth >= 3:
                    raise serializers.ValidationError("Maximum inheritance depth is 3")
                current_parent = current_parent.parent_role
                depth += 1
        return value

    def create(self, validated_data):
        permission_grants_data = validated_data.pop('permission_grants', [])
        role = Role.objects.create(**validated_data)

        # Crear permission grants
        for grant_data in permission_grants_data:
            PermissionGrant.objects.create(role=role, **grant_data)

        # Audit log
        AuditLog.objects.create(
            tenant=role.tenant,
            actor_user=self.context['request'].user,
            action='create_role',
            resource_type='role',
            resource_id=role.id,
            changes={'name': role.name, 'permissions': [p.codename for p in role.permissions.all()]},
            ip_address=self.context['request'].META.get('REMOTE_ADDR'),
            user_agent=self.context['request'].META.get('HTTP_USER_AGENT', ''),
        )

        return role
```

#### 6.1.5 ViewSets con Permisos Personalizados

```python
# rbac/views.py
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, HasPermission('roles.manage')]

    def get_queryset(self):
        # Filtrado automático por tenant via manager
        return Role.objects.filter(is_system_role=False)  # No mostrar system roles

    @action(detail=True, methods=['post'])
    def assign_to_user(self, request, pk=None):
        """Asignar rol a usuario"""
        role = self.get_object()
        user_id = request.data.get('user_id')

        try:
            membership = TenantMembership.objects.get(
                tenant=request.tenant,
                user_id=user_id
            )
            membership.roles.add(role)

            # Invalidar cache de permisos del usuario
            cache.delete(f'user_permissions:{user_id}:{request.tenant.id}')

            return Response({'status': 'role assigned'})
        except TenantMembership.DoesNotExist:
            return Response({'error': 'User not in organization'}, status=400)
```

#### 6.1.6 Signals para Auditoría Automática

```python
# rbac/signals.py
@receiver(post_save, sender=Role)
def audit_role_change(sender, instance, created, **kwargs):
    if created:
        action = 'create_role'
    else:
        action = 'update_role'

    # Obtener request del thread-local storage
    request = get_current_request()
    if request:
        AuditLog.objects.create(
            tenant=instance.tenant,
            actor_user=request.user if request.user.is_authenticated else None,
            action=action,
            resource_type='role',
            resource_id=instance.id,
            changes=model_to_dict(instance),
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
```

#### 6.1.7 Celery para Tareas Asíncronas

```python
# billing/tasks.py
@shared_task
def process_subscription_renewals():
    """Cron diario: procesar renovaciones"""
    today = timezone.now().date()
    tenants = Tenant.objects.filter(
        subscription_status='active',
        subscription_current_period_end__date=today
    )

    for tenant in tenants:
        try:
            # Cargar tarjeta default via Stripe
            charge = stripe.Charge.create(
                amount=get_plan_price(tenant.subscription_plan),
                currency='usd',
                customer=tenant.stripe_customer_id,
                description=f"Subscription renewal - {tenant.name}"
            )

            # Extender período
            tenant.subscription_current_period_end = today + timedelta(days=30)
            tenant.save()

            # Generar recibo
            generate_invoice_pdf.delay(tenant.id, charge.id)

            # Enviar email
            send_mail(
                subject='Payment Successful',
                message='Your subscription has been renewed.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[tenant.admin_email],
            )
        except stripe.error.CardError as e:
            # Reintentar en 3 días
            retry_payment.apply_async((tenant.id,), countdown=60*60*24*3)
```

### 6.2 Database Design (PostgreSQL)

#### 6.2.1 Row-Level Security (RLS)

```sql
-- Habilitar RLS en tablas multi-tenant
ALTER TABLE rbac_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_tenantmembership ENABLE ROW LEVEL SECURITY;

-- Policy: usuarios solo ven datos de su tenant
CREATE POLICY tenant_isolation ON rbac_role
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON accounts_tenantmembership
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Policy especial para SuperAdmins (bypass RLS con flag)
CREATE POLICY superadmin_bypass ON rbac_role
    USING (current_setting('app.is_superadmin', true)::boolean = true);
```

#### 6.2.2 Índices para Optimización

```sql
-- Índices compuestos con tenant_id como prefijo
CREATE INDEX idx_role_tenant_name ON rbac_role (tenant_id, name);
CREATE INDEX idx_membership_tenant_user ON accounts_tenantmembership (tenant_id, user_id);
CREATE INDEX idx_auditlog_tenant_timestamp ON rbac_auditlog (tenant_id, timestamp DESC);
CREATE INDEX idx_auditlog_tenant_actor_timestamp ON rbac_auditlog (tenant_id, actor_user_id, timestamp DESC);

-- Índice parcial para roles activos
CREATE INDEX idx_membership_active ON accounts_tenantmembership (tenant_id, user_id) WHERE is_active = true;

-- Índice GIN para búsqueda en JSON (audit log changes)
CREATE INDEX idx_auditlog_changes_gin ON rbac_auditlog USING gin (changes);
```

#### 6.2.3 Triggers para Integridad

```sql
-- Trigger: prevenir eliminación de último OrgAdmin
CREATE OR REPLACE FUNCTION prevent_last_admin_removal()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM accounts_tenantmembership tm
        JOIN accounts_tenantmembership_roles tmr ON tm.id = tmr.tenantmembership_id
        JOIN rbac_role r ON tmr.role_id = r.id
        WHERE tm.tenant_id = OLD.tenant_id AND r.name = 'OrgAdmin' AND tm.is_active = true
    ) <= 1 THEN
        RAISE EXCEPTION 'Cannot remove last OrgAdmin from tenant';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_admin
BEFORE DELETE OR UPDATE ON accounts_tenantmembership
FOR EACH ROW EXECUTE FUNCTION prevent_last_admin_removal();
```

#### 6.2.4 Particionamiento de Audit Logs

```sql
-- Particionar audit_logs por mes (performance con grandes volúmenes)
CREATE TABLE rbac_auditlog_2026_02 PARTITION OF rbac_auditlog
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE rbac_auditlog_2026_03 PARTITION OF rbac_auditlog
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Automatizar creación de particiones con cronjob/function
```

### 6.3 Frontend Architecture - Arquitectura Dual (Angular + Tailwind)

El sistema implementa **dos proyectos Angular separados** que consumen la misma API Django pero sirven propósitos diferentes.

#### 6.3.1 Frontend Admin - Estructura de Módulos

**Repositorio**: `/frontend-admin`

**Propósito**: Panel de administración para gestión de RBAC, usuarios y suscripciones.

```
frontend-admin/
└── src/app/
    ├── core/                   # Singleton services, guards, interceptors
    │   ├── auth/
    │   │   ├── auth.service.ts
    │   │   ├── token.service.ts
    │   │   └── mfa.service.ts
    │   ├── guards/
    │   │   ├── auth.guard.ts
    │   │   ├── permission.guard.ts
    │   │   └── admin-role.guard.ts
    │   ├── interceptors/
    │   │   ├── auth.interceptor.ts
    │   │   ├── tenant.interceptor.ts
    │   │   └── error.interceptor.ts
    │   └── models/             # Interfaces/types (User, Role, Permission, Subscription)
    ├── shared/                 # Shared components, directives, pipes
    │   ├── components/
    │   │   ├── button/
    │   │   ├── modal/
    │   │   ├── table/
    │   │   ├── toast/
    │   │   └── stats-card/
    │   ├── directives/
    │   │   └── has-permission.directive.ts
    │   └── pipes/
    │       └── format-date.pipe.ts
    ├── features/               # Feature modules (lazy-loaded)
    │   ├── auth/
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── mfa-setup/
    │   ├── dashboard-admin/    # Dashboard con métricas de tenants
    │   ├── user-management/    # CRUD de usuarios
    │   ├── role-management/    # CRUD de roles
    │   ├── permission-management/  # Gestión de permisos
    │   ├── subscription-management/ # Planes y facturación
    │   ├── audit-logs/         # Timeline de auditoría
    │   └── settings/           # Branding, integraciones
    └── layouts/
        ├── admin-layout/       # Sidebar + Navbar + Footer
        └── auth-layout/        # Login/Register layout

# Configuración específica
angular.json:
  - outputPath: dist/admin
  - baseHref: /admin/
  - deployUrl: https://admin.plataforma.com/
```

**Módulos Principales**:
- **Dashboard Admin**: Métricas globales (usuarios, roles, planes, storage, API usage)
- **User Management**: Tabla de usuarios, invitaciones, asignación de roles
- **Role Management**: Creación de roles personalizados, herencia
- **Permission Management**: Catálogo de permisos, asignación granular
- **Subscription Management**: Comparación de planes, upgrade/downgrade, historial facturas
- **Audit Logs**: Timeline de eventos con filtros y exportación

**Rutas Típicas**:
```
/admin/dashboard
/admin/users
/admin/roles
/admin/permissions
/admin/subscriptions
/admin/audit-logs
/admin/settings
```

#### 6.3.2 Frontend Cliente - Estructura de Módulos

**Repositorio**: `/frontend-cliente`

**Propósito**: Aplicación para usuarios finales con servicios productivos.

```
frontend-cliente/
└── src/app/
    ├── core/                   # Singleton services, guards, interceptors
    │   ├── auth/
    │   │   ├── auth.service.ts
    │   │   ├── token.service.ts
    │   │   └── mfa.service.ts
    │   ├── guards/
    │   │   ├── auth.guard.ts
    │   │   ├── feature-gate.guard.ts  # Verifica plan de suscripción
    │   │   └── onboarding.guard.ts
    │   ├── interceptors/
    │   │   ├── auth.interceptor.ts
    │   │   ├── tenant.interceptor.ts
    │   │   └── error.interceptor.ts
    │   ├── services/
    │   │   ├── calendar.service.ts
    │   │   ├── tasks.service.ts
    │   │   ├── notifications.service.ts
    │   │   ├── files.service.ts
    │   │   └── projects.service.ts
    │   └── models/             # Interfaces/types (Event, Task, Notification, File)
    ├── shared/                 # Shared components, directives, pipes
    │   ├── components/
    │   │   ├── button/
    │   │   ├── modal/
    │   │   ├── file-uploader/
    │   │   ├── toast/
    │   │   ├── notification-bell/
    │   │   └── widget/         # Para dashboard widgets
    │   ├── directives/
    │   │   └── feature-gate.directive.ts
    │   └── pipes/
    │       ├── format-date.pipe.ts
    │       └── file-size.pipe.ts
    ├── features/               # Feature modules (lazy-loaded)
    │   ├── auth/
    │   │   ├── login/
    │   │   ├── register/
    │   │   └── mfa-setup/
    │   ├── landing/            # Landing page pública
    │   ├── dashboard-user/     # Dashboard personalizable
    │   ├── calendar/           # Gestión de eventos
    │   │   ├── calendar-view/
    │   │   ├── event-detail/
    │   │   └── event-form/
    │   ├── tasks/              # Gestión de tareas
    │   │   ├── task-board/     # Kanban
    │   │   ├── task-list/
    │   │   └── task-detail/
    │   ├── notifications/      # Centro de notificaciones
    │   ├── files/              # Explorador de archivos
    │   │   ├── file-explorer/
    │   │   ├── file-preview/
    │   │   └── file-share/
    │   ├── projects/           # Portafolio/Proyectos
    │   │   ├── project-list/
    │   │   ├── project-detail/
    │   │   └── project-board/
    │   └── profile/            # Perfil y configuración usuario
    └── layouts/
        ├── main-layout/        # Navbar + Sidebar + Footer
        ├── auth-layout/        # Login/Register layout
        └── landing-layout/     # Landing page layout

# Configuración específica
angular.json:
  - outputPath: dist/cliente
  - baseHref: /
  - deployUrl: https://app.plataforma.com/
```

**Módulos Principales**:
- **Landing Page**: Marketing, precios, registro
- **Dashboard Usuario**: Widgets personalizables (tareas pendientes, eventos próximos, archivos recientes)
- **Calendario**: Vistas (mes, semana, día), creación de eventos, invitaciones
- **Tareas**: Tablero Kanban, listas, filtros, asignaciones
- **Notificaciones**: Centro de notificaciones in-app, preferencias
- **Archivos**: Upload drag & drop, preview, compartición, carpetas
- **Proyectos**: Gestión de proyectos, agregación de tareas/archivos/eventos

**Rutas Típicas**:
```
/                    # Landing page
/login
/register
/dashboard
/calendar
/tasks
/notifications
/files
/projects
/profile
```

#### 6.3.3 Compartición de Código Entre Frontends

**Shared Library** (`/frontend-shared`):

Librería Angular compartida entre ambos frontends para reutilizar código común.

```
frontend-shared/
└── src/lib/
    ├── auth/
    │   ├── auth.service.ts       # Servicio de autenticación compartido
    │   ├── token.service.ts
    │   └── auth.interceptor.ts
    ├── models/
    │   ├── user.model.ts
    │   ├── tenant.model.ts
    │   └── api-response.model.ts
    ├── utils/
    │   ├── date.utils.ts
    │   ├── validation.utils.ts
    │   └── http.utils.ts
    └── components/
        ├── avatar/
        ├── badge/
        └── spinner/

# Instalación en ambos proyectos
npm install @plataforma/shared
```

**Beneficios**:
- Evitar duplicación de código de autenticación
- Compartir modelos/interfaces comunes
- Componentes UI reutilizables (avatar, badge, spinner)
- Utilidades compartidas (validaciones, formateo de fechas)

#### 6.3.4 Configuración de Tailwind Compartida

Ambos proyectos usan la misma configuración de Tailwind para consistencia visual.

```javascript
// tailwind.config.js (mismo en ambos proyectos)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... paleta completa
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
```

#### 6.3.2 Guards para Protección de Rutas

```typescript
// core/guards/permission.guard.ts
@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as string;

    if (!requiredPermission) {
      return true; // No permission required
    }

    const hasPermission = this.authService.hasPermission(requiredPermission);

    if (!hasPermission) {
      this.router.navigate(['/forbidden']);
      return false;
    }

    return true;
  }
}

// Uso en routing
const routes: Routes = [
  {
    path: 'roles',
    loadComponent: () => import('./features/roles/roles.component'),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'roles.manage' }
  }
];
```

#### 6.3.3 Servicios con Signals para Estado

```typescript
// core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<User | null>(null);
  private permissionsSignal = signal<string[]>([]);

  user = this.userSignal.asReadonly();
  permissions = this.permissionsSignal.asReadonly();

  isAuthenticated = computed(() => !!this.userSignal());

  constructor(private http: HttpClient, private tokenService: TokenService) {
    this.loadUserFromToken();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/login', { email, password })
      .pipe(
        tap(response => {
          this.tokenService.saveTokens(response.access_token, response.refresh_token);
          this.userSignal.set(response.user);
          this.permissionsSignal.set(response.permissions);
        })
      );
  }

  hasPermission(permission: string): boolean {
    return this.permissionsSignal().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    const userPerms = this.permissionsSignal();
    return permissions.some(p => userPerms.includes(p));
  }

  private loadUserFromToken(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      const decoded = jwtDecode<TokenPayload>(token);
      this.userSignal.set(decoded.user);
      this.permissionsSignal.set(decoded.permissions);
    }
  }
}
```

#### 6.3.4 Interceptors para Autenticación

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getAccessToken();

  if (token && !req.url.includes('/auth/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado, intentar refresh
        return tokenService.refreshToken().pipe(
          switchMap(newToken => {
            // Reintentar request con nuevo token
            req = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(req);
          }),
          catchError(() => {
            // Refresh falló, logout
            inject(Router).navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

#### 6.3.5 Directiva para Permisos

```typescript
// shared/directives/has-permission.directive.ts
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  @Input('appHasPermission') permission!: string;
  @Input() appHasPermissionElse?: TemplateRef<any>;

  constructor(
    private authService: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit(): void {
    effect(() => {
      const hasPermission = this.authService.hasPermission(this.permission);

      this.viewContainer.clear();

      if (hasPermission) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else if (this.appHasPermissionElse) {
        this.viewContainer.createEmbeddedView(this.appHasPermissionElse);
      }
    });
  }
}

// Uso en template
<button *appHasPermission="'users.delete'" (click)="deleteUser()">
  Delete User
</button>
```

#### 6.3.6 Componentes Reutilizables con Tailwind

```typescript
// shared/components/button/button.component.ts
@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      (click)="handleClick($event)"
    >
      <svg *ngIf="loading()" class="animate-spin -ml-1 mr-2 h-4 w-4" ...>
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'outline' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' = 'button';

  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  @Output() clicked = new EventEmitter<MouseEvent>();

  buttonClasses = computed(() => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const disabledClass = this.disabled() || this.loading() ? 'opacity-50 cursor-not-allowed' : '';

    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${disabledClass}`;
  });

  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
```

### 6.4 API Design

#### 6.4.1 Versionamiento

- Base URL: `https://api.plataforma.com/v1/`
- Versionamiento en URL (no headers) para claridad
- Versiones soportadas simultáneamente: v1 (current), v2 (future)
- Deprecación: warning en headers `Warning: 299 - "API v1 deprecated, migrate to v2 by 2027-01-01"`

#### 6.4.2 Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "subdomain": "acme"
  },
  "permissions": ["users.read", "users.create", ...]
}
```

#### 6.4.3 Paginación, Filtrado, Ordenamiento

```http
GET /api/v1/users?page=2&page_size=25&sort=-created_at&filter[role]=admin&search=john

Response 200:
{
  "count": 156,
  "next": "https://api.plataforma.com/v1/users?page=3&page_size=25",
  "previous": "https://api.plataforma.com/v1/users?page=1&page_size=25",
  "results": [...]
}
```

**Parámetros estándar:**
- `page`: número de página (default: 1)
- `page_size`: items por página (default: 25, max: 100)
- `sort`: campo para ordenar, prefijo `-` para DESC (ej: `-created_at`)
- `filter[campo]`: filtro por campo exacto
- `search`: búsqueda full-text en campos relevantes

#### 6.4.4 Rate Limiting

```http
Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1643723400

Response 429 Too Many Requests:
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Retry after 45 seconds.",
  "retry_after": 45
}
```

Límites por plan:
- Free: 10 req/min, 1,000 req/día
- Starter: 100 req/min, 10,000 req/día
- Professional: 1,000 req/min, 100,000 req/día
- Enterprise: Custom (contactar sales)

#### 6.4.5 Projects API Endpoints

**Base Path**: `/api/v1/app/projects`

**Autenticación**: JWT Token requerido
**Tenant Isolation**: Automático vía middleware

**Endpoints:**

1. **GET /api/v1/app/projects**
   - Listar proyectos del usuario
   - Query params: `status`, `search`, `page`, `page_size`
   - Response: Paginado con proyectos + metadata

2. **POST /api/v1/app/projects**
   - Crear nuevo proyecto
   - Body: `name`, `description`, `color`, `status`
   - Response: Proyecto creado

3. **GET /api/v1/app/projects/{project_id}**
   - Obtener detalles completos del proyecto
   - Incluye: secciones, items, miembros
   - Response: Proyecto con nested data

4. **PUT /api/v1/app/projects/{project_id}**
   - Actualizar proyecto
   - Body: campos modificables
   - Response: Proyecto actualizado

5. **DELETE /api/v1/app/projects/{project_id}**
   - Eliminar proyecto (solo owner)
   - Response: 204 No Content

6. **GET /api/v1/app/projects/{project_id}/sections**
   - Listar secciones del proyecto
   - Response: Array de secciones

7. **POST /api/v1/app/projects/{project_id}/sections**
   - Crear nueva sección
   - Body: `name`, `description`, `color`
   - Response: Sección creada

8. **PUT /api/v1/app/projects/{project_id}/sections/{section_id}/reorder**
   - Reordenar secciones
   - Body: `new_order`
   - Response: Sección actualizada

9. **GET /api/v1/app/projects/{project_id}/sections/{section_id}/items**
   - Listar items de una sección
   - Query params: `type`, `search`
   - Response: Array de items con fields

10. **POST /api/v1/app/projects/{project_id}/sections/{section_id}/items**
    - Crear nuevo item
    - Body: `title`, `type`, `fields[]`
    - Response: Item creado con fields

11. **PUT /api/v1/app/projects/{project_id}/items/{item_id}**
    - Actualizar item
    - Body: `title`, `fields[]`
    - Response: Item actualizado

12. **POST /api/v1/app/projects/{project_id}/items/{item_id}/clone**
    - Clonar item
    - Response: Item duplicado

13. **PUT /api/v1/app/projects/{project_id}/items/{item_id}/reorder**
    - Reordenar item (mover arriba/abajo)
    - Body: `direction` ('up' | 'down')
    - Response: Item actualizado

14. **DELETE /api/v1/app/projects/{project_id}/items/{item_id}**
    - Eliminar item
    - Response: 204 No Content

15. **POST /api/v1/app/projects/{project_id}/items/batch**
    - Operaciones batch
    - Body: `action` ('delete' | 'move' | 'export'), `item_ids[]`, `target_section_id`
    - Response: Resultado de operación

16. **GET /api/v1/app/projects/{project_id}/export**
    - Exportar proyecto
    - Query params: `format` ('csv' | 'json')
    - Response: Archivo descargable

17. **POST /api/v1/app/projects/import**
    - Importar proyecto desde archivo
    - Body: Multipart form con archivo
    - Response: Proyecto importado

18. **GET /api/v1/app/projects/{project_id}/members**
    - Listar miembros del proyecto
    - Response: Array de miembros

19. **POST /api/v1/app/projects/{project_id}/members**
    - Agregar miembro al proyecto
    - Body: `user_id`, `role`
    - Response: Miembro agregado

20. **DELETE /api/v1/app/projects/{project_id}/members/{user_id}**
    - Remover miembro
    - Response: 204 No Content

---

## 7. Phases & Implementation Timeline

### Phase 1: Foundation (Weeks 1-4) - MVP Core

**Milestone:** Authentication, basic RBAC, database setup

**Week 1-2: Backend Foundation**
- [ ] Setup Django project con PostgreSQL
- [ ] Implementar modelos: Tenant, User, TenantMembership
- [ ] Configurar Row-Level Security (RLS) en PostgreSQL
- [ ] Implementar TenantMiddleware para context switching
- [ ] JWT authentication con access/refresh tokens
- [ ] Endpoint registro multi-tenant (POST /auth/register)
- [ ] Endpoint login (POST /auth/login)
- [ ] Endpoint refresh token (POST /auth/refresh)
- [ ] Tests unitarios de autenticación

**Week 3: RBAC Básico**
- [ ] Modelos: Role, Permission, PermissionGrant, AuditLog
- [ ] Crear 5 roles predefinidos (SuperAdmin, OrgAdmin, Manager, Member, Guest)
- [ ] Seed 50+ permisos básicos (users.*, roles.*, billing.*)
- [ ] Decorador `@require_permission` para views
- [ ] Endpoints CRUD roles (GET/POST/PUT/DELETE /roles/)
- [ ] Endpoint asignar rol a usuario (POST /roles/{id}/assign)
- [ ] Auditoría de cambios en roles (signals)

**Week 4: Frontend Setup**
- [ ] Setup Angular con Tailwind CSS
- [ ] Configurar standalone components y routing
- [ ] AuthService con signals para estado
- [ ] Auth interceptor (JWT auto-include)
- [ ] Guards: AuthGuard, PermissionGuard
- [ ] Páginas: Login, Register
- [ ] Layout principal con navbar y sidebar
- [ ] Integración con backend (login funcional)

**Deliverables:** Usuarios pueden registrarse, login, y ver dashboard básico. Admins pueden crear roles y asignarlos.

---

### Phase 2: Subscription Management (Weeks 5-8)

**Milestone:** Facturación, planes, feature gates

**Week 5: Stripe Integration**
- [ ] Modelo Subscription, PaymentMethod
- [ ] Integración Stripe: crear customer, attach payment method
- [ ] Webhooks Stripe (invoice.paid, payment_failed, customer.subscription.deleted)
- [ ] Endpoints: GET/POST/PUT /billing/subscription
- [ ] Endpoint agregar método de pago (POST /billing/payment-methods)
- [ ] Tests con Stripe test mode

**Week 6: Planes y Feature Gates**
- [ ] Definir 3 planes: Free, Starter ($29/mes), Professional ($99/mes)
- [ ] Tabla features: custom_roles, mfa, api_access, custom_branding
- [ ] Middleware feature gate (@require_feature('custom_roles'))
- [ ] Endpoint GET /billing/plans (comparación)
- [ ] Endpoint POST /billing/upgrade con proration
- [ ] Endpoint POST /billing/cancel (efectivo fin de período)

**Week 7: Limits y Usage Tracking**
- [ ] Modelo UsageTracking (usuarios activos, storage, API calls)
- [ ] Middleware rate limiting por plan (django-ratelimit + Redis)
- [ ] Validación límites en acciones (ej: invitar usuario valida límite)
- [ ] Dashboard endpoint GET /billing/usage (progress bars)
- [ ] Email alerts al 80% y 100% de límite
- [ ] Cronjob reseteo contador mensual

**Week 8: Frontend Billing**
- [ ] Página Billing con plan actual y usage
- [ ] Componente comparación de planes
- [ ] Stripe Elements para agregar tarjeta
- [ ] Flujo upgrade/downgrade con confirmación
- [ ] Modal de cancelación con feedback
- [ ] Tests E2E flujo completo upgrade

**Deliverables:** Sistema completo de suscripciones. Usuarios pueden upgradear, ver consumo, y gestionar pagos.

---

### Phase 3: Advanced RBAC (Weeks 9-12)

**Milestone:** Roles personalizados, herencia, delegación, auditoría avanzada

**Week 9: Roles Personalizados**
- [ ] Frontend: UI crear rol desde scratch
- [ ] Frontend: Selector permisos por módulo (tree view)
- [ ] Backend: Validar límite roles personalizados por plan
- [ ] Backend: Endpoint POST /roles con custom permissions
- [ ] Frontend: Usar rol existente como plantilla
- [ ] Tests: crear rol, asignar, validar permisos

**Week 10: Herencia y Scope Condicional**
- [ ] Modelo: Role.parent_role field
- [ ] Backend: Resolver permisos heredados recursivamente (max 3 niveles)
- [ ] Backend: Scopes (all, own, department) en PermissionGrant
- [ ] Middleware: Validar scope en queries (filter owner_id=current_user)
- [ ] Frontend: UI selector scope al asignar permiso
- [ ] Tests: validar herencia, scopes condicionales

**Week 11: Delegación Temporal**
- [ ] Modelo PermissionDelegation (user, delegated_to, permissions, start_date, end_date)
- [ ] Backend: Resolver permisos considerando delegaciones activas
- [ ] Endpoint POST /permissions/delegate
- [ ] Cronjob: expirar delegaciones (daily task)
- [ ] Frontend: Modal delegación con date picker
- [ ] Audit log: registrar acciones delegadas

**Week 12: Auditoría Avanzada y MFA**
- [ ] Frontend: Página audit logs con filtros (usuario, acción, fecha)
- [ ] Backend: Endpoint GET /audit-logs con búsqueda y paginación
- [ ] Exportar audit logs a CSV
- [ ] Implementar MFA (TOTP con pyotp)
- [ ] Frontend: QR code setup, input código 6 dígitos
- [ ] Endpoint POST /auth/mfa/setup, POST /auth/mfa/verify
- [ ] Tests: login con MFA, recovery codes

**Deliverables:** RBAC completo con todas las features avanzadas. Sistema production-ready para MVP launch.

---

## 8. Out of Scope (Explicit Exclusions)

Las siguientes features NO están incluidas en el alcance del MVP/Phase 1-3:

### 8.1 Fuera del MVP

- ❌ **SSO/SAML Integration**: OAuth2, SAML 2.0, LDAP (Enterprise feature - Phase 3 futuro)
- ❌ **Mobile Apps**: iOS/Android nativas (usar responsive web)
- ❌ **Attribute-Based Access Control (ABAC)**: Permisos basados en atributos dinámicos más allá de scopes
- ❌ **Machine Learning**: Detección de anomalías en accesos, sugerencias de roles
- ❌ **Advanced Analytics**: BI dashboard con gráficos complejos (solo métricas básicas)
- ❌ **Multi-language (i18n)**: Soportar idiomas más allá de inglés
- ❌ **Custom Workflows**: Aprobaciones multi-step configurables (ej: workflows 3 niveles)
- ❌ **Third-Party Integrations**: Slack, Microsoft Teams, Jira, Salesforce
- ❌ **White-label**: Rebranding completo para reventa (Enterprise post-MVP)
- ❌ **Geo-redundancy**: Multi-region deployment (solo us-east-1 en MVP)
- ❌ **Blockchain Audit Trail**: Immutable ledger con blockchain (overkill para MVP)
- ❌ **GraphQL API**: Solo REST en MVP
- ❌ **Real-time Collaboration**: Edición simultánea estilo Google Docs
- ❌ **Advanced Search**: Elasticsearch para búsqueda full-text avanzada (usar PostgreSQL full-text)
- ❌ **Video Tutorials**: In-app video guides (usar documentación escrita + screenshots)

### 8.2 Conscious Trade-offs (Simplificaciones del MVP)

- ⚠️ **Email Provider**: Usar SMTP simple en MVP (AWS SES/SendGrid en Phase 2)
- ⚠️ **Payment Gateways**: Solo Stripe en MVP (PayPal en Phase 2)
- ⚠️ **Infrastructure**: Monolito en MVP (microservices si escalamiento lo requiere)
- ⚠️ **Database**: Single PostgreSQL instance (read replicas en Phase 2)
- ⚠️ **Cache**: Redis single instance (cluster en Phase 2)
- ⚠️ **Monitoring**: New Relic básico (APM completo en Phase 2)
- ⚠️ **CI/CD**: GitHub Actions simple (Kubernetes + ArgoCD en Phase 2)

---

## 9. Open Questions & Decisions Needed

### 9.1 Business/Product Questions

**Q1: Pricing Strategy**
- ¿Los precios $29/$99 son finales o necesitan validación con mercado?
- ¿Descuento anual 10% es competitivo? (mercado ofrece 15-20%)
- ¿Plan Enterprise es "contact sales" o precio público (ej: $499/mes)?
- **Decision needed by:** Week 1 (antes de implementar billing)
- **Stakeholder:** Product Manager + Finance

**Q2: Trial Strategy**
- ¿Trial 14 días sin tarjeta es óptimo? ¿O 7 días con tarjeta (menor churn)?
- ¿Qué features están disponibles en trial? ¿Professional completo o limitado?
- ¿Downgrade post-trial es a Free o suspensión de cuenta?
- **Decision needed by:** Week 5
- **Stakeholder:** Product Manager + Marketing

**Q3: Plan Limits**
- ¿Límites propuestos (10/50 users) son adecuados?
- ¿Storage 5GB/50GB suficiente o muy bajo vs competencia?
- ¿API calls 10k/100k/mes es razonable? ¿Cómo medir (por endpoint, por tenant)?
- **Decision needed by:** Week 6
- **Stakeholder:** Product Manager + Engineering Lead

**Q4: Churn Handling**
- ¿Qué pasa con datos tras cancelación? ¿Soft delete 30 días o inmediato?
- ¿Reactivación tras cancelación permite restaurar datos?
- ¿Win-back campaigns automáticos vía email?
- **Decision needed by:** Week 7
- **Stakeholder:** Product Manager + Customer Success

### 9.2 Technical Questions

**Q5: Database Sharding Strategy**
- ¿En qué punto considerar sharding? ¿100M rows? ¿10k tenants?
- ¿Shard por tenant_id (tenant grande = shard completo) o por hash?
- ¿Usar Citus extension para sharding transparente?
- **Decision needed by:** Post-MVP (monitorear performance)
- **Stakeholder:** Tech Lead + DBA

**Q6: Real-time Requirements**
- ¿Se necesitan WebSockets para permisos en tiempo real?
- ¿Polling cada Xmin es suficiente para updates de roles?
- ¿Invalidación de cache de permisos es push o pull?
- **Decision needed by:** Week 10
- **Stakeholder:** Tech Lead + Frontend Lead

**Q7: Audit Log Retention**
- ¿7 años es requirement legal o arbitrary?
- ¿Archivar a S3 cold storage tras 2 años para reducir costos DB?
- ¿Particionar por mes o por trimestre?
- **Decision needed by:** Week 11
- **Stakeholder:** Tech Lead + Compliance Officer

**Q8: MFA Enforcement**
- ¿MFA es opt-in o opt-out para planes Pro/Enterprise?
- ¿Grace period de 30 días para adopción si admin fuerza MFA?
- ¿Soportar SMS además de TOTP? (más costoso pero más accesible)
- **Decision needed by:** Week 12
- **Stakeholder:** Product Manager + Security Officer

**Q9: Deployment Strategy**
- ¿AWS vs GCP vs Azure? (propuesta: AWS por experiencia equipo)
- ¿ECS Fargate vs EKS Kubernetes vs EC2 plain? (propuesta: ECS Fargate para simplicidad MVP)
- ¿RDS PostgreSQL vs self-managed en EC2? (propuesta: RDS para managed backups)
- **Decision needed by:** Week 2
- **Stakeholder:** Tech Lead + DevOps Engineer

**Q10: Performance Benchmarks**
- ¿Target latency p95 <200ms es con cache warm o cold?
- ¿Load testing con cuántos concurrent users? (propuesta: 1000)
- ¿Acceptable degradation durante deploy? (propuesta: <1% error rate, <10s)
- **Decision needed by:** Week 8
- **Stakeholder:** Tech Lead + QA Lead

### 9.3 Compliance Questions

**Q11: GDPR Data Export**
- ¿Formato de export es JSON o PDF? ¿Ambos?
- ¿Incluir audit logs del usuario en export?
- ¿Anonimización post-delete es suficiente o hard delete?
- **Decision needed by:** Post-MVP (antes de EU launch)
- **Stakeholder:** Legal + Compliance Officer

**Q12: SOC2 Audit Scope**
- ¿SOC2 Type I o Type II? (Type II requiere 6-12 meses monitoring)
- ¿Contratar auditor desde MVP o tras product-market fit?
- ¿Estimated cost $15k-50k es acceptable?
- **Decision needed by:** Month 6 post-launch
- **Stakeholder:** CEO + Compliance Officer

---

## 10. Success Metrics & KPIs

### 10.1 Business Metrics (Month 1 post-MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Signups** | 500 organizations | Google Analytics + DB |
| **Trial → Paid Conversion** | 15% | (paid / trial_ended) * 100 |
| **MRR (Monthly Recurring Revenue)** | $10,000 | Stripe dashboard |
| **ARPU (Average Revenue Per User)** | $50 | MRR / paid_customers |
| **Churn Rate** | <8% | (churned_this_month / active_start_month) * 100 |
| **CAC (Customer Acquisition Cost)** | <$200 | marketing_spend / new_customers |
| **LTV (Lifetime Value)** | >$600 | ARPU * avg_lifetime_months |
| **LTV:CAC Ratio** | >3:1 | LTV / CAC |

### 10.2 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to First Value** | <10 min | Time from signup to first action logged |
| **Feature Adoption (Custom Roles)** | 30% | Orgs with ≥1 custom role / total orgs |
| **Feature Adoption (MFA)** | 20% | Users with MFA enabled / total users |
| **Invitation Acceptance Rate** | >70% | Accepted invites / sent invites |
| **DAU/MAU Ratio (Stickiness)** | >0.4 | Daily Active Users / Monthly Active Users |
| **Session Duration** | >15 min | Avg session time (Google Analytics) |
| **Pages per Session** | >5 | Avg pages viewed per session |

### 10.3 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Latency p95** | <200ms | New Relic APM |
| **API Latency p99** | <500ms | New Relic APM |
| **Error Rate** | <0.5% | (5xx responses / total requests) * 100 |
| **Uptime** | >99.5% | Pingdom checks |
| **Database Query Time p95** | <100ms | pgBadger / New Relic |
| **Test Coverage** | >80% | Coverage.py / Jest |
| **Build Time** | <5 min | GitHub Actions metrics |
| **Deploy Frequency** | ≥1/day | GitHub releases |
| **MTTR (Mean Time to Repair)** | <1 hour | PagerDuty incident data |

### 10.4 Security Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Critical Security Incidents** | 0 | Manual tracking |
| **Failed Login Attempts** | <2% | (failed / total_attempts) * 100 |
| **MFA Adoption (Enterprise Orgs)** | >80% | Users with MFA / Enterprise users |
| **Audit Log Retention** | 100% (7 years) | DB query oldest record |
| **Vulnerability Scan Pass Rate** | 100% | Snyk dashboard |
| **Penetration Test Findings** | <5 medium, 0 critical | Annual pentest report |

### 10.5 Customer Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| **NPS (Net Promoter Score)** | >30 | In-app survey quarterly |
| **CSAT (Customer Satisfaction)** | >4.0/5.0 | Post-interaction survey |
| **Support Tickets** | <10% of MAU | Zendesk / Intercom |
| **Avg Ticket Resolution Time** | <24 hours | Support system metrics |
| **Feature Request Votes** | Top 5 implemented | Productboard prioritization |

---

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks

**RISK-001: Database Performance Degradation at Scale**
- **Probability:** Medium
- **Impact:** High (slowdowns affect all users)
- **Scenario:** Single PostgreSQL instance hits CPU/memory limits at 5,000+ tenants
- **Mitigation:**
  - Implement read replicas early (Week 8)
  - Aggressive indexing and query optimization
  - Redis cache for hot data (permissions, user profiles)
  - Monitor slow queries with pgBadger, set alerts at 100ms
  - Plan database sharding strategy proactively (decision by Month 3)
- **Contingency:** Vertical scaling to larger RDS instance (16 vCPU → 32 vCPU) buys 3-6 months

**RISK-002: JWT Token Size Explosion**
- **Probability:** Medium
- **Impact:** Medium (large tokens increase bandwidth, hit header size limits)
- **Scenario:** User with 50+ roles and 500+ permissions = JWT >8KB (nginx default header limit)
- **Mitigation:**
  - Don't embed full permission list in JWT, use permission hash/version
  - Backend resolves permissions from cache on each request (key: `user:{id}:tenant:{id}:perms`)
  - Compress JWT claims with zlib if needed
  - Set nginx `large_client_header_buffers 4 16k`
- **Contingency:** Switch to opaque tokens (UUID) with server-side session lookup

**RISK-003: Stripe Webhook Failures**
- **Probability:** Low
- **Impact:** High (missed payments = lost revenue)
- **Scenario:** Webhook endpoint down during deploy, invoice.paid event lost
- **Mitigation:**
  - Idempotent webhook handlers (check if already processed)
  - Stripe retries webhooks for 3 days automatically
  - Backup: daily cronjob syncs Stripe subscriptions to DB
  - Monitor webhook delivery in Stripe dashboard, alert on failures
- **Contingency:** Manual reconciliation script to backfill missed payments

**RISK-004: Multi-Tenant Data Leakage Bug**
- **Probability:** Low (with RLS)
- **Impact:** Critical (breach of trust, legal liability)
- **Scenario:** Developer forgets `filter(tenant=X)` in query, user sees cross-tenant data
- **Mitigation:**
  - **Primary defense:** PostgreSQL RLS enforces isolation at DB level
  - **Secondary defense:** TenantAwareManager filters by default
  - Security tests with tenant A trying to access tenant B data
  - Code review checklist for all multi-tenant queries
  - Periodic security audits by external firm
- **Contingency:** Incident response plan: immediate isolation, user notification, forensic audit

### 11.2 Business Risks

**RISK-005: Low Trial → Paid Conversion (<10%)**
- **Probability:** Medium
- **Impact:** High (missed revenue targets)
- **Scenario:** Users sign up, don't see value, churn at trial end
- **Mitigation:**
  - Onboarding wizard with "aha moments" (invite team, create first role)
  - Email drip campaign during trial (days 1, 3, 7, 12, 13)
  - In-app prompts to explore key features
  - Exit survey for trial cancellations to understand objections
  - A/B test trial length (7 vs 14 days) and credit card requirement
- **Contingency:** Offer extended trial (30 days) for qualified leads

**RISK-006: Stripe Fee Eats Margin on Low-Tier Plans**
- **Probability:** High
- **Impact:** Medium (reduced profitability)
- **Scenario:** $29 Starter plan - $0.87 (3%) Stripe fee = $28.13 gross, minus AWS costs = thin margin
- **Mitigation:**
  - Price plans to absorb Stripe fees ($29 chosen with 3% factored)
  - Incentivize annual billing (lower processing cost per month, upfront cash)
  - Monitor unit economics monthly, adjust pricing in Quarter 2 if needed
  - Negotiate Stripe fee reduction at $100k MRR (possible 2.7%)
- **Contingency:** Increase Starter to $39/mo if margins unsustainable

**RISK-007: High CAC from Paid Ads**
- **Probability:** Medium
- **Impact:** Medium (unsustainable growth if CAC > LTV)
- **Scenario:** Google Ads CPC $5, conversion rate 2% = $250 CAC, but LTV $600 = marginal
- **Mitigation:**
  - Prioritize organic channels: SEO, content marketing, community
  - Referral program (give $20 credit, get $20 credit)
  - Product-led growth: free plan users are evangelists
  - Track CAC by channel, pause underperformers
- **Contingency:** Reduce ad spend, pivot to partnerships/integrations

### 11.3 Operational Risks

**RISK-008: Single Point of Failure (Developer Key Person)**
- **Probability:** Low
- **Impact:** High (project delays if key dev leaves)
- **Scenario:** Tech Lead knows all architecture, leaves abruptly
- **Mitigation:**
  - Comprehensive documentation (ADRs, architecture diagrams, runbooks)
  - Code reviews require 2 reviewers for critical modules
  - Knowledge sharing sessions weekly
  - Hire 2 senior devs instead of 1 principal dev
- **Contingency:** Consulting contract with ex-employee or external expert

**RISK-009: Underestimated Timeline**
- **Probability:** High (most projects overrun)
- **Impact:** Medium (delayed launch = delayed revenue)
- **Scenario:** MVP estimated 12 weeks, actually takes 18 weeks
- **Mitigation:**
  - Buffer 30% on estimates (12 weeks → 15 weeks planned)
  - Weekly sprint reviews, adjust scope if slipping
  - Define MVP ruthlessly (cut "nice-to-haves")
  - Parallel workstreams where possible (backend + frontend simultaneously)
- **Contingency:** Launch Phase 1 subset (auth + basic roles) as "Early Access" to start learning

**RISK-010: Compliance Audit Failure**
- **Probability:** Low
- **Impact:** High (delays sales to enterprise, reputational damage)
- **Scenario:** SOC2 audit finds critical control gaps, fails certification
- **Mitigation:**
  - Engage compliance consultant early (Month 3)
  - Implement controls proactively (audit logs, access controls, incident response)
  - Pre-audit gap assessment 3 months before official audit
  - Treat compliance as feature requirement, not afterthought
- **Contingency:** Remediation plan (typically 3-6 months), re-audit

### 11.4 Security Risks

**RISK-011: DDoS Attack on Public Endpoints**
- **Probability:** Low
- **Impact:** Medium (service downtime, reputation damage)
- **Scenario:** Competitor or attacker floods `/auth/login` with requests
- **Mitigation:**
  - Cloudflare DDoS protection (rate limiting, bot detection)
  - AWS WAF rules (block IPs with >100 req/min to auth endpoints)
  - CAPTCHA on login after 3 failed attempts from same IP
  - Monitoring: alert if 5xx errors >1% or latency >1s
- **Contingency:** Activate Cloudflare "Under Attack Mode", blacklist malicious IPs

**RISK-012: Insider Threat (Employee Access Abuse)**
- **Probability:** Very Low
- **Impact:** Critical (data breach, compliance violation)
- **Scenario:** Rogue employee accesses production DB, exfiltrates customer data
- **Mitigation:**
  - Principle of least privilege (devs don't have prod DB access)
  - Bastion host with MFA + audit for prod access
  - Database access requires approval ticket + logged
  - Background checks for employees with prod access
  - Quarterly access reviews
- **Contingency:** Incident response: revoke access, forensic analysis, customer notification if GDPR/breach

---

## 12. Conclusion & Next Steps

Este PRD define un sistema empresarial completo de gestión de roles, permisos y suscripciones multi-tenant. La implementación en 3 fases (12 semanas MVP, 16 semanas RBAC avanzado, 24 semanas Enterprise) permite validar product-market fit antes de invertir en features enterprise complejas.

### Immediate Next Steps (Week 0)

1. **Stakeholder Review** (2 días):
   - Product Manager revisa sección Business/Metrics
   - Tech Lead revisa sección Technical Approach
   - Legal/Compliance revisa sección Security/Compliance
   - Finance revisa pricing y unit economics

2. **Resolve Open Questions** (3 días):
   - Schedule decision meetings para Q1-Q4 (business)
   - Schedule technical spikes para Q5-Q10
   - Document decisions en ADRs

3. **Team Kickoff** (1 día):
   - Present PRD a equipo completo
   - Assign technical leads para cada módulo (Auth, RBAC, Billing, Frontend)
   - Setup project tracking (Jira/Linear) con epics y stories
   - Configure CI/CD pipelines y environments (dev/staging/prod)

4. **Sprint Planning** (2 días):
   - Break Phase 1 Week 1-2 en stories detalladas
   - Assign story points y velocity target
   - Schedule daily standups y sprint reviews

### Success Criteria for MVP Launch (Week 12)

- ✅ 100+ organizations signed up
- ✅ 15% trial-to-paid conversion
- ✅ $5k MRR achieved
- ✅ API latency p95 <300ms
- ✅ System uptime >99%
- ✅ 0 critical security incidents
- ✅ Test coverage >80%
- ✅ NPS >30

### Post-MVP (Weeks 13+)

- Gather user feedback via interviews (10 customers/week)
- Iterate on onboarding flow (target <5 min to first value)
- Prioritize Phase 2 features based on customer requests
- Begin SOC2 compliance process (hire consultant)
- Scale infrastructure proactively (monitor at 1,000 tenants)

---

**Document Approvals:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | ___________ | ___________ | ___/___/___ |
| Tech Lead | ___________ | ___________ | ___/___/___ |
| Engineering Manager | ___________ | ___________ | ___/___/___ |
| Finance | ___________ | ___________ | ___/___/___ |
| Legal/Compliance | ___________ | ___________ | ___/___/___ |

**Change Log:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-09 | Product Team | Initial draft |
| 2.0.0 | 2026-02-10 | Product Team | **Major Update**: Agregado cuarto pilar "Servicios de Suscripción" con suite de herramientas para clientes finales (Calendario, Tareas, Notificaciones, Archivos, Portafolio). Actualizada arquitectura a sistema dual-frontend (Admin + Cliente) con backend unificado Django. Agregados modelos de datos para servicios. Documentados prototipos React para validación UX. |

---

*This PRD is a living document. Updates should be versioned and communicated to all stakeholders.*
