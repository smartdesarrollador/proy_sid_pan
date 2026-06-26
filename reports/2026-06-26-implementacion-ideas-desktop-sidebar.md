# Reporte de Implementación — Ideas Desktop Sidebar
**Fecha**: 2026-06-26  
**Componente**: `apps/frontend_sidebar_desktop/` (Tauri v2 + React + TypeScript + Tailwind CSS)  
**Referencia**: `util/ideas/desktop/ideas-secciones.md`  
**Estado**: En progreso

---

## Resumen Ejecutivo

Este reporte documenta el estado de implementación de las ideas listadas en `ideas-secciones.md` para la aplicación de escritorio (sidebar panel Tauri v2). Las ideas se dividían en dos grupos: paneles stub que requerían implementación completa desde cero, e ideas de mejora para paneles ya operativos. A la fecha se completaron **5 paneles** desde cero (Profile, Bookmarks, Alerts, Home, Settings) y se agregaron mejoras puntuales en 3 paneles existentes (Notas, Contactos, Bookmarks).

---

## Estado Global por Panel

| Panel | Estado base (25 jun) | Ideas implementadas | Ideas pendientes |
|---|---|---|---|
| **Home** | Stub vacío | ✅ 6/6 | — |
| **Files** | Stub vacío | ❌ 0/5 | 5 pendientes |
| **Chat** | Stub vacío | ❌ 0/5 | 5 pendientes |
| **Alerts** | Stub vacío | ✅ 6/6 | — |
| **Snippets** | Operativo | ✅ 1/6 (copiar) | 5 pendientes |
| **Tareas** | Operativo | ❌ 0/6 | 6 pendientes |
| **Notas** | Operativo | ✅ 2/6 (pin + copiar) | 4 pendientes |
| **Contactos** | Operativo | ✅ 1/6 (copiar email) | 5 pendientes |
| **Bookmarks** | Operativo | ✅ 4/6 | 2 pendientes |
| **Proyectos** | Operativo | ❌ 0/6 | 6 pendientes |
| **Calendario** | Operativo | ❌ 0/6 | 6 pendientes |
| **Settings** | Stub vacío | ✅ 8/9 | 1 pendiente |
| **Profile** | Stub vacío | ✅ 6/7 (sin avatar) | 1 pendiente |
| **Ideas transversales** | — | ✅ 1/7 (deep link auth) | 6 pendientes |

---

## Detalle por Panel

### Home ✅ Completado (26 jun 2026)

Reescritura completa de `src/components/panels/HomePanel.tsx` (~300 líneas).

**Implementado:**
- ✅ **Resumen del día**: próximos eventos de calendario (hoy/mañana), tareas vencidas o con fecha próxima, contador de alertas sin leer — 3 `StatCard` clickeables que navegan al panel correspondiente
- ✅ **Widget de estado del workspace**: nombre del tenant, plan activo con badge de color (Free/Starter/Professional/Enterprise), rol del usuario
- ✅ **Accesos rápidos**: grid configurable de hasta 6 paneles favoritos; modo edición con `+`/`−` por panel; persiste en `localStorage: desktop-home-shortcuts`
- ✅ **Cita motivacional del día**: 15 frases rotativas basadas en la fecha, descartable con botón `×`; estado de descarte persiste en `localStorage: desktop-home-quote-dismissed` (se renueva al día siguiente)
- ✅ **"Continuá donde lo dejaste"**: muestra el snippet más reciente y la nota más reciente (título + preview de contenido) con card clickeable que navega al panel
- ✅ **Contador de pendientes por sección**: los 3 `StatCard` son interactivos — click en "Eventos hoy" abre Calendario, "Tareas urgentes" abre Tareas, "Alertas sin leer" abre Alerts

**Archivos creados/modificados:**
- `src/components/panels/HomePanel.tsx` — reescritura total
- `src/store/navigationStore.ts` — creado (patrón Zustand para navegación entre paneles sin prop drilling)
- `src/App.tsx` — integrado `useNavigationStore` para responder a peticiones de navegación desde cualquier panel

