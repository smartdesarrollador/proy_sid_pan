# .claude/ - Claude Code Configuration

## Structure

```
.claude/
├── settings.json          # Hooks, environment vars, permissions
├── settings.local.json    # Personal overrides (gitignored)
├── agents/                # Custom AI agent definitions
│   └── *.md               # One file per agent
├── commands/              # Slash commands (user-triggered)
│   └── *.md               # One file per command
├── hooks/                 # Automation scripts
│   └── *.sh / *.js        # Hook scripts
├── skills/                # Domain knowledge modules
│   └── <skill-name>/
│       └── SKILL.md       # Skill definition with frontmatter
└── rules/                 # Modular instruction sets
    └── *.md               # One file per rule set
```

## Agents

Agents are specialized AI assistants that run in isolated context. Define them as markdown files in `agents/`. They receive their own tools and instructions.

## Commands

Slash commands are user-triggered workflows invoked via `/<command-name>`. Each `.md` file in `commands/` becomes an available command.

## Skills

Skills are domain knowledge documents. Each skill has a `SKILL.md` with YAML frontmatter including a `description` field. Claude uses this description to decide when to apply the skill automatically.

## Rules

Rules are modular instruction files that extend CLAUDE.md. Use them to separate concerns (code style, security, testing).

| File | Purpose |
|------|---------|
| `code-style.md` | Type hints, formatting, import order, function length |
| `security.md` | Secrets, input validation, logging, API timeouts |
| `ai-development.md` | Prompt templates, LLM retries, token budgets, caching |
| `agent-orchestration.md` | When/how to run agents: parallel groups, sequential chains, flow by task type |

## Hooks

Hooks are shell scripts that run in response to Claude Code events (tool calls, messages). Configure them in `settings.json`.
