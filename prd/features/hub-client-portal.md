# PRD: Hub — Portal Central del Cliente

**Versión:** 1.2.0
**Fecha:** 2026-03-04
**Estado:** Draft
**Owner:** Product Team
**Prototipo:** `docs/ui-ux/prototype-hub-client/` (puerto 3003)

---

## 1. Descripción General

El **Hub** es el punto de entrada unificado para todos los clientes (tenants) de la plataforma. Es una aplicación web independiente que permite a los usuarios:

1. Registrarse y crear su organización (tenant)
2. Suscribirse a un plan y gestionar su facturación
3. Ver y acceder al catálogo de servicios adquiridos
4. Lanzar servicios individuales mediante SSO de corta duración

El Hub **no** es el workspace de trabajo; es el portal de acceso. Una vez que el usuario hace clic en un servicio, es redirigido a la aplicación correspondiente (ej. `prototype-workspace`) con un token SSO.

---

## 2. Problema que Resuelve

Sin el Hub, los usuarios deben:

- Recordar múltiples URLs para cada servicio
- Autenticarse de forma independiente en cada aplicación
- No tienen visibilidad de qué servicios tienen contratados ni su estado
- El onboarding (registro + suscripción) no tiene un punto de inicio claro

El Hub centraliza todo esto en una sola interfaz, reduciendo la fricción de acceso y mejorando la experiencia del cliente.

---

## 3. Usuarios Objetivo

| Rol                      | Descripción                                           | Uso principal                                 |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------- |
| **Owner del Tenant**     | Fundador o administrador principal de la organización | Registro, suscripción, gestión de facturación |
| **Usuarios del Tenant**  | Miembros del equipo con acceso a servicios            | Acceso a servicios desde el catálogo, perfil  |
| **Visitante / Prospect** | Usuario no registrado que llega a la landing          | Registro, comparación de planes               |

---

## 4. Flujos Principales

### 4.1 Registro y Onboarding

```
Visitante llega al Hub
  → Landing Page (beneficios, planes, CTA)
  → Registro: nombre + email + contraseña + nombre de organización
  → Verificación de email
  → Selección de plan (Free trial 14 días o plan de pago)
  → Dashboard del Hub (catálogo de servicios)
```

**Criterios:**

- El registro crea un nuevo tenant de forma atómica
- El tenant owner recibe el rol `Owner` automáticamente
- El trial de 14 días no requiere tarjeta de crédito

### 4.2 Dashboard de Servicios Adquiridos

El dashboard principal del Hub muestra:

- **Servicios activos**: tarjetas con nombre, descripción, estado y botón de acceso
- **Servicios disponibles (upgrade)**: tarjetas de servicios no adquiridos con CTA de upgrade
- **Resumen de suscripción**: plan actual, próxima renovación, uso de seats

```
Dashboard Hub
  ├── Mis Servicios (adquiridos)
  │   ├── Workspace [Abrir → SSO]
  │   ├── Digital Services [Abrir → SSO]
  │   └── Desktop App [Descargar]
  └── Más Servicios (upgrade)
      ├── Analytics Pro [Actualizar Plan]
      └── Custom Domains [Enterprise]
```

### 4.3 Acceso SSO a un Servicio

```
Usuario hace clic en "Abrir" en un servicio
  → Backend genera token SSO de corta duración (TTL: 60s, uso único)
  → Hub redirige a: https://{servicio}/?sso_token={token}
  → Servicio valida token con backend → crea sesión local
  → Usuario queda autenticado en el servicio
```

El usuario no necesita volver a introducir credenciales para acceder a cualquier servicio del catálogo.

### 4.4 Registro Multi-Paso (Onboarding)

El flujo de registro es un stepper visual de 4 pasos:

```
Paso 1 — Cuenta:   email + contraseña + confirmar contraseña
Paso 2 — Empresa:  nombre de organización + preview del subdominio (acme.rbacplatform.com)
Paso 3 — Plan:     selección de plan (Free / Starter / Professional), badge "Más popular"
Paso 4 — ¡Listo!:  checkmark animado + resumen de cuenta + botón "Ir al Dashboard"
```

- El stepper muestra progreso con círculos numerados y líneas conectoras
- El paso activo usa el color primario; los completados muestran ✓
- Al completar el paso 4, el usuario queda autenticado directamente (sin volver a login)
- Los CTAs de planes en la Landing Page ("Comenzar gratis", "Empezar con Starter", "Empezar con Professional") abren el RegisterView; el botón "Iniciar sesión" abre el LoginView

### 4.5 Gestión de Suscripción y Facturación

Accesible desde el Hub en `/subscription`:

- Ver plan actual y límites de uso (usuarios, almacenamiento, servicios activos)
- Cambiar plan (upgrade/downgrade) con toggle ciclo mensual/anual (-10%)
- Acceso directo a `/billing` desde el panel de uso (link "Métodos de pago")
- Ver historial de facturas y descargar PDF
- Cancelar suscripción (con confirmación y feedback)

