# Guía Visual del Prototipo UI/UX

> Sistema de Gestión de Roles, Permisos y Suscripciones Multi-Tenant

## 📖 Índice

1. [Overview del Sistema](#overview-del-sistema)
2. [Dashboard](#dashboard)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Gestión de Roles](#gestión-de-roles)
5. [Gestión de Permisos](#gestión-de-permisos)
6. [Suscripciones y Facturación](#suscripciones-y-facturación)
7. [Auditoría](#auditoría)
8. [Flujos de Usuario](#flujos-de-usuario)

---

## Overview del Sistema

### Arquitectura de Navegación

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (Top Bar)                                           │
│  [Menu] Acme Corporation          [Plan Badge] [🔔] [User] │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────────┐
│              │                                              │
│  Sidebar     │  Main Content Area                          │
│              │                                              │
│  • Dashboard │  [Active View Component]                    │
│  • Usuarios  │                                              │
│  • Roles     │                                              │
│  • Permisos  │                                              │
│  • Suscripc. │                                              │
│  • Auditoría │                                              │
│  • Config.   │                                              │
│              │                                              │
│  [Upgrade]   │                                              │
│  [CTA Box]   │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### Componentes Principales

- **Navbar**: Navegación superior con tenant branding, plan badge, notificaciones y menú de usuario
- **Sidebar**: Menú lateral colapsable con navegación principal
- **Main Content**: Área de contenido dinámico según vista activa

---

## Dashboard

### Vista General

El dashboard proporciona una vista rápida del estado de la organización:

#### Métricas Principales (Cards)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 👥 Usuarios │ 🛡️ Roles    │ 💾 Storage  │ ⚡ API Calls│
│ 23/50       │ 6 roles     │ 12.5GB      │ 8,234       │
│ +3 este mes │ 2 custom    │ de 50GB     │ de 100,000  │
│ [████░░] 46%│             │ [██░░░] 25% │ [█░░░░] 8%  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Alertas

- **Límite de usuarios**: Alerta amarilla cuando se acerca al límite del plan
- **Suscripción activa**: Confirmación verde con fecha de renovación

#### Actividad Reciente

**Usuarios Recientes** (últimos 5)
- Avatar con iniciales
- Nombre completo + email
- Badge de estado (Activo/Pendiente)

**Actividad Reciente** (últimos 5 eventos)
- Dot indicator (verde=success, rojo=fail)
- Actor + acción + timestamp
- Formato: "John Smith asignó rol 'Content Editor'"

### Casos de Uso

1. **Monitor rápido**: Ver de un vistazo si hay alertas o límites cerca
2. **Onboarding check**: Ver los últimos usuarios agregados
3. **Security check**: Revisar actividad reciente sospechosa

---

## Gestión de Usuarios

### Vista de Tabla

```
┌───────────────────────────────────────────────────────────────┐
│ Gestión de Usuarios                    [+ Invitar Usuario]   │
│ 5 usuarios en total                                           │
├───────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...            ] [Estado ▼]                        │
├───────────────────────────────────────────────────────────────┤
│ Usuario      │ Roles        │ Estado   │ MFA      │ Acciones │
├───────────────────────────────────────────────────────────────┤
│ JS John Smith│ OrgAdmin     │ ✓ Activo │ 🛡️ Sí    │ ✏️ 🗑️ ⋮  │
│ admin@...    │              │          │          │          │
├───────────────────────────────────────────────────────────────┤
│ SJ Sarah J.  │ Manager      │ ✓ Activo │ 🛡️ Sí    │ ✏️ 🗑️ ⋮  │
│ sarah.j@...  │ HR Access    │          │          │          │
├───────────────────────────────────────────────────────────────┤
│ ...          │              │          │          │          │
└───────────────────────────────────────────────────────────────┘
```

### Features

1. **Búsqueda**: Por nombre, apellido o email
2. **Filtros**: Por estado (Todos/Activos/Pendientes)
3. **Indicadores**:
   - Avatar circular con iniciales
   - Badges de rol con color
   - Badge de estado (verde/amarillo)
   - Badge de MFA (verde=habilitado, gris=no)
4. **Acciones**:
   - ✏️ Editar usuario
   - 🗑️ Eliminar usuario
   - ⋮ Más opciones

### Modal de Invitación

```
┌─────────────────────────────────────────┐
│ Invitar Usuario                     [×] │
├─────────────────────────────────────────┤
│ Email                                   │
│ [usuario@ejemplo.com              ]     │
│                                         │
│ Rol                                     │
│ [Member                           ▼]    │
│                                         │
│ ℹ️ Se enviará un email con enlace      │
│   que expira en 7 días                  │
├─────────────────────────────────────────┤
│ [Cancelar]    [📧 Enviar Invitación]   │
└─────────────────────────────────────────┘
```

### Casos de Uso

1. **Búsqueda rápida**: Encontrar usuario por email
2. **Invitar miembros**: Agregar nuevos usuarios al tenant
3. **Revisar MFA**: Ver quién tiene MFA habilitado
4. **Gestionar accesos**: Editar o eliminar usuarios

---

## Gestión de Roles

### Vista de Grid

```
┌────────────────────────┬────────────────────────┐
│ 🛡️ OrgAdmin           │ 🛡️ Manager            │
│ [SISTEMA]              │ [SISTEMA]              │
│ Admin completo         │ Gestión de equipo      │
│ Hereda: -              │ Hereda: Member         │
│ 👥 1 · 🔒 48          │ 👥 3 · 🔒 32          │
│              ✏️ 🗑️ →  │              ✏️ 🗑️ →  │
├────────────────────────┼────────────────────────┤
│ 🛡️ Content Editor     │ 🛡️ HR Access          │
│ Crear/editar contenido │ Info de RRHH           │
│ Hereda: Member         │ Hereda: Member         │
│ 👥 8 · 🔒 12          │ 👥 2 · 🔒 8           │
│         [Custom] ✏️ 🗑️│         [Custom] ✏️ 🗑️ │
└────────────────────────┴────────────────────────┘
```

### Features

1. **Card de Rol**:
   - Icono con color personalizado
   - Nombre + badge (Sistema/Custom)
   - Descripción breve
   - Indicador de herencia (parent role)
   - Contadores: usuarios y permisos
   - Acciones (solo custom roles)

2. **Crear Rol**: Modal con:
   - Nombre
   - Descripción
   - Heredar de (opcional)
   - Selector de color (6 opciones)

### Modal de Detalles

```
┌─────────────────────────────────────────────────┐
│ 🛡️ Content Editor                          [×] │
│ Crear y editar contenido...                    │
├─────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┐                │
│ │ 8       │ 12      │ Creado  │                │
│ │ Usuarios│ Permisos│ 01/20/26│                │
│ └─────────┴─────────┴─────────┘                │
│                                                 │
│ Permisos Asignados                              │
│ ┌─────────────────────────────────────┐         │
│ │ Crear Contenido            [Content]│         │
│ │ content.create                      │         │
│ ├─────────────────────────────────────┤         │
│ │ Editar Contenido Propio    [Content]│         │
│ │ content.edit_own [Scope: own]      │         │
│ └─────────────────────────────────────┘         │
│                                                 │
├─────────────────────────────────────────────────┤
│                     [Cerrar]                    │
└─────────────────────────────────────────────────┘
```

### Casos de Uso

1. **Revisar roles**: Ver qué roles existen y cuántos usuarios tienen
2. **Crear rol custom**: Definir nuevo rol adaptado a la org
3. **Verificar permisos**: Entender qué puede hacer cada rol
4. **Gestionar herencia**: Configurar parent roles

---

## Gestión de Permisos

### Vista por Categoría

```
┌─────────────────────────────────────────────────┐
│ Gestión de Permisos                             │
│ 28 permisos organizados por categoría           │
├─────────────────────────────────────────────────┤
│ ℹ️ Los permisos se asignan a roles. Scope      │
│   "own"/"department" restringen acceso          │
├─────────────────────────────────────────────────┤
│ [🔍 Buscar...            ] [Categoría      ▼]  │
├─────────────────────────────────────────────────┤
│ ▼ Users                              5 permisos │
├─────────────────────────────────────────────────┤
│ 🔑 Crear Usuarios               [Users] [create]│
│    users.create                                 │
├─────────────────────────────────────────────────┤
│ 🔑 Ver Usuarios                 [Users] [read]  │
│    users.read                                   │
├─────────────────────────────────────────────────┤
│ ▼ Content                           6 permisos  │
├─────────────────────────────────────────────────┤
│ 🔑 Editar Contenido Propio   [Content] [update] │
│    content.edit_own          [Scope: own]       │
└─────────────────────────────────────────────────┘
```

### Features

1. **Agrupación por categoría**: Users, Roles, Content, Projects, Billing, etc.
2. **Badges de metadata**:
   - Categoría (azul)
   - Acción (color según tipo: create=verde, delete=rojo, update=amarillo)
   - Scope (morado si existe)
3. **Búsqueda**: Por nombre o codename
4. **Filtro**: Por categoría

### Categorías de Permisos

| Categoría | Recursos | Acciones |
|-----------|----------|----------|
| **Users** | users | create, read, update, delete, invite |
| **Roles** | roles | create, read, update, delete, assign |
| **Content** | content | create, read, edit (own/all), publish, delete |
| **Projects** | projects | create, read, update, delete |
| **Billing** | billing | read, manage, upgrade, cancel |
| **Settings** | settings | read, update |
| **Audit** | audit | read, export |

### Scopes Condicionales

- **all**: Sin restricciones
- **own**: Solo recursos del usuario (user_id = current_user)
- **department**: Solo del mismo departamento
- **custom**: Lógica personalizada

### Casos de Uso

1. **Explorar permisos**: Ver qué permisos existen en el sistema
2. **Entender scopes**: Comprender restricciones condicionales
3. **Planificar roles**: Decidir qué permisos incluir en nuevo rol

---

## Suscripciones y Facturación

### Vista de Plan Actual

```
┌─────────────────────────────────────────────────┐
│ Plan Actual: Professional           $99/mes    │
│ Se renueva el 2026-03-09                        │
├─────────────┬─────────────┬─────────────────────┤
│ 👥 Usuarios │ 💾 Storage  │ ⚡ API Calls       │
│ 23/50       │ 12.5/50 GB  │ 8.2k                │
└─────────────┴─────────────┴─────────────────────┘
```

### Comparación de Planes

```
┌──────────┬──────────┬──────────────┬────────────┐
│ Free     │ Starter  │ Professional │ Enterprise │
│          │          │ [POPULAR]    │            │
│          │          │ [ACTUAL]     │            │
├──────────┼──────────┼──────────────┼────────────┤
│ $0       │ $29      │ $99          │ Custom     │
│ /mes     │ /mes     │ /mes         │            │
├──────────┼──────────┼──────────────┼────────────┤
│ ✓ 5 usr  │ ✓ 10 usr │ ✓ 50 usr     │ ✓ Unlimited│
│ ✓ 1GB    │ ✓ 5GB    │ ✓ 50GB       │ ✓ Unlimited│
│ ✗ Custom │ ✗ Custom │ ✓ Custom     │ ✓ Custom   │
│   roles  │   roles  │   roles      │   roles    │
│ ✗ MFA    │ ✓ MFA    │ ✓ MFA        │ ✓ MFA      │
│ ✗ SSO    │ ✗ SSO    │ ✗ SSO        │ ✓ SSO      │
├──────────┼──────────┼──────────────┼────────────┤
│[Upgrade] │[Upgrade] │ [ACTUAL]     │ [Contact]  │
└──────────┴──────────┴──────────────┴────────────┘
```

### Features

1. **Toggle Mensual/Anual**: Badge "-10%" en anual
2. **Badge "Más Popular"**: En plan Professional
3. **Badge "Plan Actual"**: En plan activo
4. **Progress bars**: Uso de recursos vs límites
5. **Alertas de límite**: Warning cuando se acerca a límite

### Historial de Facturas

```
┌─────────────────────────────────────────────────┐
│ Historial de Facturas               [Ver todas]│
├─────────────────────────────────────────────────┤
│ 💳 INV-2026-002                    $99.00 USD  │
│    2026-02-01 - 2026-02-28         [Pagado] 📥 │
├─────────────────────────────────────────────────┤
│ 💳 INV-2026-001                    $99.00 USD  │
│    2026-01-01 - 2026-01-31         [Pagado] 📥 │
└─────────────────────────────────────────────────┘
```

### Casos de Uso

1. **Comparar planes**: Decidir si hacer upgrade/downgrade
2. **Monitorear uso**: Ver si se acerca a límites
3. **Revisar facturas**: Descargar recibos para contabilidad
4. **Cambiar plan**: Actualizar suscripción

---

## Auditoría

### Timeline de Eventos

```
┌─────────────────────────────────────────────────┐
│ Auditoría y Compliance        [📥 Exportar CSV]│
│ 5 eventos • Retención 7 años                    │
├─────────────────────────────────────────────────┤
│ ℹ️ Logs inmutables con cumplimiento SOC2/GDPR  │
├─────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Acción ▼] [Estado ▼]          │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐  │
│ │ ● ✓ [Asignar Rol] [Exitoso]              │  │
│ │ │  John Smith asignó rol "Content Editor" │  │
│ │ │  Recurso: User: Emma Davis              │  │
│ │ │  📅 2026-02-09 14:30 | IP: 192.168.1... │  │
│ │ │  ▸ Ver detalles técnicos                │  │
│ │                                            │  │
│ │ ● ✓ [Crear Rol] [Exitoso]                │  │
│ │ │  John Smith creó nuevo rol "HR Access"  │  │
│ │ │  📅 2026-02-09 11:22                    │  │
│ │                                            │  │
│ │ ● ✗ [Login Fallido] [Fallido]            │  │
│ │    Sistema - credenciales inválidas       │  │
│ │    📅 2026-02-08 14:10 | IP: 203.0.113... │  │
│ └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Features

1. **Timeline visual**: Dot indicator + línea vertical
2. **Color-coding**:
   - Verde = Success
   - Rojo = Failed
3. **Badges**: Acción + Estado
4. **Detalles expandibles**:
   - ID del evento
   - IP address
   - User agent
5. **Filtros**: Por acción y estado
6. **Exportación**: CSV para compliance

### Estadísticas

```
┌──────────────┬──────────────┬──────────────┐
│ ✓ 4          │ ✗ 1          │ 📅 24h       │
│ Exitosos     │ Fallidos     │ Últimas 24h  │
└──────────────┴──────────────┴──────────────┘
```

### Acciones Auditadas

- `login` / `logout` / `login_failed`
- `create_role` / `update_role` / `delete_role`
- `assign_role` / `revoke_role`
- `create_user` / `update_user` / `delete_user`
- `upgrade_plan` / `downgrade_plan`
- `payment_success` / `payment_failed`

### Casos de Uso

1. **Compliance audit**: Exportar logs para auditoría SOC2
2. **Security investigation**: Revisar logins fallidos sospechosos
3. **Change tracking**: Ver quién modificó permisos de quién
4. **Accountability**: Trazabilidad completa de acciones

---

## Flujos de Usuario

### 1. Flujo: Invitar Nuevo Usuario

```
Dashboard → Usuarios → [+ Invitar Usuario]
                           ↓
                    [Modal] Email + Rol
                           ↓
                   [Enviar Invitación]
                           ↓
                   ✓ Email enviado
                           ↓
              Usuario aparece en tabla (Pendiente)
```

**Tiempo estimado**: 30 segundos

### 2. Flujo: Crear Rol Personalizado

```
Dashboard → Roles → [+ Crear Rol]
                       ↓
              [Modal] Nombre + Descripción
                       ↓
              Seleccionar Parent Role (opcional)
                       ↓
              Elegir color
                       ↓
              [Crear Rol]
                       ↓
              ✓ Rol creado
                       ↓
         Aparece en grid de roles
```

**Tiempo estimado**: 1 minuto

### 3. Flujo: Upgrade de Plan

```
Dashboard → Suscripción → Comparar Planes
                              ↓
                    Toggle Mensual/Anual
                              ↓
                    Seleccionar Plan Superior
                              ↓
                    [Actualizar Plan]
                              ↓
                    ✓ Plan actualizado
                              ↓
                Badge de plan cambia en Navbar
```

**Tiempo estimado**: 45 segundos

### 4. Flujo: Revisar Auditoría de Cambios

```
Dashboard → Auditoría → Filtrar por "assign_role"
                            ↓
                    Ver timeline filtrada
                            ↓
                    Expandir detalles técnicos
                            ↓
                    [Exportar CSV]
                            ↓
                    ✓ Reporte descargado
```

**Tiempo estimado**: 1 minuto

---

## Elementos de UI Reutilizables

### Botones

- **Primary**: `bg-primary-600 text-white hover:bg-primary-700`
- **Secondary**: `bg-gray-200 text-gray-700 hover:bg-gray-300`
- **Danger**: `bg-red-600 text-white hover:bg-red-700`
- **Ghost**: `bg-transparent hover:bg-gray-100`

### Badges

- **Status Active**: `bg-green-100 text-green-800`
- **Status Pending**: `bg-yellow-100 text-yellow-800`
- **System Role**: `bg-blue-100 text-blue-800`
- **Permission Category**: `bg-primary-100 text-primary-800`

### Cards

- Border: `border border-gray-200`
- Shadow: `shadow-sm`
- Hover: `hover:shadow-md`
- Radius: `rounded-xl`

### Inputs

- Base: `border border-gray-300 rounded-lg`
- Focus: `focus:ring-2 focus:ring-primary-500 focus:border-transparent`

---

## Accessibility (a11y)

### Implementado

- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Semantic HTML (nav, main, section)
- ✅ ARIA labels en botones de iconos
- ✅ Color contrast WCAG AA

### Pendiente (Full Implementation)

- ⏳ Screen reader announcements
- ⏳ Skip navigation
- ⏳ Focus trapping en modales
- ⏳ Reduced motion support

---

## Responsive Design

### Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md/lg)
- **Desktop**: > 1024px (xl)

### Adaptaciones

**Mobile**:
- Sidebar colapsado por defecto
- Grid de roles en 1 columna
- Tabla de usuarios con scroll horizontal
- Navbar compacto sin texto de badges

**Tablet**:
- Grid de roles en 2 columnas
- Sidebar visible
- Dashboard stats en 2 columnas

**Desktop**:
- Grid de roles en 2-3 columnas
- Dashboard stats en 4 columnas
- Sidebar fijo + ancho completo

---

## Próximos Pasos

### Feedback a Recolectar

1. **¿Los flujos son intuitivos?**
2. **¿Falta alguna feature crítica?**
3. **¿Hay features que sobran?**
4. **¿La jerarquía visual es clara?**
5. **¿Los copy/labels son comprensibles?**

### Iteraciones Sugeridas

- Agregar filtros avanzados en usuarios
- Implementar multi-select en permisos
- Agregar preview de cambios en upgrade de plan
- Incluir gráficos de uso histórico
- Agregar dark mode toggle

---

**Fecha**: 2026-02-09
**Versión**: 1.0.0
**Basado en**: PRD v1.0.0 + Diagramas UML
