# ADR-005: Chat IA con RAG Liviano vía PostgreSQL + OpenAI

- **Estado**: Aceptado
- **Fecha**: 2026-06-20
- **Autor**: Equipo de desarrollo

---

## Contexto

El Hub Client Portal (`hub.digisider.com`) necesitaba un canal de atención al cliente disponible 24/7 para responder consultas de visitantes y clientes sobre planes, características y servicios de Digisider, sin requerir intervención humana en tiempo real.

Los requisitos eran:
1. El chat debe responder con información real y actualizada de la empresa
2. La base de conocimiento debe ser gestionable por el equipo sin conocimientos técnicos
3. El sistema debe ser económico (modelo SaaS en etapa temprana)
4. Las respuestas deben aparecer en tiempo real (streaming), no como bloque al final
5. Debe funcionar para visitantes anónimos (sin autenticación)

Se evaluaron tres enfoques:

| Enfoque | Descripción | Costo |
|---------|-------------|-------|
| **A. System prompt fijo** | Información de la empresa hardcodeada en el prompt | Bajo, pero KB no actualizable sin deploy |
| **B. RAG liviano con PostgreSQL** | Búsqueda full-text en artículos en BD; artículos relevantes inyectados en prompt | Bajo, KB gestionable desde Admin Panel |
| **C. Assistants API de OpenAI** | Threads + File Search + Vector Store en OpenAI | Medio-alto, KB en infraestructura de OpenAI |

---

## Decisión

Se implementa el **Enfoque B: RAG liviano con PostgreSQL**.

La base de conocimiento se almacena en la tabla `ChatKnowledgeArticle` (PostgreSQL). Cuando un usuario envía un mensaje, el backend busca los artículos más relevantes usando búsqueda por palabras clave (`icontains` en título, contenido y campo `keywords` ArrayField). Los artículos encontrados se inyectan en el system prompt de `gpt-4o-mini` antes de llamar a la API de OpenAI.

La respuesta se transmite al browser mediante **Server-Sent Events (SSE)** usando `StreamingHttpResponse` en Django y `fetch + ReadableStream` en el frontend.

---

## Arquitectura

```
Browser (Hub)
  │
  ├── POST /api/v1/public/chat/session/   (crea/recupera sesión anónima)
  │
  └── POST /api/v1/public/chat/message/
          │
          ├── Busca artículos relevantes en PostgreSQL
          │     icontains(title, content) + keywords__contains
          │     Fallback: top 3 artículos por orden si sin coincidencias
          │
          ├── Construye system prompt:
          │     _SYSTEM_PROMPT_BASE + contexto de artículos encontrados
          │
          ├── Recupera historial: últimos 8 mensajes de la sesión
          │
          ├── openai.chat.completions.create(stream=True, model='gpt-4o-mini')
          │
          └── StreamingHttpResponse → SSE → ReadableStream en browser
                formato: "data: {"token":"..."}\n\n"
                fin:     "data: [DONE]\n\n"
```

### Modelos de datos

```python
ChatKnowledgeArticle   # Artículos de la KB (gestionados desde Admin Panel)
  - title, content, category, keywords (ArrayField), is_active, order

ChatSession            # Sesión anónima por visitor
  - session_token (64-char hex), ip_address, message_count, converted

ChatMessage            # Mensajes del historial
  - session (FK), role ('user'|'assistant'), content, tokens_used
```

### Límites configurados
- `MAX_MESSAGES_PER_SESSION = 30` — mensajes por sesión
- `MAX_HISTORY_MESSAGES = 8` — mensajes de historial enviados a OpenAI
- `MAX_ARTICLES_IN_CONTEXT = 4` — artículos máximos en el system prompt
- Rate limit: 30 mensajes/hora por IP (`ChatRateThrottle`)

---

## Consecuencias

### Positivas
- **KB actualizable sin deploy**: el equipo gestiona artículos desde `admin.digisider.com/knowledge-base`
- **Historial en BD propia**: permite analytics de conversaciones (preguntas frecuentes, tasa de conversión) en el futuro
- **Sin vendor lock-in en KB**: los artículos son datos propios en PostgreSQL, no en OpenAI
- **Costo bajo**: `gpt-4o-mini` a ~$0.15/1M tokens de input + ~$0.60/1M tokens output; con `MAX_ARTICLES_IN_CONTEXT=4` el contexto por request es pequeño
- **Streaming real**: el usuario ve los tokens a medida que llegan, mejor UX que esperar la respuesta completa

### Negativas / Limitaciones
- **Búsqueda semántica limitada**: `icontains` no entiende sinónimos ni variaciones semánticas. Una pregunta sobre "tarifas" no encontrará el artículo que habla de "precios". Mitigado con keywords manuales en cada artículo.
- **Precisión limitada con KB grande**: a partir de ~50 artículos, la búsqueda por keywords puede devolver artículos poco relevantes. Para ese punto, migrar a pgvector con embeddings.
- **Sin memoria entre sesiones**: cada sesión (`sessionStorage`) es independiente. Un usuario que vuelve al día siguiente empieza desde cero.
- **Latencia primera respuesta**: el primer token tarda ~1-2s (llamada a OpenAI). Aceptable para un chat de soporte.

---

## Alternativas descartadas

### Enfoque A — System prompt fijo
Descartado porque la información de la empresa (planes, precios, características) cambia con frecuencia. Actualizar el system prompt requeriría un deploy cada vez.

### Enfoque C — Assistants API de OpenAI
Descartado porque:
- Los threads y mensajes se almacenan en OpenAI, no en la BD propia → sin analytics propios
- Los Vector Stores de OpenAI tienen costo adicional de storage
- Mayor complejidad de integración (gestión de thread IDs, polling de runs)
- El "File Search" de Assistants API es adecuado cuando la KB tiene cientos de documentos; para 10-50 artículos es sobredimensionado

---

## Plan de migración futura (Fase 2)

Cuando la KB supere ~50 artículos o la precisión de búsqueda resulte insuficiente:

1. Agregar `pgvector` a PostgreSQL
2. Generar embeddings para cada `ChatKnowledgeArticle` con `text-embedding-3-small`
3. Reemplazar `get_relevant_articles()` en `services.py` por búsqueda cosine similarity
4. El resto de la arquitectura (streaming, sesiones, historial) no cambia

---

## Referencias
- Reporte de implementación: [reports/2026-06-20-implementacion-chat-ia.md](../../reports/2026-06-20-implementacion-chat-ia.md)
- Backend: `apps/backend_django/apps/chat_assistant/`
- Frontend Hub: `apps/frontend_next_hub/features/chat/`
- Frontend Admin: `apps/frontend_admin/src/features/knowledge-base/`
