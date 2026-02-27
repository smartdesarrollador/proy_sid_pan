# Referencia: AppBar Windows — Detalles Completos

Detalles del API AppBar Win32, múltiples monitores, DPI awareness y troubleshooting.

## Mensajes ABM_* Completos

| Mensaje | Propósito | Cuándo usar |
|---------|-----------|-------------|
| `ABM_NEW` | Registrar ventana como AppBar | Una vez, al inicio |
| `ABM_REMOVE` | Desregistrar AppBar | Al cerrar la app |
| `ABM_QUERYPOS` | Consultar posición disponible al shell | Antes de `ABM_SETPOS` |
| `ABM_SETPOS` | Confirmar posición con el shell | Después de `ABM_QUERYPOS` |
| `ABM_GETSTATE` | Obtener estado del shell (autohide, etc.) | Consulta |
| `ABM_GETTASKBARPOS` | Obtener posición de la taskbar | Para posicionamiento relativo |
| `ABM_ACTIVATE` | Notificar activación de la AppBar | En `WM_ACTIVATE` |
| `ABM_WINDOWPOSCHANGED` | Notificar cambio de posición | En `WM_WINDOWPOSCHANGED` |
| `ABM_SETAUTOHIDEBAR` | Configurar modo auto-hide | Avanzado |

## Bordes de Pantalla (ABE_*)

```rust
use windows_sys::Win32::UI::Shell::{ABE_LEFT, ABE_TOP, ABE_RIGHT, ABE_BOTTOM};

// El prototipo usa ABE_RIGHT (borde derecho)
// Para anclar al borde izquierdo:
data.uEdge = ABE_LEFT;
data.rc = RECT {
    left: 0,
    top: 0,
    right: width,
    bottom: screen_height,
};
SHAppBarMessage(ABM_QUERYPOS, &mut data);
data.rc.right = data.rc.left + width; // Ajustar borde derecho desde el izquierdo
SHAppBarMessage(ABM_SETPOS, &mut data);
```

## Notificaciones del Shell (ABN_*)

El callback `APPBAR_CALLBACK` recibe estas notificaciones via `wparam`:

| Notificación | Valor | Descripción |
|-------------|-------|-------------|
| `ABN_STATECHANGE` | 0 | La taskbar cambió su estado (autohide, etc.) |
| `ABN_POSCHANGED` | 1 | Otra AppBar cambió de posición |
| `ABN_FULLSCREENAPP` | 2 | Una app entró/salió de pantalla completa |
| `ABN_WINDOWARRANGE` | 3 | Ventanas siendo reorganizadas |

```rust
// Manejo completo en el subclass proc
msg if msg == APPBAR_CALLBACK => {
    match wparam as u32 {
        ABN_POSCHANGED => {
            // Otra AppBar se movió — reafirmar nuestra posición
            let width = CURRENT_WIDTH.load(Ordering::Relaxed) as i32;
            update_appbar_position(hwnd_usize, width);
        }
        ABN_FULLSCREENAPP => {
            // lparam: 1 = app en pantalla completa, 0 = salió
            if lparam != 0 {
                // Ocultar AppBar cuando hay una app en fullscreen
                // (opcional, depende del diseño deseado)
            }
        }
        _ => {}
    }
}
```

## DPI Awareness

En monitores de alta resolución (HiDPI), las coordenadas físicas difieren de las lógicas:

```rust
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN,
};
use windows_sys::Win32::UI::HiDpi::{
    GetDpiForWindow, SetProcessDpiAwarenessContext,
    DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2,
};

// En main.rs o al inicio de la app (antes de crear ventanas)
unsafe {
    SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
}

// Obtener DPI de la ventana específica para escalar
fn get_dpi_escalado(hwnd: usize, valor_logico: i32) -> i32 {
    unsafe {
        let dpi = GetDpiForWindow(hwnd as _);
        // DPI base es 96 (100%)
        (valor_logico * dpi as i32) / 96
    }
}
```

