# Workspace Frontend — Roadmap de Implementación

**Stack**: React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query v5 · Zustand · React Router v7 · i18next · Recharts
**Directorio base**: `apps/frontend_workspace/`
**Prototipo de referencia**: `docs/ui-ux/prototype-workspace/` (puerto 3001)
**PRD**: `prd/features/projects.md` · `prd/features/productivity-services.md` · `prd/features/devops-services.md`
**API backend**: `apps/backend_django/` (apps: projects, tasks, calendar_app, notes, contacts, bookmarks, env_vars, ssh_keys, ssl_certs, snippets, forms_app, sharing, analytics, audit)
**Referencia de arquitectura**: `docs/architecture/system-overview.md` · `docs/architecture/frontend-architecture.md` · `docs/architecture/sso-architecture.md`

---

## Progreso General

| Estado | Significado |
|--------|-------------|
| ✅ Completado | Implementado y funcional |
| 🔄 En progreso | Trabajo activo |
| ⬜ Pendiente | No iniciado |

---

## Integración API

> Todos los endpoints son consumidos desde **`apps/frontend_workspace/`** hacia el backend
> en **`apps/backend_django/`** (Django REST Framework).
>
> - **Base URL local**: `http://localhost:8000/api/v1/` (proxy Vite, `VITE_API_URL=` vacío)
> - **Puerto dev server**: `5176`
> - **Documentación de la API**: `http://localhost:8000/api/docs/` (Swagger UI)
> - **Auth**: JWT Bearer (`Authorization: Bearer <accessToken>`)
> - **Tenant header**: `X-Tenant-Slug: {slug}` requerido en todos los endpoints `/app/*`
> - **Refresh automático**: interceptor Axios → `POST /auth/refresh-token`
> - **SSO entrada**: `POST /auth/sso/validate` con `{ sso_token }` → retorna JWT + user + tenant

### Endpoints por Feature

| Feature | Endpoints |
|---------|-----------|
| Auth | `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `PATCH /auth/profile`, `POST /auth/change-password`, `POST /auth/mfa/enable`, `POST /auth/mfa/disable`, `POST /auth/mfa/validate` |
| SSO | `POST /auth/sso/validate` |
| Projects | `GET/POST /app/projects/`, `PATCH/DELETE /app/projects/{id}/`, secciones `/{id}/sections/`, items `/{id}/sections/{sk}/items/`, fields `/{ik}/fields/`, reveal `/{fk}/reveal/` |
| Tasks | `GET/POST /app/tasks/`, `PATCH/DELETE /app/tasks/{id}/`, `POST /app/tasks/{id}/comments/` |
| Calendar | `GET/POST /app/calendar/`, `PATCH/DELETE /app/calendar/{id}/` |
| Notes | `GET/POST /app/notes/`, `PATCH/DELETE /app/notes/{id}/` |
| Contacts | `GET/POST /app/contacts/`, `PATCH/DELETE /app/contacts/{id}/`, `GET/POST /app/contacts/groups/` |
| Bookmarks | `GET/POST /app/bookmarks/`, `PATCH/DELETE /app/bookmarks/{id}/`, `GET/POST /app/bookmarks/collections/` |
| Env Vars | `GET/POST /app/env-vars/`, `PATCH/DELETE /app/env-vars/{id}/` |
| SSH Keys | `GET/POST /app/ssh-keys/`, `PATCH/DELETE /app/ssh-keys/{id}/` |
| SSL Certs | `GET/POST /app/ssl-certs/`, `PATCH/DELETE /app/ssl-certs/{id}/` |
| Snippets | `GET/POST /app/snippets/`, `PATCH/DELETE /app/snippets/{id}/` |
| Forms | `GET/POST /app/forms/`, `PATCH/DELETE /app/forms/{id}/`, `GET /app/forms/{id}/responses/` |
| Sharing | `GET /app/sharing/shared-with-me/`, `POST /app/sharing/share/`, `PATCH/DELETE /app/sharing/{id}/` |
| Notificaciones | `GET /app/notifications/`, `POST /app/notifications/{id}/read/`, `POST /app/notifications/read-all/` |
| Soporte | `GET/POST /support/tickets/`, `GET/PATCH /support/tickets/{id}/`, `POST /support/tickets/{id}/close/`, `POST /support/tickets/{id}/comments/` |
| Reportes | `GET /app/reports/summary/`, `GET /app/reports/usage/`, `GET /app/reports/trends/` |
| Audit | `GET /admin/audit-logs/` |
| Features | `GET /features/` (plan gates) |

---

## Agents y Skills de Desarrollo

### Skills disponibles (`.claude/skills/`)

| Skill | Cuándo usarlo |
|-------|--------------|
| `react-tailwind-components` | Crear componentes UI (cards, tablas, modales, badges, kanbans) |
| `react-api-fetch-patterns` | Hooks de fetching con Axios / TanStack Query |
| `react-api-authentication` | Login, SSO validate, refresh token, protected routes |
| `react-forms-validation` | react-hook-form + Zod en formularios |
| `react-tanstack-query` | Queries, mutations, infinite scroll, cache invalidation |
| `react-hooks-patterns` | Custom hooks (usePermissions, useFeatureGate, useDarkMode) |
| `react-context-state` | AuthContext, Zustand stores |
| `react-testing-library` | Tests con Vitest + Testing Library |
| `react-router-patterns` | Rutas protegidas, lazy loading, nested routes |
| `react-data-visualization` | Recharts (BarChart, LineChart) para reportes |
| `ui-base-components` | Botones, inputs, cards, badges del design system |
| `ui-design-tokens` | Colores, tipografía, espaciado del sistema |
| `ui-layout-system` | Navbar, sidebar, layout responsive |
| `vite-react-configuration` | vite.config.ts, proxy, aliases, env vars, docker |
| `drf-auth` | Referencia a endpoints de auth del backend |

### Agentes disponibles (`.claude/agents/`)

| Agente | Cuándo activarlo |
|--------|-----------------|
| `react-vite-builder` | Scaffolding de features completas |
| `ui-ux-designer` | Migración de prototipos, dark mode, componentes visuales |
| `test-generator` | Generar tests Vitest / Testing Library por PASO |
| `code-reviewer` | Revisión de calidad al cerrar cada PASO |
| `security-auditor` | Revisar flujo SSO, tokens, encriptación AES-256 |
| `database-optimizer` | Analizar queries N+1 en endpoints complejos (projects) |

---

## FASE 1 — Setup Base

---

## PASO 1 — Scaffold del Proyecto ⬜

**Archivos de referencia**: `apps/frontend_admin/package.json` · `apps/frontend_admin/vite.config.ts` · `apps/frontend_hub_client/docker-compose.yml`
**Dependencias**: ninguna
**Skills**: `vite-react-configuration` · `ui-design-tokens`
**Agente**: `react-vite-builder`

### Qué implementar

```
apps/frontend_workspace/
├── package.json                ← React 18, TypeScript, Vite, Tailwind, ESLint, Prettier
├── vite.config.ts              ← alias @/ → src/, proxy /api → backend, configure Host: localhost (puerto 5176)
├── tsconfig.json               ← strict mode, paths, target ES2022
├── tsconfig.node.json
├── tailwind.config.ts          ← content paths, darkMode: 'class', tokens workspace
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .env                        ← VITE_API_URL= (vacío, usa proxy Vite)
├── .env.example                ← VITE_API_URL, VITE_APP_NAME=Workspace
├── Makefile                    ← make dev, make build, make preview, make lint, make test
├── Dockerfile                  ← multi-stage: dev + prod (nginx)
├── docker-compose.yml          ← vite service (puerto 5176), API_TARGET: http://rbac_django:8000, red global
├── index.html
└── src/
    ├── main.tsx                ← Providers: QueryClient, Router, AuthProvider
    ├── App.tsx
    ├── vite-env.d.ts
    └── index.css               ← tokens dark mode, badges status/priority, utility classes
