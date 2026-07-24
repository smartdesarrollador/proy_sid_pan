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

- **2026-07-21 — Fix: upgrade de plan daba `405` en producción al enviar el comprobante Yape** ✅
  `useYapeUpgrade.ts` llamaba `POST /admin/subscriptions/yape-upgrade` (sin trailing slash)
  confiando en que el rewrite de `next.config.ts` la agregaría (convención de LL-005) — cierto
  solo en dev, donde `NEXT_PUBLIC_API_URL` está vacía y el cliente pasa por el proxy. En
  producción esa var es el dominio absoluto del backend (`api-rbac.digisider.com`), así que el
  Hub llama **directo** a Django sin pasar por ningún rewrite → `path('yape-upgrade/', ...)` no
  matcheaba → `APPEND_SLASH` → 405 (confirmado con curl directo a Django: sin slash 500, con
  slash 401/ruta correcta). Fix: agregar el slash en el cliente. Verificado que sigue funcionando
  también en dev (a través del proxy) con un upgrade real end-to-end en navegador.
  _→ [LL-001 (caso agregado)](.claude/skills/lessons-learned/references/knowledge-base.md) ·
  advertencia agregada a LL-005 para no repetir la generalización_

- **2026-07-19/20 — Feature: cupones de descuento en el registro y en el upgrade de plan (pago Yape)** ✅
  8 fases (PRD + backend `apps/promotions` + integración Yape + Admin + Hub + upgrade de plan):
  monto **siempre** calculado en servidor (cierra la vulnerabilidad del `amount` confiado del
  cliente, tanto en registro como en upgrade), canje ligado al comprobante (confirma al aprobar,
  libera al rechazar, activación directa si el cupón cubre el 100% del plan), UI de cupón en
  `YapePaymentStep`/`YapeUpgradeStep` del Hub y en Promociones/Comprobantes del Admin, desglose del
  cupón en el mensaje de Telegram (`workflows/yape-payment-verification.json`). Verificado E2E en
  navegador contra backend real en cada fase. Suites backend (140+ tests) y frontend (Hub 77 tests,
  Admin promotions/yape) en verde.
  _→ [PRD](prd/features/promo-codes-registro.md) ·
  [LL-101](.claude/skills/lessons-learned/references/knowledge-base.md) ·
  [LL-102](.claude/skills/lessons-learned/references/knowledge-base.md) ·
  [LL-103](.claude/skills/lessons-learned/references/knowledge-base.md)_

- **2026-07-19 — Feature: sin sesión, los iconos del Desktop redirigen al panel de Perfil** ✅
  Sin autenticar, clickear cualquier icono de la tira abría su panel con el mensaje "Inicia
  sesión para ver tus X" sin acción posible. Ahora `App.tsx` resuelve el destino
  (`resolvePanel`): sin sesión todo redirige a Perfil (botón "Iniciar sesión" a la mano),
  excepto `AUTH_FREE_PANELS = ["profile", "settings", "tools"]` que funcionan sin login
  (decisión del usuario). Al redirigir no aplica el toggle (clickear otro icono con Perfil
  abierto no colapsa el panel); cubre clicks de la tira y navegación vía `pendingPanel`
  (Home/Search/fijados). Verificado en navegador ambas ramas (sin sesión → Perfil resaltado;
  con sesión seed local → navegación normal). Nota de entorno descubierta al verificar: el
  `.env` de dev del Desktop apunta `VITE_API_URL` a **prod** (`api-rbac.digisider.com`) — para
  probar contra el backend local: `$env:VITE_API_URL='http://rbac.local.test'; npm run dev`.
  `tsc` + `vite build` limpios.

---

## Pendientes activos

> Lo inmediato — lo primero que se retoma la próxima vez que se abre el proyecto.

