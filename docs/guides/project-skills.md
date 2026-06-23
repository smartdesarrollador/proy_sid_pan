# Skills de conocimiento del proyecto

Guía de uso de los **skills específicos del proyecto** creados para capturar el conocimiento
procedimental de este repo (no son guías genéricas de framework como los `drf-*`/`react-*`).
Conviven con los agentes y comandos descritos en [ai-workflow.md](ai-workflow.md).

| Skill | Para qué | Se invoca | Detalle |
|-------|----------|-----------|---------|
| `lessons-learned` | Consultar/registrar incidencias y soluciones del proyecto | Automático (hook + relevancia) o `/lessons-learned` | [↓](#1-lessons-learned) |
| `dokploy-deploy` | Desplegar las apps en el VPS (Dokploy + Traefik) | Por relevancia o `/dokploy-deploy` | [↓](#2-dokploy-deploy) |
| `new-admin-feature` | Andamiar una sección nueva del Admin Panel | Por relevancia o `/new-admin-feature` | [↓](#3-new-admin-feature) |

Forman un sistema: `dokploy-deploy` y `new-admin-feature` **enlazan** a las entradas `LL-0XX` de
`lessons-learned`, que es la fuente única de incidencias resueltas.

## Cómo se activa un skill (general)

1. **Automático por relevancia.** Claude lee la `description` de cada skill y lo invoca solo cuando la
   tarea encaja (p.ej. "despliega Vista" → `dokploy-deploy`). No hay que nombrarlo.
2. **Explícito.** Escribir `/<nombre-skill>` en el prompt (p.ej. `/new-admin-feature`).
3. **Por hook.** Solo `lessons-learned` tiene además un hook que lo trae al contexto automáticamente
   ante mensajes que parecen reportar un bug (ver abajo).

Los archivos viven en `.claude/skills/<nombre>/` (`SKILL.md` + `references/`). El hook
`sync-claude-md.sh` mantiene la lista de skills en `CLAUDE.md` al día automáticamente.

---

## 1. `lessons-learned`

Base de conocimiento de incidencias del proyecto destilada de `reports/`: cada entrada sigue el patrón
**síntoma → causa raíz → solución → prevención**. Vive en
`.claude/skills/lessons-learned/references/knowledge-base.md` (36 entradas, `LL-001`…`LL-091`, en 9
categorías: trailing slash, env vars/build, Docker, multi-tenancy/CORS, seguridad, frontend, testing,
deploy/Traefik, Tauri).

### Las tres operaciones

- **CONSULTAR** (antes de depurar): ante un bug, hacer grep por síntoma o tag en la base; si hay una
  entrada que coincide, aplicar su solución en vez de re-investigar.
  ```bash
  grep -niE "404|trailing slash|cors|next_public|x-tenant" \
    .claude/skills/lessons-learned/references/knowledge-base.md
  ```
- **REGISTRAR** (después de resolver): tras arreglar un problema no trivial, añadir una entrada nueva
  (`LL-0XX`) en la categoría correcta. Esto es lo que hace que la base "aprenda".
- **SEED / SINCRONIZAR**: decir *"aprende de los reportes"* o *"actualiza el conocimiento"* → procesa
  los reportes de `reports/` aún no digeridos (índice en `references/sources.md`).

### El hook automático

`.claude/hooks/lessons-learned-consult.sh` (evento `UserPromptSubmit`, registrado en
`.claude/settings.json`): cuando tu mensaje parece reportar un bug (palabras como *error, falla, no
funciona, 404/500, cors, dokploy…*), **inyecta automáticamente** la base de conocimiento y recuerda
consultarla antes de depurar y registrar la lección después. Se dispara **una vez por sesión** (no
mete ruido) y solo ante síntomas de bug; un prompt normal no lo activa.

### Frases de ejemplo

- "tengo un 404 en un endpoint nuevo del Hub" → consulta automática
- "registra la lección que acabamos de aprender" → REGISTRAR
- "aprende de los reportes nuevos" → SEED incremental

---

## 2. `dokploy-deploy`

Guía de despliegue de las apps en el VPS con **Dokploy + Traefik**. Cubre backend Django, Admin Panel,
Workspace (React+Vite/nginx), Hub y Vista (Next.js). La Desktop (Tauri) NO se despliega aquí.

### Estructura (progressive disclosure por tipo de app)

`SKILL.md` trae el workflow universal de 8 pasos + las 5 reglas de oro; las plantillas concretas están
por tipo de app en `references/`:

| App | Referencia |
|-----|-----------|
| Backend `api-rbac` (Django) | `references/django-backend.md` |
| Admin Panel / Workspace (Vite+nginx) | `references/vite-spa.md` |
| Hub / Vista (Next.js) | `references/nextjs.md` |
| Diagnóstico de fallos | `references/troubleshooting.md` |

### Cuándo usarlo

- "despliega/redeploya \<app\> en Dokploy"
- "configura Traefik / el dominio / SSL"
- "404 de Traefik", "el contenedor entra en crash-loop", "los build args no llegan"
- "preparar el `docker-compose.dokploy.yml` de una app nueva"

### Qué hace (y qué no)

Claude **no** puede operar la UI de Dokploy. El skill prepara los archivos del repo
(`docker-compose.dokploy.yml`, Dockerfile, settings/nginx) y te entrega los **pasos exactos de la UI**
+ los **comandos post-deploy** a ejecutar en la terminal del contenedor (seeds, `Service.url_template`,
CORS). La verificación final (SSL, router en Traefik, `/api/health/`) está en el checklist del SKILL.md.

---

## 3. `new-admin-feature`

Andamia una sección nueva del **Admin Panel** (`apps/frontend_admin`) reproduciendo las convenciones de
sus ~20 features existentes (PASOS 5-21). Solo Admin Panel — no Hub/Workspace/Vista.

### Qué genera

La carpeta `src/features/<recurso>/` completa (tipos, hooks de TanStack Query, componentes
tabla/modal/badge, página), el wrapper en `src/pages/`, la ruta lazy en el router y el item del Sidebar.
Plantillas copy-paste en `references/templates.md`; tests + catálogo de gotchas en `references/testing.md`.

### Cuándo usarlo

- "crea la sección de \<X\> en el Admin Panel"
- "agrega una página/módulo de administración para \<recurso\>"
- "scaffold de una vista admin"

### Por qué ahorra tiempo

Fija las convenciones ya decididas (queryKey `['admin-<recurso>']`, `staleTime` 60s, `apiClient` con
trailing slash, gating con `hasPermission`, skeleton/empty states) y trae el **catálogo de gotchas de
test** que reaparece en cada feature (`getAllByText`, `React.lazy` rompe asserts síncronos,
`ResizeObserver` como clase, Zod v4 `error`, etc.). Recordatorio del workflow: termina siempre con
`npm run typecheck && npm test && npm run build` (el build usa `tsc` estricto).

### Dependencia importante

Los permisos RBAC que gobiernan la feature (`<recurso>.read/create/...`) **deben existir en el fixture
`seed_permissions`** del backend, o el gating dará 403 (ver `lessons-learned` LL-061).

---

## Mantenimiento de los skills

- **`lessons-learned` crece con el tiempo**: cada incidencia no trivial resuelta debería sumar una
  entrada. Es parte del cierre de una tarea, junto con actualizar `BACKLOG.md` y escribir el reporte en
  `reports/` (ver [feature-development-workflow.md](feature-development-workflow.md)).
- **`dokploy-deploy` / `new-admin-feature` reflejan el código**: si cambian las convenciones del Admin
  Panel o la infra de deploy, actualizar el `SKILL.md`/`references/` correspondiente para que las
  plantillas no queden obsoletas.
- **Editar un skill**: modificar los `.md` en `.claude/skills/<nombre>/` y revalidar con
  `python3 .claude/skills/skill-creator/scripts/package_skill.py .claude/skills/<nombre>`.
- **Crear un skill nuevo**: usar `/skill-creator`. Candidatos pendientes recomendados:
  `api-endpoint-conventions` (convenciones DRF del proyecto) y `new-hub-feature`/`new-vista-feature`
  (equivalentes a `new-admin-feature` para los frontends Next.js).
- **Medir si un cambio al harness ayuda**: ver [`evals/`](../../evals/) — 5 tareas-patrón con rúbrica
  para puntuar al agente sobre estos skills y detectar mejoras/regresiones. Correr la suite tras tocar
  un skill, una regla o el `CLAUDE.md`; registrar el puntaje en `evals/RESULTS.md`.
