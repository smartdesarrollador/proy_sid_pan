---
name: nextjs-server-components
description: Guía completa de React Server Components (RSC) en Next.js (14+) con TypeScript. Enfocada en arquitectura híbrida, patrones de fetching, server actions y streaming.
---

# Next.js Server Components Skill

Esta skill detalla el uso de **Server Components** y la arquitectura híbrida en Next.js App Router.

## Contenido

1.  **[Fundamentos de RSC](./01-fundamentals.md)**
    *   Server vs Client Components.
    *   Async Server Components (Data Fetching).
    *   Protección de código con `server-only`.

2.  **[Arquitectura Híbrida & Patrones](./02-architecture.md)**
    *   Directiva `'use client'`.
    *   Patrones de Composición: Server wrapping Client, Children Pattern.
    *   Serialización de props.

3.  **[Server Actions & Mutaciones](./03-server-actions.md)**
    *   Configuración y uso de `'use server'`.
    *   Manejo de Formularios y Validaciones.
    *   Revalidación de caché (`revalidatePath`).

4.  **[Caching & Memoization](./04-caching.md)**
    *   Estrategias de Caché: Fetch Cache, React Cache.
    *   Request Memoization.
    *   `unstable_cache` para queries DB.

5.  **[Streaming & Suspense Patterns](./05-streaming.md)**
    *   Renderizado progresivo.
    *   Skeletons y Loading UI.
    *   Manejo de Errores en RSC.

## Filosofía
*   **Default to Server**: Usa Server Components por defecto. Solo usa `'use client'` cuando necesites interactividad (hooks, eventos).
*   **Fetch on Server**: Mueve la lógica de datos al servidor para reducir la latencia y el tamaño del bundle.
*   **Composition**: Usa el patrón `children` para evitar convertir sub-árboles enteros a Client Components.
