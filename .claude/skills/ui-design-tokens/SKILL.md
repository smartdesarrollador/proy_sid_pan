---
name: ui-design-tokens
description: "Tokens de diseño fundamentales extraídos de los prototipos del proyecto (Admin Panel, Client Panel, Desktop App). Usar cuando se necesite: colores exactos del sistema (primary blue, grays, semánticos), tipografía, espaciado, sombras, border-radius, breakpoints, transiciones, dark mode, configuración de tailwind.config.js e iconografía con Lucide React. Incluye los pares light/dark para cada categoría y la configuración exacta verificada en los prototipos."
---

# UI Design Tokens — Sistema de Diseño del Proyecto

Referencia completa de todos los tokens de diseño extraídos y verificados directamente de los prototipos en
`docs/ui-ux/prototype-admin`, `docs/ui-ux/prototype-cliente` y `docs/ui-ux/prototype-desktop`.

## 1. Configuración Tailwind

### tailwind.config.js (idéntico en todos los frontends)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode por clase en el elemento <html>
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        }
      }
    },
  },
  plugins: [],
}
```

> **Nota:** Ambos prototipos (admin y cliente) usan exactamente la misma paleta `primary`. No hay diferencias entre frontends.

---

## 2. Paleta de Colores

### 2.1 Primary Blue (escala completa)

| Token             | Hex       | Uso principal                                 |
|-------------------|-----------|-----------------------------------------------|
| `primary-50`      | `#eff6ff` | Fondo de item activo sidebar (light)           |
| `primary-100`     | `#dbeafe` | Fondo hover/seleccionado suave                 |
| `primary-200`     | `#bfdbfe` | Bordes primarios suaves                        |
| `primary-300`     | `#93c5fd` | Texto primario en dark mode (muted)            |
| `primary-400`     | `#60a5fa` | Indicadores activos en dark, dot badge         |
| `primary-500`     | `#3b82f6` | Color base, focus rings, gradiente inicio      |
| `primary-600`     | `#2563eb` | Botones primary, avatares, logo box            |
| `primary-700`     | `#1d4ed8` | Hover de botones primary, gradiente fin        |
| `primary-800`     | `#1e40af` | Texto primario oscuro                          |
| `primary-900`     | `#1e3a8a` | Fondo item activo sidebar (dark)               |
| `primary-950`     | `#172554` | Más oscuro, casi nunca usado                   |

### 2.2 Grays (Tailwind defaults usados)

```tsx
// Fondos de página
bg-gray-50    // #f9fafb — página light
bg-gray-900   // #111827 — página dark

// Superficies (cards, navbar, sidebar)
bg-white           // Superficie light
bg-gray-800        // #1f2937 — Superficie dark

// Bordes
border-gray-200    // #e5e7eb — borde light
border-gray-700    // #374151 — borde dark

// Texto principal
text-gray-900      // #111827 — texto light
text-gray-100      // #f3f4f6 — texto dark

// Texto secundario / muted
text-gray-600      // #4b5563 — muted light
text-gray-300      // #d1d5db — muted dark

// Texto terciario / placeholder
text-gray-500      // #6b7280 — placeholder light
text-gray-400      // #9ca3af — placeholder dark

// Fondos de inputs
bg-white           // Input light
bg-gray-700        // #374151 — Input dark

// Hover de items
hover:bg-gray-100  // hover light
hover:bg-gray-700  // hover dark

// Hover más sutil
hover:bg-gray-50   // menu item hover light
hover:bg-gray-700  // menu item hover dark
```

### 2.3 Colores Semánticos

```tsx
// Success / Verde
bg-green-100   text-green-700     // badge success light
bg-green-900/30 text-green-300   // badge success dark
bg-green-500                      // indicador dot / icon bg

// Warning / Naranja
bg-orange-100  text-orange-700   // badge warning / priority media light
bg-orange-900/30 text-orange-300 // badge warning dark

// Danger / Rojo
bg-red-100     text-red-700      // badge danger / priority alta light
bg-red-900/30  text-red-300      // badge danger dark
bg-red-500                        // notification dot, error badge bg
text-red-600   dark:text-red-400 // logout text link

// Info / Azul
bg-blue-100    text-blue-700     // badge info / in_progress light
bg-blue-900/30 text-blue-300    // badge info dark
bg-blue-500                       // indicador dot

// Purple (estado in_review)
bg-purple-100  text-purple-700   // badge in_review light
bg-purple-900/30 text-purple-300 // badge in_review dark
```