- [ ] **Cuota de almacenamiento real en Vista — Fases 1-6 implementadas (sin commitear), pendiente
      prueba en vivo final + commit.** Antes la cuota `storage_gb` del plan (Free 1 GB, editable en
      Gestión de Planes) no reflejaba lo de Vista: las imágenes eran `URLField` externos que no
      ocupaban cuota. Ahora: modelo `DigitalAsset` (broker de subidas con `ImageField`) que cuenta
      hacia `storage_gb` vía `get_tenant_storage_bytes` (única fuente de verdad, la heredan Hub y
      analytics); categoría `digital_asset` en `utils/uploads.py` (valida tipo real + tope de plan +
      cuota, **402** si excede, SVG excluido); endpoints `POST/GET/DELETE /api/v1/app/digital/assets/`
      (aislados por dueño, auditados); ciclo de vida (signal `post_delete` borra el binario + GC
      Celery nocturno de huérfanos >24 h); UI de subida real en Vista (avatar, OG, portafolio
      cover+galería, con fallback de URL externa); indicador de uso en el Dashboard del Hub. **Sin
      commitear.** Pendiente: prueba en vivo (subir/borrar imagen en Vista, ver la barra del Hub
      moverse, forzar el 402 con cuota llena) y commit. Baseline de tests: backend `digital_services`
      (85+) + `audit` verde, Vista 64, Hub 82; 10 fallos backend preexistentes ajenos (throttle).
      _Origen: consulta sobre si el límite de almacenamiento del Admin se respetaba de verdad,
      2026-07-23 — ver [PRD](prd/features/cuota-almacenamiento-real-vista.md),
      [ADR-007](docs/adr/007-almacenamiento-gestionado-cuota.md) y
      [LL-105](.claude/skills/lessons-learned/references/knowledge-base.md)._
- [ ] **Límites centralizados de archivos e imágenes por plan — Fases 1-5 implementadas (sin
      commitear), pendiente prueba en vivo final + commit.** Hecho en el árbol de trabajo:
      `utils/uploads.py` (whitelist de tipos + magic bytes + tope duro por categoría), claves
      `max_image_upload_mb`/`max_file_upload_mb` por plan editables desde `PlanEditModal`, migración
      de los **7 puntos de subida** al validador (cerrado el agujero del `.exe` como logo/comprobante),
      `FeaturesView`/`PlanLimitsSerializer` exponen las claves, y consumo dinámico en el chat de
      Workspace y Desktop (+ `accept`). La **Fase 6 (Vista) se descartó**: Vista no sube archivos y su
      gating no es editable desde el Admin (ver PRD). **Pendiente:** una pasada de prueba en vivo con
      un usuario cliente (chat Workspace/Desktop) y luego commit. Baseline de tests: 930 backend +
      Workspace chat verde; 10 fallos backend preexistentes ajenos a la feature (ver deuda técnica).
      _Origen: revisión de la subida de adjuntos del chat del Workspace, 2026-07-22._
      _→ [PRD](prd/features/limites-archivos-por-plan.md)_
- [ ] **Reimportar/activar en n8n el workflow `workflows/yape-payment-verification.json`
      actualizado** (agrega el desglose de cupón + tipo de cambio real al mensaje de Telegram, en
      vez del 3.75 hardcodeado): desactivar el workflow viejo y activar el importado (mismo
      webhook path `yape-payment` — no pueden estar los dos activos a la vez), verificar que la
      credencial de OpenAI quede asignada al nodo "Analizar con OpenAI Vision".
      _Origen: feature cupones de descuento, 2026-07-20._
- [ ] **Probar en el entorno real la nueva ubicación izquierda de la barra del Desktop:**
      Configuración → "Ubicación de la barra" → Izquierda → "Aplicar ahora" (recarga el WebView,
      ya no reinicia el proceso — ver LL-099), y verificar
      (1) anclaje AppBar al borde izquierdo con área de trabajo reservada (maximizar una ventana
      no la tapa), (2) panel abriéndose hacia la derecha de los iconos, (3) resize arrastrando el
      borde derecho del panel + slider "Ancho del panel" en vivo, (4) tooltips desplegando hacia
      la derecha, (5) volver a Derecha + reiniciar restaura el comportamiento original. Compilado
      (`tsc` + `cargo check`) pero sin prueba interactiva del anclaje Win32.
      _Origen: feature ubicación configurable de la barra, 2026-07-18._
- [ ] **Quitar los 10 iconos temporales de prueba del `IconStrip` del Desktop** cuando el usuario
      termine su demostración: buscar `TEMP-SCROLL-TEST` en
      `apps/frontend_sidebar_desktop/src/components/IconStrip.tsx` (import de lucide, constante
      `TEMP_TEST_ITEMS` y su bloque de render). Su click es no-op; solo rellenan para forzar scroll.
      _Origen: [reports/2026-07-13-scroll-iconos-sidebar-desktop.md](reports/2026-07-13-scroll-iconos-sidebar-desktop.md)_
