# Dark Mode & Theming

Guía completa de dark mode implementation con Tailwind CSS y TypeScript.

## Setup Dark Mode

### tailwind.config.ts

```ts
// tailwind.config.ts
const config: Config = {
  darkMode: 'class', // Usar 'dark' class en <html>
  // darkMode: 'media', // Usar prefers-color-scheme (auto)
};
```

## ThemeProvider Component

```tsx
// src/components/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme: 'light' | 'dark';

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);
    setActualTheme(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setActualTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

## Theme Toggle Button

```tsx
// src/components/ThemeToggle.tsx
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-1 rounded-md border border-gray-200 p-1 dark:border-gray-800">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'light' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
        )}
        title="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'dark' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
        )}
        title="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'system' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
        )}
        title="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
```

## Dark Mode Classes

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>

  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
    Button
  </button>
</div>
```

## Theme-Aware Components

```tsx
// Card con dark mode
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Card Title</h2>
  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

## Custom Theme Colors

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      colors: {
        background: {
          light: '#ffffff',
          dark: '#0a0a0a',
        },
        foreground: {
          light: '#0a0a0a',
          dark: '#ffffff',
        },
      },
    },
  },
};
```

```css
/* src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 4%;
}

.dark {
  --background: 0 0% 4%;
  --foreground: 0 0% 100%;
}
```

```tsx
<div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
  Theme-aware content
</div>
```

## Next.js Setup

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

## Resumen

Dark mode con Tailwind:
- ✅ ThemeProvider con light/dark/system
- ✅ localStorage persistence
- ✅ System preference detection
- ✅ `dark:` prefix para clases
- ✅ Theme toggle button
- ✅ CSS variables para themes custom
