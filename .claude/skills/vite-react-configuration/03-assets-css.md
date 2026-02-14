# Assets y Estilos

Manejo optimizado de Assets (imágenes, fonts, SVGs) y configuración de estilos CSS/Tailwind.

## 1. Assets Importados vs Static Public

Vite soporta dos formas de cargar archivos estáticos.

### 1. Importados (`src/assets/`)
Recomendado. Vite procesa estos archivos, añade hash al nombre (`logo.1a2b3c.png`) para cache busting y los copia a `dist/assets` al construir.

```jsx
// ✅ Import dinámico: Vite conoce la URL final
import logo from './assets/react.svg';

export default function App() {
  return <img src={logo} className="logo" alt="React logo" />;
}
```

### 2. Public Folder (`/public`)
Útil para `favicon.ico`, `robots.txt`, `manifest.json`. Estos archivos se copian tal cual a la raíz de `dist/`.

```html
<!-- Se sirven desde / (root path) -->
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

## 2. Configuración CSS (Modules & Preprocessors)

Vite soporta nativamente CSS, PostCSS y CSS Modules (`.module.css`).

### CSS Modules

Perfectos para estilos scoped (aislados por componente).

```css
/* Button.module.css */
.btn {
  background-color: blue; /* Se compila a ._btn_abc123 */
}
```

```jsx
import styles from './Button.module.css';

<button className={styles.btn}>Click</button>
```

### Configuración CSS Global

Puedes configurar opciones de preprocesadores (Sass/Less) en `vite.config.ts`:

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`, // Variables globales Sass
      },
    },
    modules: {
      localsConvention: 'camelCaseOnly', // .btn-primary -> styles.btnPrimary
    },
  },
});
```

## 3. Integración Tailwind CSS

La forma estándar de trabajar con React hoy en día.

1.  **Instalar dependencias:**
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
    Esto crea `tailwind.config.js` y `postcss.config.js`.

2.  **Configurar `tailwind.config.js`:**
    ```js
    /** @type {import('tailwindcss').Config} */
    export default {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // Escanear todos los archivos TS/React
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }
    ```

3.  **Importar en `index.css`:**
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

Vite detectará el archivo de PostCSS y procesará Tailwind automáticamente en desarrollo (JIT) y producción.
