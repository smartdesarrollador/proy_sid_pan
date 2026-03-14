# Autenticación — Hub Client Portal (`hub.local.test`)

> Guía de usuario sobre el flujo de registro, inicio de sesión y autenticación del Hub de Servicios.

---

## ¿Qué es el Hub?

El Hub Client Portal es el **punto de entrada unificado para tenants (organizaciones)**. Desde aquí puedes:

- Registrar tu organización y crear tu cuenta de Owner.
- Ver y acceder a los servicios contratados (Workspace, Digital Services, Desktop).
- Gestionar tu suscripción y facturación.
- Crear tickets de soporte.

---

## Flujo 1 — Registro de nueva organización

**URL:** `/register`

El registro es **público**: cualquier persona puede crear una nueva organización.

1. Completa el formulario:
   - **Nombre** (tu nombre personal)
   - **Email** (será tu usuario de acceso)
   - **Contraseña** (mínimo 8 caracteres)
   - **Nombre de la organización** (crea tu tenant)
   - **Plan** (Free por defecto; puedes elegir Starter, Professional o Enterprise)
   - **Código de referido** (opcional)
2. Haz clic en **"Crear cuenta"**.
3. Recibirás un **email de verificación**. Debes hacer clic en el enlace para activar tu cuenta.

> En entorno de desarrollo (`DEBUG=True`) la verificación de email se omite y la cuenta queda activa de inmediato.

### Después del registro

- Se crea automáticamente tu tenant (organización) con el slug generado a partir del nombre.
- Tu usuario queda con el rol **Owner** dentro de esa organización.
- Eres redirigido al login con un mensaje de confirmación.

---

## Flujo 2 — Inicio de sesión

**URL:** `/login`

1. Ingresa tu **email** y **contraseña**.
2. Haz clic en **"Iniciar sesión"**.
3. Si las credenciales son correctas, eres redirigido al **Dashboard** del Hub.

### Errores comunes

| Mensaje | Causa |
|---|---|
| "Credenciales inválidas" | Email o contraseña incorrectos |
| "Cuenta desactivada" | La cuenta fue suspendida |
| "Verifica tu email primero" | No completaste la verificación de email |

---

## Flujo 3 — Verificación de email

Después del registro recibirás un email con un enlace de verificación:

1. Haz clic en el enlace `{dominio}/verify-email?token=...`
2. El sistema valida el token (válido por **24 horas**, de un solo uso).
3. Tu cuenta queda verificada y puedes iniciar sesión normalmente.

> Si el enlace expiró, contacta al soporte para solicitar un nuevo enlace de verificación.

---

## Flujo 4 — Recuperación de contraseña

**URL:** `/forgot-password`

1. Ingresa tu **email** registrado y haz clic en "Enviar enlace".
2. Recibirás un email con un enlace de recuperación válido por **1 hora**.
3. Al hacer clic, llegas a `/reset-password?token=...`.
4. Ingresa y confirma tu nueva contraseña.
5. Al guardar, eres redirigido a `/login`.

> El sistema nunca revela si el email existe o no, por seguridad.

---

## Flujo 5 — Cierre de sesión

Haz clic en tu avatar en la barra superior → **"Cerrar sesión"**. La sesión queda invalidada de inmediato.

---

## Acceso a servicios (SSO)

Desde el Hub puedes acceder a los servicios activos de tu organización con **un solo clic**, sin volver a ingresar credenciales:

1. En el Dashboard o en **"Mis Servicios"**, haz clic en **"Acceder"** junto al servicio (ej. Workspace).
2. El Hub genera un **token SSO de corta duración** (válido 60 segundos, un solo uso).
3. Eres redirigido automáticamente al servicio ya autenticado.

> Si el token SSO expira antes de que se complete la redirección, vuelve al Hub y haz clic en "Acceder" nuevamente.

### Servicios disponibles

| Servicio | Descripción |
|---|---|
| **Workspace** | Gestión de proyectos, tareas, notas y calendario |
| **Digital Services** | Servicios públicos y formularios digitales |
| **Desktop App** | Aplicación de escritorio (Tauri) |

Los servicios mostrados dependen del **plan de suscripción** activo de tu organización.

---

## Planes y suscripción

Al registrarse, las organizaciones quedan en el plan **Free** por defecto:

| Plan | Usuarios | Almacenamiento | API Calls/mes |
|---|---|---|---|
| **Free** | 5 | 1 GB | 1,000 |
| **Starter** | 25 | 10 GB | 10,000 |
| **Professional** | 100 | 100 GB | 100,000 |
| **Enterprise** | Ilimitado | 1 TB | Ilimitado |

Para cambiar de plan, accede a **Suscripción** en el menú lateral.

---

## Sesión y tokens

- La sesión usa **JWT** (access token + refresh token).
- El access token se renueva automáticamente en segundo plano.
- Si la sesión expira, eres redirigido al login automáticamente.
- Los tokens SSO son de **un solo uso y expiran en 60 segundos** — no son reutilizables.