- [ ] **Validar el ciclo suspender→reanudar del sidebar Desktop (AppBar) en el build de
      producción**, no solo en dev: en dev depende de Vite vivo; en prod el frontend va embebido,
      así que el fix de recreación de la ventana WebView2 (ver LL-095) no quedó probado ahí.
      _Origen: [reports/2026-07-13-appbar-suspend-resume-desktop.md](reports/2026-07-13-appbar-suspend-resume-desktop.md)_
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

- [ ] **Cuota de almacenamiento real — piezas diferidas de la feature (v1 cubrió avatar/OG/portafolio):**
      (a) **Subidas de Landing y CV**: `landing_image` (imágenes dentro del JSON `sections`) y
      `cv_photo` (hoy la foto de CV = el `avatar_url` del perfil, sin campo propio) quedaron fuera de
      v1 y están **excluidos del GC** (`apps/digital_services/tasks.py::_COLLECTABLE_SLOTS`) porque su
      referencia no se rastrea. Para cablearlas hay que extender el colector de referencias del GC a
      las secciones JSON de landing / añadir un campo de foto de CV + su referencia; si no, esos
      assets nunca se recolectan. (b) **Contabilizar texto de Workspace** (notas, snippets, tareas)
      hacia la cuota — descartado en v1 (el texto casi nunca mueve la aguja del GB). (c) **Denormalizar
      `Tenant.storage_bytes_used`** con signals + recálculo nocturno si se suman más fuentes: hoy
      `get_tenant_storage_bytes` agrega en vivo en cada subida, aceptable con una sola fuente nueva.
      (d) **Backfill** de las URLs externas de Vista ya existentes a assets gestionados (opcional).
      _Origen: Fase 6 de la feature de cuota real, 2026-07-23 — ver
      [PRD](prd/features/cuota-almacenamiento-real-vista.md) § Fuera de Alcance._
- [ ] **Vista duplica el mapa plan→features en `FEATURES_BY_PLAN` (`frontend_next_vista/src/data/featureGates.ts`, ~26 claves):**
      es una tabla hardcodeada paralela al `PLAN_FEATURES` del backend, con riesgo de que ambas
      deriven. No se unificó en la feature de límites de subida porque (a) el Admin no edita feature
      flags, solo límites numéricos, así que consumir `/features/` no volvería nada editable; (b) el
      endpoint solo expone ~7 flags gruesos de servicios digitales, no las ~26 claves finas de Vista
      (`landingTemplates`, `cvTemplates`, `maxProjects`…). Unificar de verdad exigiría **ampliar el
      backend**: mover esas 26 claves a `PLAN_FEATURES`, exponerlas en `FeaturesView`, y —si además se
      quieren editables— añadirlas a `PlanLimitsSerializer` + `PlanEditModal`. Refactor opcional, no
      bloqueante. `currentPlan` de Vista ya viene del backend (`user.tenant_plan`), así que el plan
      en sí no está duplicado, solo el mapeo plan→feature.
      _Origen: Fase 6 (descartada) de la feature de límites de subida, 2026-07-22 — ver
      [PRD](prd/features/limites-archivos-por-plan.md) § "Nota sobre Vista"._
- [ ] **`/media/` se sirve sin autenticación ni aislamiento por tenant:** `config/urls.py:118-120`
      monta `django.views.static.serve` para toda la ruta `^media/`, sin importar `DEBUG`.
      Cualquiera con la URL descarga el archivo — sin sesión y sin verificar pertenencia al tenant —
      y esas URLs se filtran en el JSON de los mensajes (`apps/chat/serializers.py:38-47`). Los
      nombres son poco adivinables por el `upload_to`, lo que reduce pero no elimina el riesgo;
      afecta adjuntos de chat, logos y **comprobantes de pago Yape**. El PRD de límites de archivos
      mitiga el vector prohibiendo tipos ejecutables en el navegador (SVG/HTML), pero no lo cierra:
      el fix real es servir los adjuntos tras autenticación validando el tenant, y toca
      Traefik/nginx además de las URLs que arma el serializer.
      _Origen: auditoría de subidas del chat, 2026-07-22 — ver
      [PRD](prd/features/limites-archivos-por-plan.md) § Seguridad._