### 2.4 Colores de Roles (generados dinámicamente)

Los roles en el Admin Panel usan colores con opacidad `${color}20` para el fondo y el color puro para el texto.
Se obtienen desde `usePermissions().getRoleColor()`.

```tsx
// Patrón para role badge con color dinámico
<div
  style={{
    backgroundColor: `${roleColor}20`,  // 12.5% opacidad del color
    color: roleColor
  }}
  className="px-3 py-1.5 rounded-lg text-sm font-medium"
>
  <Shield className="w-4 h-4" />
  {roleName}
</div>
```

### 2.5 Overlays y Fondos Translúcidos

```tsx
// Overlay de modal/dropdown
bg-black/50         // rgba(0,0,0,0.5) — fondo de modal overlay

// Fondo de item activo sidebar (con opacidad Tailwind)
bg-primary-50 dark:bg-primary-900/30

// Fondo de notificación no leída
bg-primary-50 dark:bg-primary-900/20

// Fondo de plan badge en navbar
bg-primary-50 dark:bg-primary-900/30

// Fondo del CTA gradient en sidebar
bg-gradient-to-br from-primary-500 to-primary-700
dark:from-primary-600 dark:to-primary-800
```

---

## 3. Tipografía

### 3.1 Font Family

```tsx
// System font stack (sin override en tailwind.config.js — usa Tailwind default)
font-sans  // system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif
```

### 3.2 Escala de tamaños

| Clase Tailwind | Tamaño rem | px equiv. | Uso típico                                    |
|----------------|-----------|-----------|-----------------------------------------------|
| `text-[10px]`  | —         | 10px      | Contador de notificaciones (badge número)     |
| `text-[11px]`  | —         | 11px      | Timestamps en notificaciones                  |
| `text-xs`      | 0.75rem   | 12px      | Labels de sub-info, badges, help text         |
| `text-sm`      | 0.875rem  | 14px      | Texto principal de UI, botones, inputs        |
| `text-base`    | 1rem      | 16px      | Texto de párrafo (raro en UI)                 |
| `text-lg`      | 1.125rem  | 18px      | Títulos de sección secundaria                 |
| `text-xl`      | 1.25rem   | 20px      | —                                             |
| `text-2xl`     | 1.5rem    | 24px      | Valores de métricas en dashboard cards        |
| `text-3xl`     | 1.875rem  | 30px      | Títulos de página principales                 |

### 3.3 Pesos de fuente

```tsx
font-medium    // 500 — texto UI estándar, labels
font-semibold  // 600 — nombres, títulos de sección, CTA
font-bold      // 700 — valores de métricas, headings principales, logo
```

### 3.4 Patrones de uso en la UI

```tsx
// Título de página principal
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
  Dashboard
</h1>

// Subtítulo / descripción de página
<p className="text-gray-600 dark:text-gray-300 mt-1">
  Resumen de tu organización
</p>

// Nombre de tenant en navbar (dos líneas)
<h1 className="text-sm font-semibold text-gray-900 dark:text-white">
  {tenant.name}
</h1>
<p className="text-xs text-gray-500 dark:text-gray-400">
  {tenant.subdomain}.platform.com
</p>

// Valor grande en metric card
<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
  {value}
</h3>

// Label de metric card
<p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
  {label}
</p>
```

---

## 4. Espaciado

### 4.1 Escala base (4px = 1 unidad Tailwind)

| Clase     | px   | Uso típico                                         |
|-----------|------|----------------------------------------------------|
| `p-1`     | 4px  | Padding mínimo (badges, dots)                      |
| `p-2`     | 8px  | Botones icon, avatar wrapper, toggle               |
| `p-3`     | 12px | Filas de tabla, notificaciones                     |
| `p-4`     | 16px | Padding estándar (nav, sidebar items, card padding)|
| `p-6`     | 24px | Contenido de cards, padding de secciones           |
| `p-8`     | 32px | Padding del main content                           |
| `p-12`    | 48px | Empty states                                       |
| `px-2.5`  | 10px | Padding horizontal de badges                       |
| `py-0.5`  | 2px  | Padding vertical de badges (muy compacto)          |
| `py-1.5`  | 6px  | Plan badge, role badge en navbar                   |
| `py-2`    | 8px  | Botones estándar, menu items                       |
| `py-3`    | 12px | Menu items del sidebar, filas                      |

