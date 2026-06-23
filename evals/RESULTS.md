# Resultados de evals

Bitácora de puntajes por corrida. Sirve de **línea base** y de **observability ligera** del agente:
cada fila es una pasada de la suite; la columna *Notas* registra qué había en el harness en ese momento
(qué skill/regla/hook cambió), para correlacionar cambios con mejoras/regresiones.

Puntuación por eval: suma de la rúbrica (`✅1 / 🟡0.5 / ❌0`). Anotar como `puntaje/total`.
Totales máximos: EVAL-01 = 11 · EVAL-02 = 8 · EVAL-03 = 8 · EVAL-04 = 10 · EVAL-05 = 8 → **suite = /45**.

## Historial

| Fecha | EVAL-01 | EVAL-02 | EVAL-03 | EVAL-04 | EVAL-05 | Total /45 | Notas (qué cambió en el harness) |
|-------|:-------:|:-------:|:-------:|:-------:|:-------:|:---------:|----------------------------------|
| _(pendiente)_ | – | – | – | – | – | – | Línea base inicial — correr tras crear los 3 skills + hook |

## Cómo registrar una corrida

1. Correr los 5 evals según [README.md](README.md) (sesiones nuevas, pegar el Prompt, marcar rúbrica).
2. Añadir una fila con la fecha y el puntaje de cada eval.
3. En *Notas*, describir el estado del harness: p.ej. "baseline (3 skills + hook)", "tras editar
   `new-admin-feature/SKILL.md`", "tras añadir skill `new-django-app`", "tras tocar `CLAUDE.md`".
4. Comparar contra la fila anterior: un puntaje que **sube** valida el cambio; uno que **baja** es una
   regresión → usar las "Señales de fallo" del eval afectado para localizar la causa.

## Observaciones por corrida

> Espacio libre para notas cualitativas de cada pasada (qué se observó, qué se ajustó después).

- _(aún sin corridas)_
