# AGENTS.md - Agent Configuration (Open Standard)

This file follows the [AGENTS.md](https://agents.md/) open standard for guiding AI coding agents.

## Project Context

- **Name**: proy_temp
- **Description**: AI/ML Development Project
- **Primary Language**: Python 3.11+
- **Framework**: FastAPI + LLM integrations

## Coding Standards

- Use type hints for all function signatures
- Prefer Pydantic models or dataclasses over raw dicts
- Use async/await for I/O-bound operations
- Keep functions under 50 lines
- Prefer composition over inheritance
- Define prompts in config files, not inline

## Directory Structure

```
├── CLAUDE.md              # Claude Code project memory
├── AGENTS.md              # Open standard agent config (this file)
├── README.md              # Project documentation
├── pyproject.toml         # Dependencies and tool config
├── Makefile               # Task automation
├── Dockerfile             # Container definition
├── docker-compose.yml     # Service orchestration
├── .env.example           # Environment variable template
├── .editorconfig          # Editor consistency
├── .pre-commit-config.yaml # Git hooks for code quality
├── .gitignore             # Git ignore rules
│
├── src/                   # Source code
│   ├── agents/            #   AI agent definitions
│   ├── llm/               #   LLM provider clients
│   ├── prompts/           #   Prompt engineering
│   ├── tools/             #   Agent tools
│   ├── pipelines/         #   Data/AI pipelines
│   ├── api/               #   REST endpoints
│   └── utils/             #   Shared utilities
│
├── tests/                 # Test suite
├── config/                # Configuration files
│   ├── model_config.yaml  #   Model settings
│   ├── prompt_templates.yaml # Prompt patterns
│   └── logging_config.yaml   # Logging setup
│
├── data/                  # Data artifacts (gitignored)
│   ├── raw/               #   Raw input data
│   ├── processed/         #   Processed data
│   ├── cache/             #   API response cache
│   └── embeddings/        #   Vector embeddings
│
├── notebooks/             # Jupyter notebooks for experimentation
├── schemas/               # JSON schemas and data models
├── scripts/               # Automation scripts
├── prd/                   # Product Requirement Documents
├── reports/               # Generated reports
│
├── docs/                  # Documentation
│   ├── architecture/      #   System design
│   ├── guides/            #   How-to guides
│   ├── api/               #   API documentation
│   ├── adr/               #   Architecture Decision Records
│   └── runbooks/          #   Operational runbooks
│
├── .claude/               # Claude Code configuration
│   ├── agents/            #   Custom AI agents
│   ├── commands/          #   Slash commands
│   ├── skills/            #   Domain knowledge
│   ├── rules/             #   Modular instructions
│   └── hooks/             #   Automation hooks
│
├── .agent/                # Standardized agent context
│   ├── spec/              #   Requirements and tasks
│   ├── wiki/              #   Architecture docs
│   └── links/             #   External resources
│
└── .github/
    └── workflows/         # CI/CD pipelines
```

## Task Execution Rules

1. Read relevant files before making changes
2. Run tests after modifications (`make test`)
3. Follow conventional commits format
4. Document non-obvious decisions
5. Define prompts in config, not inline in code
6. Never hardcode secrets - use environment variables

## Available Commands

See `.claude/commands/` for available slash commands:
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
| `react-vite-builder` | Al desarrollar aplicaciones frontend con React + Vite + TypeScript + Tailwind CSS |
| `nextjs-builder` | Al desarrollar aplicaciones full-stack con Next.js + TypeScript + Tailwind CSS (App Router) |
| `tauri-desktop-builder` | Al desarrollar apps de escritorio con Tauri v2 + React + Vite + TypeScript + Tailwind CSS |
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
