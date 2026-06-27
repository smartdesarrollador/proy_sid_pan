# Bóveda — Datos protegidos con contraseña maestra

**Fecha:** 2026-06-27
**Estado:** ✅ Implementado y verificado (Docker / WSL) — pendiente de deploy a producción
**Área:** Backend Django (nueva app `apps/vault`) · Frontend Workspace (`frontend_workspace/src/features/vault`)
**PRD:** [`prd/features/vault-datos-protegidos.md`](../prd/features/vault-datos-protegidos.md)

---

## Contexto

El usuario pidió guardar **datos sensibles** (logins, API keys, notas seguras, tarjetas) en el
Workspace, protegidos por una **contraseña maestra** propia (distinta de la del login). El repo ya
cifraba datos en reposo (`env_vars`, `ssh_keys`) pero **solo con la clave global del servidor** —
el operador puede descifrar. La Bóveda añade un nivel superior: un secreto del usuario que actúa como
llave.

**Decisiones acordadas** (vía preguntas al usuario): sección dedicada (no flag en Notas); cifrado
**envelope ("Nivel B")**; **código de recuperación**; lista de títulos visible estando bloqueada
(patrón `env_vars`); disponible en todos los planes con límites (Free 10 / Starter 50 / Pro+ ∞).

---

## Modelo de cifrado (envelope) — `apps/vault/crypto.py`

Reutiliza `cryptography` (Fernet) + `argon2-cffi` (ya instalados).

- **DEK** (data encryption key): aleatoria por usuario, cifra los ítems.
- **KEK** = `Argon2id(master_password, salt)`. La DEK se guarda **envuelta** con la KEK (`wrapped_dek`).
  → Ni la clave global del servidor sola descifra la bóveda.
- **Código de recuperación**: envuelve la **misma DEK** con una segunda KEK → reset de la master
  password sin pérdida de datos. Rotado tras cada uso.
- **Verificadores**: hash Argon2id (Django `make_password`) de master y recovery, para validar acceso.

> **Gotcha clave:** la KEK se deriva con `argon2.low_level.hash_secret_raw(..., type=Type.ID)`
> (**determinista** con el salt almacenado), **NO** con el password-hasher de Django (que mete un salt
> aleatorio y no serviría para re-derivar la misma clave). Los verificadores sí usan el hasher de
> Django. → Registrado como **LL-092**.

**Unlock:** el usuario envía la master password → el server verifica (rate-limit + lockout tras 5
fallos), desenvuelve la DEK y la cachea en **Redis** bajo un `unlock_token` opaco con TTL 15 min. En
Redis la DEK va **cifrada con la clave global** (defensa en profundidad). El token viaja en el header
**`X-Vault-Token`**; sin token válido en operaciones sensibles → **423 Locked**.

---

## Backend — `apps/backend_django/apps/vault/`

Estructura espejo de `apps/env_vars/`. Auth `IsAuthenticated` + scoping por usuario (sin permisos
RBAC `vault.*` sembrados, igual criterio que chat/support). `AuditMixin` en todas las vistas.

**Modelos** (`models.py`): `VaultKey` (OneToOne user; `salt`, `wrapped_dek`, `master_verifier`,
`recovery_salt`, `wrapped_dek_recovery`, `recovery_verifier`, `recovery_used_at`) · `VaultItem`
(`tenant`, `user`, `title` claro, `item_type` login/api_key/secure_note/card, `data_ciphertext`,
`favorite`). Migración `0001_initial`.

**Endpoints** (`/api/v1/app/vault/`):

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/PUT | `master-password/` | estado / setup (→ recovery_code, 409 si existe) / cambiar |
| POST | `unlock/` · `lock/` | desbloquear (rate-limited, audita) / bloquear |
| POST | `recover/` | reset con código sin perder datos |
| GET/POST | `items/` | lista (títulos, visible bloqueada) / crear (requiere unlock + `check_plan_limit`) |
| GET/PATCH/DELETE | `items/<uuid>/` | revelar (descifra) / editar / eliminar |

**Plan gating** (`utils/plans.py`): `max_vault_items` (free 10 / starter 50 / pro+ None) + feature
`vault: True` en los 4 planes; `vault_items` añadido a `limits` en `FeaturesView`.

**Settings:** `VAULT_UNLOCK_TTL` (default 900s). Registro en `LOCAL_APPS` + `config/urls.py`.

---

