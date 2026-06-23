---
name: lessons-learned
description: >
  Base de conocimiento de incidencias, bugs y soluciones recurrentes del proyecto RBAC Subscription
  Platform, destilada de la carpeta reports/. Usar SIEMPRE (1) ANTES de depurar un bug, error o
  comportamiento raro — para comprobar si ya se resolvió algo igual o similar; (2) DESPUÉS de
  resolver un problema no trivial — para registrar la lección y que no se repita; (3) cuando el
  usuario pida "revisar incidencias pasadas", "qué lecciones tenemos", "aprende de los reportes",
  "actualiza el conocimiento" o variantes; (4) al escribir un nuevo reporte en reports/. Triggers
  típicos por síntoma: errores 404/405/308/500 por trailing slash, variables NEXT_PUBLIC_* vacías
  en producción, contenedores Docker que no recargan tras cambios, CORS "Failed to fetch", header
  X-Tenant-Slug faltante, GET con efectos secundarios, hidratación SSR en Next.js, multipart/FormData
  con axios, tests MSW que fallan por URL mismatch.
---

# Lessons Learned — Memoria de incidencias del proyecto

## Qué es

Una base de conocimiento curada y **versionada en git** (`references/knowledge-base.md`) que captura
el patrón *síntoma → causa raíz → solución → prevención* de cada incidencia no trivial resuelta en
el proyecto. Crece con el tiempo: cada problema nuevo resuelto se añade como una entrada.

A diferencia de `reports/` (relato narrativo y cronológico de cada sesión de trabajo) y de la memoria
personal en `~/.claude/.../memory/` (notas del asistente, no compartidas con el equipo), esta base es
**accionable, categorizada y consultable por síntoma** — pensada para responder rápido "¿ya nos pasó
esto antes y cómo lo arreglamos?".

## Las tres operaciones del skill

### 1. CONSULTAR — antes de depurar (lo más importante)

Ante cualquier bug, error o comportamiento inesperado, **antes de empezar a investigar desde cero**:

1. Leer la tabla de contenidos de `references/knowledge-base.md`.
2. Buscar por síntoma con grep. Ejemplos:
   ```bash
   grep -niE "trailing slash|404|405|308|append_slash" .claude/skills/lessons-learned/references/knowledge-base.md
   grep -niE "NEXT_PUBLIC|build.?arg|dokploy" .claude/skills/lessons-learned/references/knowledge-base.md
   grep -niE "docker (restart|compose)|recompil|recrear contenedor" .claude/skills/lessons-learned/references/knowledge-base.md
   grep -niE "tenant.slug|x-tenant|cors|failed to fetch" .claude/skills/lessons-learned/references/knowledge-base.md
   ```
3. Buscar también por **tags** al final de cada entrada (`**Tags:**`).
4. Si hay una entrada que coincide, aplicar la solución/prevención ya conocida en lugar de re-investigar.
   Mencionar al usuario que se está reutilizando una lección previa y citar la entrada (`[LL-00X]`).
5. Si no hay coincidencia exacta pero sí una categoría relacionada, leer esa sección entera — suele
   haber contexto útil (p.ej. casi cualquier 404/redirect en este proyecto es trailing slash).

### 2. REGISTRAR — después de resolver

Tras resolver un problema **no trivial** (uno que costó diagnosticar, tuvo causa raíz no obvia, o es
probable que reaparezca), añadir una entrada a `references/knowledge-base.md`:

1. Asignar el siguiente ID correlativo (`LL-0XX`).
2. Colocarla en la categoría correcta (ver TOC). Si encaja en una categoría existente, agrupar ahí.
3. Usar el **formato de entrada** (abajo). Ser conciso: causa raíz + fix + cómo prevenirlo.
4. Si reincide un patrón ya documentado, **no duplicar** — añadir el caso a la entrada existente como
   variante en "Casos vistos".
5. Actualizar la tabla de contenidos si se creó una categoría nueva.
6. No copiar el reporte entero: la entrada es la *destilación* accionable. El reporte queda como fuente.

> Esto complementa la regla de `CLAUDE.md` de actualizar `BACKLOG.md` y escribir un reporte en
> `reports/` al completar trabajo. Flujo recomendado al cerrar una tarea con incidencias:
> escribir/actualizar el reporte → destilar la(s) lección(es) aquí → actualizar `BACKLOG.md`.

### 3. SEED / SINCRONIZAR — aprender de los reportes

Para construir o poner al día la base desde `reports/`:

1. Listar los reportes: `ls reports/ reports/varios/`.
2. Revisar `references/sources.md` (índice de reportes ya digeridos). Procesar solo los que **no**
   estén en esa lista (modo incremental).
3. Para cada reporte nuevo, leer y extraer las secciones de incidencias. En estos reportes el
   conocimiento suele estar bajo encabezados como: "El problema difícil", "Problema N", "Bugs
   encontrados", "Incidencias durante la implementación", "Lecciones aprendidas", "Causa raíz".
4. Crear una entrada por incidencia distinta (o sumarla a una existente si es el mismo patrón).
5. Añadir el reporte a `references/sources.md` con la lista de IDs que generó.

Cuando el usuario diga "aprende de los reportes" / "actualiza el conocimiento", ejecutar este modo
incremental (no reprocesar lo ya digerido).

## Formato de entrada

```markdown
### LL-0XX — Título corto y buscable
- **Síntoma:** qué se observa (mensaje de error, comportamiento). Incluir el texto literal del error si lo hay.
- **Causa raíz:** el porqué real, no el parche.
- **Solución:** el fix concreto (archivo/comando/snippet mínimo).
- **Prevención:** qué hacer para que no vuelva a pasar / qué revisar primero la próxima vez.
- **Casos vistos:** (opcional) lista de reapariciones del mismo patrón.
- **Fuente:** `reports/<archivo>.md`
- **Tags:** palabra-clave, palabra-clave, ...
```

## Reglas de calidad

- Una entrada = un patrón de fallo. Si dos incidencias comparten causa raíz, son **una** entrada con
  varios "Casos vistos".
- Priorizar **prevención** sobre narrativa: el valor está en "qué revisar primero la próxima vez".
- Mantener tags consistentes para que el grep cruce categorías (p.ej. usar siempre `trailing-slash`,
  `dokploy`, `docker-reload`, `multi-tenant`, `ssr-hydration`).
- No meter secretos ni credenciales reales en las entradas (ver `.claude/rules/security.md`).
- Si una entrada queda obsoleta porque el código cambió, actualizarla o marcarla `OBSOLETO:` con la fecha.

## Archivos del skill

- `references/knowledge-base.md` — la base de conocimiento (consultar/editar aquí). Tiene tabla de
  contenidos por categoría; usar grep para búsquedas por síntoma o tag.
- `references/sources.md` — índice de reportes ya digeridos y los IDs que generó cada uno. Sirve para
  el modo seed incremental.