### 4.6 Métodos de Pago

Accesible desde `/billing` (link en SubscriptionView y Navbar):

**Métodos soportados:**

| Tipo | Marca | Identificador |
|---|---|---|
| Tarjeta | Visa | `visa` |
| Tarjeta | Mastercard | `mastercard` |
| Billetera digital | PayPal | `paypal` |
| Billetera digital | MercadoPago | `mercadopago` |
| Pago local (Perú) | Yape | `yape` |
| Pago local (Perú) | Plin | `plin` |
| Pago local (Colombia) | Nequi | `nequi` |
| Pago local (Colombia) | Daviplata | `daviplata` |

- Lista de métodos guardados con badge "Predeterminado"
- Acciones por método: establecer como predeterminado, eliminar (no se puede eliminar el predeterminado)
- Modal "Agregar método" con 3 tabs:
  - **Tarjeta**: número, fecha exp, CVV, nombre titular
  - **Billetera Digital**: botones "Conectar PayPal" / "Conectar MercadoPago" (simulan OAuth redirect)
  - **Pago Local**: formulario de número de celular para Yape, Plin, Nequi, Daviplata

> **Nota técnica (backend):** El modelo `PaymentMethod` actual es Stripe-only (campos `stripe_payment_method_id`, `brand`, `last4`, `exp_month`, `exp_year`). Las wallets LATAM (PayPal, MercadoPago, Yape, Plin, Nequi, Daviplata) requieren extensión del modelo con campos `external_type`, `external_email`, `external_phone`. Ver Sección 14 — Modelos Backend Requeridos.
>
> **Endpoint:** El Hub reutiliza `/api/v1/admin/billing/payment-methods/` (mismo endpoint que el Admin Panel, tabla `payment_methods`). Se accede con permiso `billing.manage`.

### 4.7 Centro de Notificaciones

Accesible desde el ícono Bell en la Navbar (view `/notifications`):

- Lista de notificaciones con unread dot, ícono por categoría y timestamp relativo
- Filtros en pills: **Todas | Facturación | Seguridad | Servicios | Sistema**
- Botón "Marcar todo como leído" (habilitado solo si hay notificaciones sin leer)
- Al hacer clic en una notificación individual, se marca como leída
- Estado vacío si no hay notificaciones en el filtro activo

**Categorías y colores:**

| Categoría | Color | Ícono |
|---|---|---|
| `billing` | Verde | CreditCard |
| `security` | Rojo | Shield |
| `services` | Azul | Layers |
| `system` | Gris | Settings |

**Timestamps relativos:** "Ahora mismo" / "hace N min" / "hace Nh" / "hace N días"

**Integración con Navbar:** El badge rojo del Bell muestra el conteo de notificaciones sin leer del usuario (actualmente basado en `user.openTickets`; en backend se conectará a `/api/v1/app/notifications/`).

> **Nota técnica (backend):** El modelo `Notification` en el backend tiene categorías: `'security'`, `'users'`, `'billing'`, `'system'`, `'roles'` (orientadas al Admin Panel). La categoría `services` no existe actualmente y debe agregarse al `choices` del modelo. Las categorías `users` y `roles` son exclusivas del Admin Panel y NO se muestran en el Hub. El endpoint `/api/v1/app/notifications/` es una vista nueva que filtra la misma tabla `notifications` mostrando solo categorías: `billing`, `security`, `services`, `system`.
>
> **Scoping:** El modelo `Notification` tiene `tenant FK` (no `user FK`). Las notificaciones de seguridad personales (ej. "Nuevo inicio de sesión") son per-tenant en el modelo actual. Como limitación aceptada, se muestra al Owner del tenant. Un campo `user FK` opcional podría agregarse en el futuro para notificaciones estrictamente personales.

### 4.8 Gestión de Equipo (Miembros del Tenant)

Accesible desde el link "Equipo" en la Navbar (view `/team`):

- Barra de uso: `N / límite_plan usuarios del plan X`
- Tabla de miembros activos: avatar con iniciales, nombre, email, rol badge, estado badge, fecha de incorporación, acciones
- Sección "Invitaciones pendientes" (visible solo si hay invitaciones en estado `pending`)
- Modal "Invitar miembro": email + select de rol (admin / member)
- Al enviar invitación, aparece confirmación "Invitación enviada" + se agrega a la lista de pendientes
- El botón "Invitar" se deshabilita si se alcanzó el límite de usuarios del plan

**Roles y badges:**

| Rol | Badge | Ícono | Removible |
|---|---|---|---|
| `owner` | Violeta | Crown | No |
| `admin` | Azul | Shield | Sí |
| `member` | Gris | User | Sí |

**Estados de miembro:** `active` (verde) · `suspended` (gris) · `pending` (naranja)

**Acciones por miembro** (excepto owner): suspender/reactivar, eliminar del equipo.

### 4.9 Programa de Referidos

