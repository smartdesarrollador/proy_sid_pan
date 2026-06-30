# Backlog

Lista liviana de pendientes cortos, deuda técnica e ideas que **todavía no ameritan**
su propio archivo. Se actualiza constantemente — no lleva fecha, no es histórico.

**Relación con otras carpetas:**
- Si un ítem necesita explicación detallada (pasos, opciones, comandos) → se "gradúa"
  a su propio archivo en [`pending/`](pending/).
- Si un ítem es el plan de implementación de una sección reducida → va en [`plans/`](plans/).
- Si un ítem requiere mapear muchísimas secciones/páginas (varios planes a la vez) →
  va en [`roadmaps/`](roadmaps/), que guía esos planes individuales en `plans/`.
- Cuando un ítem se completa → se borra de aquí y queda registrado con fecha en [`reports/`](reports/).

---

## 3 Últimas tareas realizadas

> Referencia rápida — ver detalles completos en [`reports/`](reports/).

- **2026-06-29 — Importar Notas, Tareas y Calendario (Workspace)** ✅
  Extiende el import a productividad: Notas (Markdown-zip/JSON), Tareas (CSV/JSON), Calendario (ICS),
  gateados por `notes_import`/`tasks_import`/`calendar_import` (Starter+). Backend
  `POST /api/v1/app/{notes,tasks,calendar}/import/` (mismo patrón: revalida por fila, límite parcial,
  `bulk_create`, `AuditMixin`). Particularidades: **Tareas** resuelven un único board "General"
  (`get_or_create`) y cuentan el límite a nivel tenant; **Calendario** rechaza `end < start` (→ `errors`);
  **Notas** se leen del Markdown ZIP con `jszip.loadAsync`. `ImportModal` ganó una prop opcional
  `parseFile` (ruta async/binaria) sin tocar contactos/bookmarks. Backend 17/17 · frontend parsers
  (round-trips `parseICS↔toICS`, `parseNotesZip↔toMarkdownZip`) + suite 251 ✓ · typecheck + build ✓.
  _→ [Reporte](reports/2026-06-29-import-notas-tareas-calendario-workspace.md)_

- **2026-06-29 — Importar Contactos y Bookmarks (Workspace)** ✅
  Complemento del export. `ImportButton`/`ImportModal` genéricos (archivo → preview → resumen) en el
  header de Contactos (vCard/CSV) y Bookmarks (HTML/CSV/JSON), gateados por `contact_import`/
  `bookmark_import` (Starter+). Parsers en `src/lib/import.ts` (inversos de `export.ts`, con
  `parseCSV` RFC 4180 + DOMParser). Backend: `POST /api/v1/app/{contacts,bookmarks}/import/`
  (`ContactImportView`/`BookmarkImportView`) — el cliente parsea y manda filas JSON, el backend
  **revalida cada fila** con el serializer de creación, **éxito parcial** (inválidas → `errors`),
  **límite de plan parcial** (crea hasta el tope, resto → `skipped`), cap 1000, `bulk_create`,
  `AuditMixin`. Decisión: importar todo (sin dedup). Backend 12/12 · frontend import/ImportModal
  nuevos + suite 245 ✓ · typecheck + build ✓.
  _→ [Reporte](reports/2026-06-29-import-contactos-bookmarks-workspace.md)_

- **2026-06-29 — Exportación de datos + Backup completo (Workspace)** ✅
  Patrón único de export por sección (botón/dropdown `ExportMenu` gateado) con formatos nativos:
  Notas (Markdown-zip/JSON/CSV), Tareas (CSV/JSON), Contactos (vCard/CSV), Bookmarks (HTML/CSV/JSON),
  Snippets (código-zip/JSON), Calendario (ICS), Proyectos (JSON metadatos). Util compartido
  `src/lib/export.ts` con escape **CSV RFC 4180** (arregla bug previo) + `jszip` lazy-loaded.
  Backend: `GET /api/v1/app/workspace/backup/` (ZIP, `HasFeature('full_backup')`, `AuditMixin`,
  aislamiento por tenant, **secretos enmascarados/excluidos**) + nuevos flags en `plans.py`. Se
  **eliminó** el export de EnvVars (exportaba secretos). Bug latente corregido: 4 feature keys del
  front no existían en `plans.py` → export siempre deshabilitado (ver `LL-057`). Backend 5/5 ·
  frontend export/ExportMenu nuevos + 76/76 relevantes · typecheck + build ✓.
  _→ [Reporte](reports/2026-06-29-export-datos-workspace.md)_

