# Referencia: Eventos Rust ↔ JavaScript — Tauri v2

Patrones completos de eventos bidireccionales, channels para streaming, y payload tipados.

## Eventos Rust → JS: `emit()`

### Desde AppHandle (a todas las ventanas)

```rust
use serde::Serialize;
use tauri::Manager;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct EventoDescarga {
    bytes_descargados: u64,
    bytes_totales: u64,
    porcentaje: f32,
    archivo: String,
}

#[tauri::command]
async fn descargar_archivo(
    app: tauri::AppHandle,
    url: String,
) -> Result<(), String> {
    let total = 1_000_000u64;

    for i in 0..=10 {
        let descargado = (i * total) / 10;

        app.emit("descarga-progreso", EventoDescarga {
            bytes_descargados: descargado,
            bytes_totales: total,
            porcentaje: i as f32 * 10.0,
            archivo: url.clone(),
        }).map_err(|e| format!("emit: {e}"))?;

        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    app.emit("descarga-completada", &url)
        .map_err(|e| format!("emit: {e}"))?;

    Ok(())
}
```

### Desde WebviewWindow (a una ventana específica)

```rust
#[tauri::command]
fn notificar_ventana_especifica(
    window: tauri::WebviewWindow,
    mensaje: String,
) -> Result<(), String> {
    // Solo emite a la ventana que invocó el comando
    window.emit("notificacion-local", &mensaje)
        .map_err(|e| format!("emit: {e}"))?;
    Ok(())
}
```

## Eventos JS → JS: `emit()` desde TypeScript

```ts
// src/api/eventos.ts
import { emit, emitTo } from "@tauri-apps/api/event";

// Emitir a todas las ventanas
await emit("panel-cambiado", { panelId: "chat" });

// Emitir a ventana específica
await emitTo("settings", "preferencias-actualizadas", { tema: "oscuro" });
```

## Escuchar Eventos con Cleanup

### Hook completo con TypeScript

```ts
// src/hooks/useEventoTauri.ts
import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

interface EventoDescarga {
  bytesDescargados: number;
  bytesTotales: number;
  porcentaje: number;
  archivo: string;
}

interface UseEventoDescargarOpciones {
  onProgreso: (evento: EventoDescarga) => void;
  onCompletado: (archivo: string) => void;
  onError?: (error: string) => void;
}

function useEventoDescarga({
  onProgreso,
  onCompletado,
  onError,
}: UseEventoDescargarOpciones): void {
  // useRef para los callbacks (evita re-suscripciones innecesarias)
  const onProgresoRef = useRef(onProgreso);
  const onCompletadoRef = useRef(onCompletado);
  onProgresoRef.current = onProgreso;
  onCompletadoRef.current = onCompletado;

  useEffect(() => {
    const unlistens: UnlistenFn[] = [];

    const setup = async () => {
      const u1 = await listen<EventoDescarga>("descarga-progreso", (event) => {
        onProgresoRef.current(event.payload);
      });

      const u2 = await listen<string>("descarga-completada", (event) => {
        onCompletadoRef.current(event.payload);
      });

      unlistens.push(u1, u2);
    };

    setup().catch(onError ?? console.error);

    // Cleanup: desuscribir todos los listeners
    return () => {
      unlistens.forEach((unlisten) => unlisten());
    };
  }, []); // Sin dependencias: solo montar/desmontar
}

export default useEventoDescarga;
```

### Uso del hook

```tsx
function DescargaPanel() {
  const [progreso, setProgreso] = useState(0);
  const [archivo, setArchivo] = useState<string | null>(null);

  useEventoDescarga({
    onProgreso: (evento) => {
      setProgreso(evento.porcentaje);
    },
    onCompletado: (archivoDescargado) => {
      setArchivo(archivoDescargado);
      setProgreso(100);
    },
  });

  return (
    <div className="p-4">
      <div className="h-2 bg-gray-700 rounded">
        <div
          className="h-full bg-blue-500 rounded transition-all"
          style={{ width: `${progreso}%` }}
        />
      </div>
      {archivo && <p className="mt-2 text-sm text-gray-400">Descargado: {archivo}</p>}
    </div>
  );
}
```

## Channels para Streaming de Datos

Para streams de datos de alto volumen, Tauri v2 ofrece `Channel`:

```rust
use tauri::ipc::Channel;
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogEntry {
    nivel: String,
    mensaje: String,
    timestamp: u64,
}

#[tauri::command]
async fn iniciar_log_stream(
    on_event: Channel<LogEntry>,
) -> Result<(), String> {
    for i in 0..100 {
        on_event.send(LogEntry {
            nivel: "INFO".to_string(),
            mensaje: format!("Log entry {i}"),
            timestamp: i as u64 * 1000,
        }).map_err(|e| format!("channel send: {e}"))?;

        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    Ok(())
}
```

```ts
// src/api/logs.ts
import { invoke, Channel } from "@tauri-apps/api/core";

interface LogEntry {
  nivel: string;
  mensaje: string;
  timestamp: number;
}

async function iniciarLogStream(
  onLog: (entry: LogEntry) => void
): Promise<void> {
  const canal = new Channel<LogEntry>();
  canal.onmessage = onLog;

  await invoke("iniciar_log_stream", { onEvent: canal });
}
```

## Evento Once (Escuchar Solo Una Vez)

```ts
import { once } from "@tauri-apps/api/event";

// Se desuscribe automáticamente después del primer evento
const inicialización = await once<{ version: string }>("app-lista");
console.log("App lista, versión:", inicialización.payload.version);
```

## Eventos del Sistema de Tauri

Eventos emitidos automáticamente por Tauri que se pueden escuchar:

```ts
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

// Evento de cambio de tema del sistema (macOS/Windows)
await listen("tauri://theme-changed", (event) => {
  console.log("Tema del sistema:", event.payload); // "dark" | "light"
});

// Antes de cerrar la ventana
const window = getCurrentWebviewWindow();
await window.listen("tauri://close-requested", async () => {
  // Guardar estado antes de cerrar
  await guardarEstado();
  await window.close();
});
```

## Payload Tipado con Discriminated Unions

```rust
// Evento con múltiples variantes
#[derive(Clone, Serialize)]
#[serde(tag = "tipo", content = "datos", rename_all = "camelCase")]
enum EventoApp {
    PanelAbierto { panel_id: String },
    PanelCerrado,
    AnchoActualizado { ancho: i32 },
    Error { mensaje: String },
}

#[tauri::command]
fn emitir_evento_app(
    app: tauri::AppHandle,
    evento: EventoApp,
) -> Result<(), String> {
    app.emit("evento-app", evento)
        .map_err(|e| format!("emit: {e}"))
}
```

```ts
// src/types/eventos.ts
type EventoApp =
  | { tipo: "panelAbierto"; datos: { panelId: string } }
  | { tipo: "panelCerrado"; datos: null }
  | { tipo: "anchoActualizado"; datos: { ancho: number } }
  | { tipo: "error"; datos: { mensaje: string } };

// src/hooks/useEventoApp.ts
import { listen } from "@tauri-apps/api/event";

function useEventoApp(handler: (evento: EventoApp) => void): void {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<EventoApp>("evento-app", (event) => {
      handler(event.payload);
    }).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, [handler]);
}
```
