# Referencia: Hooks Tauri — React + TypeScript

Colección completa de hooks para interactuar con Tauri desde React con tipos estrictos.

## `useInvoke` — Comando con Estado

```ts
// src/hooks/useInvoke.ts
import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseInvokeState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseInvokeResult<T> extends UseInvokeState<T> {
  ejecutar: (payload?: Record<string, unknown>) => Promise<T | null>;
  resetear: () => void;
}

function useInvoke<T>(comando: string): UseInvokeResult<T> {
  const [estado, setEstado] = useState<UseInvokeState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const ejecutar = useCallback(
    async (payload?: Record<string, unknown>): Promise<T | null> => {
      setEstado((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const resultado = await invoke<T>(comando, payload);
        setEstado({ data: resultado, loading: false, error: null });
        return resultado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : String(err);
        setEstado({ data: null, loading: false, error: mensaje });
        return null;
      }
    },
    [comando]
  );

  const resetear = useCallback(() => {
    setEstado({ data: null, loading: false, error: null });
  }, []);

  return { ...estado, ejecutar, resetear };
}

export default useInvoke;
```

## `useInvokeAuto` — Ejecución Automática al Montar

```ts
// src/hooks/useInvokeAuto.ts
import { useEffect } from "react";
import useInvoke from "./useInvoke";

function useInvokeAuto<T>(
  comando: string,
  payload?: Record<string, unknown>
) {
  const resultado = useInvoke<T>(comando);

  useEffect(() => {
    resultado.ejecutar(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comando]); // Solo al montar (comando es estable)

  return resultado;
}

export default useInvokeAuto;
```

```tsx
// Uso:
function ArchivosPanel() {
  const { data: archivos, loading, error } =
    useInvokeAuto<string[]>("listar_archivos", { directorio: "/" });

  if (loading) return <Spinner />;
  if (error) return <Error mensaje={error} />;
  return <ListaArchivos archivos={archivos ?? []} />;
}
```

## `useEvento` — Suscripción a Evento Rust

```ts
// src/hooks/useEvento.ts
import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

function useEvento<T>(
  evento: string,
  handler: (payload: T) => void
): void {
  // Ref para el handler: evita re-suscripciones cuando el callback cambia
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    listen<T>(evento, (event) => {
      handlerRef.current(event.payload);
    }).then((fn) => {
      unlisten = fn;
    }).catch(console.error);

    return () => {
      unlisten?.();
    };
  }, [evento]); // Solo re-suscribir si cambia el nombre del evento
}

export default useEvento;
```

```tsx
// Uso:
function BarraProgreso() {
  const [progreso, setProgreso] = useState(0);

  useEvento<{ porcentaje: number }>("progreso-tarea", (payload) => {
    setProgreso(payload.porcentaje);
  });

  return (
    <div className="h-1 bg-gray-700">
      <div className="h-full bg-blue-500" style={{ width: `${progreso}%` }} />
    </div>
  );
}
```

## `useVentana` — Control de Ventana

```ts
// src/hooks/useVentana.ts
import { useCallback } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";

interface UseVentanaResult {
  minimizar: () => Promise<void>;
  cerrar: () => Promise<void>;
  ocultar: () => Promise<void>;
  mostrar: () => Promise<void>;
  setTamaño: (ancho: number, alto: number) => Promise<void>;
}

function useVentana(): UseVentanaResult {
  const ventana = getCurrentWebviewWindow();

  const minimizar = useCallback(async () => {
    await ventana.minimize();
  }, [ventana]);

  const cerrar = useCallback(async () => {
    await ventana.close();
  }, [ventana]);

  const ocultar = useCallback(async () => {
    await ventana.hide();
  }, [ventana]);

  const mostrar = useCallback(async () => {
    await ventana.show();
    await ventana.setFocus();
  }, [ventana]);

  const setTamaño = useCallback(async (ancho: number, alto: number) => {
    await invoke("redimensionar_ventana", { ancho, alto });
  }, []);

  return { minimizar, cerrar, ocultar, mostrar, setTamaño };
}

export default useVentana;
```

## `useAppDir` — Directorio de la App