### 4.2 Patrones de espaciado por componente

```tsx
// Sidebar menu item
className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium"

// Navbar height
className="h-16"  // 64px

// Card padding
className="card p-6"

// Dashboard section spacing
className="space-y-6"

// Stats grid gap
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Navbar items gap
className="flex items-center gap-3"  // entre elementos del navbar
className="flex items-center gap-4"  // gap logo + texto
```

### 4.3 Margin y separaciones

```tsx
mt-1   // 4px  — entre título y subtítulo de página
mt-2   // 8px  — entre elementos inline
mt-4   // 16px — separación moderada
mt-8   // 32px — separación de sección (CTA en sidebar)
mb-1   // 4px  — debajo de valor en metric card
mb-2   // 8px  — debajo de nombre en user menu
mb-3   // 12px — debajo de label en metric card
mb-4   // 16px — debajo de icono en empty state
mb-6   // 24px — debajo de descripción en empty state
```

---

## 5. Sombras

| Clase         | Uso                                                    |
|---------------|--------------------------------------------------------|
| `shadow-sm`   | Cards en estado normal (`.card` usa `shadow-sm`)       |
| `shadow-md`   | Cards en hover (`.card-hover` usa `hover:shadow-md`)   |
| `shadow-lg`   | Dropdowns, paneles desplegables (notif, user menu)     |
| `shadow-xl`   | Modales, overlays principales                          |

```tsx
// Dropdown/panel flotante (notificaciones, user menu)
className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"

// Card base
className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"

// Card con hover
className="card card-hover"  // shadow-sm → shadow-md on hover
```

---

## 6. Border Radius

| Clase          | px   | Uso principal                                          |
|----------------|------|--------------------------------------------------------|
| `rounded`      | 4px  | Elementos muy pequeños                                 |
| `rounded-lg`   | 8px  | Botones, inputs, menu items, logo box, plan badge      |
| `rounded-xl`   | 12px | Cards (`.card`), icon bg en metric cards               |
| `rounded-2xl`  | 16px | Modales, CTA box del sidebar                           |
| `rounded-full` | 50%  | Avatares, badges de estado (pill shape), dots          |

```tsx
// Botón estándar
className="px-4 py-2 rounded-lg"

// Card
className="rounded-xl"

// CTA sidebar / modal
className="rounded-xl"  // (dentro del padding del sidebar)

// Avatar / indicator dot
className="rounded-full"

// Badge pill
className="rounded-full text-xs px-2.5 py-0.5"
```

---

## 7. Breakpoints

### 7.1 Escala de breakpoints (Tailwind defaults)

| Prefijo | px    | Uso en el proyecto                                       |
|---------|-------|----------------------------------------------------------|
| (base)  | 0px   | Mobile first                                             |
| `sm:`   | 640px | Raro — generalmente `md:` es el primer breakpoint        |
| `md:`   | 768px | Aparece role badge en navbar, grid 2 columnas             |
| `lg:`   | 1024px| Aparece plan badge en navbar, grid 4 columnas             |
| `xl:`   | 1280px| Layouts más amplios                                      |
| `2xl:`  | 1536px| Desktop app ancho                                        |

### 7.2 Patrones responsive usados

```tsx
// Stats grid: 1 col → 2 col → 4 col
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Ocultar en mobile
className="hidden md:flex"   // role badge en navbar
className="hidden md:block"  // nombre de usuario en navbar
className="hidden lg:flex"   // plan badge en navbar

// Texto truncado
className="truncate"
className="line-clamp-2"
```

---

## 8. Transiciones y Animaciones

### 8.1 Clases de transición

```tsx
// Transición genérica (la más usada)
transition-all duration-200

// Solo transición de colores (hover de botones, links)
transition-colors

// Solo transición de sombra (card-hover)
transition-shadow

// Sidebar (colapsar/expandir)
transition-all duration-300
```

### 8.2 Patrones hover/focus

```tsx
// Botón icon de navbar (menu, bell, theme)
className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"

// Menu item sidebar
className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all"

// Focus ring (inputs, botones)
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2

// Focus ring de input (sin offset)
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
```

### 8.3 Skeleton / Loading (animate-pulse)

