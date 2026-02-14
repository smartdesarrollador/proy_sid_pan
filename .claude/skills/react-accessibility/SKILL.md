---
name: react-accessibility
description: Guía completa de accesibilidad (a11y) en React con TypeScript, cubriendo HTML semántico, ARIA, navegación por teclado y cumplimiento WCAG 2.1 AA.
---

# React Accessibility Skill

Esta skill es una referencia definitiva para construir aplicaciones React inclusivas y accesibles. Sigue los estándares WCAG 2.1 Level AA.

## Contenido

1.  **[HTML Semántico & ARIA](./01-semantic-aria.md)**
    *   Uso correcto de elementos (`<button>` vs `<div>`).
    *   Atributos ARIA esenciales (`aria-label`, `aria-expanded`).
    *   Roles y landmarks.

2.  **[Navegación por Teclado & Focus](./02-keyboard-focus.md)**
    *   Gestión del foco (`useRef`, `autofocus` con cuidado).
    *   Focus Traps (Modales).
    *   Skip Links.

3.  **[Componentes Interactivos Accesibles](./03-accessible-patterns.md)**
    *   Patrones para Modales (Dialogs).
    *   Acordeones y Tabs.
    *   Dropdowns y Menús.

4.  **[Formularios & Feedback](./04-forms-feedback.md)**
    *   Asociación Label-Input.
    *   Mensajes de error y validación (`aria-invalid`, `aria-errormessage`).
    *   Live Regions para notificaciones (`aria-live`).

5.  **[Testing A11y & Herramientas](./05-testing-compliance.md)**
    *   ESLint (`jsx-a11y`).
    *   `jest-axe` para tests automatizados.
    *   Checklist manual (Screen Readers).

## Princípios Básicos
*   **Keyboard First**: Todo lo que se puede hacer con mouse, debe poder hacerse con teclado.
*   **Semántica Nativa**: Un `<button>` es mejor que un `<div onClick>` con mil `aria-*`.
*   **No solo ciegos**: A11y beneficia a usuarios con discapacidades motoras, cognitivas y situacionales (sol brillante, brazo roto).
