# Autenticación — Admin Panel (`rbac-admin.local.test`)

> Guía de usuario sobre el flujo de registro, inicio de sesión y autenticación del Panel de Administración.

---

## Acceso al panel

El Admin Panel es de **acceso restringido**: no existe registro público. Solo se puede ingresar si:

- Eres el **Owner** que creó la organización (registrado desde el Hub Client Portal), o
- Fuiste **invitado** por un Owner o Admin desde el propio panel.

---

## Flujo 1 — Inicio de sesión

**URL:** `/login`

1. Ingresa tu **email** y **contraseña**.
2. Haz clic en **"Iniciar sesión"**.
3. Si las credenciales son correctas, eres redirigido al **Dashboard**.
4. Si tienes **MFA activado**, el sistema te pedirá el código de 6 dígitos de tu app autenticadora antes de continuar.

> **Alternativa:** Puedes iniciar sesión con tu cuenta de **Google** usando el botón "Continuar con Google". Tu cuenta de Google debe coincidir con el email registrado en la plataforma.

### Errores comunes

| Mensaje | Causa |
|---|---|
| "Invalid email or password" | Email o contraseña incorrectos |
| "This account has been deactivated" | El Owner suspendió tu cuenta |
| "Please verify your email before logging in" | No verificaste el email al registrarte |

---

## Flujo 2 — Invitación de nuevo usuario

El acceso para nuevos miembros del equipo se realiza **solo por invitación**:

1. Un Owner o Admin accede a **Usuarios → Invitar usuario**.
2. Ingresa el email del invitado y (opcionalmente) le asigna un rol.
3. El sistema envía un email al invitado con un **enlace de activación** válido por **24 horas**.

### Activación de la cuenta (invitado)

1. El invitado recibe el email y hace clic en el enlace: `{dominio}/accept-invite?token=...`
2. Se muestra el formulario **"Configura tu contraseña"**.
3. El invitado ingresa y confirma su nueva contraseña (mínimo 8 caracteres).
4. Al enviar, la cuenta queda **activa** y es redirigido a `/login` con el mensaje:
   > "Cuenta activada correctamente. Inicia sesión para continuar."
5. Si el enlace **expiró** o ya fue usado, se muestra un error con un link para volver al login.

---

## Flujo 3 — Recuperación de contraseña

**URL:** `/forgot-password`

1. Ingresa tu **email** registrado y haz clic en "Enviar enlace".
2. Recibirás un email con un enlace de recuperación válido por **1 hora**.
3. Al hacer clic, llegas a `/reset-password?token=...`.
4. Ingresa y confirma tu nueva contraseña.
5. Al guardar, eres redirigido a `/login` con el mensaje:
   > "Contraseña actualizada correctamente."

> El sistema **nunca revela** si el email existe o no, por seguridad.

---

## Flujo 4 — Autenticación de dos factores (MFA)

**URL:** `/settings → Seguridad`

### Activar MFA

1. Ve a **Configuración → Seguridad**.
2. Haz clic en **"Activar MFA"**.
3. Escanea el código QR con tu app autenticadora (Google Authenticator, Authy, etc.).
4. Ingresa el código de 6 dígitos para confirmar.
5. El sistema te entrega **10 códigos de recuperación** de un solo uso. **Guárdalos en un lugar seguro.**

### Login con MFA activo

Después de ingresar email y contraseña correctamente, aparece la pantalla de verificación:

1. Abre tu app autenticadora.
2. Ingresa el código de 6 dígitos actual.
3. Haz clic en **"Verificar"**.

### Códigos de recuperación

Si perdiste acceso a tu app autenticadora, usa uno de los códigos de recuperación en lugar del código TOTP. Cada código solo puede usarse **una vez**.

---

## Flujo 5 — Cierre de sesión

Haz clic en tu nombre/avatar en la barra superior → **"Cerrar sesión"**. El token de sesión queda invalidado inmediatamente en el servidor.

---

## Roles y permisos

Al ingresar, tu acceso al panel depende del **rol asignado**:

| Rol | Descripción |
|---|---|
| **Owner** | Acceso total. Gestiona usuarios, roles, suscripción y configuración |
| **Admin** | Acceso amplio excepto configuración de suscripción y billing |
| **Member** | Acceso de solo lectura a áreas según permisos asignados |

Los elementos del menú lateral se muestran u ocultan automáticamente según los permisos de tu rol.

---

## Sesión y tokens

- La sesión usa **JWT** (access token de corta duración + refresh token de larga duración).
- El access token se renueva automáticamente en segundo plano mientras navegas.
- Si el refresh token expira (inactividad prolongada), eres redirigido al login automáticamente.
- Los tokens se almacenan en `localStorage` del navegador (no en cookies).
