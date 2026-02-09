# Tailwind CSS Configuration for Responsive Layouts

## Complete tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',   // Mobile landscape / Small tablets
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large desktop
    },
    extend: {
      // Custom spacing
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
        '112': '28rem',
        '116': '29rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
      },
      // Custom z-index values
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Custom max-width
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // Custom aspect ratios
      aspectRatio: {
        '4/3': '4 / 3',
        '21/9': '21 / 9',
      },
      // Custom colors for theming
      colors: {
        primary: {
          50: '#eff6ff',
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
        },
      },
      // Custom animations
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Custom transitions
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    // Aspect ratio plugin (if not using Tailwind v3.1+)
    // require('@tailwindcss/aspect-ratio'),

    // Forms plugin for better form styling
    // require('@tailwindcss/forms'),

    // Typography plugin for prose content
    // require('@tailwindcss/typography'),

    // Line clamp plugin
    // require('@tailwindcss/line-clamp'),
  ],
}
```

## Global Styles (styles.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utility classes for responsive layouts */
@layer utilities {
  /* Container utilities */
  .container-responsive {
    @apply px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto;
  }

  .container-sm {
    @apply px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto;
  }

  .container-md {
    @apply px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto;
  }

  .container-lg {
    @apply px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto;
  }

  .container-xl {
    @apply px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto;
  }

  /* Section spacing utilities */
  .section-spacing {
    @apply py-8 sm:py-12 lg:py-16 xl:py-20;
  }

  .section-spacing-sm {
    @apply py-4 sm:py-6 lg:py-8;
  }

  .section-spacing-md {
    @apply py-8 sm:py-12 lg:py-16;
  }

  .section-spacing-lg {
    @apply py-12 sm:py-16 lg:py-24 xl:py-32;
  }

  /* Responsive gap utilities */
  .gap-responsive {
    @apply gap-4 sm:gap-6 lg:gap-8;
  }

  .gap-responsive-sm {
    @apply gap-2 sm:gap-3 lg:gap-4;
  }

  .gap-responsive-lg {
    @apply gap-6 sm:gap-8 lg:gap-12;
  }

  /* Typography utilities */
  .heading-1 {
    @apply text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight;
  }

  .heading-2 {
    @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight;
  }

  .heading-3 {
    @apply text-xl sm:text-2xl lg:text-3xl font-semibold leading-snug;
  }

  .heading-4 {
    @apply text-lg sm:text-xl lg:text-2xl font-semibold leading-snug;
  }

  .heading-5 {
    @apply text-base sm:text-lg lg:text-xl font-semibold;
  }

  .body-large {
    @apply text-base sm:text-lg lg:text-xl leading-relaxed;
  }

  .body-normal {
    @apply text-sm sm:text-base leading-relaxed;
  }

  .body-small {
    @apply text-xs sm:text-sm leading-relaxed;
  }

  /* Responsive line clamp */
  .line-clamp-responsive {
    @apply line-clamp-3 sm:line-clamp-4 lg:line-clamp-none;
  }

  /* Safe area for mobile notch/bottom bar */
  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-left {
    padding-left: env(safe-area-inset-left);
  }

  .safe-area-right {
    padding-right: env(safe-area-inset-right);
  }

  /* Scrollbar styling */
  .scrollbar-thin {
    scrollbar-width: thin;
  }

  .scrollbar-none {
    scrollbar-width: none;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    @apply bg-gray-100 dark:bg-gray-800;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    @apply bg-gray-300 dark:bg-gray-600 rounded-full;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400 dark:bg-gray-500;
  }

  /* Focus visible utilities */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800;
  }

  /* Backdrop blur for modals/drawers */
  .backdrop-blur-modal {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
}

@layer components {
  /* Card component base */
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden;
  }

  .card-hover {
    @apply card transition-shadow hover:shadow-lg;
  }

  /* Button base styles */
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-sm {
    @apply px-3 py-1.5 text-sm;
  }

  .btn-lg {
    @apply px-6 py-3 text-lg;
  }

  .btn-primary {
    @apply btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
  }

  .btn-secondary {
    @apply btn bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  .btn-outline {
    @apply btn border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500;
  }

  /* Input base styles */
  .input {
    @apply w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .input-error {
    @apply input border-red-500 focus:ring-red-500;
  }

  /* Label base styles */
  .label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2;
  }

  /* Link base styles */
  .link {
    @apply text-blue-600 dark:text-blue-400 hover:underline transition-colors;
  }

  /* Badge base styles */
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-primary {
    @apply badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
  }

  .badge-success {
    @apply badge bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
  }

  .badge-warning {
    @apply badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
  }

  .badge-danger {
    @apply badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
  }
}

@layer base {
  /* Base dark mode styles */
  :root {
    color-scheme: light;
  }

  .dark {
    color-scheme: dark;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Remove tap highlight on mobile */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Better text rendering */
  body {
    @apply antialiased;
  }

  /* Focus visible for keyboard navigation */
  *:focus-visible {
    @apply outline-none ring-2 ring-blue-500 ring-offset-2;
  }
}
```

## Responsive Breakpoint Mixins (SCSS - Optional)

If you're using SCSS, you can create mixins for easier responsive development:

```scss
// _mixins.scss
@mixin mobile {
  @media (max-width: 639px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 640px) and (max-width: 1023px) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: 1024px) {
    @content;
  }
}

@mixin large-desktop {
  @media (min-width: 1280px) {
    @content;
  }
}

@mixin mobile-only {
  @media (max-width: 767px) {
    @content;
  }
}

@mixin tablet-and-up {
  @media (min-width: 768px) {
    @content;
  }
}

@mixin desktop-and-up {
  @media (min-width: 1024px) {
    @content;
  }
}

// Usage example:
// .my-component {
//   padding: 1rem;
//
//   @include tablet {
//     padding: 1.5rem;
//   }
//
//   @include desktop {
//     padding: 2rem;
//   }
// }
```

## Environment-Specific Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    largeDesktop: 1280
  },
  layout: {
    sidebarWidth: 256,
    sidebarCollapsedWidth: 80,
    navbarHeight: 64,
    bottomNavHeight: 64
  }
};
```

## Angular.json Configuration

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.css"
            ],
            "stylePreprocessorOptions": {
              "includePaths": [
                "src/styles"
              ]
            }
          }
        }
      }
    }
  }
}
```

## PostCSS Configuration (postcss.config.js)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
```

## VSCode Settings for Tailwind IntelliSense

```json
// .vscode/settings.json
{
  "tailwindCSS.experimental.classRegex": [
    ["class\\s*=\\s*['\"`]([^'\"`]*)['\"`]", "([^'\"`]*)"],
    ["className\\s*=\\s*['\"`]([^'\"`]*)['\"`]", "([^'\"`]*)"],
    ["\\[class\\]\\s*=\\s*['\"`]([^'\"`]*)['\"`]", "([^'\"`]*)"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "html": "html"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```
