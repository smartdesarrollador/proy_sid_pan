# EVAL-03 — 404 en un endpoint nuevo del Hub (trailing slash)

**Skill objetivo:** `lessons-learned`
**Tipo:** troubleshoot
**Qué mide:** que el agente **consulte la base de incidencias** y aplique la solución ya documentada (trailing slash) en vez de re-investigar desde cero.

## Prompt (pegar tal cual en una sesión NUEVA del repo)

> Agregué un endpoint nuevo en el backend y desde el Hub (Next.js) la llamada falla. En desarrollo a veces va y en producción me da 404 / 405. ¿Por qué pasa y cómo lo arreglo?

## Rúbrica (puntuar cada ítem: ✅1 / 🟡0.5 / ❌0 → total /8)

- [ ] Consultó la base de conocimiento de `lessons-learned` (grep en `knowledge-base.md`) antes de teorizar.
- [ ] Identificó el patrón **trailing slash** como causa probable (no se fue por CORS/red como primera hipótesis).
- [ ] Citó **LL-001** (Django `APPEND_SLASH` convierte POST→GET → 405/500) y/o **LL-002** (doble slash en el proxy de Next → 404).
- [ ] Explicó la diferencia dev vs prod: en prod el Hub llama directo al backend (sin el proxy que normaliza la slash).
- [ ] Recomendó verificar la slash exacta del `path(...)` en el `urls.py` de Django.
- [ ] Distinguió: cliente del Hub **sin** slash (el proxy la añade) vs llamada directa a prod **con** la slash de Django.
- [ ] Mencionó (si aplica) la sección A "trailing slash" como patrón maestro del proyecto.
- [ ] No propuso un parche incorrecto (ej. desactivar `APPEND_SLASH` global) como solución principal.

## Señales de fallo (qué revisar si puntúa bajo → observability ligera)

- No consultó `lessons-learned` y empezó a depurar desde cero → revisar que el **hook** `lessons-learned-consult.sh` se haya disparado (¿el prompt contenía un trigger? 404/405 sí lo son) y la `description` del skill.
- Atribuyó el fallo a CORS o a la red → reforzar que el síntoma 404/405 de routing ≈ trailing slash (sección A).
- No citó ningún `LL-0XX` → señal de que no abrió la KB.

## Cómo correrlo

1. Sesión nueva de Claude Code en la raíz del repo.
2. Pegar el Prompt.
3. Marcar la rúbrica y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md).
