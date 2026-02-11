# Arquitectura del Sistema - Documentación

Este directorio contiene la documentación de arquitectura del sistema de gestión de roles, permisos y suscripciones multi-tenant.

## 📁 Contenido

### Diagramas UML

#### `use-case-diagram.puml`
Diagrama de casos de uso completo del sistema con 57 casos de uso organizados en 8 módulos:
- Autenticación y Onboarding (8 CU)
- Gestión de Usuarios (7 CU)
- Roles y Permisos - RBAC (10 CU)
- Suscripciones y Facturación (11 CU)
- Multi-Tenancy (4 CU)
- Auditoría y Compliance (6 CU)
- Administración del Sistema (5 CU)
- Notificaciones (6 CU)

**Actores:** Guest, User, Member, Manager, OrgAdmin, SuperAdmin, Sistema

#### `use-cases-reference.md`
Documento de referencia completo con:
- Índice de todos los casos de uso con prioridades
- Descripción detallada de casos de uso críticos
- Jerarquía de actores y herencia de permisos
- Relaciones entre casos de uso (include/extend)
- Priorización por fases de desarrollo
- Instrucciones de visualización

#### `class-diagram.puml`
Diagrama de clases completo del modelo de datos con:
- 24 modelos (3 abstractos + 21 concretos)
- 16 modelos multi-tenant con RLS
- Modelos organizados por categoría:
  - Abstract Base Models (TimestampedModel, TenantAwareModel, AuditedModel)
  - Core Models (Tenant, User, TenantMembership)
  - RBAC Models (Role, Permission, PermissionGrant, PermissionGroup, PermissionDelegation)
  - Audit Models (AuditLog)
  - Auth Models (RefreshToken, MFARecoveryCode, Session)
  - Billing Models (SubscriptionPlan, Invoice, PaymentMethod, UsageTracking)
  - Notification Models (Notification, EmailLog)
  - Feature Flags (FeatureFlag, TenantFeatureOverride)
- 6 enumeraciones (SubscriptionStatus, PlanType, PermissionScope, etc.)
- Relaciones completas: herencia, composición, agregación, asociación

**Tecnología:** PostgreSQL con Row-Level Security (RLS)

#### `data-model-reference.md`
Documentación exhaustiva del modelo de datos con:
- Descripción detallada de cada modelo con campos y tipos
- Métodos principales de cada clase
- Validaciones y constraints
- Índices y optimizaciones de queries
- Ejemplos de uso y código
- Strategy de migrations
- Seed data para permisos y roles del sistema

#### `auth-sequence-diagram.puml`
Diagramas de secuencia de autenticación con 5 flujos:
- Login básico con JWT (access + refresh tokens)
- Request protegido con validación de permisos
- Refresh token con token rotation
- Login con MFA (TOTP - Google Authenticator)
- Logout con revocación de tokens

**Security features:** Rate limiting, account lockout, bcrypt, token rotation, MFA, audit logging

#### `billing-sequence-diagram.puml`
Diagramas de secuencia de billing con 5 flujos:
- Upgrade de plan con proration (cálculo proporcional)
- Renovación automática de suscripciones (cronjob diario)
- Reintento de pago fallido (3 intentos, suspensión)
- Webhook de Stripe (signature verification)
- Cancelación de suscripción (activo hasta fin de período)

**Integrations:** Stripe API, Celery tasks, email templates, PDF generation

#### `sequence-diagrams-reference.md`
Documentación completa de diagramas de secuencia con:
- Descripción detallada de cada flujo (10 flujos totales)
- Endpoints con ejemplos de request/response
- Casos de error y manejo
- Patrones de diseño (token rotation, proration, retry backoff, idempotency)
- Security considerations
- Performance optimizations
- Código de ejemplo Python/TypeScript

#### `components-diagram.puml`
Diagrama de componentes con arquitectura completa del sistema:
- **6 capas principales:**
  - Frontend Layer (Angular + Tailwind)
  - API Layer (Django REST Framework)
  - Data Layer (PostgreSQL + PgBouncer)
  - Cache Layer (Redis)
  - Background Jobs (Celery + Beat)
  - External Services (Stripe, Email, S3, Monitoring)
- **40+ componentes** organizados por responsabilidad
- **Middleware pipeline:** JWT → Tenant → Permission → Rate Limit
- **Interfaces y protocolos:** HTTPS, WebSocket, PostgreSQL, Redis, SMTP
- **Security layer:** WAF, DDoS protection, SSL/TLS
- **Data flow examples** (login, billing renewal)

**Integraciones:** Stripe API, SendGrid/SES, AWS S3, Sentry/DataDog

