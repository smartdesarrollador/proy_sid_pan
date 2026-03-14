# Hub Client Portal Frontend — Roadmap de Implementación

**Stack**: React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query v5 · Zustand · React Router v7 · i18next
**Directorio base**: `apps/frontend_hub_client/`
**Prototipo de referencia**: `docs/ui-ux/prototype-hub-client/` (puerto 3003, 12 pantallas, datos mock)
**PRD**: `prd/features/hub-client-portal.md` (v1.3.0)
**API backend**: `apps/backend_django/` (PASOes 1–28 ✅ completados)
**Referencia de arquitectura**: `docs/architecture/sso-architecture.md` · `docs/architecture/system-overview.md`

---

## Progreso General

| Estado | Significado |
|--------|-------------|
| ✅ Completado | Implementado y funcional |
| 🔄 En progreso | Trabajo activo |
| ⬜ Pendiente | No iniciado |

---

## Integración API

> Todos los endpoints son consumidos desde **`apps/frontend_hub_client/`** hacia el backend
> en **`apps/backend_django/`** (Django REST Framework, PASOes 1–28 ✅ completados).
>
> - **Base URL local**: `http://localhost:8000/api/v1/` (proxy Vite → `vite.config.ts`)
> - **Documentación de la API**: `http://localhost:8000/api/docs/` (Swagger UI)
> - **Auth**: JWT Bearer (`Authorization: Bearer <accessToken>`)
> - **Tenant header**: `X-Tenant-Slug: {slug}` requerido en endpoints `/app/*` y `/admin/*`
> - **Refresh automático**: interceptor Axios → `POST /api/v1/auth/token/refresh/`
> - **SSO**: `POST /api/v1/auth/sso/token/` → redirect con `?sso_token=` → servicio valida

### Endpoints por Feature

| Feature | Endpoints |
|---------|-----------|
| Auth | `/auth/login/`, `/auth/register/`, `/auth/token/refresh/`, `/auth/logout/`, `/auth/forgot-password/`, `/auth/reset-password/`, `/auth/profile/`, `/auth/change-password/`, `/auth/mfa/enable/`, `/auth/mfa/disable/`, `/auth/mfa/validate/` |
| SSO | `/auth/sso/token/` |
| Servicios | `/app/services/`, `/app/services/active/` |
| Suscripción | `/admin/subscriptions/current/`, `/admin/subscriptions/upgrade/`, `/admin/subscriptions/cancel/` |
| Billing | `/admin/billing/invoices/`, `/admin/billing/payment-methods/` (CRUD) |
| Equipo | `/admin/users/`, `/admin/users/invite/`, `/admin/users/{id}/suspend/`, `/admin/users/{id}/` |
| Notificaciones | `/app/notifications/`, `/app/notifications/{id}/read/`, `/app/notifications/read-all/` |
| Referidos | `/app/referrals/` |
| Soporte | `/support/tickets/`, `/support/tickets/{id}/`, `/support/tickets/{id}/comments/` |
| Features | `/features/` (plan gates) |

---

## Agents y Skills de Desarrollo

### Skills disponibles (`.claude/skills/`)

| Skill | Cuándo usarlo |
|-------|--------------|
| `react-tailwind-components` | Crear componentes UI (cards, tablas, modales, badges) |
| `react-api-fetch-patterns` | Hooks de fetching con Axios/TanStack Query |
| `react-api-authentication` | Login, register, refresh token, protected routes |
| `react-forms-validation` | react-hook-form + Zod en formularios |
| `react-tanstack-query` | Queries, mutations, invalidación de cache |
| `react-hooks-patterns` | Custom hooks (usePermissions, useSSO, useTheme) |
| `react-context-state` | AuthContext, stores Zustand |
| `react-testing-library` | Tests con Vitest + Testing Library |
| `react-router-patterns` | Rutas protegidas, lazy loading, redirect |
| `ui-base-components` | Botones, inputs, cards, badges del design system |
| `ui-design-tokens` | Colores, tipografía, espaciado del sistema |
| `ui-layout-system` | Navbar, layout, responsive patterns |
| `vite-react-configuration` | vite.config.ts, proxy, aliases, env vars |
| `drf-auth` | Referencia a endpoints de auth del backend |

### Agentes disponibles (`.claude/agents/`)

| Agente | Cuándo activarlo |
|--------|-----------------|
| `react-vite-builder` | Scaffolding de features completas |
| `ui-ux-designer` | Migración de prototipos, dark mode, componentes visuales |
| `test-generator` | Generar tests Vitest/Testing Library por PASO |
| `code-reviewer` | Revisión de calidad antes de cerrar cada PASO |
| `security-auditor` | Revisar flujo SSO, manejo de tokens, auth flows |

---

## FASE 1 — Setup Base

---

## PASO 1 — Scaffold del Proyecto ✅

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/` · `apps/frontend_admin/package.json` · `apps/frontend_admin/vite.config.ts`
**Dependencias**: ninguna

### Qué implementar

```
apps/frontend_hub_client/
├── package.json                ← React 18, TypeScript, Vite, Tailwind, ESLint, Prettier
├── vite.config.ts              ← path alias @/ → src/, proxy /api → backend (puerto 5175)
├── tsconfig.json               ← strict mode, paths, target ES2022
├── tsconfig.node.json
├── tailwind.config.ts          ← content paths, darkMode: 'class', tokens del prototipo
├── postcss.config.js
├── .eslintrc.cjs               ← eslint-plugin-react, @typescript-eslint
├── .prettierrc
├── .env.example                ← VITE_API_URL, VITE_APP_NAME, VITE_REFERRAL_BASE_URL
├── Makefile                    ← make dev, make build, make preview, make lint, make test
├── index.html
└── src/
    ├── main.tsx                ← Providers: QueryClient, Router, i18n
    ├── App.tsx
    ├── vite-env.d.ts
    └── index.css               ← Tokens de diseño (dark mode vars, badges, utility classes)
