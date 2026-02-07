# Guia de Estructura del Proyecto

Esta guia explica el proposito de cada directorio y archivo importante del proyecto.
Sirve como referencia para nuevos desarrolladores y agentes de IA que trabajen en el codigo.

---

## Vista General

```
proy_temp/
│
├── src/                        # Codigo fuente principal
├── tests/                      # Suite de pruebas
├── config/                     # Archivos de configuracion
├── data/                       # Datos y artefactos (no se sube a git)
├── notebooks/                  # Experimentacion con Jupyter
├── schemas/                    # Esquemas de datos y APIs
├── scripts/                    # Scripts de automatizacion
├── docs/                       # Documentacion del proyecto
├── prd/                        # Documentos de requerimientos de producto
├── reports/                    # Reportes generados
├── logs/                       # Archivos de log (no se sube a git)
│
├── .claude/                    # Configuracion de Claude Code
├── .agent/                     # Contexto para agentes IA (estandar abierto)
├── .github/                    # Configuracion de GitHub (CI/CD)
│
├── CLAUDE.md                   # Memoria del proyecto para Claude
├── AGENTS.md                   # Configuracion abierta para agentes IA
├── README.md                   # Documentacion principal
├── pyproject.toml              # Dependencias y configuracion de herramientas
├── Makefile                    # Automatizacion de tareas
├── Dockerfile                  # Definicion del contenedor
├── docker-compose.yml          # Orquestacion de servicios
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Reglas de exclusion para git
├── .editorconfig               # Formato consistente entre editores
└── .pre-commit-config.yaml     # Hooks de calidad de codigo
```

---

## Directorios

### `src/` - Codigo Fuente

El directorio principal donde vive toda la logica del proyecto. Esta organizado por
responsabilidad, siguiendo el principio de separacion de concerns.

```
src/
├── __init__.py          # Marca src como paquete Python
├── agents/              # Definiciones de agentes IA
├── llm/                 # Clientes para modelos de lenguaje
├── prompts/             # Ingenieria de prompts
├── tools/               # Herramientas para agentes
├── pipelines/           # Pipelines de datos e IA
├── api/                 # Endpoints REST/WebSocket
└── utils/               # Utilidades compartidas
```

| Subdirectorio | Que guardar aqui | Ejemplos |
|---|---|---|
| `agents/` | Clases y funciones que definen agentes autonomos de IA, su comportamiento, orquestacion y gestion de contexto | `research_agent.py`, `assistant_agent.py` |
| `llm/` | Clientes que abstraen la comunicacion con proveedores de LLM. Cada proveedor tiene su propio modulo | `claude_client.py`, `openai_client.py`, `ollama_client.py`, `base.py` |
| `prompts/` | Templates de prompts, cadenas de prompts (chains), ejemplos few-shot y logica de construccion de prompts | `templates.py`, `few_shot.py`, `chains.py` |
| `tools/` | Herramientas que los agentes pueden invocar para interactuar con sistemas externos | `search_tool.py`, `calculator.py`, `api_caller.py` |
| `pipelines/` | Flujos de trabajo de procesamiento de datos y pipelines de IA como RAG, ETL o evaluacion | `rag_pipeline.py`, `evaluation_pipeline.py`, `data_processor.py` |
| `api/` | Endpoints HTTP y WebSocket para exponer la funcionalidad del proyecto como servicio | `routes.py`, `middleware.py`, `schemas.py` |
| `utils/` | Funciones auxiliares compartidas entre multiples modulos | `rate_limiter.py`, `token_counter.py`, `cache.py`, `logger.py` |

---

### `tests/` - Suite de Pruebas

Contiene todas las pruebas automatizadas del proyecto. Usa pytest como framework.

```
tests/
├── __init__.py          # Marca tests como paquete
└── conftest.py          # Fixtures compartidos entre tests
```

| Que guardar aqui | Ejemplos |
|---|---|
| Tests unitarios para cada modulo de `src/` | `test_claude_client.py`, `test_rag_pipeline.py` |
| Tests de integracion entre componentes | `test_agent_with_tools.py` |
| Fixtures y datos de prueba compartidos | `conftest.py`, `fixtures/sample_data.json` |

**Convenciones:**
- Archivos de test: `test_*.py`
- Funciones de test: `test_*`
- Nombres descriptivos: `test_should_retry_when_rate_limited`

---

### `config/` - Configuracion

Archivos de configuracion externalizados del codigo. Permite cambiar el comportamiento
del proyecto sin modificar codigo fuente.

```
config/
├── model_config.yaml         # Configuracion de modelos LLM
├── prompt_templates.yaml     # Plantillas de prompts reutilizables
└── logging_config.yaml       # Configuracion de logging
```

