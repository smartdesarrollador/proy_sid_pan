# UI/UX - Prototipos y Diseño

Documentación y prototipos de la interfaz de usuario del sistema de RBAC + Suscripciones.

## 📁 Contenido

### `prototype-react/` - Prototipo Interactivo

Prototipo funcional construido con React + Vite + Tailwind CSS.

**🚀 Quick Start:**

```bash
cd prototype-react
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

**Features:**
- ✅ Dashboard con métricas y actividad reciente
- ✅ Gestión de usuarios (tabla, búsqueda, invitación)
- ✅ Gestión de roles (grid, creación, detalles, herencia)
- ✅ Gestión de permisos (catálogo completo, scopes)
- ✅ Suscripciones (comparación de planes, facturas)
- ✅ Auditoría (timeline, filtros, exportación)

**Datos Mock:**
- 1 Tenant: Acme Corporation (Plan Professional)
- 5 Usuarios con diferentes roles
- 6 Roles (4 sistema + 2 custom)
- 28 Permisos organizados en 8 categorías
- 4 Planes de suscripción
- 5 Logs de auditoría
- 3 Facturas

Ver `prototype-react/README.md` para más detalles.

---

### `PROTOTYPE_GUIDE.md` - Guía Visual

Documentación completa del prototipo con:

- 📸 Wireframes ASCII de cada vista
- 🎯 Casos de uso detallados
- 🔄 Flujos de usuario paso a paso
- 🎨 Elementos de UI reutilizables
- ♿ Consideraciones de accesibilidad
- 📱 Diseño responsive

**Secciones principales:**
1. Dashboard
2. Gestión de Usuarios
3. Gestión de Roles
4. Gestión de Permisos
5. Suscripciones y Facturación
6. Auditoría
7. Flujos de Usuario

---

## 🎯 Propósito

Este prototipo permite:

1. **Validar flujos de usuario** antes de implementar backend
2. **Recolectar feedback** del equipo y stakeholders
3. **Identificar mejoras UX/UI** tempranas
4. **Refinar features** a incluir/descartar
5. **Alinear expectativas** entre producto, diseño y desarrollo

---

## 📊 Comparación con PRD

El prototipo implementa las user stories del PRD:

| PRD Section | Prototipo | Implementado |
|-------------|-----------|--------------|
| US-001: Registro Org | - | ⏳ Pendiente (login flow) |
| US-002: Login JWT | - | ⏳ Pendiente |
| US-003: Invitación | Modal invitación | ✅ |
| US-006: Crear Rol | Modal creación rol | ✅ |
| US-007: Asignar Rol | Tabla usuarios + roles | ✅ |
| US-012: Audit Logs | Timeline auditoría | ✅ |
| US-013: Selección Plan | Comparación planes | ✅ |
| US-020: Límites Uso | Progress bars dashboard | ✅ |

---

## 🔄 Workflow de Validación

### 1. Revisar Prototipo

```bash
cd prototype-react
npm install
npm run dev
```

### 2. Explorar Vistas

- Navega por todas las secciones del sidebar
- Prueba modales de creación/invitación
- Filtra y busca en tablas
- Revisa detalles de roles y permisos

### 3. Documentar Feedback

Usa la guía visual (`PROTOTYPE_GUIDE.md`) para referenciar secciones específicas.

**Formato sugerido:**

```markdown
## Feedback: [Componente/Vista]

**Issue/Sugerencia:**
Descripción del problema o mejora

**Ubicación:**
Dashboard > Card de Usuarios

**Propuesta:**
Solución o cambio propuesto

**Prioridad:**
Alta / Media / Baja

