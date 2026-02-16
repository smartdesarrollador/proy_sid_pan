# RBAC System: Roles & Permissions

[⬅️ Volver al README](../README.md)

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura de Roles](#2-arquitectura-de-roles)
3. [System Roles](#3-system-roles)
4. [Service-Specific Roles](#4-service-specific-roles)
5. [Customer/Billing Roles](#5-customerbilling-roles)
6. [Catálogo de Permisos](#6-catálogo-de-permisos)
7. [Matriz de Permisos por Rol](#7-matriz-de-permisos-por-rol)
8. [Casos de Uso por Rol](#8-casos-de-uso-por-rol)
9. [Reglas de Negocio](#9-reglas-de-negocio)

---

## 1. Introducción

Este documento describe el sistema de control de acceso basado en roles (RBAC) implementado en la plataforma. El sistema está diseñado para proporcionar control granular de permisos a través de una arquitectura de roles especializada por servicios web.

### 1.1 Características Principales

- **10 roles predefinidos** organizados en 3 categorías funcionales
- **62 permisos granulares** organizados en 13 categorías de recursos
- **Herencia de roles** para composición y reutilización de permisos
- **Roles especializados** por área funcional (Marketing, Engineering, Operations, Finance)
- **Separación de responsabilidades** entre Customer Success y Billing

### 1.2 Objetivos del Sistema RBAC

1. **Seguridad**: Implementar principio de least privilege
2. **Escalabilidad**: Soportar múltiples servicios web sin cambios arquitectónicos
3. **Flexibilidad**: Permitir roles especializados sin complejidad excesiva
4. **Auditoría**: Registrar todas las operaciones relacionadas con permisos
5. **Usabilidad**: Roles intuitivos que mapean a roles reales de negocio

---

## 2. Arquitectura de Roles

El sistema implementa una arquitectura de roles de 3 niveles, cada uno con un propósito específico:

```
┌─────────────────────────────────────────────────────────────┐
│                     ORGANIZATIONAL ROLES                     │
│                      (Tenant-Wide Access)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         SYSTEM ROLES (4 roles)                       │   │
│  │  • Owner          (~60 permisos)                    │   │
│  │  • Service Manager (~40 permisos)                   │   │
│  │  • Member         (~20 permisos)                    │   │
│  │  • Viewer         (~8 permisos)                     │   │
│  │  Características: No editables, tenant-wide        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      SERVICE-SPECIFIC ROLES (4 roles)               │   │
│  │  • Landing Manager    (~25 permisos)               │   │
│  │  • Portfolio Admin    (~22 permisos)               │   │
│  │  • Task Coordinator   (~18 permisos)               │   │
│  │  • Content Editor     (~15 permisos)               │   │
│  │  Características: Editables, heredan de Member     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      CUSTOMER/BILLING ROLES (2 roles)               │   │
│  │  • Customer Success Manager (~18 permisos)         │   │
│  │  • Billing Manager          (~14 permisos)         │   │
│  │  Características: Editables, sin parent role       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Tabla Resumen de Roles

| ID | Rol | Categoría | Color | Permisos | Editable | Parent | Usuarios |
|----|-----|-----------|-------|----------|----------|--------|----------|
| role-001 | Owner | System | `#dc2626` | ~60 | ❌ | null | 1 |
| role-002 | Service Manager | System | `#ea580c` | ~40 | ❌ | null | 3 |
| role-003 | Member | System | `#3b82f6` | ~20 | ❌ | null | 15 |
| role-004 | Viewer | System | `#6b7280` | ~8 | ❌ | null | 4 |
| role-005 | Landing Manager | Service | `#8b5cf6` | ~25 | ✅ | Member | 0 |
| role-006 | Portfolio Admin | Service | `#10b981` | ~22 | ✅ | Member | 0 |
| role-007 | Task Coordinator | Service | `#f59e0b` | ~18 | ✅ | Member | 0 |
| role-008 | Content Editor | Service | `#ec4899` | ~15 | ✅ | Member | 8 |
| role-009 | Customer Success Manager | Customer | `#06b6d4` | ~18 | ✅ | null | 0 |
| role-010 | Billing Manager | Customer | `#0ea5e9` | ~14 | ✅ | null | 0 |

**Total: 10 roles, 31 usuarios asignados**

### 2.2 Características por Categoría

#### System Roles
- **Propósito**: Control del tenant y acceso general a servicios
- **Scope**: Tenant-wide (todos los servicios)
- **Editable**: No (`isSystemRole: true`)
- **Casos de uso**: Propietarios, administradores, usuarios estándar, stakeholders

#### Service-Specific Roles
- **Propósito**: Especialización por área funcional
- **Scope**: Servicios específicos (Landing, Projects, Tasks, Calendar)
- **Editable**: Sí (`isSystemRole: false`)
- **Parent**: Member (heredan permisos base)
- **Casos de uso**: Marketing team, Engineering team, Content team, Operations

#### Customer/Billing Roles
- **Propósito**: Gestión de clientes y facturación en plataforma multi-tenant
- **Scope**: Módulos Customer y Billing
- **Editable**: Sí (`isSystemRole: false`)
- **Parent**: null (roles independientes)
- **Casos de uso**: Customer Success, Finance, Revenue Operations

---

## 3. System Roles

### 3.1 Owner

**ID**: `role-001`
**Color**: `#dc2626` (rojo)
**Permisos**: ~60
**isSystemRole**: `true`

#### Descripción
Control total del tenant con acceso administrativo completo a todos los servicios, usuarios, roles, billing y configuración.

#### Características
- **Delegable**: No (máximo 2-3 owners por tenant recomendado)
- **Acceso**: Wildcard (`*`) para la mayoría de recursos
- **Responsabilidad**: Configuración del tenant, gestión de billing, asignación de roles críticos
- **Restricciones**: No puede ser eliminado si es el último owner del tenant

#### Permisos Clave
- ✅ Todos los permisos de usuarios, roles, billing, settings, audit
- ✅ Gestión completa de customers y subscriptions
- ✅ Crear/editar/eliminar cualquier recurso
- ✅ Ver y exportar audit logs
- ✅ Configurar custom domains (Enterprise)

#### Use Cases
- CEO/Founder de la organización
- CTO con responsabilidad técnica completa
- CFO con control de facturación

---

### 3.2 Service Manager

**ID**: `role-002`
**Color**: `#ea580c` (naranja)
**Permisos**: ~40
**isSystemRole**: `true`

#### Descripción
Gestiona equipo y supervisa operaciones de todos los servicios web sin acceso completo a billing.

#### Características
- **Delegable**: Sí (puede haber múltiples Service Managers)
- **Acceso**: Gestión de servicios + visibilidad de customers
- **Responsabilidad**: Supervisión operativa, asignación de tareas, gestión de contenido
- **Restricciones**: No puede cancelar suscripciones ni gestionar métodos de pago

#### Permisos Clave
- ✅ Usuarios: read, update, invite (sin create/delete)
- ✅ Roles: read, assign (sin create/update/delete)
- ✅ Tasks, Calendar, Landing, Projects: acceso completo
- ✅ Customers: read, analytics (sin create/update/delete)
- ❌ Billing: sin acceso (solo read limitado)
- ❌ Settings: read-only

#### Use Cases
- VP of Operations
- Engineering Manager (sin responsabilidad financiera)
- Product Manager con supervisión de servicios

---

### 3.3 Member

**ID**: `role-003`
**Color**: `#3b82f6` (azul)
**Permisos**: ~20
**isSystemRole**: `true`

#### Descripción
Usuario estándar con acceso básico a servicios principales. Puede crear y editar contenido propio.

#### Características
- **Delegable**: Sí (rol por defecto para nuevos usuarios)
- **Acceso**: CRUD en tasks, calendar, projects (scope: own)
- **Responsabilidad**: Trabajo individual, colaboración en equipo
- **Restricciones**: No puede gestionar usuarios ni roles

#### Permisos Clave
- ✅ Tasks: create, read, update, delete (propias)
- ✅ Calendar: create, read, update, delete (propios)
- ✅ Projects: create, read, update (propios)
- ✅ Dashboard: read
- ❌ Users, Roles, Billing, Settings, Customers: sin acceso
- ❌ Landing: read-only
- ❌ Credentials reveal: no

#### Use Cases
- Desarrolladores junior/mid
- Diseñadores sin rol de publicación
- Team members sin responsabilidades administrativas

---

### 3.4 Viewer

**ID**: `role-004`
**Color**: `#6b7280` (gris)
**Permisos**: ~8
**isSystemRole**: `true`

#### Descripción
Acceso de solo lectura a dashboards y contenido compartido. Ideal para stakeholders externos.

#### Características
- **Delegable**: Sí
- **Acceso**: Read-only en servicios principales
- **Responsabilidad**: Observar progreso, revisar dashboards
- **Restricciones**: No puede editar, crear ni eliminar nada

#### Permisos Clave
- ✅ Dashboard: read
- ✅ Tasks: read
- ✅ Calendar: read
- ✅ Projects: read
- ✅ Landing: read
- ❌ Todos los demás permisos: sin acceso

#### Use Cases
- Stakeholders externos (clientes, consultores)
- Board members con visibilidad de progreso
- Auditores externos

---

## 4. Service-Specific Roles

### 4.1 Landing Manager

**ID**: `role-005`
**Color**: `#8b5cf6` (púrpura)
**Permisos**: ~25
**isSystemRole**: `false`
**Parent**: `Member`

#### Descripción
Control total de landing pages, branding y formularios de contacto.

#### Características
- **Delegable**: Sí
- **Hereda**: Permisos de Member (~20) + específicos de landing (~5)
- **Especialización**: Marketing, Growth
- **Responsabilidad**: Campañas de marketing, branding, captura de leads

#### Permisos Específicos (adicionales a Member)
- ✅ `landing.create` - Crear landing pages
- ✅ `landing.edit` - Editar contenido/secciones
- ✅ `landing.publish` - Publicar cambios en vivo
- ✅ `branding.update` - Modificar branding (colores, logos)
- ✅ `forms.manage` - Configurar formularios de contacto
- ✅ `digital_services.landing` - Gestionar landing pública
- ✅ `public_profiles.analytics` - Ver analytics de perfiles públicos

#### Restricciones
- ❌ No puede gestionar projects ni credentials
- ❌ No puede ver billing ni customers

#### Use Cases
- Marketing Manager lanzando campaña de Black Friday
- Growth Lead optimizando conversión de landing pages
- Brand Manager actualizando identidad visual

#### Ejemplo de Flujo
Ver [Caso de Uso 1](#81-landing-manager---lanzamiento-de-campaña) para flujo completo.

---

### 4.2 Portfolio Admin

**ID**: `role-006`
**Color**: `#10b981` (verde)
**Permisos**: ~22
**isSystemRole**: `false`
**Parent**: `Member`

#### Descripción
Gestión completa de proyectos, credenciales y portfolios públicos.

#### Características
- **Delegable**: Sí
- **Hereda**: Permisos de Member (~20) + específicos de projects (~2)
- **Especialización**: Engineering, Project Management
- **Responsabilidad**: Gestión de proyectos cliente, credenciales seguras, portfolios

#### Permisos Específicos (adicionales a Member)
- ✅ `projects.*` - CRUD completo en proyectos
- ✅ `projects.sections` - Gestionar secciones/tags
- ✅ `credentials.manage` - Crear/editar credenciales
- ✅ `credentials.reveal` - Ver contraseñas encriptadas
- ✅ `portfolio.publish` - Publicar items de portfolio
- ✅ `digital_services.portfolio` - Gestionar portfolio público
- ✅ `digital_services.cv` - Gestionar CV digital

#### Restricciones
- ❌ No puede publicar landing pages (solo read)
- ❌ No puede gestionar billing

#### Use Cases
- Engineering Manager gestionando credenciales de producción
- Project Manager organizando portfolios de clientes
- Lead Developer configurando accesos a infraestructura

#### Ejemplo de Flujo
Ver [Caso de Uso 4](#84-portfolio-admin---setup-de-cliente-de-agencia) para flujo completo.

---

### 4.3 Task Coordinator

**ID**: `role-007`
**Color**: `#f59e0b` (ámbar)
**Permisos**: ~18
**isSystemRole**: `false`
**Parent**: `Member`

#### Descripción
Gestión de tareas, tableros Kanban y calendario del equipo.

#### Características
- **Delegable**: Sí
- **Hereda**: Permisos de Member (~20) - algunos permisos propios
- **Especialización**: Operations, Team Lead
- **Responsabilidad**: Coordinación de equipo, gestión de sprints, calendario compartido

#### Permisos Específicos (adicionales a Member)
- ✅ `tasks.*` - CRUD completo en tareas (todas, no solo propias)
- ✅ `tasks.assign` - Asignar tareas a otros usuarios
- ✅ `boards.admin` - Gestionar tableros Kanban
- ✅ `boards.reorder` - Reordenar tareas/columnas
- ✅ `calendar.*` - CRUD completo en calendario
- ✅ `calendar.share` - Compartir calendario/eventos
- ✅ `calendar.sync` - Sincronizar con Google/Outlook

#### Restricciones
- ❌ Permisos elevados solo en tasks/calendar (no en projects ni landing)
- ❌ No puede gestionar credenciales

#### Use Cases
- Scrum Master gestionando sprints
- Team Lead coordinando calendario del equipo
- Operations Manager con visibilidad completa de tareas

---

### 4.4 Content Editor

**ID**: `role-008`
**Color**: `#ec4899` (rosa)
**Permisos**: ~15
**isSystemRole**: `false`
**Parent**: `Member`

#### Descripción
Edición de contenido y páginas (requiere aprobación de Landing Manager para publicar).

#### Características
- **Delegable**: Sí
- **Hereda**: Permisos de Member (~20) - algunos permisos
- **Especialización**: Content Writing, Design
- **Responsabilidad**: Redacción de contenido, edición de landing pages
- **Workflow**: Edit → Review → Publish (publish requiere Landing Manager)

#### Permisos Específicos
- ✅ `landing.read` - Ver landing pages
- ✅ `landing.edit` - Editar contenido/secciones
- ❌ `landing.publish` - NO puede publicar (requiere aprobación)
- ✅ `digital_services.landing` - Gestionar landing pública (sin publish)
- ✅ `digital_services.cv` - Gestionar CV digital

#### Restricciones
- ❌ No puede publicar cambios en vivo (requiere Landing Manager)
- ❌ No puede cambiar branding ni configurar formularios
- ❌ Sin acceso a projects, credentials, billing

#### Use Cases
- Content Writer redactando copy para landing
- Designer ajustando layout y tipografía
- Copywriter sin permisos de publicación

#### Workflow de Aprobación
```
Content Editor (edit) → Landing Manager (review) → Landing Manager (publish)
```

---

## 5. Customer/Billing Roles

### 5.1 Customer Success Manager

**ID**: `role-009`
**Color**: `#06b6d4` (cyan)
**Permisos**: ~18
**isSystemRole**: `false`
**Parent**: `null`

#### Descripción
Gestión de relación con clientes, onboarding, soporte y retención. Puede gestionar clientes y aplicar promociones, pero no cancelar suscripciones.

#### Características
- **Delegable**: Sí
- **Especialización**: Customer Success, Account Management
- **Responsabilidad**: Onboarding, health score, churn prevention, promociones
- **Separación de responsabilidades**: Gestiona clientes sin control financiero completo

#### Permisos Clave

**Customers** (6 permisos):
- ✅ `customers.read` - Ver clientes
- ✅ `customers.create` - Crear clientes
- ✅ `customers.update` - Editar clientes
- ✅ `customers.suspend` - Suspender clientes
- ✅ `customers.analytics` - Ver analytics (MRR, health score, churn)
- ✅ `customers.export` - Exportar datos

**Subscriptions** (1 permiso):
- ✅ `subscriptions.manage` - Upgrades/downgrades
- ❌ `subscriptions.cancel` - NO puede cancelar (requiere Billing Manager o Owner)

**Billing** (1 permiso):
- ✅ `billing.read` - Ver información de facturación (read-only)
- ❌ `billing.manage` - NO puede gestionar métodos de pago

**Promotions**:
- ✅ `promotions.manage` - Crear/editar códigos promocionales

**Analytics**:
- ✅ `analytics.read` - Ver dashboards
- ✅ `analytics.export` - Exportar reportes

#### Restricciones Críticas
- ❌ **NO puede cancelar suscripciones** (requiere aprobación de Billing Manager o Owner)
- ❌ **NO puede gestionar métodos de pago** (solo ver)
- ❌ **NO puede eliminar clientes** (solo suspender)
- ❌ **Sin acceso a servicios web** (tasks, projects, landing)

#### Use Cases
- CS Manager gestionando onboarding de cliente Enterprise
- Account Manager aplicando promoción ONBOARD20
- Success Lead monitoreando health score y previniendo churn

#### Ejemplo de Flujo
Ver [Caso de Uso 2](#82-customer-success-manager---onboarding-de-cliente-enterprise) para flujo completo.

---

### 5.2 Billing Manager

**ID**: `role-010`
**Color**: `#0ea5e9` (sky blue)
**Permisos**: ~14
**isSystemRole**: `false`
**Parent**: `null`

#### Descripción
Gestión de facturación, planes, promociones y pagos. Puede gestionar billing completo pero no editar información de clientes.

#### Características
- **Delegable**: Sí
- **Especialización**: Finance, Revenue Operations
- **Responsabilidad**: Facturación, cobros, reportes financieros (MRR, ARPC, churn)
- **Separación de responsabilidades**: Gestiona dinero sin editar datos de clientes

#### Permisos Clave

**Customers** (3 permisos):
- ✅ `customers.read` - Ver clientes (read-only)
- ✅ `customers.analytics` - Ver analytics financieros
- ✅ `customers.export` - Exportar datos
- ❌ `customers.update` - NO puede editar información de clientes

**Subscriptions** (2 permisos):
- ✅ `subscriptions.manage` - Upgrades/downgrades
- ✅ `subscriptions.cancel` - Cancelar suscripciones

**Billing** (3 permisos):
- ✅ `billing.read` - Ver facturación
- ✅ `billing.manage` - Gestionar métodos de pago
- ✅ `billing.upgrade` - Cambiar planes

**Promotions**:
- ✅ `promotions.manage` - Crear/editar códigos promocionales

**Analytics**:
- ✅ `analytics.read` - Ver dashboards
- ✅ `analytics.export` - Exportar reportes financieros

#### Restricciones Críticas
- ❌ **NO puede editar información de clientes** (nombre, email, contacto)
- ❌ **NO puede suspender clientes** (solo cancelar suscripción)
- ❌ **Sin acceso a servicios web** (tasks, projects, landing)

#### Use Cases
- Finance Manager gestionando cobros fallidos
- Revenue Ops ejecutando downgrades por churn
- CFO generando reportes de MRR y ARPC

#### Ejemplo de Flujo
Ver [Caso de Uso 3](#83-billing-manager---gestión-de-churn) para flujo completo.

---

### 5.3 Comparación: Customer Success vs Billing Manager

| Aspecto | Customer Success Manager | Billing Manager |
|---------|-------------------------|-----------------|
| **Foco** | Relación con cliente, retención | Facturación, pagos, finanzas |
| **Crear clientes** | ✅ Sí | ❌ No |
| **Editar clientes** | ✅ Sí | ❌ No (solo ver) |
| **Suspender clientes** | ✅ Sí | ❌ No |
| **Ver billing** | ✅ Read-only | ✅ Full access |
| **Gestionar métodos de pago** | ❌ No | ✅ Sí |
| **Upgrades/Downgrades** | ✅ Sí | ✅ Sí |
| **Cancelar suscripciones** | ❌ No | ✅ Sí |
| **Promociones** | ✅ Sí | ✅ Sí |
| **Analytics** | ✅ Sí (customer health) | ✅ Sí (financial) |

**Principio de diseño**: Separar responsabilidades de relación (CS) y finanzas (Billing) para mayor seguridad y compliance.

---

## 6. Catálogo de Permisos

### 6.1 Resumen por Categoría

| Categoría | Permisos | Recursos |
|-----------|----------|----------|
| Users & Authentication | 5 | `users` |
| Roles & Permissions | 5 | `roles` |
| Tasks Service | 7 | `tasks`, `boards` |
| Calendar Service | 6 | `calendar` |
| Landing Pages | 6 | `landing`, `branding`, `forms` |
| Portfolio & Projects | 8 | `projects`, `credentials`, `portfolio` |
| Digital Services | 5 | `digital_services`, `public_profiles` |
| Billing & Subscriptions | 4 | `billing`, `promotions` |
| Customers | 9 | `customers`, `subscriptions` |
| Analytics | 2 | `analytics` |
| Settings | 2 | `settings` |
| Audit | 2 | `audit` |
| Dashboard | 1 | `dashboard` |
| **TOTAL** | **62** | **20 recursos únicos** |

### 6.2 Permisos Detallados

#### 6.2.1 Users & Authentication (5 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-001 | `users.create` | Crear Usuarios | users | create |
| perm-002 | `users.read` | Ver Usuarios | users | read |
| perm-003 | `users.update` | Editar Usuarios | users | update |
| perm-004 | `users.delete` | Eliminar Usuarios | users | delete |
| perm-005 | `users.invite` | Invitar Usuarios | users | invite |

---

#### 6.2.2 Roles & Permissions (5 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-006 | `roles.create` | Crear Roles | roles | create |
| perm-007 | `roles.read` | Ver Roles | roles | read |
| perm-008 | `roles.update` | Editar Roles | roles | update |
| perm-009 | `roles.delete` | Eliminar Roles | roles | delete |
| perm-010 | `roles.assign` | Asignar Roles | roles | assign |

---

#### 6.2.3 Tasks Service (7 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-011 | `tasks.create` | Crear Tareas | tasks | create |
| perm-012 | `tasks.read` | Ver Tareas | tasks | read |
| perm-013 | `tasks.update` | Editar Tareas | tasks | update |
| perm-014 | `tasks.delete` | Eliminar Tareas | tasks | delete |
| perm-015 | `tasks.assign` | Asignar Tareas | tasks | assign |
| perm-016 | `boards.admin` | Gestionar Tableros Kanban | boards | admin |
| perm-017 | `boards.reorder` | Reordenar Tareas/Columnas | boards | reorder |

---

#### 6.2.4 Calendar Service (6 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-018 | `calendar.create` | Crear Eventos | calendar | create |
| perm-019 | `calendar.read` | Ver Calendario | calendar | read |
| perm-020 | `calendar.update` | Editar Eventos | calendar | update |
| perm-021 | `calendar.delete` | Eliminar Eventos | calendar | delete |
| perm-022 | `calendar.share` | Compartir Calendario/Eventos | calendar | share |
| perm-023 | `calendar.sync` | Sincronizar con Google/Outlook | calendar | sync |

---

#### 6.2.5 Landing Pages (6 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-024 | `landing.create` | Crear Landing Pages | landing | create |
| perm-025 | `landing.read` | Ver Landing Pages | landing | read |
| perm-026 | `landing.edit` | Editar Contenido/Secciones | landing | edit |
| perm-027 | `landing.publish` | Publicar Cambios en Vivo | landing | publish |
| perm-028 | `branding.update` | Modificar Branding (Colores, Logos) | branding | update |
| perm-029 | `forms.manage` | Configurar Formularios de Contacto | forms | manage |

---

#### 6.2.6 Portfolio & Projects (8 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-030 | `projects.create` | Crear Proyectos | projects | create |
| perm-031 | `projects.read` | Ver Proyectos | projects | read |
| perm-032 | `projects.update` | Editar Proyectos | projects | update |
| perm-033 | `projects.delete` | Eliminar Proyectos | projects | delete |
| perm-034 | `projects.sections` | Gestionar Secciones/Tags | projects | sections |
| perm-035 | `credentials.manage` | Crear/Editar Credenciales | credentials | manage |
| perm-036 | `credentials.reveal` | Ver Contraseñas Encriptadas | credentials | reveal |
| perm-037 | `portfolio.publish` | Publicar Items de Portfolio | portfolio | publish |

---

#### 6.2.7 Digital Services (5 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-038 | `digital_services.tarjeta` | Gestionar Tarjeta Digital | digital_services | tarjeta |
| perm-039 | `digital_services.landing` | Gestionar Landing Pública | digital_services | landing |
| perm-040 | `digital_services.cv` | Gestionar CV Digital | digital_services | cv |
| perm-041 | `digital_services.portfolio` | Gestionar Portfolio Público | digital_services | portfolio |
| perm-042 | `public_profiles.analytics` | Ver Analytics de Perfil Público | public_profiles | analytics |

---

#### 6.2.8 Billing & Subscriptions (4 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-043 | `billing.read` | Ver Facturación | billing | read |
| perm-044 | `billing.manage` | Actualizar Métodos de Pago | billing | manage |
| perm-045 | `billing.upgrade` | Cambiar Plan de Suscripción | billing | upgrade |
| perm-046 | `promotions.manage` | Crear/Editar Códigos Promocionales | promotions | manage |

---

#### 6.2.9 Customers (9 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-054 | `customers.read` | Ver Clientes | customers | read |
| perm-055 | `customers.create` | Crear Clientes | customers | create |
| perm-056 | `customers.update` | Editar Clientes | customers | update |
| perm-057 | `customers.delete` | Eliminar Clientes | customers | delete |
| perm-058 | `customers.suspend` | Suspender Clientes | customers | suspend |
| perm-059 | `customers.analytics` | Ver Analytics de Clientes | customers | analytics |
| perm-060 | `customers.export` | Exportar Datos de Clientes | customers | export |
| perm-061 | `subscriptions.manage` | Gestionar Suscripciones | subscriptions | manage |
| perm-062 | `subscriptions.cancel` | Cancelar Suscripciones | subscriptions | cancel |

---

#### 6.2.10 Analytics (2 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-047 | `analytics.read` | Ver Dashboards de Analytics | analytics | read |
| perm-048 | `analytics.export` | Exportar Datos de Analytics | analytics | export |

---

#### 6.2.11 Settings (2 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-049 | `settings.read` | Ver Configuración | settings | read |
| perm-050 | `settings.update` | Modificar Configuración | settings | update |

---

#### 6.2.12 Audit (2 permisos)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-051 | `audit.read` | Ver Logs de Auditoría | audit | read |
| perm-052 | `audit.export` | Exportar Trails de Auditoría | audit | export |

---

#### 6.2.13 Dashboard (1 permiso)

| ID | Codename | Nombre | Recurso | Acción |
|----|----------|--------|---------|--------|
| perm-053 | `dashboard.read` | Ver Dashboard | dashboard | read |

---

## 7. Matriz de Permisos por Rol

### 7.1 Tabla Resumen (Acceso por Categoría)

| Rol | Users | Roles | Tasks | Calendar | Landing | Projects | Customers | Subscriptions | Billing | Total |
|-----|-------|-------|-------|----------|---------|----------|-----------|---------------|---------|-------|
| **Owner** | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All | ✓ All | ~60 |
| **Service Manager** | 🔵 RUI | 🔵 RA | ✓ All | ✓ All | 🔵 RE | 🔵 RU | 🔵 RA | ❌ | ❌ | ~40 |
| **Member** | ❌ | ❌ | 🔵 CRUD | 🔵 CRUD | 🔵 R | 🔵 CRUD | ❌ | ❌ | ❌ | ~20 |
| **Viewer** | ❌ | ❌ | 🔵 R | 🔵 R | 🔵 R | 🔵 R | ❌ | ❌ | ❌ | ~8 |
| **Landing Manager** | ❌ | ❌ | 🔵 R | 🔵 R | ✓ All | 🔵 R | ❌ | ❌ | ❌ | ~25 |
| **Portfolio Admin** | ❌ | ❌ | 🔵 CRUD | 🔵 CRUD | ❌ | ✓ All | ❌ | ❌ | ❌ | ~22 |
| **Task Coordinator** | ❌ | ❌ | ✓ All | ✓ All | 🔵 R | 🔵 RU | ❌ | ❌ | ❌ | ~18 |
| **Content Editor** | ❌ | ❌ | 🔵 R | 🔵 R | 🔵 RE | 🔵 R | ❌ | ❌ | ❌ | ~15 |
| **Customer Success Mgr** | 🔵 R | ❌ | ❌ | ❌ | ❌ | ❌ | ✓ CRUD+S | 🔵 M | 🔵 R | ~18 |
| **Billing Manager** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔵 RA | ✓ All | ✓ All | ~14 |

**Leyenda:**
- ✓ All = Acceso completo (CRUD + acciones especiales)
- 🔵 = Acceso parcial:
  - R = Read
  - C = Create
  - U = Update
  - D = Delete
  - I = Invite
  - A = Assign/Analytics
  - E = Edit
  - M = Manage
  - S = Suspend
- ❌ = Sin acceso

---

### 7.2 Matriz Detallada (Roles × Permisos)

Por razones de espacio, esta matriz se proporciona en formato resumido. Para la matriz completa de 10 × 62, consultar el archivo de implementación:

**Archivo**: `/docs/ui-ux/prototype-admin/src/data/mockData.js`
**Sección**: `rolePermissions` (líneas 936-1056)

---

## 8. Casos de Uso por Rol

### 8.1 Landing Manager - Lanzamiento de Campaña

**Escenario**: Marketing team necesita lanzar landing page para Black Friday con formulario de captura de leads.

#### Flujo de Trabajo

1. **Crear Landing Page**
   - Landing Manager accede a sección "Landing Pages"
   - Clic en "Nueva Landing" → selecciona template "Promo Event"
   - Configura: nombre "Black Friday 2026", slug `/black-friday`

2. **Asignar Content Editor**
   - Abre modal "Colaboradores"
   - Busca usuario "Ana García" (Content Editor)
   - Asigna con rol "Editor" (puede editar, no publicar)

3. **Content Editor redacta copy**
   - Ana edita sección Hero: título, subtítulo, CTA button
   - Edita sección Benefits: 3 beneficios con íconos
   - Guarda cambios como draft (no publica)

4. **Landing Manager revisa y ajusta branding**
   - Revisa cambios de Ana en preview
   - Actualiza branding: primary color `#dc2626`, logo navideño
   - Ajusta tipografía: heading font "Montserrat Bold"

5. **Configurar formulario de captura**
   - Agrega sección "Lead Form"
   - Configura campos: email (required), nombre (required), empresa (optional)
   - Configura webhook: `POST https://crm.acme.com/api/leads`
   - Activa notificación por email al equipo

6. **Publicar landing page**
   - Valida permisos: `landing.publish` ✅
   - Clic en "Publicar" → confirma
   - Sistema genera URL: `https://acme.com/black-friday`
   - Envía notificación a equipo: "Landing publicada"

7. **Monitorear analytics**
   - Accede a dashboard de analytics
   - Visualiza métricas: 1,245 views, 87 form submissions, 7% conversion rate
   - Filtra por fuente: Facebook Ads (45%), Google Ads (30%), Organic (25%)

#### Permisos Utilizados
- ✅ `landing.create` - Crear landing page
- ✅ `landing.edit` - Editar contenido
- ✅ `landing.publish` - Publicar cambios
- ✅ `branding.update` - Actualizar colores y logo
- ✅ `forms.manage` - Configurar formulario
- ✅ `digital_services.landing` - Gestionar landing pública
- ✅ `public_profiles.analytics` - Ver analytics de conversión

#### Resultado
Landing page publicada en <2 horas, capturando 87 leads en primer día con conversión del 7%.

---

### 8.2 Customer Success Manager - Onboarding de Cliente Enterprise

**Escenario**: Cliente firma contrato Enterprise, CS Manager debe crear tenant y configurar cuenta.

#### Flujo de Trabajo

1. **Crear nuevo cliente**
   - Accede a "Customers" → "Nuevo Cliente"
   - Completa formulario:
     - Nombre empresa: "Acme Corp"
     - Dominio: `acme`
     - Email admin: `admin@acme.com`
     - Plan inicial: Professional (hasta Enterprise setup completo)

2. **Aplicar código promocional**
   - Campo "Promoción": ingresa `ONBOARD20`
   - Sistema valida: código activo, 20% descuento primer mes
   - Precio: $99 → $79.20 (ahorro $19.80)

3. **Configurar tenant**
   - Sistema crea tenant automáticamente
   - Asigna subdomain: `acme.plataforma.com`
   - Configura datos iniciales: roles predefinidos, límites de plan

4. **Enviar invitación a admin del cliente**
   - Sistema genera token de invitación (expira 7 días)
   - Envía email a `admin@acme.com` con link de setup
   - Email incluye: bienvenida, pasos de configuración, contacto de soporte

5. **Monitorear health score (2 semanas después)**
   - Accede a dashboard de cliente "Acme Corp"
   - Visualiza métricas:
     - Usage: 28% (10/36 usuarios activos)
     - Storage: 1.2GB/50GB
     - Login frequency: 2.1 días promedio
     - Support tickets: 3 (2 resueltos, 1 pendiente)
   - Health score: 68/100 ⚠️ (threshold de alerta: 70)

6. **Outreach proactivo**
   - Usage < 30% → potencial churn risk
   - Envía email: "¿Cómo va tu onboarding? ¿Necesitas ayuda?"
   - Agenda llamada de follow-up para identificar blockers
   - Ofrece sesión de training personalizada

#### Permisos Utilizados
- ✅ `customers.create` - Crear cliente
- ✅ `customers.update` - Configurar tenant
- ✅ `customers.analytics` - Ver health score y métricas
- ✅ `subscriptions.manage` - Asignar plan Professional
- ✅ `promotions.manage` - Aplicar código ONBOARD20
- ✅ `users.read` - Ver usuarios del cliente (para monitorear adoption)

#### Restricciones
- ❌ No puede cancelar suscripción (solo Billing Manager o Owner)
- ❌ No puede eliminar cliente (solo Owner)

#### Resultado
Cliente onboarded exitosamente, health score monitoreado, outreach proactivo evita churn.

---

### 8.3 Billing Manager - Gestión de Churn

**Escenario**: Cliente "Design Studio Pro" está en estado `past_due` (pago fallido), riesgo de churn.

#### Flujo de Trabajo

1. **Detectar alerta de pago fallido**
   - Sistema envía notificación: "Pago fallido para Design Studio Pro"
   - Accede a dashboard de billing
   - Filtra clientes: estado "Past Due"

2. **Analizar detalles financieros**
   - Cliente: "Design Studio Pro"
   - Plan: Professional ($99/mes)
   - MRR: $99
   - Intentos de cobro: 2 (fallidos)
   - Método de pago: Visa ****1234 (expirada 01/2026)
   - Días en past due: 5/7 (después de 7 días → suspended)

3. **Contactar cliente**
   - Envía email: "Tu método de pago necesita actualización"
   - Llamada telefónica: "Hola, detectamos un problema con tu tarjeta"
   - Cliente explica: "Tuvimos problemas financieros, necesitamos downgrade temporal"

4. **Ejecutar downgrade: Professional → Starter**
   - Accede a suscripción del cliente
   - Selecciona "Cambiar Plan" → Starter ($29/mes)
   - Sistema calcula proration:
     - Días restantes: 20/30
     - Crédito Professional: $99 × (20/30) = $66
     - Cargo Starter: $29 × (20/30) = $19.33
     - **Crédito neto: $46.67** (aplicado a siguiente invoice)

5. **Ajustar límites automáticamente**
   - Sistema aplica límites de Starter:
     - Usuarios: 50 → 10 (notifica cliente si excede)
     - Storage: 50GB → 5GB (notifica si excede)
     - API calls: 10K/mes → 1K/mes
   - Cliente mantiene acceso a datos (no pierde información)

6. **Generar nueva factura**
   - Factura prorrateada:
     - Subtotal: $29
     - Crédito aplicado: -$46.67
     - **Total: $0.00** (cubierto por crédito)
   - Próxima factura (full cycle): $29

7. **Monitorear MRR y churn rate**
   - Dashboard de analytics:
     - MRR anterior: $12,450
     - MRR actual: $12,380 (-$70 por downgrade)
     - Churn rate: 2.3% → 2.5%
   - Registra razón de downgrade: "Financial constraints"

#### Permisos Utilizados
- ✅ `customers.read` - Ver detalles del cliente
- ✅ `customers.analytics` - Ver MRR, churn rate
- ✅ `subscriptions.manage` - Ejecutar downgrade
- ✅ `billing.manage` - Ver método de pago y generar factura
- ✅ `analytics.read` - Dashboard de métricas financieras

#### Restricciones
- ❌ No puede editar información del cliente (nombre, email) - solo Owner/CS Manager
- ❌ No puede suspender cliente - solo Owner/CS Manager

#### Resultado
Cliente mantiene servicio con plan más económico, churn evitado, relación preservada.

---

### 8.4 Portfolio Admin - Setup de Cliente de Agencia

**Escenario**: Agencia de diseño necesita gestionar portfolios de múltiples proyectos con credenciales seguras.

#### Flujo de Trabajo

1. **Crear proyecto para cliente**
   - Accede a "Projects" → "Nuevo Proyecto"
   - Nombre: "Rediseño Web - Acme Corp"
   - Descripción: "Rediseño completo de website corporativo"
   - Color: `#10b981` (verde)

2. **Crear secciones organizadas**
   - Sección 1: "Login" (color: azul)
   - Sección 2: "APIs" (color: púrpura)
   - Sección 3: "Hosting" (color: naranja)

3. **Agregar credenciales de WordPress**
   - Sección "Login" → Nuevo Item
   - Tipo: "Credencial"
   - Título: "WordPress Admin"
   - Campos:
     - Username: `admin@acme.com`
     - Password: `Ac3m#2026$ecur3!` (encrypted)
     - URL: `https://acme.com/wp-admin`
     - Notes: "Usuario principal, no compartir"

4. **Agregar credenciales de AWS**
   - Sección "APIs" → Nuevo Item
   - Tipo: "Credencial"
   - Título: "AWS Access Key"
   - Campos:
     - Access Key ID: `AKIAIOSFODNN7EXAMPLE` (encrypted)
     - Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (encrypted)
     - Region: `us-east-1`
     - Console URL: `https://console.aws.amazon.com`

5. **Agregar credenciales de FTP**
   - Sección "Hosting" → Nuevo Item
   - Tipo: "Credencial"
   - Título: "FTP Credentials"
   - Campos:
     - Host: `ftp.acme.com`
     - Port: `21`
     - Username: `acme_ftp`
     - Password: `Ftp#2026$ecur3!` (encrypted)

6. **Configurar permisos de reveal**
   - Abre "Configuración de Seguridad"
   - Rol "Task Coordinator" → permite `credentials.reveal`
   - Audit log registra: quién, cuándo, qué credencial reveló
   - Timer de auto-hide: 30 segundos después de revelar

7. **Publicar portfolio público**
   - Selecciona items para publicar (excluye credenciales)
   - Configura slug: `/portfolio/acme-corp-redesign`
   - Agrega descripción pública: "Proyecto de rediseño web corporativo"
   - Publica → URL: `https://agencia.com/portfolio/acme-corp-redesign`

8. **Generar tarjeta digital con QR**
   - Accede a "Digital Services" → "Tarjeta Digital"
   - Configura: logo, colores, información de contacto
   - Genera QR code que apunta a portfolio
   - Descarga tarjeta como PNG para compartir

#### Permisos Utilizados
- ✅ `projects.create` - Crear proyecto
- ✅ `projects.update` - Editar proyecto
- ✅ `projects.sections` - Gestionar secciones
- ✅ `credentials.manage` - Crear/editar credenciales
- ✅ `credentials.reveal` - Configurar permisos de reveal
- ✅ `portfolio.publish` - Publicar portfolio
- ✅ `digital_services.portfolio` - Gestionar portfolio público
- ✅ `digital_services.tarjeta` - Generar tarjeta digital

#### Seguridad Implementada
- Passwords encriptados con AES-256
- Audit log de accesos a credenciales
- Timer de auto-hide (30s)
- Permisos granulares de reveal

#### Resultado
Proyecto organizado con credenciales seguras, portfolio público generado, tarjeta digital lista para compartir.

---

## 9. Reglas de Negocio

### 9.1 Herencia de Roles

#### 9.1.1 Definición
Los roles pueden heredar permisos de un rol padre (`parentRole`), evitando duplicación y facilitando mantenimiento.

#### 9.1.2 Roles con Herencia

| Rol | Parent | Permisos Heredados | Permisos Propios |
|-----|--------|-------------------|------------------|
| Landing Manager | Member | ~20 | +5 (landing, branding, forms) |
| Portfolio Admin | Member | ~20 | +2 (credentials, portfolio) |
| Task Coordinator | Member | ~20 | +0 (eleva permisos tasks/calendar) |
| Content Editor | Member | ~20 | -5 (reduce permisos, sin publish) |

#### 9.1.3 Cálculo de Permisos Efectivos

```python
def get_effective_permissions(role):
    """Calcula permisos efectivos incluyendo herencia."""
    permissions = set(role.direct_permissions)

    if role.parent_role:
        parent_permissions = get_effective_permissions(role.parent_role)
        permissions.update(parent_permissions)

    return permissions
```

#### 9.1.4 Restricciones
- **Máximo 3 niveles de herencia** (performance)
- **No herencia circular** (validación en creación)
- **Solo 1 parent role** (no herencia múltiple)

---

### 9.2 Delegación de Roles

#### 9.2.1 Restricciones de Asignación
- **Owner** puede asignar cualquier rol
- **Service Manager** puede asignar: Member, Viewer, Service-Specific Roles
- **Service Manager** NO puede asignar: Owner, Service Manager
- Usuarios sin permisos admin NO pueden asignar roles

#### 9.2.2 Validaciones
```python
def can_assign_role(assigner_role, target_role):
    """Valida si un usuario puede asignar un rol."""
    if assigner_role.name == 'Owner':
        return True

    if assigner_role.name == 'Service Manager':
        forbidden = ['Owner', 'Service Manager']
        return target_role.name not in forbidden

    return False  # Sin permisos
```

---

### 9.3 Scopes de Permisos

#### 9.3.1 Niveles de Scope

El sistema implementa 3 niveles de scope:

1. **Organizational Scope** (tenant-wide)
   - Los 10 roles documentados en este documento
   - Aplican a todo el tenant
   - Ejemplo: Owner puede gestionar cualquier recurso del tenant

2. **Project Scope** (project-specific)
   - Roles: Owner, Admin, Editor, Viewer
   - Aplican solo dentro de un proyecto específico
   - Ver: `/prd/features/projects.md`

3. **Share Scope** (item-specific)
   - Niveles: Viewer, Commenter, Editor, Admin
   - Aplican solo a elementos compartidos
   - Ver: `/prd/features/sharing-collaboration.md`

Para detalles completos de scoping, consultar: [Role Scoping](role-scoping.md)

---

### 9.4 Feature Gates por Plan

Algunos roles/permisos están gated por plan de suscripción:

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Roles personalizados | ❌ | ✅ 3 máx | ✅ 10 máx | ✅ Ilimitado |
| Delegación temporal | ❌ | ❌ | ✅ | ✅ |
| Audit logs | 7 días | 30 días | 1 año | 7 años |
| Customer Success Manager role | ❌ | ❌ | ✅ | ✅ |
| Billing Manager role | ❌ | ❌ | ✅ | ✅ |

---

### 9.5 Auditoría Obligatoria

#### 9.5.1 Eventos Auditables
Todos los eventos relacionados con roles/permisos DEBEN registrarse:

- `role.created` - Rol creado
- `role.updated` - Rol editado (nombre, permisos)
- `role.deleted` - Rol eliminado
- `role.assigned` - Rol asignado a usuario
- `role.revoked` - Rol removido de usuario
- `permission.changed` - Permisos de rol modificados

#### 9.5.2 Metadatos de Audit Log
```json
{
  "event_type": "role.assigned",
  "timestamp": "2026-02-16T10:30:00Z",
  "actor_id": "user-001",
  "actor_name": "John Smith",
  "target_user_id": "user-005",
  "target_user_name": "Alice Johnson",
  "role_id": "role-005",
  "role_name": "Landing Manager",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "tenant_id": "tenant-001"
}
```

#### 9.5.3 Retención
- Free: 7 días
- Starter: 30 días
- Professional: 1 año
- Enterprise: 7 años (compliance SOC2/GDPR)

---

## 10. Referencias

### 10.1 Documentos Relacionados

- [Functional Requirements](../requirements/functional-requirements.md) - FR-006 a FR-013
- [Role Scoping](role-scoping.md) - Diferencias entre organizational/project/share scopes
- [Data Models](data-models.md) - Modelos Role, Permission, RolePermission
- [API Endpoints](api-endpoints.md) - Endpoints de gestión de roles
- [Projects Feature](../features/projects.md) - Project-level roles
- [Sharing Feature](../features/sharing-collaboration.md) - Share-level permissions

### 10.2 Archivos de Implementación

- **Prototipo Admin**: `/docs/ui-ux/prototype-admin/src/data/mockData.js`
  - `roles` (líneas 93-209): Definición de 10 roles
  - `permissions` (líneas 211-299): Catálogo de 62 permisos
  - `rolePermissions` (líneas 936-1056): Matriz de asignaciones

- **Hooks de Permisos**: `/docs/ui-ux/prototype-admin/src/hooks/usePermissions.js`
  - Helpers de validación de permisos

- **Traducciones**:
  - `/docs/ui-ux/prototype-admin/src/locales/es/roles.json`
  - `/docs/ui-ux/prototype-admin/src/locales/en/roles.json`

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Functional Requirements](../requirements/functional-requirements.md)
- [➡️ Ver Role Scoping](role-scoping.md)

---

**Última actualización**: 2026-02-16
**Versión**: 1.0
**Autor**: Sistema RBAC Team
