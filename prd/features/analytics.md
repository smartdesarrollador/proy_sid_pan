# Feature: Business Analytics y Métricas

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Casos de Uso](#casos-de-uso)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Analytics por Plan](#analytics-por-plan)

---

## Product Overview

El módulo de **Business Analytics** proporciona a los administradores de organizaciones visibilidad completa sobre métricas clave de negocio, base de clientes, distribución de planes, y salud financiera del sistema.

**Problema que Resuelve:**
- Los administradores necesitan insights en tiempo real sobre el estado del negocio
- Dificultad para identificar clientes con problemas de pago o churning
- Falta de visibilidad sobre distribución de planes y MRR (Monthly Recurring Revenue)
- Imposibilidad de tomar decisiones basadas en datos sin herramientas de BI externas

**Propuesta de Valor:**
- Dashboard centralizado con KPIs de negocio en tiempo real
- Métricas clave: MRR, ARPC, Churn Rate, Health Score
- Distribución visual de clientes por plan y estado
- Top clientes por MRR para identificar cuentas estratégicas
- Filtros dinámicos por plan, estado, rango de fechas

---

## Casos de Uso

### CU-014: Monitoreo de Métricas de Negocio

**Actor**: SuperAdmin, OrgAdmin

**Precondiciones**:
- Usuario autenticado con rol SuperAdmin u OrgAdmin
- Tenant tiene al menos 1 cliente activo
- Sistema tiene datos de facturación registrados

**Flujo Principal**:
1. Admin accede a "Analytics" desde menú principal
2. Sistema carga dashboard con KPIs principales:
   - Clientes Activos (total + % cambio vs mes anterior)
   - MRR Total ($ + % cambio vs mes anterior)
   - ARPC (Average Revenue Per Customer + % cambio)
   - Health Score (% de salud promedio del negocio)
3. Admin visualiza gráficos de distribución:
   - Distribución por Plan (barras horizontales con % y count)
   - Distribución por Estado (Activo, Prueba, Pago Vencido, Cancelado)
   - MRR por Plan (desglose de revenue por tier)
   - Top 5 Clientes por MRR (tabla con ranking)
4. Admin aplica filtros:
   - Por plan: Free, Starter, Professional, Enterprise, Todos
   - Por estado: Activo, Prueba, Pago Vencido, Cancelado, Todos
5. Sistema actualiza gráficos y métricas según filtros seleccionados
6. Admin exporta reporte a PDF/Excel (Professional+)

**Postcondiciones**:
- Admin tiene visibilidad completa de métricas de negocio
- Puede tomar decisiones informadas sobre pricing, retención, growth

**Flujos Alternativos**:
- **3a. Sin clientes activos**: Mostrar empty state con CTA para invitar usuarios
- **6a. Plan Free/Starter**: Mostrar upgrade prompt para exportar reportes

---

## User Stories

### US-061: Ver Dashboard de Analytics con KPIs

**Como** SuperAdmin u OrgAdmin,
**Quiero** visualizar un dashboard con métricas clave de negocio (Clientes Activos, MRR, ARPC, Health Score),
**Para** monitorear la salud financiera y tomar decisiones basadas en datos.

**Criterios de Aceptación:**
- [ ] Dashboard muestra 4 KPIs principales en cards:
  - Clientes Activos (count + % cambio vs mes anterior)
  - MRR Total ($ + % cambio vs mes anterior)
  - ARPC - Average Revenue Per Customer ($ + % cambio)
  - Health Score (% + indicador Estable/Crecimiento/Riesgo)
- [ ] Indicadores de cambio tienen color semántico:
  - Verde (+% positivo para MRR, Clientes)
  - Rojo (-% negativo)
  - Gris (sin cambio o estable)
- [ ] Métricas se calculan en tiempo real desde BD
- [ ] Carga inicial < 2 segundos
- [ ] Soporte responsive para tablet y móvil

**Prioridad:** Alta
**Estimación:** 5 puntos

---

### US-062: Filtrar Analytics por Plan y Estado

**Como** admin,
**Quiero** filtrar las métricas por plan de suscripción y estado de cliente,
**Para** analizar segmentos específicos de mi base de clientes.

**Criterios de Aceptación:**
- [ ] Filtros disponibles en header de dashboard:
  - Dropdown "Plan": Todos, Free, Starter, Professional, Enterprise
  - Dropdown "Estado": Todos, Activo, Prueba, Pago Vencido, Cancelado
- [ ] Al cambiar filtro, todos los gráficos y KPIs se actualizan
- [ ] Filtros persisten en query params para compartir URL
- [ ] Combinación de filtros (ej: Professional + Activo)
- [ ] Indicador visual de filtros activos
- [ ] Botón "Limpiar filtros" para resetear a "Todos"

**Prioridad:** Media
**Estimación:** 3 puntos

---

### US-063: Visualizar Distribución de Clientes por Plan

**Como** admin,
**Quiero** ver un gráfico de barras con distribución de clientes por plan,
**Para** entender la composición de mi base de clientes.

**Criterios de Aceptación:**
- [ ] Gráfico de barras horizontales con:
  - Eje X: Cantidad de clientes
  - Eje Y: Plan (Free, Starter, Professional, Enterprise)
  - Color único por plan (consistente con branding)
- [ ] Cada barra muestra:
  - Cantidad absoluta de clientes
  - Porcentaje del total (ej: "40.0%")
- [ ] Barras ordenadas de mayor a menor cantidad
- [ ] Tooltip al hover con detalles adicionales
- [ ] Animación de carga progresiva

**Prioridad:** Alta
**Estimación:** 3 puntos

---

### US-064: Identificar Top 5 Clientes por MRR

**Como** admin,
**Quiero** ver un ranking de mis top 5 clientes ordenados por MRR,
**Para** identificar cuentas estratégicas y priorizar atención comercial.

**Criterios de Aceptación:**
- [ ] Tabla muestra columnas:
  - # (ranking 1-5)
  - Cliente (nombre con avatar)
  - Plan (badge con color)
  - MRR ($ formateado)
  - Usuarios (count de miembros del tenant)
- [ ] Ordenado descendente por MRR
- [ ] Click en fila navega a detalle de cliente
- [ ] Destacar visualmente #1 (ej: icono de corona)
- [ ] Si hay empate en MRR, ordenar alfabéticamente

**Prioridad:** Media
**Estimación:** 3 puntos

---

### US-065: Exportar Reportes de Analytics (Professional+)

**Como** admin con plan Professional o Enterprise,
**Quiero** exportar reportes de analytics a PDF o Excel,
**Para** compartir métricas con stakeholders externos.

**Criterios de Aceptación:**
- [ ] Botón "Exportar" en header de dashboard
- [ ] Opciones de formato: PDF, Excel (XLSX)
- [ ] Reporte incluye:
  - Fecha de generación
  - Filtros aplicados
  - Todos los KPIs y gráficos visibles
  - Tabla de top 10 clientes (vs 5 en UI)
- [ ] Feature gate: solo Professional y Enterprise
- [ ] Plan Free/Starter muestra upgrade prompt
- [ ] Descarga archivo con nombre: `analytics-{tenant}-{fecha}.{ext}`
- [ ] Generación async con notificación al completar

**Prioridad:** Baja
**Estimación:** 5 puntos

---

## Functional Requirements

### FR-083: Dashboard de Analytics en Tiempo Real

**Descripción:**
El sistema debe proporcionar un dashboard de analytics con métricas de negocio calculadas en tiempo real desde la base de datos.

**Reglas de Negocio:**
- Cálculo de métricas:
  - **Clientes Activos**: Count de tenants con `status = 'active'`
  - **MRR Total**: Sum de `subscription.amount` donde `billing_cycle = 'monthly'` y `status = 'active'` + (annual/12)
  - **ARPC**: MRR Total / Clientes Activos
  - **Health Score**: Weighted average de factores (payment_on_time 40%, usage 30%, support_tickets 20%, nps 10%)
- % cambio vs mes anterior: comparar con snapshot del día 1 del mes anterior
- Gráficos actualizados con filtros sin reload de página
- Cache de métricas con TTL 5 minutos (invalidar en cambios de suscripción)

**Prioridad:** Alta

---

### FR-084: Filtros Dinámicos de Analytics

**Descripción:**
Permitir filtrar todas las métricas y gráficos por plan de suscripción y estado de cliente.

**Reglas de Negocio:**
- Filtros disponibles:
  - Plan: `all`, `free`, `starter`, `professional`, `enterprise`
  - Estado: `all`, `active`, `trial`, `past_due`, `canceled`
- Combinación de filtros con lógica AND
- Filtros persisten en URL query params: `?plan=professional&status=active`
- Si filtros vacíos o inválidos, usar defaults: `plan=all&status=all`
- Al cambiar filtro, trigger query a backend con nuevos parámetros

**Prioridad:** Alta

---

### FR-085: Distribución Visual de Clientes

**Descripción:**
Proveer gráficos de distribución de clientes por plan, estado, y MRR.

**Reglas de Negocio:**
- Gráficos requeridos:
  1. **Distribución por Plan**: Horizontal bar chart (count + %)
  2. **Distribución por Estado**: Horizontal bar chart (count + %)
  3. **MRR por Plan**: Stacked bar o pie chart con desglose $
- Colores semánticos:
  - Free: Gris
  - Starter: Azul
  - Professional: Púrpura
  - Enterprise: Naranja
  - Activo: Verde, Prueba: Azul, Pago Vencido: Rojo, Cancelado: Gris
- Totales deben sumar 100% para gráficos de porcentaje
- Si un plan tiene 0 clientes, no mostrarlo en gráfico

**Prioridad:** Alta

---

### FR-086: Ranking de Top Clientes

**Descripción:**
Mostrar tabla con top 5 (o más) clientes ordenados por MRR descendente.

**Reglas de Negocio:**
- Ranking muestra:
  - Top 5 en dashboard principal
  - Top 10 en reporte exportado
- Criterio de ordenamiento: MRR descendente, alfabético en empates
- Columnas: ranking, nombre, plan, MRR, usuarios count
- Click en fila navega a `/admin/tenants/{tenant_id}`
- Permisos: Solo SuperAdmin y OrgAdmin ven este ranking

**Prioridad:** Media

---

### FR-087: Exportación de Reportes (Feature Gate)

**Descripción:**
Permitir exportar reportes de analytics a PDF y Excel, gated por plan Professional+.

**Reglas de Negocio:**
- Feature gate:
  - Free/Starter: Botón deshabilitado con tooltip "Upgrade to Professional"
  - Professional/Enterprise: Funcionalidad completa
- Formato PDF:
  - Header con logo y nombre del tenant
  - KPIs en tabla resumen
  - Gráficos como imágenes PNG
  - Footer con fecha de generación
- Formato Excel:
  - Sheet 1: KPIs y métricas
  - Sheet 2: Tabla de clientes completa
  - Sheet 3: Datos raw para pivot tables
- Generación async con Celery task
- Notificación push cuando reporte está listo
- Link de descarga expira en 24h

**Prioridad:** Baja

---

## Data Models

### Metric (Nuevo modelo)

Modelo para almacenar snapshots históricos de métricas de negocio.

```python
class Metric(models.Model):
    """Snapshots históricos de métricas de negocio"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='metrics')

    # Tipo de métrica
    metric_type = models.CharField(max_length=50, choices=[
        ('clients_active', 'Clientes Activos'),
        ('mrr_total', 'MRR Total'),
        ('arpc', 'ARPC'),
        ('health_score', 'Health Score'),
        ('churn_rate', 'Churn Rate'),
    ])

    # Valor de la métrica
    value = models.DecimalField(max_digits=12, decimal_places=2)

    # Dimensiones adicionales (JSON para flexibilidad)
    dimensions = models.JSONField(default=dict, blank=True)
    # Ejemplo: {"plan": "professional", "region": "LATAM"}

    # Timestamp del snapshot
    recorded_at = models.DateTimeField(db_index=True)

    # Período de la métrica
    period = models.CharField(max_length=20, choices=[
        ('hour', 'Hora'),
        ('day', 'Día'),
        ('week', 'Semana'),
        ('month', 'Mes'),
        ('year', 'Año'),
    ])

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'metrics'
        indexes = [
            models.Index(fields=['tenant', 'metric_type', 'recorded_at']),
            models.Index(fields=['metric_type', 'period']),
        ]
        unique_together = [['tenant', 'metric_type', 'recorded_at', 'period']]
        ordering = ['-recorded_at']
```

**Notas:**
- Se ejecuta tarea Celery cada hora para calcular y guardar snapshots
- Permite calcular "% cambio vs mes anterior" comparando snapshots
- `dimensions` JSON permite agregar filtros arbitrarios sin migrar schema

---

## API Endpoints

### GET /api/v1/analytics/dashboard

Obtiene métricas agregadas del dashboard de analytics.

**Request:**
```http
GET /api/v1/analytics/dashboard?plan=all&status=all
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `plan` (optional): `all`, `free`, `starter`, `professional`, `enterprise`. Default: `all`
- `status` (optional): `all`, `active`, `trial`, `past_due`, `canceled`. Default: `all`

**Response 200:**
```json
{
  "kpis": {
    "clients_active": {
      "value": 3,
      "change_percent": 12.5,
      "change_direction": "up"
    },
    "mrr_total": {
      "value": 697.00,
      "change_percent": 8.0,
      "change_direction": "up"
    },
    "arpc": {
      "value": 232.33,
      "change_percent": -2.0,
      "change_direction": "down"
    },
    "health_score": {
      "value": 72,
      "status": "stable"
    }
  },
  "distribution": {
    "by_plan": [
      {"plan": "professional", "count": 2, "percentage": 40.0},
      {"plan": "starter", "count": 1, "percentage": 20.0},
      {"plan": "enterprise", "count": 1, "percentage": 20.0},
      {"plan": "free", "count": 1, "percentage": 20.0}
    ],
    "by_status": [
      {"status": "active", "count": 3, "percentage": 60.0},
      {"status": "trial", "count": 1, "percentage": 20.0},
      {"status": "past_due", "count": 1, "percentage": 20.0}
    ]
  },
  "mrr_by_plan": {
    "total": 697.00,
    "breakdown": [
      {"plan": "professional", "mrr": 400.00},
      {"plan": "enterprise", "mrr": 197.00},
      {"plan": "starter", "mrr": 100.00},
      {"plan": "free", "mrr": 0.00}
    ]
  },
  "top_clients": [
    {
      "rank": 1,
      "tenant_id": "uuid",
      "name": "Global Logistics Inc",
      "plan": "enterprise",
      "mrr": 499.00,
      "user_count": 87
    }
  ]
}
```

**Errores:**
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Usuario no tiene permisos (requiere SuperAdmin u OrgAdmin)

---

### POST /api/v1/analytics/export

Genera y exporta reporte de analytics (Professional+).

**Request:**
```http
POST /api/v1/analytics/export
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "format": "pdf",
  "filters": {
    "plan": "all",
    "status": "active"
  }
}
```

**Response 202 Accepted:**
```json
{
  "task_id": "celery-task-uuid",
  "status": "processing",
  "message": "Report generation started. You'll be notified when ready.",
  "estimated_time": 30
}
```

**Response 403 Forbidden (Free/Starter):**
```json
{
  "error": "feature_locked",
  "message": "Exporting reports requires Professional or Enterprise plan",
  "upgrade_url": "/billing/upgrade"
}
```

---

### GET /api/v1/analytics/export/{task_id}

Verifica estado de generación de reporte y obtiene link de descarga.

**Response 200 (Completed):**
```json
{
  "task_id": "celery-task-uuid",
  "status": "completed",
  "download_url": "https://cdn.example.com/reports/analytics-acme-2026-02-15.pdf",
  "expires_at": "2026-02-16T23:59:59Z"
}
```

---

## Analytics por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Ver Dashboard Analytics | ❌ | ✅ | ✅ | ✅ |
| KPIs básicos (Clientes, MRR) | ❌ | ✅ | ✅ | ✅ |
| Health Score | ❌ | ❌ | ✅ | ✅ |
| Gráficos de distribución | ❌ | ✅ | ✅ | ✅ |
| Top 5 clientes | ❌ | ✅ | ✅ | ✅ |
| Filtros por plan/estado | ❌ | ✅ | ✅ | ✅ |
| Exportar reportes (PDF/Excel) | ❌ | ❌ | ✅ | ✅ |
| Métricas históricas (6 meses) | ❌ | ❌ | ✅ | ✅ |
| Métricas históricas (ilimitado) | ❌ | ❌ | ❌ | ✅ |
| Custom dashboards | ❌ | ❌ | ❌ | ✅ |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [📊 Requirements: User Stories](../requirements/user-stories.md)
- [📊 Requirements: Functional Requirements](../requirements/functional-requirements.md)
- [🔧 Technical: Data Models](../technical/data-models.md)
- [🔧 Technical: API Endpoints](../technical/api-endpoints.md)

---

**Última actualización:** 2026-02-15
