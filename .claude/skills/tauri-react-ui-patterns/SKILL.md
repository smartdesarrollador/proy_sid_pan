---
name: tauri-react-ui-patterns
description: Patrones de UI React para apps de escritorio con Tauri v2. Usar cuando se necesite layout con h-screen overflow-hidden, paneles con navegación lateral y PANEL_MAP, drag-to-resize con mouse events, tooltips en sidebar, hook useInvoke tipado, atajos de teclado con cleanup, o region de arrastre data-tauri-drag-region. Stack React 18, TypeScript 5, Tailwind 3.4.
---

# Tauri v2 + React — Patrones UI para Escritorio

Patrones específicos para construir interfaces de apps de escritorio con Tauri v2, React 18 y Tailwind CSS.

## Layout Raíz para Escritorio

En apps de escritorio **no** se usa `100vh` porque en Windows la altura de pantalla puede diferir. Usar `h-screen` con `overflow-hidden`:

```tsx
// src/App.tsx
function App() {
  return (
    // h-screen + overflow-hidden = ocupa exactamente el viewport sin scrollbar
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0f1a]">
      <IconStrip />
      <PanelContainer />
    </div>
  );
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Deshabilitar selección de texto (comportamiento esperado en desktop) */
* {
  -webkit-user-select: none;
  user-select: none;
}

/* Permitir selección solo donde tiene sentido */
input, textarea, [contenteditable] {
  -webkit-user-select: text;
  user-select: text;
}
```

> **Por qué `overflow-hidden`:** Evita barras de scroll en la raíz de la app. En desktop, la ventana tiene tamaño fijo — el scroll interno va en los paneles individuales.

## Patrón de Paneles con Navegación

```ts
// src/types/index.ts
export type PanelId =
  | "inicio"
  | "archivos"
  | "chat"
  | "tareas"
  | "notas"
  | "ajustes";
```

```tsx
// src/components/panels/PanelContainer.tsx
import type { PanelId } from "../../types";
import InicioPanel from "./InicioPanel";
import ArchivosPanel from "./ArchivosPanel";
import ChatPanel from "./ChatPanel";
import TareasPanel from "./TareasPanel";
import NotasPanel from "./NotasPanel";
import AjustesPanel from "./AjustesPanel";

// Mapa declarativo: PanelId → Componente
const PANEL_MAP: Record<PanelId, React.ComponentType> = {
  inicio: InicioPanel,
  archivos: ArchivosPanel,
  chat: ChatPanel,
  tareas: TareasPanel,
  notas: NotasPanel,
  ajustes: AjustesPanel,
};

interface PanelContainerProps {
  panelActivo: PanelId | null;
  anchoPanelPx: number;
  onCambioAncho: (ancho: number) => void;
}

export default function PanelContainer({
  panelActivo,
  anchoPanelPx,
  onCambioAncho,
}: PanelContainerProps) {
  const PanelActivo = panelActivo ? PANEL_MAP[panelActivo] : null;

  return (
    <div style={{ width: panelActivo ? anchoPanelPx : 0 }}
         className="relative h-full overflow-hidden bg-[#13131f] transition-[width] duration-200">
      {PanelActivo && <PanelActivo />}
    </div>
  );
}
```

```tsx
// src/App.tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PanelId } from "./types";

const ANCHO_ICONOS = 60;      // px del strip de iconos
const ANCHO_PANEL_DEFAULT = 320; // px del panel

function App() {
  const [panelActivo, setPanelActivo] = useState<PanelId | null>(null);
  const [anchoPanelPx, setAnchoPanelPx] = useState(ANCHO_PANEL_DEFAULT);

  // Registrar AppBar al montar
  useEffect(() => {
    invoke("register_appbar", { width: ANCHO_ICONOS }).catch(console.error);
    return () => {
      invoke("unregister_appbar").catch(console.error);
    };
  }, []);

  const handleCambioPanel = async (panel: PanelId) => {
    const nuevoPanel = panelActivo === panel ? null : panel;
    const nuevoAncho = nuevoPanel ? ANCHO_ICONOS + anchoPanelPx : ANCHO_ICONOS;
    setPanelActivo(nuevoPanel);
    await invoke("resize_appbar", { width: nuevoAncho }).catch(console.error);
  };

  const handleCambioAnchoPanelPx = async (nuevoAncho: number) => {
    setAnchoPanelPx(nuevoAncho);
    if (panelActivo) {
      await invoke("resize_appbar", { width: ANCHO_ICONOS + nuevoAncho })
        .catch(console.error);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <IconStrip
        panelActivo={panelActivo}
        onCambioPanel={handleCambioPanel}
      />
      <PanelContainer
        panelActivo={panelActivo}
        anchoPanelPx={anchoPanelPx}
        onCambioAncho={handleCambioAnchoPanelPx}
      />
    </div>
  );
}
```

