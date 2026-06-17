# Dinámica para implementar una funcionalidad nueva con Claude Code

**Última actualización**: 2026-06-17

Guía de los pasos recomendados al construir una feature nueva (o corregir un bug
significativo) en este proyecto, usando Claude Code y los artefactos de
conocimiento ya definidos (`BACKLOG.md`, `prd/`, `plans/`, `reports/`, `docs/adr/`).

> Esta es la guía vigente para el flujo de trabajo del día a día. Si en el futuro
> se actualiza, mover la fecha de arriba — no es necesario crear una guía nueva por
> cada cambio (a diferencia de los ADR, esta guía sí es un living doc).

---

## 1. Retomar contexto — revisar `BACKLOG.md`

Al iniciar sesión, pedir a Claude que revise `BACKLOG.md` antes de empezar:

> "Revisa BACKLOG.md y dime qué hay pendiente relacionado con X"

Claude resume pendientes activos, deuda técnica e ideas relevantes a lo que se va a
trabajar. Este paso evita arrancar "con la mente en blanco" y permite detectar si la
feature nueva ya tiene contexto previo (deuda técnica relacionada, decisiones ya
tomadas, etc.).

---

## 2. PRD — solo para features nuevas de tamaño mediano/grande

Según la regla en `CLAUDE.md` (*"Create PRD before implementing new features"*):

- **Feature nueva mediana/grande** → crear un PRD corto en `prd/` antes de planificar:
  qué problema resuelve, qué queda fuera de alcance, criterios de aceptación.
- **Fix de bug o feature pequeña (1-2 archivos)** → se puede omitir este paso.

---

## 3. Plan de implementación

Pedir a Claude el plan técnico antes de tocar código. Según el alcance:

- **Sección reducida** → el plan vive en `plans/`.
- **Mapeo de muchas secciones/páginas a la vez** (varios planes relacionados) →
  usar `roadmaps/`, que guía esos planes individuales.

En este paso se revisa el approach junto con Claude (arquitectura, archivos a tocar,
alternativas) antes de implementar.

### 3.1 Tasks con criterios verificables (opcional — features medianas/grandes)

Para planes que tocan varios archivos o componentes, conviene desglosar el plan en
una checklist de tareas con **criterios de éxito verificables** (no subjetivos),
antes de empezar a codear. En vez de "código bien estructurado", usar checks
objetivos tipo:

```
- [ ] Migración aplicada — `make migrate` sin errores
- [ ] Endpoint responde 200 — `curl .../api/x`
- [ ] Tests pasan — `make test` 0 fallos nuevos
```

Esto ayuda a:
- Detectar partes del plan ambiguas **antes** de implementar (si no se puede
  escribir un criterio verificable, esa parte del plan no está bien definida)
- Tener una definición objetiva de "terminado" en vez de un juicio subjetivo
- Dar checkpoints claros en tareas largas con varios archivos

Se omite en fixes puntuales o features chicas (1-2 archivos) — ahí se va directo
de plan a código.

---

## 4. Implementación + corrección de errores

Claude implementa siguiendo el plan acordado. Si surgen errores (tests, lint,
typecheck), se corrigen en el mismo ciclo antes de continuar.

Recordatorio: siempre correr `make test` antes de dar por cerrada la tarea
(regla en `CLAUDE.md`).

---

## 5. Reporte — y ADR si hubo una decisión arquitectónica

- **Reporte** (`reports/AAAA-MM-DD-titulo.md`): documentar siempre que hubo un bug
  significativo o una implementación no trivial. Responde *"¿qué pasó y cómo se
  solucionó?"*.
- **ADR** (`docs/adr/00X-titulo.md`): solo si la implementación involucró una
  **decisión arquitectónica con alternativas** (ej. elegir un enfoque de pago, un
  mecanismo de autenticación, un patrón de integración). No es necesario pedirlo
  explícitamente — si la implementación califica, Claude lo sugiere.
  - Los ADR son inmutables: si la decisión cambia más adelante, se crea un ADR
    nuevo y se marca el anterior como `Reemplazado por ADR-00X` (no se edita el
    original).
- Si existe un ADR relacionado con el reporte, citarlo en el encabezado del reporte
  (y viceversa) para mantener trazabilidad entre "qué pasó" y "por qué se diseñó así".

---

## 6. Actualizar `BACKLOG.md` (automático)

Este paso **no requiere pedirlo explícitamente** — es una regla activa en
`CLAUDE.md` (sección *Workflow Rules*): al completar una funcionalidad o corregir
un bug, Claude actualiza `BACKLOG.md` por su cuenta:

- Mueve pendientes resueltos fuera de la lista
- Agrega nueva deuda técnica o ideas de feature que hayan surgido durante el
  trabajo, citando el reporte (y el ADR, si aplica) de origen

Como respaldo, el usuario puede recordarlo manualmente al final de una tarea larga.

---

## Resumen del flujo

```
Revisar BACKLOG.md (pedir a Claude que lo recuerde)
  → PRD (solo features grandes)            → prd/
  → Plan de implementación                  → plans/ (o roadmaps/ si son varias secciones)
  → Tasks con criterios verificables (opcional, features medianas/grandes)
  → Código + corrección de errores          → make test
  → Reporte (si aplica)                     → reports/
  → ADR (solo si hubo decisión arquitectónica) → docs/adr/
  → BACKLOG.md se actualiza solo (regla en CLAUDE.md)
```

## Relación entre artefactos

| Artefacto | Pregunta que responde | ¿Cuándo se crea? | ¿Es histórico/inmutable? |
|-----------|------------------------|-------------------|---------------------------|
| `BACKLOG.md` | ¿Qué falta hacer ahora? | Vive y se actualiza siempre | No — es liviano y cambia constantemente |
| `prd/` | ¿Qué problema resuelve esta feature? | Antes de planificar (features grandes) | Living doc mientras la feature esté en desarrollo |
| `plans/` | ¿Cómo se va a implementar? | Antes de codear una sección reducida | Se puede archivar al completarse |
| `roadmaps/` | ¿Cómo se mapean varias secciones/planes? | Al construir muchas páginas/secciones | Living doc de alto nivel |
| `reports/` | ¿Qué pasó y cómo se solucionó? | Al cerrar un bug significativo o feature no trivial | Sí — histórico, con fecha |
| `docs/adr/` | ¿Por qué se eligió este diseño sobre otros? | Cuando hubo una decisión arquitectónica con alternativas | Sí — inmutable, se reemplaza con un ADR nuevo |