```

**Dependencias exactas** (mismas versiones que admin panel):

```json
{
  "dependencies": {
    "react": "^18.3.0", "react-dom": "^18.3.0", "react-router-dom": "^7.13.1",
    "@tanstack/react-query": "^5.90.21", "zustand": "^5.0.11", "axios": "^1.13.6",
    "react-hook-form": "^7.71.2", "@hookform/resolvers": "^5.2.2", "zod": "^4.3.6",
    "lucide-react": "^0.576.0", "recharts": "^3.7.0",
    "i18next": "^25.8.13", "react-i18next": "^16.5.4",
    "i18next-browser-languagedetector": "^8.2.1", "i18next-http-backend": "^3.0.2",
    "@tanstack/react-virtual": "^3.13.19"
  },
  "devDependencies": {
    "vitest": "^4.0.18", "@vitest/coverage-v8": "^4.0.18",
    "@testing-library/react": "^16.3.2", "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1", "msw": "^2.12.10",
    "jest-axe": "^10.0.0", "jsdom": "^28.1.0"
  }
}
```

**Nota proxy**: igual que hub client — `configure: (proxy) => { proxy.on('proxyReq', (req) => req.setHeader('Host', 'localhost')) }` para evitar `DisallowedHost` con nombre de contenedor Docker que tiene `_`.

### Tests a agregar

- Ninguno en este PASO (infraestructura pura).

---

## PASO 2 — Infraestructura Core ⬜

**Archivos de referencia**: `apps/frontend_admin/src/lib/` · `apps/frontend_admin/src/store/` · `apps/frontend_hub_client/src/i18n/`
**Dependencias**: PASO 1
**Skills**: `react-context-state` · `react-tanstack-query` · `react-api-fetch-patterns`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/
├── lib/
│   ├── axios.ts                ← publicClient + apiClient con interceptores JWT + refresh
│   └── queryClient.ts          ← QueryClient (staleTime 5min, retry 1)
├── store/
│   ├── authStore.ts            ← Zustand: user, tenant, accessToken, isAuthenticated, setUser, setTenant, setAccessToken, clearAuth
│   └── uiStore.ts              ← Zustand: darkMode, toggleDarkMode, sidebarOpen, toggleSidebar
├── types/
│   ├── auth.ts                 ← User, Tenant, LoginResult
│   └── api.ts                  ← PaginatedResponse<T>, ApiError
├── i18n/
│   ├── config.ts               ← i18next setup (es default, en fallback, lazy namespaces)
│   └── locales/
│       └── en.ts               ← traducciones inglés (common, auth, dashboard, tasks, calendar, notes, contacts, bookmarks, projects, devops, forms, sharing, audit, reports, notifications, support, settings)
└── hooks/
    ├── usePermissions.ts       ← hasPermission, hasRole, isOwner, isAdmin, getPrimaryRole, getRoleColor
    └── useFeatureGate.ts       ← hasFeature, getLimit, plan — GET /features/ (staleTime 5min)
```

**Patrones clave**:
- `authStore` localStorage con prefijo `ws-`: `ws-refreshToken`, `ws-authUser`, `ws-authTenant`
- `apiClient` interceptor 401: intenta `POST /auth/refresh-token`, reintenta request, si falla → `clearAuth()` + redirect `/login`
- `uiStore`: persiste `darkMode` en `localStorage('ws-theme')`, aplica clase `dark` en `document.documentElement`

### Tests a agregar

- `src/lib/__tests__/axios.test.ts` — interceptor Bearer header, interceptor 401 → refresh → retry

---

## FASE 2 — Auth & Shell

---

## PASO 3 — Autenticación + SSO ⬜