```

**Dependencias exactas** (versiones idénticas al admin panel):

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^7.13.1",
    "@tanstack/react-query": "^5.90.21",
    "axios": "^1.13.6",
    "lucide-react": "^0.576.0",
    "react-hook-form": "^7.71.2",
    "zod": "^4.3.6",
    "zustand": "^5.0.11",
    "i18next": "^25.8.13",
    "react-i18next": "^16.5.4",
    "@hookform/resolvers": "^5.2.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^4.0.18",
    "@vitest/coverage-v8": "^4.0.18",
    "msw": "^2.12.10",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "jest-axe": "^10.0.0"
  }
}
```

**Tokens de diseño** a definir en `index.css` (dark mode incluido desde el inicio):

```css
/* index.css — tokens Hub */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --hub-primary: #2563eb;       /* blue-600 */
  --navbar-height: 64px;
}

/* Badges de estado */
@layer components {
  .badge { @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium; }
  .badge-active   { @apply bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400; }
  .badge-inactive { @apply bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400; }
  .badge-pending  { @apply bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400; }
  .badge-owner    { @apply bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400; }
  .badge-admin    { @apply bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400; }
  .badge-member   { @apply bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300; }
  .card-hub       { @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl; }
}
```

**`tailwind.config.ts`** — dark mode con estrategia `class` + colores custom:

```ts
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 600: '#2563eb',
          700: '#1d4ed8', 900: '#1e3a8a',
        },
      },
    },
  },
}
```

### Docker ✅

La imagen usa **multi-stage build** con 4 etapas:

| Stage | Base | Propósito |
|-------|------|-----------|
| `base` | `node:20-alpine` | Instala dependencias (`npm ci`) |
| `dev` | `base` | Vite dev server con HMR — expone puerto **5175** |
| `builder` | `base` | Build de producción (acepta `ARG VITE_API_URL` / `VITE_APP_NAME`) |
| `prod` | `nginx:1.25-alpine` | Sirve `/dist` estático, expone puerto **80** |

**`docker-compose.yml`** — desarrollo:
- Servicio `vite` → target `dev`, container `rbac_hub_client_vite`
- Volume `node_modules` anónimo (preserva módulos del contenedor)
- `env_file: .env` + variable `API_TARGET: http://rbac_django:8000` (usada por el proxy de `vite.config.ts`)
- Puerto `5175:5175`
- Redes: `default` + `global` (externa — conecta con el backend `rbac_django`)

**`nginx/nginx.conf`** requerido en producción (stage `prod` copia desde `nginx/nginx.conf`).

**`.dockerignore`**: excluye `node_modules`, `dist`, `.git`, `coverage`, `.env*`, `*.log`.

```bash
# Desarrollo con Docker
docker compose up              # levanta Vite dev server en http://localhost:5175

# Build de producción
docker build --target prod \
  --build-arg VITE_API_URL=https://api.tudominio.com/api/v1/ \
  --build-arg VITE_APP_NAME="Hub de Servicios" \
  -t rbac-hub-client:prod .
```

> **Nota de red**: La red `global` debe existir previamente (`docker network create global`) para conectar con el container del backend Django.

### Comandos a ejecutar

```bash
cd apps/frontend_hub_client
npm install
npm run dev   # http://localhost:5175
```

### Tests a agregar

- `npm run build` sin errores de TypeScript
- Alias `@/` resuelve correctamente

---

## PASO 2 — Infraestructura Core ✅

**Archivos de referencia**: `apps/frontend_admin/src/lib/` · `apps/frontend_admin/src/store/` · `apps/frontend_admin/src/i18n/` · `docs/ui-ux/prototype-hub-client/src/locales/`
**Dependencias**: PASO 1
**Agente**: `react-vite-builder`

### Qué implementar

```
src/
├── lib/
│   ├── api.ts              ← Cliente Axios con interceptores JWT + X-Tenant-Slug
│   └── queryClient.ts      ← TanStack Query v5, staleTime 5min, retry 1
├── store/
│   ├── authStore.ts        ← user, tenant, accessToken, setUser, setTenant, clearAuth
│   └── uiStore.ts          ← darkMode, toggleDarkMode, sidebarOpen, language, setLanguage
├── i18n/
│   ├── config.ts           ← i18next setup, fallback 'es', localStorage hub-lang
│   └── locales/
│       ├── es.ts           ← 15 namespaces Hub (navbar, landing, login, register, dashboard,
│       │                      serviceCard, serviceCatalog, subscription, billing, notifications,
│       │                      team, referrals, support, profile, common)
│       └── en.ts           ← traducción completa EN de los mismos 15 namespaces
├── router/
│   └── index.tsx           ← createBrowserRouter, rutas públicas y protegidas, lazy
└── types/
    ├── api.ts              ← PaginatedResponse<T>, ApiError, ApiResponse<T>
    ├── auth.ts             ← User, Tenant, AuthState, LoginRequest, RegisterRequest
    └── hub.ts              ← ServiceStatus, TenantService, ReferralStatus, NotificationCategory
```

**`src/lib/api.ts`** — puntos clave:
- `baseURL` desde `import.meta.env.VITE_API_URL`
- Interceptor `request`: inyecta `Authorization: Bearer {accessToken}` + `X-Tenant-Slug: {slug}`
- Interceptor `response`: captura 401, llama refresh, reintenta request original
- `accessToken` en memoria (variable módulo), `refreshToken` en `localStorage`
- `publicClient` sin interceptor de auth (para login, register, validate-sso)

**`src/store/uiStore.ts`** — dark mode con persistencia:
```ts
// Al montar: leer localStorage('hub-theme') → aplicar clase 'dark' en <html>
// toggleDarkMode → actualiza estado + localStorage + clase <html>
// language: 'es' | 'en', setLanguage → llama i18n.changeLanguage + localStorage('hub-lang')
```

