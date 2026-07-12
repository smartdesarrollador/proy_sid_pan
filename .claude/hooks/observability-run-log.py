#!/usr/bin/env python3
"""Hook de observability del agente (evento Stop).

Lee el transcript de la sesión, extrae señales de lo que hizo el agente (skills/tools usados,
si consultó lessons-learned, archivos tocados, si corrió tests) y las registra en
`evals/observations/`:

  - runs.jsonl : fuente de verdad, 1 objeto JSON por sesión (upsert por session_id)
  - runs.md    : vista humana regenerada desde runs.jsonl en cada Stop

No depende de jq (parsea JSON con la stdlib de Python). Es robusto: ante cualquier error o si falta
`transcript_path`, sale 0 silenciosamente para nunca bloquear al agente. Solo escribe archivos y no
emite stderr/decisión, por lo que no provoca loops.
"""

import json
import os
import re
import sys
from datetime import datetime

TEST_RE = re.compile(
    r"\b(make\s+test|npm\s+(run\s+)?(test|typecheck|build)|pytest|vitest|ruff|mypy|coverage)\b"
)
LL_RE = re.compile(r"knowledge-base\.md|lessons-learned", re.IGNORECASE)
PASS_RE = re.compile(r"\b(\d+\s+passed|passing|all tests pass|0 fail),?", re.IGNORECASE)
FAIL_RE = re.compile(r"\b(failed|failing|error|exit code [1-9]|✗)\b", re.IGNORECASE)


