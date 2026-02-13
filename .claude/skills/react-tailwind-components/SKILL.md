---
name: react-tailwind-components
description: >
  Guía completa de componentes React con Tailwind CSS y TypeScript usando utility-first approach.
  Usar cuando se necesite: setup de Tailwind, utility-first patterns, component variants, responsive design,
  dark mode, componentes base reutilizables (Button, Input, Card), composition patterns, plugins de Tailwind,
  performance optimization, accessibility.
  Incluye utility-first puro, headless components, TypeScript strict, variants pattern y producción-ready.
---

# React + Tailwind CSS Components - TypeScript

Guía completa para construir componentes React con Tailwind CSS usando utility-first approach, TypeScript y mejores prácticas de producción.

## ¿Qué es Tailwind CSS?

Tailwind CSS es un framework CSS **utility-first** que provee clases de bajo nivel para construir diseños custom sin escribir CSS.

**Filosofía:**
- ✅ **Utility-first**: Componer clases pequeñas (`flex`, `p-4`, `text-blue-600`)
- ✅ **No CSS custom**: Todo con utilities (evitar archivos `.css`)
- ✅ **Responsive**: Mobile-first con breakpoints (`sm:`, `md:`, `lg:`)
- ✅ **Dark mode**: Built-in con `dark:` prefix
- ✅ **Performance**: PurgeCSS automático (solo CSS usado)

## Instalación y Setup

### React + Vite

```bash
# Crear proyecto
npm create vite@latest my-app -- --template react-ts
cd my-app

# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Next.js

```bash
# Crear proyecto (Tailwind incluido)
npx create-next-app@latest my-app --typescript --tailwind

# O instalar manualmente
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configuración

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // React/Vite
    './app/**/*.{js,ts,jsx,tsx}', // Next.js App Router
    './pages/**/*.{js,ts,jsx,tsx}', // Next.js Pages Router
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        128: '32rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Utility-First Patterns

### Composición de Clases

```tsx
// ✅ Utility-first: componer clases
export default function Card() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Title</h2>
      <p className="mt-2 text-sm text-gray-600">Description</p>
    </div>
  );
}
```

```css
/* ❌ Evitar: CSS custom */
.card {
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: white;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

### Organización de Classes

```tsx
// ✅ Orden recomendado: Layout → Box Model → Typography → Visual → Misc
<div
  className={`
    flex items-center justify-between
    p-4 mx-auto max-w-4xl
    text-lg font-medium
    bg-white border border-gray-200 rounded-lg shadow-sm
    hover:shadow-md transition-shadow
  `}
>
  Content
</div>
```

## Component Variants con clsx/cn

### Instalación

```bash
npm install clsx tailwind-merge
```

### cn Utility (Recomendado)

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Beneficio:** `twMerge` resuelve conflictos (`p-4 p-6` → `p-6`).

### Button con Variants

```tsx
// src/components/Button.tsx
import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',

          // Variants
          {
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600':
              variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500':
              variant === 'secondary',
            'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500':
              variant === 'outline',
            'hover:bg-gray-100 focus-visible:ring-gray-500': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600':
              variant === 'danger',
          },

          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

**Uso:**
```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```

### Input Component

```tsx
// src/components/Input.tsx
import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-gray-300 focus-visible:ring-blue-600',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

## Responsive Design

### Breakpoints (Mobile-First)

```tsx
// Mobile first: base = mobile, luego agregar breakpoints
<div
  className={`
    w-full
    sm:w-1/2
    md:w-1/3
    lg:w-1/4
    xl:w-1/5
  `}
>
  Responsive Width
</div>
```

**Breakpoints:**
- Base: `0px` (mobile)
- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`
- `2xl`: `1536px`

### Grid Responsive

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id} />
  ))}
</div>
```

### Typography Responsive

```tsx
<h1 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">Responsive Text</p>
```

## Dark Mode

### Estrategia 1: Class-Based (Recomendado)

```ts
// tailwind.config.ts
const config: Config = {
  darkMode: 'class', // Usar 'dark' class
  // ...
};
```

```tsx
// src/components/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### Dark Mode Classes

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### Theme Toggle Button

```tsx
// src/components/ThemeToggle.tsx
'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
```

## Componentes Base Reutilizables

### Card Component

```tsx
// src/components/Card.tsx
import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        'dark:border-gray-800 dark:bg-gray-950',
        className
      )}
      {...props}
    />
  );
});

const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
});

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
        {...props}
      />
    );
  }
);

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
});

const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

**Uso:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badge Component

```tsx
// src/components/Badge.tsx
import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export default function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300':
            variant === 'default',
          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300':
            variant === 'success',
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300':
            variant === 'warning',
          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': variant === 'danger',
          'border border-gray-300 bg-transparent text-gray-700 dark:border-gray-700 dark:text-gray-300':
            variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
