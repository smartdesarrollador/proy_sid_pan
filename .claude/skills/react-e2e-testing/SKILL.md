---
name: react-e2e-testing
description: Guía completa de testing End-to-End (E2E) para aplicaciones React con Playwright, TypeScript y CI/CD integration. Incluye Page Object Model y mock de APIs.
---

# React E2E Testing Skill

Esta skill proporciona una guía detallada para implementar testing End-to-End (E2E) robusto en aplicaciones React, utilizando principalmente **Playwright** debido a su modernidad, velocidad y capacidades de debugging. También se cubren conceptos aplicables a Cypress.

## Contenido

1.  **[Setup y Configuración (Playwright vs Cypress)](./01-setup.md)**
    *   Instalación de Playwright con TypeScript.
    *   Configuración de `playwright.config.ts`.
    *   Comparativa rápida con Cypress.

2.  **[Selectores y Page Object Model (POM)](./02-selectors-pom.md)**
    *   Estrategias de selección resilientes (`getByRole`, `data-testid`).
    *   Implementación del patrón Page Object Model para mantenibilidad.
    *   Locators y filtros avanzados.

3.  **[Flujos Críticos y Aserciones](./03-critical-flows.md)**
    *   Testing de Login/Registro.
    *   Navegación y operaciones CRUD.
    *   Aserciones con `expect` y auto-wait.

4.  **[Testing Avanzado (API Mocking & Visual)](./04-advanced-testing.md)**
    *   Interceptar requests de red (Mocking).
    *   Testing de estados de error sin backend.
    *   Visual Regression Testing (Screenshots).

5.  **[CI/CD y Debugging](./05-cicd-debugging.md)**
    *   Integración con GitHub Actions.
    *   Uso del Trace Viewer para debugging.
    *   Ejecución en paralelo y Sharding.

## Mejores Prácticas Generales

*   **Aislamiento**: Cada test debe ser independiente. Usa `test.beforeEach` para resetear estado.
*   **Resiliencia**: Evita selectores CSS frágiles (`div > span:nth-child(3)`). Usa roles semánticos.
*   **Velocidad**: Mockea la API para casos borde y errores; usa la API real para "Smoke Tests" críticos.
*   **Determinismo**: Elimina la aleatoriedad (flakiness) esperando estados, no tiempos fijos (`waitForTimeout` ❌).