**Archivos de referencia**: `apps/frontend_hub_client/src/features/auth/AuthContext.tsx` · `docs/architecture/sso-architecture.md` · `docs/ui-ux/prototype-workspace/src/components/Login.jsx`
**Dependencias**: PASO 2
**Skills**: `react-api-authentication` · `react-forms-validation` · `react-router-patterns`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/
├── features/auth/
│   ├── AuthContext.tsx          ← login(), logout(), isLoading — usa publicClient
│   ├── LoginPage.tsx            ← email + password, manejo MFA, link forgot password
│   ├── ForgotPasswordPage.tsx   ← email → POST /auth/forgot-password
│   ├── ResetPasswordPage.tsx    ← token + nueva contraseña → POST /auth/reset-password
│   ├── SSOCallbackPage.tsx      ← lee ?sso_token= → POST /auth/sso/validate → store → /dashboard
│   ├── components/
│   │   ├── AuthLayout.tsx       ← layout centrado con logo "Workspace"
│   │   └── ProtectedRoute.tsx   ← lee Zustand isAuthenticated, redirect a /login
│   └── hooks/
│       ├── useLogin.ts          ← useMutation → AuthContext.login()
│       ├── useForgotPassword.ts ← POST /auth/forgot-password
│       └── useResetPassword.ts  ← POST /auth/reset-password
└── router/
    └── index.tsx               ← lazy-loaded, AuthLayout rutas públicas, ProtectedRoute + AppLayout rutas privadas
```

**Flujo SSO** (entrada desde Hub):
```
Hub → redirect → /sso/callback?sso_token=XXX
SSOCallbackPage → POST /auth/sso/validate { sso_token }
               → { access_token, refresh_token, user, tenant }
               → authStore.set* + localStorage ws-*
               → navigate('/dashboard')
```

**Rutas públicas**: `/login`, `/forgot-password`, `/reset-password`, `/sso/callback`

### Tests a agregar

- `LoginPage.test.tsx` — submit, error 401, redirect /dashboard
- `SSOCallbackPage.test.tsx` — token válido → dashboard, inválido → /login
- `ProtectedRoute.test.tsx` — sin auth → /login, con auth → children

---

## PASO 4 — AppLayout: Shell y Navegación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/Sidebar.jsx` · `docs/ui-ux/prototype-workspace/src/components/Navbar.jsx` · `apps/frontend_admin/src/layouts/`
**Dependencias**: PASO 3
**Skills**: `ui-layout-system` · `react-tailwind-components` · `react-hooks-patterns`
**Agente**: `ui-ux-designer`

### Qué implementar

```
src/
├── layouts/
│   ├── AppLayout.tsx               ← Navbar fixed h-16 z-30 + Sidebar fixed w-64 z-20 + <main ml-64 pt-16>
│   └── components/
│       ├── Navbar.tsx              ← logo, búsqueda global, campana notificaciones (badge), avatar + menú
│       ├── Sidebar.tsx             ← 5 secciones con filtrado por permisos y feature gates
│       └── LanguageSwitcher.tsx    ← ES / EN toggle
└── components/shared/
    ├── FeatureGate.tsx             ← hasFeature ? children : <UpgradePrompt>
    └── UpgradePrompt.tsx           ← banner "Upgrade a {plan} para usar esta función"
```

**Estructura del Sidebar**:

```
─── GENERAL ───────────────────────────
  Dashboard               /dashboard
─── PRODUCTIVITY ──────────────────────
  Tareas                  /tasks
  Calendario              /calendar
  Notas                   /notes
  Contactos               /contacts
  Bookmarks               /bookmarks
─── DEVOPS ────────────────────────────
  Proyectos               /projects
  Variables de Entorno    /env-vars       [feature: env_vars — Starter+]
  Claves SSH              /ssh-keys       [feature: ssh_keys — Starter+]
  Certificados SSL        /ssl-certs      [feature: ssl_certs — Starter+]
  Snippets                /snippets
─── ADMIN ─────────────────────────────
  Formularios             /forms          [feature: forms]
  Compartido conmigo      /shared
  Log de Auditoría        /audit          [permission: audit.view_auditlog]
  Reportes                /reports        [feature: analytics — Professional+]
─── ACCOUNT ───────────────────────────
  Perfil                  /profile
  Configuración           /settings
```

**Dark mode**: `uiStore.toggleDarkMode()` → class `dark` en `document.documentElement`
**Mobile**: overlay + slide-in sidebar (hamburger en Navbar)

### Tests a agregar

- `AppLayout.test.tsx` — render secciones sidebar, dark mode, mobile overlay
- `Sidebar.test.tsx` — feature gates ocultan items, permisos filtran

---

## FASE 3 — Dashboard & Productividad I

---