**`src/i18n/locales/es.ts`** — estructura basada en el prototipo (`src/locales/es.js`):
```ts
// Claves por sección (migrar del prototipo):
// navbar, landing, login, register (steps 1-4), dashboard, serviceCard,
// serviceCatalog, subscription, billing, notifications, team,
// referrals, support, profile, common
```

**`src/router/index.tsx`** — estructura de rutas:
```tsx
// Rutas públicas: /, /login, /register, /forgot-password, /reset-password
// Rutas protegidas (ProtectedRoute): /dashboard, /services, /subscription,
//   /billing, /notifications, /team, /referrals, /support, /profile
// Lazy imports para cada feature
```

### Tests a agregar

`src/lib/__tests__/api.test.ts`:
- Interceptor inyecta `Authorization` header
- `X-Tenant-Slug` se añade cuando hay tenant en store
- Refresh interceptor reintenta en 401
- `clearAuth` se llama en 401 sin refresh token

---

## FASE 2 — Auth & Shell

---

## PASO 3 — Autenticación + Landing + Registro Multi-Paso ✅

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/Login.jsx` · `docs/ui-ux/prototype-hub-client/src/components/landing/LandingPage.jsx` · `docs/ui-ux/prototype-hub-client/src/components/register/RegisterView.jsx`
**Dependencias**: PASO 2
**Skills**: `react-api-authentication`, `react-forms-validation`, `ui-base-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/auth/
├── LandingPage.tsx             ← Hero + features + comparación de planes + footer
│                                  Botones: "Comenzar gratis" / "Empezar con Starter" /
│                                  "Empezar con Professional" → abren RegisterView
│                                  "Iniciar sesión" → /login
├── LoginPage.tsx               ← Email + contraseña + hint demo
├── RegisterPage.tsx            ← Stepper 4 pasos (ver abajo)
├── ForgotPasswordPage.tsx      ← Email input → "te enviamos un correo"
├── ResetPasswordPage.tsx       ← Nueva contraseña (token en URL ?token=)
├── AuthContext.tsx             ← isLoading, login(), logout(), register()
│                                  Persiste user+tenant en localStorage
├── hooks/
│   ├── useLogin.ts             ← Mutation POST /auth/login/
│   ├── useRegister.ts          ← Mutation POST /auth/register/ (con campo plan)
│   ├── useForgotPassword.ts    ← Mutation POST /auth/forgot-password/
│   └── useResetPassword.ts     ← Mutation POST /auth/reset-password/
└── __tests__/
    ├── LoginPage.test.tsx
    └── RegisterPage.test.tsx
```

**`RegisterPage.tsx`** — Stepper multi-paso (4 steps):

| Paso | Campos | Validaciones |
|------|--------|-------------|
| 1 — Cuenta | email, password, confirmPassword | zod: email valid, password ≥8 chars, match |
| 2 — Empresa | organizationName → preview subdomain en tiempo real (`{slug}.rbacplatform.com`) | zod: min 2 chars |
| 3 — Plan | selección de plan (Free/Starter/Professional) con badge "Más popular" en Starter | plan seleccionado |
| 4 — ¡Listo! | checkmark animado (CSS keyframes) + resumen: email, org, plan | — |

- Stepper visual: círculos numerados + líneas conectoras. Activo = `bg-primary-600 text-white`. Completado = `✓ bg-primary-600`.
- Al completar paso 4: `POST /auth/register/` con `{ email, password, organization_name, plan }` → `login()` automático → `navigate('/dashboard')`
- Los botones de plan en LandingPage pasan el plan pre-seleccionado al step 3 vía `useNavigate` state

**`AuthContext.tsx`**:
- `login()`: POST `/auth/login/` → almacena `accessToken` en memoria, `refreshToken` en localStorage, `user` + `tenant` en localStorage
- `register()`: POST `/auth/register/` → login automático (misma lógica)
- Al montar: si `refreshToken` existe, intenta refresh → restaura sesión. Si falla, limpia y queda en public.
- `logout()`: POST `/auth/logout/` → `clearAuth()`

**Payload de registro** (según PRD sección 9):
```json
{ "name": "...", "email": "...", "password": "...", "organization_name": "...", "plan": "starter" }
```

### Tests a agregar

- `LoginPage.test.tsx`: render, submit correcto, error 401 muestra mensaje
- `RegisterPage.test.tsx`: progresión de pasos (step1→step2→step3→step4), preview subdominio en tiempo real, plan pre-seleccionado desde navigate state, submit final llama POST /auth/register/

---

## PASO 4 — Shell & Navegación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/Navbar.jsx` · `docs/ui-ux/prototype-hub-client/src/contexts/` · `apps/frontend_admin/src/layouts/`
**Dependencias**: PASO 3
**Skills**: `ui-layout-system`, `react-router-patterns`, `react-hooks-patterns`
**Agente**: `react-vite-builder` + `ui-ux-designer`

### Qué implementar

```
src/
├── layouts/
│   ├── AppLayout.tsx           ← Navbar (h-16 fixed) + main content (pt-16)
│   │                              NO sidebar — Hub usa navbar horizontal
│   └── components/
│       ├── Navbar.tsx          ← Links: Dashboard · Servicios · Suscripción · Equipo · Soporte · Perfil
│       │                          Right side: Bell (badge) · Globe (ES/EN) · Moon/Sun · Avatar
│       └── NavBellIcon.tsx     ← Icono Bell con badge rojo de unread count
├── hooks/
│   ├── usePermissions.ts       ← hasPermission(), isOwner, isAdmin (desde user.permissions[])
│   └── useFeatureGate.ts       ← hasFeature(), getLimit() → GET /features/
├── components/shared/
│   ├── ProtectedRoute.tsx      ← Verifica isAuthenticated, redirige a /login
│   └── PermissionGate.tsx      ← Oculta contenido sin permiso (sin upgrade prompt)
└── pages/                      ← Re-exports de cada feature page (para router lazy)
```

