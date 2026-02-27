# Referencia: tauri.conf.json — Configuración de Ventanas

Opciones completas de ventana para Tauri v2, posicionamiento y configuración de múltiples ventanas.

## Propiedades de Ventana Completas

```json
{
  "app": {
    "windows": [
      {
        "label": "main",           // Identificador único (requerido)
        "title": "Mi App",         // Título de la barra de título nativa
        "width": 800,              // Ancho inicial en píxeles lógicos
        "height": 600,             // Alto inicial en píxeles lógicos
        "minWidth": 400,           // Ancho mínimo (requiere resizable: true)
        "minHeight": 300,          // Alto mínimo
        "maxWidth": 1200,          // Ancho máximo
        "maxHeight": 900,          // Alto máximo
        "x": 100,                  // Posición X inicial (null = centrar)
        "y": 100,                  // Posición Y inicial (null = centrar)
        "resizable": true,         // Permitir redimensionar
        "fullscreen": false,       // Iniciar en pantalla completa
        "focus": true,             // Recibir foco al abrir
        "transparent": false,      // Transparencia de ventana (Windows 11+)
        "decorations": true,       // Barra de título y bordes nativos
        "alwaysOnTop": false,      // Flotar sobre otras ventanas
        "skipTaskbar": false,      // No aparecer en taskbar
        "shadow": true,            // Sombra de ventana
        "visible": true,           // Visible al abrir
        "center": false,           // Centrar en pantalla (ignora x/y)
        "contentProtected": false, // Evitar capturas de pantalla
        "tabbingIdentifier": null  // macOS: tabbing group
      }
    ]
  }
}
```

## Configuración para Sidebar Nativo (Borde Derecho)

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "",
        "width": 60,
        "height": 1080,
        "x": 1860,
        "y": 0,
        "resizable": false,
        "decorations": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "shadow": false,
        "focus": false,
        "visible": true
      }
    ]
  }
}
```

> **Nota sobre `x`:** El valor `1860` asume resolución 1920×1080. Para resoluciones diferentes, el AppBar Win32 reposicionará la ventana automáticamente al registrarse. El valor inicial es solo para el momento antes de que se ejecute el registro.

## Múltiples Ventanas

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "App Principal",
        "width": 60,
        "height": 1080,
        "decorations": false
      },
      {
        "label": "settings",
        "title": "Ajustes",
        "width": 600,
        "height": 500,
        "center": true,
        "visible": false,
        "resizable": false
      }
    ]
  }
}
```

```rust
// Abrir ventana secundaria desde Rust
#[tauri::command]
fn abrir_ajustes(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("settings") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

```ts
// Abrir ventana desde TypeScript
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

// Opción 1: Vía comando Rust
await invoke("abrir_ajustes");

// Opción 2: Directamente desde TypeScript (Tauri v2)
const ajustes = new WebviewWindow("settings", {
  url: "/ajustes",
  title: "Ajustes",
  width: 600,
  height: 500,
  center: true,
});
```

## Ventana Transparente (Windows 11 / macOS)

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "transparent": true,
        "decorations": false,
        "shadow": false
      }
    ]
  }
}
```

```css
/* Hacer el fondo de la app transparente */
html, body, #root {
  background: transparent;
}

/* Usar rgba para transparencia parcial */
.panel {
  background: rgba(13, 13, 31, 0.92);
  backdrop-filter: blur(10px);
}
```

> **Limitación:** En Windows, `transparent: true` puede afectar el rendimiento. Usar `shadow: false` en conjunto. No compatible con AppBar (los AppBars deben ser opacos).

## Posicionamiento Multi-Monitor

```rust
// Centrar en el monitor principal desde Rust
#[tauri::command]
fn centrar_en_monitor_principal(window: tauri::WebviewWindow) -> Result<(), String> {
    use tauri::PhysicalPosition;
    let monitor = window.primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("sin monitor principal")?;

    let tamaño_monitor = monitor.size();
    let tamaño_ventana = window.outer_size().map_err(|e| e.to_string())?;

    let x = (tamaño_monitor.width as i32 - tamaño_ventana.width as i32) / 2;
    let y = (tamaño_monitor.height as i32 - tamaño_ventana.height as i32) / 2;

    window.set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}
```

## CSP (Content Security Policy)

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

> Para desarrollo con hot reload, usar `csp: null`. En producción, definir una CSP restrictiva.
