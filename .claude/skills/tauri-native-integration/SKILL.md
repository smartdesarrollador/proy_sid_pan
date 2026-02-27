---
name: tauri-native-integration
description: Integración con APIs nativas de Windows en Tauri v2. Usar cuando se necesite anclar ventana al borde de pantalla con AppBar Win32, obtener HWND nativo con raw_window_handle, registrar y desregistrar AppBar desde React con lifecycle, instalar SetWindowSubclass en el UI thread, system tray con TrayIconBuilder, acceso a filesystem con permisos, o cleanup en on_window_event Destroyed. Stack Tauri v2, windows-sys 0.59, Rust 2021.
---

# Tauri v2 — Integración Nativa Windows (AppBar, Tray, FS)

Patrones para integrar Tauri v2 con APIs nativas de Windows: AppBar Win32, SetWindowSubclass, system tray y filesystem.

## AppBar Win32 — Anclar al Borde de Pantalla

El API AppBar de Windows permite anclar una ventana al borde de la pantalla, reservando espacio que otras apps respetan.

### Estructura de módulos

```
src-tauri/src/
├── lib.rs              # Comandos Tauri + run()
└── appbar/
    ├── mod.rs          # pub mod registration; pub mod subclass;
    ├── registration.rs # ABM_NEW / ABM_QUERYPOS / ABM_SETPOS / MoveWindow
    └── subclass.rs     # SetWindowSubclass + CURRENT_WIDTH atómico
```

```rust
// src-tauri/src/appbar/mod.rs
pub mod registration;
pub mod subclass;
```

### `registration.rs` — Los 6 Pasos del AppBar

```rust
// src-tauri/src/appbar/registration.rs
use windows_sys::Win32::Foundation::{HWND, RECT};
use windows_sys::Win32::UI::Shell::{
    SHAppBarMessage, APPBARDATA, ABE_RIGHT, ABM_ACTIVATE,
    ABM_NEW, ABM_QUERYPOS, ABM_REMOVE, ABM_SETPOS, ABM_WINDOWPOSCHANGED,
};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, MoveWindow, SM_CXSCREEN, SM_CYSCREEN, WM_USER,
};

pub const APPBAR_CALLBACK: u32 = WM_USER + 1;

#[inline]
fn as_hwnd(h: usize) -> HWND {
    h as HWND
}

fn make_empty_data(hwnd: usize) -> APPBARDATA {
    APPBARDATA {
        cbSize: std::mem::size_of::<APPBARDATA>() as u32,
        hWnd: as_hwnd(hwnd),
        uCallbackMessage: APPBAR_CALLBACK,
        uEdge: ABE_RIGHT,
        rc: RECT { left: 0, top: 0, right: 0, bottom: 0 },
        lParam: 0,
    }
}

pub fn register_appbar(hwnd: usize, width: i32) {
    unsafe {
        let screen_width = GetSystemMetrics(SM_CXSCREEN);
        let screen_height = GetSystemMetrics(SM_CYSCREEN);
        let mut data = make_empty_data(hwnd);

        // Paso 1: Registrar con el shell
        SHAppBarMessage(ABM_NEW, &mut data);

        // Paso 2: Definir rect deseado (borde derecho)
        data.rc = RECT {
            left: screen_width - width,
            top: 0,
            right: screen_width,
            bottom: screen_height,
        };

        // Paso 3: Consultar al shell — puede ajustar el rect
        SHAppBarMessage(ABM_QUERYPOS, &mut data);

        // Paso 4: Recalcular borde izquierdo desde el derecho ajustado
        data.rc.left = data.rc.right - width;

        // Paso 5: Confirmar posición con el shell
        SHAppBarMessage(ABM_SETPOS, &mut data);

        // Paso 6: Mover la ventana físicamente a la posición confirmada
        MoveWindow(
            as_hwnd(hwnd),
            data.rc.left,
            data.rc.top,
            data.rc.right - data.rc.left,
            data.rc.bottom - data.rc.top,
            1, // bRepaint = TRUE
        );
    }
}

pub fn update_appbar_position(hwnd: usize, width: i32) {
    unsafe {
        let screen_width = GetSystemMetrics(SM_CXSCREEN);
        let screen_height = GetSystemMetrics(SM_CYSCREEN);
        let mut data = APPBARDATA {
            cbSize: std::mem::size_of::<APPBARDATA>() as u32,
            hWnd: as_hwnd(hwnd),
            uCallbackMessage: APPBAR_CALLBACK,
            uEdge: ABE_RIGHT,
            rc: RECT {
                left: screen_width - width,
                top: 0,
                right: screen_width,
                bottom: screen_height,
            },
            lParam: 0,
        };

        SHAppBarMessage(ABM_QUERYPOS, &mut data);
        data.rc.left = data.rc.right - width;
        SHAppBarMessage(ABM_SETPOS, &mut data);

        MoveWindow(
            as_hwnd(hwnd),
            data.rc.left,
            data.rc.top,
            data.rc.right - data.rc.left,
            data.rc.bottom - data.rc.top,
            1,
        );
    }
}

pub fn unregister_appbar(hwnd: usize) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        data.uCallbackMessage = 0;
        SHAppBarMessage(ABM_REMOVE, &mut data);
    }
}

pub fn notify_activate(hwnd: usize, active: bool) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        data.lParam = if active { 1 } else { 0 };
        SHAppBarMessage(ABM_ACTIVATE, &mut data);
    }
}

pub fn notify_windowposchanged(hwnd: usize) {
    unsafe {
        let mut data = make_empty_data(hwnd);
        SHAppBarMessage(ABM_WINDOWPOSCHANGED, &mut data);
    }
}
```

