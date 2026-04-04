# Configurar envío de email para registro y verificación

## Contexto

El backend Django ya tiene la configuración de email preparada en `config/settings/base.py`. Solo faltan las variables de entorno con las credenciales reales. Sin esto, los usuarios que se registran en el Hub no reciben el email de verificación y no pueden loguear.

Variables que necesitan valor en producción:
```
EMAIL_HOST=smtp.gmail.com        ← ya tiene default
EMAIL_PORT=587                   ← ya tiene default
EMAIL_USE_TLS=True               ← ya tiene default
EMAIL_HOST_USER=                 ← vacío → emails no se envían
EMAIL_HOST_PASSWORD=             ← vacío → emails no se envían
DEFAULT_FROM_EMAIL=noreply@plataforma.com  ← cambiar a tu dominio
```

---

## Opción A — Gmail con App Password (recomendado para empezar)

### Paso 1 — Crear App Password en Google

1. Ir a [myaccount.google.com](https://myaccount.google.com)
2. **Seguridad** → **Verificación en dos pasos** (debe estar activada)
3. **Seguridad** → **Contraseñas de aplicaciones**
4. Seleccionar: App = `Correo`, Dispositivo = `Otro` → nombre: `rbac-backend`
5. Google genera una contraseña de 16 caracteres → copiarla

### Paso 2 — Configurar variables en Dokploy

En Dokploy → proyecto `rbac-platform` → servicio `backend-django` → pestaña **Environment**:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-cuenta@gmail.com
EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx
DEFAULT_FROM_EMAIL=noreply@smartdigitaltec.com
```

### Paso 3 — Redeploy del backend

Click **Redeploy** en el servicio `backend-django`.

### Paso 4 — Verificar que funciona

Desde el Docker Terminal del backend:
```bash
cd /app && python manage.py shell -c "
from django.core.mail import send_mail
send_mail('Test email', 'Funciona', 'noreply@smartdigitaltec.com', ['tu@email.com'])
print('Email enviado')
"
```

---

## Opción B — Resend (recomendado para producción con dominio propio)

Resend es un servicio de email transaccional con buena reputación de entrega y plan gratuito (3,000 emails/mes).

### Paso 1 — Crear cuenta y dominio en Resend

1. Registrarse en [resend.com](https://resend.com)
2. **Domains** → **Add Domain** → agregar `smartdigitaltec.com`
3. Configurar los DNS records que Resend indica (SPF, DKIM, DMARC)
4. Esperar verificación del dominio

### Paso 2 — Obtener API Key

1. En Resend → **API Keys** → **Create API Key**
2. Permisos: `Sending access`
3. Copiar la API key generada

### Paso 3 — Configurar variables en Dokploy

```
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_xxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@smartdigitaltec.com
```

> Nota: con Resend, el `EMAIL_HOST_USER` siempre es la palabra `resend` (literal), y el `EMAIL_HOST_PASSWORD` es tu API key.

### Paso 4 — Redeploy y verificar igual que Opción A

---

## Consideraciones adicionales

### Verificar email de tenant existente manualmente

Si un cliente ya se registró antes de configurar el email, verificarlo manualmente desde el Docker Terminal del backend:

```bash
cd /app && python manage.py shell -c "from django.contrib.auth import get_user_model; U = get_user_model(); u = U.objects.get(email='EMAIL_DEL_CLIENTE'); u.email_verified = True; u.save(); print('OK')"
```

### Configurar DEFAULT_FROM_EMAIL con tu dominio

Cambiar `noreply@plataforma.com` por `noreply@smartdigitaltec.com` para que los emails lleguen desde tu dominio en lugar del placeholder.

### SPF/DKIM para evitar que caigan en spam

Si usas Gmail con App Password, los emails salen desde servidores de Google y generalmente no caen en spam. Si usas tu propio dominio con Resend u otro proveedor, configurar SPF, DKIM y DMARC en el DNS del dominio es obligatorio para buena entrega.

---

## Flujo completo después de configurar email

1. Cliente se registra en `https://hub.smartdigitaltec.com/register`
2. Backend envía email de verificación automáticamente
3. Cliente hace click en el link del email
4. `email_verified = True` en la BD
5. Cliente puede loguear normalmente en el Hub