Accesible desde la card "Referidos" del Dashboard y desde Perfil (view `/referrals`):

- **Stats cards** (3 columnas): Referidos activos / Créditos ganados / Balance disponible
- **Código de referido**: código único por tenant + botón "Copiar código" (feedback visual "¡Copiado!" por 2s)
- **Link de referido**: URL completa + botón copiar
- **Cómo funciona**: 3 pasos horizontales — Comparte → Se registran → Ganas crédito
- **Historial de referidos**: tabla con email enmascarado, plan, estado, crédito ganado, fecha

**Créditos:** $29 USD por cada referido que se convierte en suscriptor activo. Los créditos se aplican automáticamente a la próxima factura.

**Estados en historial:** `active` (verde) · `pending` (naranja — registrado pero no activo aún)

### 4.10 Soporte y Notificaciones

- **Centro de notificaciones**: ver sección 4.7
- **Soporte**: formulario de contacto y enlace al centro de ayuda
- **Estado de servicios**: indicador de uptime/incidentes activos

---

## 5. Vistas del Prototipo

| Ruta             | Vista                  | Auth | Descripción                                                       |
| ---------------- | ---------------------- | ---- | ----------------------------------------------------------------- |
| `/`              | Landing Page           | No   | Hero, beneficios, comparación de planes, CTA registro/login       |
| `/register`      | Registro Multi-Paso    | No   | Stepper 4 pasos: Cuenta → Empresa → Plan → ¡Listo!                |
| `/login`         | Login                  | No   | Email + contraseña, hint de demo                                  |
| `/dashboard`     | Dashboard de Servicios | Sí   | Resumen (4 cards), servicios activos, catálogo de upgrade         |
| `/subscription`  | Gestión de Suscripción | Sí   | Plan actual, barra de uso, comparación de planes, facturas        |
| `/billing`       | Métodos de Pago        | Sí   | Lista de métodos guardados, modal agregar (3 tabs)                |
| `/notifications` | Notificaciones         | Sí   | Lista con filtros, marcar leídas, timestamp relativo              |
| `/team`          | Equipo                 | Sí   | Tabla de miembros, barra de uso, invitaciones pendientes          |
| `/referrals`     | Programa de Referidos  | Sí   | Stats, código + link copiable, cómo funciona, historial           |
| `/support`       | Soporte                | Sí   | Crear ticket, lista de tickets, estado de incidentes              |
| `/profile`       | Perfil de Usuario      | Sí   | Datos personales, seguridad (contraseña + MFA), preferencias      |

### Navegación principal (Navbar autenticado)

```
[Dashboard] [Servicios] [Suscripcion] [Equipo] [Soporte] [Perfil]   🔔→/notifications
```

- El ícono Bell navega a `/notifications` (no a `/support`)
- "Equipo" es el 4° link, con ícono `Users`
- "Pagos" (`/billing`) es accesible desde SubscriptionView y desde el modal de perfil (no en la nav principal)

---

## 6. Arquitectura de Servicios

El Hub actúa como **orquestador de acceso** al ecosistema de servicios:

```
prototype-hub-client (portal)
  │
  ├──[SSO]──→ prototype-workspace (productividad: tareas, calendario, notas)
  ├──[SSO]──→ digital-services (Next.js: tarjeta digital, portafolio, landing)
  ├──[descarga]──→ desktop-app (Tauri v2: app nativa de escritorio)
  └──[futuro]──→ otros servicios (chat, archivos, CRM, etc.)
```

Cada servicio es una aplicación independiente. El Hub provee:

- Autenticación unificada (SSO)
- Punto de registro y onboarding
- Gestión de suscripción y billing
- Visibilidad del estado de todos los servicios

---

## 7. Autenticación SSO — Flujo Técnico

El SSO entre Hub y servicios usa tokens de corta duración:

```
1. Usuario autenticado en Hub solicita acceder a Workspace
   POST /api/v1/auth/sso/token/
   Body: { "service": "workspace" }
   Response: { "sso_token": "eyJ...", "expires_in": 60, "redirect_url": "https://..." }

2. Hub redirige al navegador:
   GET https://workspace.app/?sso_token=eyJ...

3. Workspace valida el token:
   POST /api/v1/auth/sso/validate/
   Body: { "sso_token": "eyJ..." }
   Response: { "access_token": "...", "refresh_token": "...", "user": {...} }

4. Workspace almacena los tokens y crea sesión local.
   El sso_token es invalidado tras el primer uso.
```

**Seguridad:**

- Token TTL: 60 segundos
- Uso único (invalidado tras validación)
- Firmado con clave privada del backend
- Vinculado al `user_id` + `tenant_id` + `service`

---

## 8. Relación con prototype-admin

