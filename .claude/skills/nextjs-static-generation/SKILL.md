---
name: nextjs-static-generation
description: Guía completa de Static Site Generation (SSG) e Incremental Static Regeneration (ISR) en Next.js App Router.
---

# Next.js Static Generation Skill

Esta skill profundiza en la generación estática de sitios con Next.js 14+, cubriendo desde la generación básica de rutas hasta estrategias avanzadas de revalidación on-demand y optimización de builds.

## Contenido

1.  **[Static Generation Fundamentals](./01-static-generation.md)**
    *   Generación en tiempo de construcción (`generateStaticParams`).
    *   Manejo de rutas dinámicas y parámetros estrictos (`dynamicParams`).
    *   Renderizado estático por defecto.

2.  **[ISR & On-Demand Revalidation](./02-isr-on-demand.md)**
    *   Revalidación basada en tiempo (`next: { revalidate: 3600 }`).
    *   Revalidación bajo demanda (`revalidatePath`, `revalidateTag`).
    *   Patrón Stale-While-Revalidate.

3.  **[Caching & Fetching Strategies](./03-caching-strategies.md)**
    *   `force-cache` para contenido estático perpetuo.
    *   `no-store` para forzar renderizado dinámico.
    *   Headers de caché CDN y navegador.

4.  **[Build & Deployment Optimization](./04-build-deploy.md)**
    *   Modo `standalone` para contenedores ligeros.
    *   Output File Tracing.
    *   Static Exports vs Node.js Server.
    *   Rendering mixto (SSG + SSR).

## Filosofía
*   **Static First**: Intenta renderizar estáticamente todo lo posible para máxima velocidad (TTFB) y menor carga de servidor.
*   **Dynamic Access**: Usa Server Actions o Client Components para partes interactivas, manteniendo el shell estático.
*   **Smart Revalidation**: Prefiere revalidación on-demand (por eventos CMS/DB) sobre tiempo fijo para contenido siempre fresco.