## Drag-to-Resize de Panel

Patrón para redimensionar un panel arrastrando su borde:

```tsx
// src/components/panels/PanelContainer.tsx
import { useState, useCallback } from "react";
import type { PanelId } from "../../types";

const ANCHO_MIN = 200;
const ANCHO_MAX = 600;

interface PanelContainerProps {
  panelActivo: PanelId | null;
  anchoPanelPx: number;
  onCambioAncho: (ancho: number) => void;
}

export default function PanelContainer({
  panelActivo,
  anchoPanelPx,
  onCambioAncho,
}: PanelContainerProps) {
  const [anchoLocal, setAnchoLocal] = useState(anchoPanelPx);
  const [isDragging, setIsDragging] = useState(false);

  const PanelActivo = panelActivo ? PANEL_MAP[panelActivo] : null;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startAncho = anchoLocal;
      setIsDragging(true);

      const handleMouseMove = (ev: MouseEvent) => {
        // Panel en el lado derecho: arrastrar a la izquierda aumenta el ancho
        const delta = startX - ev.clientX;
        const nuevoAncho = Math.max(
          ANCHO_MIN,
          Math.min(ANCHO_MAX, startAncho + delta)
        );
        setAnchoLocal(nuevoAncho);
      };

      const handleMouseUp = (ev: MouseEvent) => {
        const delta = startX - ev.clientX;
        const anchoFinal = Math.max(
          ANCHO_MIN,
          Math.min(ANCHO_MAX, startAncho + delta)
        );
        setAnchoLocal(anchoFinal);
        setIsDragging(false);
        onCambioAncho(anchoFinal);
        // Cleanup: siempre remover listeners al soltar
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [anchoLocal, onCambioAncho]
  );

  return (
    <div
      // transition-[width] solo cuando NO se está dragging (evita lag visual)
      className={`relative h-full overflow-hidden bg-[#13131f] ${
        !isDragging ? "transition-[width] duration-200" : ""
      }`}
      style={{ width: panelActivo ? anchoLocal : 0 }}
    >
      {/* Handle de resize — borde izquierdo del panel */}
      {panelActivo && (
        <div
          className="absolute left-0 top-0 z-10 h-full w-1 cursor-ew-resize
                     hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}

      <div style={{ width: anchoLocal }} className="h-full overflow-y-auto">
        {PanelActivo && <PanelActivo />}
      </div>
    </div>
  );
}
```

> **Clave:** `transition-[width]` se desactiva durante el drag para respuesta inmediata. Si se deja activo, la animación CSS "lucha" con el movimiento del mouse.

## IconStrip con Tooltips

```tsx
// src/components/IconStrip.tsx
import type { PanelId } from "../types";

interface IconConfig {
  id: PanelId;
  label: string;
  icono: React.ReactNode;
}

const ICONOS: IconConfig[] = [
  { id: "inicio", label: "Inicio", icono: <HomeIcon /> },
  { id: "chat", label: "Chat", icono: <ChatIcon /> },
  { id: "tareas", label: "Tareas", icono: <CheckIcon /> },
];

interface IconStripProps {
  panelActivo: PanelId | null;
  onCambioPanel: (panel: PanelId) => void;
}

export default function IconStrip({ panelActivo, onCambioPanel }: IconStripProps) {
  return (
    <div className="flex h-full w-[60px] flex-col items-center gap-1
                    bg-[#0f0f1a] py-3">
      {ICONOS.map(({ id, label, icono }) => (
        <div key={id} className="group relative">
          {/* Botón del icono */}
          <button
            onClick={() => onCambioPanel(id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg
                       text-gray-400 transition-colors hover:bg-white/10 hover:text-white
                       ${panelActivo === id ? "bg-white/15 text-white" : ""}`}
          >
            {icono}
          </button>

          {/* Tooltip — aparece a la izquierda del icono */}
          <div className="pointer-events-none absolute right-full top-1/2 mr-2
                         -translate-y-1/2 opacity-0 transition-opacity
                         group-hover:opacity-100">
            <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1
                           text-xs text-white shadow-lg">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Hook `useInvoke`

