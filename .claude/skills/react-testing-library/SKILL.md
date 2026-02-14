---
name: react-testing-library
description: Guía completa de testing de componentes React con Testing Library, Jest y TypeScript. Enfocada en pruebas accesibles y centradas en el usuario.
---

# React Testing Library Skill

Esta skill proporciona una guía estructurada para escribir tests robustos y mantenibles en React utilizando **React Testing Library (RTL)** y **Jest/Vitest**. El enfoque principal es testear la aplicación tal como la usaría un usuario real, evitando detalles de implementación.

## Contenido

1.  **[Fundamentos y Queries](./01-foundations.md)**
    *   Setup (Jest/Vitest).
    *   Filosofía de RTL.
    *   Diferencias clave: `getBy`, `queryBy`, `findBy`.
    *   Roles y accesibilidad.

2.  **[Interacciones y Asincronía](./02-interactions-async.md)**
    *   `user-event` vs `fireEvent`.
    *   Testing de formularios y eventos complejos.
    *   Testing asíncrono (`waitFor`, `findBy`).

3.  **[Mocking y Hooks](./03-mocking-hooks.md)**
    *   Mocking de API con **MSW (Mock Service Worker)**.
    *   Mocks de módulos y componentes.
    *   Testing de Custom Hooks (`renderHook`).

4.  **[Contexto y Patrones Avanzados](./04-advanced-patterns.md)**
    *   Custom Render (Providers globales).
    *   Testing de Context (Auth, Theme).
    *   Testing de Accesibilidad (`jest-axe`).

5.  **[Mejores Prácticas](./05-best-practices.md)**
    *   Estructura AAA (Arrange-Act-Assert).
    *   Qué testear y qué NO testear.
    *   Evitar falsos positivos.

## Tecnologías Clave
*   `@testing-library/react`
*   `@testing-library/user-event`
*   `jest` / `vitest`
*   `msw` (para API mocking)
*   `jest-axe` (para a11y)
