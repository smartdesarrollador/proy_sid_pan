# Agent Orchestration Rules

## Principios fundamentales

- **Máximo 3 agentes en paralelo** — evitar context overflow y resultados incoherentes
- **Preferir el agente especializado** sobre el general para cualquier tarea
- **Dos agentes no pueden escribir el mismo archivo en paralelo** — asignar ownership claro
- **Cadenas secuenciales**: el output de un agente es el input del siguiente
- **Ante la duda, secuencial** — más lento pero más seguro que resultados conflictivos

## Grupos de paralelización segura

Estos pares/grupos no tienen dependencias entre sí y pueden correr simultáneamente:

| Grupo | Agentes | Cuándo activar |
|-------|---------|----------------|
| Exploración | `researcher` + `planner` | Inicio de cualquier feature mediana/grande |
| QA post-impl | `code-reviewer` + `security-auditor` | Después de escribir código |
| QA + tests | `code-reviewer` + `test-generator` | Después de escribir código |
| Docs + compliance | `api-documenter` + `compliance-checker` | Validación de endpoints |
| Infra análisis | `database-optimizer` + `migration-manager` (solo lectura) | Análisis previo a cambio DB |
| UI + Docs | `ui-ux-designer` + `api-documenter` | Features con UI nueva |

## Restricciones secuenciales estrictas

- `migration-manager` siempre va **solo** — riesgo de conflictos en `migrations/`
- `billing-validator` siempre **después** de cualquier cambio en `apps/subscriptions/`
- `security-auditor` siempre **antes** del merge / PR
- `planner` siempre **antes** de cualquier builder en features medianas/grandes
- Los builders (`react-vite-builder`, `nextjs-builder`, `tauri-desktop-builder`) **nunca en paralelo entre sí**

## Flujos estándar por tipo de tarea

```
[BUG FIX PUNTUAL]
→ agente específico directo → code-reviewer

[FEATURE PEQUEÑA — 1-2 archivos]
researcher → builder específico → code-reviewer + test-generator (paralelo)

[FEATURE MEDIANA / GRANDE]
researcher + planner (paralelo)
  → builder específico
  → code-reviewer + security-auditor (paralelo)
  → test-generator → api-documenter

[NUEVA API ENDPOINT]
planner → builder + api-documenter (paralelo)
  → security-auditor → test-generator

[CAMBIO DE BASE DE DATOS]
researcher → migration-manager (solo)
  → database-optimizer → code-reviewer

[REFACTOR AMPLIO]
researcher + planner (paralelo)
  → code-reviewer (análisis inicial)
  → builder
  → code-reviewer + security-auditor + test-generator (paralelo)

[PRE-RELEASE / PR REVIEW]
code-reviewer + security-auditor + compliance-checker (paralelo, máx 3)
  → test-generator

[EMERGENCIA / HOTFIX]
builder directo → code-reviewer → (deploy)
```

## Tabla de decisión rápida

| Tarea | Estrategia | Agentes |
|-------|-----------|---------|
| Bug fix | Solo + review | builder → reviewer |
| Feature pequeña | Secuencial 3 pasos | researcher → builder → reviewer+tests |
| Feature grande | Mix paralelo/secuencial | researcher+planner → builder → QA paralelo |
| Nueva API | Mix | planner → builder+docs → security → tests |
| Cambio DB | Secuencial estricto | researcher → migration → optimizer → reviewer |
| Refactor | Secuencial con QA final | researcher+planner → reviewer → builder → QA |
| Pre-release | Paralelo full QA | reviewer+security+compliance → tests |
| Hotfix | Mínimo pasos | builder → reviewer |

## Catálogo de agentes disponibles

```
Research/Analysis : researcher, planner, compliance-checker
Code Generation   : react-vite-builder, nextjs-builder, tauri-desktop-builder
Quality/Safety    : code-reviewer, security-auditor, test-generator
Infra/Data        : database-optimizer, migration-manager, billing-validator
Docs/UX           : api-documenter, ui-ux-designer
```
