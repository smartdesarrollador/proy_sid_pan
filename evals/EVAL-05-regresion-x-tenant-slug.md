# EVAL-05 — Regresión: lista vacía sin error (X-Tenant-Slug)

**Skill objetivo:** `lessons-learned`
**Tipo:** regresión
**Qué mide:** que el agente **reutilice una incidencia ya documentada** ante un síntoma sutil (fallo silencioso multi-tenant). Es la eval de regresión: si un cambio al harness rompe la consulta a la KB, esta es la que lo delata.

## Prompt (pegar tal cual en una sesión NUEVA del repo)

> Estoy integrando un cliente nuevo (una app de escritorio) contra el backend. El login funciona y el token es válido, pero al pedir la lista de snippets/recursos del usuario me devuelve una lista vacía — sin error, sin 401, sin 403, solo `[]`. El mismo usuario sí ve sus datos en el Workspace. ¿Qué está pasando?

## Rúbrica (puntuar cada ítem: ✅1 / 🟡0.5 / ❌0 → total /8)

- [ ] Consultó la base de conocimiento de `lessons-learned` antes de teorizar.
- [ ] Identificó la causa: falta el header **`X-Tenant-Slug`** → `TenantMiddleware` resuelve `tenant=None` → query filtra `tenant=None` → lista vacía.
- [ ] Citó la entrada **LL-030** (header `X-Tenant-Slug` faltante → lista vacía silenciosa).
- [ ] Explicó por qué el Workspace sí funciona (su `apiClient`/axios inyecta el header por interceptor).
- [ ] Indicó que el valor del header sale del `slug`/`subdomain` del tenant (del payload de auth/SSO).
- [ ] Señaló que el fallo es **silencioso** (vacío, no 401/403), por eso confunde.
- [ ] Propuso la solución correcta: enviar `X-Tenant-Slug` en el cliente nuevo (idealmente vía interceptor central).
- [ ] No se fue por una causa equivocada (token/permisos/CORS) como diagnóstico final.

## Señales de fallo (qué revisar si puntúa bajo → observability ligera)

- No consultó `lessons-learned` → revisar si el **hook** se disparó (el prompt no trae un código HTTP de error; quizá el trigger no matcheó "lista vacía"). Posible mejora: añadir términos como "lista vacía"/"vacío sin error" al regex del hook `lessons-learned-consult.sh`.
- Atribuyó el `[]` a permisos o al token → reforzar que el fallo silencioso multi-tenant es un patrón conocido (categoría D).
- No citó LL-030 → señal de que no abrió la KB o que la entrada no es encontrable por sus tags (revisar tags de LL-030).

## Cómo correrlo

1. Sesión nueva de Claude Code en la raíz del repo.
2. Pegar el Prompt.
3. Marcar la rúbrica y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md).

> Esta eval es especialmente útil como **prueba de regresión**: si editas `CLAUDE.md`, el hook o el
> skill `lessons-learned` y el puntaje baja, detectaste que el cambio degradó la consulta a la KB.
