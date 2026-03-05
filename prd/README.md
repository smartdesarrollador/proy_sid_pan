# PRD: Sistema Avanzado de Gestión de Roles, Permisos y Suscripciones Multi-Tenant

**Version:** 2.1.0
**Date:** 2026-02-15
**Status:** Draft
**Owner:** Product Team
**Tech Stack:** Django REST Framework, PostgreSQL, React + Vite (Admin + Cliente), Next.js (Digital Services), Tailwind CSS

---

## 📋 Índice de Documentación

Este PRD está organizado en módulos para facilitar la navegación y mantenimiento. A continuación se presenta el índice completo con enlaces a cada sección:

### 📊 Requirements (Requerimientos)
- **[Casos de Uso](requirements/use-cases.md)** - CU-001 a CU-025: Onboarding, roles, upgrade, delegación, auditoría, compartición, analytics, promociones, servicios complementarios
- **[User Stories](requirements/user-stories.md)** - US-001 a US-108: Historias de usuario completas organizadas por módulo
- **[Functional Requirements](requirements/functional-requirements.md)** - FR-001 a FR-130 + NFRs: Requisitos funcionales detallados

### 🎯 Features (Funcionalidades)
- **[Sharing & Collaboration](features/sharing-collaboration.md)** - Sistema de compartición con permisos granulares
- **[Projects/Portafolio](features/projects.md)** - Gestión de proyectos con secciones, items y campos customizables
- **[Billing & Subscriptions](features/billing.md)** - Planes, facturación, feature gates, límites de uso
- **[Digital Services](features/digital-services.md)** - Tarjeta digital, Landing page, Portafolio, CV público con SSR
- **[Analytics de Negocio](features/analytics.md)** - Dashboard con KPIs, métricas de clientes, MRR, ARPC, Health Score
- **[Sistema de Promociones](features/promotions.md)** - Códigos de descuento, promociones temporales, tracking de usos
- **[Productivity Services](features/productivity-services.md)** - Notas, Contactos, Bookmarks con feature gates por plan
- **[DevOps Services](features/devops-services.md)** - Variables de Entorno (cifradas), Claves SSH, Certificados SSL, Snippets
- **[Admin Services](features/admin-services.md)** - Formularios, Log de Auditoría (immutable), Reportes del Sistema
- **[Desktop App](features/desktop-app.md)** - Aplicacion de escritorio (Tauri) con sidebar para acceso rapido a servicios
- **[Hub - Portal del Cliente](features/hub-client-portal.md)** - Portal central del cliente: registro, suscripción, catálogo de servicios y acceso SSO

### 🔧 Technical (Documentación Técnica)
- **[Architecture](technical/architecture.md)** - Arquitectura general del sistema, multi-tenancy, seguridad
- **[RBAC Roles & Permissions](technical/rbac-roles-permissions.md)** - Catálogo completo de 10 roles y 62 permisos con matriz de asignación
- **[Role Scoping](technical/role-scoping.md)** - Diferencias entre organizational, project, y share scopes
- **[API Endpoints](technical/api-endpoints.md)** - Documentación completa de todos los endpoints REST
- **[Data Models](technical/data-models.md)** - Modelos Django completos con relaciones y catálogo de permisos
- **[Implementation Timeline](technical/implementation-timeline.md)** - Fases de desarrollo y sprints

---

## 1. Executive Summary

### 1.1 Visión del Producto

Construir una plataforma SaaS empresarial que permita a organizaciones gestionar usuarios, roles, permisos y suscripciones con aislamiento completo de datos (multi-tenant), escalabilidad horizontal, y cumplimiento de estándares de seguridad modernos. El sistema ofrecerá:

1. **Panel Administrativo (RBAC)**: Modelo RBAC (Role-Based Access Control) avanzado con permisos granulares, jerarquía de roles, delegación temporal, y auditoría completa para administradores de organizaciones. El Panel Administrativo incluye formularios de autenticación propios: **Login** (con opción Google OAuth), **Registro** de organización + cuenta de administrador, y **Recuperación de contraseña** por email. Todos consumen el backend en `apps/backend_django/`.

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
   - **10 roles predefinidos** organizados en 3 categorías:
     - System Roles (4): Owner, Service Manager, Member, Viewer
     - Service-Specific Roles (4): Landing Manager, Portfolio Admin, Task Coordinator, Content Editor
     - Customer/Billing Roles (2): Customer Success Manager, Billing Manager
   - **62 permisos granulares** en 13 categorías de recursos
   - Roles personalizados por tenant con permisos granulares
   - Jerarquía de roles con herencia de permisos (parentRole)
   - Permisos condicionales basados en contexto (ej: "puede editar documentos que él creó")
   - Delegación temporal de permisos con fecha de expiración
   - Auditoría inmutable de todos los cambios
   - **Referencia completa**: [RBAC Roles & Permissions](technical/rbac-roles-permissions.md)

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
  - **Frontend Admin** (React + Vite): Gestión de RBAC, usuarios, suscripciones, billing, auditoría
  - **Frontend Cliente** (React + Vite): Servicios productivos para usuarios finales (calendario, tareas, archivos)
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

