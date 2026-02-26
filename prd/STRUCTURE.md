# PRD Modular Structure

Este documento describe la estructura modular del PRD después de la división.

## Estructura de Directorios

```
/prd/
├── README.md                           # Índice principal con links y Executive Summary
├── rbac-subscription-system.md         # Archivo original completo (respaldo)
│
├── requirements/                       # Requerimientos del sistema
│   ├── use-cases.md                   # CU-001 a CU-008 (Casos de Uso)
│   ├── user-stories.md                # US-001 a US-036 (Historias de Usuario)
│   └── functional-requirements.md     # FR-001+ & NFRs (Requisitos Funcionales)
│
├── features/                          # Funcionalidades específicas
│   ├── sharing-collaboration.md       # Sistema de compartición con permisos
│   ├── projects.md                    # Gestión de proyectos/portafolio
│   ├── billing.md                     # Planes, facturación, feature gates
│   └── desktop-app.md                # App desktop (Tauri) sidebar panel
│
└── technical/                         # Documentación técnica
    ├── architecture.md                # Arquitectura general, multi-tenancy, seguridad
    ├── api-endpoints.md               # Endpoints REST completos
    ├── data-models.md                 # Modelos Django con relaciones
    └── implementation-timeline.md     # Fases y sprints de desarrollo
```

## Estadísticas de Archivos

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| README.md | 228 | Índice principal + Executive Summary |
| requirements/use-cases.md | 217 | 8 casos de uso principales |
| requirements/user-stories.md | 612 | 36 historias de usuario organizadas |
| requirements/functional-requirements.md | 608 | FRs + NFRs completos |
| features/sharing-collaboration.md | 519 | Feature de compartición completa |
| features/projects.md | 491 | Feature de proyectos completa |
| features/billing.md | 360 | Planes y facturación |
| technical/architecture.md | 323 | Arquitectura técnica |
| technical/api-endpoints.md | 564 | Endpoints REST |
| technical/data-models.md | 452 | Modelos Django |
| technical/implementation-timeline.md | 336 | Timeline de desarrollo |
| features/desktop-app.md | 536 | App desktop Tauri sidebar |
| **Total archivos modulares** | **5,246** | **12 archivos modulares** |

**Archivo original**: rbac-subscription-system.md (~3,997 líneas)

## Navegación Entre Archivos

Todos los archivos incluyen:
- **Header con breadcrumb**: Link de regreso al README
- **Índice interno**: Links a secciones principales
- **Footer de navegación**: Links a archivos relacionados
- **Fecha de actualización**: 2026-02-10

## Características de la Estructura

### ✅ Ventajas

1. **Modularidad**: Cada feature/componente en archivo separado
2. **Navegabilidad**: Links entre documentos para fácil navegación
3. **Mantenibilidad**: Cambios localizados en archivos específicos
4. **Colaboración**: Múltiples personas pueden editar features simultáneamente
5. **Versionamiento**: Git diff más limpio por archivo
6. **Búsqueda**: Más fácil encontrar contenido específico
7. **Reutilización**: Features autocontenidas con contexto completo

### 📋 Contenido de cada Módulo

#### Requirements

**use-cases.md**:
- CU-001: Onboarding de Nueva Organización
- CU-002: Configuración de Roles Personalizados
- CU-003: Upgrade de Plan con Cambio de Límites
- CU-004: Delegación Temporal de Permisos
- CU-005: Auditoría de Cambios en Permisos
- CU-006: Compartir Proyecto con Control de Permisos
- CU-007: Revocar Acceso a Elemento Compartido
- CU-008: Gestionar Herencia de Permisos en Proyecto

**user-stories.md**:
- 3.1 Autenticación y Gestión de Usuarios (US-001 a US-005)
- 3.2 Sistema de Roles y Permisos (US-006 a US-012)
- 3.3 Gestión de Suscripciones y Facturación (US-013 a US-020)
- 3.4 Multi-Tenancy y Aislamiento de Datos (US-021 a US-025)
- 3.5 Gestión de Proyectos (US-26 a US-34)
- 3.6 Compartición y Colaboración (US-032 a US-036)

