# Soporte y Tickets

[⬅️ Volver al README](../README.md)

---

## Índice
- [Descripción](#descripción)
- [Características Clave](#características-clave)
- [Categorías de Tickets](#categorías-de-tickets)
- [Estados del Ticket](#estados-del-ticket)
- [Feature Gates por Plan](#feature-gates-por-plan)
- [Casos de Uso Referenciados](#casos-de-uso-referenciados)
- [User Stories Referenciadas](#user-stories-referenciadas)
- [Requerimientos Funcionales](#requerimientos-funcionales)
- [Modelo de Datos Django](#modelo-de-datos-django)
- [Endpoints API REST](#endpoints-api-rest)
- [Permisos RBAC por Rol](#permisos-rbac-por-rol)

---

## Descripción

Sistema de ticketing para que clientes reporten problemas, solicitudes y consultas al equipo de soporte/admin. El panel admin gestiona los tickets desde una bandeja unificada con filtros, historial y modal de detalle con timeline de comentarios estilo chat.

---

## Características Clave

1. **Bandeja de tickets activos**: Muestra tickets en estado `open`, `in_progress`, `waiting_client`
2. **Historial de resueltos/cerrados**: Tab separado con tickets en estado `resolved` y `closed`
3. **4 KPI cards**: Total Tickets, Abiertos, En Progreso, Resueltos Hoy
4. **Filtrado granular**: Por prioridad (urgente/alta/media/baja) y por categoría
5. **Búsqueda full-text**: Por asunto, nombre de cliente o email en tiempo real
6. **Modal de detalle**: Timeline de comentarios estilo chat con historial completo
7. **Cambio de estado**: Selector de estado accesible desde el modal
8. **Respuesta rápida**: Textarea + botón "Enviar" integrado en el modal de detalle

---

## Categorías de Tickets

| Clave | Etiqueta |
|-------|----------|
| `technical` | Técnico |
| `billing` | Facturación |
| `access` | Acceso |
| `feature_request` | Solicitud de Feature |
| `other` | Otro |

---

## Estados del Ticket

```
open → in_progress → waiting_client → resolved → closed
```

| Estado | Descripción |
|--------|-------------|
| `open` | Ticket recibido, sin respuesta del agente |
| `in_progress` | Agente ha tomado el ticket y está trabajando en él |
| `waiting_client` | Agente respondió y espera información del cliente |
| `resolved` | Problema resuelto; `resolved_at` se registra automáticamente |
| `closed` | Ticket archivado definitivamente |

---

## Feature Gates por Plan

Soporte es funcionalidad del panel admin. Los planes se aplican a capacidades del cliente que genera el ticket.

| Plan | Acceso admin al módulo | Exportar historial | SLA Tracking |
|------|------------------------|--------------------|--------------|
| Free | ✅ Visible en admin | ❌ | ❌ |
| Starter | ✅ | ❌ | ❌ |
| Professional | ✅ | ✅ Exportar a CSV/PDF | ❌ |
| Enterprise | ✅ | ✅ | ✅ SLA tracking |

> Los tickets entrantes no tienen límite numérico en ningún plan — son solicitudes de los clientes al soporte.

---

## Casos de Uso Referenciados

- **CU-026**: Gestionar bandeja de tickets de soporte (admin)
- **CU-027**: Responder y resolver ticket de cliente

Ver detalle en [use-cases.md](../requirements/use-cases.md).

---

## User Stories Referenciadas

- **US-113**: Ver bandeja con KPIs y tickets activos
- **US-114**: Ver historial de tickets resueltos/cerrados
- **US-115**: Filtrar y buscar tickets en tiempo real
- **US-116**: Ver detalle del ticket con timeline de comentarios
- **US-117**: Responder y cambiar estado de un ticket desde el modal

Ver detalle en [user-stories.md](../requirements/user-stories.md).

---

## Requerimientos Funcionales

- **FR-136**: Bandeja de tickets activos con KPI cards
- **FR-137**: Tab historial de tickets resueltos/cerrados
- **FR-138**: Modal de detalle con timeline de comentarios estilo chat
- **FR-139**: Filtrado y búsqueda full-text de tickets
- **FR-140**: Gestión de estado y respuesta desde el modal

Ver detalle en [functional-requirements.md](../requirements/functional-requirements.md).

---

## Modelo de Datos Django

```python
class SupportTicket(models.Model):
    CATEGORY_CHOICES = [
        ('technical', 'Técnico'),
        ('billing', 'Facturación'),
        ('access', 'Acceso'),
        ('feature_request', 'Solicitud'),
        ('other', 'Otro'),
    ]
    STATUS_CHOICES = [
        ('open', 'Abierto'),
        ('in_progress', 'En Progreso'),
        ('waiting_client', 'Esperando Cliente'),
        ('resolved', 'Resuelto'),
        ('closed', 'Cerrado'),
    ]
    PRIORITY_CHOICES = [
        ('urgente', 'Urgente'),
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]

    id = models.CharField(max_length=20, primary_key=True)  # TKT-XXX
    subject = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='media')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='support_tickets')
    client = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, related_name='submitted_tickets'
    )
    client_email = models.EmailField()
    assigned_to = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
        ]


class TicketComment(models.Model):
    ROLE_CHOICES = [
        ('client', 'Cliente'),
        ('agent', 'Agente'),
    ]

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='comments')
    author = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
```

---

## Endpoints API REST

| Método | Endpoint | Descripción | Permiso requerido |
|--------|----------|-------------|-------------------|
| `GET` | `/api/v1/support/tickets/` | Listar tickets (filtros: `status`, `priority`, `category`) | `support.read` |
| `POST` | `/api/v1/support/tickets/` | Crear nuevo ticket | `support.create` |
| `GET` | `/api/v1/support/tickets/{id}/` | Detalle de ticket | `support.read` |
| `PATCH` | `/api/v1/support/tickets/{id}/` | Actualizar estado o asignación | `support.update` |
| `POST` | `/api/v1/support/tickets/{id}/comments/` | Agregar comentario al timeline | `support.update` |
| `POST` | `/api/v1/support/tickets/{id}/close/` | Cerrar ticket definitivamente | `support.close` |

---

## Permisos RBAC por Rol

| Rol | `support.read` | `support.create` | `support.update` | `support.assign` | `support.close` |
|-----|:-:|:-:|:-:|:-:|:-:|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customer Success Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ❌ | ❌ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [⬅️ Ver Admin Services](admin-services.md)
- [Ver Functional Requirements](../requirements/functional-requirements.md)

---

**Última actualización**: 2026-02-22
