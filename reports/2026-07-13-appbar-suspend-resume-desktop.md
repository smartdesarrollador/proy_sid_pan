# Fix: el sidebar Desktop (AppBar Win32) se desconfiguraba tras suspender/reanudar la laptop

**Fecha:** 2026-07-13 (sesión iniciada 2026-07-12)
**Apps:** `apps/frontend_sidebar_desktop` (Tauri v2 + WebView2 + AppBar Win32)
**Origen:** el usuario reportó que la app abre bien en frío, pero tras suspender la laptop y
reanudarla: (a) al hacer click en un icono el panel solo asomaba una tira, (b) las demás ventanas de
Windows dejaban de respetar el espacio reservado del sidebar, y (c) en iteraciones posteriores el
WebView quedaba blanco y sin interacción. Solo se arreglaba reiniciando la app.

## Resumen

Bug de 7 capas — cada fix destapaba la siguiente. Hubo dos causas de fondo del síntoma más
persistente (panel corto / clicks sin efecto): (a) un **bucle de retroalimentación
`ABM_SETPOS` ↔ `WM_SETTINGCHANGE` introducido por el primer fix** que saturaba el hilo de UI, y
(b) — la definitiva e intermitente — **el canal IPC del WebView2 muere en silencio con algunas
suspensiones**: JS sigue corriendo y renderizando, pero ningún `invoke()` llega a Rust, así que
ninguna recuperación desde JavaScript es posible. La solución final fue la que el usuario intuyó
desde el principio ("cerrar y reabrir la app"), implementada de forma automática y nativa:
**detectar el resume en Rust (`WM_POWERBROADCAST`) y recrear la ventana WebView completa**.

El diagnóstico salió de instrumentar `reserve_band`/`apply_window_rect` con `eprintln!` y leer la
terminal de `tauri dev`: tras el resume malo, el click del usuario no producía **ningún** log →
el comando nunca corría → el problema no era el resize sino que nada llegaba a Rust.

Lección completa (síntoma → causa → fix por capa): **LL-095** en
`.claude/skills/lessons-learned/references/knowledge-base.md`.

## Las 7 capas

| # | Síntoma tras reanudar | Causa raíz | Fix |
|---|----------------------|-----------|-----|
| 1 | Otras ventanas invaden el hueco reservado | Suspender/reanudar no emite `ABN_POSCHANGED` (único mensaje manejado); el shell puede des-registrar el AppBar mientras duerme | Interceptar `WM_DISPLAYCHANGE`/`WM_SETTINGCHANGE`/`WM_DPICHANGED`/`WM_POWERBROADCAST` → `reassert_appbar` idempotente (`ABM_NEW`→`QUERYPOS`→`SETPOS`), con rect de `monitor_rect()` (`MonitorFromWindow`) en vez de `SM_CXSCREEN` |
| 2 | Ventana del panel crece solo una tira | `MoveWindow` usaba el rect que `ABM_SETPOS` escribe de vuelta — el shell lo devuelve encogido tras resume | Geometría determinista: `right - width` sobre el borde aprobado por `QUERYPOS`, sin leer el rect post-`SETPOS` |
| 3 | WebView2 blanco y sin interacción | WebView2 pierde su superficie de render al suspender; el hide/show nativo la recuperaba pero corría carrera con el resize | Detección de wake en React (`useWakeReload.ts`: drift de `setInterval` > 5s) → reload, esperando red estable (3 probes `HEAD` consecutivos OK — 1 solo no basta, la red parpadea) + script inline de auto-sanado en `index.html` (si `#root` vacío tras ~2.5s → reload con backoff, máx 10; imprescindible porque con la página rota ningún código de la app corre) |
| 4 | Panel corto persiste aun con reload | El resize con `MoveWindow` crudo desincronizaba a tao (`resizable:false` → tao re-asienta el tamaño que él cree tras los eventos de DPI del resume) | Comandos Tauri aplican el rect con `window.set_size(PhysicalSize)` + `set_position(PhysicalPosition)`; `reserve_band()` separado devuelve el rect; `MoveWindow` queda solo para el subclass nativo. + Registro fresco (`ABM_REMOVE`→`ABM_NEW`) al montar y double-tap re-apply a los 250ms |
| 5 | **El click nunca redimensiona (causa real del 4 persistente)** | Nuestro `SETPOS` cambia el work-area → Windows difunde `WM_SETTINGCHANGE` **también a nosotros** → el handler de la capa 1 respondía con otro `SETPOS` → bucle infinito → hilo de UI saturado → los `invoke` IPC jamás se procesaban | Rate-limit `should_reassert()` (máx 1 reassert/seg para los 4 mensajes broadcast): el primer mensaje real tras el resume trabaja, el eco propio se ignora y el bucle muere |
| 6 | Falla intermitente aun con rate-limit | `WM_SETTINGCHANGE` es un broadcast **síncrono** (explorer queda bloqueado esperando nuestro handler) y el handler llamaba a `SHAppBarMessage`, que envía un mensaje síncrono de vuelta a explorer → riesgo de interbloqueo/timeout de segundos en el hilo de UI | Diferir el reassert: el handler del broadcast solo hace `PostMessageW(hwnd, REASSERT_MSG)` y retorna; el trabajo real corre al drenarse la cola, fuera del contexto del broadcast |
| 7 | **La intermitencia real: tras algunos resumes, clicks y hasta el register del reload no llegan nunca a Rust; la barra además corrida a la izquierda** | El canal IPC del WebView2 **muere en silencio** con algunas suspensiones — JS vivo y renderizando, pero ningún `invoke()` sale del WebView → ninguna recuperación JS (reload incluido) puede funcionar | **Recrear la ventana WebView desde el lado nativo** (que nunca muere): `WM_POWERBROADCAST` con `PBT_APMRESUMESUSPEND`(0x7)/`PBT_APMRESUMEAUTOMATIC`(0x12) → `recreate_window_on_resume()` (debounce 15s): espera 1.2s a que pase la tormenta → `win.destroy()` → **poll hasta que el label `main` se libere** (destroy es asíncrono; reconstruir de inmediato falla con "label already exists") → `WebviewWindowBuilder::from_config()`. Flag `REBUILDING` + `RunEvent::ExitRequested` → `api.prevent_exit()` para que Tauri no cierre el proceso al quedarse sin ventanas durante el hueco |

