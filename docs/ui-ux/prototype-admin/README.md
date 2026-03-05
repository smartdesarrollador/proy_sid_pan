# Prototipo Admin - Sistema RBAC + Suscripciones

Prototipo de **interfaz administrativa** para la gestión de roles, permisos, usuarios y suscripciones multi-tenant. Construido con **React 18** + **Vite** + **Tailwind CSS**.

## 🎯 Propósito

Este prototipo simula el **frontend de administración** del sistema, permitiendo a los administradores gestionar la plataforma completa. Está diseñado para validar flujos administrativos antes de la implementación backend.

## 🏗️ Arquitectura

En producción, este frontend administrativo es uno de los tres frontends del ecosistema:

```
┌─────────────────────────────────────┐
│     API / Base de Datos (Django)    │
│   (Usuarios, Roles, Permisos, etc)  │
└─────────────────────────────────────┘
      ↑              ↑            ↑
      │              │            │
┌─────┴─────┐  ┌─────┴────┐ ┌───┴──────┐
│  ADMIN    │  │   HUB    │ │WORKSPACE │
│ (este)    │  │ :3003    │ │  :3001   │
│ :3000     │  └────┬─────┘ └──────────┘
└───────────┘       │              ↑
                    └────[SSO]─────┘
```

**Nota importante**: Los datos mock en los prototipos son idénticos para simular que todos están conectados a la misma base de datos.

## 📋 Features Implementadas

### Dashboard Administrativo

- Vista general con métricas clave (usuarios, roles, storage, API calls)
- Alertas de límites de plan
- Actividad reciente (usuarios y audit logs)
- Progress bars de uso de recursos

### Gestión de Usuarios

- Tabla completa de usuarios con búsqueda y filtros
- Estados: Activo / Pendiente
- Indicadores de MFA habilitado/deshabilitado
- Modal de invitación de usuarios
- Asignación de roles múltiples por usuario

### Gestión de Roles

- Grid de roles predefinidos y personalizados
- Indicadores visuales de roles del sistema vs custom
- Contador de usuarios y permisos por rol
- Herencia de roles (parent role)
- Modal de creación de roles con selector de color
- Modal de detalles de rol con lista de permisos

### Gestión de Permisos

- Catálogo completo de permisos organizados por categoría
- Búsqueda y filtrado por categoría
- Visualización de scope (all, own, department)
- Indicadores de acción (create, read, update, delete)
- Color-coding por tipo de permiso

### Suscripciones y Facturación

- Comparación de planes (Free, Starter, Professional, Enterprise)
- Toggle mensual/anual con descuento
- Indicador de plan actual
- Alertas de uso de recursos
- Historial de facturas con descarga (simulada)
- Progress bars de límites (usuarios, storage, API calls)

### Auditoría

- Timeline de eventos con filtros
- Estado success/failed con iconos
- Detalles técnicos expandibles (IP, timestamp, user agent)
- Búsqueda en logs
- Exportación a CSV (simulada)
- Estadísticas de eventos

## 🚀 Instalación y Ejecución

### Prerequisitos

- Node.js 18+ y npm
- Git

### Pasos

```bash
# 1. Navegar al directorio del prototipo
cd docs/ui-ux/prototype-admin

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev

# 4. Abrir navegador
# El prototipo estará disponible en http://localhost:3000
```

## 🗂️ Estructura del Proyecto

```
prototype-admin/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Barra de navegación superior
│   │   ├── Sidebar.jsx             # Menú lateral administrativo
│   │   ├── Login.jsx               # Pantalla de login
│   │   ├── Dashboard.jsx           # Dashboard administrativo
│   │   ├── UserManagement.jsx      # Gestión de usuarios
│   │   ├── RoleManagement.jsx      # Gestión de roles
│   │   ├── PermissionManagement.jsx # Gestión de permisos
│   │   ├── SubscriptionManagement.jsx # Suscripción y facturación
│   │   ├── AuditLogs.jsx           # Logs de auditoría
│   │   └── shared/                 # Componentes reutilizables
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

- **1 Tenant**: Acme Corporation (Plan Professional)
- **5 Usuarios**: Con diferentes roles y estados
- **6 Roles**: 4 del sistema + 2 personalizados
- **39 Permisos**: Organizados en múltiples categorías
- **4 Planes**: Free, Starter, Professional, Enterprise
- **5 Logs de Auditoría**: Con acciones variadas
- **3 Facturas**: Historial de pagos
- **6 Tareas**: Para el sistema de tareas (compartidas con cliente)
- **4 Eventos**: Para el calendario (compartidos con cliente)

**Importante**: Estos datos mock son idénticos en `prototype-admin` y `prototype-workspace` para simular que ambos frontends consumen la misma base de datos.

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

### 1. Flujo de Invitación de Usuario

- Admin navega a "Usuarios"
- Click en "Invitar Usuario"
- Completa email y selecciona rol
- Envía invitación

### 2. Flujo de Creación de Rol Personalizado

- Admin navega a "Roles"
- Click en "Crear Rol"
- Define nombre, descripción, rol padre, color
- Guarda rol

### 3. Flujo de Upgrade de Plan

- Admin navega a "Suscripción"
- Compara planes
- Selecciona plan superior
- Confirma upgrade

### 4. Flujo de Auditoría

- Admin navega a "Auditoría"
- Filtra por acción específica
- Expande detalles técnicos
- Exporta reporte

## 🐛 Limitaciones del Prototipo

⚠️ **Este es un prototipo UI/UX, NO incluye:**

- Backend real (no hay API calls)
- Persistencia de datos (refresh resetea el estado)
- Autenticación real
- Validaciones de formularios complejas
- Integración con Stripe
- Envío real de emails

**Funcionalidad simulada:**

- Modales se muestran pero no ejecutan acciones
- Botones de acción muestran feedback visual
- Los datos se cargan de `mockData.js`

## 🔗 Prototipos Relacionados

**Prototype Hub** (portal central del cliente): `docs/ui-ux/prototype-hub-client/`

- Portal de entrada donde los clientes se registran, suscriben y acceden a sus servicios
- El admin gestiona el catálogo de servicios y planes que aparecen en el hub
- Puerto 3003

> **Nota**: El admin configura qué servicios están disponibles y en qué planes. El hub es la vitrina que ve el cliente.

**Prototype Workspace** (app de productividad): `docs/ui-ux/prototype-workspace/`

- Aplicación de productividad independiente (tareas, calendario, dashboard) accesible desde el hub
- Usa los mismos datos mock para simular la misma base de datos
- Puerto 3001

## 📚 Recursos Relacionados

- **PRD Completo**: `/prd/rbac-subscription-system.md`
- **Diagramas UML**: `/docs/architecture/*.puml`
- **Documentación Arquitectura**: `/docs/architecture/README.md`

---

**Creado:** 2026-02-09
**Actualizado:** 2026-02-11
**Tech Stack:** React 18.2 + Vite 5.1 + Tailwind CSS 3.4
**Tipo**: Frontend Administrativo
**Puerto**: 3000
