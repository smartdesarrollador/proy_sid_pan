# Deploy Desktop App (Tauri v2) — Configuración Producción

**Fecha:** 2026-04-04
**App:** `apps/frontend_sidebar_desktop` (Tauri v2 + React + Vite)

---

## Resumen

Se realizó el primer deploy funcional de la app de escritorio en producción. Se detectaron y corrigieron 4 problemas relacionados con variables de entorno, URL del Hub, CSP y CORS.

---

## Problemas detectados y correcciones

### 1. Faltaba `.env.production`

**Problema:** Solo existía `.env` apuntando a `http://rbac.local.test`. Al hacer `tauri build` no había configuración de producción.

**Corrección:** Se creó `apps/frontend_sidebar_desktop/.env.production`:

```env
VITE_API_URL=https://api-rbac.smartdigitaltec.com
VITE_HUB_URL=https://hub.smartdigitaltec.com
```

> Vite toma automáticamente `.env.production` cuando se ejecuta `tauri build` (modo `release`).

---

### 2. URL del Hub hardcodeada en Rust

**Problema:** `src-tauri/src/lib.rs` tenía la URL del Hub hardcodeada como `http://hub.local.test`, por lo que el login redirigía a un dominio local inaccesible en producción.

**Corrección:** Se parametrizó mediante variable de entorno. Se modificó `build.rs` para leer `VITE_HUB_URL` del `.env` correspondiente y pasarla a Rust en tiempo de compilación:

```rust
// build.rs
let hub_url = std::env::var("VITE_HUB_URL")
    .unwrap_or_else(|_| "http://hub.local.test".to_string());
println!("cargo:rustc-env=HUB_URL={}", hub_url);
```

```rust
// lib.rs — open_hub_login
let hub_url = env!("HUB_URL");
let url = format!("{}/login?source=desktop&state={}", hub_url, state_nonce);
```

Se agregó `dotenvy = "0.15"` a `[build-dependencies]` en `Cargo.toml` para cargar el `.env` desde `build.rs`.

**Comportamiento por perfil:**

| Comando | Perfil Cargo | Archivo `.env` | Hub URL |
|---------|-------------|----------------|---------|
| `tauri dev` | `debug` | `.env` | `http://hub.local.test` |
| `tauri build` | `release` | `.env.production` | `https://hub.smartdigitaltec.com` |

---

### 3. CSP bloqueaba conexiones de red

**Problema:** `tauri.conf.json` tenía un CSP restrictivo que solo permitía `http://rbac.local.test`. Esto bloqueaba:
- Las peticiones fetch a la API de producción.
- Las conexiones IPC internas de Tauri (`http://ipc.localhost`).

**Corrección:** Se actualizó el `connect-src` en `src-tauri/tauri.conf.json`:

```json
"security": {
  "csp": "default-src 'self' 'unsafe-inline'; connect-src http://rbac.local.test https://api-rbac.smartdigitaltec.com http://ipc.localhost http://tauri.localhost"
}
```

> `http://ipc.localhost` es requerido por el mecanismo IPC interno de Tauri v2 en Windows (WebView2).

---

### 4. CORS del backend no permitía el origen de Tauri

**Problema:** En producción, el backend tenía `CORS_ALLOWED_ORIGINS` sin el origen de la app de escritorio. Además, WebView2 en Windows envía `http://tauri.localhost` (HTTP, no HTTPS), por lo que agregar `https://tauri.localhost` no era suficiente.

**Evidencia del error en consola:**
```
Access to fetch at 'https://api-rbac.smartdigitaltec.com/api/v1/app/tasks/'
from origin 'http://tauri.localhost' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Corrección:** En Dokploy → `backend-django` → **Environment**, agregar `http://tauri.localhost` a `CORS_ALLOWED_ORIGINS`:

```env
CORS_ALLOWED_ORIGINS=https://api-rbac.smartdigitaltec.com,https://admin.smartdigitaltec.com,https://hub.smartdigitaltec.com,https://workspace.smartdigitaltec.com,...,http://tauri.localhost
```

> El origen correcto para WebView2 en Windows es **`http://tauri.localhost`** (sin S). `https://tauri.localhost` aplica a macOS/Linux.

---

## Configuración final de producción

### `apps/frontend_sidebar_desktop/.env.production`

```env
VITE_API_URL=https://api-rbac.smartdigitaltec.com
VITE_HUB_URL=https://hub.smartdigitaltec.com
```

### `apps/frontend_sidebar_desktop/.env` (desarrollo)

```env
VITE_API_URL=http://rbac.local.test
VITE_HUB_URL=http://hub.local.test
```

### `src-tauri/tauri.conf.json` — security.csp

```
default-src 'self' 'unsafe-inline';
connect-src http://rbac.local.test https://api-rbac.smartdigitaltec.com http://ipc.localhost http://tauri.localhost
```

### Backend `CORS_ALLOWED_ORIGINS` (Dokploy)

Debe incluir:
- `http://tauri.localhost` — WebView2 Windows (producción)
- `http://localhost:1420` — Tauri dev mode

---

## Proceso de build para producción

```bash
cd apps/frontend_sidebar_desktop
npm run tauri build
```

El instalador se genera en:
```
src-tauri/target/release/bundle/nsis/sidebar_0.1.0_x64-setup.exe
```

> Al ejecutar `tauri build`, Vite toma `.env.production` automáticamente y Cargo compila en perfil `release`, por lo que todas las URLs apuntan a producción sin ninguna configuración adicional.

---

## Notas importantes

- **WebView2 en Windows** usa `http://tauri.localhost` como origen (HTTP). En macOS/Linux es `tauri://localhost`.
- **`http://ipc.localhost`** debe estar siempre en el `connect-src` del CSP — es el canal IPC interno de Tauri v2.
- El `build.rs` personalizado carga el `.env` usando `dotenvy` y lo inyecta en Rust con `cargo:rustc-env`. Las variables de Vite (prefijo `VITE_`) no son accesibles por Rust directamente en tiempo de ejecución.