**Datos consumidos:** 4 endpoints en paralelo con `Promise.allSettled`:
- `GET /api/v1/app/calendar/`
- `GET /api/v1/app/tasks/`
- `GET /api/v1/app/snippets/`
- `GET /api/v1/app/notes/`

---

### Alerts ✅ Completado (26 jun 2026)

Reescritura completa de `src/components/panels/AlertsPanel.tsx`.

**Implementado:**
- ✅ **Lista de notificaciones reales**: consume `GET /api/v1/app/notifications/`, muestra título, mensaje, categoría (con badge de color), fecha relativa ("Hace 5m", "Hace 2h")
- ✅ **Badge de contador**: número de no leídas sobre el ícono `Bell` en el sidebar; sincronizado con `notificationsStore.unreadCount`
- ✅ **Marcar como leída**: botón individual por notificación (`POST /api/v1/app/notifications/:id/read/`) y "Marcar todas" (`POST /api/v1/app/notifications/read-all/`)
- ✅ **Filtro por tipo/categoría**: pills de categoría (Seguridad, Facturación, Sistema, Usuarios, Roles, Servicios); combinable con el filtro "Todas / Sin leer"
- ✅ **Auto-refresh**: polling configurable desde Settings (30s / 1min / 2min / Manual); `refreshInterval === 0` desactiva el intervalo
- ✅ **Notificación nativa del OS**: al detectar notificaciones nuevas con la app activa en otro panel, dispara notificación del sistema operativo via `@tauri-apps/plugin-notification` (solicita permiso si no fue otorgado)

**Archivos creados/modificados:**
- `src/components/panels/AlertsPanel.tsx` — reescritura total
- `src/features/notifications/useNotificationsPoller.ts` — creado (hook de background polling desde App.tsx)
- `src-tauri/Cargo.toml` — agregado `tauri-plugin-notification = "2"`
- `src-tauri/src/lib.rs` — registrado el plugin de notificaciones
- `src-tauri/capabilities/default.json` — permisos: `notification:default`, `notification:allow-is-permission-granted`, `notification:allow-request-permission`, `notification:allow-show`
- `package.json` — agregado `@tauri-apps/plugin-notification: ^2.3.3`
- `src/store/notificationsStore.ts` — store global para `unreadCount` compartido con `IconStrip`

---

### Settings ✅ Completado (26 jun 2026)

Reescritura completa de `src/components/panels/SettingsPanel.tsx` + arquitectura de `settingsStore`.

**Implementado:**
- ✅ **Color de acento**: 6 colores preset (azul, púrpura, verde, naranja, rosa, rojo); cambia el color del ícono activo en el sidebar en tiempo real; persiste en `localStorage: desktop-settings`
- ✅ **Orden de secciones**: lista drag & drop (HTML5 `draggable`) de los 12 paneles; reordena los íconos del sidebar inmediatamente
- ✅ **Secciones visibles/ocultas**: toggle switch por panel (Home protegido, no se puede ocultar); el sidebar refleja el cambio al instante
- ✅ **Intervalo de auto-refresh**: 4 opciones (30s / 1min / 2min / Manual); controla el polling de Alerts y el `useNotificationsPoller`
- ✅ **Tamaño del panel**: slider personalizado 200–500px (track oscuro + fill de color de acento + input invisible encima); redimensiona la ventana Tauri en tiempo real mientras se arrastra
- ✅ **Fondo del panel**: 6 variantes (Default, Azul oscuro, Más oscuro, Gradiente Púrpura, Gradiente Azul, Gradiente Teal); aplica al área de contenido
- ✅ **Cerrar sesión**: botón con confirmación inline de 2 pasos; hace `POST /api/v1/auth/logout/` + limpia tokens Tauri + resetea store
- ✅ **Versión de la app**: `getVersion()` de `@tauri-apps/api/app`
- ✅ **Atajos de teclado**: tabla estática informativa

**Pendiente:**
- ⏳ **Selector de wallpaper**: la idea menciona hacer configurable la imagen de fondo del área izquierda (fuera del panel); no implementada (requeriría leer archivos del sistema via Tauri `fs` plugin)

