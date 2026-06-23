# Evals del agente

Conjunto ligero de **evaluaciones del agente** (Claude Code) para medir si los cambios al *harness*
del proyecto (skills, hooks, reglas, `CLAUDE.md`) realmente lo mejoran. No evalúan el código de la app
— eso lo hacen los tests (`make test`, `npm test`). Estas evalúan la **capacidad del agente** sobre las
tareas que más se repiten en este repo.

> Contexto y diseño: ver [docs/guides/project-skills.md](../docs/guides/project-skills.md) (sección
> "Mantenimiento") y la explicación de *observability vs evals* del harness.

## Qué es cada eval

Cada `EVAL-0X-*.md` es una **tarea-patrón** con:
- un **Prompt** fijo y autocontenido (se pega tal cual en una sesión nueva),
- una **Rúbrica** de comportamientos esperados (se puntúa a mano),
- **Señales de fallo** que apuntan a qué pieza del harness revisar si puntúa bajo (observability ligera).

Son **manuales, no automatizados**: necesitan una sesión nueva del agente para correr, así que no hay
script que los ejecute. Esa simplicidad es a propósito (no montar infraestructura).

## Catálogo

| Eval | Skill objetivo | Tipo | Mide |
|------|----------------|------|------|
| [EVAL-01](EVAL-01-admin-feature-scaffold.md) | `new-admin-feature` | scaffold | Andamiar una sección del Admin Panel con las convenciones del proyecto |
| [EVAL-02](EVAL-02-dokploy-traefik-404.md) | `dokploy-deploy` | troubleshoot | Diagnosticar un 404 de Traefik → labels/`.service=` (LL-070) |
| [EVAL-03](EVAL-03-trailing-slash-404.md) | `lessons-learned` | troubleshoot | 404/405 de endpoint → trailing slash (LL-001/LL-002) |
| [EVAL-04](EVAL-04-django-app-conventions.md) | convenciones / `CLAUDE.md` | scaffold | Crear app Django nueva (registro URLs, permisos, migraciones) |
| [EVAL-05](EVAL-05-regresion-x-tenant-slug.md) | `lessons-learned` | regresión | Lista vacía silenciosa → `X-Tenant-Slug` (LL-030) |

Cobertura: 1 frontend-scaffold, 1 deploy, 1 backend-scaffold, 2 consulta-KB (routing + multi-tenant).

## Cómo correr la suite

1. Abrir una **sesión nueva** de Claude Code en la raíz del repo (contexto limpio).
2. Pegar el **Prompt** de un eval (solo ese, sin pistas extra).
3. Dejar que el agente responda; marcar la **Rúbrica** (`✅1 / 🟡0.5 / ❌0` por ítem) y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md), con una nota de qué había en el harness en ese momento.
5. Repetir con los 5. La **primera pasada = línea base**.

**Cuándo re-correr:** después de tocar un skill importante, el `CLAUDE.md`, una regla o un hook. Si un
puntaje **baja**, detectaste una regresión; usa las "Señales de fallo" del eval para saber qué afinar.

## Filosofía (por qué evals antes que observability)

- Los evals dan una **línea base medible** y responden directo "¿mi cambio al harness ayudó?".
- Son baratos de arrancar (markdown + rúbrica), sin instrumentación.
- La **observability** entra cuando un eval falla y necesitas ver *por qué*: ahí miras la traza de la
  sesión (qué skill usó, qué tocó, si consultó `lessons-learned`). De momento, `RESULTS.md` + las
  "Señales de fallo" + los `reports/` cumplen ese rol de forma ligera.