**Screenshot:**
[Adjuntar si es posible]
```

### 4. Iterar

- Actualiza `mockData.js` para nuevos escenarios
- Modifica componentes según feedback
- Re-genera build y comparte

---

## 🎨 Design System

### Colores

```css
Primary:   #3b82f6 (Blue 500)
Secondary: #6b7280 (Gray 500)
Success:   #10b981 (Green 500)
Warning:   #f59e0b (Yellow 500)
Danger:    #ef4444 (Red 500)
```

### Tipografía

- **Font Family**: System fonts (sans-serif)
- **Sizes**: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px)
- **Weights**: font-medium (500), font-semibold (600), font-bold (700)

### Spacing

- Padding: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- Gap: gap-2 (8px), gap-4 (16px), gap-6 (24px)

### Shadows

- `shadow-sm`: Subtle shadow para cards
- `shadow-md`: Medium shadow para hover
- `shadow-lg`: Large shadow para modales

---

## 📝 Notas de Implementación

### Limitaciones del Prototipo

⚠️ **No incluye:**
- Backend real / API calls
- Persistencia de datos
- Autenticación real
- Validaciones complejas
- Integración Stripe
- Envío real de emails

✅ **Sí incluye:**
- Navegación funcional
- Modales interactivos
- Filtros y búsqueda en memoria
- Estados visuales (hover, focus)
- Datos mock realistas

### Tech Stack del Prototipo

- **Framework**: React 18.2 (JSX)
- **Build Tool**: Vite 5.1
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **Utilities**: clsx

> **Nota**: Los prototipos usan React con JSX para rapidez de desarrollo. El código de producción usará TypeScript.

### Migración a Producción

El prototipo React (JSX) será **reemplazado** por código de producción con:

#### Frontend (según necesidades):

**Opción 1: React + Vite + TypeScript + Tailwind** (sin SEO)
- Aplicaciones internas (admin panels, dashboards)
- SPA donde SEO no es crítico
- Máxima velocidad de desarrollo y HMR
- TanStack Query para data fetching
- react-hook-form + Zod para validación

**Opción 2: Next.js + TypeScript + Tailwind** (con SEO)
- Páginas públicas (landing, marketing, docs)
- Aplicaciones donde SEO es crítico
- Server Components + Server Actions
- Metadata API para SEO completo
- ISR + Streaming para performance

#### Backend:
- **API**: Django REST Framework
- **Database**: PostgreSQL con RLS (Row Level Security)
- **Auth**: JWT + refresh tokens
- **Payments**: Stripe API
- **Cache**: Redis

---

## 📚 Recursos Relacionados

### Documentación del Proyecto

- **PRD Completo**: `/prd/rbac-subscription-system.md`
- **Diagramas UML**: `/docs/architecture/*.puml`
- **Arquitectura**: `/docs/architecture/README.md`

### Guías de Desarrollo

- **Backend Guide**: `/docs/guides/backend-setup.md` (pendiente)
- **Frontend Guide**: `/docs/guides/frontend-setup.md` (pendiente)

---

## 🤝 Contribuir

Para agregar nuevas vistas al prototipo:

1. Crea componente en `prototype-react/src/components/`
2. Agrega datos mock en `src/data/mockData.js`
3. Registra en `App.jsx` y `Sidebar.jsx`
4. Documenta en `PROTOTYPE_GUIDE.md`
5. Actualiza este README

---

## ❓ FAQ

**P: ¿Por qué React JSX en prototipos y TypeScript en producción?**
R: Los prototipos usan JSX para velocidad de desarrollo y validación rápida de UX. El código de producción usará TypeScript para type safety, mejor DX y mantenibilidad.

**P: ¿Cuándo usar React+Vite vs Next.js?**
R:
- **React+Vite**: Admin panels, dashboards internos, herramientas donde SEO no es necesario
- **Next.js**: Landing pages, sitios públicos, documentación, donde SEO es crítico

**P: ¿Los datos se persisten?**
R: No, es mock data. Refresh resetea todo. Para persistencia, usar localStorage (no implementado en prototipos).

**P: ¿Puedo modificar los colores?**
R: Sí, edita `tailwind.config.js` en la sección `theme.extend.colors`.

**P: ¿Cómo agrego más usuarios/roles mock?**
R: Edita `src/data/mockData.js` y agrega entries a los arrays correspondientes.

**P: ¿Se pueden reutilizar componentes del prototipo en producción?**
R: Parcialmente. La estructura y lógica de UI se pueden portar, pero se reescribirán con TypeScript, validación Zod y patrones de producción (custom hooks, Server Actions, etc.).

---

**Última actualización**: 2026-02-15
**Versión del Prototipo**: 1.0.0
**Estado**: ✅ Listo para revisión

---

## 🏗️ Stack Tecnológico del Proyecto

### Prototipos (Actual)
- React 18.2 + JSX
- Vite 5.1
- Tailwind CSS 3.4

### Producción (Desarrollo Real)

**Frontend SIN SEO** (Admin Panels, Dashboards):
- React 18+ + Vite 5+
- TypeScript 5+ (strict mode)
- Tailwind CSS 3+
- TanStack Query v5
- react-hook-form + Zod
- Zustand (state)

**Frontend CON SEO** (Landing, Docs, Marketing):
- Next.js 14+ (App Router)
- TypeScript 5+ (strict mode)
- Tailwind CSS 3+
- Server Components + Server Actions
- Metadata API + SEO optimization
- NextAuth.js v5

**Backend**:
- Django REST Framework
- PostgreSQL + Redis
- JWT Authentication
- Stripe API

> **Agentes disponibles**: Usa `react-vite-builder` para React+Vite o `nextjs-builder` para Next.js cuando desarrolles features de producción.
