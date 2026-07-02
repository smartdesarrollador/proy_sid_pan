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

- **2026-07-01 — Modal de Anuncios/Promociones (Hub)** ✅
  Feature en 3 fases: backend (nueva app `apps/announcements/`, staff-only admin + lectura
  pública/autenticada cacheada 5 min con invalidación en mutación), Admin Panel (CRUD completo en
  `/announcements`, imagen, CTA, placement, ventana de vigencia, toggle activo/inactivo) y Hub
  (modal en Home pública + Dashboard, descarte persistente por `localStorage`, responsive). De paso
  se corrigió un bug de `image_url` apuntando a un hostname interno de Docker (`utils/media.py`,
  también afectaba a `catalog`) y un parpadeo del modal por descarte compartido entre Home/Dashboard.
  Backend 16 tests nuevos · Admin 5 tests nuevos · Hub 65/65 sin regresiones. typecheck + build ✓.
  _→ [Reporte](reports/2026-07-01-anuncios-modal-hub.md)_

- **2026-07-01 — Catálogo de Servicios Dinámico** ✅
  Nueva app `apps/catalog/` (backend) + sección CRUD en Admin Panel + Hub landing + Desktop
  ServicesPanel dinámicos. `CatalogItem` con imagen/color, `target_apps` JSONField (`desktop`,
  `mobile`, `web`), orden y activo/inactivo. Endpoints: `GET /api/v1/public/catalog/?app=X`
  (AllowAny) + 4 endpoints staff en `/admin/catalog/`. Hub y Desktop reemplazan arrays
  estáticos hardcodeados por fetch al mismo backend. typecheck + build ✓.
  _→ [Reporte](reports/2026-07-01-catalogo-servicios-dinamico.md)_

- **2026-06-30 — Reportes Workspace Fase 3 (Actividad + Uso vs plan)** ✅
  Cierra el roadmap de Reportes. **Actividad** (analítica agregada del `AuditLog`, **no** otra tabla —
  el log crudo ya existe en `/audit`): timeline por día + distribución por `action`, gateada
  **Professional+** (`audit_logs`, como Tendencias usan `analytics_trends`), con period toggle 7/30/90d
  capado por retención. **Panel "Uso vs plan"** (Starter+): 6 barras (tareas/proyectos/notas/contactos/
  bookmarks/snippets) verde/amarillo/rojo desde el bloque `usage` que `summary` ya devolvía, reusando la
  lógica de `PlanUsageBanner`. Backend: nuevo `GET /api/v1/app/reports/activity/` (`_compute_activity`,
  caché Redis por periodo, respeta `audit_log_days`). Backend 16/16 (3 nuevos) · ReportsPage 9/9 ·
  suite 254 ✓ · typecheck + build ✓. Nota: `useTrends` envía `?period=7d` y el backend lo parsea con
  `int()` → siempre cae a 30 (bug preexistente; el nuevo hook envía el número correcto).
  _→ [Reporte](reports/2026-06-30-reportes-workspace-fase3-actividad-uso.md)_

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

- [ ] **Reportes — transversales + export ejecutivo (roadmap Fases 1-3 completado):** hechas Fase 1
      (vencidas/prioridad/tasa), Fase 2 (DevOps) y **Fase 3 (Actividad + Uso vs plan)**. Pendiente solo
      lo transversal: **filtro de rango de fechas global** y **export por sección**; y el **export
      ejecutivo incoherente** (`ExportReportButton` descarga `reporte.csv` algo que `ReportExportView`
      sirve como **JSON**, y gatea con `analytics_export` mientras el backend exige `pdf_export` — decidir
      formato CSV real vs JSON/PDF y unificar el gate). Bugs/opciones detectados: **`useTrends` envía
      `?period=7d`** y el backend lo parsea con `int()` → siempre 30 (el toggle de Tendencias no surte
      efecto; arreglar enviando el número como en `useActivityReport`); opción **contador de uso de
      snippets** (`usage_count`) para "más usados". _Origen: Reportes Workspace Fases 1-3, 2026-06-29/30;
      ver `reports/2026-06-30-reportes-workspace-fase3-actividad-uso.md`._
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
- [ ] **Anuncios (Hub) — sin tracking de impresiones/clics:** no hay forma de medir efectividad de
      una campaña (cuántos la vieron, cuántos hicieron click en el CTA). Sería un contador
      incremental simple, sin tabla de eventos pesada.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] **Anuncios (Hub) — un solo anuncio activo por `placement`:** se resuelve por `priority` +
      `created_at`. El campo `priority` ya está listo por si se quiere rotar varios en el futuro
      (ej. carrusel de anuncios).
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] **Anuncios (Hub) — sin segmentación por plan del tenant:** todo tenant autenticado ve el mismo
      anuncio de dashboard; podría filtrarse por `tenant.plan` para ofertas de upgrade dirigidas.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] `apps/catalog` sigue sin tests — se tocó `serializers.py` en el fix de `image_url` (LL-033)
      pero no se le agregaron tests. Buen candidato para una pasada de tests aparte.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] Migrar `AnnouncementModal` del Hub (`frontend_next_hub`) de `<img>` plano a `next/image`
      cuando `next.config.ts` tenga el dominio de medios de producción en `images.remotePatterns`
      (mejor LCP; hoy genera warning de ESLint `no-img-element`, aceptado a propósito).
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_

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
