# Implementación de Chat IA con Base de Conocimiento
**Fecha**: 2026-06-20  
**Componente**: `apps/backend_django/apps/chat_assistant/`, `apps/frontend_next_hub/features/chat/`, `apps/frontend_admin/src/features/knowledge-base/`  
**Tipo**: Nueva funcionalidad  
**Estado**: ✅ Implementado y verificado en producción  
**Decisión de arquitectura**: [ADR-005 — Chat IA con RAG Liviano](../docs/adr/005-chat-ia-rag-liviano.md)

---

## Resumen Ejecutivo

Se implementó un chat de atención al cliente con inteligencia artificial en el **Hub Client Portal** (`hub.digisider.com`). El chat responde preguntas de visitantes y clientes sobre planes, características y servicios de Digisider usando la API de OpenAI (`gpt-4o-mini`) con un enfoque RAG (Retrieval-Augmented Generation) liviano basado en PostgreSQL.

La base de conocimiento es gestionada por el equipo desde el **Admin Panel** (`admin.digisider.com`), sin necesidad de acceso técnico a la base de datos.

---

## Arquitectura implementada

```
[Usuario en Hub] → Pregunta en chat widget
       ↓
[Backend Django] POST /api/v1/public/chat/message/
       ↓
[services.py] Busca artículos relevantes en PostgreSQL
  (icontains en title/content + keywords array)
       ↓
[services.py] Construye system prompt con artículos encontrados
       ↓
[OpenAI API] gpt-4o-mini → respuesta en streaming (SSE)
       ↓
[Hub frontend] ReadableStream → tokens en tiempo real
```

### Componentes creados

#### Backend — `apps/chat_assistant/`
| Archivo | Descripción |
|---------|-------------|
| `models.py` | `ChatKnowledgeArticle`, `ChatSession`, `ChatMessage` |
| `services.py` | RAG liviano + generador SSE con OpenAI |
| `views.py` | Endpoints públicos (sin auth) + endpoints admin (con permiso) |
| `public_urls.py` | `POST /api/v1/public/chat/session/` y `POST /api/v1/public/chat/message/` |
| `admin_urls.py` | CRUD `/api/v1/admin/knowledge-base/` |
| `throttles.py` | `ChatRateThrottle` — 30 mensajes/hora por IP |
| `serializers.py` | Validación de entrada y serialización |
| `fixtures/initial_knowledge.json` | 10 artículos iniciales con información real de Digisider |

#### Frontend Hub — `features/chat/`
| Archivo | Descripción |
|---------|-------------|
| `hooks/useChat.ts` | Session init + streaming fetch con `ReadableStream` |
| `components/ChatWidget.tsx` | Botón flotante fijo en esquina inferior derecha |
| `components/ChatPanel.tsx` | Panel de conversación (340×480px) |
| `components/ChatMessage.tsx` | Burbujas con renderer Markdown inline (tablas, bold, listas) |
| `components/ChatInput.tsx` | Textarea auto-resizable + envío con Enter |

Widget integrado en `app/layout.tsx` → visible en **toda la app** (landing + dashboard + billing).

#### Frontend Admin — `features/knowledge-base/`
| Archivo | Descripción |
|---------|-------------|
| `KnowledgeBasePage.tsx` | Página principal con stats y grid de artículos |
| `components/ArticleCard.tsx` | Tarjeta con acciones editar/toggle/eliminar |
| `components/ArticleModal.tsx` | Modal create/edit con React Hook Form + Zod |
| `components/ArticleFilters.tsx` | Filtros por búsqueda, categoría y estado |
| `hooks/useKnowledgeBase.ts` | GET artículos (TanStack Query) |
| `hooks/useArticleMutations.ts` | POST/PATCH/DELETE/toggle artículos |

---

## Configuración de producción

### Variables de entorno agregadas (backend)
```env
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
```

### Pasos de deploy ejecutados
1. Push del código → Dokploy rebuild automático
2. `python manage.py migrate` → creó tablas `chat_assistant_*`
3. `python manage.py loaddata apps/chat_assistant/fixtures/initial_knowledge.json` → 10 artículos

### Base de conocimiento inicial cargada
10 artículos con información real de Digisider:
- ¿Qué es Digisider? (general)
- Planes y precios ($0 / $29 / $79 / $199 mensual)
- Workspace — Plataforma de Productividad
- Vista Digital — Tarjeta, Landing, Portafolio, CV
- App Desktop — Windows y macOS
- Servicios de Automatización con IA (n8n)
- Servicios de Marketing Digital y Desarrollo Web
- Cómo registrarse e iniciar sesión
- Preguntas frecuentes (FAQ)
- Contacto y Soporte

---

## Decisiones técnicas relevantes

### RAG liviano vs Assistants API
Se eligió RAG liviano (búsqueda en PostgreSQL) sobre la Assistants API de OpenAI porque:
- El historial de conversación queda en la base de datos propia (útil para analytics futuros)
- No hay dependencia de los threads de OpenAI (que tienen TTL y límites)
- Costo menor: solo se paga el completion, sin storage de embeddings
- Suficiente para una KB de menos de 50 artículos

Ver decisión completa en [ADR-005](../docs/adr/005-chat-ia-rag-liviano.md).

### Streaming: `fetch + ReadableStream` en lugar de `EventSource`
`EventSource` solo soporta GET. Para poder enviar el token de sesión y el mensaje en el body se usa `fetch` con `ReadableStream`, que soporta POST con streaming.

### Renderer Markdown sin dependencias externas
En lugar de instalar `react-markdown`, se implementó un renderer ligero en `ChatMessage.tsx` que maneja los patrones usados en las respuestas del asistente: tablas, negrita, listas y headers. Evita añadir ~150KB al bundle del Hub.

---

## Incidencias durante la implementación

| Incidencia | Causa | Solución |
|-----------|-------|----------|
| Error 500 en `/chat/message/` en dev | `openai` no instalado en contenedor Docker | `docker exec rbac_django pip install openai` + está en `requirements/base.txt` para rebuilds |
| Runtime error `options.factory` en Hub | Caché `.next` corrupto (archivos de Docker con permisos root) | `sudo rm -rf .next` + `docker restart rbac_next_hub_dev` |
| Respuestas sin formato en el chat | Markdown del asistente renderizado como texto plano | Renderer Markdown custom en `ChatMessage.tsx` |

---

## Deuda técnica generada

- **Fase 2 — pgvector**: Cuando la KB supere ~50 artículos, migrar la búsqueda de artículos a embeddings con pgvector para mayor precisión semántica.
- **Analytics de chat**: Panel en Admin Panel con métricas de conversaciones: mensajes por día, preguntas más frecuentes, tasa de conversión.
- **Permiso `knowledge_base.manage`**: Agregar al fixture `seed_permissions` para que se asigne automáticamente al rol Owner en nuevas instalaciones.