| Responsabilidad                             | prototype-admin | prototype-hub-client |
| ------------------------------------------- | --------------- | -------------------- |
| Gestión avanzada de usuarios (RBAC)         | ✅              | ❌                   |
| Configurar roles y permisos                 | ✅              | ❌                   |
| Ver logs de auditoría                       | ✅              | ❌                   |
| Gestionar catálogo de servicios disponibles | ✅ (configura)  | ❌                   |
| Suspender/reactivar clientes                | ✅              | ❌                   |
| Ver catálogo de servicios adquiridos        | ❌              | ✅                   |
| Registro de nuevo tenant                    | ❌              | ✅                   |
| Gestionar propia suscripción y métodos pago | ❌              | ✅                   |
| Gestión básica del equipo (invitar/remover) | ❌              | ✅ (owner/admin)     |
| Acceso SSO a servicios                      | ❌              | ✅                   |
| Soporte al cliente (tickets propios)        | ❌              | ✅                   |
| Programa de referidos                       | ❌              | ✅                   |

El admin **configura** el catálogo (qué servicios existen, en qué planes, precios). El hub es la **vitrina** donde el cliente ve y accede a esos servicios.

> **Nota sobre solapamiento de endpoints:** Algunas operaciones comparten el mismo endpoint backend pero con permisos distintos:
> - **Usuarios/Equipo:** El Hub usa `/api/v1/admin/users/` para listar, invitar y gestionar miembros del propio tenant. El RBAC garantiza que cada tenant solo ve sus propios usuarios. El Hub solo expone `users.read` + `users.invite` + `users.update` (sin acceso a RBAC completo).
> - **Suscripción/Billing:** El Hub usa `/api/v1/admin/subscriptions/` y `/api/v1/admin/billing/`. El prefijo `admin/` aquí significa "gestionar tu propio tenant", no "platform admin". Solo el Owner tiene permisos `billing.read`, `billing.manage`, `billing.upgrade`.
> - **Notificaciones:** Son dos vistas distintas de la misma tabla — `/api/v1/admin/notifications/` filtra categorías admin; `/api/v1/app/notifications/` filtra categorías hub.

---

## 9. Endpoints Backend Requeridos

**Leyenda:** 🔄 Reutiliza endpoint existente | ⭐ Nuevo endpoint requerido

### Servicios y SSO

| Estado | Método | Endpoint                               | Descripción                                          |
| ------ | ------ | -------------------------------------- | ---------------------------------------------------- |
| ⭐     | `GET`  | `/api/v1/app/services/`                | Catálogo de servicios disponibles para el tenant     |
| ⭐     | `GET`  | `/api/v1/app/services/active/`         | Servicios activos del tenant (adquiridos)            |
| ⭐     | `POST` | `/api/v1/auth/sso/token/`              | Genera token SSO para acceder a un servicio          |
| ⭐     | `POST` | `/api/v1/auth/sso/validate/`           | Valida token SSO (consumido por el servicio destino) |

### Registro y autenticación

| Estado | Método | Endpoint                               | Descripción                                                                          |
| ------ | ------ | -------------------------------------- | ------------------------------------------------------------------------------------ |
| 🔄     | `POST` | `/api/v1/auth/register/`               | Registro + creación de tenant. Acepta campo `plan` opcional (default: `'free'`)      |
| 🔄     | `POST` | `/api/v1/auth/login/`                  | Autenticación JWT                                                                    |

> **Nota registro:** El payload de `/auth/register/` debe aceptar `plan` opcional para el paso 3 del stepper:
> ```json
> { "name": "...", "email": "...", "password": "...", "organization_name": "...", "plan": "starter" }
> ```
> El campo `subdomain` en la respuesta contiene solo el **prefijo** (`acme-corp`), no la URL completa. El frontend construye la URL como `{subdomain}.rbacplatform.com`.

### Suscripción y facturación

| Estado | Método   | Endpoint                                         | Descripción                                        |
| ------ | -------- | ------------------------------------------------ | -------------------------------------------------- |
| 🔄     | `GET`    | `/api/v1/admin/subscriptions/current/`           | Plan actual del tenant (requiere `billing.read`)   |
| 🔄     | `POST`   | `/api/v1/admin/subscriptions/upgrade/`           | Cambio de plan (requiere `billing.upgrade`)        |
| 🔄     | `POST`   | `/api/v1/admin/subscriptions/cancel/`            | Cancelar suscripción                               |
| 🔄     | `GET`    | `/api/v1/admin/billing/invoices/`                | Historial de facturas (requiere `billing.read`)    |
| 🔄     | `GET`    | `/api/v1/admin/billing/payment-methods/`         | Lista de métodos de pago (requiere `billing.manage`) |
| 🔄     | `POST`   | `/api/v1/admin/billing/payment-methods/`         | Agregar método de pago                             |
| 🔄     | `PATCH`  | `/api/v1/admin/billing/payment-methods/{id}/`    | Establecer como predeterminado / actualizar        |
| 🔄     | `DELETE` | `/api/v1/admin/billing/payment-methods/{id}/`    | Eliminar método de pago                            |

