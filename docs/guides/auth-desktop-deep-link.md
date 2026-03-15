# Deep Link Auth — Sidebar Desktop (`rbacdesktop://`)

> Guía técnica del flujo de autenticación entre el Hub Client Portal y la app de escritorio Tauri (Windows AppBar Sidebar).

---

## Resumen

El Sidebar Desktop no tiene pantalla de login propia. La autenticación se delega al Hub via **Deep Link**: el usuario hace clic en "Iniciar sesión" en el sidebar, se abre el Hub en el navegador, completa el login, y los tokens son enviados de vuelta al sidebar a través del protocolo personalizado `rbacdesktop://`.

---

## Flujo completo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ProfilePanel (Tauri/React)                                  │
│     → genera nonce = crypto.randomUUID()                        │
│     → guarda en localStorage('desktop-auth-state')             │
│     → invoke('open_hub_login', { stateNonce })                  │
│     → Rust: opener::open("http://hub.local.test/login           │
│              ?source=desktop&state=<nonce>")                    │
│     → React: isLoggingIn=true, polling cada 500ms               │
└────────────────────────┬────────────────────────────────────────┘
                         │ abre navegador
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Hub LoginPage (hub.local.test)                              │
│     → detecta ?source=desktop&state=<nonce>                     │
│     → muestra banner "Iniciando sesión desde tu app escritorio" │
│     → usuario completa login normal (email + contraseña ± MFA)  │
│     → construye payload:                                        │
│       btoa(JSON.stringify({                                      │
│         access_token, refresh_token, user, tenant               │
│       }))                                                       │
│     → muestra pantalla: "Sesión iniciada en tu app escritorio"  │
│     → botón "Abrir en el sidebar" con href:                     │
│       rbacdesktop://auth?payload=<base64>&state=<nonce>         │
└────────────────────────┬────────────────────────────────────────┘
                         │ usuario hace clic → Chrome confirma diálogo
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Windows OS                                                  │
│     → Registry HKCU\SOFTWARE\Classes\rbacdesktop                │
│       → apunta al exe del sidebar (registrado en setup)         │
│     → lanza nueva instancia del sidebar con argv:               │
│       ["rbacdesktop://auth?payload=...&state=..."]              │
└────────────────────────┬────────────────────────────────────────┘
                         │ segunda instancia inicia
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Tauri — segunda instancia                                   │
│     → tauri-plugin-single-instance detecta instancia corriendo  │
│     → callback con argv → busca arg que empiece "rbacdesktop://"│
│     → guarda URL en PendingDeepLinkMutex                        │
│     → segunda instancia se cierra                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ mutex actualizado en la instancia original
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. React polling (instancia original)                          │
│     → invoke('poll_deep_link_url') cada 500ms                   │
│     → recibe URL → parsea searchParams                          │
│     → valida state === localStorage('desktop-auth-state')       │
│     → decodifica payload: atob(payloadB64)                      │
│     → setAuth(access_token, refresh_token, user, tenant)        │
│     → ProfilePanel muestra avatar + nombre + plan               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Problema crítico encontrado y solución

### El problema

`tauri-plugin-deep-link::on_open_url` **no dispara** cuando el URL llega vía forwarding de `tauri-plugin-single-instance` en Windows dev mode. El evento Tauri (`handle.emit("desktop-auth-callback", ...)`) nunca llegaba al frontend React.

### Por qué ocurre

Cuando Windows lanza la segunda instancia del ejecutable, `single-instance` detecta la instancia corriendo y llama su callback con `argv`. El plugin `deep-link` debería interceptar esto automáticamente, pero en la versión v2.4.7 + v2.4.0 del combo, la integración no funciona en modo dev.

### La solución

En lugar de depender de `on_open_url → emit → listen`, se implementó un mecanismo de **polling directo**:

1. El callback de `single-instance` extrae el URL de `argv` manualmente y lo guarda en `PendingDeepLinkMutex`
2. React llama `poll_deep_link_url` cada 500ms mientras `isLoggingIn=true`
3. Cuando recibe la URL, la procesa directamente en el hook

```rust
// single-instance callback — extrae el deep link de argv
.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
    for arg in &argv {
        if arg.starts_with("rbacdesktop://") {
            if let Some(state) = app.try_state::<PendingDeepLinkMutex>() {
                if let Ok(mut guard) = state.0.lock() {
                    *guard = Some(arg.clone());
                }
            }
            break;
        }
    }
}))
```

```ts
// React polling en useDesktopAuth.ts
pollRef.current = setInterval(async () => {
  const url = await invoke<string | null>('poll_deep_link_url')
  if (url) processDeepLinkUrl(url)
}, 500)
```

### Por qué Chrome requiere clic manual

`window.location.href = 'rbacdesktop://...'` ejecutado desde un `useEffect` (sin gesto de usuario) es bloqueado silenciosamente por Chrome. La solución fue mostrar un botón `<a href="rbacdesktop://...">Abrir en el sidebar</a>` que el usuario hace clic explícitamente, lo cual satisface el requisito de gesto de usuario del navegador.

---

## Archivos modificados

### Hub (`apps/frontend_hub_client/`)

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/LoginPage.tsx` | Detecta `?source=desktop&state=`, construye `rbacdesktop://` URL, muestra confirmación con botón |
| `src/features/auth/hooks/useLogin.ts` | Añade `options.skipNavigate` para no redirigir a `/dashboard` en flujo desktop |

### Desktop (`apps/frontend_sidebar_desktop/`)

| Archivo | Cambio |
|---------|--------|
| `src-tauri/src/lib.rs` | `PendingDeepLinkMutex`, commands `poll_deep_link_url` / `open_hub_login` / `store_desktop_auth` / `get_desktop_auth` / `clear_desktop_auth`, single-instance callback con extracción de argv |
| `src-tauri/Cargo.toml` | Añade `tauri-plugin-deep-link = "2"`, `tauri-plugin-single-instance = "2"`, `opener = "0.7"` |
| `src-tauri/tauri.conf.json` | `plugins.deep-link.desktop.schemes: ["rbacdesktop"]` |
| `src-tauri/capabilities/default.json` | Permisos `deep-link:default`, `deep-link:allow-register`, `deep-link:allow-get-current` |
| `package.json` | Añade `@tauri-apps/plugin-deep-link: ^2`, `zustand: ^5` |
| `src/store/authStore.ts` | Zustand store con persistencia en `desktop-*` keys de localStorage |
| `src/features/auth/useDesktopAuth.ts` | Hook con polling, validación de nonce, `login()` y `logout()` |
| `src/components/panels/ProfilePanel.tsx` | Vista no-autenticado (botón login) y vista autenticada (avatar, plan, org, logout) |

---

## localStorage keys (Desktop)

| Key | Contenido |
|-----|-----------|
| `desktop-accessToken` | JWT access token |
| `desktop-refreshToken` | JWT refresh token |
| `desktop-authUser` | JSON del usuario |
| `desktop-authTenant` | JSON del tenant |
| `desktop-auth-state` | Nonce temporal (se elimina al validar) |

---

## Registro del protocolo en Windows

`app.deep_link().register("rbacdesktop")` se llama en el `setup()` de Tauri. Esto escribe en:

```
HKCU\SOFTWARE\Classes\rbacdesktop
  (Default) = "URL:rbacdesktop Protocol"
  URL Protocol = ""
  shell\open\command
    (Default) = "C:\path\to\sidebar.exe" "%1"
```

El registro persiste entre reinicios de la app y apunta siempre al ejecutable actual. Para verificarlo:

```powershell
Get-Item -Path "HKCU:\SOFTWARE\Classes\rbacdesktop"
```

---

## Consideraciones de seguridad

- El nonce (`crypto.randomUUID()`) previene ataques de replay: el deep link solo es válido si el `state` coincide con el guardado en localStorage
- El nonce se elimina de localStorage inmediatamente tras la validación (single-use)
- El `access_token` viaja en la URL del deep link, que es procesada localmente por el OS y nunca viaja por red
- Para producción se recomienda usar el endpoint SSO existente (`/api/v1/auth/sso/token/`) en lugar de pasar tokens en la URL

---

## Ver también

- [auth-hub-client.md](auth-hub-client.md) — Autenticación del Hub Client Portal
- [ADR-003](../adr/003-desktop-deep-link-auth.md) — Decisión arquitectural del flujo Deep Link
- `apps/frontend_sidebar_desktop/src/features/auth/useDesktopAuth.ts`
- `apps/frontend_sidebar_desktop/src-tauri/src/lib.rs`