#### `entity-relationship-diagram.puml`
Diagrama ER (Entidad-Relación) completo del modelo de base de datos:
- **25+ entidades** organizadas por categoría:
  - Core Multi-Tenancy (Tenant, User, TenantMembership)
  - RBAC System (Role, Permission, PermissionGrant, PermissionGroup, DelegatedPermission, MembershipRole)
  - Subscription & Billing (Plan, Subscription, PaymentMethod, Invoice, UsageTracking)
  - Authentication & Sessions (RefreshToken, Session, Invitation, MFARecoveryCode, EmailVerificationToken, PasswordResetToken)
  - Audit & Logging (AuditLog, LoginAttempt)
- **Todas las relaciones** con cardinalidad (1:1, 1:N, N:M)
- **Claves primarias** (UUID y BIGSERIAL)
- **Claves foráneas** y constraints de unicidad
- **Notas explicativas** para cada grupo de entidades
- **Color-coding** por tipo de entidad (Multi-tenancy, User, RBAC, Subscription, Audit)
- **Auditoría integrada** (created_by, updated_by en modelos clave)

**Tecnología:** PostgreSQL con Row-Level Security (RLS), UUID primary keys, JSONB para datos dinámicos

### Documentos de Diseño

#### `system-overview.md`
Visión general de alto nivel del sistema (pre-existente)

## 🎨 Visualización de Diagramas PlantUML

### Opción 1: VS Code (Recomendado)

1. Instalar extensión **PlantUML** de jebbs
2. Instalar Java Runtime (prerequisito)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install default-jre

   # macOS
   brew install java
   ```
3. Abrir archivo `.puml` en VS Code
4. Presionar `Alt+D` para preview en vivo
5. Click derecho → "Export Current Diagram" para guardar como imagen

### Opción 2: Generación Automática con Script

Usamos el script `scripts/generate-diagrams.sh` para generar PNG y SVG:

```bash
# Desde raíz del proyecto
./scripts/generate-diagrams.sh
```

El script:
- Busca todos los archivos `.puml` en `docs/architecture/`
- Genera `.png` (raster, para presentaciones)
- Genera `.svg` (vector, para documentación web)
- Muestra progreso con checkmarks ✓

**Prerequisitos:**
```bash
# Ubuntu/Debian
sudo apt-get install plantuml default-jre

# macOS
brew install plantuml
```

### Opción 3: Online (Sin instalación)

1. Visitar https://www.plantuml.com/plantuml/uml/
2. Copiar contenido del archivo `.puml`
3. Pegar en el editor online
4. Visualizar y descargar imagen

### Opción 4: CLI Manual

```bash
# Generar PNG
plantuml docs/architecture/use-case-diagram.puml

# Generar SVG (mejor calidad)
plantuml -tsvg docs/architecture/use-case-diagram.puml