> **Importante:** Los endpoints de billing usan el prefijo `/admin/` pero son accesibles por el Owner del tenant desde el Hub. El acceso está controlado por los permisos RBAC `billing.read` / `billing.manage` / `billing.upgrade`.
>
> **Bug conocido en Admin Panel:** La respuesta de `GET /admin/billing/payment-methods/` devuelve `{ payment_methods: [...] }`. El Admin Panel hook espera `{ methods: [...] }` (bug). Al implementar el Hub usar la clave correcta: `payment_methods`.

### Notificaciones

| Estado | Método | Endpoint                                        | Descripción                                                          |
| ------ | ------ | ----------------------------------------------- | -------------------------------------------------------------------- |
| ⭐     | `GET`  | `/api/v1/app/notifications/`                    | Notificaciones del Hub (categorías: billing, security, services, system) |
| ⭐     | `POST` | `/api/v1/app/notifications/{id}/read/`          | Marcar notificación como leída                                       |
| ⭐     | `POST` | `/api/v1/app/notifications/read-all/`           | Marcar todas como leídas                                             |

> **Nota:** `/api/v1/app/notifications/` es una vista nueva del mismo modelo `Notification` que filtra categorías hub (`billing`, `security`, `services`, `system`). El endpoint del Admin Panel (`/admin/notifications/`) filtra categorías admin (`security`, `users`, `billing`, `system`, `roles`).

### Equipo (gestión de miembros del tenant)

| Estado | Método   | Endpoint                                         | Descripción                                       |
| ------ | -------- | ------------------------------------------------ | ------------------------------------------------- |
| 🔄     | `GET`    | `/api/v1/admin/users/`                           | Lista de miembros + pendientes (requiere `users.read`) |
| 🔄     | `POST`   | `/api/v1/admin/users/invite/`                    | Enviar invitación por email (requiere `users.invite`) |
| 🔄     | `POST`   | `/api/v1/admin/users/{id}/suspend/`              | Suspender / reactivar miembro (requiere `users.update`) |
| 🔄     | `DELETE` | `/api/v1/admin/users/{id}/`                      | Eliminar miembro del tenant (requiere `users.delete`) |

> **Nota:** El Hub reutiliza los endpoints `/api/v1/admin/users/` existentes. No se crean endpoints `/app/team/` separados. El RBAC y el scoping por tenant garantizan que cada Hub solo ve los usuarios de su propio tenant.

### Programa de referidos

| Estado | Método | Endpoint                                | Descripción                                   |
| ------ | ------ | --------------------------------------- | --------------------------------------------- |
| ⭐     | `GET`  | `/api/v1/app/referrals/`                | Stats + código + historial de referidos       |

---

## 10. Criterios de Aceptación

### Registro Multi-Paso

- [ ] Los botones de plan en Landing Page ("Comenzar gratis", "Empezar con Starter", "Empezar con Professional") abren el flujo de registro
- [ ] El botón "Iniciar sesión" en la Landing Page abre el login (no el registro)
- [ ] El stepper muestra 4 pasos con progreso visual (círculos + líneas conectoras)
- [ ] El paso activo se resalta con el color primario; los completados muestran ✓
- [ ] El paso 2 muestra preview del subdominio en tiempo real (`acme.rbacplatform.com`)
- [ ] El paso 3 permite seleccionar plan con click; el seleccionado muestra check
- [ ] Al completar el paso 4, el usuario queda autenticado y llega al dashboard sin pasar por login
- [ ] El registro crea automáticamente un tenant con el usuario como Owner
- [ ] El trial de 14 días se activa automáticamente sin requerir tarjeta

### Dashboard de Servicios

- [ ] El dashboard muestra 4 summary cards: Plan / Facturación / Soporte / Referidos
- [ ] La card Referidos muestra el conteo de referidos activos y el balance disponible
- [ ] Los servicios activos del tenant aparecen en la sección "Mis Servicios"
- [ ] Los servicios no activos aparecen con CTA de upgrade
- [ ] Cada servicio activo tiene un botón "Abrir" funcional

### Acceso SSO

- [ ] Al hacer clic en "Abrir", el backend genera un SSO token
- [ ] El usuario es redirigido al servicio correspondiente con el token
- [ ] El servicio valida el token y autentica al usuario sin pedir credenciales
- [ ] Un mismo token no puede usarse dos veces

### Suscripción y Billing

- [ ] El usuario puede ver su plan actual y los límites de uso (barras de progreso)
- [ ] El toggle mensual/anual muestra el descuento del 10%
- [ ] El usuario puede hacer upgrade a un plan superior
- [ ] El historial de facturas es visible y descargable
- [ ] El usuario puede cancelar su suscripción con confirmación
- [ ] Hay un link "Métodos de pago" visible en la sección de uso

### Métodos de Pago