### 2.4 Alcance del MVP y Fases Futuras

#### MVP (12 semanas) - Core Features
- ✅ Autenticación JWT con refresh tokens
- ✅ Login con email/contraseña y login con Google OAuth (OAuth2 social login)
- ✅ Registro de nueva cuenta con creación de tenant
- ✅ Recuperación y restablecimiento de contraseña por email
- ✅ Registro multi-tenant con tenant isolation (RLS)
- ✅ 5 roles predefinidos (SuperAdmin, OrgAdmin, Manager, Member, Guest)
- ✅ Permisos granulares básicos (CRUD en recursos principales)
- ✅ 3 planes de suscripción (Free, Starter, Professional)
- ✅ Facturación con Stripe (monthly/annual)
- ✅ Dashboard básico con métricas de organización
- ✅ Invitaciones por email
- ✅ Audit log básico (cambios en roles/permisos)
- ✅ API REST documentada con Swagger
- ✅ Frontend React + Vite con Tailwind (login, dashboard, user/role management)

#### Fase 2 (16 semanas) - Advanced RBAC + UX Enhancements
- ✅ Roles personalizados por tenant
- ✅ Jerarquía de roles con herencia
- ✅ Permisos condicionales (ej: edit_own, approve_department)
- ✅ Grupos de usuarios para asignación masiva
- ✅ Delegación temporal de permisos
- ✅ MFA (TOTP/SMS)
- ✅ Advanced audit logs con búsqueda y filtros
- ✅ Webhooks para eventos de autenticación/autorización
- **NEW** ✅ Internacionalización (i18n): Soporte ES/EN en admin y cliente
- **NEW** ✅ Dark Mode: Theme switcher con persistencia de preferencias

#### Fase 3 (24 semanas) - Enterprise Features
- ✅ SSO/SAML integration
- ✅ Plan Enterprise con SLA 99.9%
- ✅ Multi-tenant switching (usuarios en múltiples orgs)
- ✅ Custom branding por tenant (logo, colores, dominio)
- ✅ Advanced analytics dashboard
- ✅ API rate limiting granular por endpoint
- ✅ Geo-redundancy y disaster recovery
- ✅ Compliance reports (SOC2, GDPR)

#### Fase 4 (12 semanas) - Sharing & Projects
- ✅ Sistema de compartición con permisos granulares
- ✅ Gestión de proyectos con secciones, items y campos customizables
- ✅ Herencia automática de permisos en cascada
- ✅ Permisos locales que sobrescriben heredados
- ✅ Operaciones batch (Professional+)
- ✅ Export/import de proyectos (CSV/JSON)
- ✅ Búsqueda full-text (PostgreSQL FTS)
- ✅ Auditoría completa de eventos de compartición

#### Fase 5 (10 semanas) - Digital Services
- ✅ SSR con Next.js App Router
- ✅ Tarjeta Digital pública
- ✅ Landing Page personalizable
- ✅ Portafolio de proyectos público
- ✅ CV Digital con export PDF
- ✅ Analytics de vistas y conversiones
- ✅ Custom domains (Enterprise)
- ✅ SEO optimization (meta tags, sitemap, structured data)

#### Fase 6 (12 semanas) - Servicios Complementarios
- 📝 **Notas**: CRUD con categorías, pin y búsqueda (Free 10 / Starter 100 / Pro 1000 / Enterprise ∞)
- 📝 **Contactos**: Directorio con grupos, búsqueda y exportación CSV
- 📝 **Bookmarks**: Gestión de enlaces con colecciones, tags y búsqueda full-text
- 📝 **Variables de Entorno**: Cifradas AES-256, separadas por ambiente, toggle de revelación (Starter+)
- 📝 **Claves SSH**: Par de claves con fingerprint SHA-256 y alertas de vencimiento (Starter+)
- 📝 **Certificados SSL**: Tracking con alertas automáticas a 30/7/1 días (Starter+)
- 📝 **Snippets de Código**: 13+ lenguajes, tags, copia rápida (Free 10 / Starter 50 / Pro ∞)
- 📝 **Formularios**: Constructor con tipos de preguntas, submissions anónimos, exportación CSV (Free 1)
- 📝 **Log de Auditoría**: Timeline inmutable con filtros, retención 30/365 días (Professional+)
- 📝 **Reportes del Sistema**: Dashboard de métricas, tendencias y exportación PDF (Starter+)