- [ ] **`OrganizationView` devuelve 500 si la petición no trae `X-Tenant-Slug`:**
      `TenantMiddleware._resolve_tenant` (`apps/tenants/middleware.py:32-36`) resuelve el tenant
      **solo** desde ese header, sin fallback a `request.user.tenant`; si falta, `request.tenant`
      queda en `None` y el `PATCH` de `apps/tenants/admin_views.py` revienta al usar el tenant
      (antes con `AttributeError` dentro de `check_storage_limit`, ahora con el `ValueError` del
      validador central). El `GET` sí responde 200. Los frontends siempre mandan el header, así
      que no se ve en la práctica, pero un endpoint autenticado no debería dar 500 ante una
      petición malformada: corresponde un 400 explícito, como ya hace
      `yape_upgrade_views.py:57-62` (`if not tenant: return 400`).
      _Origen: verificación con curl de la Fase 2 de límites de archivos, 2026-07-22._
- [ ] **10 tests del backend fallan en `main`, sin relación con la feature en curso:** `pytest`
      completo da **922 passed / 10 failed**. Se verificó que son preexistentes restaurando
      `utils/plans.py` a HEAD y reproduciendo exactamente los mismos 10 fallos. Impide cumplir la
      regla del repo de "correr `make test` antes de commitear" en verde, y — más grave — normaliza
      la suite en rojo, con lo que un fallo *nuevo* pasa desapercibido. Tres grupos independientes:

      1. **`apps/auth_app/tests/test_throttles.py::RateLimitFunctionalTest` (5 tests)** — los tests
         asumen que la **3ª** petición ya devuelve 429, es decir un rate de `2/minute`, pero
         `config/settings/base.py:198-207` configura `login: 5/minute`, `mfa: 5/minute`,
         `register: 10/hour`, `forgot_password: 5/hour`. La 3ª petición devuelve 400 (credenciales
         malas), no 429. La clase además **no lleva** el `@override_settings(CACHES=_LOCMEM_CACHE)`
         que el propio módulo define, así que cuenta contra Redis real. Fix probable: decorar la
         clase con rates de test explícitos (`DEFAULT_THROTTLE_RATES` con `2/minute`) + el locmem,
         en vez de depender de los rates de producción.
      2. **`apps/support/tests/test_support.py` (2 tests)** — 403 al listar/comentar tickets
         propios. Coincide exactamente con
         [LL-061](.claude/skills/lessons-learned/references/knowledge-base.md) (permisos no
         sembrados → rol Owner inexistente o permiso ausente del fixture de `seed_permissions`).
         Empezar por ahí antes de depurar la vista.
      3. **`apps/chat_assistant/tests/test_chat.py` (3 tests)** — la vista devuelve 400 donde el
         test espera 404 (token inválido) o 429 (límite de sesiones). Sin diagnóstico aún; la
         hipótesis a verificar es que la validación del serializer corre **antes** del lookup del
         token, convirtiendo un "no existe" en un "payload inválido".

      _Origen: verificación de la Fase 1 de límites de archivos, 2026-07-22 — los fallos no los
      introdujo esa fase._
- [ ] **`DashboardPageClient` (Hub) sin test para el handoff de escritorio:** se cubrió el hook
      `useDesktopHandoff` con tests unitarios (3 casos: sin params, sin sesión válida, con sesión
      activa), pero no se agregó un test de integración de la página del dashboard porque el
      proyecto no tiene un patrón existente de mock de `react-i18next` en tests a nivel de página
      (todas usan `useTranslation` sin mock establecido). Agregar si se define ese patrón, o
      mockear puntualmente `react-i18next` en ese test.
      _Origen: fix "sesión web bloqueaba re-login desktop", 2026-07-14 — ver
      [LL-098](.claude/skills/lessons-learned/references/knowledge-base.md)._
- [ ] **Pills de lenguaje de Snippets (Desktop) ya no reflejan uso real:** al migrar a paginación
      server-side se optó por mostrar siempre los 14 valores fijos del enum `language` en vez de
      filtrar por presencia (como sí hacen categorías/grupos/tags en notes/bookmarks/contacts, que
      tienen conteo server-side) — evita 14 requests paralelas por carga/búsqueda, a costa de un
      cambio de UX menor. Revertir a filtrar por presencia si se agrega un endpoint de "lenguajes
      usados" en el backend. _Origen: [reports/2026-07-14-paginacion-server-side-desktop-6-secciones.md](reports/2026-07-14-paginacion-server-side-desktop-6-secciones.md)_
