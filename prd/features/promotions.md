# Feature: Sistema de Promociones y Códigos de Descuento

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Casos de Uso](#casos-de-uso)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Tipos de Promociones](#tipos-de-promociones)

---

## Product Overview

El módulo de **Promociones** permite a los administradores crear, gestionar y monitorear códigos de descuento especiales para impulsar adquisición, conversión y retención de clientes.

**Problema que Resuelve:**
- Dificultad para ejecutar campañas promocionales sin soporte técnico
- Falta de herramientas para descuentos limitados por tiempo o usos
- Imposibilidad de ofrecer trials extendidos o créditos promocionales
- Ausencia de tracking de efectividad de promociones

**Propuesta de Valor:**
- Creación self-service de códigos promocionales
- 3 tipos de descuentos: Porcentaje (%), Monto fijo ($), Días adicionales de trial
- Control granular: límite de usos, vigencia temporal, planes aplicables
- Estados automáticos: Activa, Agotada, Expirada, Pausada
- Analytics de promociones: usos totales, ingresos generados, conversión
- Aplicación automática en checkout y upgrades

---

## Casos de Uso

### CU-015: Crear Promoción de Descuento Temporal

**Actor**: SuperAdmin, Marketing Manager

**Precondiciones**:
- Usuario autenticado con permisos para gestionar promociones
- Plan Professional o Enterprise (feature gate)

**Flujo Principal**:
1. Admin accede a "Promociones" desde menú de administración
2. Hace click en "Nueva Promoción"
3. Completa formulario modal:
   - **Código**: SUMMER2026 (alfanumérico, mayúsculas, único)
   - **Nombre**: Promoción de Verano 2026
   - **Descripción**: Descuento especial para nuevos clientes en verano
   - **Tipo**: Porcentaje (%)
   - **Valor**: 20 (%)
   - **Límite de usos**: 100
   - **Vigencia**: 2026-06-01 a 2026-08-31
   - **Planes aplicables**: Starter, Professional (multi-select)
   - **Primer pago solamente**: Sí
4. Sistema valida:
   - Código único (no existe otra promo activa con mismo código)
   - Fechas válidas (inicio < fin, fin > hoy)
   - Valor positivo según tipo (% entre 1-100, $ > 0, días > 0)
5. Promoción creada con estado "Activa"
6. Sistema muestra promoción en tabla con indicador de progreso 0/100 usos
7. Admin puede copiar código para compartir en campañas

**Postcondiciones**:
- Promoción disponible para aplicar en checkout
- Usuarios pueden ingresar código SUMMER2026 al suscribirse
- Sistema aplica 20% descuento en primer pago de Starter/Professional

**Flujos Alternativos**:
- **3a. Código duplicado**: Mostrar error "Código ya existe. Elige otro."
- **3b. Fechas inválidas**: Validar en frontend antes de submit
- **4a. Plan Free sin promociones**: Mostrar upgrade prompt

---

## User Stories

### US-066: Crear Nueva Promoción

**Como** admin con permisos de marketing,
**Quiero** crear códigos promocionales con descuentos personalizados,
**Para** ejecutar campañas de adquisición y retención sin soporte técnico.

**Criterios de Aceptación:**
- [ ] Botón "Nueva Promoción" abre modal de creación
- [ ] Formulario requiere:
  - Código (alfanumérico, 3-20 chars, uppercase, único)
  - Nombre (display name, 5-100 chars)
  - Descripción opcional (hasta 255 chars)
  - Tipo: Porcentaje (%), Monto ($), Días adicionales
  - Valor según tipo:
    - % entre 1-100
    - $ entre 1-10000
    - Días entre 1-365
  - Límite de usos (1-9999, opcional = ilimitado)
  - Vigencia: fecha inicio + fecha fin (obligatorias)
  - Planes aplicables: multi-select (Free, Starter, Pro, Enterprise)
  - Checkbox "Solo primer pago" (default: true)
- [ ] Validaciones en tiempo real:
  - Código único (async check con debounce 300ms)
  - Fechas: inicio < fin, fin >= hoy
  - Valor > 0 según tipo
- [ ] Al guardar, promoción tiene estado "Activa" si hoy >= fecha_inicio
- [ ] Si fecha_inicio > hoy, estado es "Programada"
- [ ] Notificación de éxito con código para copiar

**Prioridad:** Alta
**Estimación:** 5 puntos

---

### US-067: Gestionar Estados de Promociones

**Como** admin,
**Quiero** pausar, reanudar o finalizar promociones activas,
**Para** controlar manualmente la disponibilidad de códigos.

**Criterios de Aceptación:**
- [ ] Columna "Estado" muestra badge con color semántico:
  - Activa (verde)
  - Pausada (amarillo)
  - Agotada (gris)
  - Expirada (rojo)
  - Programada (azul)
- [ ] Menú de acciones incluye:
  - "Pausar" (solo si Activa) → cambia estado a Pausada
  - "Reanudar" (solo si Pausada) → vuelve a Activa
  - "Finalizar" (si Activa/Pausada) → marca como Expirada manualmente
- [ ] Estados automáticos:
  - Si usos >= límite → Agotada (no editable)
  - Si hoy > fecha_fin → Expirada (no editable)
  - Si hoy < fecha_inicio → Programada
- [ ] Confirmación antes de finalizar manualmente
- [ ] Al pausar, código no aplicable en checkout (error user-friendly)

**Prioridad:** Media
**Estimación:** 3 puntos

---

### US-068: Filtrar y Buscar Promociones

**Como** admin,
**Quiero** buscar promociones por código/nombre y filtrar por estado/tipo,
**Para** encontrar rápidamente códigos específicos en listas largas.

**Criterios de Aceptación:**
- [ ] Barra de búsqueda con placeholder "Buscar por código o nombre..."
- [ ] Búsqueda en tiempo real con debounce 300ms
- [ ] Búsqueda case-insensitive en:
  - Código
  - Nombre
  - Descripción
- [ ] Filtros dropdown:
  - Estado: Todos, Activa, Pausada, Agotada, Expirada, Programada
  - Tipo: Todos, Porcentaje (%), Monto ($), Días adicionales
- [ ] Filtros combinables (búsqueda + estado + tipo)
- [ ] Indicador de "X resultados encontrados"
- [ ] Botón "Limpiar filtros" si hay filtros activos
- [ ] Persistencia de filtros en URL query params

**Prioridad:** Media
**Estimación:** 3 puntos

---

### US-069: Monitorear Métricas de Promociones

**Como** admin,
**Quiero** ver KPIs de promociones (activas, usos totales, ingresos generados),
**Para** medir la efectividad de mis campañas.

**Criterios de Aceptación:**
- [ ] Header de página muestra 3 KPIs en cards:
  - Promociones Activas (count de estado = Activa)
  - Usos Totales (sum de `current_uses` de todas las promos)
  - Ingresos Generados (sum de discounts aplicados)
- [ ] Tabla muestra columna "Uso" con:
  - Barra de progreso (current_uses / max_uses)
  - Indicador numérico "X/Y" (ej: 23/100)
  - % de utilización
- [ ] Click en icono "Analytics" de fila muestra modal con:
  - Gráfico de usos en el tiempo (line chart)
  - Conversión: % de usuarios que aplicaron el código y pagaron
  - Planes donde más se usó (pie chart)
  - Revenue impactado ($ total de descuentos)
- [ ] Feature gate Analytics detallado: Professional+
- [ ] Exportar reporte de promoción individual (PDF/Excel)

**Prioridad:** Media
**Estimación:** 5 puntos

---

### US-070: Aplicar Código Promocional en Checkout

**Como** usuario nuevo,
**Quiero** ingresar un código promocional durante el checkout,
**Para** obtener descuentos en mi suscripción.

**Criterios de Aceptación:**
- [ ] Checkout muestra campo "Código promocional" (colapsable)
- [ ] Al ingresar código y hacer click "Aplicar":
  - Validación async con backend
  - Spinner durante validación
- [ ] Si código válido:
  - Mostrar mensaje de éxito: "Código SUMMER2026 aplicado: 20% de descuento"
  - Actualizar precio final con descuento
  - Mostrar precio original tachado + precio con descuento
- [ ] Si código inválido:
  - Error: "Código inválido o expirado"
  - No cambiar precio
- [ ] Validaciones backend:
  - Código existe y estado = Activa
  - No supera límite de usos
  - Vigencia válida (hoy entre fecha_inicio y fecha_fin)
  - Plan seleccionado incluido en planes_aplicables
- [ ] Al completar pago:
  - Incrementar `current_uses` de promoción
  - Crear registro en PromoUsage
  - Aplicar descuento en invoice
- [ ] Promoción aplicable también en upgrades (si configurado)

**Prioridad:** Alta
**Estimación:** 5 puntos

---

## Functional Requirements

### FR-088: CRUD de Promociones

**Descripción:**
Sistema debe permitir crear, leer, actualizar y eliminar códigos promocionales con validaciones de negocio.

**Reglas de Negocio:**
- **Crear**:
  - Código único a nivel global (no solo por tenant)
  - Código alfanumérico: `^[A-Z0-9]{3,20}$` (uppercase)
  - Fechas: inicio < fin, fin >= hoy
  - Valor > 0 según tipo
  - Estado inicial: "Programada" si inicio > hoy, sino "Activa"
- **Actualizar**:
  - Solo editable si estado = Activa o Pausada
  - No permitir cambiar código (inmutable)
  - No permitir reducir límite de usos por debajo de usos actuales
  - Al editar fecha_fin, validar que sea >= hoy
- **Eliminar**:
  - Soft delete: set `deleted_at` timestamp
  - Solo eliminable si usos = 0
  - Si usos > 0, mostrar confirmación "Promoción tiene X usos registrados. ¿Eliminar de todos modos?"
- **Permisos**: SuperAdmin, Marketing Manager (custom role)

**Prioridad:** Alta

---

### FR-089: Estados Automáticos de Promociones

**Descripción:**
Sistema debe actualizar automáticamente estados de promociones según reglas de negocio.

**Reglas de Negocio:**
- **Activa**: hoy >= fecha_inicio && hoy <= fecha_fin && current_uses < max_uses && !paused
- **Programada**: hoy < fecha_inicio
- **Agotada**: current_uses >= max_uses
- **Expirada**: hoy > fecha_fin
- **Pausada**: admin pausó manualmente (independiente de fechas/usos)
- Tarea Celery cada 1 hora actualiza estados de todas las promociones
- Eventos de webhook cuando promoción cambia de estado:
  - `promotion.activated`
  - `promotion.depleted` (agotada)
  - `promotion.expired`

**Prioridad:** Alta

---

### FR-090: Validación de Códigos en Checkout

**Descripción:**
Backend debe validar códigos promocionales al aplicar en checkout y upgrades.

**Reglas de Negocio:**
- Validaciones en orden:
  1. Código existe y no eliminado
  2. Estado = Activa (400 Bad Request si otro estado)
  3. Vigencia: hoy >= fecha_inicio && hoy <= fecha_fin
  4. Usos: current_uses < max_uses (o max_uses = NULL = ilimitado)
  5. Plan seleccionado en planes_aplicables
  6. Si first_payment_only = true, validar que usuario no tiene suscripción previa
- Si todas las validaciones pasan:
  - Calcular descuento según tipo
  - Retornar precio original + precio con descuento
  - Reservar uso (increment tentative_uses, expira en 15min)
- Si pago exitoso:
  - Confirm uso: increment current_uses, clear tentative_uses
  - Crear registro PromoUsage
  - Aplicar descuento en invoice
- Si pago falla o expira:
  - Rollback: decrement tentative_uses

**Prioridad:** Alta

---

### FR-091: Tipos de Descuentos

**Descripción:**
Soportar 3 tipos de promociones con lógica de cálculo diferenciada.

**Reglas de Negocio:**
- **Porcentaje (%)**:
  - Valor entre 1-100
  - Cálculo: `precio_final = precio_original * (1 - valor/100)`
  - Ejemplo: 20% sobre $100 = $80
  - Aplicable a cualquier plan
- **Monto fijo ($)**:
  - Valor en USD (u otra currency)
  - Cálculo: `precio_final = max(0, precio_original - valor)`
  - Ejemplo: $50 de descuento sobre $100 = $50
  - Si descuento > precio, precio final = $0 (free month)
- **Días adicionales**:
  - Valor en días (1-365)
  - Cálculo: Extender `trial_end_date` del tenant
  - Ejemplo: +30 días de trial gratuito
  - Solo aplicable a planes Free o en trial period
  - No afecta precio, solo extiende trial
- Campo `first_payment_only`:
  - true: solo aplica en primer invoice
  - false: aplica en cada invoice del período configurado

**Prioridad:** Alta

---

### FR-092: Analytics de Promociones

**Descripción:**
Proveer métricas de efectividad de promociones para decisiones de marketing.

**Reglas de Negocio:**
- KPIs principales:
  - **Promociones Activas**: count(estado = Activa)
  - **Usos Totales**: sum(current_uses) de todas las promociones
  - **Ingresos Generados**: sum(discount_amount) de PromoUsage
- Métricas por promoción individual:
  - Usos en el tiempo (time series)
  - Conversión: users_applied / users_paid
  - Distribución por plan
  - Revenue impactado ($ descuentos)
  - Top users que usaron el código
- Analytics detallado gated por plan Professional+
- Exportar reporte individual (PDF/Excel)
- Dashboards visuales con charts (line, pie, bar)

**Prioridad:** Media

---

## Data Models

### Promotion (Nuevo modelo)

Modelo para códigos promocionales y descuentos.

```python
class Promotion(models.Model):
    """Códigos promocionales con descuentos"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Identificación
    code = models.CharField(max_length=20, unique=True, db_index=True)
    # Validación: ^[A-Z0-9]{3,20}$
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    # Tipo de descuento
    PROMO_TYPES = [
        ('percentage', 'Porcentaje (%)'),
        ('fixed_amount', 'Monto Fijo ($)'),
        ('extra_days', 'Días Adicionales de Trial'),
    ]
    promo_type = models.CharField(max_length=20, choices=PROMO_TYPES)

    # Valor del descuento (interpretación según promo_type)
    # percentage: 1-100 (%)
    # fixed_amount: USD (o currency)
    # extra_days: 1-365 (días)
    value = models.DecimalField(max_digits=10, decimal_places=2)

    # Configuración de uso
    max_uses = models.IntegerField(null=True, blank=True)
    # NULL = ilimitado
    current_uses = models.IntegerField(default=0)
    tentative_uses = models.IntegerField(default=0)
    # Reservas temporales (expiración 15min)

    # Vigencia
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    # Planes aplicables (JSONField para flexibilidad)
    applicable_plans = models.JSONField(default=list)
    # Ejemplo: ["starter", "professional"]

    # Configuración adicional
    first_payment_only = models.BooleanField(default=True)
    # true: solo aplica en primer invoice

    # Estados
    STATUS_CHOICES = [
        ('active', 'Activa'),
        ('paused', 'Pausada'),
        ('depleted', 'Agotada'),
        ('expired', 'Expirada'),
        ('scheduled', 'Programada'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')

    # Auditoría
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='promotions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'promotions'
        indexes = [
            models.Index(fields=['code', 'status']),
            models.Index(fields=['status', 'valid_from', 'valid_until']),
        ]
        ordering = ['-created_at']

    def is_valid(self):
        """Verifica si promoción es válida para aplicar"""
        now = timezone.now()
        return (
            self.status == 'active' and
            self.valid_from <= now <= self.valid_until and
            (self.max_uses is None or self.current_uses < self.max_uses)
        )

    def calculate_discount(self, original_price):
        """Calcula precio con descuento aplicado"""
        if self.promo_type == 'percentage':
            return original_price * (1 - self.value / 100)
        elif self.promo_type == 'fixed_amount':
            return max(0, original_price - self.value)
        elif self.promo_type == 'extra_days':
            return original_price  # No afecta precio, solo extiende trial
        return original_price
```

---

### PromoUsage (Nuevo modelo)

Registro de usos de códigos promocionales.

```python
class PromoUsage(models.Model):
    """Registro de aplicación de promociones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='usages')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='promo_usages')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # Contexto de uso
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True)
    subscription = models.ForeignKey('Subscription', on_delete=models.CASCADE)

    # Impacto financiero
    original_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)

    # Metadatos
    applied_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'promo_usages'
        indexes = [
            models.Index(fields=['promotion', 'applied_at']),
            models.Index(fields=['tenant', 'applied_at']),
        ]
        ordering = ['-applied_at']
```

---

## API Endpoints

### GET /api/v1/admin/promotions

Lista todas las promociones con filtros.

**Request:**
```http
GET /api/v1/admin/promotions?status=active&type=percentage&search=SUMMER
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `status` (optional): `active`, `paused`, `depleted`, `expired`, `scheduled`, `all`
- `type` (optional): `percentage`, `fixed_amount`, `extra_days`, `all`
- `search` (optional): Busca en code, name, description

**Response 200:**
```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "code": "SUMMER2026",
      "name": "Promoción de Verano 2026",
      "description": "Descuento especial para nuevos clientes en verano",
      "promo_type": "percentage",
      "value": 20.0,
      "max_uses": 100,
      "current_uses": 23,
      "usage_percentage": 23.0,
      "valid_from": "2026-06-01T00:00:00Z",
      "valid_until": "2026-08-31T23:59:59Z",
      "applicable_plans": ["starter", "professional"],
      "status": "active",
      "created_at": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/admin/promotions

Crea nueva promoción.

**Request:**
```http
POST /api/v1/admin/promotions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "STARTUP50",
  "name": "Descuento para Startups",
  "description": "$50 de descuento en el primer mes para startups verificadas",
  "promo_type": "fixed_amount",
  "value": 50.0,
  "max_uses": null,
  "valid_from": "2026-01-01T00:00:00Z",
  "valid_until": "2026-12-31T23:59:59Z",
  "applicable_plans": ["starter", "professional"],
  "first_payment_only": true
}
```

**Response 201 Created:**
```json
{
  "id": "uuid",
  "code": "STARTUP50",
  "status": "active",
  "message": "Promoción creada exitosamente",
  "share_url": "https://app.example.com/signup?promo=STARTUP50"
}
```

**Errores:**
- `400 Bad Request`: Validación fallida (código duplicado, fechas inválidas, valor negativo)
- `403 Forbidden`: Usuario sin permisos para crear promociones

---

### PATCH /api/v1/admin/promotions/{id}

Actualiza promoción existente.

**Request:**
```http
PATCH /api/v1/admin/promotions/{uuid}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "paused"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "code": "SUMMER2026",
  "status": "paused",
  "message": "Promoción pausada. El código ya no es aplicable en checkout."
}
```

---

### POST /api/v1/promotions/validate

Valida código promocional en checkout (endpoint público).

**Request:**
```http
POST /api/v1/promotions/validate
Content-Type: application/json

{
  "code": "SUMMER2026",
  "plan": "professional",
  "original_price": 100.0
}
```

**Response 200 (Válido):**
```json
{
  "valid": true,
  "code": "SUMMER2026",
  "promo_type": "percentage",
  "discount_value": 20.0,
  "original_price": 100.0,
  "final_price": 80.0,
  "discount_amount": 20.0,
  "message": "Código aplicado: 20% de descuento"
}
```

**Response 400 (Inválido):**
```json
{
  "valid": false,
  "error": "code_expired",
  "message": "El código SUMMER2026 ha expirado. Promoción válida hasta 2026-08-31."
}
```

**Errores posibles:**
- `code_not_found`: Código no existe
- `code_depleted`: Límite de usos alcanzado
- `code_expired`: Fuera de vigencia
- `code_paused`: Promoción pausada
- `plan_not_applicable`: Plan no incluido en planes aplicables

---

### GET /api/v1/admin/promotions/{id}/analytics

Obtiene analytics detallado de promoción individual (Professional+).

**Response 200:**
```json
{
  "promotion_id": "uuid",
  "code": "SUMMER2026",
  "summary": {
    "total_uses": 23,
    "conversion_rate": 78.3,
    "revenue_impacted": 460.0,
    "avg_discount": 20.0
  },
  "usage_over_time": [
    {"date": "2026-06-01", "uses": 5},
    {"date": "2026-06-02", "uses": 8}
  ],
  "by_plan": [
    {"plan": "starter", "uses": 10, "percentage": 43.5},
    {"plan": "professional", "uses": 13, "percentage": 56.5}
  ],
  "top_users": [
    {"tenant_name": "Acme Corp", "plan": "professional", "discount": 40.0}
  ]
}
```

---

## Tipos de Promociones

### Comparación de Tipos

| Característica | Porcentaje (%) | Monto Fijo ($) | Días Adicionales |
|----------------|----------------|----------------|------------------|
| **Valor** | 1-100 | > 0 USD | 1-365 días |
| **Aplica a precio** | ✅ Sí | ✅ Sí | ❌ No |
| **Extiende trial** | ❌ No | ❌ No | ✅ Sí |
| **Planes aplicables** | Todos | Todos | Free/Trial |
| **Ejemplo** | 20% OFF | $50 de descuento | +30 días gratis |

### Casos de Uso por Tipo

**Porcentaje (%):**
- Black Friday / Cyber Monday (50% OFF)
- Descuentos de referral (15% recurrente)
- Promociones estacionales (20% verano)

**Monto Fijo ($):**
- Créditos de bienvenida ($50 primer mes)
- Compensaciones por downtime ($100 crédito)
- Descuentos para startups verificadas ($25/mes)

**Días Adicionales:**
- Extender trials (de 14 a 30 días)
- Early bird pre-launch (+60 días free)
- Compensación por bugs (+7 días)

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [📊 Requirements: User Stories](../requirements/user-stories.md)
- [📊 Requirements: Functional Requirements](../requirements/functional-requirements.md)
- [🎯 Features: Billing & Subscriptions](billing.md)
- [🔧 Technical: Data Models](../technical/data-models.md)
- [🔧 Technical: API Endpoints](../technical/api-endpoints.md)

---

**Última actualización:** 2026-02-15
