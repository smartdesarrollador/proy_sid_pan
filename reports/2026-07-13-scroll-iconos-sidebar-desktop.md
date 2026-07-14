# Feature: scroll vertical en la franja de iconos del sidebar Desktop (+ fix de carrera StrictMode en el registro del AppBar)

**Fecha:** 2026-07-13
**Apps:** `apps/frontend_sidebar_desktop` (Tauri v2 + WebView2 + AppBar Win32)
**Origen:** el usuario pidió analizar la distribución de iconos de la franja lateral y proponer un
mecanismo de desplazamiento para cuando crezca la cantidad de iconos, con la restricción explícita
de **no afectar** el fix suspend/resume recién cerrado
(`reports/2026-07-13-appbar-suspend-resume-desktop.md`, [[LL-095]]).

## Resumen

Se implementó una zona media scrolleable estilo Discord/VS Code activity bar en `IconStrip.tsx`:
scrollbar oculta, rueda del mouse, chevrones con fade que aparecen solo cuando hay overflow, y la
zona inferior (Settings + botón ✕) anclada siempre visible. Todo CSS/DOM efímero dentro del WebView
— cero cambios de geometría de ventana, cero `invoke` nuevos, nada que deba sobrevivir a la
recreación de ventana post-resume.

Durante la prueba en la app real apareció un bug que **parecía** una regresión del fix
suspend/resume (sin espacio reservado + panel en tira) pero resultó ser una **carrera preexistente
de StrictMode, solo de dev**, en el registro del AppBar — destilada en [[LL-097]].

## Problema que resuelve el scroll

La franja de 60px con los 16 iconos actuales necesita ~816px de alto (icono 40px + gap 4px + padding
+ zona inferior ~84px). En pantallas 768p (~652px útiles para la zona de iconos) ya se recortaban
los últimos iconos y la zona Settings/✕ podía quedar fuera de vista; el contenedor raíz es
`h-screen overflow-hidden`, así que no había ningún manejo de desbordamiento.

## Implementación

- `src/index.css` — clase `scrollbar-hide` (`scrollbar-width: none` + `::-webkit-scrollbar
  { display: none }`).
- `src/components/IconStrip.tsx` — la zona de iconos pasó a un wrapper `relative flex-1 min-h-0` con
  contenedor interno `overflow-y-auto scrollbar-hide`. Indicadores superpuestos top/bottom
  (`ChevronUp`/`ChevronDown` sobre gradiente de fade de 16px), visibles según
  `{ canScrollUp, canScrollDown }` recalculados por un listener de `scroll` + `ResizeObserver`
  sobre el contenedor y sus hijos (cubre cambio de resolución/DPI y de iconos ocultos en Settings).
  Click en chevron = `scrollBy` de una página con `behavior: "smooth"`. Settings y ✕ quedaron fuera
  del área de scroll.
- `src/components/NavIcon.tsx` — el tooltip (antes `absolute right-full`, se recortaría dentro del
  contenedor con overflow) ahora se renderiza vía `createPortal` a `document.body` con posición
  `fixed` medida con `getBoundingClientRect` en `onMouseEnter`. Se eliminó el `title` nativo
  (duplicaba tooltip) y el label pasó a `aria-label`. Endurecimiento: un listener de scroll
  (capture) oculta el tooltip si la lista se desplaza bajo el cursor — sin él quedaba varado en la
  posición capturada.

**Invariantes respetadas** (verificadas por diseño y en prueba real): sin cambios en `src-tauri`
para la feature, `ICON_WIDTH = 60` y llamadas a `resize_appbar` intactas, estado 100% derivado del
layout (tras la recreación de ventana post-resume el remount arranca con `scrollTop = 0` y se
recalcula solo).

## Bug encontrado al probar: carrera StrictMode en el registro del AppBar ([[LL-097]])

Primera prueba del usuario en `tauri dev`: el sidebar no reservaba el work-area (las ventanas de
Windows se metían encima) y al hacer click el icono se marcaba activo pero el panel solo asomaba
una tira — síntomas idénticos a los de [[LL-095]], **pero en arranque en frío**.

- **Causa raíz:** `main.tsx` usa `React.StrictMode`, que en dev monta → desmonta → remonta. El
  efecto de `App.tsx` disparaba tres invokes fire-and-forget sin orden garantizado (los comandos
  Tauri corren en thread pool): `register_appbar` #1 → `unregister_appbar` (cleanup) →
  `register_appbar` #2. Si el `unregister` se procesa último, `registered=false` → no hay banda
  reservada y `resize_appbar` se vuelve no-op silencioso (guard `if guard.registered`). Carrera
  intermitente y preexistente — el cambio de scroll (CSS/DOM puro) solo alteró el timing del
  montaje lo suficiente para destaparla.
- **Fix:** quitar el `invoke("unregister_appbar")` del cleanup del efecto. El teardown real ya lo
  hace el handler nativo `WindowEvent::Destroyed` de `lib.rs`; además un cleanup de React tampoco
  corre en `location.reload()` (wake-reload), así que ese unregister JS no aportaba en ningún flujo
  real. La secuencia queda register → register, inocua porque el registro es fresco e idempotente
  (`ABM_REMOVE`→`ABM_NEW`).
- Se agregaron temporalmente logs `[appbar-diag]` en Rust para confirmar el diagnóstico
  (método de LL-095: mirar la terminal de `tauri dev`); retirados a pedido del usuario tras
  verificar el fix.

## Verificación

- `tsc --noEmit` y `cargo check` limpios en cada iteración.
- Prueba end-to-end del DOM con Vite + Chrome (ventana baja para forzar overflow): indicadores
  correctos en tope/fondo/medio, paginado por chevron (0→300, clamp en el máximo), tooltip portal
  centrado con su botón y sin recorte, tooltip se oculta al scrollear, Settings/✕ siempre visibles.
- **Usuario probó en la app Tauri real**: primera pasada destapó la carrera StrictMode (arriba);
  tras el fix, confirmó que **todo funciona bien** (reserva del work-area, panel al ancho completo,
  scroll de la franja).

## Pendiente / notas

- **Quedan 10 iconos temporales de prueba** (`TEMP-SCROLL-TEST` en `IconStrip.tsx`: import de
  lucide, constante `TEMP_TEST_ITEMS` y su bloque de render) — el usuario los pidió mantener para
  una demostración; retirarlos después (rastreado en `BACKLOG.md`). Su click es no-op.
- La carrera de LL-097 era **solo de dev** (StrictMode no corre en build de producción), pero el
  fix aplica a ambos perfiles y no cambia el comportamiento de prod.
- Lecciones: [[LL-097]] (nueva). De paso se corrigió una colisión de IDs en la KB: la entrada
  "Invoice nunca se escribía" (2026-07-11) estaba también numerada LL-095 → renumerada a
  [[LL-096]] con sus referencias actualizadas.
