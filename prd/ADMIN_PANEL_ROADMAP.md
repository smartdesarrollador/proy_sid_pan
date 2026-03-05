# Admin Panel Frontend — Roadmap de Implementación

**Stack**: React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query v5 · Zustand · React Router v6 · i18next
**Directorio base**: `apps/frontend_admin/`
**Prototype de referencia**: `docs/ui-ux/prototype-admin/` (30+ componentes, mock data, sin TypeScript)
**API backend**: `apps/backend_django/` (PASO 1–20 ✅ completados)

---

## Progreso General

| Estado | Significado |
|--------|-------------|
| ✅ Completado | Implementado y funcional |
| 🔄 En progreso | Trabajo activo |
| ⬜ Pendiente | No iniciado |

---

## Integración API

> Todos los endpoints son consumidos desde **`apps/frontend_admin/`** hacia el backend
> en **`apps/backend_django/`** (Django REST Framework, PASOes 1-20 ✅ completados).
>
> - **Base URL local**: `http://localhost:8000/api/v1/` (proxy Vite → `vite.config.ts`)
> - **Documentación de la API**: `http://localhost:8000/api/docs/` (Swagger UI)
> - **Auth**: JWT Bearer (`Authorization: Bearer <accessToken>`)
> - **Refresh automático**: interceptor Axios → `POST /api/v1/auth/token/refresh/`
> - **Google OAuth**: flujo server-side en backend Django → callback devuelve JWT igual que login normal

---

## Agents y Skills de Desarrollo

Usar los siguientes agentes y skills del proyecto en los casos pertinentes:

### Skills disponibles (`.claude/skills/`)
| Skill | Cuándo usarlo |
|-------|--------------|
| `react-tailwind-components` | Crear componentes UI (formularios, tablas, modales) |
| `react-api-fetch-patterns` | Implementar hooks de fetching con Axios/TanStack Query |
| `react-api-authentication` | Login, registro, refresh token, protected routes, AuthContext |
| `react-forms-validation` | react-hook-form + Zod/Yup en cualquier formulario |
| `react-tanstack-query` | Cualquier query o mutation (useDashboardStats, useLogin, etc.) |
| `react-hooks-patterns` | Custom hooks (usePermissions, useAuth, useFeatureGate) |
| `react-context-state` | AuthContext, ThemeContext, stores Zustand |
| `react-testing-library` | Tests de componentes con Vitest + Testing Library |
| `ui-base-components` | Botones, inputs, cards, badges del design system del proyecto |
| `ui-design-tokens` | Colores, tipografía, espaciado del sistema de diseño |
| `ui-layout-system` | Navbar, sidebar, main content layout del proyecto |
| `vite-react-configuration` | Configurar vite.config.ts, proxy, aliases, env vars |
| `react-router-patterns` | Rutas protegidas, layouts, lazy loading, redirect |
| `drf-auth` | Referencia a los endpoints de auth del backend |

### Agentes disponibles (`.claude/agents/`)
| Agente | Cuándo activarlo |
|--------|-----------------|
| `react-vite-builder` | Scaffolding de features completas (PASO 1-4) |
| `ui-ux-designer` | Migración de prototipos, diseño de componentes visuales |
| `test-generator` | Generar tests Vitest/Testing Library para cada PASO |
| `code-reviewer` | Revisión de calidad antes de cerrar cada PASO |
| `security-auditor` | Revisar el flujo de auth, Google OAuth, manejo de tokens |

---

## FASE 1 — Setup Base

---

## PASO 1 — Scaffold del Proyecto ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/` · `docs/ui-ux/prototype-admin/src/index.css`

### Qué implementar

```
apps/frontend_admin/
├── package.json                ← React 18, TypeScript, Vite, Tailwind, ESLint, Prettier
├── vite.config.ts              ← path alias @/ → src/, proxy /api → backend
├── tsconfig.json               ← strict mode, paths, target ES2022
├── tsconfig.node.json
├── tailwind.config.ts          ← content paths, custom tokens del prototipo
├── postcss.config.js
├── .eslintrc.cjs               ← eslint-plugin-react, @typescript-eslint, prettier
├── .prettierrc
├── .env.example                ← VITE_API_URL, VITE_APP_NAME
├── Makefile                    ← make dev, make build, make preview, make lint, make test
├── index.html
└── src/
    ├── main.tsx                ← Providers: QueryClient, Router, i18n, Zustand
    ├── App.tsx
    ├── vite-env.d.ts
    └── index.css               ← Tokens de diseño del prototipo (colores, badges, clases)
```

**Dependencias clave**:
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.4.0",
  "vite": "^5.2.0",
  "@vitejs/plugin-react": "^4.2.0",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0"
}
```

**Tokens de diseño a migrar** desde `prototype-admin/src/index.css`:
- Colores primarios: `primary-50` → `primary-900`
- Clases componente: `.badge`, `.badge-active`, `.badge-inactive`, `.card-hover`
- Variables CSS: `--sidebar-width: 256px`, `--navbar-height: 64px`

### Comandos a ejecutar
```bash
cd apps/frontend_admin
npm install
npm run dev   # http://localhost:5174
```

### Tests a agregar
- Verificar que `vite build` no genera errores de TypeScript
- Verificar que alias `@/` resuelve correctamente

---

## PASO 2 — Infraestructura Core ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/i18n/` · `docs/ui-ux/prototype-admin/src/locales/`

### Qué implementar

**`src/lib/api.ts`** — Cliente Axios con interceptores JWT:
- `baseURL` desde `import.meta.env.VITE_API_URL`
- Interceptor `request`: inyecta `Authorization: Bearer {accessToken}`
- Interceptor `response`: captura 401, llama `POST /api/v1/auth/token/refresh/`, reintenta
- `tokenStorage`: access token en memoria (variable), refresh token en `localStorage`
- Exporta instancias `apiClient` y `publicClient` (sin auth)

**`src/lib/queryClient.ts`** — TanStack Query v5:
- `staleTime: 5 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`
- `onError` global: toast de error en 401/403/5xx

**`src/store/`** — Zustand stores:
- `src/store/uiStore.ts`: `sidebarOpen`, `darkMode`, `activeModal`, `notifications`
- `src/store/authStore.ts`: `user`, `accessToken`, `setUser`, `clearAuth`