```

### Avatar Component

```tsx
// src/components/Avatar.tsx
import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
          {
            'h-8 w-8 text-xs': size === 'sm',
            'h-10 w-10 text-sm': size === 'md',
            'h-12 w-12 text-base': size === 'lg',
            'h-16 w-16 text-lg': size === 'xl',
          },
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span className="font-medium text-gray-600 dark:text-gray-400">
            {fallback || '?'}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
```

## Composition Patterns

### Compound Components

```tsx
// src/components/Tabs.tsx
import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  defaultValue,
  children,
}: {
  defaultValue: string;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1',
        'dark:bg-gray-800',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { activeTab, setActiveTab } = context;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
        'transition-all focus-visible:outline-none focus-visible:ring-2',
        activeTab === value
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-white'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return <div className="mt-2">{children}</div>;
}
```

**Uso:**
```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="password">Password settings</TabsContent>
</Tabs>
```

## Tailwind Plugins

### @tailwindcss/forms

```bash
npm install -D @tailwindcss/forms
```

```ts
// tailwind.config.ts
import forms from '@tailwindcss/forms';

const config: Config = {
  plugins: [forms],
};
```

**Beneficio:** Estilos base para inputs, selects, checkboxes.

### @tailwindcss/typography

```bash
npm install -D @tailwindcss/typography
```

```tsx
// Para contenido markdown/HTML
<article className="prose dark:prose-invert lg:prose-xl">
  <h1>Title</h1>
  <p>Content...</p>
</article>
```

## Performance y Build Optimization

### Content Configuration (Purge)

```ts
// tailwind.config.ts
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // NO incluir node_modules completo
  ],
};
```

**Importante:** Solo incluir archivos con clases de Tailwind.

### JIT Mode (Default en v3)

JIT (Just-in-Time) genera clases on-demand:
- ✅ Build más rápido
- ✅ CSS más pequeño
- ✅ Todas las variants disponibles

### Safelist (Clases Dinámicas)

```ts
// tailwind.config.ts
const config: Config = {
  safelist: [
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
    // O con pattern
    {
      pattern: /bg-(red|green|blue)-(500|600|700)/,
    },
  ],
};
```

**Cuándo usar:** Clases generadas dinámicamente que Tailwind no puede detectar.

## Accessibility (a11y)

### Focus States

```tsx
// Siempre incluir focus-visible
<button
  className={`
    px-4 py-2 rounded-md bg-blue-600 text-white
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
  `}
>
  Click me
</button>
```

### Disabled States

```tsx
<button
  disabled
  className={`
    px-4 py-2 rounded-md bg-blue-600 text-white
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  `}
>
  Disabled
</button>
```

### Screen Reader Only

```tsx
<span className="sr-only">Loading...</span>
```

**Utility:** Oculta visualmente pero accesible para screen readers.

## Mejores Prácticas

### ✅ Do's
1. **Utility-first** - Componer clases, no escribir CSS
2. **cn utility** - Usar `cn()` para clases condicionales
3. **Variants pattern** - Props para variants (size, color)
4. **Mobile-first** - Base = mobile, luego breakpoints
5. **Dark mode** - Usar `dark:` prefix
6. **forwardRef** - Para componentes reutilizables
7. **TypeScript strict** - Tipar todas las props
8. **Accessibility** - focus-visible, disabled, sr-only

### ❌ Don'ts
1. **No inline styles** - Usar utilities
2. **No @apply** - Evitar en producción (usar componentes)
3. **No clases custom** - Usar utilities o extend theme
4. **No strings largos** - Usar cn() y template literals
5. **No safelist innecesario** - Solo para clases dinámicas

## Referencias Adicionales

Para contenido detallado y ejemplos avanzados, consulta:

- **[Setup & Configuration](references/setup-configuration.md)** - Setup completo, theme customization
- **[Component Variants](references/component-variants.md)** - Variants pattern, clsx/cn, cva library
- **[Base Components](references/base-components.md)** - Biblioteca completa de componentes
- **[Dark Mode & Theming](references/dark-mode-theming.md)** - Dark mode strategies, theme switching
- **[Responsive & Accessibility](references/responsive-accessibility.md)** - Responsive patterns, a11y best practices

---

**Resumen:** React + Tailwind CSS con utility-first approach elimina CSS custom, provee variants pattern con TypeScript, y optimiza performance con JIT. Componentes headless compatibles, dark mode built-in y accessibility first-class.
