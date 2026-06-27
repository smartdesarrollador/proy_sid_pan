# PRD: Bóveda — Datos protegidos con contraseña maestra

**Versión:** 1.0.0
**Fecha:** 2026-06-27
**Estado:** Draft
**Owner:** Product Team
**App:** `apps/frontend_workspace/` (Workspace) + backend `apps/backend_django/apps/vault/`

---

## 1. Descripción General

La **Bóveda** es una sección del Workspace donde el usuario guarda **datos sensibles** (logins,
API keys/tokens, notas seguras, tarjetas) protegidos por una **contraseña maestra** que solo él
conoce, distinta de la del login. Funciona como un gestor de secretos personal: se configura una
master password, se desbloquea por sesión, y los valores secretos solo se revelan estando
desbloqueada. La bóveda se auto-bloquea por inactividad y al recargar la página.

---

## 2. Problema que Resuelve

Hoy el Workspace cifra ciertos datos (env vars, SSH keys) **solo con una clave global del servidor**:
útil contra fugas de la BD, pero el operador de la plataforma puede descifrarlos. No existe un lugar
para que el usuario guarde secretos bajo **su propio control**, con un secreto que ni la plataforma
posee por defecto. La Bóveda cubre ese caso: un espacio personal de datos protegidos con una llave
del usuario.

---

## 3. Usuarios Objetivo

| Rol | Uso principal |
|-----|---------------|
| Cliente (cualquier rol del tenant) | Guardar y recuperar sus propios secretos en su Workspace |

La bóveda es **personal por usuario** (no compartida dentro del tenant en v1).

---

## 4. Modelo de Seguridad (envelope encryption — "Nivel B")

- **Master password**: la configura el usuario en *Configuración → Seguridad*. Nunca se guarda en
  claro; se almacena solo un **verificador** (hash Argon2id) para validar el acceso.
- **DEK (Data Encryption Key)**: clave aleatoria por usuario que cifra los ítems.
- **KEK (Key Encryption Key)** = `Argon2id(master_password, salt)`. La DEK se guarda **envuelta** con
  la KEK (`wrapped_dek`). → Ni la clave global del servidor sola descifra la bóveda; hace falta la
  master password del usuario.
- **Código de recuperación**: al crear la master password se genera un código de un solo uso. Envuelve
  la **misma DEK** con una segunda KEK derivada del código → permite resetear la master password
  **sin perder datos**. Se muestra una sola vez.
- **Desbloqueo (unlock)**: el usuario envía la master password → el servidor verifica, desenvuelve la
  DEK y la cachea en **Redis** bajo un `unlock_token` opaco con TTL (default 15 min). La DEK en Redis
  va cifrada con la clave global (defensa en profundidad).
- **No es zero-knowledge**: el servidor ve la master password en tránsito durante el unlock. Es un
  salto real de seguridad sobre el patrón actual, pero el zero-knowledge (cifrado en el navegador)
  queda como fase futura.

---

## 5. Alcance Funcional (v1)

### Incluido
- Configurar / cambiar master password + código de recuperación (Configuración del Workspace).
- Recuperar el acceso con el código (resetear master password sin perder datos).
- Desbloquear / bloquear la bóveda; auto-lock por inactividad/expiración y al recargar/cerrar sesión.
- CRUD de ítems con tipos: **login** (usuario/URL/password), **api_key** (token), **secure_note**,
  **card** (tarjeta).
- Lista visible estando bloqueada (solo **título** y **tipo**); el valor secreto se revela solo tras
  desbloquear (copiar al portapapeles con auto-clear).
- Límites por plan: **Free 10 · Starter 50 · Professional/Enterprise ∞**.
- Auditoría de unlock e intentos fallidos; rate-limit/lockout tras varios fallos.

### Fuera de alcance (fases futuras)
- Zero-knowledge real (cifrado en el navegador).
- Generador de contraseñas, autocompletar, importar/exportar, compartir ítems entre usuarios,
  adjuntos cifrados.

---

## 6. API (backend `apps/vault/`, namespace `/api/v1/app/vault/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `master-password/` | Estado `{is_configured, is_unlocked}` |
| POST | `master-password/` | Crear master password → devuelve `recovery_code` (una vez); 409 si ya existe |
| PUT | `master-password/` | Cambiar (current + new → re-wrap de la DEK) |
| POST | `unlock/` | Desbloquear → `{unlock_token, expires_in}`; rate-limited; audita |
| POST | `lock/` | Invalidar el `unlock_token` |
| POST | `recover/` | `{recovery_code, new_master_password}` → reset sin perder datos |
| GET | `items/` | Lista (título + tipo; visible bloqueada) |
| POST | `items/` | Crear (requiere unlock; `check_plan_limit`) |
| GET | `items/<uuid>/` | Revelar (requiere unlock → descifra `data`) |
| PATCH | `items/<uuid>/` | Editar (requiere unlock) |
| DELETE | `items/<uuid>/` | Eliminar (solo auth) |

El `unlock_token` viaja en el header **`X-Vault-Token`**. Sin token válido en operaciones que
requieren desbloqueo → **423 Locked**.

---

## 7. Modelo de Datos

- `VaultKey` (1 por usuario): `user` (OneToOne), `tenant`, `salt`, `wrapped_dek`, `master_verifier`,
  `recovery_salt`, `wrapped_dek_recovery`, `recovery_verifier`, `recovery_used_at`.
- `VaultItem`: `tenant`, `user`, `title` (claro), `item_type` (login/api_key/secure_note/card),
  `data_ciphertext` (blob JSON cifrado con la DEK), `favorite`, timestamps.

---

## 8. UX (Workspace)

- Sección **"Bóveda"** en el sidebar (grupo DEVOPS, icono candado/Vault), gateada por feature `vault`.
- **3 estados** en la página:
  1. *No configurada* → CTA hacia *Configuración → Seguridad* para crear la master password.
  2. *Bloqueada* → lista de títulos + prompt de desbloqueo.
  3. *Desbloqueada* → lista + filtros + alta/edición; revelar/copiar secretos.
- *Configuración → Seguridad*: sección "Contraseña maestra de la Bóveda" (crear/cambiar/recuperar,
  mostrar código de recuperación una vez).
- Estado de desbloqueo **efímero en memoria** (no localStorage): recargar = re-bloquear.

---

## 9. Métricas de Éxito

- % de usuarios que configuran la master password.
- Nº de ítems guardados por usuario.
- Tasa de recuperaciones con código (indicador de fricción/olvidos).
- Cero incidencias de fuga de secretos en logs/auditoría (la master password nunca se loguea).

---

## 10. Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Usuario olvida master password sin código | Código de recuperación obligatorio mostrado en setup; avisos claros |
| Fuga de DEK desde Redis | DEK cifrada con clave global antes de cachear; TTL corto |
| Fuerza bruta sobre unlock | Rate-limit + lockout + auditoría de fallos |
| Master password en logs | Regla de seguridad del repo: nunca loguear credenciales |