**`src/i18n/`** — i18next con 10 namespaces del prototipo:
- `src/i18n/config.ts`: setup con `i18next-http-backend`, fallback `es`
- Idiomas: `es`, `en`
- Namespaces: `common`, `dashboard`, `users`, `roles`, `features`, `sidebar`, `navbar`, `settings`, `clients`, `validation`

**`src/router/index.tsx`** — React Router v6:
- `createBrowserRouter` con rutas protegidas
- Layout raíz con `Outlet`
- Rutas lazy para cada módulo

**`src/types/`** — Tipos base TypeScript:
- `src/types/api.ts`: `PaginatedResponse<T>`, `ApiError`, `ApiResponse<T>`
- `src/types/auth.ts`: `User`, `AuthState`, `LoginRequest`, `LoginResponse`
- `src/types/rbac.ts`: `Role`, `Permission`, `UserRole`

### Comandos a ejecutar
```bash
npm install axios @tanstack/react-query zustand react-router-dom i18next react-i18next i18next-http-backend
npm install -D @types/react @types/react-dom
```

### Tests a agregar
`src/lib/__tests__/api.test.ts`: refresh interceptor reintenta en 401, clearAuth en 401 sin refresh

---

## FASE 2 — Auth & Shell

---

## PASO 3 — Autenticación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Login.jsx` · `docs/ui-ux/prototype-admin/src/contexts/`
**Dependencias**: PASO 2
**Skills**: `react-api-authentication`, `react-forms-validation`, `ui-base-components`
**Agente**: `react-vite-builder` para scaffolding + `security-auditor` para revisar flujo OAuth

### Qué implementar

**`src/features/auth/`**:

```
src/features/auth/
├── LoginPage.tsx               ← Email + password + botón Google OAuth
├── RegisterPage.tsx            ← Nombre, email, org, password, confirm, términos + Google OAuth
├── ForgotPasswordPage.tsx      ← Email input → "te enviamos un correo"
├── ResetPasswordPage.tsx       ← Nueva contraseña + confirmar (token en URL)
├── AuthContext.tsx             ← user, login(), logout(), register(), isLoading
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts             ← Mutation POST /auth/login/
│   ├── useRegister.ts          ← Mutation POST /auth/register/
│   ├── useForgotPassword.ts    ← Mutation POST /auth/password/reset/
│   └── useResetPassword.ts     ← Mutation POST /auth/password/reset/confirm/
└── components/
    ├── ProtectedRoute.tsx
    ├── AuthLayout.tsx          ← Layout compartido: logo, fondo, card centrada
    └── GoogleOAuthButton.tsx   ← Botón "Continuar con Google" (reutilizable)
```

**`src/features/auth/LoginPage.tsx`**:
- Email + password inputs con validación react-hook-form
- Mostrar error "Credenciales incorrectas" en 401
- Spinner en loading, deshabilitar botón
- Link "Olvidé mi contraseña" (ruta `/forgot-password`)
- `GoogleOAuthButton` con separador visual "— o —"
- Link "¿No tienes cuenta? Regístrate" → `/register`
- Migrar diseño exacto desde `Login.jsx` del prototipo

**`src/features/auth/RegisterPage.tsx`**:
- Campos: nombre completo, email, nombre de organización, contraseña, confirmar contraseña, checkbox aceptar términos
- Validación con react-hook-form + Zod
- Botón "Registrarse con Google" (`GoogleOAuthButton`)
- Link "¿Ya tienes cuenta? Inicia sesión"
- Endpoint: `POST /api/v1/auth/register/`

**`src/features/auth/ForgotPasswordPage.tsx`**:
- Campo email, botón "Enviar instrucciones"
- Estado de éxito: "Revisa tu correo" (sin revelar si el email existe)
- Link "Volver al inicio de sesión"
- Endpoint: `POST /api/v1/auth/password/reset/`

**`src/features/auth/ResetPasswordPage.tsx`**:
- Lee `?token=...` de los query params de la URL
- Campos: nueva contraseña + confirmar contraseña
- Validación mínimo 8 caracteres, coinciden
- En éxito: redirige a `/login` con toast "Contraseña actualizada"
- Endpoint: `POST /api/v1/auth/password/reset/confirm/`

**`src/features/auth/AuthContext.tsx`**:
- Interfaz TypeScript: `AuthContextType { user, isAuthenticated, isLoading, login, logout, register }`
- Al montar: intento de refresh silencioso (`POST /auth/token/refresh/`)
- `login()`: guarda access token en memoria, refresh en localStorage
- `logout()`: `POST /auth/logout/`, limpia stores
- `register()`: llama `POST /auth/register/` y hace login automático

**`src/features/auth/components/ProtectedRoute.tsx`**:
- `<Outlet>` si autenticado
- `<Navigate to="/login" replace>` si no autenticado
- Spinner mientras `isLoading=true`

**`src/features/auth/components/AuthLayout.tsx`**:
- Layout compartido para todas las páginas de auth
- Logo centrado, fondo con gradiente, card centrada con sombra
- Reutilizado por LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage

**`src/features/auth/components/GoogleOAuthButton.tsx`**:
- Botón estándar con logo de Google (SVG inline)
- Al hacer click: redirige a `GET /api/v1/auth/google/` (inicia flujo OAuth en backend)
- El backend redirige de vuelta → el backend valida y devuelve JWT igual que `/auth/login/`
- El frontend captura el token en `/auth/google/callback` y llama `login()` del AuthContext

**Rutas nuevas en `src/router/index.tsx`**:
```
/login                  → LoginPage (pública)
/register               → RegisterPage (pública)
/forgot-password        → ForgotPasswordPage (pública)
/reset-password         → ResetPasswordPage (pública, requiere ?token=...)
/auth/google/callback   → GoogleCallbackPage (procesa callback OAuth)
```

**API endpoints** (todos en `apps/backend_django/`):
```
POST /api/v1/auth/register/                → Crear cuenta nueva
POST /api/v1/auth/login/                   → JWT login
POST /api/v1/auth/logout/                  → Revocar refresh token
POST /api/v1/auth/token/refresh/           → Renovar access token
POST /api/v1/auth/password/reset/          → Solicitar reset (envía email)
POST /api/v1/auth/password/reset/confirm/  → Confirmar reset con token
GET  /api/v1/auth/google/                  → Inicia flujo Google OAuth
GET  /api/v1/auth/google/callback/         → Callback Google (devuelve JWT)
```