- [ ] **`BookmarkListCreateView.get` pierde el filtro de colección al combinarlo con `search`:**
      `qs.filter(title__icontains=search) | Bookmark.objects.filter(tenant=..., user=...,
      url__icontains=search)` — el segundo lado del OR es un queryset nuevo desde cero que no
      hereda el filtro `collection__pk=...` ya aplicado a `qs`. Buscar por texto que matchea la URL
      con una colección seleccionada devuelve también bookmarks de otras colecciones. Bug
      preexistente, independiente de la paginación (no lo introduce ni lo empeora).
      _Origen: descubierto al implementar paginación server-side de Bookmarks, 2026-07-13._
- [ ] **Solo el rol `Owner` puede crear/ver tickets de soporte propios en el Hub — Member/Viewer/
      Service Manager tienen 0 permisos `support.*` en los fixtures del sistema.** Confirmado que
      "Soporte" es visible en el navbar del Hub para **cualquier** usuario del tenant, pero un
      Member recibe 403 tanto al crear como al listar (ver [LL-093](.claude/skills/lessons-learned/references/knowledge-base.md),
      [LL-094](.claude/skills/lessons-learned/references/knowledge-base.md)). El código interno
      (`_get_ticket`, `TicketListCreateView.get`) ya tiene la lógica de "cliente ve solo sus propios
      tickets" lista para usarse, pero el `permission_classes = [HasPermission('support.read')]` a
      nivel de clase bloquea antes de llegar ahí. Decidido explícitamente por el usuario **no**
      cambiar esto ahora — solo se mejoró el mensaje de error (LL-094). Pendiente decidir: ¿debería
      cualquier miembro autenticado poder crear/ver sus propios tickets (recomendado, ya que "pedir
      ayuda" no es una acción privilegiada), o se prefiere seguir restringiéndolo solo a Owner /
      asignar el permiso a más roles vía seed?
      _Origen: reporte de usuario "se queda congelado" al enviar ticket, 2026-07-10._

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
      `team.members` en vez de texto traducido. Causa raíz real (confirmada al arreglar el mismo bug
      en `/support`, ver [LL-092](.claude/skills/lessons-learned/references/knowledge-base.md)):
      `TeamPageClient.tsx` usa `useTranslation('hub')`, namespace que **no existe** en
      `i18n/config.ts` (solo existe `'team'`, con claves planas sin prefijo). Fix: mismo patrón que
      support — `useTranslation('team')` + quitar el prefijo `team.` de cada `t('team.xxx')`.
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
- [ ] 2 tests pre-existentes fallando en `apps/support`, sin relación con nada tocado recientemente
      (confirmado en cada corrida de la suite completa durante la sesión de Analytics, 2026-07-12):
      `test_client_sees_only_own_ticket` + `test_comment_role_client_for_regular_user` (usuarios
      regulares sin rol `support.read` asignado reciben 403 en lugar de poder ver sus propios tickets).
      _(Los 2 tests de analytics que antes estaban en este ítem — `test_summary_returns_metrics_keys`
      y el equivalente de resource_breakdown — ya pasan; se quitaron de aquí.)_
- [ ] Cuando un usuario tiene `is_active=False`, el login devuelve "Credenciales inválidas" en
      lugar de "Cuenta suspendida". Comportamiento intencional por seguridad (no revelar si la
      cuenta existe), pero considerar agregar un mensaje más descriptivo cuando el email SÍ existe
      y la cuenta está explícitamente suspendida por un admin.

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
- [ ] **`api_calls_per_month` de los planes nunca se mide ni se aplica:** `api_calls.current`
      está hardcodeado a `0` en `apps/tenants/serializers.py` y `apps/subscriptions/serializers.py`
      — no hay ningún contador de llamadas API por tenant ni middleware que lo incremente. El
      medidor correspondiente del Admin Panel siempre muestra 0% de uso y el límite mensual
      (1,000 Free / 10,000 Starter / 100,000 Professional) nunca se aplica. Requiere un contador
      persistente (Redis con reset mensual, o un middleware que incremente por request) y decidir
      qué se considera "llamada API" (¿todo `/api/v1/app/`? ¿excluyendo polling de notificaciones?).
      `storage_gb` (el otro límite operacional detectado en la misma auditoría) ya se corrigió —
      ver "3 Últimas tareas realizadas", 2026-07-11.
      _Origen: auditoría de límites de plan vs "Gestión de Planes" (Admin), 2026-07-11 — ver
      [LL-047](.claude/skills/lessons-learned/references/knowledge-base.md)._
- [ ] **Backend de Stripe queda como código muerto tras consolidar el Hub en el flujo Yape:**
      `StripeClient`, `UpgradeSubscriptionView`, `PaymentMethodListView._create_stripe_method` y el
      webhook de Stripe siguen intactos pero sin ningún consumidor real en el frontend (ADR-004
      confirma que Yape es el único mecanismo de pago de este proyecto). Evaluar si se retoma
      Stripe a futuro (mantener) o se limpia del todo (borrar `StripeClient`, las vistas, el
      webhook y `STRIPE_*` de settings).
      _Origen: fix "plan del tenant desincronizado en el Hub", 2026-07-11. Confirmado de nuevo al
      arreglar "Historial de facturas" vacío — ver
      [reports/2026-07-11-hub-billing-facturas-invoice-yape.md](reports/2026-07-11-hub-billing-facturas-invoice-yape.md)._
- [ ] **`ClientSubscriptionSerializer.get_mrr` usa un `PLAN_MRR_MAP` hardcodeado, no
      `Plan.price_monthly` real:** mismo tipo de deuda que "límites de plan editables" cerró
      parcialmente (esa feature hizo editables los límites técnicos, no el MRR mostrado en el
      Admin "Clientes") — si se edita el precio de un plan desde "Gestión de Planes", el MRR de
      Clientes sigue mostrando el valor viejo hardcodeado.
      _Origen: fix "plan del tenant desincronizado en el Hub", 2026-07-11._
- [ ] **El flujo Yape (upgrade real de plan) no soporta facturación anual:** la página Suscripción
      tiene un toggle Mensual/Anual, pero `YapeUpgradeStep`/`useYapeUpgrade` solo manejan el precio
      mensual — nunca lo soportó, ni siquiera el botón "Actualizar" del Dashboard antes de este
      fix. Decidir si vale la pena agregar el ciclo anual al comprobante Yape (monto distinto,
      `billing_cycle` en el payload) o si se quita el toggle mientras no se soporte.
      _Origen: fix "plan del tenant desincronizado en el Hub", 2026-07-11._
- [ ] **`YapeRejectView.post` (rama rechazo) duplica lógica con la rama `rejected` de
      `YapeProofReviewView.patch`:** mismo tipo de duplicación que tenía la rama `approved` (ya
      resuelta extrayendo `activate_yape_proof()` a `apps/subscriptions/services.py`). Extraer un
      `reject_yape_proof()` análogo por consistencia — no es urgente porque no genera bugs, solo
      deuda de duplicación (a diferencia de la rama aprobación, el rechazo no tiene ningún efecto
      de negocio que se esté perdiendo).
      _Origen: [reports/2026-07-11-hub-billing-facturas-invoice-yape.md](reports/2026-07-11-hub-billing-facturas-invoice-yape.md)_
- [ ] **Ventana de doble-aprobación concurrente en `YapeProofReviewView`/`YapeActivateView`:** el
      `.get()` del `YapePaymentProof` no usa `select_for_update()`, así que dos requests
      simultáneas con `proof.status == 'pending'` en ambas lecturas podrían intentar aprobar el
      mismo proof dos veces. Hoy la unicidad de `Invoice.stripe_invoice_id` actúa como red de
      seguridad, pero la segunda aprobación devolvería un `IntegrityError` (500) en vez de un error
      controlado. Agregar `select_for_update()` dentro de un `transaction.atomic()` que envuelva
      también la lectura del proof (hoy el atomic solo envuelve la escritura, vía
      `activate_yape_proof()`).
      _Origen: [reports/2026-07-11-hub-billing-facturas-invoice-yape.md](reports/2026-07-11-hub-billing-facturas-invoice-yape.md)_
- [ ] **Yape sin expiración automática de período:** un tenant que deja de pagar mantiene su plan
      pagado indefinidamente — `Subscription.status` nunca se degrada cuando `current_period_end`
      vence sin renovación (solo existe `expire_professional_trials`, para trials, no para planes
      pagados vencidos). Afecta feature-gating real, no solo las métricas de MRR/churn del Admin
      Panel (que ya evitan este problema calculando desde `Invoice`, no desde `Subscription.status`).
      _Origen: [reports/2026-07-12-analytics-cross-tenant-admin-panel.md](reports/2026-07-12-analytics-cross-tenant-admin-panel.md)_
- [ ] **`trial_conversions` (Admin Analytics) es una aproximación:** se calcula por la primera
      factura pagada de cada tenant, no puede distinguir "convirtió desde trial" de "primer pago
      tras un tiempo en plan free" — no existe un log de eventos de transición de plan.
      _Origen: [reports/2026-07-12-analytics-cross-tenant-admin-panel.md](reports/2026-07-12-analytics-cross-tenant-admin-panel.md)_
- [ ] **`UsageTrendsChart` (Admin Analytics) con contrato desalineado:** tras corregir el prefijo
      `/app/` de `useTrends.ts` el gráfico ya llega a datos reales, pero `_compute_trends` devuelve
      `{active_tasks, completed_tasks, new_projects}` y el componente pinta `active_users`/
      `new_projects`/`api_requests` — dos de tres líneas quedan vacías. Mismo tipo de deuda que el
      botón Exportar (`analytics_export` vs. `pdf_export`, ver ítem "Reportes — transversales +
      export ejecutivo" arriba).
      _Origen: [reports/2026-07-12-analytics-cross-tenant-admin-panel.md](reports/2026-07-12-analytics-cross-tenant-admin-panel.md)_
- [ ] **Permisos RBAC `customers.create`/`update`/`delete`/`export` sin usar:** sembrados junto a
      `customers.read`/`suspend`/`analytics` (que sí se usan, los últimos 4 en el Admin Panel) pero
      sin ninguna vista que los consuma todavía.
      _Origen: [reports/2026-07-12-analytics-cross-tenant-admin-panel.md](reports/2026-07-12-analytics-cross-tenant-admin-panel.md)_
- [ ] **Auditar otros hooks de `frontend_next_hub` (y `frontend_next_vista`/`frontend_workspace`
      si aplica) contra el mismo bug de trailing slash que rompió `useYapeUpgrade` en
      producción:** cualquier hook que llame una URL **sin** slash confiando en que el rewrite de
      `next.config.ts` la agregue (convención de LL-002/LL-005) puede estar rota en producción,
      donde `NEXT_PUBLIC_API_URL` es el dominio absoluto del backend y el rewrite nunca se
      ejecuta (ver LL-001, causa raíz). Verificar con `curl` directo a Django (no contra el proxy
      del Hub) que cada endpoint bajo `/admin/`, `/app/` coincide exacto con su `path()` real.
      _Origen: fix "405 en upgrade de plan en producción", 2026-07-21._
- [ ] **Token del bot de Telegram hardcodeado en `workflows/yape-payment-verification.json`
      (versionado en git):** cualquiera con acceso al repo puede controlar el bot. Revocar el
      token actual con @BotFather y migrar los nodos HTTP Request a la credencial nativa de
      Telegram de n8n (o una variable de entorno de n8n), no una URL con el token inline.
      _Origen: feature cupones de descuento, revisión del workflow n8n, 2026-07-20._
- [ ] **Cupón de descuento 100% en el upgrade de plan no activa directo (a diferencia del
      registro):** `YapeUpgradeView` deja el monto en $0 pero sigue exigiendo subir un
      comprobante — decisión deliberada para no ampliar el alcance de la Fase A/B, pero es
      inconsistente con el registro (que sí tiene `yape-activate-free`). Si se quiere paridad,
      replicar el mismo endpoint de activación directa para el flujo de upgrade.
      _Origen: feature cupones de descuento, Fase B, 2026-07-20._
- [ ] **5 tests de rate-limiting preexistentes fallando en `apps/auth_app/tests/test_throttles.py`**
      (`RateLimitFunctionalTest`, ej. `test_login_rate_limit_returns_429`): fallan igual en
      aislamiento, sin relación con la feature de cupones — se reconfirmó en cada corrida de la
      suite completa del backend durante las 8 fases. No investigado a fondo.
      _Origen: detectado repetidamente durante feature cupones de descuento, 2026-07-19/20._

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