## PASO 5 — Dashboard Principal ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/dashboard/` · `apps/frontend_admin/src/features/dashboard/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-tailwind-components` · `react-data-visualization`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/dashboard/
├── types.ts
├── hooks/
│   ├── useDashboardSummary.ts   ← GET /app/reports/summary/ (staleTime 60s)
│   └── useRecentActivity.ts     ← tasks + notes recientes (últimas modificaciones)
├── components/
│   ├── SummaryCards.tsx         ← 4 cards: Tareas Activas, Proyectos, Notas, Eventos Hoy (skeleton animate-pulse)
│   ├── PlanUsageBanner.tsx      ← % uso de limits del plan con barras de progreso
│   ├── RecentTasksWidget.tsx    ← últimas 5 tareas con prioridad y estado
│   ├── UpcomingEventsWidget.tsx ← próximos 5 eventos del calendario
│   └── QuickActionsWidget.tsx   ← atajos: Nueva Tarea, Nueva Nota, Nuevo Proyecto
└── DashboardPage.tsx            ← grid 2 col: widgets + plan usage
```

### Tests a agregar

- `DashboardPage.test.tsx` — render cards, skeleton loading, plan banner condicional

---

## PASO 6 — Tareas (Tasks) ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/tasks/TaskBoard.jsx` · `prd/features/productivity-services.md`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/tasks/
├── types.ts                     ← Task, TaskStatus ('todo'|'in_progress'|'in_review'|'done'), TaskPriority ('alta'|'media'|'baja'), TaskComment
├── hooks/
│   ├── useTasks.ts              ← GET /app/tasks/ (queryKey ['tasks', filters], staleTime 30s)
│   ├── useCreateTask.ts         ← POST /app/tasks/
│   ├── useUpdateTask.ts         ← PATCH /app/tasks/{id}/
│   ├── useDeleteTask.ts         ← DELETE /app/tasks/{id}/
│   └── useTaskComments.ts       ← POST /app/tasks/{id}/comments/
├── components/
│   ├── TaskFilters.tsx          ← búsqueda + estado + prioridad
│   ├── TaskCard.tsx             ← prioridad badge, estado, fecha límite, contador comentarios
│   ├── TaskModal.tsx            ← crear/editar: título, descripción, prioridad, estado
│   ├── TaskListView.tsx         ← tabla con columnas ordenables, skeleton 5 filas
│   ├── TaskKanbanView.tsx       ← columnas: Todo / In Progress / In Review / Done
│   ├── PriorityBadge.tsx        ← alta (rojo) / media (amarillo) / baja (gris)
│   └── TaskStatusBadge.tsx
└── TasksPage.tsx                ← toggle lista/kanban, filtros, plan limit check
```

**Feature Gates**: Free 10 activas, Starter 50, Professional+ ilimitadas

### Tests a agregar

- `TasksPage.test.tsx` — toggle vista, crear tarea, filtros, plan limit

---

## PASO 7 — Calendario ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/calendar/Calendar.jsx`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/calendar/
├── types.ts                     ← CalendarEvent, EventAttendee, CalendarView ('month'|'week'|'day')
├── hooks/
│   ├── useCalendarEvents.ts     ← GET /app/calendar/?month=YYYY-MM (queryKey ['calendar', month])
│   ├── useCreateEvent.ts        ← POST /app/calendar/
│   ├── useUpdateEvent.ts        ← PATCH /app/calendar/{id}/
│   └── useDeleteEvent.ts        ← DELETE /app/calendar/{id}/
├── components/
│   ├── CalendarHeader.tsx       ← navegación mes/semana/día + "Hoy" + "Nuevo Evento"
│   ├── MonthView.tsx            ← grid 7×5, celdas con eventos (máx 3 + "+N más")
│   ├── WeekView.tsx             ← columnas por día con slots de horas
│   ├── DayView.tsx              ← columna única con todos los eventos
│   ├── EventCard.tsx            ← color por categoría, título, hora
│   └── EventModal.tsx           ← crear/editar: título, fecha inicio/fin, todo-día, descripción, color
└── CalendarPage.tsx             ← toggle Month/Week/Day, estado mes actual
```

**Feature Gates**: Free 20 eventos, Starter 100, Professional+ ilimitados

### Tests a agregar

- `CalendarPage.test.tsx` — render mes actual, crear evento, navegación

---

## PASO 8 — Notas ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/notes/` · `prd/features/productivity-services.md`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/notes/
├── types.ts                     ← Note, NoteCategory ('work'|'personal'|'ideas'|'archive')
├── hooks/
│   ├── useNotes.ts              ← GET /app/notes/ (queryKey ['notes', filters])
│   ├── useCreateNote.ts         ← POST /app/notes/
│   ├── useUpdateNote.ts         ← PATCH /app/notes/{id}/
│   └── useDeleteNote.ts         ← DELETE /app/notes/{id}/
├── components/
│   ├── NoteFilters.tsx          ← búsqueda + categoría + solo pinned
│   ├── NoteCard.tsx             ← color categoría, pin icon, preview 3 líneas, menú acciones
│   ├── NoteModal.tsx            ← crear/editar: título, contenido, categoría, pin toggle
│   └── CategoryBadge.tsx        ← work/personal/ideas/archive con colores distintos
└── NotesPage.tsx                ← toggle lista/grid, skeleton 6 cards, plan limit check
```

**Feature Gates**: Free 10, Starter 100, Professional 1000, Enterprise ilimitadas
**Compartir notas**: `FeatureGate feature="notes_sharing"` (Professional+)

### Tests a agregar

- `NotesPage.test.tsx` — render grid, crear nota, filtrar categoría, pin

---

## FASE 4 — Productividad II

---

## PASO 9 — Contactos ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/contacts/` · `prd/features/productivity-services.md`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/contacts/
├── types.ts                     ← Contact, ContactGroup
├── hooks/
│   ├── useContacts.ts           ← GET /app/contacts/ (queryKey ['contacts', filters])
│   ├── useContactGroups.ts      ← GET /app/contacts/groups/
│   ├── useCreateContact.ts      ← POST /app/contacts/
│   ├── useUpdateContact.ts      ← PATCH /app/contacts/{id}/
│   └── useDeleteContact.ts      ← DELETE /app/contacts/{id}/
├── components/
│   ├── ContactFilters.tsx       ← búsqueda (nombre, email, empresa) + grupo
│   ├── ContactCard.tsx          ← avatar iniciales, nombre, email, empresa, cargo, grupo badge
│   ├── ContactModal.tsx         ← CRUD: nombre, email, teléfono, empresa, cargo, grupo
│   └── GroupBadge.tsx           ← color del grupo
└── ContactsPage.tsx             ← grid 3 col, skeleton, plan limit check
```

**Feature Gates**: Free 25, Starter 100 (+ grupos), Professional+ ilimitados
**Export CSV**: `FeatureGate feature="contacts_export"` (Starter+)

### Tests a agregar

- `ContactsPage.test.tsx` — render, crear contacto, búsqueda, grupos Starter+

---

## PASO 10 — Bookmarks ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/bookmarks/`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/bookmarks/
├── types.ts                     ← Bookmark, BookmarkCollection
├── hooks/
│   ├── useBookmarks.ts          ← GET /app/bookmarks/ (queryKey ['bookmarks', filters])
│   ├── useCollections.ts        ← GET /app/bookmarks/collections/
│   ├── useCreateBookmark.ts     ← POST /app/bookmarks/
│   ├── useUpdateBookmark.ts     ← PATCH /app/bookmarks/{id}/
│   └── useDeleteBookmark.ts     ← DELETE /app/bookmarks/{id}/
├── components/
│   ├── BookmarkFilters.tsx      ← búsqueda (título, URL) + colección + tags
│   ├── BookmarkCard.tsx         ← favicon placeholder, título, URL truncada, tags pills, colección
│   ├── BookmarkModal.tsx        ← CRUD: URL, título, descripción, colección, tags
│   └── CollectionBadge.tsx
└── BookmarksPage.tsx            ← grid + lista toggle, skeleton, plan limit check
```

**Feature Gates**: Free 20, Starter 100 (+ colecciones), Professional+ ilimitados

### Tests a agregar

- `BookmarksPage.test.tsx` — render, crear bookmark, filtrar por colección

---

## PASO 11 — Snippets de Código ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/snippets/` · `prd/features/devops-services.md`
**Dependencias**: PASO 5
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/snippets/
├── types.ts                     ← CodeSnippet, SnippetLanguage (JS/TS/Python/Bash/SQL/HTML/CSS/JSON/YAML/Dockerfile/Go/Rust/Java/Other)
├── hooks/
│   ├── useSnippets.ts           ← GET /app/snippets/ (queryKey ['snippets', filters])
│   ├── useCreateSnippet.ts      ← POST /app/snippets/
│   ├── useUpdateSnippet.ts      ← PATCH /app/snippets/{id}/
│   └── useDeleteSnippet.ts      ← DELETE /app/snippets/{id}/
├── components/
│   ├── SnippetFilters.tsx       ← búsqueda + lenguaje (select 14) + tags
│   ├── SnippetCard.tsx          ← lenguaje badge (colores por lang), preview código (monospace), tags, copy button
│   ├── SnippetModal.tsx         ← CRUD: título, lenguaje, código (textarea mono), tags
│   └── LanguageBadge.tsx        ← color diferente por lenguaje
└── SnippetsPage.tsx             ← grid 2 col, skeleton, plan limit check
```

**Feature Gates**: Free 10, Starter 50, Professional 500, Enterprise ilimitados

### Tests a agregar

- `SnippetsPage.test.tsx` — render, crear snippet, copy to clipboard, filtrar lenguaje

---

## FASE 5 — DevOps Services

---

## PASO 12 — Proyectos (Credential Vault) ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/projects/` · `prd/features/projects.md`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components` · `react-hooks-patterns`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/projects/
├── types.ts                         ← Project, ProjectSection, ProjectItem, ProjectItemField, ProjectMember, FieldType ('credential'|'document'|'link'|'note'|'config'), ItemViewMode
├── hooks/
│   ├── useProjects.ts               ← GET /app/projects/ (queryKey ['projects'])
│   ├── useProjectDetail.ts          ← GET /app/projects/{id}/ (queryKey ['project', id])
│   ├── useCreateProject.ts          ← POST /app/projects/
│   ├── useUpdateProject.ts          ← PATCH /app/projects/{id}/
│   ├── useDeleteProject.ts          ← DELETE /app/projects/{id}/
│   ├── useProjectSections.ts        ← CRUD secciones (POST/PATCH/DELETE)
│   ├── useProjectItems.ts           ← CRUD items
│   ├── useProjectFields.ts          ← CRUD campos
│   ├── useRevealField.ts            ← POST /reveal/{fk}/ → valor desencriptado
│   └── useProjectMembers.ts         ← GET/POST/DELETE miembros
├── components/
│   ├── ProjectList.tsx              ← lista proyectos con color/icono, plan badge (2/10/∞)
│   ├── ProjectCard.tsx              ← color accent, nombre, descripción, contador items
│   ├── ProjectModal.tsx             ← crear/editar: nombre, descripción, color, icono
│   ├── ProjectDetail.tsx            ← vista completa: secciones + items
│   ├── SectionAccordion.tsx         ← sección colapsable, agregar item
│   ├── ItemRow.tsx                  ← nombre, tipo, campos resumen, acciones
│   ├── ItemModal.tsx                ← campos dinámicos según tipo de item
│   ├── FieldCard.tsx                ← label, valor masked, copy, reveal 30s
│   ├── FieldRevealButton.tsx        ← POST reveal → muestra valor, oculta tras 30s (setTimeout)
│   ├── BatchActionsBar.tsx          ← selección múltiple → mover/eliminar (Professional+)
│   ├── ShareProjectModal.tsx        ← invitar miembro con nivel Viewer/Editor/Admin
│   └── ViewModeToggle.tsx           ← Lista / Tabla / Compacta
└── ProjectsPage.tsx                 ← lista + panel detalle lateral, plan limit check
```