#### Fase 7 (TBD) - Desktop App
- 📝 Sidebar AppBar nativa (Windows) con Tauri v2
- ✅ 8 paneles funcionales: Tasks, Notes, Contacts, Bookmarks, Snippets, Projects, Shared, Reports
- 📝 6 paneles pendientes: Home, Files, Chat, Alerts, Profile, Settings
- 📝 Consume API REST existente (sin tablas adicionales)

#### Future Phases (Post-MVP)
- Attribute-Based Access Control (ABAC)
- Machine learning para detección de anomalías en accesos
- Mobile apps (iOS/Android)
- Marketplace de integraciones
- White-label solution para partners

---

## Frontend Admin — Integración y Tooling

### Integración Backend
El frontend Admin (`apps/frontend_admin/`) consume **exclusivamente** la API REST del backend
Django (`apps/backend_django/`):

| Frontend | Backend |
|----------|---------|
| `apps/frontend_admin/` | `apps/backend_django/api/v1/admin/*` |
| Axios + TanStack Query | Django REST Framework (PASOes 1-20 ✅) |
| JWT Bearer tokens | `POST /api/v1/auth/login/` + refresh |
| Google OAuth (botón) | `GET /api/v1/auth/google/` → callback |

### Google OAuth
- El flujo OAuth se gestiona **server-side** en Django (django-allauth o dj-rest-auth + social)
- El frontend solo redirige al endpoint `/api/v1/auth/google/` y recibe el JWT en el callback
- Tanto el **login** como el **registro** ofrecen opción de Google OAuth

### Agents y Skills
Para el desarrollo del Admin Panel Frontend usar:
- **Skills**: `react-api-authentication`, `react-forms-validation`, `react-tanstack-query`,
  `react-tailwind-components`, `ui-base-components`, `ui-design-tokens`, `ui-layout-system`,
  `vite-react-configuration`, `react-router-patterns`, `react-testing-library`, `react-hooks-patterns`
- **Agentes**: `react-vite-builder` (scaffolding), `ui-ux-designer` (componentes visuales),
  `test-generator` (tests Vitest), `security-auditor` (auth flow), `code-reviewer` (calidad)

Ver roadmap completo: [ADMIN_PANEL_ROADMAP.md](ADMIN_PANEL_ROADMAP.md)

---

## 📖 Leyenda de Iconos

- 📋 **Requirements**: Documentación de requisitos y casos de uso
- 🎯 **Features**: Funcionalidades específicas del producto
- 🔧 **Technical**: Documentación técnica y arquitectura
- ✅ **Completado**: Feature o fase implementada
- 🔄 **En Progreso**: Actualmente en desarrollo
- 📝 **Planeado**: Scheduled para fases futuras

---

## 🚀 Quick Start

1. **Entender la Visión**: Leer esta página (README.md) + [Architecture](technical/architecture.md)
2. **Revisar Requirements**: [Use Cases](requirements/use-cases.md) + [User Stories](requirements/user-stories.md)
3. **Explorar Features Clave**:
   - [Sharing & Collaboration](features/sharing-collaboration.md) - Sistema de compartición
   - [Projects](features/projects.md) - Gestión de proyectos
   - [Billing](features/billing.md) - Suscripciones y planes
   - [Productivity Services](features/productivity-services.md) - Notas, Contactos, Bookmarks
   - [DevOps Services](features/devops-services.md) - EnvVars, SSH Keys, SSL Certs, Snippets
   - [Admin Services](features/admin-services.md) - Formularios, Auditoría, Reportes
4. **Detalles Técnicos**: [API Endpoints](technical/api-endpoints.md) + [Data Models](technical/data-models.md)
5. **Planificación**: [Implementation Timeline](technical/implementation-timeline.md)

---

## 📞 Contacto y Contribución

**Product Owner**: Product Team
**Tech Lead**: Development Team
**Documentation**: `/prd/` directory

Para actualizaciones y cambios en este PRD, consultar el repositorio principal y seguir el proceso de revisión establecido.

---

[⬆️ Volver al inicio](#-índice-de-documentación)