**`Navbar.tsx`** — diferencias con admin panel:
- Sin sidebar — solo navbar horizontal (`h-16 fixed top-0 w-full z-30 bg-white dark:bg-gray-900`)
- Links activos: `border-b-2 border-primary-600 text-primary-700`
- Bell → navega a `/notifications` (no dropdown aquí, ver PASO 11 para badge)
- Toggle Dark Mode: `Moon/Sun` icon → `uiStore.toggleDarkMode()` → clase `dark` en `<html>`
- Toggle Idioma: `Globe + ES/EN` → `uiStore.setLanguage(lang)` → `i18n.changeLanguage(lang)`
- Avatar: iniciales del user, dropdown con `Perfil` + `Cerrar sesión`
- Mobile: hamburger menu con los mismos links

**`AppLayout.tsx`** — Hub no tiene sidebar:
```tsx
// <Navbar /> fixed h-16 z-30
// <main className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
//   <Outlet />
// </main>
```

**`usePermissions.ts`** — derivado de `user.permissions[]` y `user.roles[]`:
```ts
// hasPermission('billing.read') → boolean
// isOwner: user.roles.includes('Owner')
// isAdmin: user.roles.includes('Owner') || user.roles.includes('Service Manager')
// canManageBilling: hasPermission('billing.manage')
```

### Tests a agregar

- `AppLayout.test.tsx`: renderiza Navbar, links principales, bell icon, toggles visible
- `ProtectedRoute.test.tsx`: redirige a /login cuando no autenticado
- `usePermissions.test.ts`: `hasPermission` retorna false sin permisos, true con el permiso correcto

---

## FASE 3 — Dashboard & Servicios

---

## PASO 5 — Dashboard Principal ✅

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/dashboard/HubDashboard.jsx` · `docs/ui-ux/prototype-hub-client/src/components/dashboard/ServiceCard.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `ui-base-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/dashboard/
├── DashboardPage.tsx           ← Página principal del Hub autenticado
├── types.ts                    ← DashboardSummary, ServiceSummary, PlanSummary
├── hooks/
│   ├── useDashboardSummary.ts  ← Computa desde useCurrentSubscription + useNotifications
│   └── useActiveServices.ts    ← GET /app/services/active/ → TenantService[]
├── components/
│   ├── SummaryCards.tsx        ← 4 cards: Plan / Facturación / Soporte / Referidos
│   ├── ActiveServicesList.tsx  ← Grid de servicios adquiridos del tenant
│   ├── ServiceUpgradeCatalog.tsx ← Servicios no activos con CTA de upgrade
│   └── PlanUsageBanner.tsx     ← Banner amarillo si uso > 80% del límite del plan
└── __tests__/
    └── DashboardPage.test.tsx
```

**`SummaryCards.tsx`** — 4 cards (según PRD sección 10):

| Card | Dato | Link destino |
|------|------|-------------|
| Plan | Plan actual + próxima renovación | `/subscription` |
| Facturación | Próximo cobro + estado | `/billing` |
| Soporte | Tickets abiertos | `/support` |
| Referidos | Referidos activos + balance | `/referrals` |

**`ActiveServicesList.tsx`** — grid de `ServiceCard`:
- Status `active` → botón azul "Abrir" (dispara SSO — implementado en PASO 6)
- Status `suspended` → botón gris "Suspendido" (deshabilitado)
- Status `locked` → botón "Actualizar Plan" (link a /subscription)
- Status `coming_soon` → badge "Próximamente" (sin botón)
- Skeleton: 3 cards `animate-pulse` mientras carga

**`PlanUsageBanner.tsx`** — alerta amarilla visible en dashboard:
- Se muestra si `current_users / plan_limit_users >= 0.80`
- Link "Actualizar Plan" → `/subscription`

### Tests a agregar

- `DashboardPage.test.tsx`: 4 summary cards visibles, lista de servicios activos, banner de upgrade cuando uso >80%

---

## PASO 6 — Catálogo de Servicios & Flujo SSO ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/dashboard/ServiceCatalog.jsx` · `docs/ui-ux/prototype-hub-client/src/hooks/useSSO.js` · `docs/architecture/sso-architecture.md`
**Dependencias**: PASO 5
**Skills**: `react-hooks-patterns`, `react-api-fetch-patterns`
**Agente**: `react-vite-builder` + `security-auditor` (revisar manejo de tokens SSO)

### Qué implementar

```
src/features/services/
├── ServicesPage.tsx            ← Catálogo completo (activos + disponibles para upgrade)
├── types.ts                    ← Service, TenantService, ServiceStatus
├── hooks/
│   ├── useServiceCatalog.ts    ← GET /app/services/ → Service[] con available + status
│   ├── useActiveServices.ts    ← GET /app/services/active/ (re-export para dashboard)
│   └── useSSO.ts               ← Mutation POST /auth/sso/token/ → redirect
└── components/
    ├── ServiceCard.tsx          ← Card de servicio con estado + acción
    ├── ServiceStatusBadge.tsx   ← active/suspended/locked/coming_soon
    └── SSOLaunchButton.tsx      ← Botón "Abrir" con loading state durante SSO
```

**`useSSO.ts`** — flujo SSO completo:
```ts
// mutate({ service: 'workspace' })
// → POST /auth/sso/token/ { service }
// → response: { sso_token, redirect_url, expires_in }
// → window.location.href = redirect_url (incluye ?sso_token=...)
// Error 403: tenant inactivo o servicio no adquirido → toast error
// Error 404: servicio no encontrado → toast error
// Loading state en botón durante la petición (TTL: respuesta < 60s)
```

**`ServiceCard.tsx`** — diseño del prototipo:
- Ícono de servicio (Lucide), nombre, descripción, badge de estado
- Status `active` → `<SSOLaunchButton>` azul con spinner mientras carga
- Status `locked` → "Requiere plan X" + botón "Ver planes" → `/subscription`
- Status `coming_soon` → badge "Próximamente" gris
- Status `suspended` → badge "Suspendido" gris + mensaje