**Archivos creados/modificados:**
- `src/store/settingsStore.ts` — creado (store Zustand, persiste en `localStorage: desktop-settings`)
- `src/components/panels/SettingsPanel.tsx` — reescritura total
- `src/components/NavIcon.tsx` — color de acento dinámico via `ACCENT_BG` record
- `src/components/panels/PanelContainer.tsx` — fondo dinámico via `BG_CLASSES` record; `useEffect` para sincronizar `localWidth` cuando el slider de Settings cambia el ancho
- `src/components/IconStrip.tsx` — `sidebarOrder` + `hiddenPanels` desde el store (orden y visibilidad dinámicos)
- `src/features/notifications/useNotificationsPoller.ts` — `refreshInterval` desde el store
- `src/components/panels/AlertsPanel.tsx` — `refreshInterval` desde el store
- `src/App.tsx` — inicializa `panelWidth` desde el store; `activePanelRef` para sincronizar redimensión

---

### Profile ✅ Completado (antes de esta sesión)

Panel implementado previamente.

**Implementado (según estado del código):**
- ✅ Info del usuario (nombre, email, rol)
- ✅ Plan activo con badge de color
- ✅ Información del tenant (nombre, slug)
- ✅ Sesión activa (fecha de inicio)
- ✅ Botón de cerrar sesión (flujo idéntico al de Settings)
- ✅ MFA status con indicador

**Pendiente:**
- ⏳ **Avatar personalizado**: subir foto de perfil (requiere soporte en el backend)
- ⏳ **Cambiar contraseña inline** (según cobertura de implementación real)

---

### Bookmarks — Mejoras implementadas

Panel previamente operativo. Mejoras agregadas:

- ✅ **Favicon real**: `getFaviconSrc()` usa `favicon_url` del backend o fallback a `https://www.google.com/s2/favicons?domain=...&sz=32`
- ✅ **Abrir en el browser del sistema**: botón `ExternalLink` → `window.open(url, "_blank", "noopener,noreferrer")`
- ✅ **Agregar desde portapapeles**: detecta URL válida en el portapapeles al abrir el panel; ofrece botón "Pegar URL" que pre-rellena el form
- ✅ **Copiar URL al portapapeles**: botón `Copy` en cada fila (hover); feedback `Check` verde por 1500ms; tooltip "Copiar URL" / "¡Copiado!"

**Pendientes:**
- ⏳ Preview de URL (Open Graph tooltip)
- ⏳ Detectar links rotos (HEAD request por URL)

---

### Notas — Mejoras implementadas

Panel previamente operativo. Mejoras agregadas:

- ✅ **Anclar nota**: botón Pin/PinOff en cada fila; `PATCH /api/v1/app/notes/:id/pin/`; notas fijadas aparecen primero con ícono amarillo
- ✅ **Copiar contenido**: botón `Copy` en cada fila (hover, solo si hay contenido); copia `note.content`; feedback `Check` verde por 1500ms

**Pendientes:**
- ⏳ Preview de markdown
- ⏳ Nota rápida (campo siempre visible en el top)
- ⏳ Ordenar por (fecha / categoría)
- ⏳ Contar palabras
- ⏳ Exportar como .txt (Tauri `fs` plugin)

---

### Contactos — Mejoras implementadas

Panel previamente operativo. Mejora agregada:

- ✅ **Copiar email**: botón `Copy` en cada fila (hover, solo si el contacto tiene email); copia `contact.email`; feedback `Check` verde por 1500ms; tooltip "Copiar email" / "¡Copiado!"

**Pendientes:**
- ⏳ Importar desde CSV
- ⏳ Exportar a VCard (.vcf)
- ⏳ Click-to-call / click-to-email (protocolo `tel:` / `mailto:` via Tauri shell)
- ⏳ Avatar personalizado
- ⏳ Contactos recientes

---

### Snippets — Mejoras implementadas

Panel previamente operativo. Mejora implementada (sesión anterior):

- ✅ **Copiar código con un click**: botón de portapapeles en la fila del snippet; tooltip "Copiar código"

**Pendientes:**
- ⏳ Syntax highlighting (highlight.js o prism)
- ⏳ Contador de uso / "Más usados"
- ⏳ Favoritos
- ⏳ Importar desde archivo (drag & drop)
- ⏳ Etiquetas/tags adicionales

