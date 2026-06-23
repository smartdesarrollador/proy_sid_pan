#!/usr/bin/env bash
# Hook: Auto-consulta la base de conocimiento de incidencias (skill lessons-learned).
# Evento: UserPromptSubmit. Cuando el prompt del usuario parece reportar un bug, error o
# comportamiento roto, inyecta la tabla de contenidos de la base de conocimiento + la
# instrucción de consultarla (grep) ANTES de depurar, y de registrar la lección DESPUÉS.
#
# Mecanismo: para UserPromptSubmit, lo que el hook imprime en stdout (exit 0) se agrega al
# contexto de Claude. Solo inyecta una vez por sesión (anti-ruido) — el texto inyectado
# permanece en el contexto el resto de la conversación.
#
# No depende de jq: hace match del trigger contra el JSON crudo (el prompt va embebido) y
# extrae el session_id con sed. Así funciona aunque jq no esté instalado.

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Leer JSON del evento desde stdin
# ---------------------------------------------------------------------------
INPUT_JSON=""
if [ -t 0 ]; then
  INPUT_JSON="{}"
else
  INPUT_JSON="$(cat)"
fi

# ---------------------------------------------------------------------------
# 2. Directorio del proyecto y ruta de la base de conocimiento
# ---------------------------------------------------------------------------
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
KB="$PROJECT_DIR/.claude/skills/lessons-learned/references/knowledge-base.md"
[ -f "$KB" ] || exit 0

# ---------------------------------------------------------------------------
# 3. ¿El prompt huele a bug / error / depuración?
#    Match case-insensitive (es/en + códigos HTTP) contra el JSON crudo del evento;
#    el texto del prompt va dentro, y los nombres de campo ("prompt","session_id") no
#    contienen estas palabras, así que no hay falsos positivos por la estructura.
# ---------------------------------------------------------------------------
TRIGGER_RE='error|errores|bug|falla|fallo|fallando|fall[oó]|no funciona|not working|no carga|no aparece|no muestra|no guarda|no responde|roto|rota|broken|crash|excepc|exception|traceback|stack ?trace|depura|debug|arregla|arreglar|fix|corrige|corregir|incidencia|problema|failed to fetch|cors|timeout|undefined|no jala|se cae|se rompe|405|404|403|401|400|415|410|500|502|503|disallowedhost|econnrefused|append_?slash|trailing slash|x-tenant|next_public|dokploy'

if ! printf '%s' "$INPUT_JSON" | grep -qiE "$TRIGGER_RE"; then
  exit 0
fi

# ---------------------------------------------------------------------------
# 4. Anti-ruido: inyectar solo una vez por sesión
# ---------------------------------------------------------------------------
SESSION_ID=$(printf '%s' "$INPUT_JSON" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
[ -n "$SESSION_ID" ] || SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
LOCK_FILE="/tmp/claude-lessons-learned-${SESSION_ID}"
[ -f "$LOCK_FILE" ] && exit 0
touch "$LOCK_FILE" 2>/dev/null || true

# ---------------------------------------------------------------------------
# 5. Extraer la tabla de contenidos de la base de conocimiento
# ---------------------------------------------------------------------------
TOC=$(awk '/^## Tabla de contenidos/{f=1;next} f&&/^---/{exit} f&&/^- /{print}' "$KB" || true)

# ---------------------------------------------------------------------------
# 6. Inyectar contexto (stdout en exit 0 -> contexto de Claude)
# ---------------------------------------------------------------------------
cat <<CONTEXT
[Hook lessons-learned] El mensaje parece reportar un bug/error. ANTES de depurar desde cero,
consulta la base de conocimiento de incidencias del proyecto — es muy probable que algo igual
o similar ya se haya resuelto. Categorías disponibles:

${TOC}

Pasos:
1. Haz grep por el síntoma o el tag en:
   .claude/skills/lessons-learned/references/knowledge-base.md
   Ej: grep -niE "404|trailing slash|cors|next_public|x-tenant" .claude/skills/lessons-learned/references/knowledge-base.md
2. Si hay una entrada que coincide (LL-0XX), aplica su solución/prevención y cítala al usuario.
3. Recuerda: en este proyecto casi todo 404/405/308/500 de routing es trailing slash (sección A).
4. DESPUÉS de resolver, si fue un problema no trivial, registra la lección con el skill
   lessons-learned (operación REGISTRAR) para que no se repita.
CONTEXT

exit 0