**`ServicesPage.tsx`** — 2 secciones:
- "Mis Servicios" (TenantServices activos/suspendidos)
- "Ampliar tus servicios" (servicios disponibles no adquiridos, con upgrade CTA)

### Tests a agregar

- `ServicesPage.test.tsx`: sección "Mis Servicios" muestra servicios activos, botón "Abrir" dispara useSSO, servicios bloqueados muestran CTA de upgrade
- `useSSO.test.ts`: POST correcto a /auth/sso/token/, redirect a redirect_url, manejo error 403/404

---

## FASE 4 — Suscripción & Billing

---

## PASO 7 — Gestión de Suscripción ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/subscription/SubscriptionView.jsx` · `apps/frontend_admin/src/features/subscriptions/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `ui-base-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/subscriptions/
├── SubscriptionPage.tsx        ← Vista principal /subscription
├── types.ts                    ← CurrentSubscription, Plan, PlanFeature, UsageData
├── plans-data.ts               ← Array estático PLANS (Free/Starter/Professional/Enterprise)
├── hooks/
│   ├── useCurrentSubscription.ts ← GET /admin/subscriptions/current/ (staleTime 60s)
│   ├── useUpgradeSubscription.ts ← POST /admin/subscriptions/upgrade/
│   └── useCancelSubscription.ts  ← POST /admin/subscriptions/cancel/
├── components/
│   ├── CurrentPlanCard.tsx     ← Plan actual, próxima renovación, estado, link billing
│   ├── UsageMeters.tsx         ← Barras de progreso: usuarios/almacenamiento/servicios
│   │                              verde<70% / amarillo<90% / rojo≥90% / azul=ilimitado
│   ├── BillingCycleToggle.tsx  ← Mensual / Anual (badge "-10% descuento")
│   ├── PlanComparisonGrid.tsx  ← Grid 4 columnas con features Check/X
│   ├── UpgradePlanModal.tsx    ← Confirmación upgrade (con spinner)
│   └── CancelSubscriptionModal.tsx ← Confirmación cancelación con textarea de motivo
└── __tests__/
    └── SubscriptionPage.test.tsx
```

**`CurrentPlanCard.tsx`** — incluye:
- Banner amarillo si `cancel_at_period_end = true`: "Tu suscripción se cancelará el {fecha}"
- Link "Métodos de pago" → `/billing` (visible solo si `canManageBilling`)
- Skeleton mientras carga

**`UsageMeters.tsx`** — misma lógica que admin panel:
- `null` límite → barra azul 100% ("Ilimitado")
- `current/limit >= 0.9` → rojo
- `current/limit >= 0.7` → amarillo
- `< 0.7` → verde
- `role="progressbar"` para accesibilidad

**Permisos requeridos**:
- Ver suscripción: `billing.read` (Owner + Admin)
- Upgrade: `billing.upgrade` (Owner)
- Cancelar: `billing.upgrade` (Owner)
- Sin permiso → banner "Solo el Owner puede gestionar la suscripción"

### Tests a agregar

- `SubscriptionPage.test.tsx`: CurrentPlanCard visible, barras de uso coloreadas correctamente, toggle mensual/anual, UpgradePlanModal aparece al seleccionar plan, cancelación con confirmación

---

## PASO 8 — Métodos de Pago & Facturación ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/billing/PaymentMethodsView.jsx`
**Dependencias**: PASO 7
**Skills**: `react-forms-validation`, `react-tanstack-query`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/billing/
├── BillingPage.tsx             ← Vista /billing (métodos de pago + historial facturas)
├── types.ts                    ← PaymentMethod, PaymentMethodType, Invoice
├── hooks/
│   ├── usePaymentMethods.ts    ← GET /admin/billing/payment-methods/ (clave: payment_methods)
│   ├── useAddPaymentMethod.ts  ← POST /admin/billing/payment-methods/
│   ├── useSetDefaultMethod.ts  ← PATCH /admin/billing/payment-methods/{id}/
│   ├── useDeletePaymentMethod.ts ← DELETE /admin/billing/payment-methods/{id}/
│   └── useInvoices.ts          ← GET /admin/billing/invoices/ (re-export o nuevo hook)
├── components/
│   ├── PaymentMethodCard.tsx   ← Card con brand color, last4, badge "Predeterminado"
│   ├── AddPaymentMethodModal.tsx ← Modal 3 tabs (ver abajo)
│   ├── InvoiceRow.tsx          ← Fila de tabla: fecha, monto, estado, PDF download
│   └── InvoiceList.tsx         ← Tabla paginada de facturas
└── __tests__/
    └── BillingPage.test.tsx
