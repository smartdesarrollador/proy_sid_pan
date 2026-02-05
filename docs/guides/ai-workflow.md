# AI-Assisted Development Workflow

## Using Claude Code

This project is configured for Claude Code with:
- `CLAUDE.md` - Project context and conventions
- `.claude/agents/` - Specialized sub-agents
- `.claude/commands/` - Slash commands
- `.claude/skills/` - Domain knowledge
- `.claude/rules/` - Modular instruction sets

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
| `code-reviewer` | Code quality and security review |
| `planner` | Implementation strategy planning |
| `researcher` | Codebase exploration and research |

## Using Other AI Tools

The `AGENTS.md` file provides context for other AI coding tools (Cursor, Copilot, Zed, etc.) following the open standard.

## Prompt Development

1. Define prompts in `config/prompt_templates.yaml`
2. Test prompts in `notebooks/`
3. Integrate into `src/prompts/`
4. Add tests in `tests/`