### Tests a agregar
- `LoginPage.test.tsx`: render, submit exitoso, error 401, loading, botón Google visible
- `RegisterPage.test.tsx`: render, validación campos, submit exitoso, error 400 email duplicado
- `ForgotPasswordPage.test.tsx`: render, submit exitoso muestra mensaje, error handling
- `ResetPasswordPage.test.tsx`: render con token, validación contraseñas coinciden, submit exitoso

---

## PASO 4 — Shell & Navegación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Navbar.jsx` · `docs/ui-ux/prototype-admin/src/components/Sidebar.jsx`
**Dependencias**: PASO 3

### Qué implementar

**`src/layouts/AppLayout.tsx`**:
- Navbar fija `h-16 z-30` + Sidebar fija `w-64 z-20` + contenido `ml-64 pt-16`
- Toggle sidebar en móvil (overlay)
- Integra `ThemeContext` (dark mode con `localStorage`)

**`src/layouts/components/Navbar.tsx`** (migrar desde `Navbar.jsx`):
- Logo + toggle sidebar
- Bell de notificaciones con badge contador
- Selector de idioma (ES/EN) → `LanguageSwitcher`
- Dropdown de usuario: nombre, email, rol badge, "Cerrar sesión"
- Dark mode toggle (migrar `ThemeToggle.jsx`)

**`src/layouts/components/Sidebar.tsx`** (migrar desde `Sidebar.jsx`):
- Menú filtrado por permisos del usuario (hook `usePermissions`)
- Items activos resaltados con React Router `NavLink`
- Grupos: General, Gestión, Administración, Sistema
- Items: Dashboard, Usuarios, Roles, Permisos, Suscripción, Facturación, Clientes, Promociones, Soporte, Notificaciones, Reportes, Auditoría, Configuración
- Badge de rol del usuario en la parte inferior

**`src/hooks/usePermissions.ts`** (migrar desde `hooks/usePermissions.js`, agregar tipos):
```typescript
interface UsePermissionsReturn {
  hasPermission: (codename: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
}
```

**`src/components/shared/FeatureGate.tsx`** (migrar desde `shared/FeatureGate.jsx`):
```typescript
interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

**CSS** — migrar todas las clases de `prototype-admin/src/index.css` a `apps/frontend_admin/src/index.css`

### Tests a agregar
`src/layouts/__tests__/AppLayout.test.tsx`: sidebar visible en desktop, oculto en móvil, toggle funciona, links activos

---

## FASE 3 — RBAC Core

---

## PASO 5 — Dashboard ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Dashboard.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/dashboard/`**:
```
src/features/dashboard/
├── DashboardPage.tsx           ← Layout: stats + tabla usuarios + eventos auditoría
├── components/
│   ├── StatsCards.tsx          ← 4 tarjetas: Usuarios, Roles, Almacenamiento, API calls
│   ├── RecentUsersTable.tsx    ← Últimos 5 usuarios con nombre, rol, estado
│   └── RecentAuditEvents.tsx   ← Últimos 5 eventos de auditoría
└── hooks/
    ├── useDashboardStats.ts    ← TanStack Query para GET /admin/users/ (summary)
    └── useRecentAudit.ts       ← TanStack Query para GET /audit-log/ ?limit=5
```

**`src/features/dashboard/components/StatsCards.tsx`**:
- Tarjeta "Usuarios activos": ícono + número + variación respecto al mes anterior
- Tarjeta "Roles configurados": número de roles del tenant
- Tarjeta "Almacenamiento": barra de progreso con % usado del límite del plan
- Tarjeta "API calls": requests de las últimas 24h con comparativa
- Adaptar diseño exacto desde `Dashboard.jsx`

**`src/features/dashboard/components/RecentUsersTable.tsx`**:
- Columnas: Avatar + Nombre, Email, Rol (badge), Estado (badge activo/inactivo)
- Link "Ver todos" → `/users`
- Skeleton loader mientras carga

**TanStack Query hooks**:
- `useDashboardStats`: `GET /api/v1/admin/users/?summary=true`, staleTime 1 min
- `useRecentAudit`: `GET /api/v1/audit-log/?limit=5`, staleTime 1 min

**API endpoints**:
- `GET /api/v1/admin/users/`
- `GET /api/v1/audit-log/`

### Tests a agregar
`src/features/dashboard/__tests__/DashboardPage.test.tsx`: stats cards renderizan con datos, tabla usuarios muestra 5 filas, skeleton en loading

---

## PASO 6 — Gestión de Usuarios ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/UserManagement.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/users/`**:
```
src/features/users/
├── UsersPage.tsx               ← Tabla paginada + filtros + acciones
├── components/
│   ├── UsersTable.tsx          ← Tabla con columnas y acciones por fila
│   ├── UserFilters.tsx         ← Search + filtro por estado (activo/inactivo/suspendido)
│   ├── UserDetailPanel.tsx     ← Panel lateral: permisos efectivos agrupados
│   ├── InviteUserModal.tsx     ← Modal: email + selección de rol
│   ├── EditUserModal.tsx       ← Modal: nombre, estado, rol
│   └── ConfirmDeleteModal.tsx  ← Confirmación antes de desactivar
├── hooks/
│   ├── useUsers.ts             ← TanStack Query GET /admin/users/ paginado
│   ├── useUserDetail.ts        ← Query GET /admin/users/{id}/
│   ├── useInviteUser.ts        ← Mutation POST /admin/users/invite/
│   └── useAssignRole.ts        ← Mutation POST /admin/users/{id}/assign-role/
└── types.ts                    ← User, UserDetail, UserStatus, InviteRequest
```

**`src/features/users/components/UsersTable.tsx`**:
- Columnas: Avatar+Nombre, Email, Rol (badge), Estado (badge), Fecha creación, Acciones
- Acciones por fila: Editar, Asignar rol, Suspender/Activar, Ver detalle
- Paginación: 20 por página con controles prev/next
- Acciones protegidas por `usePermissions` (`users.edit`, `users.delete`)

**`src/features/users/components/UserDetailPanel.tsx`**:
- Panel lateral deslizante (derecha)
- Secciones: Info básica, Roles asignados, Permisos efectivos agrupados por categoría
- Categorías: Proyectos, Usuarios, Roles, Billing, Auditoría, etc.

