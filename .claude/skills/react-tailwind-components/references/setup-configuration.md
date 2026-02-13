# Setup & Configuration

Guía completa de setup y configuración de Tailwind CSS en React/Next.js con TypeScript y customización avanzada.

## Instalación

### React + Vite

```bash
# Crear proyecto
npm create vite@latest my-app -- --template react-ts
cd my-app

# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Instalar utilities recomendadas
npm install clsx tailwind-merge
```

### Next.js 14+

```bash
# Crear proyecto (Tailwind incluido)
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd my-app

# Instalar utilities recomendadas
npm install clsx tailwind-merge
```

### Create React App (Legacy)

```bash
# Crear proyecto
npx create-react-app my-app --template typescript
cd my-app

# Instalar Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# CRACO para override config (necesario en CRA)
npm install -D @craco/craco
```

## Configuración Básica

### tailwind.config.ts

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
    extend: {},
  },
  plugins: [],
};

export default config;
```

### postcss.config.js

```js
// postcss.config.js (creado automáticamente con -p flag)
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### CSS Entry Point

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Theme Customization

### Colors

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#64748b',
          900: '#0f172a',
        },
        // Semantic colors
        success: {
          DEFAULT: '#22c55e',
          light: '#86efac',
          dark: '#16a34a',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fca5a5',
          dark: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
          dark: '#d97706',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#2563eb',
        },
      },
    },
  },
};

export default config;
```

**Uso:**
```tsx
<div className="bg-primary-500 text-white">Primary Background</div>
<div className="bg-success text-white">Success</div>
```

### Typography

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
        display: ['Poppins', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem', // 10px
        xs: '0.75rem', // 12px
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem', // 48px
        '6xl': '3.75rem', // 60px
        '7xl': '4.5rem', // 72px
        '8xl': '6rem', // 96px
        '9xl': '8rem', // 128px
      },
      lineHeight: {
        tighter: '1.1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
    },
  },
};
```

**Uso:**
```tsx
<h1 className="font-display text-5xl font-bold">Display Heading</h1>
<code className="font-mono text-sm">const foo = 'bar';</code>
```

### Spacing

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      spacing: {
        13: '3.25rem', // 52px
        15: '3.75rem', // 60px
        17: '4.25rem', // 68px
        18: '4.5rem', // 72px
        19: '4.75rem', // 76px
        21: '5.25rem', // 84px
        128: '32rem', // 512px
        144: '36rem', // 576px
      },
    },
  },
};
```

**Uso:**
```tsx
<div className="p-18 mx-128">Content</div>
```

### Breakpoints

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
  },
};
```

**Uso:**
```tsx
<div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  Content
</div>
```

### Border Radius

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
    },
  },
};
```

### Shadows

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.6)',
      },
    },
  },
};
```

**Uso:**
```tsx
<div className="shadow-glow">Glowing Box</div>
```

### Animation

```ts
// tailwind.config.ts
const config: Config = {
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
};
```

**Uso:**
```tsx
<div className="animate-fade-in">Fade In</div>
<div className="animate-slide-up">Slide Up</div>
```

## Custom Utilities

### @layer utilities

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
```

**Uso:**
```tsx
<div className="glass">Glass morphism effect</div>
<div className="scrollbar-hide">Hidden scrollbar</div>
```

### Plugin API

```ts
// tailwind.config.ts
import plugin from 'tailwindcss/plugin';

const config: Config = {
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.2)',
        },
      });
    }),
  ],
};
```

## cn Utility (Recomendado)

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes without conflicts
 * Combines clsx for conditional classes + twMerge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Uso:**
```tsx
import { cn } from '@/lib/utils';

function Button({ variant, className }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md', // Base
        variant === 'primary' && 'bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        className // User overrides
      )}
    >
      Button
    </button>
  );
}

// Último className gana
<Button className="bg-red-600" /> // Red background (overrides variant)
```

## Content Configuration (PurgeCSS)

```ts
// tailwind.config.ts
const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',

    // ⚠️ NO incluir node_modules completo (excepto packages específicos)
    // './node_modules/**/*.js', // ❌ Mala idea

    // ✅ Solo packages que usen Tailwind
    './node_modules/@my-org/components/**/*.{js,ts,jsx,tsx}',
  ],
};
```

### Safelist (Clases Dinámicas)

```ts
// tailwind.config.ts
const config: Config = {
  safelist: [
    // Explicit classes
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',

    // Pattern matching
    {
      pattern: /bg-(red|green|blue)-(400|500|600)/,
      variants: ['hover', 'focus'],
    },

    // Dynamic text colors
    {
      pattern: /text-(red|green|blue|yellow|purple)-(500|600|700)/,
    },
  ],
};
```

**Cuándo usar:** Solo cuando generas clases dinámicamente que Tailwind no puede detectar:

```tsx
// ❌ Necesita safelist (Tailwind no puede detectar)
const colors = ['red', 'green', 'blue'];
<div className={`bg-${colors[0]}-500`}>Bad</div>

// ✅ No necesita safelist (Tailwind puede detectar)
const colorClasses = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
};
<div className={colorClasses.red}>Good</div>
```

## Configuration Completa (Production-Ready)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],

  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },

      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },

      spacing: {
        128: '32rem',
        144: '36rem',
      },

      borderRadius: {
        '4xl': '2rem',
      },

      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.5)',
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },

  plugins: [
    forms,
    typography,
  ],
};

export default config;
```

## Vite Configuration (Optional)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## TypeScript Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Uso:**
```tsx
import { cn } from '@/lib/utils';
import Button from '@/components/Button';
```

## VS Code Extensions (Recomendado)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss", // IntelliSense para Tailwind
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Prettier + Tailwind Plugin

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

```js
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts"
}
```

**Beneficio:** Auto-ordena clases de Tailwind según [orden oficial](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier).

## Resumen

Setup completo de Tailwind CSS:
- ✅ Instalación en React/Vite y Next.js
- ✅ Theme customization (colors, fonts, spacing, animations)
- ✅ cn utility (clsx + tailwind-merge)
- ✅ Content configuration (PurgeCSS)
- ✅ Safelist para clases dinámicas
- ✅ Custom utilities con @layer
- ✅ Plugin API para utilities avanzadas
- ✅ TypeScript paths y Prettier plugin

**Próximo paso:** Ver [component-variants.md](component-variants.md) para patterns de componentes.
