# Prototipo UI/UX - Sistema RBAC + Suscripciones

Prototipo interactivo del sistema de gestión de roles, permisos y suscripciones multi-tenant construido con **React 18** + **Vite** + **Tailwind CSS**.

## 🎯 Propósito

Este prototipo permite visualizar y explorar la interfaz de usuario completa del sistema antes de la implementación backend, facilitando:

- ✅ Validación de flujos de usuario
- ✅ Identificación de mejoras UX/UI
- ✅ Feedback temprano del equipo y stakeholders
- ✅ Refinamiento de features a incluir/descartar

## 📋 Features Implementadas

### Dashboard
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
cd docs/ui-ux/prototype-react

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev

# 4. Abrir navegador
# El prototipo estará disponible en http://localhost:3000
```

## 🗂️ Estructura del Proyecto

```
prototype-react/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Barra de navegación superior
│   │   ├── Sidebar.jsx             # Menú lateral
│   │   ├── Dashboard.jsx           # Vista principal
│   │   ├── UserManagement.jsx      # Gestión de usuarios
│   │   ├── RoleManagement.jsx      # Gestión de roles
│   │   ├── PermissionManagement.jsx # Gestión de permisos
│   │   ├── SubscriptionManagement.jsx # Suscripción y facturación
│   │   └── AuditLogs.jsx           # Logs de auditoría
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
- **28 Permisos**: Organizados en 8 categorías
- **4 Planes**: Free, Starter, Professional, Enterprise
- **5 Logs de Auditoría**: Con acciones variadas
- **3 Facturas**: Historial de pagos

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

### Modificar navegación

Edita `src/components/Sidebar.jsx` para agregar/quitar items del menú.

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
- Filtra por acción específica (ej: "assign_role")
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

## 📝 Feedback y Mejoras

Para reportar issues o sugerir mejoras:

1. Documenta el flujo de usuario afectado
2. Adjunta screenshot si es posible
3. Indica si es bug UX o feature request
4. Envía feedback al equipo de producto

## 🚀 Próximos Pasos

Después de validar el prototipo:

1. ✅ Refinamiento de features (agregar/descartar según feedback)
2. ✅ Ajustes de UX basados en pruebas de usuario
3. 🔄 Implementación del backend (Django REST Framework)
4. 🔄 Migración a Angular 16+ standalone components
5. 🔄 Integración con APIs reales
6. 🔄 Testing E2E

## 📚 Recursos Relacionados

- **PRD Completo**: `/prd/rbac-subscription-system.md`
- **Diagramas UML**: `/docs/architecture/*.puml`
- **Documentación Arquitectura**: `/docs/architecture/README.md`

---

**Creado:** 2026-02-09
**Tech Stack:** React 18.2 + Vite 5.1 + Tailwind CSS 3.4
**Basado en:** PRD v1.0.0 y Diagramas UML del Sistema RBAC + Suscripciones
