# Prototype Workspace - Aplicación de Productividad

Prototipo de **aplicación independiente de productividad** (estilo Notion/Linear): dashboard personal, gestión de tareas, calendario y herramientas de trabajo. Construido con **React 18** + **Vite** + **Tailwind CSS**.

## 🎯 Propósito

Este prototipo simula una **aplicación de productividad independiente** — uno de los servicios ofrecidos dentro del ecosistema de la plataforma. Es la interfaz donde los usuarios trabajan con sus datos (tareas, calendario, notas, etc.) una vez que ya han accedido a la plataforma.

> **Importante**: Este prototipo **NO** es el panel de entrada del cliente. El punto de acceso central es `prototype-hub-client`, que actúa como portal unificado. Los usuarios llegan aquí desde el hub mediante SSO, no directamente.

## 📌 Rol en el Ecosistema

```
prototype-hub-client          →   [SSO]   →   prototype-workspace
(portal central,                        (servicio de productividad,
 suscripción, catálogo                   app independiente donde
 de servicios)                           el usuario trabaja)
```

- **`prototype-hub-client`** (puerto 3003): Portal de entrada. Gestiona registro, suscripción, catálogo de servicios adquiridos y acceso SSO a cada servicio.
- **`prototype-workspace`** (puerto 3001): Aplicación de productividad. El usuario llega aquí con un token SSO desde el hub y trabaja directamente con tareas, calendario, etc.

## 🏗️ Arquitectura

En producción, este servicio es consumido por usuarios que han sido autenticados mediante SSO desde el hub central:

```
┌─────────────────────────────────────┐
│     API / Base de Datos (Django)    │
│   (Usuarios, Roles, Tareas, etc)    │
└─────────────────────────────────────┘
    ↑              ↑              ↑
    │              │              │
┌───┴────┐   ┌────┴────┐   ┌────┴──────┐
│ ADMIN  │   │   HUB   │   │ WORKSPACE │
│ panel  │   │ (portal)│   │ (este)    │
│ :3000  │   │  :3003  │   │  :3001    │
└────────┘   └────────┘   └───────────┘
                  │              ↑
                  └────[SSO]─────┘
```

**Nota importante**: Los datos mock en los prototipos son compartidos para simular que todos están conectados a la misma base de datos.

## 📋 Features Implementadas

### Dashboard de Usuario

- Vista general personalizada con métricas del usuario
- Resumen de tareas pendientes y completadas
- Próximos eventos del calendario
- Actividad reciente
- Widgets interactivos

### Gestión de Tareas (Task Board)

- Vista Kanban con columnas: To Do, In Progress, In Review, Done
- Creación y edición de tareas
- Asignación de prioridad (alta, media, baja)
- Estados visuales con badges
- Drag & drop entre columnas (simulado)
- Filtrado por prioridad y estado
- Búsqueda de tareas

### Calendario

- Vista mensual de eventos
- Creación de eventos con fecha, hora y ubicación
- Categorías de eventos con colores
- Eventos recurrentes (daily, weekly, monthly)
- Detalles de evento con participantes
- Recordatorios (email, notificación)

### Componentes Compartidos

- Empty states para vistas sin datos
- Badges de prioridad y estado
- Date picker para selección de fechas
- Feature gates (control de acceso según plan)
- Prompts de upgrade para features premium

## 🚀 Instalación y Ejecución

### Prerequisitos

- Node.js 18+ y npm
- Git

### Pasos

```bash
# 1. Navegar al directorio del prototipo
cd docs/ui-ux/prototype-workspace

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev

# 4. Abrir navegador
# El prototipo estará disponible en http://localhost:3001
```

**Nota**: El puerto es **3001** para poder ejecutarse simultáneamente con el prototipo admin (puerto 3000).

## 🗂️ Estructura del Proyecto