**Feature Gates**: Free 2 proyectos/50 items/3 secciones, Starter 10/200/10, Professional+ ilimitado

### Tests a agregar

- `ProjectsPage.test.tsx` — render lista, crear proyecto, abrir detalle
- `FieldRevealButton.test.tsx` — POST reveal, mostrar 30s, ocultar
- `BatchActionsBar.test.tsx` — selección múltiple, Professional gate

---

## PASO 13 — Variables de Entorno ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/env-vars/EnvVarsView.jsx` · `prd/features/devops-services.md`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/env-vars/
├── types.ts                     ← EnvVariable, EnvEnvironment ('dev'|'staging'|'production'|'all')
├── hooks/
│   ├── useEnvVars.ts            ← GET /app/env-vars/ (queryKey ['env-vars', filters])
│   ├── useCreateEnvVar.ts       ← POST /app/env-vars/
│   ├── useUpdateEnvVar.ts       ← PATCH /app/env-vars/{id}/
│   └── useDeleteEnvVar.ts       ← DELETE /app/env-vars/{id}/
├── components/
│   ├── EnvVarFilters.tsx        ← búsqueda + ambiente
│   ├── EnvVarRow.tsx            ← nombre, ambiente badge, valor masked + reveal 30s, copiar, acciones
│   ├── EnvVarModal.tsx          ← crear/editar: nombre (KEY_FORMAT), valor, ambiente, descripción
│   └── EnvironmentBadge.tsx     ← dev (azul) / staging (amarillo) / production (rojo) / all (verde)
└── EnvVarsPage.tsx              ← tabla con FeatureGate (Starter+), skeleton 5 filas
```

**Feature Gates**: Free ❌, Starter 25 variables, Professional+ ilimitadas (+ export .env)

### Tests a agregar

- `EnvVarsPage.test.tsx` — render tabla, crear variable, reveal/hide, FeatureGate Free

---

## PASO 14 — Claves SSH ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/ssh-keys/SSHKeysView.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/ssh-keys/
├── types.ts                     ← SSHKey, SSHKeyAlgorithm ('RSA'|'Ed25519'|'ECDSA'|'DSA')
├── hooks/
│   ├── useSSHKeys.ts            ← GET /app/ssh-keys/ (queryKey ['ssh-keys'])
│   ├── useCreateSSHKey.ts       ← POST /app/ssh-keys/
│   ├── useUpdateSSHKey.ts       ← PATCH /app/ssh-keys/{id}/
│   └── useDeleteSSHKey.ts       ← DELETE /app/ssh-keys/{id}/
├── components/
│   ├── SSHKeyCard.tsx           ← nombre, algoritmo badge, fingerprint (mono), clave pública colapsable, acciones
│   ├── SSHKeyModal.tsx          ← crear/editar: nombre, algoritmo, clave pública, clave privada (masked)
│   └── AlgorithmBadge.tsx
└── SSHKeysPage.tsx              ← grid 2 col, skeleton 4 cards, plan limit check
```