## Frontend — `apps/frontend_workspace/src/features/vault/`

Espejo de `features/env-vars/`.

- **`store/vaultStore.ts`** (Zustand **sin persist** — memoria): `unlockToken`, `expiresAt`,
  `isUnlocked()`, `unlock()`, `lock()`. Recargar la página re-bloquea (no localStorage).
- **`lib/axios.ts`**: el interceptor inyecta `X-Vault-Token` **solo** en URLs `/vault/`.
- **hooks**: `useVaultStatus`, `useVaultItems`, `useUnlockVault`, `useLockVault`,
  `useVaultItemMutations` (reveal/create/update/delete), `useMasterPassword`
  (setup/change/recover).
- **componentes**: `VaultPage` (3 estados: no-configurada → CTA a Configuración; bloqueada →
  `UnlockPrompt`; desbloqueada → tabla + alta), `VaultItemModal` (campos dinámicos por tipo con
  mostrar/copiar), `VaultItemRow`, `VaultItemTypeBadge`, `RecoveryCodeDisplay`,
  `VaultMasterPasswordSection` (en *Configuración → Seguridad*).
- **Integración**: ítem "Bóveda" en sidebar (grupo DEVOPS, icono `Vault`, `feature: 'vault'`); ruta
  lazy `/vault`; `FeatureGate feature="vault"`.

---

## Verificación

- **Backend** (`docker exec rbac_django pytest apps/vault/tests/ -q`): **17/17** — setup (recovery
  code, 409 dup), unlock correcto/incorrecto/lockout, lista visible bloqueada sin secreto,
  crear/revelar requieren unlock (423), round-trip de cifrado, cambiar master (ítems siguen
  descifrando), recover con código (datos intactos) / código inválido, aislamiento cross-user
  (token de otro no descifra → 404), límite de plan 402. Sin regresiones en `rbac`/`env_vars` (63/63).
- **Frontend**: `npm run typecheck` limpio · `npx vitest run src/features/vault` **4/4** ·
  `npm run build` OK (chunk `VaultPage` generado).
- **Pre-existentes ajenos**: 2 tests de `auth` (`SSOCallbackPage`, `ProtectedRoute`) fallan por
  timeout; mockean `@/lib/axios` por completo → no relacionados con esta feature.
- **E2E en navegador (chrome-devtools, `workspace.local.test`, cliente107/Empresa_107):** Hub login →
  SSO Workspace → crear master password (código de recuperación mostrado) → **unlock** → crear ítem
  *login* → **revelar** (descifrado = valor original `MyS3cr3tToken!42`) → auto-relock al recargar. ✅

### Dos problemas de configuración detectados y resueltos en el E2E

1. **`ENCRYPTION_KEY` con placeholder → unlock 500.** El `.env` local tenía
   `ENCRYPTION_KEY=your-fernet-encryption-key-here` (inválida). El setup funciona (no usa la clave
   global) pero el **unlock** cachea la DEK con `encrypt_value()` → `Fernet` revienta. **Fix:** generar
   una clave Fernet válida y ponerla en `.env`; recrear el contenedor (la vieja estaba *baked* vía
   `--env-file`, un restart no basta). **En prod:** definir `ENCRYPTION_KEY` válida en Dokploy **una
   sola vez** (si cambia, lo cifrado con ella —env_vars, ssh_keys, cache de la bóveda— deja de
   descifrarse).
2. **CORS: `X-Vault-Token` no permitido → status/items bloqueados por preflight.** El navegador
   bloqueaba todo request del vault que lleva el token (`x-vault-token is not allowed by
   Access-Control-Allow-Headers`). **Fix:** añadir `'x-vault-token'` a `CORS_ALLOW_HEADERS`
   (`config/settings/base.py`). → Registrado como **LL-044**. (El unlock no lo lleva, por eso ese sí
   pasaba; status/list/create/reveal sí lo llevan.)

---

## Seguimiento (en BACKLOG)

- **Zero-knowledge (fase futura):** mover el cifrado al navegador para que la master password nunca
  llegue al servidor (pierde búsqueda server-side y recuperación).
- **Extras:** generador de contraseñas, autocompletar, importar/exportar, compartir ítems, adjuntos.
- **Deploy:** redeployar backend (`back_dj_sp`) — correr `migrate vault` — y workspace (`front_ws_sp`)
  en Dokploy. La feature funciona por REST (no usa WebSocket), así que no depende del pendiente ASGI.
