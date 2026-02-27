# Referencia: File System y System Tray — Tauri v2

Permisos avanzados de filesystem, watchers de archivos, y tray con íconos dinámicos.

## File System — Patrones Completos

### Leer/Escribir Archivos de Configuración

```rust
// src-tauri/src/commands/config_fs.rs
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConfigUsuario {
    pub tema: String,
    pub panel_activo: Option<String>,
    pub ancho_panel: i32,
    pub atajos: Vec<String>,
}

fn ruta_config(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.app_data_dir()
        .map(|dir| dir.join("config.json"))
        .map_err(|e| format!("app_data_dir: {e}"))
}

#[tauri::command]
pub fn cargar_config(app: tauri::AppHandle) -> Result<ConfigUsuario, String> {
    let ruta = ruta_config(&app)?;

    if !ruta.exists() {
        return Ok(ConfigUsuario {
            tema: "oscuro".to_string(),
            ancho_panel: 320,
            ..Default::default()
        });
    }

    let contenido = std::fs::read_to_string(&ruta)
        .map_err(|e| format!("lectura '{ruta:?}': {e}"))?;

    serde_json::from_str(&contenido)
        .map_err(|e| format!("parse config: {e}"))
}

#[tauri::command]
pub fn guardar_config(
    app: tauri::AppHandle,
    config: ConfigUsuario,
) -> Result<(), String> {
    let ruta = ruta_config(&app)?;

    // Crear directorio si no existe
    if let Some(dir) = ruta.parent() {
        std::fs::create_dir_all(dir)
            .map_err(|e| format!("crear dir '{dir:?}': {e}"))?;
    }

    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("serialización: {e}"))?;

    std::fs::write(&ruta, json)
        .map_err(|e| format!("escritura '{ruta:?}': {e}"))?;

    Ok(())
}
```

### TypeScript — Usar desde React

```ts
// src/api/config.ts
import { invoke } from "@tauri-apps/api/core";

interface ConfigUsuario {
  tema: string;
  panelActivo: string | null;
  anchoPanel: number;
  atajos: string[];
}

export const cargarConfig = () => invoke<ConfigUsuario>("cargar_config");
export const guardarConfig = (config: ConfigUsuario) =>
  invoke<void>("guardar_config", { config });
```

```tsx
// src/hooks/useConfig.ts
import { useState, useEffect, useCallback } from "react";
import { cargarConfig, guardarConfig } from "../api/config";

function useConfig() {
  const [config, setConfig] = useState<ConfigUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarConfig()
      .then(setConfig)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const actualizar = useCallback(async (cambios: Partial<ConfigUsuario>) => {
    if (!config) return;
    const nuevaConfig = { ...config, ...cambios };
    setConfig(nuevaConfig);
    await guardarConfig(nuevaConfig).catch(console.error);
  }, [config]);

  return { config, cargando, actualizar };
}
```

### Rutas de Directorio Disponibles

```rust
// En Rust (con tauri::Manager)
use tauri::Manager;

fn rutas_disponibles(app: &tauri::AppHandle) -> HashMap<String, PathBuf> {
    let mut rutas = HashMap::new();
    if let Ok(dir) = app.app_data_dir()     { rutas.insert("datos".into(), dir); }
    if let Ok(dir) = app.app_config_dir()   { rutas.insert("config".into(), dir); }
    if let Ok(dir) = app.app_local_data_dir(){ rutas.insert("local".into(), dir); }
    if let Ok(dir) = app.app_log_dir()      { rutas.insert("logs".into(), dir); }
    if let Ok(dir) = app.app_cache_dir()    { rutas.insert("cache".into(), dir); }
    rutas
}
```

```ts
// En TypeScript (@tauri-apps/api/path)
import {
  appDataDir,
  appConfigDir,
  appLocalDataDir,
  appLogDir,
  appCacheDir,
  desktopDir,
  downloadDir,
  documentDir,
} from "@tauri-apps/api/path";

const dirDatos = await appDataDir();    // %APPDATA%\com.miapp.app\
const dirConfig = await appConfigDir(); // %APPDATA%\com.miapp.app\
const dirLocal = await appLocalDataDir(); // %LOCALAPPDATA%\com.miapp.app\
```

