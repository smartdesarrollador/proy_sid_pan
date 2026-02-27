---
name: tauri-ipc-patterns
description: Patrones IPC Rust y TypeScript en Tauri v2. Usar cuando se necesite definir comandos Tauri con invoke, estado global con Mutex, serialización Serde snake_case a camelCase, manejo de errores tipados con Result, eventos bidireccionales con emit y listen, o código condicional por plataforma. Stack Tauri v2, Serde 1, Rust 2021.
---

# Tauri v2 — Patrones IPC (Rust ↔ TypeScript)

Guía completa para comunicación entre el backend Rust y el frontend React en Tauri v2.

## Comandos Básicos

### Rust — Definir el comando

```rust
// src-tauri/src/lib.rs

// Comando simple: recibe parámetros, retorna Result
#[tauri::command]
fn saludar(nombre: &str) -> Result<String, String> {
    if nombre.is_empty() {
        return Err("El nombre no puede estar vacío".to_string());
    }
    Ok(format!("Hola, {}!", nombre))
}

// Registrar en el builder
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![saludar])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

### TypeScript — Invocar el comando

```ts
// src/api/comandos.ts
import { invoke } from "@tauri-apps/api/core";

// Tipado explícito del retorno
async function saludar(nombre: string): Promise<string> {
  return invoke<string>("saludar", { nombre });
}

// Manejo de errores
async function saludarSeguro(nombre: string): Promise<string | null> {
  try {
    return await invoke<string>("saludar", { nombre });
  } catch (error) {
    console.error("Error al saludar:", error);
    return null;
  }
}
```

> **Importante:** Los nombres de parámetros en `invoke()` deben ser `camelCase` en TypeScript. Tauri los convierte automáticamente a `snake_case` para Rust.

## Estado Global con Mutex

Patrón para compartir estado entre comandos en Tauri v2:

```rust
// src-tauri/src/lib.rs
use std::sync::Mutex;
use tauri::State;

// 1. Definir la estructura de estado
pub struct ConfigApp {
    pub panel_activo: Option<String>,
    pub ancho_panel: i32,
    pub tema: String,
}

impl Default for ConfigApp {
    fn default() -> Self {
        ConfigApp {
            panel_activo: None,
            ancho_panel: 320,
            tema: "oscuro".to_string(),
        }
    }
}

// 2. Wrapper con Mutex para thread-safety
pub struct ConfigMutex(pub Mutex<ConfigApp>);

// 3. Comandos que acceden al estado
#[tauri::command]
fn obtener_ancho(state: State<'_, ConfigMutex>) -> Result<i32, String> {
    let guard = state.0.lock()
        .map_err(|e| format!("lock error: {e}"))?;
    Ok(guard.ancho_panel)
}

#[tauri::command]
fn actualizar_ancho(
    state: State<'_, ConfigMutex>,
    ancho: i32,
) -> Result<(), String> {
    let mut guard = state.0.lock()
        .map_err(|e| format!("lock error: {e}"))?;
    guard.ancho_panel = ancho;
    Ok(())
}