---

### Ideas transversales

**Implementadas:**
- ✅ **Deep link desde otras apps**: `rbacdesktop://auth?payload=...&state=<nonce>` para autenticación desde el Hub (implementado en sesión previa con anti-CSRF nonce)

**Pendientes:**
- ⏳ Búsqueda global (`Cmd/Ctrl+K`) — multi-panel simultáneo
- ⏳ Modo offline (caché en `localStorage` o SQLite via Tauri)
- ⏳ Auto-refresh inteligente al recuperar foco de ventana
- ⏳ Atajos de teclado globales (`1`–`9`, `N`, `/`)
- ⏳ Animaciones de transición entre paneles
- ⏳ Estado de conexión (indicador cuando el API no responde)
- ⏳ `rbacdesktop://open?section=contacts` (deep link a sección específica)

---

## Paneles sin implementar (stubs)

| Panel | Bloqueante | Esfuerzo estimado |
|---|---|---|
| **Files** | Backend no tiene módulo genérico de archivos; usa `env_vars`, `ssh_keys`, `ssl_certs` — 3 endpoints distintos | Alto |
| **Chat** | No existe módulo de mensajería en el backend | Muy alto (requiere backend nuevo) |
| **Tareas** — mejoras | Panel operativo pero sin ninguna de las 6 ideas | Medio |
| **Proyectos** — mejoras | Panel operativo pero sin ninguna de las 6 ideas | Medio |
| **Calendario** — mejoras | Panel operativo pero sin ninguna de las 6 ideas | Alto (mini-calendar, vista timeline) |

---

## Correcciones de bugs realizadas durante la implementación

| Bug | Causa | Solución |
|---|---|---|
| `notification:allow-send-notification` no encontrado (Cargo build error) | Nombre de permiso incorrecto en `capabilities/default.json` — el permiso correcto es `notification:allow-show` | Corregido en `default.json` |
| Franja blanca al cambiar ancho desde slider de Settings | `PanelContainer` usaba `localWidth` (estado local inicializado una sola vez) sin sincronizarlo cuando el prop `panelWidth` cambiaba externamente | Agregado `useEffect([panelWidth, isDragging])` en `PanelContainer` |
| Slider de ancho mostraba track blanco grueso nativo del browser | `input[type=range]` en WebView2 renderiza track blanco por defecto; `accentColor` CSS solo afecta el thumb y fill | Reemplazado con slider custom (track div + fill div + thumb div + input invisible encima para eventos) |

---

## Arquitectura introducida en esta sesión

### Stores nuevos

| Store | Archivo | Persistencia | Propósito |
|---|---|---|---|
| `navigationStore` | `src/store/navigationStore.ts` | No (runtime only) | Permite que cualquier panel solicite navegación a otro panel sin prop drilling (patrón Zustand) |
| `notificationsStore` | `src/store/notificationsStore.ts` | No | Comparte `unreadCount` entre `AlertsPanel` e `IconStrip` |
| `settingsStore` | `src/store/settingsStore.ts` | Sí (`localStorage: desktop-settings`) | Centraliza todas las preferencias del usuario: color, fondo, orden, visibilidad, refreshInterval, panelWidth |

### Hooks nuevos

| Hook | Archivo | Propósito |
|---|---|---|
| `useNotificationsPoller` | `src/features/notifications/useNotificationsPoller.ts` | Polling de fondo desde `App.tsx` (independiente del panel activo); dispara notificación OS si el panel Alerts no está activo |

---

## Próximos pasos sugeridos (por prioridad)

1. **Files (env_vars + ssh_keys + ssl_certs)** — alta utilidad para devs; panel unificado con pestañas
2. **Snippets: syntax highlighting** — mejora UX inmediata del panel más usado por desarrolladores
3. **Tareas: checkbox inline + vista "Hoy"** — baja complejidad, alto valor diario
4. **Notas: markdown preview** — usa una librería ligera (`marked` o `micromark`)
5. **Contactos: click-to-email** — protocolo `mailto:` via Tauri shell, trivial de implementar
6. **Búsqueda global** — feature transversal de alto impacto pero mayor complejidad