> **Orden crítico:** `ABM_NEW` → establecer `rc` deseado → `ABM_QUERYPOS` → ajustar `rc.left` → `ABM_SETPOS` → `MoveWindow`. Saltarse `ABM_QUERYPOS` puede causar solapamiento con la taskbar.

### `subclass.rs` — SetWindowSubclass

```rust
// src-tauri/src/appbar/subclass.rs
use std::sync::atomic::{AtomicUsize, Ordering};
use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows_sys::Win32::UI::Shell::{
    DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass, ABN_POSCHANGED,
};
use windows_sys::Win32::UI::WindowsAndMessaging::{
    WM_ACTIVATE, WM_DESTROY, WM_WINDOWPOSCHANGED,
};
use super::registration::{
    notify_activate, notify_windowposchanged, update_appbar_position, APPBAR_CALLBACK,
};

const SUBCLASS_ID: usize = 1;

// AtomicUsize porque el subclass proc no puede tomar un Mutex
// (se ejecuta en el UI thread, potencialmente durante un lock)
static CURRENT_WIDTH: AtomicUsize = AtomicUsize::new(60);

pub fn set_current_width(width: i32) {
    CURRENT_WIDTH.store(width as usize, Ordering::Relaxed);
}

unsafe extern "system" fn appbar_subclass_proc(
    hwnd: HWND,
    umsg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _uid_subclass: usize,
    _dw_ref_data: usize,
) -> LRESULT {
    let hwnd_usize = hwnd as usize;

    match umsg {
        WM_ACTIVATE => {
            let active = (wparam & 0xffff) != 0;
            notify_activate(hwnd_usize, active);
        }
        WM_WINDOWPOSCHANGED => {
            notify_windowposchanged(hwnd_usize);
        }
        msg if msg == APPBAR_CALLBACK => {
            if wparam as u32 == ABN_POSCHANGED {
                // El shell nos notifica que otra app cambió su posición —
                // re-afirmar nuestra posición
                let width = CURRENT_WIDTH.load(Ordering::Relaxed) as i32;
                update_appbar_position(hwnd_usize, width);
            }
        }
        WM_DESTROY => {
            // Limpiar la subclass al destruir la ventana
            RemoveWindowSubclass(hwnd, Some(appbar_subclass_proc), SUBCLASS_ID);
        }
        _ => {}
    }
    DefSubclassProc(hwnd, umsg, wparam, lparam)
}

pub fn install_subclass(hwnd: usize) {
    unsafe {
        SetWindowSubclass(hwnd as HWND, Some(appbar_subclass_proc), SUBCLASS_ID, 0);
    }
}
```

## Obtener HWND Nativo

