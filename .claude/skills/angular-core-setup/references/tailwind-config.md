# Configuración Detallada de Tailwind CSS

Configuraciones avanzadas y optimizaciones para Tailwind CSS en Angular.

## tailwind.config.js Completo

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // 'media' o 'class'
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        secondary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        accent: '#82b1ff',
        danger: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        info: '#2196f3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Merriweather', 'ui-serif', 'Georgia'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```

## Plugins Recomendados

### Instalar plugins

```bash
npm install -D @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
```

### @tailwindcss/forms

Mejora estilos de formularios:

```html
<input type="text" class="form-input rounded-md">
<select class="form-select rounded-md">
  <option>Option 1</option>
</select>
<textarea class="form-textarea rounded-md"></textarea>
```

### @tailwindcss/typography

Para contenido rich text:

```html
<article class="prose lg:prose-xl">
  <h1>Título</h1>
  <p>Contenido con estilos automáticos...</p>
</article>
```

### @tailwindcss/aspect-ratio

Para mantener proporciones:

```html
<div class="aspect-w-16 aspect-h-9">
  <iframe src="..."></iframe>
</div>
```

## Custom Utilities con @layer

En `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Estilos base globales */
  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold;
  }
}

@layer components {
  /* Componentes reutilizables */
  .btn {
    @apply px-4 py-2 rounded font-medium transition duration-150 ease-in-out;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }

  .btn-secondary {
    @apply btn bg-secondary-200 text-secondary-800 hover:bg-secondary-300;
  }

  .btn-outline {
    @apply btn border-2 border-primary-600 text-primary-600 hover:bg-primary-50;
  }

  .btn-danger {
    @apply btn bg-danger text-white hover:bg-red-600;
  }

  .card {
    @apply bg-white shadow-card rounded-lg p-6 hover:shadow-card-hover transition;
  }

  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }

  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-primary {
    @apply badge bg-primary-100 text-primary-800;
  }

  .badge-success {
    @apply badge bg-green-100 text-green-800;
  }

  .badge-danger {
    @apply badge bg-red-100 text-red-800;
  }

  .spinner {
    @apply inline-block w-6 h-6 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin;
  }

  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}

@layer utilities {
  /* Utilidades personalizadas */
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

  .clip-circle {
    clip-path: circle(50% at 50% 50%);
  }
}
```

## Dark Mode

### Configuración

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Usar clase 'dark' en <html>
  // ...
}
```

### Implementación en Angular

```typescript
// src/app/core/services/theme.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    this.isDark.set(savedTheme === 'dark');
    this.applyTheme();
  }

  toggleTheme() {
    this.isDark.update(value => !value);
    this.applyTheme();
  }

  private applyTheme() {
    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', this.isDark());
    localStorage.setItem('theme', theme);
  }
}
```

### Uso en CSS

```css
/* Light mode */
.card {
  @apply bg-white text-gray-900;
}

/* Dark mode */
.dark .card {
  @apply bg-gray-800 text-gray-100;
}

/* O con prefijo dark: */
.card {
  @apply bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;
}
```

## Optimización para Producción

### PurgeCSS (Automático)

Tailwind automáticamente remueve clases no usadas en producción usando el array `content`.

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    // Agregar más paths si es necesario
  ],
}
```

### Safelist (Clases Dinámicas)

Si generas clases dinámicamente, agrégalas al safelist:

```javascript
module.exports = {
  safelist: [
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
    {
      pattern: /bg-(red|green|blue)-(100|200|300)/,
    },
  ],
}
```

## JIT Mode (Activado por defecto)

Just-In-Time mode genera clases bajo demanda. Beneficios:

- Build times más rápidos
- Archivo CSS más pequeño en desarrollo
- Todas las variantes disponibles sin configuración
- Valores arbitrarios: `w-[137px]`, `top-[-113px]`

```html
<!-- Valores arbitrarios -->
<div class="w-[137px]">
<div class="bg-[#1da1f2]">
<div class="grid-cols-[1fr_500px_2fr]">
```

## Breakpoints Responsive

```javascript
// Breakpoints por defecto
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

Uso:

```html
<div class="text-sm md:text-base lg:text-lg xl:text-xl">
  Responsive text
</div>
```

## Best Practices

1. **Usar @layer**: Organizar estilos personalizados en layers
2. **Componentes reutilizables**: Crear clases con @apply para componentes comunes
3. **Dark mode**: Implementar desde el inicio si es necesario
4. **Plugins**: Usar plugins oficiales para funcionalidad extendida
5. **JIT mode**: Aprovechar valores arbitrarios cuando sea necesario
6. **Safelist**: Solo para clases dinámicas reales
7. **Purge**: Verificar que el array `content` incluya todos los archivos