- [ ] La lista muestra todos los métodos guardados con badge "Predeterminado"
- [ ] El usuario puede establecer otro método como predeterminado
- [ ] El usuario no puede eliminar el método predeterminado
- [ ] El modal "Agregar método" tiene 3 tabs: Tarjeta / Billetera Digital / Pago Local
- [ ] Los 8 métodos de pago soportados tienen su color de marca y logo correcto
- [ ] La tab "Billetera Digital" muestra botones "Conectar PayPal" y "Conectar MercadoPago"
- [ ] La tab "Pago Local" acepta número de celular para Yape, Plin, Nequi y Daviplata

### Centro de Notificaciones

- [ ] El ícono Bell en Navbar navega a `/notifications` (no a `/support`)
- [ ] Los filtros pills (Todas / Facturación / Seguridad / Servicios / Sistema) funcionan correctamente
- [ ] Las notificaciones sin leer tienen un punto azul y fondo ligeramente resaltado
- [ ] Al hacer clic en una notificación, se marca como leída
- [ ] El botón "Marcar todo como leído" está deshabilitado si no hay notificaciones sin leer
- [ ] Los timestamps son relativos ("Ahora mismo", "hace N min", "hace Nh", "hace N días")
- [ ] Se muestra estado vacío si el filtro activo no tiene notificaciones

### Equipo (Gestión de Miembros)

- [ ] El link "Equipo" aparece en la Navbar entre "Suscripción" y "Soporte"
- [ ] La barra de uso muestra `N / límite` usuarios del plan
- [ ] La tabla de miembros muestra avatar (iniciales), nombre, email, rol, estado, fecha
- [ ] Los roles tienen badges de colores: violeta (owner), azul (admin), gris (member)
- [ ] El owner no tiene botones de acción (no se puede eliminar ni suspender)
- [ ] El botón "Invitar miembro" se deshabilita al alcanzar el límite del plan
- [ ] El modal de invitación permite seleccionar rol (admin / member)
- [ ] Las invitaciones enviadas aparecen en la sección "Invitaciones pendientes"
- [ ] Se puede cancelar una invitación pendiente

### Programa de Referidos

- [ ] La 4ª summary card del Dashboard lleva a `/referrals`
- [ ] Las 3 stats cards muestran: referidos activos, créditos ganados, balance disponible
- [ ] El botón "Copiar código" muestra feedback visual "¡Copiado!" durante 2 segundos
- [ ] El link de referido también tiene su propio botón copiar
- [ ] La sección "Cómo funciona" muestra 3 pasos horizontales
- [ ] El historial muestra email enmascarado, plan, estado (verde/naranja), crédito y fecha

### Notificaciones (sistema)

- [ ] El usuario recibe alertas de renovación próxima (7 días antes)
- [ ] El usuario recibe alerta si el pago falla
- [ ] Las notificaciones de uso al 80% del límite se muestran en el dashboard

---

## 11. Dependencias y Consideraciones

- **No bloquea** el desarrollo del `prototype-workspace` — son aplicaciones independientes
- El prototipo del Hub existe en `docs/ui-ux/prototype-hub-client/` con datos mock
- La implementación backend del SSO es nueva (no existe actualmente)
- El catálogo de servicios requiere un nuevo modelo en el backend (`Service`, `TenantService`)
- El Hub es responsabilidad del equipo de producto/cliente; el admin es del equipo de plataforma

---

---

## 12. Dark Mode

### Descripción

El Hub debe soportar modo oscuro (dark mode) con persistencia entre sesiones, sin depender de la preferencia del sistema operativo. El usuario controla el tema de forma explícita.

### Implementación en prototipo

- `ThemeContext` gestiona el estado `'light' | 'dark'` y persiste en `localStorage('hub-theme')`
- Al cambiar el tema se añade/quita la clase `dark` en `<html>` (Tailwind `darkMode: 'class'`)
- El botón de toggle (icono Moon/Sun) está en la Navbar, siempre visible

### Requisitos funcionales

- El usuario puede alternar entre modo claro y oscuro desde la Navbar (botón con icono Moon/Sun)
- La preferencia persiste en `localStorage` y se restaura al recargar o volver al Hub
- El toggle también está disponible en el menú móvil
- El valor por defecto es modo claro (`'light'`)

### Requisitos de UI

Todos los componentes del Hub deben tener variantes dark definidas:

| Elemento        | Light                               | Dark                                   |
| --------------- | ----------------------------------- | -------------------------------------- |
| Fondo de página | `bg-gray-50`                        | `dark:bg-gray-900`                     |
| Cards           | `bg-white border-gray-200`          | `dark:bg-gray-800 dark:border-gray-700`|
| Textos          | `text-gray-900 / text-gray-500`     | `dark:text-white / dark:text-gray-400` |
| Inputs          | `bg-white border-gray-300`          | `dark:bg-gray-700 dark:border-gray-600`|
| Navbar          | `bg-white border-gray-200`          | `dark:bg-gray-900 dark:border-gray-700`|
| Badges          | `bg-green-100 text-green-800`       | `dark:bg-green-900/30 dark:text-green-400` |
| Botones sec.    | `bg-gray-100 text-gray-700`         | `dark:bg-gray-700 dark:text-gray-300`  |