```rust
// src-tauri/src/lib.rs
#[cfg(target_os = "windows")]
fn get_hwnd(window: &tauri::WebviewWindow) -> Result<usize, String> {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};

    let handle = window
        .window_handle()
        .map_err(|e| format!("window_handle error: {e}"))?;

    match handle.as_raw() {
        RawWindowHandle::Win32(h) => Ok(h.hwnd.get() as usize),
        _ => Err("No es una ventana Win32".to_string()),
    }
}
```

> **Por qué `usize` y no `HWND`:** `HWND` es `*mut c_void` y no implementa `Send`, por lo que no puede guardarse en un `Mutex`. Almacenarlo como `usize` (puntero entero) es el patrón estándar para compartir handles Win32 entre hilos.

## Estado AppBar en Mutex

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;
use tauri::{Manager, State};

#[cfg(target_os = "windows")]
mod appbar;

pub struct AppBarHandle {
    pub hwnd: usize,        // HWND como usize (no es Send)
    pub registered: bool,
    pub current_width: i32,
}

impl Default for AppBarHandle {
    fn default() -> Self {
        AppBarHandle { hwnd: 0, registered: false, current_width: 0 }
    }
}

pub struct AppBarMutex(pub Mutex<AppBarHandle>);

#[tauri::command]
fn register_appbar(
    window: tauri::WebviewWindow,
    state: State<'_, AppBarMutex>,
    width: i32,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let hwnd = get_hwnd(&window)?;

        // Actualizar ancho global para el subclass proc ANTES de instalar
        appbar::subclass::set_current_width(width);

        // Registrar (seguro desde cualquier hilo)
        appbar::registration::register_appbar(hwnd, width);

        // SetWindowSubclass DEBE ejecutarse en el UI thread
        window
            .run_on_main_thread(move || {
                appbar::subclass::install_subclass(hwnd);
            })
            .map_err(|e| format!("run_on_main_thread error: {e}"))?;

        let mut guard = state.0.lock()
            .map_err(|e| format!("lock error: {e}"))?;
        guard.hwnd = hwnd;
        guard.registered = true;
        guard.current_width = width;
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, state, width);
        return Err("AppBar solo disponible en Windows".to_string());
    }
    Ok(())
}

#[tauri::command]
fn resize_appbar(state: State<'_, AppBarMutex>, width: i32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut guard = state.0.lock()
            .map_err(|e| format!("lock error: {e}"))?;
        if guard.registered && guard.hwnd != 0 {
            appbar::subclass::set_current_width(width);
            appbar::registration::update_appbar_position(guard.hwnd, width);
            guard.current_width = width;
        }
    }
    #[cfg(not(target_os = "windows"))]
    { let _ = (state, width); }
    Ok(())
}