```

**`AddPaymentMethodModal.tsx`** — 3 tabs:

| Tab | Campos |
|-----|--------|
| Tarjeta | número tarjeta (formato 4-4-4-4), fecha exp (MM/YY), CVV, nombre titular |
| Billetera Digital | botones "Conectar PayPal" + "Conectar MercadoPago" (simulan OAuth redirect) |
| Pago Local | select: Yape/Plin/Nequi/Daviplata + input número de celular |

**Marcas de pago** — colores y etiquetas:
```ts
const PAYMENT_BRANDS = {
  visa:        { color: '#1A1F71', label: 'Visa' },
  mastercard:  { color: '#EB001B', label: 'Mastercard' },
  paypal:      { color: '#003087', label: 'PayPal' },
  mercadopago: { color: '#009EE3', label: 'MercadoPago' },
  yape:        { color: '#7B2D8B', label: 'Yape' },
  plin:        { color: '#2AC400', label: 'Plin' },
  nequi:       { color: '#A0008E', label: 'Nequi' },
  daviplata:   { color: '#FFA500', label: 'Daviplata' },
}
```

**Regla**: No se puede eliminar el método predeterminado (botón "Eliminar" deshabilitado con tooltip).

> **Nota importante**: La respuesta de `GET /admin/billing/payment-methods/` usa la clave
> `payment_methods` (NO `methods` — ver bug conocido en PRD sección 9). Mapear correctamente.

### Tests a agregar

- `BillingPage.test.tsx`: lista métodos con badge Predeterminado, botón eliminar deshabilitado en default, tabs del modal (Tarjeta/Billetera/Pago Local), tabla de facturas con skeleton

---

## FASE 5 — Equipo & Referidos

---

## PASO 9 — Gestión de Equipo ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/team/TeamView.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `react-forms-validation`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/team/
├── TeamPage.tsx                ← Vista /team
├── types.ts                    ← TeamMember, TeamMemberStatus, TeamRole, Invitation
├── hooks/
│   ├── useTeamMembers.ts       ← GET /admin/users/ (filtra por tenant, staleTime 60s)
│   ├── useInviteTeamMember.ts  ← POST /admin/users/invite/ (email + role)
│   ├── useSuspendTeamMember.ts ← POST /admin/users/{id}/suspend/ ({ active: bool })
│   └── useRemoveTeamMember.ts  ← DELETE /admin/users/{id}/
├── components/
│   ├── TeamUsageBar.tsx        ← "N / límite usuarios del plan X" con barra de progreso
│   ├── TeamTable.tsx           ← Tabla: avatar+iniciales, nombre, email, rol, estado, fecha, acciones
│   ├── RoleBadge.tsx           ← owner (violeta Crown) / admin (azul Shield) / member (gris User)
│   ├── PendingInvitations.tsx  ← Sección visible solo si hay invitaciones pending
│   └── InviteTeamMemberModal.tsx ← Modal: email + select rol (admin/member), validado con zod
└── __tests__/
    └── TeamPage.test.tsx
```

**`TeamTable.tsx`** — comportamiento:
- Avatar con iniciales (2 chars, background color derivado del nombre)
- Owner: sin botones de acción (Crown icon, badge violeta)
- Admin/Member: botón "Suspender/Reactivar" + botón "Eliminar" (con confirmación inline)
- Botón "Invitar miembro" → deshabilitado con tooltip si se alcanzó el límite del plan

**Permisos requeridos**:
- Ver equipo: `users.read` (Owner + Admin)
- Invitar: `users.invite`
- Suspender: `users.update`
- Eliminar: `users.delete` (solo Owner)

### Tests a agregar

- `TeamPage.test.tsx`: tabla de miembros visible, owner sin botones de acción, modal de invitación con validación, sección invitaciones pendientes aparece cuando hay invitaciones

---

## PASO 10 — Programa de Referidos ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/referrals/ReferralsView.jsx`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `ui-base-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/referrals/
├── ReferralsPage.tsx           ← Vista /referrals
├── types.ts                    ← ReferralDashboard, ReferralStats, ReferralHistory
├── hooks/
│   └── useReferralDashboard.ts ← GET /app/referrals/ (staleTime 5min)
│                                  Response: { code, referral_url, stats, referrals[] }
├── components/
│   ├── ReferralStatsCards.tsx  ← 3 cards: referidos activos / créditos ganados / balance
│   ├── ReferralCodeBox.tsx     ← Código único + botón "Copiar código" (feedback "¡Copiado!" 2s)
│   ├── ReferralLinkBox.tsx     ← URL completa + botón copiar (mismo feedback)
│   ├── HowItWorksSteps.tsx     ← 3 pasos horizontales: Comparte → Se registran → Ganas
│   └── ReferralHistoryTable.tsx ← Tabla: email enmascarado, plan, estado badge, crédito, fecha
└── __tests__/
    └── ReferralsPage.test.tsx
```

**`ReferralCodeBox.tsx`** — feedback visual:
```ts
// Estado local: copied = false
// Al copiar: navigator.clipboard.writeText(code) → copied = true
// setTimeout 2000ms → copied = false
// Botón muestra: copied ? '¡Copiado! ✓' : 'Copiar código'
// Estilo al copiar: bg-green-50 border-green-200 (feedback visual)
```

**`ReferralHistoryTable.tsx`**:
- Email enmascarado: `carlos@acme.com` → `ca***@acme.com`
- Estado badge: `active` → verde · `pending` → naranja
- Crédito: `$29.00` formateado
- Fecha: `toLocaleDateString` según idioma activo

**Permisos requeridos**: `referrals.read` (Owner + Admin). Sin permiso → `PermissionGate` oculta la página.

### Tests a agregar

- `ReferralsPage.test.tsx`: 3 stats cards visibles, botón copiar muestra "¡Copiado!" por 2s, historial con estados coloreados

---

## FASE 6 — Notificaciones, Soporte & Perfil

---

## PASO 11 — Centro de Notificaciones ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/notifications/NotificationsView.jsx` · `apps/frontend_admin/src/features/notifications/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `ui-base-components`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/notifications/
├── NotificationsPage.tsx       ← Vista /notifications
├── types.ts                    ← HubNotification, NotificationCategory, NotificationFilter
├── hooks/
│   ├── useHubNotifications.ts  ← GET /app/notifications/ (refetchInterval: 60_000)
│   ├── useMarkAsRead.ts        ← POST /app/notifications/{id}/read/
│   └── useMarkAllAsRead.ts     ← POST /app/notifications/read-all/
├── components/
│   ├── NotificationItem.tsx    ← Item: unread dot, icono categoría, título, timestamp relativo
│   ├── NotificationFilters.tsx ← Pills: Todas | Facturación | Seguridad | Servicios | Sistema
│   ├── BellBadge.tsx           ← Badge contador (re-export para uso en Navbar)
│   └── EmptyNotifications.tsx  ← Estado vacío por filtro activo
└── __tests__/
    └── NotificationsPage.test.tsx
```

**Categorías y colores Hub** (distintos del Admin Panel):

| Categoría | Color | Ícono Lucide |
|-----------|-------|-------------|
| `billing` | Verde | CreditCard |
| `security` | Rojo | Shield |
| `services` | Azul | Layers |
| `system` | Gris | Settings |