**Feature Gates**: Free 2, Starter 10, Professional+ ilimitadas

### Tests a agregar

- `SSHKeysPage.test.tsx` — render cards, crear clave, fingerprint visible

---

## PASO 15 — Certificados SSL ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/ssl-certs/SSLCertsView.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/ssl-certs/
├── types.ts                     ← SSLCertificate, CertStatus ('valid'|'expiring'|'expired')
├── hooks/
│   ├── useSSLCerts.ts           ← GET /app/ssl-certs/ (queryKey ['ssl-certs'])
│   ├── useCreateSSLCert.ts      ← POST /app/ssl-certs/
│   ├── useUpdateSSLCert.ts      ← PATCH /app/ssl-certs/{id}/
│   └── useDeleteSSLCert.ts      ← DELETE /app/ssl-certs/{id}/
├── components/
│   ├── SSLCertCard.tsx          ← dominio, estado badge, días restantes, emisor, fechas, acciones
│   ├── SSLCertModal.tsx         ← crear/editar: dominio, emisor, fecha emisión/vencimiento, notas
│   └── CertStatusBadge.tsx      ← valid (verde) / expiring <30d (amarillo) / expired (rojo)
└── SSLCertsPage.tsx             ← grid, alertas expiring/expired al top, skeleton
```

**Feature Gates**: Free 1, Starter 5, Professional+ ilimitados

### Tests a agregar

- `SSLCertsPage.test.tsx` — render cards, status badges, alertas expiring/expired

---

## FASE 6 — Gestión & Compartición

---

## PASO 16 — Formularios ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/forms/FormsView.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/forms/
├── types.ts                     ← Form, FormQuestion, FormResponse, FormStatus ('draft'|'active'|'closed')
├── hooks/
│   ├── useForms.ts              ← GET /app/forms/ (queryKey ['forms', filters])
│   ├── useFormDetail.ts         ← GET /app/forms/{id}/
│   ├── useCreateForm.ts         ← POST /app/forms/
│   ├── useUpdateForm.ts         ← PATCH /app/forms/{id}/
│   ├── useDeleteForm.ts         ← DELETE /app/forms/{id}/
│   └── useFormResponses.ts      ← GET /app/forms/{id}/responses/
├── components/
│   ├── FormCard.tsx             ← título, estado badge, respuestas contador, URL pública, acciones
│   ├── FormStatusBadge.tsx      ← draft (gris) / active (verde) / closed (rojo)
│   ├── FormModal.tsx            ← crear/editar: título, descripción, estado, preguntas
│   └── FormResponsesPanel.tsx   ← panel lateral con respuestas recibidas
└── FormsPage.tsx                ← grid con FeatureGate (feature: forms)
```

### Tests a agregar

- `FormsPage.test.tsx` — FeatureGate render/bloqueo, crear formulario, ver respuestas

---

## PASO 17 — Compartido Conmigo & Log de Auditoría ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/sharing/` · `docs/ui-ux/prototype-workspace/src/components/audit-log/` · `apps/frontend_admin/src/features/audit/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/sharing/
├── types.ts                     ← SharedItem, ShareAccessLevel ('viewer'|'editor'|'admin')
├── hooks/
│   └── useSharedWithMe.ts       ← GET /app/sharing/shared-with-me/ (queryKey ['shared-with-me'])
├── components/
│   ├── SharedItemCard.tsx       ← tipo recurso, dueño, nivel acceso badge, "Abrir →"
│   └── AccessLevelBadge.tsx     ← viewer (gris) / editor (azul) / admin (morado)
└── SharedWithMePage.tsx         ← grid, empty state

src/features/audit/
├── types.ts                     ← AuditLogEntry, AuditFilters
├── hooks/
│   └── useAuditLogs.ts          ← useInfiniteQuery GET /admin/audit-logs/ (initialPageParam: 1)
├── components/
│   ├── AuditFilters.tsx         ← acción + usuario + rango fechas + búsqueda
│   ├── AuditLogRow.tsx          ← usuario, acción badge, recurso, timestamp, expandible
│   └── AuditLogTable.tsx        ← sticky thead, sentinel scroll infinito, skeleton 8 filas
└── AuditPage.tsx                ← FeatureGate (permission: audit.view_auditlog)
```

### Tests a agregar

- `SharedWithMePage.test.tsx` — render items, empty state
- `AuditPage.test.tsx` — infinite scroll, filtros, permission gate

---

## PASO 18 — Reportes & Analytics ⬜

**Archivos de referencia**: `apps/frontend_admin/src/features/reports/` · `docs/ui-ux/prototype-workspace/src/components/reports/`
**Dependencias**: PASO 5
**Skills**: `react-data-visualization` · `react-tanstack-query`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/reports/
├── types.ts                     ← SummaryData, UsageData, TrendsData, TrendPoint
├── hooks/
│   ├── useSummary.ts            ← GET /app/reports/summary/ (staleTime 5min)
│   ├── useUsageReport.ts        ← GET /app/reports/usage/
│   └── useTrends.ts             ← GET /app/reports/trends/?period=7d|30d|90d
├── components/
│   ├── KpiCards.tsx             ← 4 cards con skeleton animate-pulse
│   ├── UsageTrendsChart.tsx     ← Recharts LineChart — gated analytics_trends
│   ├── ResourceDistributionChart.tsx ← Recharts BarChart
│   └── ExportReportButton.tsx   ← descarga — gated analytics_export
└── ReportsPage.tsx              ← FeatureGate (feature: analytics — Professional+)
```

