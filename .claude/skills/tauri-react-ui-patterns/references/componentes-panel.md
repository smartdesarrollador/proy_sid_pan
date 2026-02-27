# Referencia: Componentes de Panel — Tauri v2 + React

Plantillas de paneles, contenido scrollable, estados vacíos y patrones de layout para sidebar.

## Plantilla Base de Panel

```tsx
// src/components/panels/BasePanel.tsx
interface BasePanelProps {
  titulo: string;
  children: React.ReactNode;
  accionHeader?: React.ReactNode;
}

export default function BasePanel({ titulo, children, accionHeader }: BasePanelProps) {
  return (
    <div className="flex h-full flex-col bg-[#13131f]">
      {/* Header fijo */}
      <div className="flex h-12 shrink-0 items-center justify-between
                      border-b border-white/5 px-4">
        <h2 className="text-sm font-semibold text-white">{titulo}</h2>
        {accionHeader}
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
```

## Panel con Lista de Items

```tsx
// src/components/panels/TareasPanel.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import BasePanel from "./BasePanel";

interface Tarea {
  id: string;
  titulo: string;
  completada: boolean;
  prioridad: "alta" | "media" | "baja";
}

const COLORES_PRIORIDAD = {
  alta: "bg-red-500",
  media: "bg-yellow-500",
  baja: "bg-green-500",
};

export default function TareasPanel() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    invoke<Tarea[]>("obtener_tareas")
      .then(setTareas)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <BasePanel titulo="Tareas">
        <div className="flex h-full items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2
                          border-blue-500 border-t-transparent" />
        </div>
      </BasePanel>
    );
  }

  if (tareas.length === 0) {
    return (
      <BasePanel titulo="Tareas">
        <EstadoVacio
          icono="✓"
          titulo="Sin tareas"
          descripcion="Crea tu primera tarea para comenzar"
        />
      </BasePanel>
    );
  }

  return (
    <BasePanel titulo="Tareas">
      <ul className="divide-y divide-white/5">
        {tareas.map((tarea) => (
          <li key={tarea.id}
              className="flex items-center gap-3 px-4 py-3
                         hover:bg-white/5 transition-colors">
            {/* Indicador de prioridad */}
            <div className={`h-2 w-2 shrink-0 rounded-full ${COLORES_PRIORIDAD[tarea.prioridad]}`} />

            {/* Texto */}
            <span className={`flex-1 text-sm ${
              tarea.completada
                ? "text-gray-500 line-through"
                : "text-gray-200"
            }`}>
              {tarea.titulo}
            </span>

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={tarea.completada}
              onChange={() => toggleTarea(tarea.id)}
              className="h-4 w-4 cursor-pointer accent-blue-500"
            />
          </li>
        ))}
      </ul>
    </BasePanel>
  );

  function toggleTarea(id: string) {
    setTareas((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completada: !t.completada } : t
      )
    );
    invoke("toggle_tarea", { id }).catch(console.error);
  }
}
```

## Estado Vacío Reutilizable

```tsx
// src/components/ui/EstadoVacio.tsx
interface EstadoVacioProps {
  icono: string;
  titulo: string;
  descripcion: string;
  accion?: {
    label: string;
    onClick: () => void;
  };
}

export default function EstadoVacio({ icono, titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-4xl opacity-30">{icono}</div>
      <div>
        <p className="text-sm font-medium text-gray-300">{titulo}</p>
        <p className="mt-1 text-xs text-gray-500">{descripcion}</p>
      </div>
      {accion && (
        <button
          onClick={accion.onClick}
          className="mt-2 rounded-md bg-blue-600/20 px-3 py-1.5
                     text-xs font-medium text-blue-400
                     hover:bg-blue-600/30 transition-colors"
        >
          {accion.label}
        </button>
      )}
    </div>
  );
}
```

## Panel de Chat con Scroll al Fondo

```tsx
// src/components/panels/ChatPanel.tsx
import { useState, useRef, useEffect } from "react";

interface Mensaje {
  id: string;
  texto: string;
  remitente: "usuario" | "asistente";
  timestamp: Date;
}

export default function ChatPanel() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  return (
    <div className="flex h-full flex-col bg-[#13131f]">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-white/5 px-4">
        <h2 className="text-sm font-semibold text-white">Chat</h2>
      </div>

      {/* Mensajes — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {mensajes.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.remitente === "usuario" ? "justify-end" : "justify-start"
            }`}
          >
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              msg.remitente === "usuario"
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-gray-200"
            }`}>
              {msg.texto}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input fijo en el fondo */}
      <div className="shrink-0 border-t border-white/5 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              enviarMensaje(input.trim());
              setInput("");
            }
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm
                       text-gray-200 placeholder:text-gray-500
                       focus:outline-none focus:ring-1 focus:ring-blue-500
                       [user-select:text]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium
                       text-white hover:bg-blue-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );

  function enviarMensaje(texto: string) {
    const nuevoMensaje: Mensaje = {
      id: Date.now().toString(),
      texto,
      remitente: "usuario",
      timestamp: new Date(),
    };
    setMensajes((prev) => [...prev, nuevoMensaje]);
  }
}
```

## Secciones Colapsables

```tsx
// src/components/ui/SeccionColapsable.tsx
import { useState } from "react";

interface SeccionColapsableProps {
  titulo: string;
  defaultAbierta?: boolean;
  children: React.ReactNode;
}

export default function SeccionColapsable({
  titulo,
  defaultAbierta = true,
  children,
}: SeccionColapsableProps) {
  const [abierta, setAbierta] = useState(defaultAbierta);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setAbierta((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-2
                   text-xs font-semibold uppercase tracking-wider text-gray-500
                   hover:text-gray-400 transition-colors"
      >
        {titulo}
        <span className={`transition-transform ${abierta ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {abierta && (
        <div className="pb-2">{children}</div>
      )}
    </div>
  );
}
```

## Separadores y Grupos

```tsx
// Separador visual entre grupos de iconos
function Separador() {
  return <div className="mx-3 h-px bg-white/10" />;
}

// Grupo de iconos con sección
function GrupoIconos({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
        {label}
      </span>
      {children}
    </div>
  );
}
```