**`src/features/users/components/InviteUserModal.tsx`**:
- Campo email con validación de formato
- Selector de rol (dropdown de roles disponibles)
- Botón "Enviar invitación" → `POST /api/v1/admin/users/invite/`

**API endpoints**:
- `GET /api/v1/admin/users/` → lista paginada
- `GET /api/v1/admin/users/{id}/` → detalle con permisos efectivos
- `POST /api/v1/admin/users/invite/`
- `PATCH /api/v1/admin/users/{id}/`
- `DELETE /api/v1/admin/users/{id}/`
- `POST /api/v1/admin/users/{id}/assign-role/`

### Tests a agregar
`src/features/users/__tests__/UsersPage.test.tsx`: tabla renderiza usuarios, búsqueda filtra, modal invitar envía POST, acciones protegidas si sin permiso

---

## PASO 7 — Gestión de Roles ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/RoleManagement.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/roles/`**:
```
src/features/roles/
├── RolesPage.tsx               ← Grid de tarjetas de roles
├── components/
│   ├── RoleCard.tsx            ← Tarjeta: nombre, color, #usuarios, #permisos, herencia
│   ├── RoleModal.tsx           ← Modal crear/editar: nombre, descripción, color, padre, permisos
│   ├── PermissionsSelector.tsx ← Checkboxes agrupados por categoría (13 categorías)
│   └── SystemRoleBadge.tsx     ← Badge "Sistema" para roles is_system_role=True
├── hooks/
│   ├── useRoles.ts             ← TanStack Query GET /admin/roles/
│   ├── useCreateRole.ts        ← Mutation POST /admin/roles/
│   ├── useUpdateRole.ts        ← Mutation PATCH /admin/roles/{id}/
│   └── useDeleteRole.ts        ← Mutation DELETE /admin/roles/{id}/
└── types.ts                    ← Role, RoleCreate, RoleUpdate
```

**`src/features/roles/components/RoleCard.tsx`**:
- Acento de color izquierdo (campo `color` del rol)
- Badge "Sistema" si `is_system_role=True` (no editable ni eliminable)
- Muestra: nombre, descripción, hereda de (si aplica), conteo permisos, conteo usuarios
- Acciones: Editar, Eliminar (deshabilitadas en roles sistema)

**`src/features/roles/components/RoleModal.tsx`**:
- Campos: nombre (required), descripción, color picker (hex), rol padre (dropdown)
- `PermissionsSelector`: checkboxes agrupados en 13 categorías (62 permisos)
- Validación: nombre único dentro del tenant
- Botón guardar: `POST` (crear) o `PATCH` (editar)

**Validación**:
- No eliminar roles con `is_system_role=True`
- No asignar como padre a sí mismo o a descendientes
- Mostrar error si el rol tiene usuarios asignados al intentar eliminar

**API endpoints**:
- `GET /api/v1/admin/roles/`
- `POST /api/v1/admin/roles/`
- `PATCH /api/v1/admin/roles/{id}/`
- `DELETE /api/v1/admin/roles/{id}/`

### Tests a agregar
`src/features/roles/__tests__/RolesPage.test.tsx`: grid renderiza roles, rol sistema no muestra acciones editar/eliminar, crear rol POST correcto, eliminar pide confirmación

---

## PASO 8 — Gestión de Permisos ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/PermissionManagement.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/permissions/`**:
```
src/features/permissions/
├── PermissionsPage.tsx         ← Vista solo lectura con búsqueda y filtros
├── components/
│   ├── PermissionsGrouped.tsx  ← Acordeón de categorías con lista de permisos
│   ├── PermissionRow.tsx       ← Fila: codename, nombre, acción, recurso
│   └── PermissionFilters.tsx   ← Search + filtro por categoría/recurso
└── hooks/
    └── usePermissions.ts       ← TanStack Query GET /admin/permissions/
```

**`src/features/permissions/components/PermissionsGrouped.tsx`**:
- 13 acordeones colapsables (una por categoría: projects, users, roles, billing, audit, notes, contacts, bookmarks, devops, forms, tasks, calendar, support)
- Cada ítem: badge `codename`, descripción legible, acción (read/create/edit/delete)
- Búsqueda en tiempo real filtra por codename o descripción
- Vista solo lectura — los permisos los asignan los roles

**API endpoints**:
- `GET /api/v1/admin/permissions/`

### Tests a agregar
`src/features/permissions/__tests__/PermissionsPage.test.tsx`: 13 categorías renderizadas, búsqueda filtra correctamente, ninguna acción de escritura disponible

---

## FASE 4 — Billing & Suscripciones

---

## PASO 9 — Gestión de Suscripciones ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/SubscriptionManagement.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/subscriptions/`**:
```
src/features/subscriptions/
├── SubscriptionPage.tsx        ← Plan actual + medidores + comparativa de planes
├── components/
│   ├── CurrentPlanCard.tsx     ← Plan activo, fecha renovación, botón cambiar
│   ├── UsageMeters.tsx         ← Barras de progreso: usuarios, proyectos, API calls, storage
│   ├── PlanComparisonGrid.tsx  ← Grid 4 columnas (Free/Starter/Pro/Enterprise)
│   ├── PlanCard.tsx            ← Tarjeta individual de plan con features y precio
│   └── BillingCycleToggle.tsx  ← Toggle mensual/anual con descuento mostrado
└── hooks/
    ├── useCurrentPlan.ts       ← TanStack Query GET /admin/billing/plan/
    └── usePlanFeatures.ts      ← TanStack Query GET /features/
```

**`src/features/subscriptions/components/UsageMeters.tsx`**:
- Barra de progreso por recurso con color semáforo (verde/amarillo/rojo al 80%/90%)
- Recursos: Usuarios activos, Proyectos, Notas, Contactos, API calls (mensual)
- Tooltip con valor actual vs límite del plan

**`src/features/subscriptions/components/PlanComparisonGrid.tsx`**:
- Resalta plan actual con borde coloreado
- Toggle mensual/anual actualiza precios mostrados
- CTA "Cambiar plan" → flujo de upgrade con confirmación

**API endpoints**:
- `GET /api/v1/admin/billing/plan/`
- `GET /api/v1/features/`
- `POST /api/v1/admin/subscriptions/upgrade/`
- `POST /api/v1/admin/subscriptions/cancel/`

