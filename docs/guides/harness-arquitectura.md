# El harness del proyecto — cómo funciona y su estructura

Documentación del **harness** de IA de este repo: la infraestructura que rodea al modelo (Claude Code)
para convertirlo en un agente fiable y específico del proyecto. La idea central de la *harness
engineering* es **agente = modelo + harness**, y el harness (no el modelo) explica la mayor parte del
rendimiento. Esta guía explica las piezas, su estructura y cómo se comunican entre sí.

> Guías relacionadas (detalle de cada capa): [project-skills.md](project-skills.md) ·
> [evals-y-observability.md](evals-y-observability.md) · [ai-workflow.md](ai-workflow.md) ·
> [feature-development-workflow.md](feature-development-workflow.md).
>
> **Diagrama Mermaid** del funcionamiento: [docs/diagrams/harness-flow.md](../diagrams/harness-flow.md).

---

## 1. Vista de conjunto

El harness se organiza en capas. Cada capa tiene una función y se comunica con las demás:

```
                        ┌───────────────────────────────────────────────┐
                        │  CONTEXTO / SCAFFOLDING (se carga cada sesión) │
                        │  CLAUDE.md · .claude/rules/ · AGENTS.md        │
                        └───────────────────┬───────────────────────────┘
                                            │ define cómo trabaja el agente
         ┌──────────────────────────────────┼──────────────────────────────────┐
         ▼                                  ▼                                  ▼
┌──────────────────┐            ┌──────────────────────┐          ┌──────────────────────┐
│  CONOCIMIENTO    │            │   ORQUESTACIÓN       │          │   MEDICIÓN           │
│  .claude/skills/ │◄───────────│   .claude/agents/    │          │   evals/             │
│  · genéricos     │  consultan │   .claude/commands/  │          │   evals/observations/│
│  · del proyecto  │  la KB     │   (+ rules de        │          │                      │
│  · lessons-learned│           │    orquestación)     │          │                      │
│    (KB incidencias)│          └──────────────────────┘          └──────────────────────┘
└────────┬─────────┘                       │                                  ▲
         │ alimenta/consulta                │ produce trabajo                  │ mide si el
         ▼                                  ▼                                  │ harness mejora
┌──────────────────────────────────────────────────────────────┐             │
│  MEMORIA + ARTEFACTOS                                         │─────────────┘
│  reports/ · BACKLOG.md · prd/ · plans/ · docs/adr/           │
│  memory/ (personal)                                          │
└──────────────────────────────────────────────────────────────┘
         ▲
         │ automatiza, vigila y registra
┌──────────────────────────────────────────────────────────────┐
│  AUTOMATIZACIÓN / GOBERNANZA — .claude/hooks/ + settings.json │
└──────────────────────────────────────────────────────────────┘
```

Inventario actual: **46 skills**, **14 agentes**, **4 comandos**, **4 reglas**, **5 hooks**, más los
artefactos de conocimiento (`reports/`, `BACKLOG.md`, `prd/`, `plans/`, `roadmaps/`, `docs/adr/`) y la
capa de medición (`evals/` + `evals/observations/`).

---

## 2. Estructura en disco

```
proy_roles_permisos/
├── CLAUDE.md                  # Instrucciones + contexto del proyecto (se carga cada sesión)
├── AGENTS.md                  # Contexto para otras herramientas IA (Cursor, Copilot…)
├── BACKLOG.md                 # Estado de tareas (pendientes, deuda, ideas) — vivo
├── .claude/
│   ├── settings.json          # Registro de hooks
│   ├── settings.local.json    # Permisos (allowlist) por máquina
│   ├── skills/                # 46 skills (conocimiento procedimental)
│   │   ├── lessons-learned/   #   ← KB de incidencias del proyecto (síntoma→causa→fix)
│   │   ├── dokploy-deploy/    #   ← despliegue en VPS (Dokploy+Traefik)
│   │   ├── new-admin-feature/ #   ← scaffold de secciones del Admin Panel
│   │   └── (drf-*, react-*, nextjs-*, tauri-*, ui-*… genéricos)
│   ├── agents/                # 14 subagentes especializados
│   ├── commands/              # 4 slash-commands (create-prd, generate-report, onboard, pr-review)
│   ├── rules/                 # 4 reglas (agent-orchestration, ai-development, code-style, security)
│   └── hooks/                 # 5 hooks (automatización en eventos)
├── evals/                     # Capa de medición del agente
│   ├── EVAL-0X-*.md           #   5 tareas-patrón con rúbrica
│   ├── RESULTS.md             #   puntajes por corrida (línea base / comparación)
│   └── observations/          #   traza automática por sesión (runs.md, gitignored)
├── reports/                   # Bitácora histórica: "qué pasó y cómo se solucionó" (con fecha)
├── prd/ · plans/ · roadmaps/  # Requisitos / planes de implementación
├── docs/
│   ├── adr/                   # Architecture Decision Records (inmutables)
│   └── guides/                # Guías (esta incluida)
└── (memoria personal del agente: ~/.claude/.../memory/ — fuera del repo)
```

