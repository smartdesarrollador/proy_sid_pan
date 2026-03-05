# PRD: Hub — Portal Central del Cliente

**Versión:** 1.0.0
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

### 4.4 Gestión de Suscripción y Facturación

Accesible desde el Hub en `/subscription`:

- Ver plan actual y límites
- Cambiar plan (upgrade/downgrade)
- Gestionar método de pago (Stripe)
- Ver historial de facturas y descargar PDF
- Cancelar suscripción (con confirmación y feedback)

### 4.5 Soporte y Notificaciones

- **Centro de notificaciones**: alertas de renovación próxima, pagos fallidos, límites de uso
- **Soporte**: formulario de contacto y enlace al centro de ayuda
- **Estado de servicios**: indicador de uptime/incidentes activos

---

## 5. Vistas del Prototipo

| Ruta             | Vista                  | Descripción                                             |
| ---------------- | ---------------------- | ------------------------------------------------------- |
| `/`              | Landing Page           | Hero, beneficios, comparación de planes, CTA registro   |
| `/register`      | Registro               | Formulario de cuenta + organización + selección de plan |
| `/login`         | Login                  | Email + contraseña, opción Google OAuth                 |
| `/dashboard`     | Dashboard de Servicios | Catálogo de servicios activos y disponibles             |
| `/subscription`  | Gestión de Suscripción | Plan actual, upgrade, facturación                       |
| `/billing`       | Facturación            | Método de pago, historial de facturas                   |
| `/profile`       | Perfil de Usuario      | Datos personales, cambio de contraseña, MFA             |
| `/notifications` | Notificaciones         | Centro de notificaciones con filtros                    |
| `/support`       | Soporte                | Crear ticket, estado de incidentes                      |

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
| Gestión de usuarios del tenant              | ✅              | ❌                   |
| Configurar roles y permisos                 | ✅              | ❌                   |
| Ver logs de auditoría                       | ✅              | ❌                   |
| Gestionar catálogo de servicios disponibles | ✅ (configura)  | ❌                   |
| Ver catálogo de servicios adquiridos        | ❌              | ✅                   |
| Registro de nuevo tenant                    | ❌              | ✅                   |
| Gestionar propia suscripción                | ❌              | ✅                   |
| Acceso SSO a servicios                      | ❌              | ✅                   |
| Soporte al cliente                          | ❌              | ✅                   |

El admin **configura** el catálogo (qué servicios existen, en qué planes, precios). El hub es la **vitrina** donde el cliente ve y accede a esos servicios.

---

## 9. Endpoints Backend Requeridos

Además de los endpoints existentes de auth y billing, el Hub necesita:

| Método | Endpoint                               | Descripción                                          |
| ------ | -------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/api/v1/app/services/`                | Catálogo de servicios disponibles para el tenant     |
| `GET`  | `/api/v1/app/services/active/`         | Servicios activos del tenant (adquiridos)            |
| `POST` | `/api/v1/auth/sso/token/`              | Genera token SSO para acceder a un servicio          |
| `POST` | `/api/v1/auth/sso/validate/`           | Valida token SSO (consumido por el servicio destino) |
| `GET`  | `/api/v1/admin/subscriptions/current/` | _(ya existe)_ Plan actual del tenant                 |
| `GET`  | `/api/v1/admin/billing/invoices/`      | _(ya existe)_ Historial de facturas                  |
| `POST` | `/api/v1/auth/register/`               | _(ya existe)_ Registro con creación de tenant        |

---

## 10. Criterios de Aceptación

### Registro y Onboarding

- [ ] Un visitante puede registrarse con email + contraseña + nombre de organización
- [ ] El registro crea automáticamente un tenant con el usuario como Owner
- [ ] El usuario es redirigido al dashboard del Hub tras registrarse
- [ ] El trial de 14 días se activa automáticamente sin requerir tarjeta

### Dashboard de Servicios

- [ ] El dashboard muestra los servicios activos del tenant
- [ ] Los servicios no activos aparecen con CTA de upgrade
- [ ] Cada servicio activo tiene un botón "Abrir" funcional

### Acceso SSO

- [ ] Al hacer clic en "Abrir", el backend genera un SSO token
- [ ] El usuario es redirigido al servicio correspondiente con el token
- [ ] El servicio valida el token y autentica al usuario sin pedir credenciales
- [ ] Un mismo token no puede usarse dos veces

### Suscripción y Billing

- [ ] El usuario puede ver su plan actual y los límites de uso
- [ ] El usuario puede hacer upgrade a un plan superior
- [ ] El historial de facturas es visible y descargable
- [ ] El usuario puede cancelar su suscripción con confirmación

### Notificaciones

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

**Creado:** 2026-03-04
**Prototipo relacionado:** `docs/ui-ux/prototype-hub-client/` (puerto 3003)
**Prototipos consumidores:** `docs/ui-ux/prototype-workspace/` (puerto 3001)
