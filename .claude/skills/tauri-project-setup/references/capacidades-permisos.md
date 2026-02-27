# Referencia: Capacidades y Permisos — Tauri v2

Sistema de permisos de Tauri v2, diferencias con v1, scopes de filesystem, y plugins.

## Sistema de Permisos en Tauri v2

Tauri v2 reemplaza la `allowlist` de v1 con un sistema de **capacidades** basado en archivos JSON. Cada capacidad define qué permisos tiene una o más ventanas.

### Estructura

```
src-tauri/
└── capabilities/
    ├── default.json      # Permisos para ventanas definidas en tauri.conf.json
    └── admin.json        # Permisos adicionales para ventana "admin" (opcional)
```

### `capabilities/default.json` Completo

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capacidades por defecto para la ventana principal",
  "windows": ["main"],
  "permissions": [
    "core:default",

    "core:window:allow-start-dragging",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-close",
    "core:window:allow-center",
    "core:window:allow-set-focus",

    "shell:allow-open",

    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-app-read-recursive",
    "fs:allow-app-write-recursive",

    "core:tray:default"
  ]
}
```

## Permisos Core Disponibles

### Window

| Permiso | Descripción |
|---------|-------------|
| `core:window:allow-start-dragging` | Arrastrar ventana (data-tauri-drag-region) |
| `core:window:allow-set-size` | Cambiar tamaño desde JS |
| `core:window:allow-set-position` | Mover ventana desde JS |
| `core:window:allow-show` / `allow-hide` | Mostrar/ocultar ventana |
| `core:window:allow-set-fullscreen` | Pantalla completa |
| `core:window:allow-set-title` | Cambiar título |
| `core:window:allow-is-focused` | Verificar si tiene foco |

### FileSystem Scopes

```json
{
  "permissions": [
    {
      "identifier": "fs:allow-read-text-file",
      "allow": [{ "path": "$APPDATA/**" }]
    },
    {
      "identifier": "fs:allow-write-text-file",
      "allow": [{ "path": "$APPDATA/**" }]
    }
  ]
}
```

**Variables de ruta disponibles:**
- `$APPDATA` — Datos de la aplicación (`%APPDATA%` en Windows)
- `$APPLOCALDATA` — Datos locales (`%LOCALAPPDATA%` en Windows)
- `$DESKTOP` — Escritorio del usuario
- `$HOME` — Directorio home del usuario
- `$DOCUMENT` — Carpeta Documentos
- `$DOWNLOAD` — Carpeta Descargas
- `$TEMP` — Directorio temporal

### Permisos Shell

```json
{
  "permissions": [
    "shell:allow-open",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "git",
          "cmd": "git",
          "args": true,
          "sidecar": false
        }
      ]
    }
  ]
}
```

## Migración de Tauri v1 a v2

| Tauri v1 (allowlist) | Tauri v2 (capabilities) |
|---------------------|------------------------|
| `"all": true` | `"core:default"` + permisos específicos |
| `"window": { "all": true }` | `"core:window:allow-*"` específicos |
| `"fs": { "readFile": true }` | `"fs:allow-read-text-file"` |
| `"shell": { "open": true }` | `"shell:allow-open"` |
| `"dialog": { "open": true }` | `"dialog:allow-open"` |
| `"clipboard": { "writeText": true }` | `"clipboard-manager:allow-write-text"` |

## Plugins de Tauri v2

### Clipboard

```bash
cargo add tauri-plugin-clipboard-manager
npm install @tauri-apps/plugin-clipboard-manager
```

```rust
// src-tauri/src/lib.rs
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

```json
// capabilities/default.json
{
  "permissions": [
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text"
  ]
}
```

```ts
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

await writeText("texto copiado");
const texto = await readText();
```

### Notificaciones

```bash
cargo add tauri-plugin-notification
npm install @tauri-apps/plugin-notification
```

```json
{
  "permissions": ["notification:default"]
}
```

```ts
import { sendNotification } from "@tauri-apps/plugin-notification";

sendNotification({
  title: "Nueva tarea",
  body: "Tienes 3 tareas pendientes",
});
```

### Dialog (Abrir/Guardar Archivos)

```bash
cargo add tauri-plugin-dialog
npm install @tauri-apps/plugin-dialog
```

```json
{
  "permissions": [
    "dialog:allow-open",
    "dialog:allow-save",
    "dialog:allow-message"
  ]
}
```

```ts
import { open, save } from "@tauri-apps/plugin-dialog";

const archivo = await open({
  filters: [{ name: "JSON", extensions: ["json"] }],
  multiple: false,
});

const ruta = await save({
  defaultPath: "config.json",
  filters: [{ name: "JSON", extensions: ["json"] }],
});
```

## Scopes de Seguridad

Para restringir qué archivos puede acceder la app:

```json
{
  "permissions": [
    {
      "identifier": "fs:allow-read-text-file",
      "allow": [
        { "path": "$APPDATA/mi-app/**" }
      ],
      "deny": [
        { "path": "$APPDATA/mi-app/secrets/**" }
      ]
    }
  ]
}
```

> **Principio de mínimo privilegio:** Solo solicitar los permisos estrictamente necesarios. En producción, especificar siempre scopes de rutas en lugar de `**` globales.