def _iter_records(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue


def _stringify(value):
    """Devuelve una representación de texto del input de una tool para buscar substrings."""
    try:
        if isinstance(value, str):
            return value
        return json.dumps(value, ensure_ascii=False)
    except Exception:
        return ""


def parse_transcript(path, cwd):
    skills = []
    tools = {}
    files = set()
    ll_consulted = False
    tests_run = False
    tests_signal = "unknown"

    for obj in _iter_records(path):
        if obj.get("type") != "assistant":
            continue
        msg = obj.get("message")
        if not isinstance(msg, dict):
            continue
        for blk in msg.get("content") or []:
            if not (isinstance(blk, dict) and blk.get("type") == "tool_use"):
                continue
            name = blk.get("name", "?")
            tools[name] = tools.get(name, 0) + 1
            inp = blk.get("input") or {}

            if name == "Skill":
                sk = inp.get("skill") or inp.get("command") or "?"
                skills.append(sk)
                if isinstance(sk, str) and "lessons-learned" in sk:
                    ll_consulted = True

            if name in ("Edit", "Write", "NotebookEdit"):
                fp = inp.get("file_path")
                if fp:
                    files.add(fp)

            if name == "Bash":
                cmd = inp.get("command", "") or ""
                if TEST_RE.search(cmd):
                    tests_run = True
                if LL_RE.search(cmd):
                    ll_consulted = True

            # lessons-learned también cuenta si se leyó/grepeó la KB con cualquier tool
            if not ll_consulted and LL_RE.search(_stringify(inp)):
                ll_consulted = True

    # Heurística best-effort de pass/fail sobre los resultados de tools (texto del transcript)
    if tests_run:
        joined = ""
        try:
            for obj in _iter_records(path):
                if obj.get("type") == "user":
                    msg = obj.get("message")
                    if isinstance(msg, dict):
                        for blk in msg.get("content") or []:
                            if isinstance(blk, dict) and blk.get("type") == "tool_result":
                                joined += " " + _stringify(blk.get("content"))
        except Exception:
            joined = ""
        if FAIL_RE.search(joined) and not PASS_RE.search(joined):
            tests_signal = "fail"
        elif PASS_RE.search(joined):
            tests_signal = "pass"

    # Dirs de primer nivel relativos al repo (señal compacta de "dónde trabajó")
    top_dirs = set()
    for fp in files:
        rel = fp
        if cwd and fp.startswith(cwd):
            rel = fp[len(cwd):].lstrip("/")
        parts = rel.split("/")
        top_dirs.add("/".join(parts[:3]) if len(parts) >= 3 else "/".join(parts[:2]) or rel)

    return {
        "skills": skills,
        "tools": tools,
        "lessons_learned_consulted": ll_consulted,
        "files_touched": len(files),
        "files_dirs": sorted(top_dirs)[:8],
        "tests_run": tests_run,
        "tests_signal": tests_signal,
    }


def upsert_jsonl(jsonl_path, record):
    rows = []
    if os.path.exists(jsonl_path):
        for obj in _iter_records(jsonl_path):
            if obj.get("session_id") != record["session_id"]:
                rows.append(obj)
    rows.append(record)
    # ordenar por timestamp para una vista estable
    rows.sort(key=lambda r: r.get("timestamp", ""))
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return rows


def render_md(rows):
    lines = [
        "# Observability — traza de sesiones del agente",
        "",
        "Generado automáticamente por `.claude/hooks/observability-run-log.py` (evento Stop).",
        "Una entrada por sesión. Ver [README.md](README.md) para el significado de cada señal.",
        "",
    ]
    for r in reversed(rows):  # más reciente primero
        skills = ", ".join(r.get("skills") or []) or "—"
        tools = r.get("tools") or {}
        tools_str = ", ".join(f"{k}({v})" for k, v in sorted(tools.items(), key=lambda x: -x[1])) or "—"
        ll = "✅ consultado" if r.get("lessons_learned_consulted") else "❌ no consultado"
        tr = r.get("tests_run")
        tsig = r.get("tests_signal", "unknown")
        tests_str = (f"sí ({tsig})" if tr else "no")
        dirs = ", ".join(r.get("files_dirs") or []) or "—"

        lines.append(f"## {r.get('timestamp','?')} · `{r.get('session_id','?')[:8]}`")
        lines.append(f"- **skills:** {skills}")
        lines.append(f"- **tools:** {tools_str}")
        lines.append(f"- **lessons-learned:** {ll}")
        lines.append(f"- **archivos:** {r.get('files_touched',0)} ({dirs})")
        lines.append(f"- **tests:** {tests_str}")

        signal = _signal(r)
        if signal:
            lines.append(f"- **→ Señal:** {signal}")
        lines.append("")
    return "\n".join(lines) + "\n"


def _signal(r):
    """Heurística simple para resaltar algo que merezca atención en una sesión."""
    notes = []
    skills = r.get("skills") or []
    dirs = r.get("files_dirs") or []
    touched_code = any(d.startswith((".claude/skills", "src/", "apps/")) for d in dirs)
    if touched_code and r.get("files_touched", 0) > 0 and not r.get("lessons_learned_consulted"):
        notes.append("tocó código pero no consultó la KB de incidencias")
    if r.get("tests_signal") == "fail":
        notes.append("tests con señal de fallo")
    if touched_code and not r.get("tests_run"):
        notes.append("editó código sin correr tests/build")
    return "; ".join(notes)


def main():
    try:
        raw = sys.stdin.read() if not sys.stdin.isatty() else "{}"
        data = json.loads(raw or "{}")
    except Exception:
        return 0

    if data.get("stop_hook_active") is True:
        return 0

    transcript = data.get("transcript_path")
    if not transcript or not os.path.exists(transcript):
        return 0

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    cwd = data.get("cwd") or project_dir
    session_id = data.get("session_id") or "unknown"

    out_dir = os.path.join(project_dir, "evals", "observations")
    try:
        os.makedirs(out_dir, exist_ok=True)
        signals = parse_transcript(transcript, cwd)
        record = {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "session_id": session_id,
            "cwd": cwd,
            **signals,
        }
        rows = upsert_jsonl(os.path.join(out_dir, "runs.jsonl"), record)
        with open(os.path.join(out_dir, "runs.md"), "w", encoding="utf-8") as f:
            f.write(render_md(rows))
    except Exception:
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