// 4. Registrar el estado con .manage()
pub fn run() {
    tauri::Builder::default()
        .manage(ConfigMutex(Mutex::new(ConfigApp::default())))
        .invoke_handler(tauri::generate_handler![
            obtener_ancho,
            actualizar_ancho,
        ])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

```ts
// src/api/config.ts
import { invoke } from "@tauri-apps/api/core";

export const obtenerAncho = () => invoke<number>("obtener_ancho");
export const actualizarAncho = (ancho: number) =>
  invoke<void>("actualizar_ancho", { ancho });
```

> **Regla crítica:** Cerrar el `MutexGuard` (drop) antes de cualquier operación `.await` o llamada lenta. Mantener el guard durante un `await` bloquea el mutex y puede causar deadlocks.

## Comandos con `Window` Handle

Para comandos que necesitan manipular la ventana directamente:

```rust
// src-tauri/src/lib.rs
use tauri::Manager;

#[tauri::command]
fn centrar_ventana(window: tauri::WebviewWindow) -> Result<(), String> {
    window.center()
        .map_err(|e| format!("error al centrar: {e}"))?;
    Ok(())
}

#[tauri::command]
fn redimensionar_ventana(
    window: tauri::WebviewWindow,
    ancho: u32,
    alto: u32,
) -> Result<(), String> {
    use tauri::PhysicalSize;
    window.set_size(PhysicalSize::new(ancho, alto))
        .map_err(|e| format!("error al redimensionar: {e}"))?;
    Ok(())
}

// Para operaciones que DEBEN ejecutarse en el hilo principal (ej: Win32)
#[tauri::command]
fn operacion_hilo_principal(window: tauri::WebviewWindow) -> Result<(), String> {
    window.run_on_main_thread(move || {
        // Código que requiere el UI thread (ej: SetWindowSubclass)
        println!("ejecutando en el hilo principal");
    }).map_err(|e| format!("run_on_main_thread error: {e}"))?;
    Ok(())
}
```

## Serialización con Serde (Rust ↔ JSON ↔ TypeScript)

```rust
// src-tauri/src/lib.rs
use serde::{Deserialize, Serialize};

// Struct enviado desde TypeScript → Rust
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]  // panelActivo → panel_activo
pub struct ConfiguracionPanel {
    pub panel_activo: Option<String>,
    pub ancho_panel: i32,
    pub mostrar_tooltip: bool,
}

// Struct enviado desde Rust → TypeScript
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]  // panel_activo → panelActivo
pub struct EstadoApp {
    pub panel_activo: Option<String>,
    pub ancho_total: i32,
    pub version: String,
}

#[tauri::command]
fn aplicar_configuracion(
    config: ConfiguracionPanel,
) -> Result<EstadoApp, String> {
    Ok(EstadoApp {
        panel_activo: config.panel_activo,
        ancho_total: config.ancho_panel + 60, // 60 = ancho iconos
        version: "1.0.0".to_string(),
    })
}
```

```ts
// src/types/index.ts
interface ConfiguracionPanel {
  panelActivo: string | null;
  anchoPanel: number;
  mostrarTooltip: boolean;
}

interface EstadoApp {
  panelActivo: string | null;
  anchoTotal: number;
  version: string;
}

// src/api/config.ts
import { invoke } from "@tauri-apps/api/core";

export const aplicarConfiguracion = (config: ConfiguracionPanel) =>
  invoke<EstadoApp>("aplicar_configuracion", { config });
```

> **Convención:** Usar `#[serde(rename_all = "camelCase")]` en structs serializados/deserializados para mantener convenciones JS en TypeScript y Rust en Rust.

## Manejo de Errores Tipados

Para errores más descriptivos que `String`:

```rust
// src-tauri/src/errors.rs
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(tag = "tipo", content = "mensaje")]
pub enum AppError {
    NoEncontrado(String),
    PermisosDenegados(String),
    ErrorInterno(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::NoEncontrado(m) => write!(f, "No encontrado: {m}"),
            AppError::PermisosDenegados(m) => write!(f, "Permisos denegados: {m}"),
            AppError::ErrorInterno(m) => write!(f, "Error interno: {m}"),
        }
    }
}

// Conversión desde String para compatibilidad
impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError::ErrorInterno(s)
    }
}
```

```rust
// src-tauri/src/lib.rs
mod errors;
use errors::AppError;

#[tauri::command]
fn leer_archivo(ruta: &str) -> Result<String, AppError> {
    std::fs::read_to_string(ruta)
        .map_err(|e| AppError::NoEncontrado(format!("archivo '{ruta}': {e}")))
}
```

```ts
// src/types/errores.ts
interface AppError {
  tipo: "NoEncontrado" | "PermisosDenegados" | "ErrorInterno";
  mensaje: string;
}

// src/api/archivos.ts
import { invoke } from "@tauri-apps/api/core";

async function leerArchivo(ruta: string): Promise<string> {
  try {
    return await invoke<string>("leer_archivo", { ruta });
  } catch (error) {
    const appError = error as AppError;
    if (appError.tipo === "NoEncontrado") {
      console.warn("Archivo no encontrado:", appError.mensaje);
    }
    throw error;
  }
}
```

## Eventos Bidireccionales

### Rust → TypeScript (emitir eventos)

```rust
// src-tauri/src/lib.rs
use serde::Serialize;
use tauri::Manager;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct EventoProgreso {
    progreso: f32,
    mensaje: String,
}

#[tauri::command]
async fn tarea_larga(app: tauri::AppHandle) -> Result<(), String> {
    for i in 0..10 {
        // Simular trabajo
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        // Emitir evento al frontend
        app.emit("progreso-tarea", EventoProgreso {
            progreso: (i + 1) as f32 / 10.0,
            mensaje: format!("Paso {} de 10", i + 1),
        }).map_err(|e| format!("emit error: {e}"))?;
    }
    Ok(())
}
```

### TypeScript → Rust (escuchar y limpiar)

```ts
// src/hooks/useEventoRust.ts
import { useEffect } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

interface EventoProgreso {
  progreso: number;
  mensaje: string;
}

function useProgresoTarea(
  onProgreso: (evento: EventoProgreso) => void
): void {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    // Suscribirse al evento
    listen<EventoProgreso>("progreso-tarea", (event) => {
      onProgreso(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    // Cleanup: desuscribirse al desmontar
    return () => {
      unlisten?.();
    };
  }, [onProgreso]);
}
```

### TypeScript → Rust (emitir al backend)

```ts
// src/api/eventos.ts
import { emit } from "@tauri-apps/api/event";

// Emitir evento que Rust puede escuchar
await emit("tema-cambiado", { tema: "oscuro" });
```

## Código Condicional por Plataforma

```rust
// src-tauri/src/lib.rs

// Módulo solo compilado en Windows
#[cfg(target_os = "windows")]
mod appbar;

#[tauri::command]
fn registrar_appbar(
    window: tauri::WebviewWindow,
    ancho: i32,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Implementación real en Windows
        appbar::registration::registrar(window, ancho)?;
    }

    // En otras plataformas: retornar error descriptivo
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (window, ancho); // evitar warnings de unused
        return Err("AppBar solo está disponible en Windows".to_string());
    }

    Ok(())
}
```

```ts
// src/api/plataforma.ts
import { invoke } from "@tauri-apps/api/core";

export async function registrarAppbar(ancho: number): Promise<void> {
  try {
    await invoke("registrar_appbar", { ancho });
  } catch (error) {
    // En macOS/Linux: "AppBar solo está disponible en Windows"
    console.warn("AppBar no disponible:", error);
  }
}
```

## Patrones ✅ / ❌

- ✅ Siempre `Result<T, String>` (o `Result<T, AppError>`) en comandos
- ✅ `map_err(|e| format!("contexto: {e}"))` para errores descriptivos
- ✅ Cerrar el `MutexGuard` antes de operaciones lentas o `await`
- ✅ `#[serde(rename_all = "camelCase")]` para consistencia JS ↔ Rust
- ✅ `unlisten?.()` en cleanup de `useEffect` para eventos
- ✅ `#[cfg(not(target_os = "windows"))]` con `Err("solo en Windows")` para graceful degradation
- ❌ `unwrap()` en comandos (el panic no es capturado por Tauri, bloquea el comando)
- ❌ Mantener `MutexGuard` durante `.await` (deadlock)
- ❌ Olvidar el cleanup de `listen()` (memory leak de listeners)
- ❌ `invoke("comando")` sin manejar el rechazo de la Promise

## Referencias Adicionales

- **[Comandos Avanzados](references/comandos-avanzados.md)** — Comandos async, scoped commands, comandos con múltiples estados
- **[Eventos Rust ↔ JS](references/eventos-rust-js.md)** — Patrones completos de eventos, channels, payload tipados

---

**Resumen:** El IPC en Tauri v2 usa `invoke()` (TypeScript) + `#[tauri::command]` (Rust). El estado compartido va en `Mutex<T>` registrado con `.manage()`. Los errores deben ser `Result<T, String>` (nunca `unwrap()`), y los eventos bidireccionales requieren cleanup con `unlisten()`.
