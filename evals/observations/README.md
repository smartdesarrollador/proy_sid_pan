# Observability — traza de sesiones del agente

Capa de **observability** del harness: registra automáticamente *qué hizo el agente* en cada sesión,
para poder ver **por qué** un eval puntuó bajo o el agente se comportó raro. Complementa a
[`../RESULTS.md`](../RESULTS.md): RESULTS = puntajes entre corridas (capacidad); esto = traza por sesión
(qué pasó en cada una).

## Cómo se genera

El hook `.claude/hooks/observability-run-log.py` corre en el evento **Stop** (registrado en
`.claude/settings.json`), lee el transcript de la sesión y extrae las señales sin intervención manual.
Hace *upsert por sesión* (una entrada por `session_id`), así que durante una sesión la entrada se
actualiza, no se duplica.

Genera dos archivos (telemetría local, ignorados por git — ver más abajo):

- **`runs.jsonl`** — fuente de verdad, 1 objeto JSON por sesión.
- **`runs.md`** — vista humana (más reciente primero). **Este es el que se lee.**

## Señales registradas

| Señal | Qué significa |
|-------|---------------|
| `skills` | Skills invocados en la sesión (p.ej. `new-admin-feature`) |
| `tools` | Conteo por herramienta (`Read(24)`, `Edit(9)`, `Bash(37)`…) |
| `lessons-learned` | ✅/❌ si el agente consultó la base de incidencias (Skill, o grep/lectura de `knowledge-base.md`) |
| `archivos` | Nº de archivos únicos editados + dirs de primer nivel donde trabajó |
| `tests` | Si corrió tests/typecheck/build, y señal best-effort `pass`/`fail`/`unknown` |
| `→ Señal` | Alerta heurística cuando algo llama la atención (ver abajo) |

### Heurísticas de "→ Señal"

Se resaltan automáticamente, por ejemplo:
- *"tocó código pero no consultó la KB de incidencias"* — editó `src/`/`apps/`/`.claude/skills` sin abrir `lessons-learned` (posible bug re-investigado desde cero).
- *"editó código sin correr tests/build"* — cerró sin verificar (relacionado: `lessons-learned` LL-079).
- *"tests con señal de fallo"* — la heurística detectó fallos en la salida de tests.

## Cómo usarlo con los evals

1. Corre un eval en una sesión nueva (ver [`../README.md`](../README.md)).
2. Si el eval puntúa bajo, abre `runs.md` y mira la entrada de esa sesión:
   - ¿Usó el skill esperado? ¿Consultó `lessons-learned` cuando debía? ¿Corrió el build?
3. La "→ Señal" suele apuntar directo a qué pieza del harness afinar (la misma idea que la sección
   "Señales de fallo" de cada eval).

## Nota sobre git

`runs.jsonl` y `runs.md` son **telemetría local por máquina** (con churn por sesión) → están en
`.gitignore`. Solo se versiona este `README.md`. Si quieres historial compartido del agente entre
máquinas, quita esas dos líneas del `.gitignore` raíz.
