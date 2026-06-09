# Reporte de Implementación — Flujo n8n: Registro Nuevo Tenant → Notificación Telegram

**Fecha**: 06/06/2026
**Estado final**: Funcionando en producción
**Entorno**: Dokploy (VPS) + n8n en `n8n-workflows.digisider.com`

---

## Objetivo

Enviar una notificación automática al bot de Telegram `bot_tenant_sist_4` cada vez que un nuevo cliente completa el registro de 4 pasos en `digisider.com/register` (frontend_hub_client).

---

## Arquitectura del flujo

```
Usuario se registra en digisider.com/register
       ↓
POST /api/v1/auth/register  (Django backend)
       ↓
RegisterView.post() crea Tenant + User
       ↓
Thread Python (no bloqueante)
       ↓
POST https://n8n-workflows.digisider.com/webhook/registro-hub
       ↓
n8n: Webhook Registro → Preparar Mensaje → Enviar Telegram
       ↓
Bot Telegram recibe notificación instantánea
```

---

## Componentes implementados

### Parte A — Flujo n8n (JSON importable)

**Archivo**: `workflows/registro-nuevo-tenant.json`

| Nodo | Tipo | Función |
|------|------|---------|
| Webhook Registro | `n8n-nodes-base.webhook` v2 | Recibe POST de Django. `responseMode: onReceived` → responde 200 inmediatamente sin esperar |
| Preparar Mensaje | `n8n-nodes-base.set` v3.4 | Construye el texto Markdown con los datos del tenant |
| Enviar Telegram | `n8n-nodes-base.telegram` v1.2 | Envía el mensaje al chat configurado |

**Payload que Django envía al webhook:**
```json
{
  "event": "tenant.registered",
  "user": { "id": "uuid", "name": "...", "email": "..." },
  "tenant": { "id": "uuid", "name": "...", "slug": "...", "subdomain": "..." },
  "plan": "free|starter|professional|enterprise",
  "timestamp": "2026-06-06T14:02:00Z"
}
```

**Mensaje resultante en Telegram:**
```
🆕 Nuevo registro en DigiSider

👤 Usuario: Cliente11
📧 Email: cliente11@cliente.com
🏢 Empresa: Cliente11
🌐 Subdominio: cliente11.digisider.com
📦 Plan: professional
📅 Fecha: 06/06/2026 14:02
```

---

### Parte B — Django backend

**Archivos modificados:**

#### 1. `apps/backend_django/apps/auth_app/views.py`

Se agregó una llamada no bloqueante dentro de `RegisterView.post()` después de `serializer.save()`, usando un thread de Python:

```python
import threading
import requests as _requests
from django.utils import timezone as _tz

def _notify_n8n():
    url = getattr(settings, 'N8N_WEBHOOK_REGISTRO_URL', '')
    if not url:
        return
    try:
        _requests.post(url, json={
            'event': 'tenant.registered',
            'user': {'id': str(user.id), 'name': user.name, 'email': user.email},
            'tenant': {'id': str(tenant.id), 'name': tenant.name,
                       'slug': tenant.slug, 'subdomain': tenant.subdomain},
            'plan': tenant.plan,
            'timestamp': _tz.now().isoformat(),
        }, timeout=5)
    except Exception:
        pass

threading.Thread(target=_notify_n8n, daemon=True).start()
```

**Decisión de diseño**: Se usa `threading.Thread` en lugar de Celery porque el worker de Celery no estaba corriendo como servicio independiente en Dokploy, lo que causaba que las tareas quedaran encoladas en Redis sin ejecutarse.

#### 2. `apps/backend_django/apps/auth_app/tasks.py`

Se agregó una tarea Celery `notify_n8n_nuevo_registro` como implementación inicial (luego reemplazada por el thread approach):

```python
@shared_task(
    name='apps.auth_app.tasks.notify_n8n_nuevo_registro',
    ignore_result=True,
    autoretry_for=(Exception,),
    max_retries=2,
    retry_backoff=5,
)
def notify_n8n_nuevo_registro(user_data: dict, tenant_data: dict, plan: str) -> None:
    ...
```

#### 3. `apps/backend_django/config/settings/base.py`

```python
# ─── n8n Webhooks ─────────────────────────────────────────────────────────────
N8N_WEBHOOK_REGISTRO_URL = env('N8N_WEBHOOK_REGISTRO_URL', default='')
```

#### 4. `apps/backend_django/.env.example`

```
# n8n Webhooks — dejar vacío para deshabilitar
N8N_WEBHOOK_REGISTRO_URL=https://n8n.tudominio.com/webhook/registro-hub
```

---

