# Evals y Observability del agente

Guía de la **capa de medición del harness**: cómo saber si el agente (Claude Code) trabaja bien en este
repo y si los cambios que le haces (skills, hooks, reglas, `CLAUDE.md`) lo **mejoran o lo empeoran**.

> Es la continuación natural de [project-skills.md](project-skills.md): primero das conocimiento al
> agente (skills), luego **mides** si ese conocimiento sirve (evals) y **observas** qué hace en cada
> sesión (observability).

| Capa | Pregunta que responde | Dónde vive |
|------|----------------------|-----------|
| **Evals** | "¿Qué tan bueno es el agente, comparado consigo mismo?" | [`evals/`](../../evals/) |
| **Observability** | "¿Qué hizo el agente en *esta* sesión y por qué falló?" | [`evals/observations/`](../../evals/observations/) |

Importante: **no miden el código de la app** (eso lo hacen los tests: `make test`, `npm test`). Miden la
**capacidad del agente** sobre las tareas que más se repiten en el proyecto.

---

## 1. Evals — medir la capacidad del agente

Un eval es una **tarea-patrón** con un *prompt fijo* + una *rúbrica* de comportamientos esperados que
puntúas a mano. Sirven para tener una **línea base** y detectar mejoras/regresiones.

Hay 5, en `evals/` (detalle en [`evals/README.md`](../../evals/README.md)):

| Eval | Skill objetivo | Mide |
|------|----------------|------|
| EVAL-01 | `new-admin-feature` | Andamiar una sección del Admin Panel con las convenciones del proyecto |
| EVAL-02 | `dokploy-deploy` | Diagnosticar un 404 de Traefik (labels / `.service=`) |
| EVAL-03 | `lessons-learned` | 404/405 → trailing slash (consultar la KB, no re-investigar) |
| EVAL-04 | convenciones / `CLAUDE.md` | Crear una app Django nueva (URLs, permisos, migraciones) |
| EVAL-05 | `lessons-learned` | Lista vacía silenciosa → `X-Tenant-Slug` (regresión) |

### Cómo correr la suite

1. Abre una **sesión nueva** de Claude Code en la raíz del repo (contexto limpio, sin pistas).
2. Pega el **Prompt** de un eval (solo ese).
3. Deja que el agente responda; marca la **Rúbrica** (`✅1 / 🟡0.5 / ❌0` por ítem) y suma el puntaje.
4. Anota fecha + puntaje en [`evals/RESULTS.md`](../../evals/RESULTS.md), con una nota de qué había en
   el harness en ese momento.
5. Repite con los 5. **La primera pasada = tu línea base** (la suite suma `/45`).

### Cuándo re-correr

Después de tocar un skill importante, el `CLAUDE.md`, una regla o un hook. Si un puntaje **baja**,
detectaste una regresión → usa la sección "Señales de fallo" del eval (y la observability, abajo) para
saber qué afinar.

---

## 2. Observability — ver qué hizo el agente

Cuando un eval puntúa bajo, no adivines: mira **qué hizo realmente** el agente en esa sesión. Esto se
registra **automáticamente** — no requiere disciplina manual.

El hook `.claude/hooks/observability-run-log.py` (evento `Stop`, registrado en `.claude/settings.json`)
lee el transcript de cada sesión y escribe una entrada por sesión en
[`evals/observations/runs.md`](../../evals/observations/) (detalle en
[`evals/observations/README.md`](../../evals/observations/README.md)).

### Qué registra cada sesión

```
## 2026-06-23 · `abc12345`
- skills: new-admin-feature
- tools: Bash(37), Write(26), Read(24), Edit(9), Skill(3)…
- lessons-learned: ❌ no consultado
- archivos: 24 (.claude/skills, src/features/webhooks…)
- tests: no
- → Señal: tocó código pero no consultó la KB; editó código sin correr tests/build
```

| Señal | Significado |
|-------|-------------|
| `skills` / `tools` | Qué skills invocó y conteo de herramientas usadas |
| `lessons-learned` | ✅/❌ si consultó la base de incidencias cuando correspondía |
| `archivos` | Cuántos y dónde trabajó (dirs de primer nivel) |
| `tests` | Si corrió tests/typecheck/build, y señal `pass`/`fail`/`unknown` |
| `→ Señal` | Alerta heurística (p.ej. "tocó código pero no consultó la KB") |

Esa última línea **→ Señal** suele apuntar directo a la pieza del harness que hay que afinar.

> Los archivos `runs.jsonl`/`runs.md` son **telemetría local** (están en `.gitignore`); solo se versiona
> el `README.md` de esa carpeta. El hook empieza a registrar a partir de su instalación.

---

## 3. Cómo se usan juntos — el flywheel

```
Corres los evals → puntaje (línea base)
      ↓ ¿algún eval bajo?
Observability → abres runs.md y ves qué hizo el agente en esa sesión
      ↓ la "→ Señal" indica qué falló
Ajustas el skill / regla / hook responsable
      ↓
Re-corres los evals → confirmas que subió (sin romper otros)
      ↓ registras en RESULTS.md qué cambió
Harness mejor → cada feature/deploy/bug que desarrollas sale mejor
```

- **Evals** te dicen *si* mejoraste (puntaje comparable en el tiempo).
- **Observability** te dice *por qué* falló (traza de la sesión).
- **`RESULTS.md`** es la bitácora que correlaciona cambios del harness con los puntajes.

### Ejemplo concreto

1. EVAL-03 (404 → trailing slash) puntúa 4/8.
2. Abres `evals/observations/runs.md` → la sesión muestra `lessons-learned: ❌ no consultado`.
3. Causa: el agente depuró desde cero en vez de consultar la KB. Ajustas la `description` del skill
   `lessons-learned` o el regex del hook `lessons-learned-consult.sh`.
4. Re-corres EVAL-03 → 8/8. Lo anotas en `RESULTS.md` con la nota "tras reforzar trigger del hook".

---

## Resumen rápido

| Quiero… | Voy a… |
|---------|--------|
| Saber si el agente mejoró tras un cambio | Correr la suite de `evals/` y comparar en `RESULTS.md` |
| Ver qué hizo el agente en una sesión | Abrir `evals/observations/runs.md` |
| Entender el detalle de un eval | Leer `evals/EVAL-0X-*.md` |
| Entender las señales de observability | Leer `evals/observations/README.md` |
| Saber por qué existe esta capa | [Explicación observability vs evals](project-skills.md) y esta guía |

Alcance deliberado: **no** hay evals automatizadas ni dashboard — para el tamaño de este proyecto la
versión ligera (markdown + rúbrica + un hook) es suficiente y no añade infraestructura que mantener.
