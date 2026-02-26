---
name: ui-layout-system
description: "Sistema de layout completo del proyecto extraído de los prototipos: navbar (h-16, fixed, z-30), sidebar (w-64, fixed, z-20, colapsable), main content (ml-64 pt-16), escala z-index, dark mode toggle con localStorage, ThemeContext pattern, responsive patterns (grids 1->2->4 col, sidebar mobile), skeleton loaders, empty states, CTA gradient box y overlays. Usar cuando se implemente el shell principal de cualquiera de los 4 frontends (Admin Panel, Client Panel, Digital Services SSR, Desktop App)."
---

# UI Layout System — Shell Principal de la Aplicación

Sistema de layout completo basado en `docs/ui-ux/prototype-admin/src/App.jsx`, `Navbar.jsx` y `Sidebar.jsx`.
Aplica a todos los frontends del proyecto con las adaptaciones necesarias por panel.

## 1. Estructura del Shell (App.tsx)

### 1.1 Layout raíz

```tsx
// src/App.tsx
import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    // Fondo de página
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Navbar — fixed top, z-30 */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Layout flex debajo del navbar */}
      <div className="flex">

        {/* Sidebar — fixed left, z-20 */}
        <Sidebar isOpen={sidebarOpen} />

        {/* Main content — empuja a la derecha cuando sidebar está abierto */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* pt-16 para compensar el navbar fixed */}
          <div className="p-8 pt-20">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
```

> **Nota:** En el prototipo, el `<main>` tiene `p-8` (sin `pt-16` explícito) porque el sidebar ya está posicionado `top-16`. El contenido empieza en `top: 64px + padding`. Si se usa `p-8` en el main, agregar `pt-[calc(4rem+2rem)]` o simplemente `pt-20`.

---

## 2. Navbar

### 2.1 Especificaciones

| Propiedad       | Valor                                              |
|-----------------|----------------------------------------------------|
| Altura          | `h-16` (64px)                                      |
| Posición        | `fixed w-full top-0`                               |
| Z-index         | `z-30`                                             |
| Fondo light     | `bg-white`                                         |
| Fondo dark      | `dark:bg-gray-800`                                 |
| Borde inferior  | `border-b border-gray-200 dark:border-gray-700`    |
| Padding lateral | `px-4`                                             |

### 2.2 Componente Navbar completo

```tsx
// components/Navbar.tsx
import { Menu, Bell, Settings, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

interface NavbarProps {
  onMenuClick: () => void;
  tenantName?: string;
  tenantSubdomain?: string;
  planLabel?: string;
  userName?: string;
  userEmail?: string;
  onNavigate?: (view: string) => void;
  onLogout?: () => void;
}

export function Navbar({
  onMenuClick,
  tenantName = 'Mi Empresa',
  tenantSubdomain = 'miempresa',
  planLabel = 'Professional',
  userName = 'Usuario',
  userEmail = '',
  onNavigate,
  onLogout,
}: NavbarProps) {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0">
      <div className="px-4 h-16 flex items-center justify-between">

        {/* ── Lado izquierdo: hamburger + logo ── */}
        <div className="flex items-center gap-4">
          {/* Botón hamburger */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Logo + nombre del tenant */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {tenantName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tenantName}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tenantSubdomain}.platform.com
              </p>
            </div>
          </div>
        </div>

        {/* ── Lado derecho: badges + acciones ── */}
        <div className="flex items-center gap-3">
          {/* Plan badge (solo visible en lg+) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium">
            <span className="w-2 h-2 bg-primary-500 dark:bg-primary-400 rounded-full" />
            Plan {planLabel}
          </div>

          {/* Toggle dark mode */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notificaciones */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {/* Badge de conteo */}
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
              3
            </span>
          </button>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-300" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Dropdown del usuario */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>

                <button
                  onClick={() => { onNavigate?.('settings'); setUserMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>

                <button
                  onClick={() => { onLogout?.(); setUserMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 3. Sidebar

### 3.1 Especificaciones

| Propiedad       | Valor                                              |
|-----------------|----------------------------------------------------|
| Ancho           | `w-64` (256px)                                     |
| Posición        | `fixed left-0 top-16`                              |
| Altura          | `h-[calc(100vh-4rem)]` (viewport - navbar)         |
| Z-index         | `z-20`                                             |
| Fondo light     | `bg-white`                                         |
| Fondo dark      | `dark:bg-gray-800`                                 |
| Borde derecho   | `border-r border-gray-200 dark:border-gray-700`    |
| Overflow        | `overflow-y-auto`                                  |
| Padding nav     | `p-4 space-y-1`                                    |
| Menu item       | `gap-3 px-4 py-3 rounded-lg text-sm font-medium`  |

### 3.2 Componente Sidebar completo

```tsx
// components/Sidebar.tsx
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  isOpen: boolean;
  activeView: string;
  onNavigate: (view: string) => void;
  menuItems: MenuItem[];
  showUpgradeCTA?: boolean;
  onUpgradeClick?: () => void;
}

