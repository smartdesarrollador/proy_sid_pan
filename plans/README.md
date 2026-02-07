# Plans - Planificacion del Proyecto

Directorio central para toda la planificacion del proyecto: roadmap, sprints y notas.

## Estructura

```
plans/
├── README.md            # Esta guia
├── roadmap/             # Vision a largo plazo
├── sprints/             # Planificacion iterativa
└── notes/               # Notas y lluvia de ideas
```

## Subdirectorios

### `roadmap/` - Vision y Milestones

Planes de alto nivel que definen la direccion del proyecto.

| Que guardar | Ejemplos |
|---|---|
| Roadmap general del proyecto | `roadmap-2026.md` |
| Definicion de fases | `phase-1-mvp.md`, `phase-2-scaling.md` |
| Milestones y objetivos | `milestones-q1.md` |
| Prioridades estrategicas | `priorities.md` |

### `sprints/` - Planificacion Iterativa

Planificacion de trabajo por ciclos (sprints, iteraciones, semanas).

| Que guardar | Ejemplos |
|---|---|
| Plan de sprint | `sprint-01.md`, `sprint-02.md` |
| Backlog priorizado | `backlog.md` |
| Retrospectivas | `retro-sprint-01.md` |
| Velocidad y metricas | `velocity.md` |

### `notes/` - Notas de Planificacion

Espacio libre para brainstorming, ideas y notas antes de formalizarlas.

| Que guardar | Ejemplos |
|---|---|
| Lluvia de ideas | `ideas-rag-improvements.md` |
| Notas de reunion | `meeting-2026-02-05.md` |
| Comparativas de tecnologias | `comparison-vector-dbs.md` |
| Bocetos de features | `draft-auth-system.md` |

## Diferencia con otros directorios

| Directorio | Enfoque |
|---|---|
| `plans/` | **Cuando y como** ejecutar (timeline, prioridades, tareas) |
| `prd/` | **Que** construir (especificaciones de features) |
| `docs/adr/` | **Por que** se tomo una decision tecnica |
| `.agent/spec/` | Requerimientos y restricciones para agentes IA |
