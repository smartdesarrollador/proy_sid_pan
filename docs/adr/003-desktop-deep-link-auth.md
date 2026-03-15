# ADR-003: Autenticación Desktop via Deep Link (`rbacdesktop://`)

- **Estado**: Aceptado
- **Fecha**: 2026-03-14
- **Autor**: Equipo de desarrollo

---

## Contexto

El Sidebar Desktop (Tauri v2, Windows AppBar) necesita autenticación pero no tiene pantalla de login propia. El usuario ya tiene credenciales en el Hub Client Portal. Se necesita un mecanismo que:

1. No duplique el formulario de login
2. Funcione en Windows sin instalación adicional
3. Sea seguro (no exponga tokens de larga duración)
4. Sea compatible con el flujo MFA existente del Hub

---

## Decisión

Se implementa un flujo **Deep Link Auth** usando el protocolo personalizado `rbacdesktop://`:

1. El sidebar genera un nonce y abre el Hub en el navegador del sistema
2. El Hub autentica al usuario (login normal + MFA si aplica)
3. El Hub redirige a `rbacdesktop://auth?payload=<base64>&state=<nonce>`
4. Windows entrega el URL al sidebar a través del Registry + `tauri-plugin-single-instance`
5. El sidebar valida el nonce y extrae los tokens

### Mecanismo de IPC elegido: polling de `PendingDeepLinkMutex`

Se descartó el uso de `tauri-plugin-deep-link::on_open_url` como canal de eventos porque **no dispara cuando el URL llega vía `single-instance` forwarding** en Windows dev mode (bug confirmado con v2.4.7 + v2.4.0).

En su lugar, el callback de `single-instance` guarda el URL en un `Mutex<Option<String>>` y React lo lee mediante polling (`invoke('poll_deep_link_url')` cada 500ms).

---

## Alternativas consideradas

### A. Pantalla de login propia en el sidebar
- ❌ Duplica lógica de autenticación
- ❌ El sidebar tendría que manejar refresh tokens independientemente
- ❌ No reutiliza el flujo MFA existente

### B. SSO token del backend (`/api/v1/auth/sso/token/`)
- ✅ Más seguro (token de corta duración, single-use, no expone JWT en URL)
- ❌ Requiere que el usuario ya esté autenticado en el Hub para generar el SSO token
- ❌ No resuelve el bootstrap inicial (primer login)
- **Recomendado para producción** como mejora sobre el enfoque actual

### C. Servidor HTTP local en el sidebar (localhost polling)
- ✅ No depende del Registry ni del OS protocol handler
- ❌ Requiere gestión de puertos disponibles
- ❌ Expone un endpoint HTTP sin autenticación en localhost
- ❌ Más complejo de implementar

### D. WebSocket entre Hub y sidebar
- ✅ Bidireccional, tiempo real
- ❌ El Hub (web) necesita conocer el puerto del WebSocket del sidebar
- ❌ Problemas de CORS y certificados en HTTP local

---

## Consecuencias

### Positivas
- El usuario solo tiene un punto de login (el Hub)
- El flujo MFA funciona sin cambios adicionales
- `rbacdesktop://` queda registrado automáticamente en el Registry al iniciar la app
- Los tokens persisten en `localStorage` con prefijo `desktop-*` (sesión sobrevive reinicios)

### Negativas / limitaciones conocidas
- Chrome requiere clic manual del usuario en el botón "Abrir en el sidebar" (no puede ser automático por restricción de gesto de usuario del navegador)
- El `access_token` viaja en la URL del deep link (mitigado: es local al OS, no viaja por red)
- El polling activo consume recursos mientras `isLoggingIn=true` (mitigado: se detiene a los 120s)
- En producción (app bundleada) el registro del protocolo se gestiona vía `tauri.conf.json`, no mediante `register()` en runtime

### Mejora futura recomendada
Reemplazar el payload completo en la URL por un SSO token de corta duración:
```
rbacdesktop://auth?sso_token=<32-byte-hex>&state=<nonce>
```
El sidebar llama `POST /api/v1/auth/sso/validate/` con el `sso_token` para obtener los tokens finales. Esto evita exponer JWTs en la URL y reutiliza la infraestructura SSO ya implementada.
