---
name: react-project-structure
description: Guía de arquitectura y estructura de carpetas para proyectos React/Next.js con TypeScript, enfocada en escalabilidad (Feature-Sliced Design simplificado) y mantenibilidad.
---

# React Project Structure Skill

Esta skill define las mejores prácticas para organizar una base de código React/Next.js, desde proyectos pequeños hasta aplicaciones empresariales de gran escala.

## Contenido

1.  **[Feature-Based Architecture](./01-feature-architecture.md)**
    *   Estructura por Features vs Capas.
    *   Organización de `src/features/`.
    *   Estructura recomendada de carpetas.

2.  **[Core & Shared Layers](./02-core-shared.md)**
    *   Path Aliases (`@/components`, `@/features`).
    *   Componentes UI compartidos (Design System).
    *   Barrel Exports (`index.ts`) y Tree-Shaking.

3.  **[Component Design & Colocation](./03-component-design.md)**
    *   Separación de Lógica (Hooks) y UI.
    *   Colocation: Tests, Stories y Estilos junto al componente.
    *   Smart (Container) vs Dumb (Presentational) Components.

4.  **[Types & Configuration](./04-types-config.md)**
    *   Tipos Globales vs Locales.
    *   Organización de `.d.ts`.
    *   Manejo seguro de Variables de Entorno (`env.ts`).

5.  **[Scaling to Monorepo](./05-monorepo-scaling.md)**
    *   Cuándo migrar a Monorepo.
    *   Estructura de Workspaces (Apps + Packages).
    *   Librerías compartidas (`packages/ui`, `packages/config`).

## Filosofía
*   **Colocación**: Mantén las cosas que cambian juntas, cerca unas de otras.
*   **Aislamiento**: Las features no deben importarse entre sí directamente (evita acoplamiento).
*   **Escalabilidad**: La estructura debe permitir añadir nuevas funcionalidades sin refactorizar todo el proyecto.
*   **Explicitidad**: Prefiere nombres claros y explícitos sobre "magia" o abstracciones excesivas.
