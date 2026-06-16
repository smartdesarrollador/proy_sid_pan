# AI-Assisted Development — Configuración de Claude Code

> Para la dinámica paso a paso de cómo implementar una funcionalidad nueva
> (BACKLOG → PRD → plan → código → reporte/ADR), ver
> [feature-development-workflow.md](feature-development-workflow.md) — esa es la
> guía a seguir en el día a día. Este archivo es solo el inventario de configuración
> de Claude Code disponible en el repo.

## Using Claude Code

This project is configured for Claude Code with:
- `CLAUDE.md` - Project context and conventions
- `.claude/agents/` - Specialized sub-agents
- `.claude/commands/` - Slash commands
- `.claude/skills/` - Domain knowledge
- `.claude/rules/` - Modular instruction sets (`agent-orchestration`, `ai-development`, `code-style`, `security`)

### Available Commands

| Command | Description |
|---------|-------------|
| `/onboard` | Get a project overview |
| `/create-prd` | Create a Product Requirement Document |
| `/generate-report` | Generate project status report |
| `/pr-review` | Review current branch changes |

### Available Agents

| Agent | Purpose |
|-------|---------|
| `planner` | Implementation strategy planning |
| `researcher` | Codebase exploration and research |
| `react-vite-builder` | Frontend Admin / Workspace (React + Vite) |
| `nextjs-builder` | Hub / Vista (Next.js App Router) |
| `tauri-desktop-builder` | Desktop (Tauri v2 + React) |
| `code-reviewer` | Code quality and security review |
| `security-auditor` | Security audit, multi-tenant isolation |
| `test-generator` | Unit/integration tests + coverage |
| `database-optimizer` | Query/index optimization |
| `migration-manager` | Django migrations (siempre solo, ver `agent-orchestration.md`) |
| `billing-validator` | Lógica de billing y edge cases de pagos |
| `compliance-checker` | GDPR/SOC2/estándares de seguridad |
| `api-documenter` | Documentación OpenAPI/Swagger |
| `ui-ux-designer` | Diseño UI/UX, Tailwind, design system |

Reglas de orquestación (cuándo correr en paralelo, cuándo secuencial) en
`.claude/rules/agent-orchestration.md`.

## Using Other AI Tools

The `AGENTS.md` file provides context for other AI coding tools (Cursor, Copilot, Zed, etc.) following the open standard.