> **Nota del prototipo:** El prototipo actual usa `GetSystemMetrics(SM_CXSCREEN)` que devuelve dimensiones en píxeles físicos. En configuraciones multi-monitor con diferentes escalados, puede necesitar ajuste.

## Multi-Monitor

```rust
use windows_sys::Win32::Graphics::Gdi::{
    MonitorFromWindow, GetMonitorInfoW, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};

fn get_monitor_rect(hwnd: usize) -> Option<RECT> {
    unsafe {
        let hmonitor = MonitorFromWindow(hwnd as _, MONITOR_DEFAULTTONEAREST);
        let mut info = MONITORINFO {
            cbSize: std::mem::size_of::<MONITORINFO>() as u32,
            rcMonitor: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            rcWork: RECT { left: 0, top: 0, right: 0, bottom: 0 },
            dwFlags: 0,
        };

        if GetMonitorInfoW(hmonitor, &mut info) != 0 {
            Some(info.rcMonitor)
        } else {
            None
        }
    }
}

// Usar las dimensiones del monitor correcto en lugar de GetSystemMetrics
pub fn register_appbar_en_monitor(hwnd: usize, width: i32) {
    let rect = match get_monitor_rect(hwnd) {
        Some(r) => r,
        None => {
            // Fallback a pantalla principal
            unsafe {
                RECT {
                    left: 0,
                    top: 0,
                    right: GetSystemMetrics(SM_CXSCREEN),
                    bottom: GetSystemMetrics(SM_CYSCREEN),
                }
            }
        }
    };

    unsafe {
        let mut data = make_empty_data(hwnd);
        SHAppBarMessage(ABM_NEW, &mut data);

        data.rc = RECT {
            left: rect.right - width,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
        };

        SHAppBarMessage(ABM_QUERYPOS, &mut data);
        data.rc.left = data.rc.right - width;
        SHAppBarMessage(ABM_SETPOS, &mut data);

        MoveWindow(hwnd as _, data.rc.left, data.rc.top,
                   data.rc.right - data.rc.left,
                   data.rc.bottom - data.rc.top, 1);
    }
}
```

## Troubleshooting Común

### El espacio no se libera al cerrar la app

**Causa:** `ABM_REMOVE` no se llamó antes de cerrar el proceso.

**Solución:** Implementar el doble cleanup (React `useEffect` + `on_window_event(Destroyed)`).

### La ventana se superpone con la taskbar

**Causa:** Se usó `ABM_SETPOS` sin llamar `ABM_QUERYPOS` antes, o se ignoró el rect devuelto.

**Solución:** Siempre usar el rect devuelto por `ABM_QUERYPOS`, no el rect que se envió.

### `SetWindowSubclass` falla o crashea

**Causa:** Se llamó desde un hilo que no es el UI thread.

**Solución:** Usar `window.run_on_main_thread(|| { install_subclass(hwnd); })`.

### El AppBar no responde cuando otra app cambia posición

**Causa:** No se instaló el `SetWindowSubclass` o no se maneja `ABN_POSCHANGED`.

**Solución:** Verificar que `install_subclass` se llamó después de `register_appbar`.

### Compilación falla en Windows con "unresolved external"

**Causa:** Falta el feature en `windows-sys`.

**Solución:**
```toml
[target.'cfg(target_os = "windows")'.dependencies]
windows-sys = { version = "0.59", features = [
  "Win32_Foundation",
  "Win32_UI_Shell",           # SHAppBarMessage, APPBARDATA, ABM_*, ABE_*
  "Win32_UI_WindowsAndMessaging", # MoveWindow, GetSystemMetrics, WM_*
  "Win32_Graphics_Gdi",       # (necesario como dependencia transitiva)
] }
```

## Recursos Win32 de Referencia

- [SHAppBarMessage en docs.microsoft.com](https://docs.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shappbarmessage)
- [SetWindowSubclass en docs.microsoft.com](https://docs.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-setwindowsubclass)
- [crate windows-sys en docs.rs](https://docs.rs/windows-sys/latest/windows_sys/)
