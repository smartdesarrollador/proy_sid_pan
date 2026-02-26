# Desktop App (Sidebar Panel)

[⬅️ Volver al README](../README.md)

---

## Indice

- [Vision General](#vision-general)
- [Arquitectura de la App](#arquitectura-de-la-app)
- [Estado Actual del Prototipo](#estado-actual-del-prototipo)
- [Detalle de Paneles Implementados](#detalle-de-paneles-implementados)
- [Paneles Pendientes de Especificacion](#paneles-pendientes-de-especificacion)
- [Componentes Compartidos](#componentes-compartidos)
- [Consideraciones Tecnicas Desktop-Specific](#consideraciones-tecnicas-desktop-specific)
- [Feature Gates por Plan](#feature-gates-por-plan)
- [Permisos RBAC](#permisos-rbac)
- [Navegacion](#navegacion)

---

## Vision General

### Objetivo

Proveer una aplicacion de escritorio que funcione como **sidebar anclada al borde derecho de la pantalla** (estilo Windows AppBar), dando a los clientes **acceso rapido a toda la informacion de la plataforma** desde el escritorio. Maximiza la productividad al tener los servicios clave a pocos clicks sin necesidad de abrir el navegador.

### Tech Stack

| Componente | Tecnologia |
|-----------|-----------|
| Framework Desktop | Tauri v2 (Rust backend) |
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS 3 |
| Build Tool | Vite |
| Iconos | lucide-react |

### Plataforma

- **Windows** (AppBar API nativa via Win32 `SHAppBarMessage`)
- macOS y Linux: pendientes de evaluacion en fases futuras

### Integracion con Backend

> **NO requiere nuevas tablas ni migraciones de base de datos.**
>
> La app desktop consume los **mismos endpoints API REST** que el frontend cliente web (`prototype-cliente`). Todos los modelos Django, permisos y feature gates existentes aplican sin modificaciones.

---

## Arquitectura de la App

### Estructura Visual

```
+-----------------------------------------------------------+
|                    Pantalla del usuario                    |
|                                                           |
|                                          +---+-----------+|
|                                          |   |           ||
|                                          | I |  Panel    ||
|                                          | c |  Content  ||
|                                          | o |  (320px   ||
|                                          | n |  default) ||
|                                          |   |           ||
|                                          | S |  Resize   ||
|                                          | t |  handle   ||
|                                          | r |  <-->     ||
|                                          | i |           ||
|                                          | p |           ||
|                                          |60 |           ||
|                                          |px |           ||
|                                          +---+-----------+|
+-----------------------------------------------------------+
```

### Capas de la Aplicacion

1. **IconStrip (60px)**: Barra vertical fija de iconos de navegacion, siempre visible
2. **Panel deslizable (200-600px)**: Contenido del panel seleccionado, redimensionable via drag
3. **Backend Rust (Tauri)**: Manejo de AppBar nativa via Win32 API

### Flujo de Datos

1. App se monta → `register_appbar(60)` → Win32 reserva 60px en borde derecho
2. Usuario click en icono → `resize_appbar(60 + 320)` → Panel se abre con animacion
3. Click mismo icono → `resize_appbar(60)` → Panel se cierra (toggle)
4. Drag del resize handle → `resize_appbar(60 + newWidth)` → Ajuste en tiempo real
5. App se cierra → `unregister_appbar()` → Libera reserva del shell

### Tauri Commands (Rust)

| Comando | Parametros | Descripcion |
|---------|-----------|-------------|
| `register_appbar` | `width: i32` | Registra ventana como AppBar en borde derecho via `SHAppBarMessage(ABM_NEW)` |
| `resize_appbar` | `width: i32` | Redimensiona AppBar via `SHAppBarMessage(ABM_SETPOS)` |
| `unregister_appbar` | — | Desregistra AppBar via `SHAppBarMessage(ABM_REMOVE)` |

### Estado Rust

```rust
pub struct AppBarHandle {
    pub hwnd: usize,        // Win32 HWND
    pub registered: bool,
    pub current_width: i32,
}
pub struct AppBarMutex(pub Mutex<AppBarHandle>);
```

---

## Estado Actual del Prototipo

### Resumen de Paneles

| # | Panel | Estado | Descripcion |
|---|-------|--------|-------------|
| 1 | Tasks | ✅ Implementado | Lista con busqueda, filtros estado/prioridad, subtareas, CRUD |
| 2 | Notes | ✅ Implementado | Notas con categorias, pin, busqueda, seccion fijadas |
| 3 | Contacts | ✅ Implementado | Directorio con grupos, busqueda multi-campo |
| 4 | Bookmarks | ✅ Implementado | Enlaces con colecciones, tags, favoritos, busqueda |
| 5 | Snippets | ✅ Implementado | Codigo con filtro por lenguaje, copia al clipboard |
| 6 | Projects | ✅ Implementado | Lista con filtros por estado, contador activos, CRUD |
| 7 | Shared | ✅ Implementado | Items compartidos con filtros por tipo de recurso |
| 8 | Reports | ✅ Implementado | Dashboard con stat cards, graficos de barras |
| 9 | Home | 📝 Placeholder | Solo titulo y mensaje de bienvenida |
| 10 | Files | 📝 Placeholder | Solo titulo y descripcion placeholder |
| 11 | Chat | 📝 Placeholder | Solo titulo y descripcion placeholder |
| 12 | Alerts | 📝 Placeholder | Solo titulo y mensaje "no new notifications" |
| 13 | Profile | 📝 Placeholder | Solo titulo y descripcion placeholder |
| 14 | Settings | 📝 Placeholder | Solo titulo y descripcion placeholder |

**Total**: 8 paneles funcionales con UI completa + datos mock, 6 paneles placeholder

---

## Detalle de Paneles Implementados

### Tasks

**Descripcion**: Panel de gestion de tareas con interfaz completa para crear, buscar y filtrar tareas por estado y prioridad. Incluye soporte para subtareas.

**Componentes UI**:
- Barra de busqueda: filtra por `title`
- Panel de filtros colapsable (toggle con badge de conteo de filtros activos): dos `<select>` para status y priority
- Boton "Nueva Tarea" (azul, full-width)
- Lista scrollable de `TaskCard` con subtareas
- Footer con contador "Mostrando N de M"
- Badge en header con conteo de tareas activas (no-done)
- Estado vacio con icono `CheckSquare`

**Tipos TypeScript (mock)**:
```typescript
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";
interface Subtask { id: string; title: string; completed: boolean; }
interface Task {
  id: string; title: string; description: string;
  status: TaskStatus; priority: TaskPriority;
  assignee: string; dueDate: string;
  comments: number; subtasks: Subtask[];
  createdAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/tasks/` — Listar tareas con filtros
- `POST /api/v1/tasks/` — Crear tarea
- `PATCH /api/v1/tasks/{id}/` — Actualizar tarea
- `DELETE /api/v1/tasks/{id}/` — Eliminar tarea

---

### Notes

**Descripcion**: Panel de notas organizadas por categorias con soporte para fijar notas importantes. Busqueda por titulo y contenido.

**Componentes UI**:
- Barra de busqueda: filtra por `title` o `content`
- Filtros pill horizontales scrollables: Todas / Trabajo / Personal / Ideas / Archivo
- Boton "Nueva Nota"
- Lista dividida en dos secciones: **Fijadas** (con icono Pin rotado) y **Otras notas**
- `NoteCard` con indicador de categoria
- Estado vacio con icono `StickyNote`

**Tipos TypeScript (mock)**:
```typescript
type NoteCategory = "work" | "personal" | "ideas" | "archive";
interface Note {
  id: string; title: string; content: string;
  category: NoteCategory; isPinned: boolean;
  tags: string[]; createdAt: string; updatedAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/notes/` — Listar notas con filtros
- `POST /api/v1/notes/` — Crear nota
- `PATCH /api/v1/notes/{id}/` — Actualizar nota
- `DELETE /api/v1/notes/{id}/` — Eliminar nota

---

### Contacts

**Descripcion**: Directorio de contactos organizado por grupos con busqueda multi-campo (nombre, email, empresa).

**Componentes UI**:
- Barra de busqueda: filtra por `firstName`, `lastName`, `email`, `company`
- Filtros pill horizontales: Todos / Clientes / Socios / Proveedores / Personal
- Boton "Nuevo Contacto"
- Lista scrollable de `ContactCard`
- Estado vacio con icono `Users`

**Tipos TypeScript (mock)**:
```typescript
type ContactGroup = "clients" | "partners" | "suppliers" | "personal";
interface Contact {
  id: string; firstName: string; lastName: string;
  email: string; phone: string; company: string;
  position: string; group: ContactGroup;
  isFavorite: boolean; notes: string; createdAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/contacts/` — Listar contactos con filtros
- `POST /api/v1/contacts/` — Crear contacto
- `PATCH /api/v1/contacts/{id}/` — Actualizar contacto
- `DELETE /api/v1/contacts/{id}/` — Eliminar contacto

---

### Bookmarks

**Descripcion**: Gestor de enlaces organizados por colecciones y tags con soporte para favoritos.

**Componentes UI**:
- Barra de busqueda: filtra por `title`, `url` o cualquier `tag`
- Filtros pill horizontales: Todas / Dev Resources / Tools / Databases / Design
- Boton "Nuevo Bookmark"
- Lista scrollable de `BookmarkCard` con handler `onToggleFavorite`
- Estado vacio con icono `Bookmark`

**Tipos TypeScript (mock)**:
```typescript
type BookmarkCollection = "dev-resources" | "tools" | "databases" | "design";
interface Bookmark {
  id: string; title: string; description: string;
  url: string; tags: string[]; collection: BookmarkCollection;
  isFavorite: boolean; createdAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/bookmarks/` — Listar bookmarks con filtros
- `POST /api/v1/bookmarks/` — Crear bookmark
- `PATCH /api/v1/bookmarks/{id}/` — Actualizar bookmark
- `DELETE /api/v1/bookmarks/{id}/` — Eliminar bookmark

---

### Snippets

**Descripcion**: Gestor de fragmentos de codigo con filtro por lenguaje y copia rapida al clipboard.

**Componentes UI**:
- Barra de busqueda: filtra por `title` o `description`
- Filtros pill horizontales: Todos / JavaScript / Python / Bash / SQL / CSS
- Boton "Nuevo Snippet"
- Lista scrollable de `SnippetCard` con boton Copy funcional (`navigator.clipboard.writeText`) y `onToggleFavorite`
- Estado vacio con icono `Code2`

**Tipos TypeScript (mock)**:
```typescript
type SnippetLanguage = "javascript" | "python" | "bash" | "sql" | "css";
interface Snippet {
  id: string; title: string; language: SnippetLanguage;
  description: string; code: string; tags: string[];
  isFavorite: boolean; createdAt: string; updatedAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/snippets/` — Listar snippets con filtros
- `POST /api/v1/snippets/` — Crear snippet
- `PATCH /api/v1/snippets/{id}/` — Actualizar snippet
- `DELETE /api/v1/snippets/{id}/` — Eliminar snippet

---

### Projects

**Descripcion**: Lista de proyectos con filtros por estado y contador de proyectos activos.

**Componentes UI**:
- Barra de busqueda: filtra por `name`
- Filtros pill horizontales: Todos / Activos / Pausados / Archivados
- Boton "Nuevo Proyecto"
- Lista scrollable de `ProjectCard`
- Header con badge "N activos"
- Estado vacio con icono `FolderKanban`

**Tipos TypeScript (mock)**:
```typescript
type ProjectStatus = "active" | "paused" | "archived";
interface Project {
  id: string; name: string; description: string;
  status: ProjectStatus; color: string;
  sections: number; items: number; members: number;
  startDate: string; endDate: string; createdAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/projects/` — Listar proyectos con filtros
- `POST /api/v1/projects/` — Crear proyecto
- `PATCH /api/v1/projects/{id}/` — Actualizar proyecto
- `DELETE /api/v1/projects/{id}/` — Eliminar proyecto

---

### Shared

**Descripcion**: Vista de items compartidos por otros usuarios, con filtros por tipo de recurso. Panel de solo lectura (sin boton crear).

**Componentes UI**:
- Barra de busqueda: filtra por `resourceName` o `sharedByName`
- Filtros pill horizontales: Todos / Proyectos / Tareas / Eventos / Documentos / Notas
- **Sin boton crear** (panel read-only de items compartidos)
- Lista scrollable de `SharedCard`
- Estado vacio con icono `Share2`

**Tipos TypeScript (mock)**:
```typescript
type ResourceType = "project" | "task" | "event" | "document" | "note";
type AccessLevel = "viewer" | "commenter" | "editor" | "admin";
interface SharedItem {
  id: string; resourceType: ResourceType; resourceName: string;
  sharedByName: string; accessLevel: AccessLevel;
  isInherited: boolean; parentResourceName?: string;
  message?: string; expiresAt?: string; createdAt: string;
}
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/shares/received/` — Listar items compartidos conmigo
- Ver [sharing-collaboration.md](sharing-collaboration.md) para detalle completo

---

### Reports

**Descripcion**: Dashboard de reportes con tarjetas de estadisticas y graficos de barras. Panel de solo lectura sin busqueda ni filtros.

**Componentes UI**:
- Header con badge "En vivo" (verde)
- Grid 2 columnas de `StatCard` (8 tarjetas): tareas activas, completadas, eventos, proyectos, miembros del equipo, notas, eventos de auditoria, almacenamiento
- 3 graficos de barras horizontales (CSS-only):
  - Tareas por estado (todo/in_progress/review/done)
  - Tareas por prioridad (low/medium/high/urgent)
  - Acciones de auditoria (create/update/delete/login)
- **Sin busqueda, filtros ni CRUD** (dashboard informativo)

**Tipos TypeScript (mock)**:
```typescript
interface StatItem {
  id: string; label: string; value: string | number;
  icon: string; color: string; change?: number;
}
interface ChartItem { label: string; value: number; }
interface ChartData { title: string; colorClass: string; items: ChartItem[]; }
```

**Endpoints API** (referencia a [api-endpoints.md](../technical/api-endpoints.md)):
- `GET /api/v1/reports/dashboard/` — Datos del dashboard
- Ver [admin-services.md](admin-services.md) para detalle completo de reportes

---

## Paneles Pendientes de Especificacion

Los siguientes 6 paneles tienen estructura basica (placeholder) en el prototipo. **La funcionalidad sera definida en iteraciones futuras**.

| Panel | Estado Actual | Contenido Placeholder |
|-------|--------------|----------------------|
| Home | `<h2>Home</h2>` | "Welcome to your sidebar." |
| Files | `<h2>Files</h2>` | "Browse and manage your files." |
| Chat | `<h2>Chat</h2>` | "Your conversations appear here." |
| Alerts | `<h2>Alerts</h2>` | "No new notifications." |
| Profile | `<h2>Profile</h2>` | "Your profile settings." |
| Settings | `<h2>Settings</h2>` | "Application settings." |

> **Nota**: No se incluyen user stories, requerimientos funcionales ni endpoints para estos paneles. Se agregaran cuando se especifique su funcionalidad.

---

## Componentes Compartidos

### IconStrip

Barra de iconos vertical fija (60px de ancho) que sirve como navegacion principal.

- **Posicion**: Columna izquierda de la sidebar, siempre visible
- **Estilo**: `bg-[#1e1e2e]`, flex-col con justify-between
- **Items superiores** (13): Home, Files, Chat, Alerts, Tasks, Notes, Contacts, Bookmarks, Projects, Snippets, Shared, Reports, Profile
- **Item inferior** (1): Settings
- **Props**: `activePanel: PanelId | null`, `onPanelChange: (panel: PanelId) => void`

| ID | Icono (lucide-react) | Label |
|----|---------------------|-------|
| home | `Home` | Home |
| files | `Files` | Files |
| chat | `MessageSquare` | Chat |
| alerts | `Bell` | Alerts |
| tasks | `CheckSquare` | Tareas |
| notes | `StickyNote` | Notas |
| contacts | `Users` | Contactos |
| bookmarks | `Bookmark` | Bookmarks |
| projects | `FolderKanban` | Proyectos |
| snippets | `Code2` | Snippets |
| shared | `Share2` | Compartidos |
| reports | `BarChart2` | Reportes |
| profile | `User` | Profile |
| settings | `Settings` | Settings |

### NavIcon

Icono individual de navegacion con tooltip y estado activo.

- **Dimensiones**: 40x40px, `rounded-lg`
- **Estado activo**: `bg-blue-600 text-white`
- **Estado inactivo**: `text-gray-400 hover:bg-gray-700`
- **Tooltip**: Aparece a la izquierda del icono en hover (`right-full`, transicion de opacidad)
- **Props**: `item: NavItem`, `isActive: boolean`, `onClick: () => void`

### PanelContainer

Contenedor de panel con handle de redimensionado via drag.

- **Ancho minimo**: 200px
- **Ancho maximo**: 600px
- **Ancho por defecto**: 320px
- **Animacion**: `transition-[width] duration-200` (deshabilitada durante drag)
- **Colapso**: `width: 0` cuando `activePanel === null`
- **Resize handle**: div de 4px en el borde izquierdo (`cursor-ew-resize`), arrastar hacia la izquierda aumenta ancho (panel anclado a la derecha)
- **Callback**: `onWidthChange(finalWidth)` al terminar drag → propaga a App → Tauri `resize_appbar`
- **Mapeo de paneles**: `PANEL_MAP: Record<PanelId, React.ComponentType>` para renderizar panel activo

---

## Consideraciones Tecnicas Desktop-Specific

### Windows AppBar API

La aplicacion se registra como un **Windows AppBar** usando la API nativa `SHAppBarMessage` a traves de Tauri commands en Rust:

1. **Registro** (`ABM_NEW`): Reserva espacio en el borde derecho de la pantalla. Las demas ventanas respetan este espacio (como la taskbar).
2. **Posicionamiento** (`ABM_QUERYPOS` + `ABM_SETPOS`): Consulta y establece la posicion/tamano del AppBar.
3. **Redimensionado** (`ABM_SETPOS` + `MoveWindow`): Actualiza el ancho cuando el usuario abre/cierra paneles o arrastra el handle.
4. **Desregistro** (`ABM_REMOVE`): Libera el espacio reservado al cerrar la app.
5. **Notificaciones** (`ABN_POSCHANGED`): Re-aserta la posicion cuando otras AppBars cambian.

### Window Subclass

Se instala una subclass en la ventana (`SetWindowSubclass`) para manejar:
- `WM_ACTIVATE` → notifica al shell via `ABM_ACTIVATE`
- `WM_WINDOWPOSCHANGED` → notifica al shell via `ABM_WINDOWPOSCHANGED`
- `APPBAR_CALLBACK` (WM_USER+1) con `ABN_POSCHANGED` → re-aserta posicion desde `CURRENT_WIDTH` atomic
- `WM_DESTROY` → remueve la subclass con `RemoveWindowSubclass`

### Cleanup Automatico

- Al destruir la ventana (`WindowEvent::Destroyed`), se ejecuta `unregister_appbar` como fallback de seguridad
- El `useEffect` cleanup en React tambien llama a `unregister_appbar` al desmontar

### Dimensiones por Defecto

| Elemento | Ancho |
|---------|-------|
| Icon Strip | 60px |
| Panel (default) | 320px |
| Panel (minimo) | 200px |
| Panel (maximo) | 600px |
| Total default (abierto) | 380px |
| Total (cerrado) | 60px |

---

## Feature Gates por Plan

La app desktop aplica los **mismos feature gates que el cliente web**. Cada panel respeta los limites del plan del usuario:

- **Tasks**: Limites de tareas segun plan (ver [billing.md](billing.md))
- **Notes**: Free 10 / Starter 100 / Pro 1,000 / Enterprise ilimitadas (ver [productivity-services.md](productivity-services.md))
- **Contacts**: Limites por plan (ver [productivity-services.md](productivity-services.md))
- **Bookmarks**: Limites por plan (ver [productivity-services.md](productivity-services.md))
- **Snippets**: Free 10 / Starter 50 / Pro ilimitados (ver [devops-services.md](devops-services.md))
- **Projects**: Limites por plan (ver [projects.md](projects.md))
- **Shared**: Segun permisos de comparticion (ver [sharing-collaboration.md](sharing-collaboration.md))
- **Reports**: Starter+ (ver [admin-services.md](admin-services.md))

Para detalle completo de limites por plan, ver [billing.md](billing.md).

---

## Permisos RBAC

La app desktop utiliza los **mismos permisos RBAC del cliente web**. No se requieren permisos adicionales para la version desktop.

Cada panel respeta la matriz de permisos existente:

| Rol | Tasks | Notes | Contacts | Bookmarks | Snippets | Projects | Shared | Reports |
|-----|-------|-------|----------|-----------|----------|----------|--------|---------|
| Owner | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | Ver todo | Ver todo |
| Service Manager | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | Ver todo | Ver todo |
| Member | CRUD | CRUD (propios) | CRUD (propios) | CRUD (propios) | CRUD (propios) | CRUD | Ver compartidos | Ver propios |
| Viewer | Leer | Leer | Leer | Leer | Leer | Leer | Ver compartidos | ❌ |

Para detalle completo de roles y permisos, ver [rbac-roles-permissions.md](../technical/rbac-roles-permissions.md).

---

## Navegacion

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Productivity Services](productivity-services.md)
- [➡️ Ver DevOps Services](devops-services.md)
- [➡️ Ver Admin Services](admin-services.md)
- [Ver Billing & Subscriptions](billing.md)
- [Ver RBAC Roles & Permissions](../technical/rbac-roles-permissions.md)
- [Ver API Endpoints](../technical/api-endpoints.md)

---

**Ultima actualizacion**: 2026-02-26
