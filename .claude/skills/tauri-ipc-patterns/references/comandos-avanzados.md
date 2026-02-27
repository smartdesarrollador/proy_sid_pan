# Referencia: Comandos Avanzados — Tauri v2

Comandos async, múltiples estados, scoped commands y patrones de arquitectura IPC.

## Comandos Asíncronos

```rust
// src-tauri/src/lib.rs
use tauri::State;

// Comando async: para operaciones de I/O, red, o que llaman a código async
#[tauri::command]
async fn buscar_datos(query: String) -> Result<Vec<String>, String> {
    // tokio está disponible en contextos async de Tauri
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    let resultados = vec![
        format!("resultado 1 para: {query}"),
        format!("resultado 2 para: {query}"),
    ];
    Ok(resultados)
}

// Comando async con estado
#[tauri::command]
async fn guardar_y_notificar(
    app: tauri::AppHandle,
    state: State<'_, ConfigMutex>,
    datos: String,
) -> Result<(), String> {
    // CRÍTICO: tomar el lock, hacer el trabajo, y SOLTAR el lock antes del await
    let ruta = {
        let guard = state.0.lock()
            .map_err(|e| format!("lock error: {e}"))?;
        guard.ruta_guardado.clone()
        // guard se suelta aquí al salir del bloque
    };

    // await sin mantener el MutexGuard
    tokio::fs::write(&ruta, &datos).await
        .map_err(|e| format!("write error: {e}"))?;

    // Notificar al frontend
    app.emit("datos-guardados", &ruta)
        .map_err(|e| format!("emit error: {e}"))?;

    Ok(())
}
```

## Múltiples Estados

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;

// Estado de configuración
pub struct ConfigMutex(pub Mutex<Config>);

// Estado de conexión DB
pub struct DbMutex(pub Mutex<Option<DbConnection>>);

// Estado de caché en memoria
pub struct CacheMutex(pub Mutex<HashMap<String, String>>);

#[tauri::command]
fn operacion_compleja(
    config: State<'_, ConfigMutex>,
    cache: State<'_, CacheMutex>,
    key: String,
) -> Result<String, String> {
    // Verificar caché primero
    {
        let cache_guard = cache.0.lock()
            .map_err(|e| format!("cache lock error: {e}"))?;
        if let Some(valor) = cache_guard.get(&key) {
            return Ok(valor.clone());
        }
    } // cache_guard liberado aquí

    // Obtener config
    let prefijo = {
        let config_guard = config.0.lock()
            .map_err(|e| format!("config lock error: {e}"))?;
        config_guard.prefijo.clone()
    }; // config_guard liberado aquí

    let resultado = format!("{prefijo}:{key}");

    // Guardar en caché
    {
        let mut cache_guard = cache.0.lock()
            .map_err(|e| format!("cache lock error: {e}"))?;
        cache_guard.insert(key, resultado.clone());
    }

    Ok(resultado)
}

pub fn run() {
    tauri::Builder::default()
        // Registrar múltiples estados
        .manage(ConfigMutex(Mutex::new(Config::default())))
        .manage(DbMutex(Mutex::new(None)))
        .manage(CacheMutex(Mutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![operacion_compleja])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

## Comandos con AppHandle

`AppHandle` permite acceder a cualquier ventana, emitir eventos, y obtener estado desde cualquier lugar:

```rust
#[tauri::command]
fn enviar_a_todas_las_ventanas(
    app: tauri::AppHandle,
    mensaje: String,
) -> Result<(), String> {
    use tauri::Manager;

    // Iterar sobre todas las ventanas
    for (label, window) in app.webview_windows() {
        window.emit("mensaje-global", &mensaje)
            .map_err(|e| format!("emit a {label} error: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
fn obtener_ventana_especifica(
    app: tauri::AppHandle,
    label: String,
) -> Result<bool, String> {
    use tauri::Manager;
    Ok(app.get_webview_window(&label).is_some())
}
```

## Módulos de Comandos

Para proyectos grandes, organizar comandos en módulos:

```
src-tauri/src/
├── lib.rs
├── commands/
│   ├── mod.rs
│   ├── config.rs
│   ├── files.rs
│   └── ui.rs
```

```rust
// src-tauri/src/commands/config.rs
use tauri::State;
use crate::ConfigMutex;

#[tauri::command]
pub fn obtener_tema(state: State<'_, ConfigMutex>) -> Result<String, String> {
    let guard = state.0.lock()
        .map_err(|e| format!("lock: {e}"))?;
    Ok(guard.tema.clone())
}

#[tauri::command]
pub fn cambiar_tema(
    state: State<'_, ConfigMutex>,
    tema: String,
) -> Result<(), String> {
    let mut guard = state.0.lock()
        .map_err(|e| format!("lock: {e}"))?;
    guard.tema = tema;
    Ok(())
}
```

```rust
// src-tauri/src/commands/mod.rs
pub mod config;
pub mod files;
pub mod ui;
```

```rust
// src-tauri/src/lib.rs
mod commands;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::config::obtener_tema,
            commands::config::cambiar_tema,
            commands::files::leer_archivo,
            commands::ui::abrir_ventana,
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

## Testing de Comandos

```rust
// src-tauri/src/commands/config.rs (con tests)
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    fn crear_estado() -> ConfigMutex {
        ConfigMutex(Mutex::new(Config {
            tema: "claro".to_string(),
            ..Default::default()
        }))
    }

    #[test]
    fn test_cambio_tema() {
        let state = crear_estado();
        // Nota: los tests de comandos Tauri no requieren AppHandle real
        // para lógica pura
        let mut guard = state.0.lock().unwrap();
        guard.tema = "oscuro".to_string();
        assert_eq!(guard.tema, "oscuro");
    }
}
```

## Patrón Repository (Separar Lógica de Comandos)

```rust
// src-tauri/src/repository/config_repo.rs
pub struct ConfigRepository {
    ruta_config: std::path::PathBuf,
}

impl ConfigRepository {
    pub fn new(app_data_dir: std::path::PathBuf) -> Self {
        ConfigRepository {
            ruta_config: app_data_dir.join("config.json"),
        }
    }

    pub fn cargar(&self) -> Result<Config, String> {
        let contenido = std::fs::read_to_string(&self.ruta_config)
            .map_err(|e| format!("lectura: {e}"))?;
        serde_json::from_str(&contenido)
            .map_err(|e| format!("parse: {e}"))
    }

    pub fn guardar(&self, config: &Config) -> Result<(), String> {
        let json = serde_json::to_string_pretty(config)
            .map_err(|e| format!("serialización: {e}"))?;
        std::fs::write(&self.ruta_config, json)
            .map_err(|e| format!("escritura: {e}"))
    }
}

// El comando solo coordina, no contiene lógica
#[tauri::command]
fn cargar_config(
    app: tauri::AppHandle,
    state: State<'_, ConfigMutex>,
) -> Result<Config, String> {
    use tauri::Manager;
    let dir = app.app_data_dir()
        .map_err(|e| e.to_string())?;
    let repo = ConfigRepository::new(dir);
    let config = repo.cargar()?;

    let mut guard = state.0.lock()
        .map_err(|e| format!("lock: {e}"))?;
    *guard = config.clone();
    Ok(config)
}
```