### Tests a agregar
`src/features/subscriptions/__tests__/SubscriptionPage.test.tsx`: medidores muestran % correcto, toggle mensual/anual cambia precios, plan actual resaltado

---

## PASO 10 — Facturación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Billing.jsx`
**Dependencias**: PASO 9

### Qué implementar

**`src/features/billing/`**:
```
src/features/billing/
├── BillingPage.tsx             ← Lista de facturas + métodos de pago
├── components/
│   ├── InvoiceList.tsx         ← Tabla: fecha, monto, estado, botón descarga PDF
│   ├── InvoiceRow.tsx          ← Fila individual con badge de estado
│   ├── PaymentMethods.tsx      ← Tarjetas guardadas + añadir nueva
│   └── PaymentMethodCard.tsx   ← Últimos 4 dígitos, tipo, expiración, badge default
└── hooks/
    ├── useInvoices.ts          ← TanStack Query GET /admin/billing/invoices/
    └── usePaymentMethods.ts    ← TanStack Query GET /admin/billing/payment-methods/
```

**`src/features/billing/components/InvoiceList.tsx`**:
- Columnas: Fecha, Período, Monto, Estado (badge), Descarga
- Estados con badge: `paid` (verde), `open` (amarillo), `void` (gris)
- Link descarga PDF: `invoice.pdf_url` abre en nueva pestaña
- Paginación: 10 por página

**API endpoints**:
- `GET /api/v1/admin/billing/invoices/`
- `GET /api/v1/admin/billing/payment-methods/`

### Tests a agregar
`src/features/billing/__tests__/BillingPage.test.tsx`: lista facturas renderiza con badges correctos, link PDF apunta al URL correcto, estado paid en verde

---

## FASE 5 — Analytics & Auditoría

---

## PASO 11 — Analytics & Reportes ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Reports.jsx` · `docs/ui-ux/prototype-admin/src/components/CustomerAnalytics.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/reports/`**:
```
src/features/reports/
├── ReportsPage.tsx             ← Layout: KPIs + charts + exportar
├── components/
│   ├── KpiCards.tsx            ← MRR, Churn, Crecimiento usuarios, Uptime
│   ├── RoleDistributionChart.tsx ← Recharts BarChart: usuarios por rol
│   ├── UsageTrendsChart.tsx    ← Recharts LineChart: usuarios/proyectos/API (30d)
│   └── ExportButton.tsx        ← CSV/PDF export (Enterprise, usa FeatureGate)
└── hooks/
    ├── useSummary.ts           ← TanStack Query GET /reports/summary/
    ├── useUsageReport.ts       ← TanStack Query GET /reports/usage/
    └── useTrends.ts            ← TanStack Query GET /reports/trends/
```

**`src/features/reports/components/RoleDistributionChart.tsx`**:
- Recharts `BarChart` con `ResponsiveContainer`
- Eje X: nombre del rol, Eje Y: cantidad de usuarios
- Tooltip personalizado con porcentaje
- Colores por rol del sistema (Owner=azul, Manager=verde, Member=naranja, Viewer=gris)

**`src/features/reports/components/UsageTrendsChart.tsx`**:
- Recharts `LineChart` multi-serie (30 días)
- Series: Usuarios activos, Proyectos creados, API requests
- Selector de período: 7d / 30d / 90d
- Feature gate: `analytics_trends` (Professional+)

**Feature gates**:
- `analytics`: Starter+; mostrar `UpgradePrompt` en Free
- `analytics_trends`: Professional+
- Export CSV: `analytics_export` (Enterprise)

**API endpoints**:
- `GET /api/v1/reports/summary/`
- `GET /api/v1/reports/usage/`
- `GET /api/v1/reports/trends/`
- `GET /api/v1/reports/export/`

### Comandos a ejecutar
```bash
npm install recharts
```

### Tests a agregar
`src/features/reports/__tests__/ReportsPage.test.tsx`: KPIs renderizan datos, FeatureGate bloquea trends en free plan, exportar llama endpoint correcto

---

## PASO 12 — Auditoría ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/AuditLogs.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/audit/`**:
```
src/features/audit/
├── AuditPage.tsx               ← Visor de logs con filtros + scroll infinito
├── components/
│   ├── AuditFilters.tsx        ← Date range, actor (usuario), acción, recurso
│   ├── AuditLogTable.tsx       ← Tabla inmutable: timestamp, actor, acción, recurso, IP
│   ├── AuditLogRow.tsx         ← Fila con diff de cambios colapsable
│   └── ExportAuditButton.tsx   ← CSV export (Enterprise, FeatureGate)
└── hooks/
    └── useAuditLogs.ts         ← TanStack Query infinite GET /audit-log/
```

**`src/features/audit/components/AuditFilters.tsx`**:
- DatePicker `date_from` / `date_to` (migrar `shared/DatePicker.jsx` a TypeScript)
- Dropdown actor: búsqueda por nombre de usuario
- Dropdown acción: `create`, `update`, `delete`, `reveal`, `login`, `logout`
- Dropdown recurso: `project`, `user`, `role`, `env_var`, `ssh_key`, etc.

**`src/features/audit/components/AuditLogTable.tsx`**:
- Scroll infinito con `useIntersectionObserver` → carga siguiente página
- Columnas: Timestamp, Actor, Acción (badge), Recurso, ID Recurso, IP, User Agent
- Fila expandible muestra diff JSON de `changes`

**Feature gates**:
- `audit_logs`: Professional+; mostrar `UpgradePrompt` en Free/Starter
- Export CSV: Enterprise

**API endpoints**:
- `GET /api/v1/audit-log/` con params: `user`, `action`, `resource_type`, `date_from`, `date_to`, `page`, `page_size`

### Tests a agregar
`src/features/audit/__tests__/AuditPage.test.tsx`: tabla renderiza logs, filtro por actor filtra resultados, FeatureGate en Free muestra upgrade prompt, scroll infinito carga página 2

---

## FASE 6 — Operaciones

---

## PASO 13 — Gestión de Clientes ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/ClientManagement.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/clients/`**:
```
src/features/clients/
├── ClientsPage.tsx             ← Lista de tenants con estadísticas
├── components/
│   ├── ClientsTable.tsx        ← Tabla: tenant, plan, usuarios, estado, fecha
│   ├── ClientFilters.tsx       ← Búsqueda + filtro por plan + filtro por estado
│   ├── ClientDetailPanel.tsx   ← Panel lateral: info + uso + usuarios
│   └── SuspendClientModal.tsx  ← Confirmación antes de suspender tenant
└── hooks/
    └── useClients.ts           ← TanStack Query GET /admin/clients/
```