| Archivo | Para que sirve |
|---|---|
| `model_config.yaml` | Define los modelos disponibles (Claude, GPT, Ollama), sus parametros (temperatura, max_tokens), limites de tasa y configuracion de reintentos |
| `prompt_templates.yaml` | Almacena prompts reutilizables con variables. Permite versionar prompts junto con el codigo sin mezclarlos en la logica |
| `logging_config.yaml` | Configura niveles de log, formatos, rotacion de archivos y handlers para consola y archivo |

**Regla importante:** Los prompts siempre van aqui, nunca hardcodeados en el codigo fuente.

---

### `data/` - Datos y Artefactos

Almacena todos los datos del proyecto. **No se sube a GitHub** (excluido por `.gitignore`)
porque los datos pueden ser pesados o sensibles. Solo los `.gitkeep` se versionan para
preservar la estructura de directorios.

```
data/
├── raw/                 # Datos crudos sin procesar
├── processed/           # Datos ya procesados y listos para usar
├── cache/               # Cache de respuestas de APIs
└── embeddings/          # Vectores/embeddings generados
```

| Subdirectorio | Que guardar aqui | Ejemplos |
|---|---|---|
| `raw/` | Datos originales tal como se obtienen de la fuente. Nunca modificar estos archivos | CSVs descargados, JSONs de APIs, documentos PDF |
| `processed/` | Datos limpios y transformados, listos para usar en el proyecto | Datasets filtrados, textos preprocesados |
| `cache/` | Respuestas cacheadas de APIs de LLM para evitar llamadas repetidas y reducir costos | Respuestas JSON, resultados de busqueda |
| `embeddings/` | Representaciones vectoriales de texto generadas por modelos de embedding | Archivos `.faiss`, `.npy`, indices vectoriales |

---

### `notebooks/` - Experimentacion

Espacio para Jupyter Notebooks donde se experimenta con modelos, datos y prompts
de forma interactiva antes de integrar al codigo principal.

| Que guardar aqui | Ejemplos |
|---|---|
| Exploracion de datos | `data_exploration.ipynb` |
| Pruebas de prompts | `prompt_testing.ipynb` |
| Prototipado de features | `rag_prototype.ipynb` |
| Analisis de resultados | `model_comparison.ipynb` |

**Regla:** Los notebooks son para experimentar. El codigo definitivo siempre debe
moverse a `src/`.

---

### `schemas/` - Esquemas de Datos

Define la estructura formal de los datos que maneja el proyecto: requests, responses,
modelos de base de datos, etc.

| Que guardar aqui | Ejemplos |
|---|---|
| Esquemas JSON Schema para validacion | `api_schema.json` |
| Definiciones de modelos de datos | `user_model.json`, `conversation_schema.json` |
| Esquemas de base de datos | `db_schema.sql` |
| Contratos de API | `openapi_spec.yaml` |

---

### `scripts/` - Automatizacion

Scripts de shell o Python para tareas operativas que no son parte de la logica
del negocio.

```
scripts/
├── setup.sh             # Inicializacion completa del proyecto
└── eval.sh              # Ejecutar evaluaciones de prompts/modelos
```

| Que guardar aqui | Ejemplos |
|---|---|
| Scripts de setup e instalacion | `setup.sh` |
| Scripts de migracion de datos | `migrate_db.sh` |
| Scripts de evaluacion y benchmarks | `eval.sh`, `benchmark.py` |
| Scripts de deployment | `deploy.sh` |
| Tareas de mantenimiento | `cleanup.sh`, `rotate_keys.sh` |

---

### `docs/` - Documentacion

Toda la documentacion del proyecto organizada por tipo.

```
docs/
├── architecture/        # Diseno del sistema
├── guides/              # Guias practicas
├── api/                 # Documentacion de API
├── adr/                 # Registros de Decisiones Arquitectonicas
└── runbooks/            # Procedimientos operativos
```

| Subdirectorio | Que guardar aqui | Ejemplos |
|---|---|---|
| `architecture/` | Diagramas y documentos que explican como esta disenado el sistema, flujos de datos y componentes | `system-overview.md` |
| `guides/` | Guias paso a paso para desarrolladores: como empezar, como contribuir, como usar herramientas | `getting-started.md`, `ai-workflow.md`, `project-structure.md` |
| `api/` | Documentacion de endpoints REST, parametros, ejemplos de request/response | `README.md` (referencia a Swagger auto-generado) |
| `adr/` | Registro formal de decisiones tecnicas importantes: que se decidio, por que y que alternativas se consideraron | `001-project-structure.md` |
| `runbooks/` | Procedimientos operativos paso a paso para deploy, rollback, incidentes y mantenimiento | `deployment.md` |