Hook para invocar comandos Tauri con estados de loading/error/data:

```ts
// src/hooks/useInvoke.ts
import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

interface UseInvokeResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  ejecutar: (...args: unknown[]) => Promise<T | null>;
}

function useInvoke<T>(comando: string): UseInvokeResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = useCallback(
    async (payload?: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await invoke<T>(comando, payload);
        setData(resultado);
        return resultado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : String(err);
        setError(mensaje);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [comando]
  );

  return { data, loading, error, ejecutar };
}

export default useInvoke;
```

```tsx
// Uso en componente
function ChatPanel() {
  const { data: mensajes, loading, ejecutar: cargarMensajes } =
    useInvoke<string[]>("obtener_mensajes");

  useEffect(() => {
    cargarMensajes();
  }, [cargarMensajes]);

  if (loading) return <Spinner />;

  return (
    <div className="h-full overflow-y-auto p-4">
      {mensajes?.map((msg, i) => <p key={i}>{msg}</p>)}
    </div>
  );
}
```

## Atajos de Teclado

```ts
// src/hooks/useAtajosTeclado.ts
import { useEffect } from "react";
import type { PanelId } from "../types";

interface AtajosConfig {
  onTogglePanel: (panel: PanelId) => void;
  onCerrarPanel: () => void;
}

function useAtajosTeclado({ onTogglePanel, onCerrarPanel }: AtajosConfig): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + número para panels
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            onTogglePanel("inicio");
            break;
          case "2":
            e.preventDefault();
            onTogglePanel("chat");
            break;
          case "3":
            e.preventDefault();
            onTogglePanel("tareas");
            break;
          case "Escape":
            onCerrarPanel();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup obligatorio
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onTogglePanel, onCerrarPanel]);
}

export default useAtajosTeclado;
```

```tsx
// Uso en App.tsx
function App() {
  const [panelActivo, setPanelActivo] = useState<PanelId | null>(null);

  useAtajosTeclado({
    onTogglePanel: (panel) => handleCambioPanel(panel),
    onCerrarPanel: () => setPanelActivo(null),
  });

  // ...
}
```

## Drag Region para Ventanas Sin Decoraciones

Para que el usuario pueda arrastrar la ventana cuando no hay barra de título nativa:

```tsx
// En cualquier componente que deba actuar como handle de arrastre
function BarraSuperior() {
  return (
    // data-tauri-drag-region: Tauri intercepta eventos de mouse en este elemento
    <div
      data-tauri-drag-region
      className="flex h-8 w-full cursor-grab items-center justify-center
                 active:cursor-grabbing"
    >
      <span className="text-xs text-gray-600 select-none">Mi App</span>
    </div>
  );
}
```

> **Importante:** El atributo `data-tauri-drag-region` requiere el permiso `core:window:allow-start-dragging` en `capabilities/default.json`.

## Patrones ✅ / ❌

- ✅ `h-screen overflow-hidden` en el contenedor raíz (no `100vh`)
- ✅ `transition-[width]` solo cuando `!isDragging`
- ✅ Cleanup `removeEventListener` en `mouseup` del drag
- ✅ `user-select: none` global en CSS (comportamiento esperado en desktop)
- ✅ `useEffect` con array de dependencias estable para atajos de teclado
- ✅ Tooltip posicionado a la izquierda con `right-full` + `mr-2` (sidebar derecha)
- ❌ `height: 100vh` en apps de escritorio (puede desbordarse en Windows con taskbar)
- ❌ `useEffect` con `invoke()` sin manejar el caso de componente desmontado
- ❌ `addEventListener` sin el correspondiente `removeEventListener` en cleanup
- ❌ `transition-[width]` activo durante drag (causa lag visual)

## Referencias Adicionales

- **[Componentes de Panel](references/componentes-panel.md)** — Plantillas de paneles, contenido scrollable, estados vacíos
- **[Hooks Tauri](references/hooks-tauri.md)** — useInvoke, useEvento, useVentana, useAppDir con TypeScript completo

---

**Resumen:** Las apps de escritorio con Tauri usan `h-screen overflow-hidden` (no `100vh`), `user-select: none` global, y `data-tauri-drag-region` para arrastre de ventana. El drag-to-resize desactiva `transition-[width]` durante el arrastre. Los atajos de teclado siempre necesitan cleanup en `useEffect`.