## Configuración de n8n

### Credencial Telegram
- Tipo: **Telegram API**
- Nombre: `Notificacion 1 - digisider`
- Bot: `bot_tenant_sist_4`

### Obtención del Chat ID
Se obtuvo el Chat ID consultando la API de Telegram:
```
https://api.telegram.org/bot<TOKEN>/getUpdates
```
Respuesta relevante:
```json
{
  "chat": {
    "id": 2003683826,
    "first_name": "Jeans",
    "type": "private"
  }
}
```
**Chat ID**: `2003683826` (chat privado con el bot)

### Variable de entorno en Dokploy
```
N8N_WEBHOOK_REGISTRO_URL = https://n8n-workflows.digisider.com/webhook/registro-hub
```

---

## Problemas encontrados y soluciones

### Problema 1 — Celery worker no estaba corriendo en producción

**Síntoma**: Las notificaciones no llegaban a Telegram aunque el registro funcionaba correctamente. En n8n → Executions no aparecía ninguna ejecución del workflow.

**Causa**: La implementación inicial usaba Celery `.delay()` para llamar al webhook de n8n de forma asíncrona. En el entorno de Dokploy, el worker de Celery no estaba configurado como un servicio independiente, por lo que las tareas se encolaban en Redis pero nunca se ejecutaban.

**Solución**: Se reemplazó el `.delay()` de Celery por un `threading.Thread` de Python. Este approach:
- No requiere ningún servicio adicional
- La llamada es asíncrona (no bloquea el response del registro)
- Si n8n no responde, falla silenciosamente (try/except)
- Es compatible con cualquier entorno de despliegue

---

### Problema 2 — URL del webhook con valor placeholder

**Síntoma**: El código estaba desplegado correctamente en Dokploy (commit visible en Deployments como "Done"), pero n8n nunca recibía el POST. Tampoco había ejecuciones en n8n → Executions.

**Causa**: La variable de entorno `N8N_WEBHOOK_REGISTRO_URL` en Dokploy tenía el valor del ejemplo del `.env.example`:
```
N8N_WEBHOOK_REGISTRO_URL = https://tu-n8n.com/webhook/registro-hub  ← INCORRECTO
```
En lugar del valor real:
```
N8N_WEBHOOK_REGISTRO_URL = https://n8n-workflows.digisider.com/webhook/registro-hub  ← CORRECTO
```

**Solución**: Corregir la URL en Dokploy → backend-django → Environment → Save → Redeploy.

**Lección**: El código verificaba `if not url: return` y salía silenciosamente cuando la URL era inválida o vacía — lo cual es correcto para no romper el registro, pero dificultó el diagnóstico inicial porque no generaba ningún error visible.

---

### Problema 3 — Confusión entre Bot Token y Chat ID

**Síntoma**: El usuario tenía el Bot Token (para la credencial de n8n) pero no sabía qué valor poner en el campo "Chat ID" del nodo de Telegram.

**Aclaración**: Son dos cosas distintas:
- **Bot Token**: va en la **credencial de n8n** (Telegram API). Ejemplo: `7234567890:AAF...`
- **Chat ID**: va en el **parámetro del nodo**. Es el identificador numérico del chat donde llegan los mensajes. Ejemplo: `2003683826`

**Solución**: Obtener el Chat ID enviando cualquier mensaje al bot y consultando `getUpdates`.

---

## Resultado final

El flujo funcionó correctamente en la prueba con el usuario "Cliente11":

- **Registro completado**: `digisider.com/register` → Paso 4 "¡Listo!" → Organización "Cliente11" creada
- **Notificación recibida**: 14:02 del 06/06/2026 en el bot `bot_tenant_sist_4`
- **Datos correctos**: nombre, email, empresa, subdominio `cliente11.digisider.com`, plan `professional`, fecha

---

## Variables de entorno necesarias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `N8N_WEBHOOK_REGISTRO_URL` | URL del webhook en n8n (copiar desde nodo Webhook Registro → Production URL) | `https://n8n-workflows.digisider.com/webhook/registro-hub` |

---

## Archivos del proyecto relacionados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `workflows/registro-nuevo-tenant.json` | JSON n8n | Workflow importable en n8n |
| `apps/backend_django/apps/auth_app/views.py` | Python | RegisterView con thread de notificación |
| `apps/backend_django/apps/auth_app/tasks.py` | Python | Tarea Celery (referencia, no usada activamente) |
| `apps/backend_django/config/settings/base.py` | Python | Setting `N8N_WEBHOOK_REGISTRO_URL` |
| `apps/backend_django/.env.example` | Config | Documentación de la variable |