---

## 3. Las capas en detalle

### 3.1 Contexto / Scaffolding — *lo que el agente sabe antes del primer prompt*

- **`CLAUDE.md`** — el documento maestro: stack, layout, API, patrones, planes, reglas de workflow y la
  sección **"Sistema de conocimiento del proyecto"** que destaca los 3 skills propios y la capa de
  evals. Se carga **en cada sesión**, así que es el lugar donde se "surfacea" lo importante.
- **`.claude/rules/`** — instrucciones modulares: `code-style`, `security`, `ai-development` y
  `agent-orchestration` (cuándo correr agentes en paralelo vs secuencial).
- **`AGENTS.md`** — el mismo contexto para herramientas IA externas (estándar abierto).

### 3.2 Conocimiento — *conocimiento procedimental reutilizable*

- **Skills genéricos** (`drf-*`, `react-*`, `nextjs-*`, `tauri-*`, `ui-*`): guías de framework.
- **Skills del proyecto** (el valor diferencial):
  - **`lessons-learned`** — base de conocimiento de incidencias (`LL-001…LL-091`, 9 secciones), patrón
    *síntoma → causa raíz → solución → prevención*. Se **consulta** antes de depurar y se **registra**
    tras resolver. Es la "memoria de errores" del proyecto.
  - **`dokploy-deploy`** — despliegue de las apps en el VPS.
  - **`new-admin-feature`** — andamiaje de secciones del Admin Panel.
- Un skill se activa por **relevancia** (su `description`) o explícitamente con `/<nombre>`.

### 3.3 Orquestación — *quién hace el trabajo*

- **`.claude/agents/`** — 14 subagentes especializados (builders, QA, research, infra, docs). Cada uno
  trae un bloque **"Conocimiento del proyecto"** que le indica consultar la KB de `lessons-learned`
  antes de actuar (vía `Read`/`Grep`, ya que los subagentes no tienen el `Skill` tool).
- **`.claude/rules/agent-orchestration.md`** — define los flujos (`researcher → builder → QA`), qué
  corre en paralelo (máx 3) y qué va secuencial, y que **todo flujo arranca consultando la KB**.
- **`.claude/commands/`** — slash-commands para tareas recurrentes (`/create-prd`, `/generate-report`,
  `/onboard`, `/pr-review`).

### 3.4 Memoria + Artefactos — *estado durable*

| Artefacto | Pregunta que responde | Naturaleza |
|-----------|----------------------|-----------|
| `BACKLOG.md` | ¿Qué falta hacer ahora? | Vivo, cambia siempre |
| `reports/` | ¿Qué pasó y cómo se solucionó? | Histórico, con fecha |
| `lessons-learned` (KB) | ¿Ya nos pasó esto? síntoma→causa→fix | Acumulativo, consultable por síntoma/tag |
| `prd/` · `plans/` · `roadmaps/` | ¿Qué problema? ¿Cómo se implementa? | Pre-implementación |
| `docs/adr/` | ¿Por qué este diseño y no otro? | Inmutable (se reemplaza con ADR nuevo) |
| `memory/` (personal) | Notas efímeras del asistente | Por-usuario, fuera del repo |

> **Frontera memoria personal ↔ KB**: `memory/` (en `~/.claude/`) guarda notas locales/efímeras; las
> lecciones del **proyecto** van a `lessons-learned` (versionada en git). No se duplican.

### 3.5 Automatización / Gobernanza — *lo que pasa solo*

Los **hooks** (`.claude/hooks/`, registrados en `settings.json`) ejecutan acciones en eventos:

| Hook | Evento | Qué hace |
|------|--------|----------|
| `lessons-learned-consult.sh` | UserPromptSubmit | Si el prompt parece un bug, inyecta la KB y recuerda consultarla antes de depurar |
| `observability-run-log.py` | Stop | Registra la traza de la sesión en `evals/observations/runs.md` |
| `sync-claude-md.sh` | Stop | Mantiene la lista de skills/agentes/hooks en `CLAUDE.md` al día |
| `detect-doc-changes.sh` | Stop | Detecta cambios de código que requieren actualizar docs |
| `task-finished-alert.py` | Stop | Alerta al terminar una tarea |