**`NotificationItem.tsx`** — comportamiento:
- `read = false`: punto azul (`•`) + fondo `bg-blue-50 dark:bg-blue-950/20`
- Al hacer clic: `useMarkAsRead.mutate(id)` → optimistic update `read = true`
- Timestamp relativo: "Ahora mismo" (<60s) / "hace N min" (<60min) / "hace Nh" (<24h) / "hace N días"

**Integración con Navbar** (`NavBellIcon.tsx` del PASO 4):
```ts
// useHubNotifications() → cuenta unread → badge rojo si > 0
// Badge: conteo, max "9+" si ≥ 10
```

**Nota backend**: El endpoint `/app/notifications/` filtra categorías Hub (`billing`, `security`, `services`, `system`). La categoría `services` fue agregada en el backend (PASO 25).

### Tests a agregar

- `NotificationsPage.test.tsx`: filtros pills funcionan, notificaciones sin leer con dot azul, clic marca como leída, botón "Marcar todo" deshabilitado sin unread, estado vacío

---

## PASO 12 — Centro de Soporte ✅

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/support/SupportView.jsx` · `apps/frontend_admin/src/features/support/`
**Dependencias**: PASO 4
**Skills**: `react-tanstack-query`, `react-forms-validation`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/support/
├── SupportPage.tsx             ← Vista /support
├── types.ts                    ← SupportTicket, TicketStatus, TicketPriority, TicketComment
├── hooks/
│   ├── useMyTickets.ts         ← GET /support/tickets/ (solo tickets del usuario)
│   ├── useTicketDetail.ts      ← GET /support/tickets/{id}/
│   ├── useCreateTicket.ts      ← POST /support/tickets/
│   └── useAddComment.ts        ← POST /support/tickets/{id}/comments/
├── components/
│   ├── TicketList.tsx          ← Lista de tickets del usuario con filtros básicos
│   ├── TicketStatusBadge.tsx   ← open/in_progress/waiting_client/resolved/closed
│   ├── TicketPriorityBadge.tsx ← urgente/alta/media/baja
│   ├── NewTicketModal.tsx      ← Modal: título, categoría, prioridad, descripción
│   ├── TicketDetailView.tsx    ← Panel lateral: hilo de comentarios + responder
│   └── ServiceStatusBanner.tsx ← Banner de estado de servicios / incidentes activos
└── __tests__/
    └── SupportPage.test.tsx
```

**`SupportPage.tsx`** — scoping:
- Solo muestra tickets del usuario autenticado (`request.user` en backend)
- No requiere permiso especial — solo `IsAuthenticated`
- Botón "Nuevo ticket" siempre visible

**`NewTicketModal.tsx`** — formulario (react-hook-form + zod):
- Título (min 5 chars)
- Categoría: billing / technical / account / general
- Prioridad: baja / media / alta / urgente
- Descripción (min 20 chars)

**`ServiceStatusBanner.tsx`** — banner informativo en top de la página (mock/estático inicialmente).

### Tests a agregar

- `SupportPage.test.tsx`: lista de tickets del usuario, modal "Nuevo ticket" con validación, detail panel con comentarios, botón "Responder"

---

## PASO 13 — Perfil de Usuario ⬜

**Archivos de referencia**: `docs/ui-ux/prototype-hub-client/src/components/profile/ProfileView.jsx` · `apps/frontend_admin/src/features/settings/`
**Dependencias**: PASO 4
**Skills**: `react-forms-validation`, `react-tanstack-query`
**Agente**: `react-vite-builder`

### Qué implementar

```
src/features/profile/
├── ProfilePage.tsx             ← Vista /profile con tabs verticales
├── types.ts                    ← ProfileUpdateRequest, PasswordChangeRequest, MFASetupResponse
├── hooks/
│   ├── useUpdateProfile.ts     ← PATCH /auth/profile/ → actualiza authStore.setUser
│   ├── useChangePassword.ts    ← POST /auth/change-password/
│   ├── useMFASetup.ts          ← POST /auth/mfa/enable/ → { qr_uri, secret }
│   └── useMFADisable.ts        ← POST /auth/mfa/disable/
├── components/
│   ├── PersonalInfoTab.tsx     ← Nombre, email (readonly), avatar placeholder
│   ├── SecurityTab.tsx         ← Cambio contraseña (form) + MFA (QR code display)
│   └── PreferencesTab.tsx      ← Idioma (sincroniza con i18n global) + Zona horaria
└── __tests__/
    └── ProfilePage.test.tsx
```

**`ProfilePage.tsx`** — tabs:

| Tab | Contenido |
|-----|-----------|
| Información Personal | Nombre, email (readonly), avatar |
| Seguridad | Form cambio contraseña + sección MFA (activar/desactivar, QR) |
| Preferencias | Toggle idioma ES/EN (sincroniza con `uiStore.setLanguage`) + timezone select |

**Tab Preferencias** — idioma sincronizado:
- El selector de idioma llama a `uiStore.setLanguage(lang)` (mismo que el toggle del Navbar)
- Dark mode toggle también presente aquí (sincronizado con uiStore)

### Tests a agregar

- `ProfilePage.test.tsx`: tabs navegan correctamente, form contraseña valida y envía, toggle idioma cambia i18n global, sección MFA muestra QR al activar

---

## FASE 7 — QA & Cierre

---

## PASO 14 — Testing Infrastructure + Cobertura Final ⬜

**Archivos de referencia**: `apps/frontend_admin/src/test/` (setup.ts, handlers, server)
**Dependencias**: PASOes 1–13
**Agente**: `test-generator` + `code-reviewer` + `security-auditor`

### Qué implementar