---

## Pendientes activos

> Lo inmediato — lo primero que se retoma la próxima vez que se abre el proyecto.

- [ ] **Deploy Bóveda a prod:** redeployar backend (`back_dj_sp`) + `migrate vault`, redeployar
      workspace (`front_ws_sp`). **Requisitos**: (1) `ENCRYPTION_KEY` válida en Dokploy (Fernet,
      una sola vez — si cambia se pierde lo cifrado); (2) que el cambio de `CORS_ALLOW_HEADERS`
      (`x-vault-token`) esté en el commit desplegado. _Origen: E2E Bóveda 2026-06-27._
- [ ] Verificar que las notificaciones por correo (activación, rechazo, etc.) lleguen
      al correo real del usuario en producción (no solo en entorno de pruebas).
- [ ] Implementar cambios de prioridad media del análisis de feature gates: portfolio
      básico en Starter, sharing entre miembros del mismo tenant en Free, export de
      datos propios en todos los planes.
      _Origen: [reports/2026-06-17-feature-gates-analysis.md](reports/2026-06-17-feature-gates-analysis.md)_

---

## Deuda técnica

> No es urgente, pero si no se corrige puede morder después.

- [ ] **Export/Import — pendientes y deploy:** (1) export de **metadata** de SSL Certs
      (dominio/vencimiento, sin private key) — no implementado; (2) **backups automáticos** programados +
      retención (hoy el backup es on-demand); (3) **deduplicación/upsert** en import (hoy se importa
      todo, sin detectar duplicados) — transversal a todos los recursos; import de Snippets/Proyectos no
      priorizado; (4) al desplegar, los flags nuevos de `plans.py` (`*_export`, `full_backup`,
      `*_import` de contactos/bookmarks/notas/tareas/calendario) **no requieren migración** pero sí
      **redeploy** de backend + workspace; (5) revisar si `bookmark_export` debería bajar a Starter+ por
      coherencia (hoy Professional+ por precedente).
      _Origen: features export/import de datos, 2026-06-29; ver reportes `2026-06-29-export-datos-workspace.md`,
      `…-import-contactos-bookmarks-workspace.md` y `…-import-notas-tareas-calendario-workspace.md`._
- [ ] **Buscador de chat — saltar al mensaje exacto + portar a desktop:** hoy el clic en un
      resultado de mensaje (`/api/v1/app/chat/search/`) abre la conversación en su última página, pero
      no hace scroll/resalta el mensaje específico (sobre todo si es antiguo). Requiere soporte backend
      de "cargar contexto alrededor de un `message_id`" (paginación bidireccional; hoy solo hay cursor
      `before` hacia atrás). Pendiente también portar el mismo buscador al ChatPanel del sidebar desktop
      (Tauri). _Origen: feature buscador de chat WhatsApp, sesión 2026-06-29; ver
      [reports/2026-06-29-buscador-chat-whatsapp-workspace.md](reports/2026-06-29-buscador-chat-whatsapp-workspace.md)._
- [ ] **Buscador general (Workspace) — Fase 2:** el agregador `/api/v1/app/search/` cubre notas,
      tareas, eventos, contactos, bookmarks, snippets, proyectos, bóveda (solo título) y mensajes
      de chat con `icontains` (≤5 resultados por tipo). Pendiente: (a) incluir env-vars, ssh-keys,
      ssl-certs y forms respetando su feature-gating; (b) si crece el volumen, migrar de `icontains`
      a Postgres full-text (`SearchVector`/`SearchRank`) para ranking real; (c) opcional: command
      palette ⌘K reutilizando el mismo hook/endpoint.
      _Origen: feature buscador general, sesión 2026-06-29; ver
      [reports/2026-06-29-buscador-general-workspace.md](reports/2026-06-29-buscador-general-workspace.md)._
- [ ] **Workspace — 2 tests de auth pre-existentes fallando:** `ProtectedRoute.test.tsx`
      (redirige a /login cuando no autenticado) y `SSOCallbackPage.test.tsx` (valida sso_token y
      navega al dashboard, `waitFor` sobre `POST /auth/sso/validate`). Fallan en aislamiento, sin
      relación con el buscador. _Detectado durante feature buscador general, 2026-06-29._

