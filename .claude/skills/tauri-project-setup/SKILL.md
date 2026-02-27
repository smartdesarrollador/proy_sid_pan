---
name: tauri-project-setup
description: Configuración de proyectos Tauri v2 con React, TypeScript, Vite y Tailwind CSS para apps de escritorio. Usar cuando se necesite crear un nuevo proyecto Tauri, configurar vite.config.ts, tauri.conf.json, Cargo.toml con dependencias Windows, capacidades y permisos, ventanas sin decoraciones, o el patrón obligatorio de dos archivos main.rs y lib.rs. Stack Tauri v2, Rust 2021, windows-sys 0.59.
---

# Tauri v2 + React + Vite + Tailwind — Project Setup

Guía completa para configurar proyectos de escritorio con Tauri v2, React 18, TypeScript 5, Vite 5 y Tailwind CSS 3.4.

## Prerrequisitos

```bash
# Instalar Rust (https://rustup.rs)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verificar herramientas
rustc --version    # >= 1.77
cargo --version
node --version     # >= 18

# En Windows: instalar Microsoft C++ Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

## Crear Proyecto

```bash
# Crear con plantilla oficial
npm create tauri-app@latest mi-app -- --template react-ts

# Estructura generada
mi-app/
├── src/               # Frontend React + TypeScript
│   ├── main.tsx
│   ├── App.tsx
│   └── index.css
├── src-tauri/         # Backend Rust
│   ├── src/
│   │   ├── main.rs    # Punto de entrada (solo llama a lib.rs)
│   │   └── lib.rs     # Toda la lógica (testeable)
│   ├── tauri.conf.json
│   ├── Cargo.toml
│   └── build.rs
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## `vite.config.ts` para Tauri

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(async () => ({
  plugins: [react()],

  // Tauri necesita ver sus propios logs en la terminal
  clearScreen: false,

  server: {
    // Puerto fijo — debe coincidir con devUrl en tauri.conf.json
    port: 1420,
    strictPort: true,

    // Ignorar cambios en Rust para no reiniciar el servidor Vite
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
```

> **Importante:** `strictPort: true` garantiza que el puerto nunca cambie. Si el puerto está ocupado, Vite falla en lugar de elegir otro (lo que rompería `devUrl`).

## `tauri.conf.json` — Ventana de Escritorio

Configuración para sidebar anclado al borde derecho (sin decoraciones, sin taskbar):

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "mi-app",
  "version": "0.1.0",
  "identifier": "com.miapp.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
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
        "focus": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": false,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Opciones clave para apps de escritorio:**
- `decorations: false` — sin barra de título nativa
- `alwaysOnTop: true` — siempre encima de otras ventanas
- `skipTaskbar: true` — no aparece en la barra de tareas
- `shadow: false` — sin sombra de ventana
- `focus: false` — no roba el foco al arrancar

## Tailwind CSS en Contexto Escritorio

```bash
# Instalar Tailwind y dependencias
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores oscuros para app de escritorio
        panel: {
          bg: "#13131f",
          surface: "#1e1e2e",
          border: "#2a2a3d",
          hover: "#252535",
        },
        icon: {
          bg: "#0f0f1a",
          active: "#1a1a2e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Deshabilitar selección de texto en app de escritorio */
* {
  -webkit-user-select: none;
  user-select: none;
}
```

## `Cargo.toml` — Dependencias Rust

```toml
[package]
name = "mi-app"
version = "0.1.0"
description = "App de escritorio"
authors = []
edition = "2021"

# Patrón obligatorio Tauri v2: lib como punto central
[lib]
name = "mi_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
raw-window-handle = "0.6"

# Dependencias solo para Windows (APIs nativas Win32)
[target.'cfg(target_os = "windows")'.dependencies]
windows-sys = { version = "0.59", features = [
  "Win32_Foundation",
  "Win32_UI_Shell",
  "Win32_UI_WindowsAndMessaging",
  "Win32_Graphics_Gdi",
] }
```

> **Nota:** `[target.'cfg(target_os = "windows")'.dependencies]` asegura que `windows-sys` solo se compila en Windows. El código fuente que usa estas APIs también debe estar en bloques `#[cfg(target_os = "windows")]`.

## Patrón de Dos Archivos (`main.rs` / `lib.rs`)

Tauri v2 requiere separar el punto de entrada (`main.rs`) de la lógica (`lib.rs`):

```rust
// src-tauri/src/main.rs
// Solo contiene el entry point — NO agregar lógica aquí
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mi_app_lib::run()
}
```

```rust
// src-tauri/src/lib.rs
// Toda la lógica, comandos y configuración van aquí

#[tauri::command]
fn saludo(nombre: &str) -> String {
    format!("Hola, {}!", nombre)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![saludo])
        .run(tauri::generate_context!())
        .expect("error al ejecutar tauri")
}
```

- ✅ `windows_subsystem = "windows"` solo activo en `release` (no en debug para ver la consola)
- ❌ No agregar lógica en `main.rs` (no es testeable desde lib tests)

## `capabilities/default.json` — Permisos Tauri v2

Tauri v2 usa un sistema de capacidades explícito (reemplaza las `allowlist` de v1):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capacidades por defecto",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "shell:allow-open",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-app-read-recursive"
  ]
}
```

**Permisos comunes:**
- `core:default` — APIs básicas de Tauri
- `core:window:allow-start-dragging` — arrastrar ventana sin decoraciones
- `fs:allow-read-text-file` / `fs:allow-write-text-file` — acceso a archivos
- `shell:allow-open` — abrir URLs en el navegador

## Comandos de Desarrollo

```bash
# Desarrollo con hot reload (Vite + Rust watcher)
cargo tauri dev

# Build de producción
cargo tauri build

# Instalar CLI de Tauri como dev dependency
npm install -D @tauri-apps/cli

# Equivalente con npm scripts (package.json)
# "tauri": "tauri"
npm run tauri dev
npm run tauri build
```

## Patrones ✅ / ❌

- ✅ `clearScreen: false` — Tauri necesita ver sus propios logs
- ✅ `strictPort: true` + `devUrl` en el mismo puerto (`1420`)
- ✅ Lógica en `lib.rs`, no en `main.rs`
- ✅ `#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` para ocultar consola solo en release
- ✅ `[target.'cfg(target_os = "windows")'.dependencies]` para dependencias específicas de Windows
- ❌ Poner lógica en `main.rs` (no testeable)
- ❌ Omitir `clearScreen: false` (Tauri pierde sus propios logs)
- ❌ Usar `allowlist` de Tauri v1 (en v2 es `capabilities/`)
- ❌ `windows_subsystem = "windows"` sin el `cfg_attr` (bloquea la consola en debug)

## Referencias Adicionales

- **[Configuración de Ventanas](references/tauri-conf-ventanas.md)** — Opciones completas de ventana, posicionamiento, múltiples ventanas
- **[Capacidades y Permisos](references/capacidades-permisos.md)** — Sistema de permisos Tauri v2, scopes de fs, plugins

---

**Resumen:** Tauri v2 + React + Vite requiere sincronizar `port: 1420` con `devUrl`, separar `main.rs`/`lib.rs`, y usar `capabilities/` para permisos. `clearScreen: false` y `strictPort: true` son obligatorios para que el dev server funcione correctamente con el watcher de Tauri.