**functional-requirements.md**:
- 4.1 Gestión de Usuarios (FR-001 a FR-005)
- 4.2 Sistema de Roles y Permisos (FR-006 a FR-013)
- 4.3 Gestión de Suscripciones (FR-014 a FR-021)
- 4.4 Multi-Tenancy (FR-022 a FR-025)
- 4.5 Gestión de Proyectos (FR-050 a FR-058)
- 4.6 Compartición y Colaboración (FR-032 a FR-036)
- 5. Non-Functional Requirements (Performance, Security, etc.)

#### Features

**sharing-collaboration.md**:
- Casos de uso (CU-006, CU-007, CU-008)
- User stories (US-032 a US-036)
- Functional requirements (FR-032 a FR-036)
- Data models (Share, SharePermission)
- API endpoints completos
- Timeline (Phase 4 sprints)

**projects.md**:
- Product overview
- Features por plan (Free, Starter, Pro, Enterprise)
- User stories (US-26 a US-34)
- Functional requirements (FR-050 a FR-058)
- Permisos RBAC
- Data models (Project, Section, Item, Field, Member)

**billing.md**:
- Planes de suscripción detallados
- User stories (US-013 a US-020)
- Functional requirements (FR-014 a FR-021)
- Feature gates por plan
- Límites de uso (tabla comparativa)

#### Technical

**architecture.md**:
- System overview con diagramas
- Multi-tenancy architecture (RLS)
- Security (JWT, encryption)
- Scalability strategy
- Tech stack completo

**api-endpoints.md**:
- Authentication endpoints
- Admin endpoints
- App/Cliente endpoints
- Shared endpoints
- Error responses
- Rate limiting

**data-models.md**:
- Core models (Tenant, User)
- RBAC models (Role, Permission, UserRole)
- Subscription models (Subscription, Invoice)
- Project models (Project, Section, Item)
- Audit models (AuditLog)

**implementation-timeline.md**:
- Fase 1: MVP (12 semanas)
- Fase 2: Advanced RBAC (16 semanas)
- Fase 3: Enterprise Features (24 semanas)
- Fase 4: Sharing & Projects (12 semanas)
- Milestones y team structure
- Risk mitigation

## Uso Recomendado

### Para Product Managers
1. Leer README.md (visión general)
2. Revisar requirements/use-cases.md (flujos principales)
3. Explorar features/*.md (funcionalidades específicas)

### Para Developers
1. Leer technical/architecture.md (arquitectura)
2. Consultar technical/data-models.md (modelos)
3. Usar technical/api-endpoints.md (implementación)
4. Seguir technical/implementation-timeline.md (planificación)

### Para Stakeholders
1. Leer README.md (Executive Summary)
2. Revisar features/billing.md (monetización)
3. Consultar technical/implementation-timeline.md (timeline)

### Para QA/Testing
1. Leer requirements/user-stories.md (criterios de aceptación)
2. Consultar requirements/functional-requirements.md (validaciones)
3. Usar features/*.md (flujos específicos a testear)

## Mantenimiento

### Agregar Nueva Feature
1. Crear `/prd/features/nueva-feature.md`
2. Incluir: casos de uso, user stories, FRs, models, endpoints
3. Actualizar README.md con link a nueva feature
4. Actualizar technical/implementation-timeline.md con sprint

### Modificar Requisitos Existentes
1. Localizar archivo específico (use-cases, user-stories, functional-requirements)
2. Editar sección correspondiente
3. Actualizar fecha de última modificación
4. Verificar links relacionados

### Actualizar Documentación Técnica
1. Editar archivo correspondiente en /technical/
2. Actualizar versión si es cambio mayor
3. Revisar impacto en features relacionadas

## Respaldo

El archivo original completo `rbac-subscription-system.md` se mantiene como respaldo y referencia histórica. No se debe eliminar hasta validar que toda la información relevante esté correctamente distribuida en los módulos.

---

**Creado**: 2026-02-11
**Versión**: 1.0.0
