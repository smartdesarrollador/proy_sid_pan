# Admin Services

[⬅️ Volver al README](../README.md)

---

## Índice
- [Formularios](#formularios)
- [Log de Auditoría](#log-de-auditoría)
- [Reportes del Sistema](#reportes-del-sistema)

---

## Formularios

### Descripción
Constructor de formularios con preguntas configurables, conteo de respuestas y exportación de resultados. Permite crear encuestas, formularios de contacto y recopilación de datos dentro del workspace.

### Características Clave
1. **Constructor de preguntas**: Tipos: texto, opción múltiple, casillas, número, fecha
2. **Estados**: Draft, Activo, Cerrado
3. **Respuestas**: Conteo automático de submissions
4. **Exportación**: Exportar respuestas a CSV (Professional+)
5. **Enlace público**: URL única para compartir el formulario (Starter+)

### Feature Gates por Plan

| Plan | Formularios máximos | Preguntas por form | Respuestas almacenadas | Exportar CSV |
|------|--------------------|--------------------|----------------------|-------------|
| Free | 1 | 5 | 50 | ❌ |
| Starter | 5 | 20 | ∞ | ❌ |
| Professional | 25 | ∞ | ∞ | ✅ |
| Enterprise | ∞ | ∞ | ∞ | ✅ |

### Casos de Uso Referenciados
- **CU-023**: Gestionar Formularios y Respuestas

### User Stories Referenciadas
- **US-099**: Crear formulario con preguntas configurables
- **US-100**: Activar y compartir formulario con URL pública
- **US-101**: Ver respuestas recibidas con conteo
- **US-102**: Exportar respuestas a CSV (Professional+)

### Requerimientos Funcionales
- **FR-121**: CRUD de formularios con constructor de preguntas
- **FR-122**: Múltiples tipos de preguntas (texto, opción múltiple, número, fecha)
- **FR-123**: Gestión de respuestas con conteo y visualización
- **FR-124**: Exportación de respuestas a CSV (Professional+)

### Modelo de Datos Django

```python
class Form(TenantModel):
    """Formulario con preguntas"""
    STATUS_CHOICES = [('draft', 'Borrador'), ('active', 'Activo'), ('closed', 'Cerrado')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forms')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    public_url_slug = models.SlugField(unique=True, blank=True)
    response_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class FormQuestion(models.Model):
    """Pregunta dentro de un formulario"""
    TYPES = [('text', 'Texto'), ('multiple_choice', 'Opción múltiple'),
             ('checkbox', 'Casillas'), ('number', 'Número'), ('date', 'Fecha')]

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='questions')
    order = models.PositiveSmallIntegerField()
    label = models.CharField(max_length=255)
    question_type = models.CharField(max_length=30, choices=TYPES)
    options = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    required = models.BooleanField(default=False)

class FormResponse(models.Model):
    """Respuesta enviada a un formulario"""
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='responses')
    data = models.JSONField()  # {question_id: answer_value}
    respondent_ip = models.GenericIPAddressField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/forms/` | Listar formularios | JWT |
| POST | `/api/v1/forms/` | Crear formulario | JWT |
| GET | `/api/v1/forms/{id}/` | Obtener formulario | JWT |
| PATCH | `/api/v1/forms/{id}/` | Actualizar formulario | JWT |
| DELETE | `/api/v1/forms/{id}/` | Eliminar formulario | JWT |
| POST | `/api/v1/forms/{id}/activate/` | Activar formulario | JWT |
| GET | `/api/v1/forms/{id}/responses/` | Ver respuestas | JWT |
| GET | `/api/v1/forms/{id}/export/` | Exportar CSV (Professional+) | JWT |
| POST | `/api/v1/forms/public/{slug}/submit/` | Enviar respuesta | Público |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Activar | Ver respuestas | Exportar |
|-----|-------|------|---------|---------------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ (propios) | ✅ | ✅ (propios) | ✅ (propios) | ❌ |
| Viewer | ❌ | ✅ | ❌ | ✅ | ❌ |

---

## Log de Auditoría

### Descripción
Timeline cronológico inmutable de todas las acciones realizadas en el sistema. Solo lectura — no permite edición ni eliminación de registros. Permite filtrar por usuario, tipo de acción, recurso y rango de fechas para compliance y debugging.

### Características Clave
1. **Solo lectura**: No se pueden editar ni eliminar registros
2. **Filtros**: Por usuario, acción, recurso, fecha
3. **Retención**: Configurable por plan (30 días / 365 días)
4. **Exportación**: CSV/PDF para compliance (Enterprise)
5. **Búsqueda**: Full-text en descripción de eventos

### Feature Gates por Plan

| Plan | Disponible | Retención | Exportar | API acceso |
|------|-----------|-----------|---------|------------|
| Free | ❌ | — | — | — |
| Starter | ❌ | — | — | — |
| Professional | ✅ | 30 días | ❌ | ❌ |
| Enterprise | ✅ | 365 días | ✅ | ✅ |

### Casos de Uso Referenciados
- **CU-024**: Consultar Log de Auditoría

### User Stories Referenciadas
- **US-103**: Ver timeline de acciones del sistema
- **US-104**: Filtrar eventos por usuario, acción y fecha
- **US-105**: Exportar log de auditoría para compliance (Enterprise)

### Requerimientos Funcionales
- **FR-125**: Timeline de eventos inmutable con filtros múltiples
- **FR-126**: Retención configurable por plan (30 días Pro / 365 días Enterprise)
- **FR-127**: Exportación de logs a CSV/PDF (Enterprise)

> **Nota**: El modelo de datos `AuditLog` ya está definido en el sistema central de RBAC. El servicio de Auditoría expone una vista de lectura de estos datos con filtros adicionales para el usuario final.

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/audit-log/` | Listar eventos (paginado) | JWT + Pro/Enterprise |
| GET | `/api/v1/audit-log/{id}/` | Detalle de evento | JWT + Pro/Enterprise |
| GET | `/api/v1/audit-log/export/` | Exportar CSV/PDF (Enterprise) | JWT + Enterprise |

### Permisos RBAC por Rol

| Rol | Leer log | Exportar | Filtrar todos los usuarios |
|-----|---------|---------|---------------------------|
| Owner | ✅ | ✅ (Enterprise) | ✅ |
| Service Manager | ✅ | ❌ | ✅ |
| Member | ✅ | ❌ | ❌ (solo propio) |
| Viewer | ❌ | ❌ | ❌ |

---

## Reportes del Sistema

### Descripción
Dashboard de métricas del tenant con estadísticas de uso: usuarios activos, proyectos, storage consumido, API calls, tareas completadas y actividad reciente. Solo lectura — datos calculados por el sistema.

### Características Clave
1. **Métricas de uso**: Usuarios activos, storage, API calls
2. **Tendencias**: Comparativa período actual vs anterior
3. **Visualizaciones**: Barras CSS (sin librería externa)
4. **Filtros temporales**: Última semana, mes, trimestre
5. **Exportación**: PDF ejecutivo (Enterprise)

### Feature Gates por Plan

| Plan | Disponible | Métricas | Período histórico | Exportar |
|------|-----------|---------|------------------|---------|
| Free | ❌ | — | — | — |
| Starter | ✅ | Básicas | 30 días | ❌ |
| Professional | ✅ | Avanzadas | 90 días | ❌ |
| Enterprise | ✅ | Personalizadas | 365 días | ✅ |

### Casos de Uso Referenciados
- **CU-025**: Consultar Reportes del Sistema

### User Stories Referenciadas
- **US-106**: Ver métricas de uso del workspace (Starter+)
- **US-107**: Comparar métricas entre períodos
- **US-108**: Exportar reporte ejecutivo (Enterprise)

### Requerimientos Funcionales
- **FR-128**: Dashboard de métricas con usuarios activos, storage, API calls y proyectos
- **FR-129**: Comparativas de tendencia vs período anterior con indicadores de cambio
- **FR-130**: Exportación de reporte ejecutivo en PDF (Enterprise)

### Datos del Dashboard

```python
# Métricas calculadas bajo demanda (no se almacenan raw)
class TenantReport:
    """Reporte de métricas del tenant"""

    @staticmethod
    def get_summary(tenant_id: UUID, period_days: int = 30) -> dict:
        """Calcula métricas del período"""
        end = now()
        start = end - timedelta(days=period_days)
        return {
            'active_users': User.objects.filter(
                tenant_id=tenant_id, last_login__gte=start).count(),
            'total_projects': Project.objects.filter(tenant_id=tenant_id).count(),
            'storage_used_bytes': File.objects.filter(
                tenant_id=tenant_id).aggregate(Sum('size'))['size__sum'] or 0,
            'api_calls_period': APIUsageLog.objects.filter(
                tenant_id=tenant_id, created_at__gte=start).count(),
            'tasks_completed': Task.objects.filter(
                tenant_id=tenant_id, status='done', updated_at__gte=start).count(),
        }
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/reports/summary/` | Resumen de métricas del tenant | JWT + Starter+ |
| GET | `/api/v1/reports/usage/` | Breakdown de uso por recurso | JWT + Starter+ |
| GET | `/api/v1/reports/trends/` | Tendencias históricas | JWT + Professional+ |
| GET | `/api/v1/reports/export/` | Exportar PDF ejecutivo | JWT + Enterprise |

### Permisos RBAC por Rol

| Rol | Ver métricas básicas | Ver métricas avanzadas | Exportar |
|-----|---------------------|----------------------|---------|
| Owner | ✅ | ✅ | ✅ (Enterprise) |
| Service Manager | ✅ | ✅ | ❌ |
| Member | ❌ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [⬅️ Ver DevOps Services](devops-services.md)
- [Ver Functional Requirements](../requirements/functional-requirements.md)

---

**Última actualización**: 2026-02-17