- [ ] **Chat Fase 3 — deploy prod (Dokploy):** el Workspace ahora usa WebSockets (Django Channels).
      En dev el `runserver` ya es ASGI/Daphne, pero producción corre **gunicorn (WSGI)**. Para que el
      chat en vivo funcione en prod hay que servir Django con **daphne/uvicorn (ASGI)** y exponer el
      upgrade WebSocket en Traefik. Documentar con skill `dokploy-deploy`. Sin esto, prod cae al
      **fallback de polling** (funciona, sin tiempo real). **Confirmado en prod (2026-06-27):** el log
      del backend muestra `GET /ws/chat/` devolviendo `301` cada ~60 s (el cliente reintenta el WS
      contra WSGI y nunca conecta). _Origen: Fase 3 chat, sesión 2026-06-26; evidencia en
      [reports/2026-06-27-login-cors-502-oom-gunicorn.md](reports/2026-06-27-login-cors-502-oom-gunicorn.md)._
- [ ] **Chat — almacenamiento de adjuntos:** los `MessageAttachment` usan `MEDIA_ROOT` local
      (`chat_attachments/`). En prod (contenedor efímero) migrar a S3/volumen persistente
      (django-storages) si los adjuntos deben sobrevivir redeploys. _Origen: Fase 3 chat._
- [ ] **Bóveda — zero-knowledge (fase futura):** hoy es envelope server-side ("Nivel B"): el servidor
      ve la master password en tránsito durante el unlock. Para máxima seguridad, mover el cifrado al
      navegador (WebCrypto/Argon2) para que la master password nunca llegue al servidor. Implica perder
      búsqueda server-side y recuperación. _Origen: feature Bóveda, sesión 2026-06-27._
- [ ] **Bóveda — extras:** generador de contraseñas, autocompletar, importar/exportar, compartir ítems
      entre usuarios del tenant, adjuntos cifrados. _Origen: feature Bóveda (fuera de alcance v1)._
- [ ] `featureGates.ts` de `frontend_next_vista` está hardcodeado (client-side). Migrar
      a server-driven consumiendo `GET /api/v1/features/` igual que Hub y Workspace,
      para eliminar la deuda de sincronización manual cuando cambian las definiciones de plan.
      _Origen: [reports/2026-06-17-feature-gates-analysis.md](reports/2026-06-17-feature-gates-analysis.md)_
- [ ] 4 tests pre-existentes fallando sin relación con feature gates: `test_summary_returns_metrics_keys`
      + `test_usage_returns_resource_breakdown` (endpoint analytics cambió estructura de respuesta
      pero los tests no se actualizaron); `test_client_sees_only_own_ticket` + `test_comment_role_client_for_regular_user`
      (usuarios regulares sin rol `support.read` asignado reciben 403 en lugar de poder ver sus propios tickets).
- [ ] Cuando un usuario tiene `is_active=False`, el login devuelve "Credenciales inválidas" en
      lugar de "Cuenta suspendida". Comportamiento intencional por seguridad (no revelar si la
      cuenta existe), pero considerar agregar un mensaje más descriptivo cuando el email SÍ existe
      y la cuenta está explícitamente suspendida por un admin.

- [ ] El endpoint `POST /api/v1/admin/subscriptions/yape-upgrade` (upgrade autenticado
      desde el Hub) duplica parte de la lógica de `YapePaymentProofView` del registro.
      Candidato a extraer a un helper/service compartido si se añaden más puntos de
      entrada de comprobantes Yape.
- [ ] Template HTML para el email de expiración de trial — `expire_professional_trials` usa `send_mail`
      con texto plano; diseñar template consistente con el resto de emails de la plataforma.
      _Origen: [reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md](reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md)_
- [ ] Email de confirmación del formulario de contacto (`apps/contact/views.py::_send_confirmation_email`)
      usa `send_mail` con texto plano — unificar con el template HTML de la plataforma cuando se aborde
      el de trial (misma deuda).
      _Origen: [reports/2026-06-22-formulario-contacto-recaptcha.md](reports/2026-06-22-formulario-contacto-recaptcha.md)_
- [ ] Panel en Admin para ver tenants en estado `trialing` con vencimiento próximo — útil para
      seguimiento comercial y detección de oportunidades de conversión antes del vencimiento.
      _Origen: [reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md](reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md)_