# Generar con output específico
plantuml -o output_dir docs/architecture/use-case-diagram.puml
```

## 📊 Diagramas Disponibles

| Diagrama | Archivo | Descripción | Estado |
|----------|---------|-------------|--------|
| Casos de Uso | `use-case-diagram.puml` | 57 casos de uso, 7 actores, relaciones include/extend | ✅ Completo |
| Clases de Datos | `class-diagram.puml` | 24 modelos, 6 enums, relaciones completas, PostgreSQL + RLS | ✅ Completo |
| **Entidad-Relación (ER)** | `entity-relationship-diagram.puml` | 25+ entidades, todas las relaciones con cardinalidad, color-coded | ✅ Completo |
| Secuencia Auth | `auth-sequence-diagram.puml` | 5 flujos (login, request, refresh, MFA, logout), JWT + bcrypt | ✅ Completo |
| Secuencia Billing | `billing-sequence-diagram.puml` | 5 flujos (upgrade, renewal, retry, webhook, cancel), Stripe | ✅ Completo |
| Componentes | `components-diagram.puml` | 6 capas, 40+ componentes, integraciones completas | ✅ Completo |
| Deployment AWS | `deployment-diagram.puml` | _Pendiente_ | ⏳ Planificado |

## 🔗 Referencias Cruzadas

### Relacionado con PRD
- **PRD Completo:** `/prd/rbac-subscription-system.md`
- El diagrama de casos de uso implementa las user stories de la sección 3 del PRD
- Los functional requirements (sección 4) mapean a casos de uso específicos

### Relacionado con Implementación
- **Modelos Django:** Los casos de uso de RBAC se implementan en `src/rbac/models.py`
- **Servicios Angular:** Frontend implementado en `src/app/features/`
- **Tests:** Cada caso de uso debe tener tests en `tests/`

## 📝 Convenciones de Nomenclatura

### Casos de Uso
- **ID:** UC-XXX (3 dígitos, ej: UC-001, UC-042)
- **Nombre:** Verbo + Sustantivo (ej: "Registrar Nueva Organización")
- **Prioridad:** Alta / Media / Baja

### Actores
- **CamelCase** para actores compuestos (OrgAdmin, SuperAdmin)
- **Singular** (User, no Users)
- **Herencia explícita** en diagrama con flechas

### Relaciones
- **<<include>>:** Flujo obligatorio (siempre se ejecuta)
- **<<extend>>:** Flujo opcional (solo en ciertas condiciones)
- **Herencia actores:** Línea continua con flecha cerrada

## 🛠️ Mantenimiento de Diagramas

### Cuándo Actualizar

Actualizar diagramas cuando:
- ✅ Se agregan nuevos casos de uso
- ✅ Se modifican flujos principales de casos existentes
- ✅ Se agregan nuevos actores o roles
- ✅ Se cambian relaciones entre casos de uso

NO actualizar para:
- ❌ Cambios menores de UI
- ❌ Refactoring interno sin cambio funcional
- ❌ Bug fixes que no alteran comportamiento

### Proceso de Actualización

1. Editar archivo `.puml` con cambios
2. Ejecutar `./scripts/generate-diagrams.sh` para regenerar imágenes
3. Actualizar `use-cases-reference.md` si hay nuevos casos de uso
4. Commit cambios con mensaje: `docs: update use case diagram - [descripción]`
5. Mencionar cambios en PR review

### Versionamiento

Los diagramas se versionan junto con el código:
- **Cambios mayores:** Nueva versión del diagrama (ej: `use-case-diagram-v2.puml`)
- **Cambios menores:** Actualización in-place del archivo existente
- **Histórico:** Usar Git history (`git log docs/architecture/`)

## 🎯 Roadmap de Diagramas

### Corto Plazo (Sprint 1-2)
- [x] Diagrama de casos de uso
- [x] Diagrama de clases (modelos Django)
- [x] Diagrama ER (Entidad-Relación)
- [x] Diagrama de secuencia: flujo autenticación JWT

### Mediano Plazo (Sprint 3-4)
- [ ] Diagrama de componentes (arquitectura general)
- [ ] Diagrama de secuencia: flujo upgrade/billing
- [ ] Diagrama de despliegue (AWS infrastructure)

### Largo Plazo (Post-MVP)
- [ ] Diagrama de actividad: onboarding wizard
- [ ] Diagrama de estados: suscripción lifecycle
- [ ] Diagramas de red: multi-AZ deployment

## 📚 Recursos Adicionales

### PlantUML
- **Documentación oficial:** https://plantuml.com/
- **Sintaxis Use Case:** https://plantuml.com/use-case-diagram
- **Sintaxis Class:** https://plantuml.com/class-diagram
- **Sintaxis Sequence:** https://plantuml.com/sequence-diagram
- **Cheatsheet:** https://ogom.github.io/draw_uml/plantuml/

### Herramientas Recomendadas
- **VS Code Extension:** PlantUML (jebbs.plantuml)
- **IntelliJ Plugin:** PlantUML integration
- **CLI Tool:** `plantuml` package
- **Online Editor:** https://www.plantuml.com/plantuml/

### Mejores Prácticas UML
- **Use Case Diagrams:** https://www.uml-diagrams.org/use-case-diagrams.html
- **Clean Architecture:** https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **C4 Model:** https://c4model.com/ (alternativa moderna a UML)

## 🤝 Contribución

Para agregar nuevos diagramas:
1. Crear archivo `.puml` en `docs/architecture/`
2. Seguir convenciones de nomenclatura del proyecto
3. Agregar entrada en tabla "Diagramas Disponibles" arriba
4. Ejecutar script de generación
5. Commit archivos `.puml`, `.png`, y `.svg`
6. Actualizar este README con descripción

## ❓ FAQ

**P: ¿Por qué usar PlantUML en lugar de herramientas visuales como Lucidchart?**
R: PlantUML es text-based, versionable en Git, revisable en PRs, y permite automatización. Ideal para docs-as-code.

**P: ¿Los diagramas PNG/SVG deben commitearse?**
R: Sí, para facilitar visualización en GitHub y documentación. Regenerar con script en cada cambio.

**P: ¿Cómo manejo diagramas grandes que no caben en pantalla?**
R: Usa SVG y haz zoom en navegador, o divide en múltiples diagramas por módulo.

**P: ¿Qué hacer si PlantUML falla al generar?**
R: Verifica sintaxis en https://www.plantuml.com/plantuml/. Errores comunes: paréntesis sin cerrar, nombres duplicados.

---

**Última actualización:** 2026-02-09
**Mantenido por:** Tech Lead + Product Manager
