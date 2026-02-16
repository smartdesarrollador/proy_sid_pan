# Role Scoping: Organizational, Project, and Share Permissions

[⬅️ Volver al README](../README.md)

---

## Índice

1. [Introducción](#1-introducción)
2. [Organizational Roles](#2-organizational-roles-tenant-wide)
3. [Project Roles](#3-project-roles-project-specific)
4. [Share Permissions](#4-share-permissions-item-specific)
5. [Matriz de Compatibilidad](#5-matriz-de-compatibilidad)
6. [Casos de Uso Multi-Scope](#6-casos-de-uso-multi-scope)
7. [Precedencia y Resolución de Conflictos](#7-precedencia-y-resolución-de-conflictos)

---

## 1. Introducción

El sistema de permisos implementa **3 niveles de scope** (alcance) para control granular de acceso:

```
┌─────────────────────────────────────────────────────────────┐
│                    SCOPE HIERARCHY                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1️⃣ ORGANIZATIONAL SCOPE (Tenant-Wide)                      │
│     • 10 roles predefinidos                                  │
│     • Aplica a TODOS los recursos del tenant                │
│     • Ejemplo: Owner puede gestionar cualquier recurso      │
│                                                               │
│  2️⃣ PROJECT SCOPE (Project-Specific)                        │
│     • 4 roles de proyecto: Owner, Admin, Editor, Viewer     │
│     • Aplica solo dentro de un proyecto específico          │
│     • Ejemplo: Project Owner gestiona UN proyecto           │
│                                                               │
│  3️⃣ SHARE SCOPE (Item-Specific)                             │
│     • 4 niveles de acceso: Viewer, Commenter, Editor, Admin │
│     • Aplica solo a elementos compartidos individualmente   │
│     • Ejemplo: User compartido con nivel Editor en 1 tarea  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 ¿Por qué 3 niveles de scope?

- **Organizational**: Control de acceso a nivel de tenant (usuarios, billing, configuración)
- **Project**: Colaboración dentro de proyectos sin dar acceso tenant-wide
- **Share**: Compartir elementos individuales sin dar acceso al proyecto completo

### 1.2 Principio de Diseño

**Least Privilege**: Usuarios reciben el mínimo nivel de acceso necesario para realizar su trabajo.

---

## 2. Organizational Roles (Tenant-Wide)

### 2.1 Definición

Los **Organizational Roles** son roles que aplican a **todo el tenant** y controlan acceso a servicios, usuarios, billing y configuración.

**Características:**
- **Scope**: Tenant-wide (todos los recursos)
- **Cantidad**: 10 roles predefinidos
- **Asignación**: Un usuario puede tener 1 rol organizational
- **Editable**: System Roles (4) son no editables, Service/Customer Roles (6) son editables

### 2.2 Los 10 Roles Organizational

| Categoría | Rol | Permisos | Scope |
|-----------|-----|----------|-------|
| **System Roles** | Owner | ~60 | Tenant-wide |
| | Service Manager | ~40 | Tenant-wide |
| | Member | ~20 | Tenant-wide |
| | Viewer | ~8 | Tenant-wide |
| **Service-Specific** | Landing Manager | ~25 | Landing + Member base |
| | Portfolio Admin | ~22 | Projects + Member base |
| | Task Coordinator | ~18 | Tasks/Calendar + Member base |
| | Content Editor | ~15 | Landing edit (sin publish) |
| **Customer/Billing** | Customer Success Manager | ~18 | Customers + Subscriptions |
| | Billing Manager | ~14 | Billing + Subscriptions |

### 2.3 Ejemplos de Permisos Organizational

```python
# Owner (Organizational Role)
permissions = [
    'users.create',           # Crear usuarios en el tenant
    'billing.manage',         # Gestionar billing del tenant
    'settings.update',        # Configurar tenant
    'projects.create',        # Crear proyectos en el tenant
    'customers.create',       # Crear clientes (multi-tenant)
    # ... 55 permisos más
]
```

### 2.4 Casos de Uso Organizational

- **Owner**: CEO gestiona usuarios, billing, configuración del tenant
- **Service Manager**: VP Operations supervisa todos los proyectos y servicios
- **Member**: Developer trabaja en sus propias tareas y proyectos
- **Landing Manager**: Marketing Manager gestiona landing pages del tenant

**Documentación completa**: [RBAC Roles & Permissions](rbac-roles-permissions.md)

---

## 3. Project Roles (Project-Specific)

### 3.1 Definición

Los **Project Roles** son roles que aplican **solo dentro de un proyecto específico** y controlan acceso a ese proyecto, sus secciones e items.

**Características:**
- **Scope**: Project-specific (solo un proyecto)
- **Cantidad**: 4 roles de proyecto
- **Asignación**: Un usuario puede tener diferentes roles en diferentes proyectos
- **Herencia**: NO heredan de Organizational Roles (independientes)

### 3.2 Los 4 Roles de Proyecto

| Rol de Proyecto | Permisos | Puede Gestionar Permisos | Puede Eliminar Proyecto |
|-----------------|----------|--------------------------|-------------------------|
| **Owner** | Full access | ✅ Sí | ✅ Sí |
| **Admin** | Full access | ✅ Sí | ❌ No |
| **Editor** | CRUD en items | ❌ No | ❌ No |
| **Viewer** | Read-only | ❌ No | ❌ No |

### 3.3 Permisos por Rol de Proyecto

#### Project Owner
- ✅ CRUD en proyecto, secciones, items
- ✅ Gestionar colaboradores (compartir proyecto)
- ✅ Cambiar permisos de colaboradores
- ✅ Eliminar proyecto
- ✅ Ver audit log del proyecto

#### Project Admin
- ✅ CRUD en proyecto, secciones, items
- ✅ Gestionar colaboradores
- ✅ Cambiar permisos de colaboradores
- ❌ NO puede eliminar proyecto (solo Owner)

#### Project Editor
- ✅ CRUD en items
- ✅ Ver proyecto y secciones
- ❌ NO puede gestionar colaboradores
- ❌ NO puede cambiar configuración del proyecto

#### Project Viewer
- ✅ Ver proyecto, secciones, items
- ❌ NO puede editar nada

### 3.4 Casos de Uso Project Scope

**Escenario**: Agencia de diseño con múltiples proyectos de clientes.

| Usuario | Organizational Role | Project A | Project B | Project C |
|---------|-------------------|-----------|-----------|-----------|
| Ana (Owner del tenant) | Owner | - | - | - |
| Bob (Project Manager) | Member | Owner | Owner | Owner |
| Carol (Designer) | Member | Editor | Viewer | - |
| Dave (Client) | Viewer | Viewer | - | - |

**Beneficio**: Carol puede editar Project A pero solo ver Project B, sin necesidad de roles organizational diferentes.

**Documentación completa**: [Projects Feature](../features/projects.md)

---

## 4. Share Permissions (Item-Specific)

### 4.1 Definición

Los **Share Permissions** son niveles de acceso que aplican **solo a elementos compartidos individualmente** (tareas, eventos, archivos, documentos).

**Características:**
- **Scope**: Item-specific (solo un elemento)
- **Cantidad**: 4 niveles de acceso
- **Asignación**: Un usuario puede tener diferentes niveles en diferentes items
- **Temporal**: Pueden tener fecha de expiración

### 4.2 Los 4 Niveles de Share

| Nivel | Ver | Comentar | Editar | Gestionar Permisos | Eliminar |
|-------|-----|----------|--------|-------------------|----------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Commenter** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅* |

*Solo si el owner original lo permite

### 4.3 Elementos Compartibles

- **Proyectos** (project)
- **Secciones de proyecto** (project_section)
- **Items de proyecto** (project_item)
- **Tareas** (task)
- **Eventos de calendario** (event)
- **Archivos** (file)
- **Documentos** (document)
- **Notas** (note)

### 4.4 Compartición de Grupos con Herencia

**Herencia de Permisos**: Al compartir un grupo (proyecto, carpeta), los permisos se heredan a elementos hijos.

```
Proyecto "Sistema de Autenticación" (shared con Alice: Editor)
  ├─ Sección "Credenciales Prod" (heredado: Editor)
  │   ├─ Item "Database Admin" (heredado: Editor)
  │   └─ Item "Redis Cache" (local: Admin) ← Alice tiene Admin aquí
  └─ Sección "Documentación" (local: Viewer) ← Alice tiene Viewer aquí
      └─ Item "Architecture Diagram" (heredado: Viewer)
```

**Precedencia**: Permisos locales (específicos del item) sobrescriben permisos heredados.

### 4.5 Casos de Uso Share Scope

**Escenario**: Marketing Manager comparte 1 tarea específica con Designer sin dar acceso al proyecto completo.

- **Marketing Manager** (organizational: Landing Manager)
  - Crea tarea "Diseñar banner Black Friday"
  - Comparte con Designer (nivel: Editor)

- **Designer** (organizational: Content Editor)
  - Recibe acceso solo a esa tarea
  - Puede editar la tarea
  - NO puede ver otras tareas del proyecto

**Beneficio**: Colaboración granular sin exponer información sensible.

**Documentación completa**: [Sharing & Collaboration Feature](../features/sharing-collaboration.md)

---

## 5. Matriz de Compatibilidad

### 5.1 ¿Qué Organizational Roles pueden gestionar qué scopes?

| Organizational Role | Gestionar Project Roles | Compartir Items | Gestionar Shares |
|--------------------|------------------------|-----------------|------------------|
| **Owner** | ✅ Todos los proyectos | ✅ Cualquier item | ✅ Cualquier share |
| **Service Manager** | ✅ Todos los proyectos | ✅ Items de servicios | ✅ Shares de servicios |
| **Member** | ✅ Solo sus proyectos | ✅ Sus items | ❌ No (solo owner de item) |
| **Viewer** | ❌ No | ❌ No | ❌ No |
| **Landing Manager** | ✅ Proyectos de landing | ✅ Landing items | ✅ Landing shares |
| **Portfolio Admin** | ✅ Todos los proyectos | ✅ Project items | ✅ Project shares |
| **Task Coordinator** | ❌ No | ✅ Tasks/Calendar items | ✅ Tasks/Calendar shares |
| **Content Editor** | ❌ No | ❌ No | ❌ No |
| **Customer Success Manager** | ❌ No | ❌ No | ❌ No |
| **Billing Manager** | ❌ No | ❌ No | ❌ No |

### 5.2 Relación entre Scopes

```python
# Ejemplo de usuario con múltiples scopes
user = {
    'id': 'user-005',
    'name': 'Alice Johnson',
    'organizational_role': 'Member',  # Scope 1: Tenant-wide
    'project_roles': {                # Scope 2: Project-specific
        'project-001': 'Owner',
        'project-003': 'Editor',
    },
    'shared_items': {                 # Scope 3: Item-specific
        'task-042': 'Editor',
        'event-018': 'Viewer',
    }
}
```

---

## 6. Casos de Uso Multi-Scope

### 6.1 Caso 1: Designer con Acceso Granular

**Perfil**: Carol es Designer en agencia de diseño.

#### Organizational Scope
- **Rol**: Content Editor
- **Permisos tenant-wide**:
  - ✅ `landing.read`, `landing.edit`
  - ❌ `landing.publish` (requiere Landing Manager)

#### Project Scope
- **Project A** (Cliente: Acme Corp): Editor
  - ✅ Puede editar todos los items del proyecto
- **Project B** (Cliente: TechStart): Viewer
  - ✅ Solo puede ver items (referencia)
- **Project C** (Cliente: DesignHub): Sin acceso

#### Share Scope
- **Tarea**: "Revisar mockup Hero Section" (Project C): Editor
  - ✅ Puede editar esta tarea específica de Project C
  - ❌ NO puede ver otras tareas de Project C

**Resultado**: Carol tiene acceso preciso a lo que necesita sin exponer información sensible de otros clientes.

---

### 6.2 Caso 2: Project Manager con Supervisión Limitada

**Perfil**: Bob es Project Manager en startup.

#### Organizational Scope
- **Rol**: Member
- **Permisos tenant-wide**:
  - ✅ `tasks.create`, `projects.create` (scope: own)
  - ❌ `billing.read`, `users.create`

#### Project Scope
- **Project "Q1 Product Launch"**: Owner
  - ✅ Full access a este proyecto
  - ✅ Puede compartir con otros
- **Project "HR Onboarding"**: Viewer
  - ✅ Solo puede ver progreso (stakeholder)

#### Share Scope
- **Evento**: "All-Hands Meeting" (Calendar): Admin
  - ✅ Puede gestionar este evento compartido
  - ✅ Puede invitar/remover asistentes

**Resultado**: Bob gestiona su proyecto sin acceso a billing o creación de usuarios.

---

### 6.3 Caso 3: External Consultant con Acceso Temporal

**Perfil**: Dave es consultor externo contratado por 3 meses.

#### Organizational Scope
- **Rol**: Viewer
- **Permisos tenant-wide**:
  - ✅ `dashboard.read`
  - ❌ NO puede editar nada

#### Project Scope
- **Project "Security Audit"**: Admin
  - ✅ Full access a este proyecto específico
  - ✅ Puede ver audit logs del proyecto
  - ⏰ Expiración: 3 meses

#### Share Scope
- **Documento**: "API Security Checklist": Editor
  - ✅ Puede editar este documento compartido
  - ⏰ Expiración: 3 meses

**Resultado**: Dave tiene acceso limitado y temporal sin poder ver información sensible de otros proyectos.

---

## 7. Precedencia y Resolución de Conflictos

### 7.1 Regla de Precedencia

Cuando un usuario tiene múltiples niveles de acceso a un recurso, se aplica el **más permisivo**:

```
Organizational Scope (más general)
         ↓
Project Scope (más específico)
         ↓
Share Scope (más específico)
```

### 7.2 Ejemplos de Resolución

#### Ejemplo 1: Conflicto Organizational vs Project

```python
user = {
    'organizational_role': 'Viewer',      # Scope 1: Read-only
    'project_roles': {
        'project-001': 'Editor'            # Scope 2: CRUD
    }
}

# Recurso: item de project-001
# Resultado: Editor (más permisivo)
```

#### Ejemplo 2: Conflicto Project vs Share

```python
user = {
    'project_roles': {
        'project-001': 'Viewer'            # Scope 2: Read-only
    },
    'shared_items': {
        'task-042': 'Editor'               # Scope 3: CRUD (pertenece a project-001)
    }
}

# Recurso: task-042 de project-001
# Resultado: Editor (más permisivo)
```

#### Ejemplo 3: Herencia vs Local

```python
# Proyecto compartido con Alice: Editor
project = {
    'id': 'project-001',
    'shares': [
        {'user': 'alice', 'level': 'Editor'}  # Heredado a todos los items
    ]
}

# Item específico con permiso local
item = {
    'id': 'item-secret',
    'project_id': 'project-001',
    'shares': [
        {'user': 'alice', 'level': 'Viewer'}  # Local: sobrescribe heredado
    ]
}

# Resultado para Alice en item-secret: Viewer (local sobrescribe heredado)
```

### 7.3 Algoritmo de Resolución

```python
def resolve_permissions(user, resource):
    """
    Resuelve permisos efectivos considerando todos los scopes.

    Orden de precedencia (del más específico al más general):
    1. Share Scope (local) - item-specific
    2. Share Scope (inherited) - project/group-wide
    3. Project Scope - project-wide
    4. Organizational Scope - tenant-wide
    """
    permissions = set()

    # 1. Organizational Scope (base)
    org_role = user.organizational_role
    permissions.update(org_role.permissions)

    # 2. Project Scope (si aplica)
    if resource.project_id:
        project_role = user.project_roles.get(resource.project_id)
        if project_role:
            permissions.update(project_role.permissions)

    # 3. Share Scope - Inherited (si aplica)
    if resource.parent and resource.parent.shared_with(user):
        inherited_level = resource.parent.get_share_level(user)
        permissions.update(inherited_level.permissions)

    # 4. Share Scope - Local (más específico, sobrescribe)
    if resource.shared_with(user):
        share_level = resource.get_share_level(user)
        permissions.update(share_level.permissions)

    return permissions
```

---

## 8. Feature Gates por Plan

### 8.1 Límites de Compartición por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Organizational Roles** | 4 system | 4 system + 2 custom | 4 system + 6 custom | Ilimitado |
| **Project Roles** | ✅ 4 roles | ✅ 4 roles | ✅ 4 roles | ✅ 4 roles |
| **Share Permissions** | ❌ No | ✅ Sí (5 max) | ✅ Sí (50 max) | ✅ Ilimitado |
| **Share Grupos** | ❌ | ❌ | ✅ Sí | ✅ Sí |
| **Herencia de Permisos** | ❌ | ❌ | ✅ Sí | ✅ Sí |
| **Expiración de Shares** | ❌ | ❌ | ✅ Manual | ✅ Automática |

---

## 9. Resumen Comparativo

| Aspecto | Organizational | Project | Share |
|---------|----------------|---------|-------|
| **Alcance** | Tenant-wide | Project-specific | Item-specific |
| **Cantidad de Roles** | 10 roles | 4 roles | 4 niveles |
| **Asignación** | 1 por usuario | Múltiples (1 por proyecto) | Múltiples (1 por item) |
| **Herencia** | Sí (parentRole) | No | Sí (de proyecto/grupo) |
| **Editable** | System: No, Otros: Sí | No | No |
| **Temporal** | No | No | Sí (opcional) |
| **Feature Gates** | Por plan | No | Por plan |

---

## 10. Referencias

### 10.1 Documentos Relacionados

- [RBAC Roles & Permissions](rbac-roles-permissions.md) - Organizational Roles detallados
- [Projects Feature](../features/projects.md) - Project Roles
- [Sharing & Collaboration](../features/sharing-collaboration.md) - Share Permissions
- [Functional Requirements](../requirements/functional-requirements.md) - FR-006 a FR-013, FR-032 a FR-036
- [Billing Feature](../features/billing.md) - Feature gates por plan

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver RBAC Roles & Permissions](rbac-roles-permissions.md)
- [➡️ Ver Projects Feature](../features/projects.md)

---

**Última actualización**: 2026-02-16
**Versión**: 1.0
**Autor**: Sistema RBAC Team