**`src/features/clients/components/ClientsTable.tsx`**:
- Columnas: Nombre, Subdominio, Plan (badge), Usuarios activos, Estado, Creado, Acciones
- Acciones: Ver detalle, Cambiar plan, Suspender/Activar
- Búsqueda en tiempo real por nombre o subdominio
- Plan badges: Free (gris), Starter (azul), Professional (morado), Enterprise (dorado)

**`src/features/clients/components/ClientDetailPanel.tsx`**:
- Panel deslizante lateral con 3 tabs: Info, Uso, Usuarios
- Tab Uso: medidores de recursos idénticos a `UsageMeters.tsx`
- Tab Usuarios: mini-tabla con los últimos 5 usuarios activos

**API endpoints**:
- `GET /api/v1/admin/clients/`
- `GET /api/v1/admin/clients/{id}/`
- `PATCH /api/v1/admin/clients/{id}/`

### Tests a agregar
`src/features/clients/__tests__/ClientsPage.test.tsx`: tabla con plan badges correctos, búsqueda filtra por subdominio, suspender muestra modal confirmación

---

## PASO 14 — Promociones ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/PromotionManagement.jsx` · `docs/ui-ux/prototype-admin/src/components/PromotionModal.jsx` · `docs/ui-ux/prototype-admin/src/components/PromotionStatsModal.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/promotions/`**:
```
src/features/promotions/
├── PromotionsPage.tsx          ← Grid de tarjetas de promociones
├── components/
│   ├── PromotionCard.tsx       ← Tarjeta: código, descuento, usos, expiración, estado
│   ├── PromotionModal.tsx      ← Modal crear/editar: código, descuento, tipo, límites
│   └── PromotionStatsModal.tsx ← Modal estadísticas: usos, revenue generado, conversión
└── hooks/
    ├── usePromotions.ts        ← TanStack Query GET /admin/promotions/
    ├── useCreatePromotion.ts   ← Mutation POST /admin/promotions/
    └── useUpdatePromotion.ts   ← Mutation PATCH /admin/promotions/{id}/
```

**`src/features/promotions/components/PromotionCard.tsx`**:
- Badge de estado: Activo (verde), Expirado (rojo), Límite alcanzado (naranja)
- Barra de uso: `uses_count / max_uses` con porcentaje
- Fecha expiración con advertencia si < 7 días
- Acciones: Ver stats, Editar, Desactivar/Activar, Eliminar

**`src/features/promotions/components/PromotionModal.tsx`**:
- Código: texto libre o botón "Generar aleatorio"
- Tipo de descuento: porcentaje (%) o monto fijo ($)
- Planes aplicables: checkboxes multi-selección
- Fecha expiración: DatePicker
- Límite de usos: número (0 = ilimitado)

**API endpoints**:
- `GET /api/v1/admin/promotions/`
- `POST /api/v1/admin/promotions/`
- `PATCH /api/v1/admin/promotions/{id}/`
- `DELETE /api/v1/admin/promotions/{id}/`

### Tests a agregar
`src/features/promotions/__tests__/PromotionsPage.test.tsx`: grid renderiza tarjetas, barra de uso calcula % correcto, crear promoción POST con campos correctos

---

## PASO 15 — Soporte (Tickets) ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Support.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/support/`**:
```
src/features/support/
├── SupportPage.tsx             ← Cola de tickets con filtros + detalle
├── components/
│   ├── TicketQueue.tsx         ← Tabla paginada de tickets con filtros
│   ├── TicketFilters.tsx       ← Estado, prioridad, categoría, asignado a
│   ├── TicketDetailView.tsx    ← Panel derecho: historial + comentarios + acciones
│   ├── CommentThread.tsx       ← Hilo de comentarios con badge agente/cliente
│   ├── CommentInput.tsx        ← Textarea + opción "comentario interno" (solo agentes)
│   └── AssignAgentModal.tsx    ← Modal para asignar ticket a agente
└── hooks/
    ├── useTickets.ts           ← TanStack Query GET /support/tickets/
    ├── useTicketDetail.ts      ← TanStack Query GET /support/tickets/{id}/
    ├── useAddComment.ts        ← Mutation POST /support/tickets/{id}/comments/
    └── useUpdateTicket.ts      ← Mutation PATCH /support/tickets/{id}/
```

**`src/features/support/components/TicketQueue.tsx`**:
- Columnas: Referencia, Asunto, Estado (badge), Prioridad (badge), Categoría, Creado, Asignado a
- Estados: `open` (azul), `in_progress` (amarillo), `waiting_client` (naranja), `resolved` (verde), `closed` (gris)
- Prioridad: `low`, `medium`, `high`, `urgent` con `PriorityBadge.tsx` del prototipo
- Click en fila → muestra `TicketDetailView` en panel lateral

**`src/features/support/components/CommentThread.tsx`**:
- Comentarios ordenados por fecha ascendente
- Badge "Agente" (azul) o "Cliente" (gris) según `role`
- Comentarios internos con fondo amarillo claro + icono candado (solo visible para agentes)
- Indicador de tiempo relativo ("hace 2 horas")

**API endpoints**:
- `GET /api/v1/support/tickets/`
- `GET /api/v1/support/tickets/{id}/`
- `PATCH /api/v1/support/tickets/{id}/`
- `POST /api/v1/support/tickets/{id}/comments/`
- `POST /api/v1/support/tickets/{id}/close/`

### Tests a agregar
`src/features/support/__tests__/SupportPage.test.tsx`: cola renderiza tickets, badge de prioridad urgente en rojo, comentario interno visible solo para agentes, cerrar ticket PATCH correcto

---

## PASO 16 — Centro de Notificaciones ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Notifications.jsx`
**Dependencias**: PASO 4

### Qué implementar

**`src/features/notifications/`**:
```
src/features/notifications/
├── NotificationsPage.tsx       ← Lista completa de notificaciones
├── components/
│   ├── NotificationList.tsx    ← Lista con categorías y estados leído/no leído
│   ├── NotificationItem.tsx    ← Ítem: ícono categoría, mensaje, timestamp, acciones
│   └── BulkActions.tsx         ← "Marcar todo como leído", "Eliminar leídas"
└── hooks/
    ├── useNotifications.ts     ← TanStack Query + polling cada 60s
    └── useMarkAsRead.ts        ← Mutation POST /admin/notifications/{id}/read/
```