### Tests a agregar

- `ReportsPage.test.tsx` — FeatureGate render/bloqueo, KpiCards skeleton, charts render

---

## FASE 7 — Soporte & Perfil

---

## PASO 19 — Notificaciones ⬜

**Archivos de referencia**: `apps/frontend_hub_client/src/features/notifications/` · `apps/frontend_admin/src/features/notifications/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/notifications/
├── types.ts                     ← AppNotification, NotificationCategory ('tasks'|'projects'|'system'|'security'|'billing')
├── hooks/
│   ├── useNotifications.ts      ← GET /app/notifications/ (refetchInterval: 60_000, queryKey ['ws-notifications'])
│   ├── useMarkAsRead.ts         ← POST /app/notifications/{id}/read/
│   └── useMarkAllAsRead.ts      ← POST /app/notifications/read-all/
├── components/
│   ├── NotificationItem.tsx     ← icono por categoría, título, mensaje, tiempo relativo, unread dot
│   ├── NotificationList.tsx     ← filtros pill (todas/no leídas/categorías), skeleton 3 items
│   └── BulkActions.tsx          ← "Marcar todas como leídas" con spinner isPending
└── NotificationsPage.tsx        ← dismissedIds Set local, visibleNotifications useMemo
```

**Navbar**: campana con badge unread, dropdown top-5, "Ver todas →" `/notifications`

### Tests a agregar

- `NotificationsPage.test.tsx` — render, marcar leída, filtros, badge navbar

---

## PASO 20 — Soporte (Tickets) ⬜

**Archivos de referencia**: `apps/frontend_hub_client/src/features/support/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query` · `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/support/
├── types.ts                     ← SupportTicket, TicketStatus, TicketPriority, TicketComment
├── hooks/
│   ├── useTickets.ts            ← GET /support/tickets/ (queryKey ['support-tickets'])
│   ├── useTicketDetail.ts       ← GET /support/tickets/{id}/ (enabled: !!ticketId)
│   ├── useCreateTicket.ts       ← POST /support/tickets/
│   └── useAddComment.ts         ← POST /support/tickets/{id}/comments/
├── components/
│   ├── TicketFilters.tsx        ← búsqueda + estado + prioridad
│   ├── TicketCard.tsx           ← título, estado badge, prioridad badge, fecha
│   ├── TicketStatusBadge.tsx    ← open/in_progress/waiting_client/resolved/closed
│   ├── PriorityBadge.tsx
│   ├── CommentThread.tsx        ← lista comentarios con tiempo relativo
│   ├── CommentInput.tsx
│   └── NewTicketModal.tsx       ← asunto, descripción, prioridad, categoría
└── SupportPage.tsx              ← lista + panel detalle lateral
```

### Tests a agregar

- `SupportPage.test.tsx` — render lista, crear ticket, añadir comentario

---

## PASO 21 — Configuración & Perfil ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-workspace/src/components/SettingsView.jsx` · `apps/frontend_hub_client/src/features/settings/`
**Dependencias**: PASO 3
**Skills**: `react-forms-validation` · `react-tailwind-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/settings/
├── types.ts                     ← ProfileUpdateRequest, PasswordChangeRequest, MFASetupResponse, NotificationPreferences
├── hooks/
│   ├── useUpdateProfile.ts      ← PATCH /auth/profile/ → authStore.setUser
│   ├── useChangePassword.ts     ← POST /auth/change-password/
│   ├── useMFASetup.ts           ← POST /auth/mfa/enable/ → { qr_uri, secret }
│   └── useMFADisable.ts         ← POST /auth/mfa/disable/
├── components/
│   ├── ProfileTab.tsx           ← nombre, email (readonly), zona horaria
│   ├── SecurityTab.tsx          ← cambiar contraseña + MFA QR
│   ├── InterfaceTab.tsx         ← dark mode, idioma ES/EN, formato fecha
│   └── NotificationsTab.tsx     ← preferencias por categoría
└── SettingsPage.tsx             ← nav vertical tabs (Profile / Security / Interface / Notifications)

src/features/profile/
└── ProfilePage.tsx              ← vista del perfil del usuario actual
```

### Tests a agregar

- `SettingsPage.test.tsx` — tabs, actualizar perfil, cambiar contraseña, toggle MFA

---

## FASE 8 — Calidad & Deploy

---

## PASO 22 — Testing Infrastructure ⬜

**Archivos de referencia**: `apps/frontend_admin/src/test/` · `apps/frontend_hub_client/src/test/`
**Dependencias**: todos los PASOes anteriores
**Skills**: `react-testing-library`
**Agente**: `test-generator`

### Qué implementar

```
src/test/
├── setup.ts                     ← jest-dom matchers, ResizeObserver mock (class), IntersectionObserver mock, axe config
├── server.ts                    ← MSW setupServer({ onUnhandledRequest: 'bypass' })
└── handlers/
    ├── index.ts                 ← importa todos los handlers
    ├── auth.ts                  ← POST /auth/login, /auth/refresh-token, /auth/logout, /auth/sso/validate
    ├── tasks.ts                 ← CRUD /app/tasks/
    ├── calendar.ts              ← CRUD /app/calendar/
    ├── notes.ts                 ← CRUD /app/notes/
    ├── contacts.ts              ← CRUD /app/contacts/
    ├── bookmarks.ts             ← CRUD /app/bookmarks/
    ├── projects.ts              ← CRUD /app/projects/ + nested
    ├── devops.ts                ← CRUD env-vars, ssh-keys, ssl-certs, snippets
    ├── forms.ts                 ← CRUD /app/forms/
    ├── sharing.ts               ← GET /app/sharing/shared-with-me/
    ├── notifications.ts         ← GET/POST /app/notifications/
    ├── support.ts               ← CRUD /support/tickets/
    ├── reports.ts               ← GET /app/reports/
    ├── audit.ts                 ← GET /admin/audit-logs/
    └── features.ts              ← GET /features/
```

