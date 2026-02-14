---
name: react-performance-optimization
description: Guía completa de optimización de rendimiento en React con TypeScript. Incluye estrategias de memoización, lazy loading, virtualización y análisis de métricas.
---

# React Performance Optimization Skill

Esta skill proporciona una guía práctica y detallada para optimizar aplicaciones React utilizando TypeScript. Se enfoca en soluciones probadas en producción, evitando la optimización prematura.

## Contenido

1.  **[Memoización y Renderizado](./01-memoization.md)**
    *   `React.memo`: Comparación shallow vs deep.
    *   `useMemo`: Cálculos costosos.
    *   `useCallback`: Referencias de funciones estables.

2.  **[Estrategias de Carga (Loading Strategies)](./02-loading-strategies.md)**
    *   Code Splitting: `React.lazy`, `Suspense`.
    *   Lazy Loading: Imágenes y componentes.
    *   Bundle Analysis: Identificar bloat.

3.  **[Virtualización de Listas](./03-virtualization.md)**
    *   Manejo de grandes conjuntos de datos con `react-window` o `react-virtualized`.

4.  **[Optimización de Interacciones](./04-interaction-optimization.md)**
    *   Debounce y Throttle para eventos frecuentes (scroll, resize, inputs).

5.  **[Profiling y Métricas (Web Vitals)](./05-profiling-metrics.md)**
    *   React DevTools Profiler.
    *   Web Vitals (LCP, FID, CLS).
    *   Flamegraphs y commit scheduling.

## Mejores Prácticas Generales

*   **Evita la optimización prematura**: Mide primero, optimiza después.
*   **Define un Performance Budget**: Establece límites para el tamaño del bundle y tiempos de carga.
*   **Usa Production Builds**: Siempre prueba el rendimiento en la build de producción, no en desarrollo.
*   **Inmutabilidad**: Mantén las estructuras de datos inmutables para facilitar la detección de cambios (shallow compare).

## Cómo usar esta skill

Lee las guías enlazadas arriba para profundizar en cada técnica. Cada guía incluye ejemplos de código "Antes vs Después" y explicaciones de cuándo aplicar cada técnica.
