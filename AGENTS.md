# AGENTS.md - Agent Configuration (Open Standard)

This file follows the [AGENTS.md](https://agents.md/) open standard for guiding AI coding agents.

## Project Context

- **Name**: RBAC Subscription Platform
- **Description**: SaaS multi-tenant con control de acceso basado en roles (RBAC), billing por suscripción y servicios digitales públicos (tarjeta, portfolio, landing, CV)
- **Primary Language**: Python 3.11+ (backend), TypeScript (frontends)
- **Backend Framework**: Django REST Framework + PostgreSQL + Redis + Celery
- **Frontend Stack**: React + Vite (Admin, Hub, Workspace), Next.js 15 App Router (Vista), Tauri v2 (Desktop)

---

## Apps del Sistema

| App | Ruta | Framework | Puerto dev | Propósito |
|-----|------|-----------|-----------|-----------|
| **Backend API** | `apps/backend_django/` | Django + DRF | 8000 | API REST central, autenticación, RBAC, billing |
| **Admin Panel** | `apps/frontend_admin/` | React + Vite | 5173 | Gestión interna: usuarios, roles, billing, auditoría |
| **Hub Client Portal** | `apps/frontend_hub_client/` | React + Vite | 5175 | Portal del cliente: servicios, suscripción, SSO |
| **Workspace** | `apps/frontend_workspace/` | React + Vite | — | App de productividad: proyectos, tareas, notas, etc. |
| **Vista (Digital Services)** | `apps/frontend_next_vista/` | Next.js 15 | — | Editor + vista pública: tarjeta, landing, portfolio, CV |
| **Desktop** | `apps/frontend_sidebar_desktop/` | Tauri v2 + React | — | Sidebar de escritorio (Windows AppBar), acceso offline |

---

## Tipos de Usuario y Acceso

### Dos tipos de usuario completamente separados

| Tipo | Condición | Puede acceder a |
|------|-----------|-----------------|
| **Staff / Superadmin** | `user.is_staff = True` | Solo Admin Panel (`frontend_admin`) |
| **Cliente / Tenant** | `user.is_staff = False` + tenant activo | Hub, Workspace, Vista, Desktop |
| **Anónimo** | Sin auth | Vistas públicas de Vista únicamente |

**Regla crítica**: Los clientes NUNCA pueden acceder al Admin Panel. El `ProtectedRoute` de `frontend_admin` bloquea a cualquier usuario con `is_staff=False`.

**Dos conceptos separados**:
- `Tenant.plan` (free/starter/professional/enterprise) → controla features de producto
- RBAC roles (Owner, Editor, Viewer) → controlan acciones dentro del Workspace

### Vistas públicas (sin auth, solo en Vista/Next.js)
- `/[locale]/tarjeta/[username]` — Tarjeta digital
- `/[locale]/landing/[username]` — Landing page
- `/[locale]/portafolio/[username]` — Portfolio + detalle de proyecto
- `/[locale]/cv/[username]` — CV

---

## Arquitectura de Autenticación

### Flujo 1: Login directo
```
POST /api/v1/auth/login { email, password }
  → { access_token, refresh_token, user { ..., tenant_plan }, tenant }
  → Si MFA: { mfa_required: true, mfa_token } → POST /auth/mfa/validate

Admin Panel: verifica user.is_staff === true
Hub: acepta cualquier usuario autenticado con tenant activo
```

### Flujo 2: SSO Hub → Workspace / Vista
```
1. Hub: POST /api/v1/auth/sso/token/ { service: "workspace"|"vista" }
   → { sso_token (64 chars, TTL 60s, single-use), redirect_url }

2. Browser redirige al servicio: /sso/callback?sso_token=<token>

3. Servicio: POST /api/v1/auth/sso/validate/ { sso_token }
   → { access_token, refresh_token, user, tenant }
   (atómico, single-use, registra AuditLog)

4. Servicio almacena tokens y navega al dashboard
   Workspace: ws-refreshToken/ws-authUser/ws-authTenant en localStorage
   Vista:     refreshToken en localStorage + accessToken en cookie
```

### Flujo 3: Deep Link Desktop (rbacdesktop://)
```
1. Desktop genera nonce UUID → abre webview del Hub: ?source=desktop&state=<nonce>
2. Usuario se autentica en Hub
3. Hub construye: rbacdesktop://auth?payload=<base64(tokens+user+tenant)>&state=<nonce>
4. Desktop pollea poll_deep_link_url cada 500ms (timeout 120s)
   → Valida nonce → decodifica payload → almacena tokens → navega al dashboard
```

### Session Restore (Vista/Next.js)
```
useSessionRestore en authenticated layout:
1. Si no hay token → redirect a Hub (/login?next=vista)
2. POST /auth/token/refresh/ → nuevo access_token
3. GET /auth/profile/ → user (con tenant_plan)
4. Almacena en Zustand + cookie para SSR
```

---

## Planes y Límites

| Recurso | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| max_users | 5 | 10 | 25 | ∞ |
| max_projects | 2 | 10 | ∞ | ∞ |
| storage_gb | 1 | 5 | 20 | ∞ |
| api_calls/mes | 1k | 10k | 100k | ∞ |
| audit_log_days | 7 | 30 | 365 | 2,555 |
| MFA | ✗ | ✗ | ✓ | ✓ |
| SSO | ✗ | ✗ | ✗ | ✓ |
| custom_domain | ✗ | ✗ | ✗ | ✓ |
| portfolio | ✗ | ✗ | ✓ | ✓ |
| landingPage | ✗ | ✓ | ✓ | ✓ |

---

## Coding Standards

- Type hints en todas las firmas de función (Python y TypeScript)
- Prefer Pydantic models / DRF Serializers sobre raw dicts
- Use async/await para operaciones I/O
- Funciones < 50 líneas; lógica de negocio en services/managers
- Prefer composition sobre inheritance
- `select_related`/`prefetch_related` para evitar N+1 queries
- Secrets siempre en variables de entorno, nunca hardcodeados

---

## Directory Structure

```
├── AGENTS.md               # Open standard agent config (this file)
├── CLAUDE.md               # Claude Code project instructions
├── README.md               # Project documentation
├── Makefile                # Task automation
│
├── apps/
│   ├── backend_django/     # Django API (puerto 8000)
│   │   ├── apps/           # Django applications (auth, rbac, tenants, subscriptions, ...)
│   │   ├── config/         # Settings (base/dev/prod), URLs, Celery
│   │   ├── core/           # BaseModel, AuditMixin, TenantMixin
│   │   └── utils/          # plans.py, encryption.py, cache.py
│   ├── frontend_admin/     # React+Vite Admin Panel (puerto 5173)
│   ├── frontend_hub_client/ # React+Vite Hub Portal (puerto 5175)
│   ├── frontend_workspace/ # React+Vite Workspace
│   ├── frontend_next_vista/ # Next.js 15 Vista Digital Services
│   └── frontend_sidebar_desktop/ # Tauri v2 Desktop App
│
├── docs/
│   ├── adr/                # Architecture Decision Records
│   ├── api/                # API documentation
│   ├── architecture/       # System design docs
│   └── ui-ux/             # Prototypes (admin :3000, hub :3003, workspace :3001, vista)
│
├── prd/                    # Product Requirement Documents
├── plans/                  # Implementation plans (temporary)
├── reports/                # Generated reports
│
├── .claude/
│   ├── agents/             # Custom AI agents (13 agents)
│   ├── commands/           # Slash commands (create-prd, generate-report, onboard, pr-review)
│   ├── hooks/              # Automation hooks
│   ├── rules/              # Modular instructions (agent-orchestration, code-style, security)
│   └── skills/             # Domain knowledge (42 skills)
│
└── .github/workflows/      # CI/CD pipelines
```

---

## Task Execution Rules

1. Leer archivos relevantes antes de hacer cambios
2. Ejecutar tests después de modificaciones (`make test` en `apps/backend_django/`)
3. Seguir conventional commits format
4. Nunca hardcodear secrets — usar variables de entorno
5. Ejecutar `make makemigrations` + `make migrate` después de cambios en modelos
6. Crear PRD en `prd/features/` antes de implementar features nuevas
7. Documentar decisiones arquitectónicas en `docs/adr/`

---

## Available Commands

Ver `.claude/commands/` para slash commands disponibles:
- `/create-prd` — Crear un Product Requirement Document para una nueva feature
- `/generate-report` — Generar un reporte de estado del proyecto
- `/onboard` — Exploración profunda del proyecto para entender su estructura
- `/pr-review` — Revisar un pull request en busca de calidad, seguridad y correctitud

---

## Available Agents

Los agentes en `.claude/agents/` son subagentes especializados. Delega tareas a ellos según el contexto:

### Planificación y Arquitectura
| Agente | Cuándo usarlo |
|--------|--------------|
| `planner` | Al planificar la estrategia de implementación de features, cambios arquitectónicos o análisis de impacto antes de escribir código |
| `researcher` | Al investigar patrones en el código, recopilar contexto de la base de código o responder preguntas sobre cómo funciona algo |

### Desarrollo Frontend
| Agente | Cuándo usarlo |
|--------|--------------|
| `react-vite-builder` | Al desarrollar en `frontend_admin`, `frontend_hub_client` o `frontend_workspace` (React + Vite + TypeScript + Tailwind) |
| `nextjs-builder` | Al desarrollar en `frontend_next_vista` (Next.js 15 + TypeScript + Tailwind, App Router) |
| `tauri-desktop-builder` | Al desarrollar en `frontend_sidebar_desktop` (Tauri v2 + React + Vite + TypeScript) |
| `ui-ux-designer` | Al diseñar layouts, componentes UI/UX, sistemas de diseño, temas o cualquier tarea de interfaz visual |

### Desarrollo Backend
| Agente | Cuándo usarlo |
|--------|--------------|
| `migration-manager` | Al gestionar migrations de Django, detectar conflictos entre migraciones o validar su seguridad |
| `database-optimizer` | Al optimizar queries SQL/ORM, detectar N+1, sugerir índices o analizar rendimiento de base de datos |
| `api-documenter` | Al generar o validar documentación OpenAPI/Swagger para APIs REST |

### Calidad y Seguridad
| Agente | Cuándo usarlo |
|--------|--------------|
| `code-reviewer` | Al revisar código en busca de calidad, patrones incorrectos, bugs o mejoras antes de un merge |
| `test-generator` | Al generar tests unitarios, de integración o validar cobertura de código |
| `security-auditor` | Al auditar seguridad, validar aislamiento multi-tenant o detectar vulnerabilidades (OWASP, injection, etc.) |
| `compliance-checker` | Al validar cumplimiento de GDPR, SOC2 u otros estándares de seguridad y privacidad |
| `billing-validator` | Al validar lógica de billing, integraciones con Stripe o edge cases en flujos de pago |

---

## Available Skills

Los skills en `.claude/skills/` proveen conocimiento especializado. Invócalos con el Skill tool en el momento adecuado:

### Django / DRF (Backend)
| Skill | Cuándo usarlo |
|-------|--------------|
| `django-db-models` | Diseño de modelos, QuerySets, migrations, índices, JSONField, full-text search, performance ORM |
| `drf-auth` | JWT, login/logout, registro, permissions, tokens, roles, RBAC, custom user models en DRF |
| `drf-core-api` | Serializers, ViewSets, routers, filtering, pagination, response patterns en DRF |
| `drf-docs` | Documentación automática OpenAPI/Swagger con drf-spectacular, SwaggerUI, ReDoc |
| `drf-errors` | Exception handlers, validaciones, error responses, status codes, custom exceptions en DRF |
| `drf-performance` | Caching, query optimization, connection pooling, async views, rate limiting, escalabilidad |
| `drf-security` | OWASP Top 10, CORS, security headers, CSP, autenticación segura en DRF |
| `drf-testing` | APITestCase, factories, mocking, fixtures, pytest-django, coverage en Django |
| `drf-utils` | Management commands, signals, file uploads, email, tareas periódicas en Django |

### React / Vite (Frontend)
| Skill | Cuándo usarlo |
|-------|--------------|
| `react-typescript-foundations` | Types, interfaces, generics, utility types, TypeScript strict mode con React |
| `react-hooks-patterns` | useState, useEffect, useCallback, useMemo, useReducer, custom hooks |
| `react-context-state` | Context API, providers globales, AuthContext, ThemeContext, useReducer |
| `react-forms-validation` | react-hook-form, validación Zod/Yup, error messages, controlled fields |
| `react-tanstack-query` | Data fetching, mutations, cache, optimistic updates, infinite scroll (TanStack Query v5) |
| `react-router-patterns` | React Router v6.4+, nested routes, dynamic routes, protected routes, loaders/actions |
| `react-api-authentication` | JWT, login/logout, refresh tokens, axios interceptors, rutas protegidas |
| `react-tailwind-components` | Componentes UI base (Button, Input, Card, Modal) con Tailwind utility-first |
| `react-tailwind-animations` | Transiciones, Framer Motion, hover effects, keyframes, micro-interacciones |
| `react-error-handling` | Error Boundaries, manejo async, fallback UI, logging de errores |
| `react-performance-optimization` | Re-renders, lazy loading, code splitting, memoización, virtualización |
| `react-suspense-streaming` | React.lazy, Suspense boundaries, concurrent features, skeleton loaders |
| `react-project-structure` | Arquitectura Feature-Sliced Design, organización de módulos, escalabilidad |
| `react-accessibility` | ARIA, HTML semántico, keyboard navigation, focus management, WCAG 2.1 AA |
| `react-internationalization` | react-i18next, traducciones, namespaces, formateo fechas/números, cambio de idioma |
| `react-data-visualization` | Recharts, Visx, LineChart, BarChart, PieChart, dashboards con datos |
| `react-testing-library` | Unit/integration tests de componentes y hooks con Testing Library + Vitest |
| `react-e2e-testing` | Tests E2E con Playwright, Page Object Model, CI/CD de testing |

### Next.js (Full-stack)
| Skill | Cuándo usarlo |
|-------|--------------|
| `nextjs-routing-data` | App Router, layouts, rutas dinámicas, data fetching patterns, search params |
| `nextjs-server-components` | Server vs Client Components, RSC, Server Actions, streaming con Suspense |
| `nextjs-static-generation` | SSG, ISR, `generateStaticParams`, estrategias de caché de páginas |
| `nextjs-seo-optimization` | Metadata API, Open Graph, JSON-LD, sitemap, robots.txt, Core Web Vitals |
| `nextjs-deployment` | Vercel, Docker standalone, CI/CD, variables de entorno, edge functions |

### Tauri (Desktop)
| Skill | Cuándo usarlo |
|-------|--------------|
| `tauri-project-setup` | Configuración inicial Tauri v2, vite.config.ts, tauri.conf.json, Cargo.toml, capacidades |
| `tauri-ipc-patterns` | Comandos Rust con invoke, estado global Mutex, serialización Serde, errores tipados, eventos |
| `tauri-native-integration` | APIs nativas Windows (AppBar Win32, HWND), system tray, ventana sin decoraciones |
| `tauri-react-ui-patterns` | Layout h-screen, PANEL_MAP, drag-to-resize, tooltips, useInvoke, atajos de teclado |

### UI / Design System
| Skill | Cuándo usarlo |
|-------|--------------|
| `ui-design-tokens` | Colores, tipografía, espaciado, sombras, border-radius, dark mode, Tailwind config del proyecto |
| `ui-base-components` | Componentes reutilizables del proyecto (botones, inputs, cards, badges) listos para copiar |
| `ui-layout-system` | Navbar, sidebar, main content, z-index scale, dark mode toggle, responsive patterns |

### Utilidades
| Skill | Cuándo usarlo |
|-------|--------------|
| `vite-react-configuration` | Configuración Vite, optimización de builds, variables de entorno, proxy, plugins |
| `find-skills` | Cuando no sabes qué skill usar o quieres descubrir skills instalables disponibles |
| `skill-creator` | Al crear o actualizar un skill nuevo para extender las capacidades del agente |