- [ ] Mostrar `professional_trial_used` en la vista de detalle de cliente del Admin Panel —
      actualmente no es visible sin consultar la BD directamente.
      _Origen: [reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md](reports/2026-06-21-trial-30-dias-professional-descarga-desktop.md)_
- [ ] Agregar TTL/expiración a los `admin_token` de `YapePaymentProof` — los links de
      aprobación/rechazo de Telegram quedan vigentes indefinidamente.
      _Origen: [reports/2026-06-15-implementacion-pago-yape.md](reports/2026-06-15-implementacion-pago-yape.md),
      [docs/adr/004-pago-manual-yape.md](docs/adr/004-pago-manual-yape.md)_
- [ ] Agregar autenticación adicional (secreto compartido / header) a los endpoints
      `yape-payment/activate/` y `yape-payment/reject/`, como capa extra ante fuerza
      bruta del `admin_token`.
      _Origen: [reports/2026-06-15-implementacion-pago-yape.md](reports/2026-06-15-implementacion-pago-yape.md)_
- [ ] Documentar el header `X-Tenant-Slug` como requerido en el schema de Swagger
      (`@extend_schema`) para endpoints `/api/v1/app/`.
      _Origen: [reports/2026-03-15-bugfix-desktop-snippets.md](reports/2026-03-15-bugfix-desktop-snippets.md)_
- [ ] Crear un `apiClient` centralizado en `frontend_sidebar_desktop` que inyecte
      automáticamente `Authorization` + `X-Tenant-Slug` (similar al axios instance del
      Workspace), para no repetir esa lógica en cada panel.
      _Origen: [reports/2026-03-15-bugfix-desktop-snippets.md](reports/2026-03-15-bugfix-desktop-snippets.md)_

---

## Ideas de feature

> Sería bueno tenerlo, sin compromiso de fecha.

- [ ] Fase 2 chat IA: migrar búsqueda de artículos a pgvector/embeddings cuando la KB
      supere ~50 artículos (actualmente usa full-text search con icontains).
- [ ] Agregar analytics de chat al Admin Panel: mensajes por día, preguntas más frecuentes,
      tasa de conversión (usuarios que chatearon y luego se registraron).
- [ ] Quitar los botones de "actualizar plan" de `frontend_next_vista` y
      `frontend_workspace` — la gestión de suscripción ya vive en `frontend_next_hub`,
      centralizar evita duplicados y confusión.
- [ ] Sección "Suspender cuenta" en `frontend_admin` para que los admins puedan
      suspender tenants directamente desde el panel, sin necesidad de ir a la BD.
- [ ] Panel en Admin para ver tenants en estado `pending_payment` con más de N días
      sin revisión (alerta visual de comprobantes Yape olvidados).
      _Origen: [reports/2026-06-15-implementacion-pago-yape.md](reports/2026-06-15-implementacion-pago-yape.md),
      [docs/adr/004-pago-manual-yape.md](docs/adr/004-pago-manual-yape.md)_
- [ ] Test de integración que verifique que un request sin `X-Tenant-Slug` retorna
      lista vacía (no 401/403) — el comportamiento silencioso puede confundir si no
      está cubierto por test.
      _Origen: [reports/2026-03-15-bugfix-desktop-snippets.md](reports/2026-03-15-bugfix-desktop-snippets.md)_
- [ ] Notificaciones nativas Tauri cuando llega un mensaje de chat con el panel de chat
      cerrado: usar `@tauri-apps/plugin-notification` para mostrar el nombre del remitente
      y el preview del mensaje; requiere que `useChatSocket` quede activo en background
      (considerar moverlo al nivel de `App.tsx`).
      _Origen: [reports/2026-06-27-chat-desktop-sidebar.md](reports/2026-06-27-chat-desktop-sidebar.md)_
- [ ] Badge de mensajes no leídos en el ícono de Chat del `IconStrip`: sumar `unread_count`
      de todas las conversaciones y mostrar un dot/badge rojo. Requiere compartir el estado
      de conversaciones fuera del `ChatPanel` (subir al store de navegación o crear un
      `chatStore` global).
      _Origen: [reports/2026-06-27-chat-desktop-sidebar.md](reports/2026-06-27-chat-desktop-sidebar.md)_