---

### `prd/` - Documentos de Requerimientos de Producto

Aqui se documentan las features antes de implementarlas. Cada PRD define el que y
por que de una funcionalidad.

| Que guardar aqui | Ejemplos |
|---|---|
| PRDs de features nuevas | `prd-user-auth.md`, `prd-rag-search.md` |
| Especificaciones de mejoras | `prd-performance-optimization.md` |

**Formato sugerido:** Overview, Goals, User Stories, Requirements, Technical Approach,
Phases, Out of Scope. Se puede generar con el comando `/create-prd`.

---

### `reports/` - Reportes Generados

Almacena reportes de estado, analisis y metricas generados automatica o manualmente.

| Que guardar aqui | Ejemplos |
|---|---|
| Reportes de estado del proyecto | `2026-02-05-status-report.md` |
| Resultados de evaluaciones | `eval-results-v1.md` |
| Analisis de cobertura de tests | `coverage-report.md` |
| Auditorias de tech debt | `tech-debt-audit.md` |

---

### `logs/` - Archivos de Log

Directorio para logs generados en runtime. **No se sube a GitHub.**

| Que guardar aqui | Ejemplos |
|---|---|
| Logs de aplicacion | `app.log` |
| Logs de llamadas a LLM | `llm-calls.log` |
| Logs de errores | `error.log` |

---

### `.claude/` - Configuracion de Claude Code

Configuracion especifica para el agente de IA Claude Code. Define como el agente
interactua con el proyecto.

```
.claude/
├── README.md                    # Referencia de configuracion
├── settings.local.json          # Config personal (NO subir a git)
├── agents/                      # Agentes especializados
├── commands/                    # Comandos slash
├── skills/                      # Modulos de conocimiento
├── rules/                       # Reglas modulares
└── hooks/                       # Scripts de automatizacion
```

| Subdirectorio | Que guardar aqui | Como funciona |
|---|---|---|
| `agents/` | Definiciones de sub-agentes con nombre, herramientas y comportamiento. Cada `.md` es un agente | `code-reviewer.md` revisa codigo, `planner.md` planifica, `researcher.md` investiga |
| `commands/` | Comandos invocados con `/nombre`. Cada `.md` define un flujo de trabajo | `/onboard` analiza el proyecto, `/create-prd` genera PRDs, `/pr-review` revisa PRs |
| `skills/` | Conocimiento de dominio que Claude aplica automaticamente segun la tarea. Cada skill tiene su propia carpeta con `SKILL.md` | `code-review/` para revisiones, `debugging/` para depuracion, `testing-patterns/` para tests |
| `rules/` | Instrucciones modulares que extienden CLAUDE.md. Se aplican siempre como reglas del proyecto | `code-style.md` estilo, `security.md` seguridad, `ai-development.md` reglas IA |
| `hooks/` | Scripts shell/JS que se ejecutan en respuesta a eventos de Claude Code (antes/despues de tool calls) | `pre-commit-check.sh`, `post-edit-lint.sh` |

**`settings.local.json`:** Configuracion personal (permisos, dominios permitidos).
Cada desarrollador tiene el suyo. **Nunca se sube a git.**

---

### `.agent/` - Contexto de Agente (Estandar Abierto)

Sigue el estandar abierto para dar contexto a cualquier agente de IA (Cursor,
Copilot, Zed, etc.), no solo Claude.

```
.agent/
├── spec/                # Especificaciones y requerimientos
├── wiki/                # Documentacion interna del dominio
└── links/               # Enlaces a recursos externos
```

| Subdirectorio | Que guardar aqui | Ejemplos |
|---|---|---|
| `spec/` | Requerimientos funcionales y no funcionales, tareas pendientes, restricciones tecnicas | `requirements.md` |
| `wiki/` | Glosario de terminos del dominio, explicaciones de arquitectura, convenciones del equipo | `glossary.md` |
| `links/` | URLs a documentacion externa, APIs de terceros, herramientas y recursos de aprendizaje | `resources.md` |

---

### `.github/` - Configuracion de GitHub

Configuracion especifica de GitHub: pipelines CI/CD, templates de issues/PRs, etc.

```
.github/
└── workflows/
    └── ci.yml           # Pipeline de integracion continua
```

| Que guardar aqui | Ejemplos |
|---|---|
| Workflows de CI/CD | `ci.yml`, `deploy.yml`, `release.yml` |
| Templates de issues | `ISSUE_TEMPLATE/bug_report.md` |
| Templates de pull requests | `pull_request_template.md` |
| Configuracion de Dependabot | `dependabot.yml` |

---

## Archivos Importantes

### Archivos de Identidad del Proyecto