```tsx
// Skeleton loader genérico
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
</div>
```

---

## 9. Dark Mode Tokens

### 9.1 Pares light/dark por categoría

```tsx
// Fondos de página
bg-gray-50        dark:bg-gray-900

// Superficies (navbar, sidebar, cards)
bg-white          dark:bg-gray-800

// Bordes
border-gray-200   dark:border-gray-700
divide-gray-100   dark:divide-gray-700  // (tablas, listas)

// Texto principal
text-gray-900     dark:text-white
// Texto secundario
text-gray-600     dark:text-gray-300
// Texto muted / placeholders
text-gray-500     dark:text-gray-400
// Texto muy muted / timestamps
text-gray-400     dark:text-gray-500

// Inputs
bg-white          dark:bg-gray-700
border-gray-300   dark:border-gray-600

// Hover de elementos interactivos
hover:bg-gray-100 dark:hover:bg-gray-700
hover:bg-gray-50  dark:hover:bg-gray-700   // (más sutil)

// Item activo del sidebar
bg-primary-50     dark:bg-primary-900/30
text-primary-700  dark:text-primary-300

// Badges semánticos (con opacidad en dark)
bg-blue-100   text-blue-700    dark:bg-blue-900/30   dark:text-blue-300
bg-green-100  text-green-700   dark:bg-green-900/30  dark:text-green-300
bg-red-100    text-red-700     dark:bg-red-900/30    dark:text-red-300
bg-purple-100 text-purple-700  dark:bg-purple-900/30 dark:text-purple-300
bg-orange-100 text-orange-700  dark:bg-orange-900/30 dark:text-orange-300
bg-gray-100   text-gray-700    dark:bg-gray-700       dark:text-gray-200

// Gradientes en dark
from-primary-500 to-primary-700   →   dark:from-primary-600 dark:to-primary-800
```

---

## 10. Iconografía

### 10.1 Librería: Lucide React

```bash
npm install lucide-react
```

### 10.2 Tamaños estándar

| Clase Tailwind    | Tamaño | Uso                                           |
|-------------------|--------|-----------------------------------------------|
| `w-4 h-4`         | 16px   | Iconos inline en texto, chevrons, dots        |
| `w-5 h-5`         | 20px   | Iconos de navbar (Bell, Menu, Sun/Moon)       |
| `w-6 h-6`         | 24px   | Iconos en metric cards (sobre fondo coloreado)|
| `w-8 h-8`         | 32px   | Iconos en empty states                        |

### 10.3 Iconos usados en el proyecto

```tsx
import {
  // Layout / Navegación
  Menu, LayoutDashboard, Settings, ChevronDown, ChevronRight,

  // Usuarios y Roles
  User, Users, Shield, Key, Lock, Building2,

  // Acciones
  LogOut, Bell, Search, Plus, Edit, Trash2, Eye,

  // Datos / Métricas
  TrendingUp, Activity, BarChart3, FileBarChart, FileText,

  // Estados
  CheckCircle2, AlertCircle, XCircle, Info,

  // Tema
  Sun, Moon,

  // Facturación
  CreditCard, Receipt, Tag,

  // Misc
  Headphones, ExternalLink,
} from 'lucide-react';

// Uso en sidebar (tamaño w-5 h-5)
<Icon className="w-5 h-5" />

// Uso en navbar (tamaño w-5 h-5)
<Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />

// Uso en metric card (tamaño w-6 h-6 sobre fondo coloreado)
<Icon className="w-6 h-6 text-white" />
```

### 10.4 Logo box

```tsx
// Logo cuadrado con inicial (navbar y CTA)
<div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-sm">
    {name.charAt(0)}
  </span>
</div>
```

---

## 11. Progress Bars

```tsx
// Progress bar en metric cards del dashboard
<div className="mt-4">
  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
    <span>{stat.change}</span>
    <span>{Math.round(percentage)}%</span>
  </div>
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
    <div
      className="h-1.5 rounded-full bg-primary-500"
      style={{ width: `${percentage}%` }}
    />
  </div>
</div>
```

---

## 12. Dependencias del Sistema de Diseño

```json
{
  "dependencies": {
    "lucide-react": "^0.x",
    "clsx": "^2.x"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

> `clsx` se usa en el sidebar para combinar clases condicionalmente: `className={clsx('base-classes', isActive && 'active-classes')}`.