```
src/test/
├── setup.ts                    ← @testing-library/jest-dom, MSW, ResizeObserver, axeConfig
├── server.ts                   ← MSW setupServer (msw/node)
├── handlers/
│   ├── auth.handlers.ts        ← POST /auth/login/, /auth/register/, /auth/token/refresh/
│   ├── services.handlers.ts    ← GET /app/services/, /app/services/active/
│   ├── sso.handlers.ts         ← POST /auth/sso/token/
│   ├── subscription.handlers.ts ← GET /admin/subscriptions/current/ + upgrade + cancel
│   ├── billing.handlers.ts     ← GET/POST/PATCH/DELETE /admin/billing/payment-methods/
│   ├── team.handlers.ts        ← GET /admin/users/ + invite + suspend + delete
│   ├── notifications.handlers.ts ← GET /app/notifications/ + mark-read
│   ├── referrals.handlers.ts   ← GET /app/referrals/
│   └── support.handlers.ts     ← GET/POST /support/tickets/
└── a11y/
    ├── dashboard.a11y.test.tsx
    ├── services.a11y.test.tsx
    └── register.a11y.test.tsx
```

**Configuración de cobertura** (`vite.config.ts`):
```ts
coverage: {
  provider: 'v8',
  thresholds: { lines: 65, functions: 50, branches: 55, statements: 65 },
  exclude: ['src/features/**/types.ts', 'src/test/**', 'src/router/**'],
}
```

**Setup.ts** — patrones del admin panel (reutilizar):
```ts
// axios.defaults.adapter = 'http'  ← CRÍTICO para MSW en Node.js
// onUnhandledRequest: 'bypass'      ← CRÍTICO para tests con vi.mock
// ResizeObserver mock como clase (no vi.fn())
// configureAxe como RunOptions { rules: { 'color-contrast': { enabled: false } } }
```

**Tests a agregar** (completar cobertura):

| Feature | Tests pendientes |
|---------|-----------------|
| Auth | LoginPage, RegisterPage (flujo completo stepper) |
| Shell | AppLayout, Navbar toggles, ProtectedRoute |
| Dashboard | SummaryCards, ActiveServicesList, PlanUsageBanner |
| Servicios | ServicesPage, ServiceCard, SSO flow |
| Suscripción | SubscriptionPage, UsageMeters colores, upgrade/cancel |
| Billing | PaymentMethodCard, AddPaymentMethodModal 3 tabs |
| Equipo | TeamTable, InviteModal, PendingInvitations |
| Referidos | ReferralCodeBox copy, historial estados |
| Notificaciones | Filtros, mark-read, bell badge |
| Soporte | TicketList, NewTicketModal validación |
| Perfil | Tabs nav, contraseña form, idioma sync |

### Comandos de verificación

```bash
cd apps/frontend_hub_client

# Tests + cobertura
npm test                # todos los tests, 0 failures
npm run coverage        # cobertura > umbrales configurados

# TypeScript + Lint
npm run typecheck       # 0 errores
npm run lint            # 0 warnings

# Build de producción
npm run build           # sin errores, bundles optimizados
npm run preview         # verificar en http://localhost:4173
```

---

## Resumen de PASOes

| PASO | Descripción | Estado | Dependencias |
|------|-------------|--------|-------------|
| 1 | Scaffold del Proyecto + Docker | ✅ | — |
| 2 | Infraestructura Core (Axios, TQ, Zustand, i18n, Router) | ✅ | PASO 1 |
| 3 | Auth + Landing + Registro Multi-Paso | ✅ | PASO 2 |
| 4 | Shell & Navegación (AppLayout, Navbar, dark/lang toggles) | ⬜ | PASO 3 |
| 5 | Dashboard Principal (summary cards, servicios activos) | ⬜ | PASO 4 |
| 6 | Catálogo de Servicios & Flujo SSO | ⬜ | PASO 5 |
| 7 | Gestión de Suscripción (plan, usage, upgrade, cancel) | ⬜ | PASO 4 |
| 8 | Métodos de Pago & Facturación (LATAM, 3 tabs) | ⬜ | PASO 7 |
| 9 | Gestión de Equipo (tabla, invitar, suspender) | ⬜ | PASO 4 |
| 10 | Programa de Referidos (stats, código copiable, historial) | ⬜ | PASO 4 |
| 11 | Centro de Notificaciones (filtros, mark-read, bell badge) | ⬜ | PASO 4 |
| 12 | Centro de Soporte (tickets propios, nuevo ticket) | ⬜ | PASO 4 |
| 13 | Perfil de Usuario (datos, seguridad, MFA, preferencias) | ⬜ | PASO 4 |
| 14 | Testing Infrastructure + Cobertura Final + Build | ⬜ | PASOes 1–13 |

**Total: 14 PASOes** · **Directorio**: `apps/frontend_hub_client/`

---

## Notas de Arquitectura

### Dark Mode
- Estrategia `class` en Tailwind (`darkMode: 'class'`)
- `uiStore.darkMode` controla el estado + persiste en `localStorage('hub-theme')`
- Al montar la app: leer `localStorage` → aplicar clase `dark` en `<html>` antes del primer render
- El toggle en Navbar y en `Perfil > Preferencias` usan el mismo store

### i18n
- `i18next` con 15 namespaces Hub (migrados del prototipo `src/locales/`)
- Por defecto: `'es'`. Persiste en `localStorage('hub-lang')`
- `uiStore.setLanguage(lang)` → `i18n.changeLanguage(lang)` + localStorage
- El selector en `Perfil > Preferencias` sincroniza con el mismo store (no duplicado)

### SSO Security
- El `sso_token` nunca se almacena en el frontend (se genera y se redirige inmediatamente)
- El redirect usa `window.location.href` (no `navigate`) para salir del SPA
- Timeout visual en el botón "Abrir": loading state durante la petición SSO

### Diferencias con Admin Panel
- No hay sidebar — navegación horizontal en Navbar
- No hay `FeatureGate` de plan para vistas (solo para acciones específicas como upgrade)
- Las notificaciones usan `/app/notifications/` (categorías Hub) vs `/admin/notifications/` (admin)
- Los endpoints de billing/users usan prefijo `/admin/` pero son accesibles por el Owner del tenant
- La clave de respuesta de payment-methods es `payment_methods` (no `methods`)
