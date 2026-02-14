---
name: react-error-handling
description: Guía completa de manejo de errores en React y Next.js con TypeScript, Error Boundaries, manejo de errores asíncronos y logging.
---

# React Error Handling Skill

Esta skill define patrones robustos para gestionar errores en aplicaciones React/Next.js, asegurando una experiencia de usuario fluida incluso cuando las cosas fallan.

## Contenido

1.  **[Error Boundaries Avanzados](./01-error-boundaries.md)**
    *   Implementación con Class Components (`componentDidCatch`).
    *   Librería `react-error-boundary` (Recomendada).
    *   Patrones: Global vs Granular y Fallback UI.

2.  **[Async & API Error Handling](./02-async-api-errors.md)**
    *   Errores en Promesas y Hooks (`try/catch`).
    *   Integración con React Query (`onError`, Retries).
    *   Interceptors de Axios y tipado de errores API.

3.  **[Next.js & Form Errors](./03-nextjs-forms.md)**
    *   Manejo de errores en Next.js App Router (`error.tsx`, `global-error.tsx`).
    *   Errores en Server Actions.
    *   Validación de formularios (Zod + React Hook Form).

4.  **[Logging & Recovery](./04-logging-recovery.md)**
    *   Estrategias de recuperación (Retry buttons).
    *   Servicios de Logging (Sentry) y Contexto.
    *   Diferencias Dev vs Prod (Source Maps).

## Filosofía
*   **Graceful Degradation**: La UI no debe "explotar" completamente. Si falla un widget, el resto de la app debe funcionar.
*   **Actionable Errors**: El usuario debe saber qué pasó y qué hacer (reintentar, recargar, contactar soporte).
*   **Visibility**: Los desarrolladores deben tener visibilidad (logs) de los errores en producción.