**Notas críticas** (aprendidas de admin/hub):
- MSW handler URLs deben ser URLs completas: `http://localhost:8000/api/v1/...`
- `axios.defaults.adapter = 'http'` en setup.ts (intercepta axios en jsdom)
- `onUnhandledRequest: 'bypass'` OBLIGATORIO
- Zustand mocks: `(selector) => typeof selector === 'function' ? selector(mockState) : mockState`
- `testTimeout: 15000` en vite.config.ts para coverage runs
- Cobertura objetivo: lines 65%, branches 55%, functions 50%

### Tests a agregar

- `src/lib/__tests__/handlers.test.ts` — verificar MSW handlers responden correctamente

---

## PASO 23 — Accesibilidad (A11y) ⬜

**Archivos de referencia**: `apps/frontend_admin/src/test/a11y/` · `apps/frontend_admin/src/hooks/useFocusTrap.ts`
**Dependencias**: PASO 22
**Skills**: `react-accessibility`
**Agente**: `test-generator`

### Qué implementar

```
src/
├── hooks/
│   └── useFocusTrap.ts          ← focus trap para modales (restaura focus al cerrar)
└── test/a11y/
    ├── dashboard.a11y.test.tsx
    ├── tasks.a11y.test.tsx
    ├── calendar.a11y.test.tsx
    ├── projects.a11y.test.tsx
    ├── settings.a11y.test.tsx
    └── auth.a11y.test.tsx
```

**Correcciones a aplicar en componentes**:
- `role="dialog" aria-modal="true" aria-labelledby="X-modal-title"` en todos los modales + `useFocusTrap`
- Heading order: `<h2>` en cards (no `<h3>` directo bajo `<h1>`)
- Icon-only buttons: `aria-label` descriptivo
- Selects/inputs: `aria-label` o `<label>` asociado
- Tablas: `<th>` con texto descriptivo (no vacíos)
- `role="progressbar" aria-valuenow aria-valuemin aria-valuemax` en barras de uso

### Tests a agregar

- 6 archivos a11y con `axe(container, axeConfig)` sin regla `color-contrast`

---

## PASO 24 — Performance & Deploy ⬜

**Archivos de referencia**: `apps/frontend_admin/vite.config.ts` · `apps/frontend_hub_client/docker-compose.yml`
**Dependencias**: PASO 23
**Skills**: `react-performance-optimization` · `vite-react-configuration`
**Agente**: `react-vite-builder`

### Qué implementar

**1. Bundle splitting** en `vite.config.ts`:
```ts
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-charts': ['recharts'],
  'vendor-i18n': ['i18next', 'react-i18next'],
  'vendor-virtual': ['@tanstack/react-virtual'],
}
```

**2. Lazy loading** de páginas pesadas: `ProjectsPage`, `ReportsPage`, `AuditPage`, `CalendarPage`

**3. Virtual scroll** (`@tanstack/react-virtual`) en: `AuditLogTable`, `TaskListView`, `ProjectDetail` (items largos)

**4. Bundle analyzer**: `rollup-plugin-visualizer` con `ANALYZE=true`

**5. Dockerfile multi-stage**: build (node:20-alpine) → prod (nginx:alpine, `/usr/share/nginx/html`)

**6. Lighthouse targets**: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90, LCP < 2.5s

### Verificación

- `npm run build` sin chunks > 500KB
- `npm run preview` sin errores de consola
- `npm run coverage` thresholds: lines 65%, branches 55%, functions 50%

---

## Resumen de PASOes

| PASO | Feature | Fase | Estado |
|------|---------|------|--------|
| 1 | Scaffold del Proyecto | Setup Base | ⬜ |
| 2 | Infraestructura Core (Axios, Zustand, i18n, hooks) | Setup Base | ⬜ |
| 3 | Autenticación + SSO Validate | Auth & Shell | ⬜ |
| 4 | AppLayout: Navbar + Sidebar 5 secciones | Auth & Shell | ⬜ |
| 5 | Dashboard Principal | Dashboard & Prod I | ⬜ |
| 6 | Tareas (Lista + Kanban) | Dashboard & Prod I | ⬜ |
| 7 | Calendario (Month/Week/Day) | Dashboard & Prod I | ⬜ |
| 8 | Notas (categorías, pin, grid/lista) | Dashboard & Prod I | ⬜ |
| 9 | Contactos (grupos, avatar iniciales) | Productividad II | ⬜ |
| 10 | Bookmarks (colecciones, tags) | Productividad II | ⬜ |
| 11 | Snippets de Código (14 lenguajes) | Productividad II | ⬜ |
| 12 | Proyectos / Credential Vault (complejo) | DevOps Services | ⬜ |
| 13 | Variables de Entorno (AES-256, ambientes) | DevOps Services | ⬜ |
| 14 | Claves SSH (algoritmos, fingerprint) | DevOps Services | ⬜ |
| 15 | Certificados SSL (tracking vencimiento) | DevOps Services | ⬜ |
| 16 | Formularios (builder, respuestas) | Gestión | ⬜ |
| 17 | Compartido Conmigo + Log de Auditoría | Gestión | ⬜ |
| 18 | Reportes & Analytics (Recharts) | Gestión | ⬜ |
| 19 | Notificaciones (bell + página) | Soporte & Perfil | ⬜ |
| 20 | Soporte (Tickets con comentarios) | Soporte & Perfil | ⬜ |
| 21 | Configuración & Perfil (5 tabs) | Soporte & Perfil | ⬜ |
| 22 | Testing Infrastructure (MSW + Vitest) | Calidad & Deploy | ⬜ |
| 23 | Accesibilidad WCAG 2.1 AA | Calidad & Deploy | ⬜ |
| 24 | Performance & Deploy (Docker + Lighthouse) | Calidad & Deploy | ⬜ |