export function Sidebar({
  isOpen,
  activeView,
  onNavigate,
  menuItems,
  showUpgradeCTA = false,
  onUpgradeClick,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">

      {/* Navegación principal */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>

              {/* Indicador de item activo */}
              {isActive && (
                <div className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* CTA de upgrade (condicional) */}
      {showUpgradeCTA && (
        <div className="p-4 mt-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-xl p-4 text-white">
            <h3 className="font-semibold text-sm mb-2">¿Necesitas más usuarios?</h3>
            <p className="text-xs text-primary-100 dark:text-primary-200 mb-3">
              Actualiza a Enterprise para usuarios ilimitados
            </p>
            <button
              onClick={onUpgradeClick}
              className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors"
            >
              Ver planes
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
```

### 3.3 Colapsar sidebar en mobile

```tsx
// Para mobile: el sidebar se oculta completamente con isOpen=false
// La transición del main content usa transition-all duration-300

<main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
```

Para un sidebar con overlay en mobile (no desplaza el contenido):

```tsx
// Sidebar mobile con overlay
{sidebarOpen && (
  <>
    {/* Overlay clickable para cerrar */}
    <div
      className="fixed inset-0 bg-black/50 z-10 md:hidden"
      onClick={() => setSidebarOpen(false)}
    />
    {/* Sidebar encima del overlay */}
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">
      {/* contenido */}
    </aside>
  </>
)}
```

---

## 4. Main Content Area

### 4.1 Especificaciones

| Propiedad           | Valor                                    |
|---------------------|------------------------------------------|
| Margin izquierdo    | `ml-64` (cuando sidebar abierto) / `ml-0` |
| Padding top navbar  | Compensado con `p-8` en el `<div>` interno |
| Padding estándar    | `p-8` (32px en todos lados)              |
| Transición          | `transition-all duration-300`            |
| Spacing secciones   | `space-y-6` (24px entre bloques)         |

### 4.2 Estructura de página típica

```tsx
// Patrón de página interna (Dashboard, Users, etc.)
function PageLayout() {
  return (
    <div className="space-y-6">

      {/* Header de página */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Usuarios
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Gestiona los usuarios de tu organización
        </p>
      </div>

      {/* Filtros / barra de acciones */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar..." className="input pl-9" />
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Contenido principal (tabla, cards, etc.) */}
      <div className="card overflow-hidden">
        {/* ... */}
      </div>

    </div>
  );
}
```

### 4.3 Grids responsive de dashboard

```tsx
// 4 métricas: 1 col → 2 col → 4 col
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map(stat => <MetricCard key={stat.label} {...stat} />)}
</div>

// 2 columnas: tabla + card lateral
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Tabla principal */}
  </div>
  <div>
    {/* Card de resumen */}
  </div>
</div>

// 3 columnas iguales
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>
```

---

## 5. Escala Z-index

```
z-50  →  Modales, dropdowns sobre overlay
z-30  →  Navbar (fixed top)
z-20  →  Sidebar (fixed left)
z-10  →  Elementos elevados dentro del contenido
z-0   →  Contenido base
```

```tsx
// Modal overlay: z-50
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">

// Navbar: z-30
<nav className="... fixed w-full z-30 top-0">

// Sidebar: z-20
<aside className="fixed left-0 top-16 ... z-20">

// Overlay de sidebar mobile: z-10
<div className="fixed inset-0 bg-black/50 z-10 md:hidden">

// Dropdown de navbar (notif, user menu): z-50
<div className="absolute right-0 mt-2 w-56 ... z-50">
```

---

## 6. Dark Mode — Implementación Completa

### 6.1 Hook useDarkMode

```tsx
// hooks/useDarkMode.ts
import { useEffect, useState } from 'react';

export function useDarkMode() {
  // Inicializar desde localStorage (default: light mode)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persistir preferencia
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  return { isDark, toggleDarkMode };
}
```

### 6.2 ThemeContext (patrón para múltiples componentes)

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

interface ThemeContextValue {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
```

### 6.3 ThemeToggle button

```tsx
// components/shared/ThemeToggle.tsx
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}
```

### 6.4 Setup en main.tsx

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Aplicar dark mode antes de renderizar para evitar flash
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 7. Overlays y Backdrops

### 7.1 Overlay de modal

```tsx
// fixed inset-0 cubre toda la pantalla
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
    {/* Contenido del modal */}
  </div>
</div>
```

### 7.2 Backdrop clickable para cerrar

```tsx
// El backdrop cierra el panel al hacer click fuera
<div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
  <div
    className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl"
    onClick={e => e.stopPropagation()}  // evitar que el click se propague
  >
    {/* Contenido del panel lateral */}
  </div>
</div>
```

### 7.3 Dropdown con backdrop invisible

```tsx
// Para dropdowns: usa useRef + useEffect para detectar clicks fuera
import { useRef, useEffect } from 'react';

function Dropdown({ isOpen, onClose, children }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      {children}
    </div>
  );
}
```

---

## 8. Responsive Patterns

### 8.1 Sidebar responsive

```tsx
// Desktop (md+): sidebar fijo a la izquierda
// Mobile: sidebar como drawer con overlay

function ResponsiveSidebar({ isOpen, onClose, ...props }: SidebarProps & { onClose: () => void }) {
  return (
    <>
      {/* Overlay solo en mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — drawer en mobile, fixed en desktop */}
      <aside className={clsx(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64',
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'z-20 overflow-y-auto transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        // En desktop siempre visible (pero puede colapsar el main)
        'md:block'
      )}>
        {/* Contenido del sidebar */}
      </aside>
    </>
  );
}
```

### 8.2 Navbar responsive

```tsx
// Ocultar elementos en pantallas pequeñas
<div className="hidden md:flex items-center gap-2 ...">  {/* Role badge */}
<div className="hidden lg:flex items-center gap-2 ...">  {/* Plan badge */}
<div className="hidden md:block text-left">             {/* Nombre de usuario */}
```

### 8.3 Grids responsive

```tsx
// Patrón principal del dashboard
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Contenido principal + sidebar info
className="grid grid-cols-1 lg:grid-cols-3 gap-6"

// Tabla scroll horizontal en mobile
<div className="overflow-x-auto">
  <table className="w-full min-w-[640px]">
    {/* ... */}
  </table>
</div>
```

---

## 9. Skeleton Loaders y Empty States

### 9.1 Skeleton de página completa

```tsx
// Skeleton del layout de dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>

      {/* Tabla skeleton */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 9.2 Empty State completo

```tsx
// Extraído de docs/ui-ux/prototype-admin/src/components/shared/EmptyState.jsx
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

---

## 10. CTA Gradient Box del Sidebar

```tsx
// Caja de upgrade en la parte inferior del sidebar
// Visible solo cuando el usuario puede mejorar su plan

function SidebarUpgradeCTA({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  return (
    <div className="p-4 mt-8">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-xl p-4 text-white">
        <h3 className="font-semibold text-sm mb-2">
          ¿Necesitas más usuarios?
        </h3>
        <p className="text-xs text-primary-100 dark:text-primary-200 mb-3">
          Actualiza a Enterprise para usuarios ilimitados
        </p>
        <button
          onClick={onUpgradeClick}
          className="w-full bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 text-xs font-medium py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors"
        >
          Ver planes
        </button>
      </div>
    </div>
  );
}
```

---

## 11. App.tsx Completo de Referencia

```tsx
// src/App.tsx — Shell completo con todos los patrones
import { useState } from 'react';
import {
  LayoutDashboard, Users, Settings, CreditCard,
  Shield, BarChart3, Bell, FileText,
} from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';

// Items del menú del Admin Panel
const MENU_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'users',      label: 'Usuarios',       icon: Users },
  { id: 'analytics',  label: 'Analytics',      icon: BarChart3 },
  { id: 'billing',    label: 'Facturación',    icon: CreditCard },
  { id: 'roles',      label: 'Roles',          icon: Shield },
  { id: 'audit',      label: 'Auditoría',      icon: FileText },
  { id: 'settings',   label: 'Configuración',  icon: Settings },
];

function AppContent() {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      // ... otras vistas
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        tenantName="Mi Empresa"
        tenantSubdomain="miempresa"
        planLabel="Professional"
        userName={`${currentUser?.firstName} ${currentUser?.lastName}`}
        userEmail={currentUser?.email}
        onNavigate={setActiveView}
        onLogout={logout}
      />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          activeView={activeView}
          onNavigate={setActiveView}
          menuItems={MENU_ITEMS}
          showUpgradeCTA={true}
          onUpgradeClick={() => setActiveView('subscription')}
        />

        {/* Main content: empujado por el sidebar */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* pt-16 compensa el navbar fixed (h-16) */}
          <div className="p-8 pt-24">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

> **Nota sobre `pt-24`:** El prototipo usa `p-8` en el `<div>` interno del main, lo que funciona porque el sidebar tiene `top-16` pero el contenido del main no tiene un offset top explícito — el scroll del body arranca desde 0. Para asegurarse de que el contenido no quede tapado por el navbar fixed, usar `pt-16` (altura del navbar) + `p-8` para el padding, o simplemente `pt-24` = 16+8px extra.
