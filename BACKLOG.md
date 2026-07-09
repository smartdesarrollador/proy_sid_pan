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

- **2026-07-09 — Desktop Sidebar (Bookmarks/Snippets): mismo autocompletado + filtro de tags que Notas** ✅
  Mismo patrón exacto recién implementado en Notas, replicado sin cambios de backend (misma
  arquitectura 100% client-side en los tres paneles). `allTags` derivado de los datos ya cargados en
  ambos paneles; fila de pills `#tag` (teal, consistente entre los tres) después de la fila de
  colección/lenguaje; mismo bloque de autocompletado (dropdown al enfocar, filtro por substring,
  clic inserta) en `BookmarkForm`/`SnippetForm`. Hallazgo resuelto como parte de la paridad (no bug
  aparte): `SnippetsPanel.tsx` nunca mostraba tags en ningún lado (a diferencia de Bookmarks/Notas)
  — se agregó la misma fila de tags al detalle expandido de `SnippetItem`, mismo estilo que
  `BookmarkItemRow`, para que el nuevo filtro tenga confirmación visual. `tsc` y `vite build`
  limpios. Verificado manualmente en navegador real (mismo procedimiento que Notas): filtro por tag
  reduce la lista en ambos paneles, autocompletado sugiere/filtra correctamente (probado con "te" →
  `#test`+`#urgente`), detalle expandido de snippet ahora muestra sus tags.
  _→ [Reporte](reports/2026-07-09-desktop-bookmarks-snippets-autocompletado-filtro-tags.md)_

- **2026-07-09 — Desktop Sidebar (Notas): autocompletado de tags + filtro de tags** ✅
  El backend ya persistía tags correctamente (sesión previa); el campo en `NotesPanel.tsx` era texto
  libre sin autocompletado, y no existía filtro por tag (solo por categoría). Hallazgo clave: este
  panel filtra 100% client-side (`fetchNotes` trae todas las notas en una sola llamada, categoría y
  búsqueda ya se filtran con `useMemo` sobre el array cargado) — así que el vocabulario de tags para
  filtro y sugerencias se derivó directo de `notes` ya cargadas (`allTags`, mismo patrón que
  `presentCategories`), **sin ninguna llamada nueva al backend**. Se agregó una fila de pills `#tag`
  (mismo estilo que las de categoría, color teal) para el filtro, combinado por AND con
  categoría/búsqueda. Para el autocompletado en `NoteForm` no había ningún dropdown/popover en toda
  la app (grep sin resultados) — se construyó uno mínimo desde cero: lista de sugerencias al enfocar
  el campo (todas si está vacío, filtradas por substring al escribir), clic inserta el tag y deja el
  campo listo para el siguiente, cierre con clic-fuera o Escape. Sin cambios de backend. `tsc` y
  `vite build` limpios; esta app no tiene infraestructura de testing (deuda ya trazada) — verificado
  manualmente en navegador real (`vite dev` fuera de Docker + sesión sembrada en localStorage vía
  login real): filtro por tag reduce la lista correctamente, autocompletado sugiere/filtra/inserta
  bien, nota creada con dos tags (uno nuevo) persistió ambos y el nuevo apareció de inmediato en el
  filtro.
  _→ [Reporte](reports/2026-07-09-desktop-notas-autocompletado-filtro-tags.md)_

- **2026-07-08 — Compartir (Notas/Contactos/Snippets + Bóveda) portado al Desktop Sidebar** ✅
  El Workspace ya tenía compartir + selección múltiple en lote (Notas/Contactos/Snippets) y compartir
  de ítems de Bóveda (E2E); se llevó ambas funcionalidades al Desktop (Tauri), adaptadas a su
  contenedor angosto. Como esta app no comparte código con el Workspace (sin TanStack Query/axios/
  módulo de sharing), todo se reimplementó con sus propias convenciones (`useState` + `apiFetch`).
  Para Notas/Contactos/Snippets: bloque de compartir inline (mismo patrón que los forms de Crear/
  Editar, en vez de un modal que no cabría), badge compacto, y selección múltiple con checkboxes +
  barra de acciones. Para la Bóveda: se confirmó que toda la criptografía X25519/ECDH es 100%
  server-side (ningún frontend toca claves), así que fue un port de UI+REST puro — sin selección
  múltiple, tal como está en el Workspace. Cero cambios de backend. Verificado por el usuario en el
  entorno real (Tauri) tras `npx tsc --noEmit` + `npx vite build` limpios.
  _→ [Reporte](reports/2026-07-08-compartir-desktop-sidebar.md)_

---

## Pendientes activos

> Lo inmediato — lo primero que se retoma la próxima vez que se abre el proyecto.

- [ ] **Verificar instalación PWA real de las 4 vistas públicas (tarjeta/landing/portafolio/cv)
      fuera de `curl`:** `navigator.serviceWorker` requiere "secure context" — `localhost`/
      `127.0.0.1` califican sin HTTPS, pero el hostname de dev del proyecto
      (`next-vista.local.test`, mapeado a `127.0.0.1` vía hosts) **no** califica solo por resolver
      a loopback. Probar el botón "Instalar app" real con `http://localhost:3004` directo, o en
      producción (HTTPS). _Origen: [reports/2026-07-03-digisider-branding-pwa-vistas-publicas.md](reports/2026-07-03-digisider-branding-pwa-vistas-publicas.md)_
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