### File Watcher (Detectar Cambios)

```rust
// Cargo.toml
// notify = "6"
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;

#[tauri::command]
async fn iniciar_watcher(
    app: tauri::AppHandle,
    ruta: String,
) -> Result<(), String> {
    let (tx, rx) = mpsc::channel();

    let mut watcher = RecommendedWatcher::new(tx, Config::default())
        .map_err(|e| format!("watcher: {e}"))?;

    watcher.watch(std::path::Path::new(&ruta), RecursiveMode::Recursive)
        .map_err(|e| format!("watch: {e}"))?;

    // Spawner para escuchar cambios
    tokio::task::spawn_blocking(move || {
        let _watcher = watcher; // mantener vivo
        for evento in rx {
            match evento {
                Ok(evento) => {
                    let _ = app.emit("archivo-cambiado", format!("{:?}", evento.paths));
                }
                Err(e) => eprintln!("watcher error: {e}"),
            }
        }
    });

    Ok(())
}
```

## System Tray — Patrones Completos

### Tray con Ícono Dinámico

```rust
// src-tauri/src/lib.rs
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Construir menú del tray
            let separador = PredefinedMenuItem::separator(app)?;
            let mostrar = MenuItem::with_id(app, "mostrar", "Mostrar panel", true, None::<&str>)?;
            let pausar = MenuItem::with_id(app, "pausar", "Pausar", true, None::<&str>)?;
            let salir = MenuItem::with_id(app, "salir", "Salir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&mostrar, &pausar, &separador, &salir])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Sidebar — activo")
                .show_menu_on_left_click(false) // Solo clic derecho abre el menú
                .on_menu_event(|app, evento| {
                    match evento.id.as_ref() {
                        "mostrar" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "pausar" => {
                            // Cambiar estado de pausa...
                        }
                        "salir" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, evento| {
                    if let TrayIconEvent::Click { button, .. } = evento {
                        use tauri::tray::MouseButton;
                        if button == MouseButton::Left {
                            // Clic izquierdo: mostrar/ocultar ventana
                            let app = tray.app_handle();
                            if let Some(w) = app.get_webview_window("main") {
                                if w.is_visible().unwrap_or(false) {
                                    let _ = w.hide();
                                } else {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
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

### Actualizar Tray desde Comando

```rust
use tauri::{tray::TrayIcon, Manager};

#[tauri::command]
fn actualizar_tray_tooltip(
    app: tauri::AppHandle,
    mensaje: String,
) -> Result<(), String> {
    // Obtener el tray icon por ID (ID por defecto es el primero creado)
    if let Some(tray) = app.tray_by_id("") {
        tray.set_tooltip(Some(&mensaje))
            .map_err(|e| format!("set_tooltip: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
fn cambiar_icono_tray(
    app: tauri::AppHandle,
    ruta_icono: String,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("") {
        let imagen = Image::from_path(&ruta_icono)
            .map_err(|e| format!("cargar icono: {e}"))?;
        tray.set_icon(Some(imagen))
            .map_err(|e| format!("set_icon: {e}"))?;
    }
    Ok(())
}
```

### Permisos para Tray

```json
{
  "permissions": [
    "core:tray:default",
    "core:tray:allow-set-tooltip",
    "core:tray:allow-set-icon",
    "core:tray:allow-set-visible",
    "core:tray:allow-set-menu"
  ]
}
```

## Autostart con el Sistema

```bash
cargo add tauri-plugin-autostart
npm install @tauri-apps/plugin-autostart
```

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimizado"]),
        ))
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

```ts
import {
  enable,
  disable,
  isEnabled,
} from "@tauri-apps/plugin-autostart";

// Habilitar autostart
await enable();
const estaHabilitado = await isEnabled();
await disable();
```

```json
{
  "permissions": [
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled"
  ]
}
```
