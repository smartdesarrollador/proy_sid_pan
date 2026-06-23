# Diagrama del harness (Mermaid)

Diagramas del funcionamiento del harness de IA del proyecto. Render nativo en GitHub.
Explicación completa en [docs/guides/harness-arquitectura.md](../guides/harness-arquitectura.md).

> Nota: el resto de diagramas de esta carpeta usan PlantUML (`.puml`); este usa Mermaid embebido en
> Markdown porque describe el harness de tooling (no el dominio de la app).

---

## 1. Arquitectura por capas y comunicación

```mermaid
flowchart TB
    User(["👤 Usuario / prompt"])

    subgraph CTX["🧭 Contexto / Scaffolding — se carga cada sesión"]
        CLAUDE["CLAUDE.md"]
        RULES[".claude/rules/ (4)"]
        AGENTSMD["AGENTS.md"]
    end

    subgraph KNOW["📚 Conocimiento"]
        SKILLS[".claude/skills/ (46)"]
        LL["lessons-learned<br/>KB de incidencias (LL-0XX)"]
    end

    subgraph ORCH["🤝 Orquestación"]
        AGENTS[".claude/agents/ (14)"]
        CMDS[".claude/commands/ (4)"]
    end

    subgraph MEM["🗃️ Memoria + Artefactos"]
        REPORTS["reports/"]
        BACKLOG["BACKLOG.md"]
        DOCS["prd/ · plans/ · docs/adr/"]
    end

    subgraph AUTO["⚙️ Automatización — hooks + settings.json"]
        HOOKS[".claude/hooks/ (5)"]
    end

    subgraph MEAS["📊 Medición"]
        EVALS["evals/ + RESULTS.md"]
        OBS["evals/observations/runs.md"]
    end

    User -->|"hook lessons-learned-consult<br/>inyecta la KB si es un bug"| CLAUDE
    CTX -->|"define cómo trabaja"| ORCH
    SKILLS -.-> LL
    AGENTS -->|"Read/Grep: consultar"| LL
    ORCH -->|"produce trabajo"| MEM
    MEM -->|"destilar lección"| LL
    AUTO -->|"vigila / registra"| MEM
    AUTO -->|"traza por sesión (Stop)"| OBS
    AUTO -->|"sync lista de skills"| CLAUDE
    MEAS -.->|"¿el harness mejora?"| CTX
    EVALS -.- OBS
```

---

## 2. Los dos loops del funcionamiento

```mermaid
flowchart LR
    subgraph LA["🔁 Loop A — Aprendizaje (mejora el conocimiento)"]
        direction TB
        a1["Bug / feature"] --> a2["Consultar lessons-learned<br/>¿ya pasó?"]
        a2 --> a3["Resolver"]
        a3 --> a4["reports/ + destilar LL-0XX"]
        a4 --> a5["BACKLOG.md"]
        a5 -.->|"la próxima vez ya está resuelto"| a2
    end

    subgraph LB["🔁 Loop B — Mejora del harness (cierra con datos)"]
        direction TB
        b1["Cambio al harness<br/>skill / hook / regla / CLAUDE.md"] --> b2["Correr evals/"]
        b2 --> b3{"¿bajó el puntaje?"}
        b3 -->|"sí"| b4["observations/runs.md<br/>dice POR QUÉ (→ Señal)"]
        b4 --> b5["Ajustar la pieza responsable"]
        b5 --> b2
        b3 -->|"no"| b6["Registrar en RESULTS.md"]
    end
```

---

## 3. Flujo de una sesión orquestada (secuencia)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant H as Hooks
    participant M as Agente principal
    participant KB as lessons-learned (KB)
    participant SA as Subagentes
    participant OB as observations/

    U->>H: prompt (UserPromptSubmit)
    H-->>M: si es bug, inyecta la KB + recordatorio
    M->>KB: grep por síntoma/tag (consultar)
    M->>SA: orquesta (researcher → builder → QA)
    SA->>KB: cada subagente consulta la KB (Read/Grep)
    SA-->>M: trabajo + cita LL-0XX
    M->>KB: registra lección nueva (si no trivial)
    M-->>U: respuesta
    Note over H,OB: al terminar (Stop)
    H->>OB: registra la traza de la sesión
```

---

## Leyenda

- **Flecha sólida** → flujo/acción directa.
- **Flecha punteada** → relación o realimentación (feedback).
- Cada caja referencia un elemento real del repo (ver la estructura en
  [harness-arquitectura.md](../guides/harness-arquitectura.md)).