### Criterios de aceptación

- [ ] El toggle Moon/Sun está visible en Navbar (desktop y mobile)
- [ ] Al activar dark mode, todos los fondos, textos, bordes y badges cambian correctamente
- [ ] No hay texto ilegible (contraste insuficiente) en ninguna vista en dark mode
- [ ] La preferencia persiste al recargar la página
- [ ] El valor por defecto es modo claro

---

## 13. Internacionalización (i18n) — ES / EN

### Descripción

El Hub debe ser completamente bilingüe (Español / Inglés). El cambio de idioma es instantáneo, sin recarga de página, y persiste entre sesiones. No se requieren librerías externas de i18n.

### Implementación en prototipo

- `LanguageContext` expone `{ lang, setLang, t }` a toda la app
- `t(key)` resuelve claves con notación de punto (`'navbar.dashboard'` → `'Dashboard'`)
- Los archivos de traducciones son módulos JS simples en `src/locales/es.js` y `src/locales/en.js`
- El idioma se persiste en `localStorage('hub-lang')`; valor por defecto: `'es'`

### Estructura de locales

Las claves están organizadas por sección:

```
navbar         — links de navegación, labels de botones de la barra (incluye 'team')
landing        — hero, features, pricing, footer, CTAs
login          — formulario de login, hints, errores
register       — stepper (step1–step4), campos de cuenta/empresa, selección de plan, éxito
dashboard      — bienvenida, tarjetas resumen, secciones de servicios
serviceCard    — estados (active/suspended/locked/coming_soon), botones, tiempo relativo
serviceCatalog — títulos de secciones
subscription   — plan actual, comparación de planes, facturas, billing cycle
billing        — métodos de pago, tabs del modal, marcas (visa, mastercard, paypal…)
notifications  — título, filtros, timestamps relativos, marcar leído
team           — roles, estados, tabla, modal invitar, barra de uso, límite alcanzado
referrals      — stats, código, cómo funciona, historial, estados
support        — tickets, modal nuevo ticket, prioridades, estados, banner de ayuda
profile        — tabs, campos de formulario, MFA, notificaciones, idioma/timezone
common         — save, cancel, loading, dark/light mode, plan, free
```

### Toggle de idioma

- Botón `Globe + ES/EN` en la Navbar (desktop y mobile), junto al toggle de tema
- Al hacer clic alterna entre `es` y `en` directamente (no hay dropdown)
- El selector de idioma en `Perfil > Preferencias` también cambia el idioma global (usa el mismo `LanguageContext`)

### Fechas y localización

Las fechas se formatean según el idioma activo:
- `es` → `toLocaleDateString('es-ES')` (ej: "4 de marzo de 2026")
- `en` → `toLocaleDateString('en-US')` (ej: "March 4, 2026")

El campo de bienvenida en el dashboard usa `toLocaleDateString` con `weekday: 'long'` en el locale correspondiente.

### Idiomas futuros

La arquitectura permite añadir nuevos idiomas creando un archivo `src/locales/{lang}.js` y registrándolo en `LanguageContext` sin cambiar ningún componente.

### Criterios de aceptación

- [ ] El botón `Globe + ES/EN` está visible en Navbar (desktop y mobile)
- [ ] Al cambiar el idioma, **todos** los textos de la app cambian de forma instantánea
- [ ] La preferencia de idioma persiste en `localStorage` y se restaura al recargar
- [ ] Las fechas se muestran en el formato correcto según el idioma activo
- [ ] El selector de idioma en `Perfil > Preferencias` sincroniza con el idioma global
- [ ] No quedan textos hardcodeados en ninguna vista (todos pasan por `t()`)
- [ ] El valor por defecto es español (`'es'`)

---

---

## 14. Modelos Backend Requeridos

Estos modelos no existen actualmente en el backend y deben implementarse para soportar el Hub.

### SSOToken (nueva app: `auth_app` o nueva app `sso`)

```python
class SSOToken(models.Model):
    """Token de corta duración para SSO entre Hub y servicios"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    service = models.CharField(max_length=50)  # 'workspace' | 'vista' | 'desktop'
    token = models.CharField(max_length=64, unique=True)
    used_at = models.DateTimeField(null=True, blank=True)  # None = no usado
    expires_at = models.DateTimeField()  # created_at + 60 segundos
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sso_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
        ]
```

**Lógica:** Un token es válido si `used_at is None AND expires_at > now()`. Al validarse, se actualiza `used_at = now()` (single-use).

---

### Service + TenantService (nueva app: `services`)

```python
class Service(models.Model):
    """Catálogo de servicios disponibles en la plataforma"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    slug = models.SlugField(unique=True)          # 'workspace', 'vista', 'desktop'
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50)        # nombre de ícono Lucide
    url_template = models.CharField(max_length=255)  # 'https://{subdomain}.workspace.app'
    min_plan = models.CharField(max_length=20, default='free')  # plan mínimo requerido
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'services'


class TenantService(models.Model):
    """Servicios adquiridos por un tenant"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('locked', 'Locked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='tenant_services')
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    acquired_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tenant_services'
        unique_together = [['tenant', 'service']]
```