```ts
// src/hooks/useAppDir.ts
import { useState, useEffect } from "react";
import { appDataDir, appConfigDir, appLocalDataDir } from "@tauri-apps/api/path";

interface AppDirs {
  data: string | null;
  config: string | null;
  localData: string | null;
  cargando: boolean;
  error: string | null;
}

function useAppDir(): AppDirs {
  const [dirs, setDirs] = useState<AppDirs>({
    data: null,
    config: null,
    localData: null,
    cargando: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([appDataDir(), appConfigDir(), appLocalDataDir()])
      .then(([data, config, localData]) => {
        setDirs({ data, config, localData, cargando: false, error: null });
      })
      .catch((err) => {
        setDirs((prev) => ({
          ...prev,
          cargando: false,
          error: String(err),
        }));
      });
  }, []);

  return dirs;
}

export default useAppDir;
```

## `useResizeable` — Panel Redimensionable

```ts
// src/hooks/useResizeable.ts
import { useState, useCallback } from "react";

interface UseResizeableOpciones {
  anchoInicial: number;
  anchoMin?: number;
  anchoMax?: number;
  onCambioFinal?: (ancho: number) => void;
}

interface UseResizeableResult {
  anchoActual: number;
  isDragging: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;
}

function useResizeable({
  anchoInicial,
  anchoMin = 200,
  anchoMax = 600,
  onCambioFinal,
}: UseResizeableOpciones): UseResizeableResult {
  const [anchoActual, setAnchoActual] = useState(anchoInicial);
  const [isDragging, setIsDragging] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startAncho = anchoActual;
      setIsDragging(true);

      const clamp = (val: number) =>
        Math.max(anchoMin, Math.min(anchoMax, val));

      const handleMouseMove = (ev: MouseEvent) => {
        const delta = startX - ev.clientX; // Panel derecho: invertir delta
        setAnchoActual(clamp(startAncho + delta));
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const anchoFinal = clamp(startAncho + delta);
        setAnchoActual(anchoFinal);
        setIsDragging(false);
        onCambioFinal?.(anchoFinal);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [anchoActual, anchoMin, anchoMax, onCambioFinal]
  );

  return { anchoActual, isDragging, handleResizeStart };
}

export default useResizeable;
```

```tsx
// Uso:
function PanelConResize({ onCambioAncho }: { onCambioAncho: (a: number) => void }) {
  const { anchoActual, isDragging, handleResizeStart } = useResizeable({
    anchoInicial: 320,
    anchoMin: 200,
    anchoMax: 600,
    onCambioFinal: onCambioAncho,
  });

  return (
    <div
      className={`relative h-full ${!isDragging ? "transition-[width] duration-200" : ""}`}
      style={{ width: anchoActual }}
    >
      {/* Handle de resize */}
      <div
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-ew-resize
                   hover:bg-blue-500/50"
        onMouseDown={handleResizeStart}
      />
      <div className="h-full overflow-y-auto p-4">
        Contenido del panel
      </div>
    </div>
  );
}
```

## `useAtajosTeclado` — Atajos Globales

```ts
// src/hooks/useAtajosTeclado.ts
import { useEffect, useRef } from "react";

type ModificadorTecla = "ctrl" | "alt" | "shift" | "meta";

interface AtajoConfig {
  tecla: string;
  modificadores?: ModificadorTecla[];
  accion: () => void;
  descripcion?: string;
}

function useAtajosTeclado(atajos: AtajoConfig[]): void {
  const atajosRef = useRef(atajos);
  atajosRef.current = atajos;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const atajo of atajosRef.current) {
        const modificadoresOk = (atajo.modificadores ?? []).every((mod) => {
          switch (mod) {
            case "ctrl": return e.ctrlKey;
            case "alt": return e.altKey;
            case "shift": return e.shiftKey;
            case "meta": return e.metaKey;
          }
        });

        if (modificadoresOk && e.key.toLowerCase() === atajo.tecla.toLowerCase()) {
          e.preventDefault();
          atajo.accion();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // Los atajos actualizados se leen via ref
}

export default useAtajosTeclado;
```

```tsx
// Uso:
function App() {
  const [panelActivo, setPanelActivo] = useState<string | null>(null);

  useAtajosTeclado([
    { tecla: "1", modificadores: ["ctrl"], accion: () => setPanelActivo("inicio") },
    { tecla: "2", modificadores: ["ctrl"], accion: () => setPanelActivo("chat") },
    { tecla: "Escape", accion: () => setPanelActivo(null) },
  ]);

  return <Layout panelActivo={panelActivo} />;
}
```