## Archivos modificados

- `src-tauri/src/appbar/registration.rs` — `monitor_rect()`, `ensure_registered()`,
  `reserve_band() -> RECT` (determinista), `commit_position()` (solo subclass), `reassert_appbar()`
- `src-tauri/src/appbar/subclass.rs` — 4 mensajes broadcast nuevos, rate-limit `should_reassert()`,
  reassert diferido vía `PostMessageW` (`REASSERT_MSG = WM_USER+2`), detección de resume en
  `WM_POWERBROADCAST` → `crate::recreate_window_on_resume()`
- `src-tauri/src/lib.rs` — `apply_window_rect()` (API tao + double-tap), registro fresco en
  `register_appbar`, `resize_appbar` gana param `window`, `APP_HANDLE` global,
  `recreate_window_on_resume()` (destroy + poll de label + rebuild), flag `REBUILDING` +
  `prevent_exit` en el run-loop
- `src/hooks/useWakeReload.ts` — detector de wake JS + espera de red estable + reload (queda como
  segunda línea de defensa; normalmente la recreación nativa gana)
- `src/App.tsx` — monta `useWakeReload()`
- `index.html` — script inline de auto-sanado de boot

## Verificación

- Usuario probó **varios ciclos** suspender→reanudar en su laptop con la versión final:
  la ventana se recrea sola (~2-3s tras despertar), reserva del work-area ✅, panel abre al ancho
  completo al click ✅, sin pantalla blanca ✅, la app no se cierra ✅.
- Iteraciones intermedias documentadas con logs de terminal: el log que destapó la capa 7 mostró
  reasserts nativos vivos pero **cero** `reserve`/`apply` originados por comandos tras el resume
  (IPC muerto); el primer intento de recreación falló con "label `main` already exists" y cierre
  de app → corregido con poll del label + `prevent_exit`.
- `cargo check` y `tsc --noEmit` limpios en cada iteración.

## Pendiente / notas

- Tras reanudar, el panel arranca **cerrado** (ventana nueva) — equivalente a reabrir la app,
  comportamiento aceptado por el usuario.
- **Validar en build de producción** el ciclo suspender→reanudar (en dev la recreación depende de
  que Vite siga vivo; en prod el frontend va embebido y es aún más simple).
- Logs que quedan a propósito: `[wake]` en consola JS y `[appbar] resume detected → …` /
  `webview window recreated` / `rebuild failed` en Rust (1 vez por resume, útiles en campo).
  Los `eprintln!` ruidosos de `reserve`/`apply`/`deferred` se retiraron tras confirmar el fix.
- `frontend_sidebar_desktop` sigue sin infraestructura de tests (deuda ya registrada en BACKLOG).