`settings.local.json` define la **allowlist de permisos** (qué comandos puede correr sin preguntar).

### 3.6 Medición — *¿el harness mejora?*

- **`evals/`** — 5 tareas-patrón con rúbrica + `RESULTS.md`. Miden la **capacidad del agente** (no el
  código de la app) sobre lo que más se repite en el repo. Se corren tras tocar el harness.
- **`evals/observations/`** — el hook de observability registra **qué hizo el agente** en cada sesión
  (skills/tools usados, si consultó la KB, si corrió tests), para diagnosticar por qué falló un eval.

---

## 4. Cómo se comunican — los dos loops

El harness no es una lista de piezas sueltas: están conectadas por dos ciclos.

### Loop A — Aprendizaje (mejora el conocimiento)

```
Bug/feature → CONSULTAR lessons-learned (¿ya pasó?) → resolver
   → reporte en reports/ → DESTILAR la lección (LL-0XX en la KB)
   → actualizar BACKLOG.md → (la próxima vez, el bug ya está resuelto)
```

Disparado/recordado por: el hook `lessons-learned-consult` (al inicio), las reglas de `CLAUDE.md`
(Workflow Rules) y `feature-development-workflow.md` (al cerrar). Cada agente lo refuerza con su bloque
"Conocimiento del proyecto".

### Loop B — Mejora del harness (cierra el bucle con datos)

```
Cambio al harness (skill/hook/regla/CLAUDE.md)
   → correr evals/ (¿subió o bajó el puntaje?)
   → si bajó: observations/runs.md dice POR QUÉ (la "→ Señal")
   → ajustar la pieza responsable → re-correr evals → registrar en RESULTS.md
```

Así el harness deja de mejorarse "a ciegas": cada cambio se **mide** (evals) y se **diagnostica**
(observability).

### La orquestación, conectada

Cuando se orquesta (`researcher + planner → builder → code-reviewer + test-generator`), **cada
subagente consulta la KB** antes de actuar y **cita el `LL-0XX`** relevante, de modo que el conocimiento
acumulado fluye a quien hace el trabajo, no solo al hilo principal.

---

## 5. Mapeo a los componentes de un harness (referencia)

Para situar el proyecto frente a la literatura de *harness engineering*:

| Componente canónico | En este repo |
|---------------------|--------------|
| Filesystem / estado durable | El repo + `reports/` + `BACKLOG.md` |
| Code execution | `Makefile` (`make test/migrate…`) + Bash |
| Memory (cross-session) | `memory/` (personal) + `lessons-learned` (proyecto) |
| Context management | Compactación de Claude Code + *progressive disclosure* en skills + índice `MEMORY.md` |
| Orchestration & tool use | `.claude/agents/` + `agent-orchestration.md` + `.claude/commands/` |
| Security & governance | `.claude/rules/security.md` + `settings.json`/`settings.local.json` |
| Observability | `evals/observations/` (hook) + `reports/` |
| Evals | `evals/` + `RESULTS.md` |
| Scaffolding (pre-prompt) | `CLAUDE.md` + skills + rules + commands |

---

## 6. Cómo extender o mantener el harness

- **Nuevo skill** → `/skill-creator` (ver `project-skills.md`). Si es del proyecto, enlázalo a
  `lessons-learned` y añádelo a la sección "Sistema de conocimiento" de `CLAUDE.md`.
- **Nueva lección** → entrada `LL-0XX` en `lessons-learned/references/knowledge-base.md` (parte del
  cierre de cada tarea no trivial).
- **Nuevo agente** → añade el bloque "Conocimiento del proyecto" (consultar la KB) como los demás.
- **Tras tocar el harness** → corre `evals/` y revisa `evals/observations/runs.md` (Loop B).
- **`CLAUDE.md` se auto-actualiza** (la lista de skills/agentes/hooks) vía el hook `sync-claude-md.sh`
  en cada `Stop`; el resto de secciones se editan a mano.

---

## Resumen en una frase

El modelo aporta la inteligencia; **este harness aporta el contexto (CLAUDE.md/rules), el conocimiento
(skills + lessons-learned), la mano de obra (agentes), la memoria (reports/BACKLOG/ADR), la
automatización (hooks) y la medición (evals/observability)** — y los dos loops (aprendizaje y mejora del
harness) mantienen todo eso conectado y mejorando con el tiempo.