#[tauri::command]
fn unregister_appbar(state: State<'_, AppBarMutex>) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut guard = state.0.lock()
            .map_err(|e| format!("lock error: {e}"))?;
        if guard.registered && guard.hwnd != 0 {
            appbar::registration::unregister_appbar(guard.hwnd);
            guard.registered = false;
        }
    }
    #[cfg(not(target_os = "windows"))]
    { let _ = state; }
    Ok(())
}
```

## Cleanup en `on_window_event(Destroyed)`

Doble seguridad: desregistrar el AppBar aunque el frontend haya crasheado:

```rust
// src-tauri/src/lib.rs
pub fn run() {
    tauri::Builder::default()
        .manage(AppBarMutex(Mutex::new(AppBarHandle::default())))
        .invoke_handler(tauri::generate_handler![
            register_appbar,
            resize_appbar,
            unregister_appbar,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Fallback: desregistrar AppBar si el frontend no lo hizo
                #[cfg(target_os = "windows")]
                {
                    if let Some(state) = window.try_state::<AppBarMutex>() {
                        if let Ok(mut guard) = state.0.lock() {
                            if guard.registered && guard.hwnd != 0 {
                                appbar::registration::unregister_appbar(guard.hwnd);
                                guard.registered = false;
                            }
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

> **Por qué doble cleanup:** Si el proceso Rust se termina abruptamente (kill, crash), Windows no libera el espacio reservado por el AppBar hasta el siguiente reboot. El `on_window_event(Destroyed)` es el último recurso antes de que el proceso muera.

## Lifecycle AppBar desde React

```tsx
// src/App.tsx
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const ANCHO_ICONOS = 60;

function App() {
  useEffect(() => {
    // Mount: registrar AppBar con ancho inicial (solo iconos)
    invoke("register_appbar", { width: ANCHO_ICONOS })
      .catch(console.error);

    // Unmount: desregistrar AppBar (cleanup del espacio reservado)
    return () => {
      invoke("unregister_appbar").catch(console.error);
    };
  }, []); // [] = solo al montar/desmontar

  // ...
}
```

## System Tray

```rust
// src-tauri/src/lib.rs
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Crear menú del tray
            let mostrar = MenuItem::with_id(app, "mostrar", "Mostrar", true, None::<&str>)?;
            let salir = MenuItem::with_id(app, "salir", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&mostrar, &salir])?;

            // Crear ícono del tray
            TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Mi App")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "mostrar" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "salir" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

**Permisos requeridos en `capabilities/default.json`:**
```json
{
  "permissions": [
    "core:default",
    "core:tray:allow-set-tooltip",
    "core:tray:allow-set-icon"
  ]
}
```

## File System con Permisos

```rust
// Comandos para leer/escribir archivos
#[tauri::command]
async fn leer_config(app: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let dir = app.app_data_dir()
        .map_err(|e| format!("app_data_dir error: {e}"))?;
    let ruta = dir.join("config.json");

    std::fs::read_to_string(&ruta)
        .map_err(|e| format!("lectura error: {e}"))
}

#[tauri::command]
async fn guardar_config(
    app: tauri::AppHandle,
    contenido: String,
) -> Result<(), String> {
    use tauri::Manager;
    let dir = app.app_data_dir()
        .map_err(|e| format!("app_data_dir error: {e}"))?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("crear dir error: {e}"))?;
    let ruta = dir.join("config.json");

    std::fs::write(&ruta, contenido)
        .map_err(|e| format!("escritura error: {e}"))
}
```

```ts
// src/api/config.ts
import { invoke } from "@tauri-apps/api/core";

export const leerConfig = () => invoke<string>("leer_config");
export const guardarConfig = (contenido: string) =>
  invoke<void>("guardar_config", { contenido });
```

**Permisos en `capabilities/default.json`:**
```json
{
  "permissions": [
    "core:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-app-read-recursive",
    "fs:allow-app-write-recursive"
  ]
}
```

## Patrones ✅ / ❌

- ✅ Siempre desregistrar AppBar en destrucción (doble seguridad: React `useEffect` + `on_window_event(Destroyed)`)
- ✅ `AtomicUsize` para `CURRENT_WIDTH` en subclass proc (no puede tomar Mutex desde el UI thread)
- ✅ `install_subclass` dentro de `run_on_main_thread` (requerimiento estricto de Win32)
- ✅ `ABM_QUERYPOS` **antes** de `ABM_SETPOS` (el shell puede ajustar el rect)
- ✅ `hwnd` almacenado como `usize` en el Mutex (`HWND` no implementa `Send`)
- ✅ `try_state::<T>()` en `on_window_event` (puede fallar si el estado no está registrado)
- ❌ `HWND` directamente en estado Mutex (no es `Send`, falla en compilación)
- ❌ `SetWindowSubclass` desde un hilo worker (crash garantizado en Win32)
- ❌ Registrar AppBar sin desregistrar (el espacio reservado persiste hasta reboot)
- ❌ Omitir `ABM_QUERYPOS` (puede solaparse con la taskbar o notificaciones)
- ❌ `unwrap()` en el lock del Mutex dentro de `on_window_event` (usar `if let Ok`)

## Referencias Adicionales

- **[AppBar Windows](references/appbar-windows.md)** — Detalles completos ABM_*, múltiples monitores, DPI awareness
- **[File System y Tray](references/filesystem-tray.md)** — Permisos avanzados fs, watchers, tray con íconos dinámicos

---

**Resumen:** El AppBar Win32 requiere 6 pasos exactos (ABM_NEW → set rect → ABM_QUERYPOS → ajustar left → ABM_SETPOS → MoveWindow). El HWND se almacena como `usize` (no `Send`). SetWindowSubclass debe ejecutarse en el UI thread vía `run_on_main_thread`. Siempre desregistrar en `on_window_event(Destroyed)` como fallback.
