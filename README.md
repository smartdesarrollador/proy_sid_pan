# proy_sidebar_panel

Proyecto de desarrollo de software con soporte avanzado para agentes de IA (Claude Code), documentacion de producto y arquitectura multi-app.

## Estructura del Proyecto

```
.
├── apps/
│   └── backend_django             # App backend Django (en preparacion)
│
├── docs/                          # Documentacion tecnica
│   ├── adr/                       #   Architecture Decision Records
│   │   ├── 001-project-structure.md
│   │   └── 002-auto-documentation-hook.md
│   ├── api/                       #   Referencia de APIs
│   ├── architecture/              #   Diseno del sistema
│   │   ├── system-overview.md
│   │   ├── frontend-architecture.md
│   │   ├── data-architecture.md
│   │   ├── infrastructure.md
│   │   ├── multi-tenancy.md
│   │   ├── rbac.md
│   │   └── security.md
│   ├── diagrams/                  #   Diagramas de arquitectura
│   ├── guides/                    #   Guias de desarrollo
│   │   ├── getting-started.md
│   │   ├── ai-workflow.md
│   │   └── project-structure.md
│   ├── runbooks/                  #   Runbooks operacionales
│   └── ui-ux/                    #   Diseno UI/UX y prototipos
│       ├── prototype-admin/      #     Panel administrativo (roles, usuarios, billing) :3000
│       ├── prototype-hub-client/        #     Portal central del cliente (registro, suscripción, SSO) :3003
│       ├── prototype-workspace/  #     App de productividad independiente (acceso via SSO) :3001
│       ├── prototype-desktop/    #     App de escritorio (Tauri v2)
│       └── prototype-vista/      #     Servicios digitales publicos (Next.js)
│
├── prd/                           # Product Requirements Documents
│   ├── features/                  #   PRDs por feature
│   │   ├── billing.md
│   │   ├── analytics.md
│   │   ├── desktop-app.md
│   │   ├── projects.md
│   │   └── ...
│   ├── requirements/              #   Requisitos del sistema
│   │   ├── functional-requirements.md
│   │   ├── use-cases.md
│   │   └── user-stories.md
│   └── technical/                 #   Decisiones tecnicas
│       ├── architecture.md
│       ├── data-models.md
│       ├── api-endpoints.md
│       ├── rbac-roles-permissions.md
│       └── implementation-timeline.md
│
├── plans/                         # Planes de implementacion
├── reports/                       # Reportes generados
├── util/
│   └── capturas/                  # Capturas de pantalla
│
├── .claude/                       # Configuracion Claude Code
│   ├── agents/                    #   13 agentes especializados
│   │   ├── api-documenter.md
│   │   ├── code-reviewer.md
│   │   ├── database-optimizer.md
│   │   ├── migration-manager.md
│   │   ├── security-auditor.md
│   │   ├── tauri-desktop-builder.md
│   │   ├── test-generator.md
│   │   └── ...
│   ├── commands/                  #   Comandos custom
│   │   ├── create-prd
│   │   ├── generate-report
│   │   ├── onboard
│   │   └── pr-review
│   ├── hooks/                     #   Automatizacion de eventos
│   │   ├── detect-doc-changes.sh
│   │   ├── sync-claude-md.sh
│   │   └── task-finished-alert.py
│   ├── rules/                     #   Reglas de desarrollo
│   │   ├── ai-development.md
│   │   ├── code-style.md
│   │   └── security.md
│   └── skills/                    #   42 skills especializados
│       ├── django-db-models/
│       ├── drf-*/                 #   Django REST Framework
│       ├── react-*/               #   React + TypeScript
│       ├── nextjs-*/              #   Next.js
│       ├── tauri-*/               #   Tauri desktop
│       └── ui-*/                  #   UI/UX components
│
├── .github/workflows/             # CI/CD pipelines
│
├── CLAUDE.md                      # Configuracion principal del agente
├── AGENTS.md                      # Estandar abierto de agentes
├── pyproject.toml                 # Dependencias y configuracion de herramientas
├── Makefile                       # Automatizacion de tareas
├── Dockerfile                     # Definicion del contenedor
└── docker-compose.yml             # Orquestacion de servicios
```

## Comandos de Desarrollo

```bash
make help          # Ver todos los comandos disponibles
make dev           # Iniciar servidor de desarrollo
make test          # Ejecutar suite de tests
make lint          # Ejecutar linters (ruff)
make format        # Formatear codigo
make typecheck     # Verificar tipos (mypy)
make docker-up     # Iniciar servicios Docker
make docker-down   # Detener servicios Docker
```

## Agentes Disponibles

El proyecto incluye agentes especializados de Claude Code para tareas comunes:

| Agente                  | Descripcion                          |
| ----------------------- | ------------------------------------ |
| `migration-manager`     | Gestiona migraciones Django          |
| `database-optimizer`    | Optimiza queries y sugiere indices   |
| `code-reviewer`         | Revision de calidad y seguridad      |
| `security-auditor`      | Auditoria de vulnerabilidades        |
| `test-generator`        | Genera tests unitarios e integracion |
| `api-documenter`        | Genera documentacion OpenAPI         |
| `tauri-desktop-builder` | Builds de apps desktop con Tauri v2  |
| `ui-ux-designer`        | Diseno de interfaces y componentes   |

## Documentacion

- [Arquitectura del Sistema](docs/architecture/system-overview.md)
- [Guia de Inicio](docs/guides/getting-started.md)
- [Flujo de Trabajo con IA](docs/guides/ai-workflow.md)
- [ADRs](docs/adr/)
- [UI/UX y Prototipos](docs/ui-ux/)

## Contribuir

1. Crear rama desde `main`
2. Escribir un PRD en `prd/features/` para features significativos
3. Seguir las reglas en `.claude/rules/`
4. Verificar que `make test && make lint` pasa
5. Abrir un pull request