**`src/features/notifications/components/NotificationList.tsx`**:
- Tabs de categoría: Todas, Sistema, Billing, Seguridad, Soporte
- Badge contador de no leídas en cada tab
- Notificaciones no leídas con fondo ligeramente más oscuro
- Click en notificación: marca como leída + navega al recurso relacionado si aplica

**Polling automático**:
- `useNotifications` con `refetchInterval: 60 * 1000` (60 segundos)
- Actualiza badge de la campana en `Navbar.tsx` via `uiStore`

**API endpoints**:
- `GET /api/v1/admin/notifications/`
- `POST /api/v1/admin/notifications/{id}/read/`
- `POST /api/v1/admin/notifications/read-all/`

### Tests a agregar
`src/features/notifications/__tests__/NotificationsPage.test.tsx`: badge muestra contador correcto, marcar como leída actualiza UI, polling llama API cada 60s

---

## PASO 17 — Configuración ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/src/components/Settings.jsx` · `docs/ui-ux/prototype-admin/src/components/settings/`
**Dependencias**: PASO 3

### Qué implementar

**`src/features/settings/`**:
```
src/features/settings/
├── SettingsPage.tsx            ← Contenedor con tabs de navegación lateral
└── tabs/
    ├── ProfileTab.tsx          ← Nombre, email, avatar upload (migrar ProfileSettings.jsx)
    ├── SecurityTab.tsx         ← Cambio contraseña, MFA enable/disable (migrar SecuritySettings.jsx)
    ├── OrganizationTab.tsx     ← Nombre org, logo, color primario (migrar OrganizationSettings.jsx)
    ├── InterfaceTab.tsx        ← Tema (light/dark), idioma (migrar InterfaceSettings.jsx)
    └── NotificationsTab.tsx    ← Preferencias por categoría (migrar NotificationsSettings.jsx)
```

**`src/features/settings/tabs/ProfileTab.tsx`** (migrar `ProfileSettings.jsx`):
- Campos: Nombre completo, Email (solo lectura), Avatar (upload)
- Cambio de avatar: preview antes de guardar, aceptar PNG/JPG < 2MB
- Botón "Guardar cambios" → `PATCH /api/v1/auth/profile/`

**`src/features/settings/tabs/SecurityTab.tsx`** (migrar `SecuritySettings.jsx`):
- Cambio de contraseña: actual + nueva + confirmar con validación de fortaleza
- MFA: estado actual + botón Habilitar (genera QR) o Deshabilitar (pide password)
- Sesiones activas: lista + botón "Cerrar todas las demás"

**`src/features/settings/tabs/OrganizationTab.tsx`** (migrar `OrganizationSettings.jsx`):
- Solo visible/editable para Owner/Admin
- Nombre organización, Subdominio (solo lectura), Logo upload, Color primario (color picker)
- Botón guardar → `PATCH /api/v1/admin/organization/`

**`src/features/settings/tabs/InterfaceTab.tsx`** (migrar `InterfaceSettings.jsx`):
- Toggle dark/light mode sincronizado con `uiStore`
- Selector de idioma: Español / English
- Selector de timezone

**`src/features/settings/tabs/NotificationsTab.tsx`** (migrar `NotificationsSettings.jsx`):
- Checkboxes por categoría: Sistema, Billing, Seguridad, Soporte
- Canales: Email, In-app, Ninguno

**API endpoints**:
- `PATCH /api/v1/auth/profile/`
- `POST /api/v1/auth/change-password/`
- `POST /api/v1/auth/mfa/enable/`
- `POST /api/v1/auth/mfa/disable/`
- `PATCH /api/v1/admin/organization/`

### Tests a agregar
`src/features/settings/__tests__/SettingsPage.test.tsx`: tab organización oculto para usuarios sin permiso, cambio contraseña valida confirmación, MFA muestra QR al habilitar

---

## FASE 7 — Calidad & Deploy

---

## PASO 18 — Testing ⬜

**Archivos de referencia**: `apps/backend_django/` (patrón de tests como referencia)
**Dependencias**: PASO 3–17

### Qué implementar

**Setup de testing**:
```
src/
├── test/
│   ├── setup.ts                ← @testing-library/jest-dom, MSW setup
│   ├── server.ts               ← MSW server con handlers
│   └── handlers/               ← Handlers MSW por feature
│       ├── auth.handlers.ts
│       ├── users.handlers.ts
│       ├── roles.handlers.ts
│       └── ...
└── __mocks__/
    └── fileMock.ts             ← Mock para imports de imágenes/SVG
```

**`vitest.config.ts`**:
- Environment: `jsdom`
- Setup: `src/test/setup.ts`
- Coverage: `v8` con threshold 80%
- Alias: `@/` → `src/`

**Tests unitarios de hooks** (`src/features/*/hooks/__tests__/`):
- `useAuth.test.ts`: login exitoso, logout limpia store, refresh automático en 401
- `usePermissions.test.ts`: `hasPermission` con roles system, permisos heredados
- `useFeatureGate.test.ts`: plan free bloquea analytics, enterprise tiene acceso total

**Tests de integración** (`src/features/*/`):
- Flujo login → dashboard → logout
- Flujo crear usuario → asignar rol → ver permisos efectivos
- Flujo crear rol → asignar permisos → ver en usuario

**MSW handlers para todos los endpoints del backend** (PASO 1–20 del backend):
- Respuestas realistas con datos de ejemplo
- Simular errores: 401, 403, 422, 500
- Simular feature gates: respuestas según plan del mock user

### Comandos a ejecutar
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom
npm run test
npm run test:coverage   # target > 80%
```

### Tests a agregar
Al menos 2 tests por feature (PASO 5–17): mínimo 26 test files, objetivo > 80% cobertura

---

## PASO 19 — Performance & Accesibilidad ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-admin/` (diseño de referencia para auditoría)
**Dependencias**: PASO 18

### Qué implementar

**Análisis de bundle** (`vite.config.ts`):
```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'
plugins: [react(), visualizer({ open: true, gzipSize: true })]
```