```
prototype-workspace/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Barra de navegación superior
│   │   ├── Sidebar.jsx             # Menú lateral de servicios
│   │   ├── Login.jsx               # Pantalla de login
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.jsx   # Dashboard personal
│   │   │   └── widgets/            # Widgets del dashboard
│   │   │       ├── TasksWidget.jsx
│   │   │       ├── CalendarWidget.jsx
│   │   │       ├── MetricsWidget.jsx
│   │   │       └── ActivityWidget.jsx
│   │   ├── tasks/
│   │   │   ├── TaskBoard.jsx       # Tablero Kanban
│   │   │   ├── TaskList.jsx        # Lista de tareas
│   │   │   ├── TaskCard.jsx        # Tarjeta individual
│   │   │   └── TaskModal.jsx       # Modal de crear/editar
│   │   ├── calendar/
│   │   │   ├── Calendar.jsx        # Vista principal
│   │   │   ├── CalendarViews.jsx   # Vistas (month, week, day)
│   │   │   ├── EventCard.jsx       # Tarjeta de evento
│   │   │   └── EventModal.jsx      # Modal de crear/editar
│   │   └── shared/                 # Componentes reutilizables
│   │       ├── EmptyState.jsx
│   │       ├── PriorityBadge.jsx
│   │       ├── StatusBadge.jsx
│   │       ├── DatePicker.jsx
│   │       ├── FeatureGate.jsx
│   │       └── UpgradePrompt.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx         # Contexto de autenticación
│   ├── hooks/
│   │   └── usePermissions.js       # Hook de permisos
│   ├── data/
│   │   └── mockData.js             # Datos mock del sistema
│   ├── App.jsx                     # Componente principal
│   ├── main.jsx                    # Punto de entrada
│   └── index.css                   # Estilos globales
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 📊 Datos Mock

Los datos simulados en `src/data/mockData.js` incluyen:

- **5 Usuarios**: Con diferentes roles (compartidos con admin)
- **6 Tareas**: Con estados, prioridades y asignaciones
- **4 Eventos de Calendario**: Meetings, standups, presentaciones
- **Estadísticas por Usuario**: Tareas completadas, eventos próximos
- **Sistema de Permisos**: Control de acceso a features

**Importante**: Estos datos mock son **idénticos** a los del `prototype-admin` para simular que ambos frontends consumen la misma base de datos. Un usuario que gestiona tareas aquí, las vería también en el dashboard admin.

## 🔧 Comandos Disponibles

```bash
# Desarrollo (hot reload)
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview
```

## 🎯 Casos de Uso a Validar

### 1. Flujo de Creación de Tarea

- Usuario navega a "Tareas"
- Click en "Nueva Tarea"
- Completa título, descripción, prioridad, fecha
- Guarda tarea
- Tarea aparece en columna "To Do"

### 2. Flujo de Gestión de Tareas (Kanban)

- Usuario arrastra tarea de "To Do" a "In Progress"
- Edita tarea para agregar detalles
- Mueve tarea a "Done" al completar
- Filtra tareas por prioridad

### 3. Flujo de Creación de Evento

- Usuario navega a "Calendario"
- Click en fecha para crear evento
- Completa título, descripción, hora, ubicación
- Selecciona categoría y participantes
- Configura recordatorios
- Guarda evento

### 4. Flujo de Dashboard Personal

- Usuario accede a su dashboard
- Ve resumen de tareas pendientes
- Ve próximos eventos
- Click en widget para ir a vista completa

## 🐛 Limitaciones del Prototipo

⚠️ **Este es un prototipo UI/UX, NO incluye:**

- Backend real (no hay API calls)
- Persistencia de datos (refresh resetea el estado)
- Autenticación real
- Drag & drop real (simulado visualmente)
- Notificaciones push reales
- Sincronización en tiempo real

**Funcionalidad simulada:**

- Modales se muestran pero no guardan permanentemente
- Botones de acción muestran feedback visual
- Los datos se cargan de `mockData.js`
- El drag & drop solo muestra efectos visuales

## 🔗 Prototipos Relacionados

**Prototype Hub** (portal central): `docs/ui-ux/prototype-hub-client/`

- Portal de entrada del cliente: registro, suscripción y catálogo de servicios
- Gestiona el acceso SSO a este workspace y otros servicios
- Puerto 3003

**Prototype Admin**: `docs/ui-ux/prototype-admin/`

- Interfaz administrativa para gestionar la plataforma (usuarios, roles, billing, auditoría)
- Usa los mismos datos mock para simular la misma base de datos
- Puerto 3000

## 🎨 Personalización

### Cambiar colores del tema

Edita `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: {
        500: '#TU_COLOR',
        // ...
      }
    }
  }
}
```

### Agregar nuevos datos mock

Edita `src/data/mockData.js` y agrega entradas a los arrays correspondientes.

**Importante**: Si agregas datos en este prototipo, agrégalos también en `prototype-admin/src/data/mockData.js` para mantener la consistencia.

## 📚 Recursos Relacionados

- **PRD Completo**: `/prd/rbac-subscription-system.md`
- **Diagramas UML**: `/docs/architecture/*.puml`
- **Documentación Arquitectura**: `/docs/architecture/README.md`

---

**Creado:** 2026-02-11
**Tech Stack:** React 18.2 + Vite 5.1 + Tailwind CSS 3.4
**Tipo**: Frontend de Cliente
**Puerto**: 3001