| Archivo | Proposito | Quien lo lee |
|---|---|---|
| `README.md` | Documentacion principal: que es el proyecto, como instalarlo, como usarlo. Es la primera impresion del repositorio | Humanos, GitHub |
| `CLAUDE.md` | Memoria del proyecto para Claude Code. Define stack, comandos, estructura, convenciones y reglas. Se carga automaticamente en cada sesion | Claude Code |
| `AGENTS.md` | Estandar abierto que da contexto a cualquier agente IA. Similar a CLAUDE.md pero compatible con Cursor, Copilot, Zed, etc. | Todos los agentes IA |

---

### Archivos de Dependencias y Build

| Archivo | Proposito |
|---|---|
| `pyproject.toml` | **Archivo central de Python moderno.** Define nombre del proyecto, version, dependencias de produccion y desarrollo, y configuracion de herramientas (ruff, pytest, mypy). Reemplaza a los antiguos `setup.py` + `requirements.txt` + `setup.cfg` |
| `Dockerfile` | Define como construir la imagen Docker del proyecto. Usa multi-stage build con dos targets: `development` (con hot-reload y deps de dev) y `production` (minimo necesario) |
| `docker-compose.yml` | Orquesta multiples servicios: la app, Ollama (LLM local), ChromaDB (base de datos vectorial) y Redis (cache). Usa profiles para activar servicios opcionales |
| `Makefile` | Atajos para comandos frecuentes. Ejecuta `make help` para ver todos. Ejemplos: `make test`, `make lint`, `make docker-up`, `make clean` |

---

### Archivos de Calidad de Codigo

| Archivo | Proposito |
|---|---|
| `.gitignore` | Lista de archivos y patrones que git debe ignorar. Incluye secciones para: secrets, Python, Node.js, modelos IA, embeddings, IDEs, caches, logs y Docker |
| `.editorconfig` | Garantiza formato consistente entre editores (VS Code, Vim, JetBrains, etc.): indentacion, charset, saltos de linea. Lo leen automaticamente los editores con soporte EditorConfig |
| `.pre-commit-config.yaml` | Define hooks que se ejecutan automaticamente antes de cada `git commit`. Incluye: trailing whitespace, validacion YAML/JSON, deteccion de secrets (gitleaks), linting con ruff y bloqueo de commits directos a main |

---

### Archivos de Entorno

| Archivo | Proposito | Se sube a git? |
|---|---|---|
| `.env.example` | **Plantilla** de variables de entorno. Lista todas las variables que el proyecto necesita con valores de ejemplo. Cada desarrollador copia este archivo a `.env` y llena sus propios valores | Si |
| `.env` | Variables de entorno reales con API keys, passwords y configuracion sensible. **Se genera localmente copiando `.env.example`** | **NUNCA** |

---

### Archivos `.gitkeep`

Archivos vacios cuyo unico proposito es que git rastree directorios que de otro modo
estarian vacios (git no rastrea directorios vacios). Se encuentran en:

- `data/.gitkeep`, `data/cache/.gitkeep`, `data/embeddings/.gitkeep`, etc.
- `notebooks/.gitkeep`
- `prd/.gitkeep`
- `reports/.gitkeep`
- `logs/.gitkeep`
- `.claude/hooks/.gitkeep`

Una vez que se agreguen archivos reales al directorio, el `.gitkeep` puede eliminarse.

---

## Flujo de Trabajo Recomendado

```
1. Experimentar       notebooks/          Probar ideas con Jupyter
       │
2. Definir prompts    config/             Crear templates en YAML
       │
3. Implementar        src/                Escribir codigo en el modulo correcto
       │
4. Probar             tests/              Escribir y ejecutar tests
       │
5. Documentar         docs/               Actualizar guias y ADRs
       │
6. Revisar            make lint && test   Pre-commit hooks + CI
       │
7. Deploy             Dockerfile + CI     Build y despliegue automatico
```

---

## Referencia Rapida: Donde va cada cosa?

| Tengo... | Va en... |
|---|---|
| Una nueva funcion o clase | `src/<modulo>/` |
| Un test | `tests/test_<nombre>.py` |
| Un prompt nuevo | `config/prompt_templates.yaml` |
| Datos descargados | `data/raw/` |
| Un notebook de prueba | `notebooks/` |
| Un esquema JSON | `schemas/` |
| Un script de deploy | `scripts/` |
| Una guia para el equipo | `docs/guides/` |
| Una decision tecnica | `docs/adr/` |
| Una feature por implementar | `prd/` |
| Un reporte generado | `reports/` |
| Una regla para Claude | `.claude/rules/` |
| Un comando slash | `.claude/commands/` |
| Un agente especializado | `.claude/agents/` |
| Una API key | `.env` (nunca en codigo) |