**Code splitting por ruta** (en `src/router/index.tsx`):
```typescript
const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'))
const Users = lazy(() => import('@/features/users/UsersPage'))
// ... todas las rutas lazy
```

**Lazy loading de componentes pesados**:
- `Recharts` charts: lazy + Suspense con skeleton placeholder
- `PromotionStatsModal`: lazy (se carga solo al abrir modal)
- `AuditLogTable` con scroll infinito: virtualización con `@tanstack/react-virtual`

**Accesibilidad (WCAG 2.1 AA)**:
- Auditoría completa con `axe-core` en tests
- Atributos ARIA en modales: `role="dialog"`, `aria-labelledby`, `aria-modal="true"`
- Navegación por teclado: todos los elementos interactivos alcanzables con Tab
- Focus trap en modales (usar `@radix-ui/react-dialog` o implementación manual)
- Contraste de colores: verificar todos los badges y textos con `axe-core`
- `alt` descriptivo en avatares e imágenes funcionales
- `<label>` explícito para todos los inputs (no solo placeholder)
- Anuncio de cambios dinámicos con `aria-live="polite"`

**Métricas objetivo** (Lighthouse en producción):
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 85

### Comandos a ejecutar
```bash
npm install -D rollup-plugin-visualizer @tanstack/react-virtual
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm run build && npm run preview
# Ejecutar Lighthouse en http://localhost:4173
```

### Tests a agregar
`src/test/a11y/`: tests de accesibilidad con `jest-axe` para las 5 páginas principales: Dashboard, Users, Roles, Audit, Settings

---

## PASO 20 — Build & Deploy ⬜

**Archivos de referencia**: `apps/backend_django/Dockerfile` (referencia de multi-stage) · `apps/backend_django/Makefile`
**Dependencias**: PASO 18, PASO 19

### Qué implementar

**`vite.config.ts`** — Config de producción:
```typescript
build: {
  outDir: 'dist',
  sourcemap: false,
  minify: 'terser',
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        query: ['@tanstack/react-query'],
        charts: ['recharts'],
        i18n: ['i18next', 'react-i18next']
      }
    }
  }
}
```

**`Dockerfile`** — Multi-stage:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ARG VITE_API_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`nginx.conf`** — SPA routing:
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

**`Makefile`**:
```makefile
dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

test:
	npm run test

test-coverage:
	npm run test:coverage

docker-build:
	docker build --build-arg VITE_API_URL=$(VITE_API_URL) -t admin-panel .

docker-run:
	docker run -p 3000:80 admin-panel
```

**`.env.example`**:
```bash
VITE_API_URL=http://localhost:8000
VITE_APP_NAME="RBAC Admin Panel"
VITE_APP_VERSION=1.0.0
```

**CI pipeline** (`.github/workflows/frontend-admin.yml`):
- Trigger: push a `main` y PRs
- Jobs: `lint` → `test` → `build` → `docker-build`
- Cache: `node_modules` por hash de `package-lock.json`

### Comandos a ejecutar
```bash
cd apps/frontend_admin
make build
make docker-build VITE_API_URL=https://api.tudominio.com
make docker-run
# Verificar: http://localhost:3000
```

### Tests a agregar
- Smoke test: `npm run build` sin errores TypeScript
- `dist/index.html` existe con assets referenciados
- Docker image construye correctamente y sirve la app

---

## Verificación Final

```bash
cd apps/frontend_admin

# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env
# Editar VITE_API_URL apuntando al backend

# 3. Desarrollo local (requiere backend corriendo)
make dev
# Visitar: http://localhost:5174

# 4. Linting y types
make lint
npx tsc --noEmit

# 5. Tests
make test
make test-coverage   # objetivo: > 80%

# 6. Build de producción
make build
make preview
# Visitar: http://localhost:4173

# 7. Docker
make docker-build VITE_API_URL=http://localhost:8000
make docker-run
# Visitar: http://localhost:3000
```

---

## Tabla Resumen

| # | Paso | Componentes principales | Estado | Dependencias |
|---|------|------------------------|--------|--------------|
| 1 | Scaffold Vite+TS+Tailwind | vite.config.ts, tsconfig.json, Makefile | ⬜ | — |
| 2 | Infraestructura Core | api.ts, queryClient.ts, stores, i18n, router | ⬜ | 1 |
| 3 | Autenticación | LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, AuthContext, GoogleOAuthButton | ⬜ | 2 |
| 4 | Shell & Navegación | AppLayout, Navbar, Sidebar, usePermissions, FeatureGate | ⬜ | 3 |
| 5 | Dashboard | StatsCards, RecentUsersTable, RecentAuditEvents | ⬜ | 4 |
| 6 | Gestión de Usuarios | UsersTable, UserDetailPanel, InviteUserModal | ⬜ | 4 |
| 7 | Gestión de Roles | RoleCard, RoleModal, PermissionsSelector | ⬜ | 4 |
| 8 | Gestión de Permisos | PermissionsGrouped, PermissionsPage (read-only) | ⬜ | 4 |
| 9 | Suscripciones | CurrentPlanCard, UsageMeters, PlanComparisonGrid | ⬜ | 4 |
| 10 | Facturación | InvoiceList, PaymentMethods | ⬜ | 9 |
| 11 | Analytics & Reportes | KpiCards, RoleDistributionChart, UsageTrendsChart | ⬜ | 4 |
| 12 | Auditoría | AuditFilters, AuditLogTable (scroll infinito), Export | ⬜ | 4 |
| 13 | Gestión de Clientes | ClientsTable, ClientDetailPanel | ⬜ | 4 |
| 14 | Promociones | PromotionCard, PromotionModal, PromotionStatsModal | ⬜ | 4 |
| 15 | Soporte (Tickets) | TicketQueue, TicketDetailView, CommentThread | ⬜ | 4 |
| 16 | Notificaciones | NotificationList, BulkActions, polling 60s | ⬜ | 4 |
| 17 | Configuración | 5 tabs: Profile, Security, Org, Interface, Notifications | ⬜ | 3 |
| 18 | Testing | Vitest + Testing Library + MSW, cobertura > 80% | ⬜ | 3–17 |
| 19 | Performance & A11y | Code splitting, lazy, axe-core, WCAG 2.1 AA | ⬜ | 18 |
| 20 | Build & Deploy | Dockerfile multi-stage, Nginx, Makefile, CI pipeline | ⬜ | 18, 19 |
