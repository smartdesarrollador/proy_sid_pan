---
name: react-suspense-streaming
description: Guía completa de React Suspense, concurrent features y streaming SSR con TypeScript para UX moderna y progressive rendering.
---

# React Suspense & Streaming Skill

Esta skill proporciona una implementación profunda de las características concurrentes de React 18+ y estrategias de streaming para "progressive rendering".

## Contenido

1.  **[Suspense Fundamentals](./01-suspense-basics.md)**
    *   `React.Suspense` basics y Lazy loading.
    *   Estrategias de `Suspense Boundary`.
    *   Error Boundaries para componentes asíncronos.

2.  **[Data & Async Patterns](./02-data-async.md)**
    *   Suspense para Data Fetching (TanStack Query, RSC).
    *   Nested Suspense y composición granular.
    *   Async Components.

3.  **[Concurrent UX Hooks](./03-concurrent-ux.md)**
    *   `useTransition`: Transiciones no bloqueantes y estado `isPending`.
    *   `useDeferredValue`: Defer de valores no urgentes.
    *   Concurrent Rendering: Automatic Batching y prioridades.

4.  **[Streaming & SSR](./04-streaming-ssr.md)**
    *   Streaming SSR en Next.js App Router (`loading.tsx`).
    *   `renderToReadableStream` y Progressive Hydration.

5.  **[Advanced Loading Patterns](./05-loading-patterns.md)**
    *   Skeleton UI strategies.
    *   Optimistic UI.
    *   Progressive content reveal.

## Tecnologías Clave
*   React 18+ (Concurrent Mode)
*   Next.js (App Router)
*   TypeScript
*   TanStack Query (React Query)