---

### ReferralCode + Referral (nueva app: `referrals`)

```python
class ReferralCode(models.Model):
    """Código de referido único por tenant"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.OneToOneField('Tenant', on_delete=models.CASCADE, related_name='referral_code')
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referral_codes'


class Referral(models.Model):
    """Registro de un referido (referrer → referred)"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),   # registrado pero no activo aún
        ('active', 'Active'),     # suscriptor activo, crédito aplicado
        ('expired', 'Expired'),   # nunca activó suscripción
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    referrer = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='referrals_given')
    referred = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='referral_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    credit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=29.00)  # USD
    activated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'referrals'
        unique_together = [['referrer', 'referred']]
```

---

### Extensión de PaymentMethod (app: `subscriptions`)

El modelo `PaymentMethod` actual solo soporta Stripe. Para wallets LATAM se debe extender:

```python
# Campos a agregar al modelo PaymentMethod existente:
external_type = models.CharField(
    max_length=20, blank=True,
    choices=[
        ('paypal', 'PayPal'),
        ('mercadopago', 'MercadoPago'),
        ('yape', 'Yape'),
        ('plin', 'Plin'),
        ('nequi', 'Nequi'),
        ('daviplata', 'Daviplata'),
    ]
)
external_email = models.EmailField(blank=True)      # para PayPal, MercadoPago
external_phone = models.CharField(max_length=20, blank=True)  # para Yape, Plin, Nequi, Daviplata
external_account_id = models.CharField(max_length=255, blank=True)  # token de billetera
```

El campo `type` del modelo original (`card` | `bank_account`) se amplía con `wallet` para wallets digitales y `local_payment` para pagos locales.

---

### Corrección: Invoice.amount_cents

El modelo `Invoice` usa `amount_cents = PositiveIntegerField()` (entero en centavos), NO `amount = DecimalField()`. La respuesta API expone `amount_cents: number` y `amount_display: string` (ej. `"$29.00"`). Actualizado en `prd/technical/data-models.md`.

---

### Corrección: Tenant.plan vs Subscription.plan

`Tenant.plan` es un campo denormalizado que se actualiza via señal Django al cambiar la suscripción. La **fuente de verdad** es `Subscription.plan`. `Tenant.plan` existe para consultas rápidas sin JOIN, pero puede estar desincronizado si la señal falla.

---

### Corrección: TicketComment.author

`TicketComment.author = CharField(255)` — string libre, no FK a User. Esto es intencional para soportar comentarios de agentes externos. Cuando el comentario proviene de un usuario autenticado, el backend puebla `author = request.user.name` automáticamente.

---

## 15. Permisos RBAC del Hub

Mapeo de permisos del catálogo (62 permisos) usados por cada vista del Hub:

| Vista Hub      | Permisos requeridos                                          | Quién tiene acceso     |
| -------------- | ------------------------------------------------------------ | ---------------------- |
| Dashboard      | `dashboard.read`                                             | Todos los usuarios     |
| Subscription   | `billing.read`                                               | Owner + Admin          |
| Upgrade plan   | `billing.upgrade`                                            | Owner                  |
| Payment methods| `billing.manage`                                             | Owner                  |
| Team (ver)     | `users.read`                                                 | Owner + Admin          |
| Team (invitar) | `users.invite`                                               | Owner + Admin          |
| Team (editar)  | `users.update`                                               | Owner + Admin          |
| Team (eliminar)| `users.delete`                                               | Owner                  |
| Team (roles)   | `roles.assign`                                               | Owner + Admin          |
| Support        | Solo `IsAuthenticated` (filtrado por `client=request.user`)  | Todos los usuarios     |
| Notifications  | Solo `IsAuthenticated` (filtrado por tenant)                 | Todos los usuarios     |
| Referrals      | `referrals.read` _(nuevo permiso — añadir al catálogo)_      | Owner + Admin          |
| Services (SSO) | Solo `IsAuthenticated` + tenant activo                       | Todos los usuarios     |

> **Permisos nuevos a agregar al catálogo:**
> ```python
> Permission(codename='referrals.read', name='Ver Referidos', resource='referrals', action='read',
>            description='Permite ver el programa de referidos y el historial')
> Permission(codename='referrals.manage', name='Gestionar Referidos', resource='referrals', action='manage',
>            description='Permite gestionar códigos de referido')
> ```

---

**Creado:** 2026-03-04
**Actualizado:** 2026-03-04 (v1.3.0 — revisión de inconsistencias backend, modelos requeridos, endpoints corregidos, permisos RBAC Hub)
**Prototipo relacionado:** `docs/ui-ux/prototype-hub-client/` (puerto 3003)
**Prototipos consumidores:** `docs/ui-ux/prototype-workspace/` (puerto 3001)