- [ ] **Bookmarks: `collection` serializado como UUID crudo, no como objeto anidado:**
      `BookmarkSerializer.collection` es el campo FK default de DRF (`PrimaryKeyRelatedField`,
      devuelve solo el UUID), pero el tipo frontend `Bookmark.collection: BookmarkCollection | null`
      y `BookmarkCard.tsx` (`<CollectionBadge collection={bookmark.collection} />`) esperan el objeto
      completo `{id, name, color, bookmarks_count}`. El campo `collection_name` sí existe y es
      correcto, pero nada lo usa para el badge. Esto hace que el filtro de colección (ya con el
      query-param corregido a `?collection=`) siga sin mostrar resultados, y probablemente que el
      badge de colección en las cards nunca renderice bien. Decidir enfoque: (a) devolver un objeto
      anidado real (`collection = BookmarkCollectionSerializer(read_only=True)` + campo de escritura
      separado), o (b) que el frontend use `collection`(id)+`collection_name` en vez de esperar un
      objeto. _Origen: verificación end-to-end del fix de `collection_id`, 2026-07-09 — ver
      [reports/2026-07-09-bookmarks-tags-favoritos-coleccion.md](reports/2026-07-09-bookmarks-tags-favoritos-coleccion.md)_
- [ ] **`Tenant.plan` vs `Subscription.plan` pueden desincronizarse:** son dos campos distintos que
      distintas pantallas leen indistintamente (Admin Panel "Usuarios" usa `Tenant.plan`; badge
      "Plan" y barra de uso del Hub usan `Subscription.plan`). Los flujos de negocio reales (upgrade,
      Yape, trial) actualizan ambos juntos correctamente — la causa más probable de la divergencia
      observada es `seed_faker_data.py::_seed_subscriptions` usando `get_or_create` con `defaults`
      que no se reaplican si la `Subscription` ya existía de una corrida anterior del seed. Decidir
      una única fuente de verdad o sincronizar ambos campos con un signal.
      _Origen: [reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md](reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md)_
- [ ] **RLS de Postgres nunca implementado:** `TenantMiddleware` ejecuta `SET app.tenant_id` en cada
      request (pensado para políticas RLS), pero no existe ningún `CREATE POLICY`/
      `ENABLE ROW LEVEL SECURITY` en las migraciones. El aislamiento real depende 100% de que cada
      vista recuerde filtrar por `tenant=request.tenant` — no hay segunda capa de defensa a nivel BD.
      _Origen: [reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md](reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md)_
- [ ] **`/team` (Hub) con i18n roto:** la página muestra literalmente `team.title`, `team.subtitle`,
      `team.members` en vez de texto traducido — faltan esas keys en el namespace `hub` de i18next.
      _Origen: [reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md](reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md)_
- [ ] **Detalle de recursos compartidos no accesible (Notas/Contactos/Snippets):**
      `NoteDetailView`/`ContactDetailView`/`CodeSnippetDetailView` siguen siendo owner-only; un
      recurso compartido se ve en el listado con su badge "Compartida" pero no se puede abrir
      individualmente. Calendario ya resolvió el caso análogo con `_get_visible_event` — aplicar el
      mismo patrón aquí si se necesita.
      _Origen: [reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md](reports/2026-07-07-colaboracion-equipo-compartir-asistentes.md)_
- [ ] **`CardEditor.test.tsx` — 2 tests preexistentes rotos, no relacionados a "Otros Enlaces":**
      "calls mutate on valid form submission" y "shows URL validation error for invalid URL" nunca
      llenan el campo `username` (`required: 'Nombre de usuario requerido'`), así que
      `handleSubmit` de react-hook-form nunca invoca `onSubmit` — confirmado reproduciendo el
      mismo fallo contra la versión commiteada del archivo, sin ningún cambio mío. Fix: agregar
      `fireEvent.change` sobre el input de username en ambos tests. _Origen: verificación de
      Tarjeta Digital "Otros Enlaces", 2026-07-03._
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
- [ ] **Bóveda — extras:** generador de contraseñas, autocompletar, importar/exportar, adjuntos
      cifrados. _Origen: feature Bóveda (fuera de alcance v1)._ (compartir ítems entre usuarios del
      tenant ya se implementó, tanto en Workspace como en Desktop — ver
      [reports/2026-07-08-compartir-desktop-sidebar.md](reports/2026-07-08-compartir-desktop-sidebar.md))
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
- [ ] **`frontend_sidebar_desktop` sin infraestructura de testing (sin `vitest`):** todo lo agregado en
      la sesión de compartir (bloques inline, selección múltiple, compartir de Bóveda) se verificó solo
      con `tsc --noEmit` + `vite build` + prueba manual — sin red de tests automatizados como tiene el
      Workspace. Evaluar si vale la pena instalar vitest+testing-library aquí dado el tamaño actual de
      la app. _Origen: [reports/2026-07-08-compartir-desktop-sidebar.md](reports/2026-07-08-compartir-desktop-sidebar.md)_
