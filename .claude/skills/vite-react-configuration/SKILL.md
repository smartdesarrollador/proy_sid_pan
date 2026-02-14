---
name: vite-react-configuration
description: Guía completa de configuración de Vite para proyectos React con TypeScript, optimización de builds, variables de entorno y proxy.
---

# Vite React Configuration Skill

Esta skill proporciona las mejores prácticas para configurar Vite en un entorno de desarrollo profesional con React y TypeScript, desde la estructura inicial hasta la optimización en producción.

## Contenido

1.  **[Setup y Path Aliases](./01-setup-configuration.md)**
    *   Creación del proyecto (`create vite`).
    *   Estructura básica de `vite.config.ts`.
    *   Configuración de Path Aliases (`@/`) en Vite y TypeScript.

2.  **[Variables de Entorno y Proxy](./02-env-proxy.md)**
    *   Manejo de `.env` y prefijo `VITE_`.
    *   Tipado fuerte de `import.meta.env`.
    *   Configuración de Proxy para evitar CORS en desarrollo.

3.  **[Assets y Estilos](./03-assets-css.md)**
    *   Manejo de Assets (`public/` vs `src/assets/`).
    *   Integración con Tailwind CSS y PostCSS.
    *   CSS Modules y Preprocesadores.

4.  **[Build Optimization](./04-build-optimization.md)**
    *   Estrategias de `rollupOptions` (manualChunks).
    *   Análisis del Bundle (`rollup-plugin-visualizer`).
    *   Configuración del Servidor de Desarrollo (HMR, HTTPS).

## Filosofía
*   **Velocidad**: Aprovecha ESBuild para desarrollo ultrarápido.
*   **Modularidad**: Configura plugins solo cuando sean necesarios.
*   **Tipado**: Mantén tu configuración y variables de entorno fuertemente tipadas.
*   **Producción**: Optimiza los chunks para mejorar la carga y reduce el tamaño del bundle final.