- [ ] **Anuncios — sin tracking de impresiones/clics:** no hay forma de medir efectividad de
      una campaña (cuántos la vieron, cuántos hicieron click en el CTA) ni desde el Hub (modal)
      ni desde el Desktop (tarjetas). Sería un contador incremental simple, sin tabla de eventos pesada.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md) ·
      [reports/2026-07-02-anuncios-tarjetas-desktop.md](reports/2026-07-02-anuncios-tarjetas-desktop.md)_
- [ ] **Anuncios — sin segmentación por plan del tenant:** todo tenant autenticado ve los mismos
      anuncios tanto en el Hub (modal) como en el Desktop (tarjetas); podría filtrarse por
      `tenant.plan` para mostrar ofertas de upgrade dirigidas a planes específicos.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md) ·
      [reports/2026-07-02-anuncios-tarjetas-desktop.md](reports/2026-07-02-anuncios-tarjetas-desktop.md)_
- [ ] **Anuncios (Desktop) — `HubAnnouncementsTopView` sin tests:** el nuevo endpoint `top/`
      comparte lógica con `active/` pero no tiene cobertura propia. Cubrir: placement filter,
      clamp de `limit` (>5→5), orden por priority, hit/miss de caché, invalidación tras admin mutate.
      _Origen: [reports/2026-07-02-anuncios-tarjetas-desktop.md](reports/2026-07-02-anuncios-tarjetas-desktop.md)_
- [ ] `apps/catalog` sigue sin tests — se tocó `serializers.py` en el fix de `image_url` (LL-033)
      pero no se le agregaron tests. Buen candidato para una pasada de tests aparte.
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] Migrar `AnnouncementModal` del Hub (`frontend_next_hub`) de `<img>` plano a `next/image`
      cuando `next.config.ts` tenga el dominio de medios de producción en `images.remotePatterns`
      (mejor LCP; hoy genera warning de ESLint `no-img-element`, aceptado a propósito).
      _Origen: [reports/2026-07-01-anuncios-modal-hub.md](reports/2026-07-01-anuncios-modal-hub.md)_
- [ ] **`LandingPreview.tsx` no refleja `theme_colors` en el tab Vista Previa:** el objeto
      `landingForPreview` se construye campo por campo manualmente (no es un spread de `formState`)
      y omite `theme_colors` — el usuario ve el estilo/plantilla pero no los colores personalizados
      hasta guardar y ver la landing pública. Gap preexistente, detectado al agregar `style_preset`
      a ese mismo objeto. _Origen: feature estilos preestablecidos Landing, 2026-07-02._
- [ ] **Playfair Display (preset Editorial) se precarga en TODAS las rutas de `frontend_next_vista`,
      no solo landing:** la CSS var `--font-playfair` se expone en `src/app/[locale]/layout.tsx`
      (layout raíz, compartido por dashboard/landing/tarjeta/cv/etc.), y `next/font/google` precarga
      por defecto cualquier fuente referenciada ahí sin importar si la ruta actual la usa. Confirmado
      con Network tab: el `.woff2` de Playfair (~38KB, cacheado `immutable`) se descarga incluso en
      `/es/dashboard`. Costo bajo (una vez por sesión, gzip+cache agresivo) pero evitable moviendo la
      carga de la fuente a un layout específico de la ruta pública de landing
      (`src/app/[locale]/landing/[username]/layout.tsx`, hoy no existe) en vez del layout raíz.
      _Origen: feature estilos preestablecidos Landing Fase 2, 2026-07-02._
- [ ] **Analytics — posible doble conteo de vistas por prefetch de `next/link`:** encontrado al
      verificar Landing/Portafolio tras el MVP de tracking — un par de `PageEvent` con 4ms de
      diferencia y mismo referrer/hash, consistente con que el prefetch especulativo de un
      `<Link>` interno + la navegación real generen 2 requests HTTP separados al backend (cada uno
      fuera del alcance del `React.cache()` que solo dedupe dentro del mismo request). No
      reproducido de forma controlada — hipótesis, no confirmada. No afecta navegación directa por
      URL (verificado 1:1 en Tarjeta/Landing/Portafolio/CV). Si se confirma, la solución más
      probable es detectar el header `Next-Router-Prefetch` en la request entrante a Next.js y
      omitir el tracking para esos casos. _Origen: verificación manual Analytics tracking MVP,
      2026-07-03._
- [ ] **PWA instalable (tarjeta/landing/portafolio/cv) — sin tests automatizados:** los nuevos
      Route Handlers (`manifest/route.ts`, `icon-512/route.ts`) y el componente
      `PwaInstallRegister` solo se verificaron manualmente vía `curl` contra el contenedor de
      dev real. Cubrir con tests: manifest devuelve 404 si el perfil no existe, colores/nombre
      correctos por feature, ícono responde PNG con el tamaño esperado.
      _Origen: [reports/2026-07-03-digisider-branding-pwa-vistas-publicas.md](reports/2026-07-03-digisider-branding-pwa-vistas-publicas.md)_

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
