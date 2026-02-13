# Reporte: Nuevos Requerimientos - Digital Services

**Fecha:** 2026-02-12
**Versión PRD:** 2.0.0
**Autor:** Product Team
**Estado:** Implementado en PRD

---

## 📋 Resumen Ejecutivo

Se ha agregado un nuevo módulo completo de **Digital Services** al PRD del sistema RBAC multi-tenant. Este módulo permite a los usuarios crear y publicar páginas públicas profesionales optimizadas para SEO, gestionadas desde el panel de cliente pero renderizadas en un frontend separado con Server-Side Rendering (SSR).

### Servicios Digitales Incluidos

1. **Tarjeta Digital** (`/tarjeta/{username}`) - Tarjeta de presentación digital con QR code
2. **Landing Page** (`/landing/{username}`) - Página de perfil público personalizable
3. **Portafolio Digital** (`/portafolio/{username}`) - Showcase de proyectos y trabajos
4. **CV Digital** (`/cv/{username}`) - Currículum vitae con exportación a PDF

### Impacto en el Proyecto

- **Timeline:** +10 semanas (de 64 a 74 semanas totales)
- **Nuevos Casos de Uso:** 5 (CU-009 a CU-013)
- **Nuevas User Stories:** 19 (US-042 a US-060)
- **Nuevos Functional Requirements:** 20 (FR-063 a FR-082)
- **Nuevos Modelos de Datos:** 7 modelos Django
- **Nuevos Endpoints API:** 25+ endpoints
- **Archivos Modificados:** 9 archivos del PRD

---

## 🎯 Casos de Uso Agregados

### CU-009: Crear Tarjeta Digital desde Panel Cliente

**Actor:** Usuario final (Free+)

**Flujo:**
1. Login en panel cliente → "Servicios Digitales" → "Tarjeta Digital"
2. Formulario: nombre, título, foto, bio, email, teléfono, redes sociales, colores
3. Preview en tiempo real
4. Publicar tarjeta
5. URL pública generada: `https://domain.com/tarjeta/{username}`
6. Compartir vía QR code o enlace directo

**Tiempo objetivo:** <5 minutos

---

### CU-010: Personalizar Landing Page Pública

**Actor:** Usuario Professional+ (Starter templates limitados)

**Flujo:**
1. Selector de templates (Free: 1, Starter: 3, Professional: todos + custom CSS)
2. Editor de secciones: Hero, About, Services, Portfolio, Contact
3. Drag & drop para reordenar
4. Configuración SEO: meta title, description, OG image
5. Vista previa responsive
6. Publicar landing

**Tiempo objetivo:** <15 minutos

---

### CU-011: Gestionar Portafolio de Proyectos

**Actor:** Usuario Professional+

**Flujo:**
1. Dashboard de proyectos → "+ Agregar Proyecto"
2. Formulario: título, descripción, imágenes (cover + galería max 10), tags, enlaces
3. Marcar hasta 3 proyectos como "Destacados"
4. Publicar proyecto
5. URL pública: `https://domain.com/portafolio/{username}`

**Tiempo objetivo:** <10 minutos por proyecto

---

### CU-012: Generar CV Digital desde Perfil

**Actor:** Usuario (Free+, limitaciones por plan)

**Flujo:**
1. Auto-población de secciones desde perfil de usuario
2. Editar: Resumen profesional, Experiencia, Educación, Habilidades, Idiomas, Certificaciones
3. Selector de template: Classic, Modern, Minimal
4. Export PDF (Professional+)
5. Publicar CV

**Tiempo objetivo:** <10 minutos con auto-población

---

### CU-013: Configurar Dominio Personalizado (Enterprise)

**Actor:** Admin Enterprise

**Flujo:**
1. Ingresar dominio deseado (ej: `juansmith.com`)
2. Sistema genera instrucciones DNS (CNAME → `proxy.platform.com`)
3. Usuario configura DNS en proveedor
4. Verificación automática DNS (retry cada 30 min, max 24h)
5. Provisión SSL automática (Let's Encrypt)
6. Configurar redirecciones (dominio → servicio específico)

**Tiempo objetivo:** <5 min configuración, <24h propagación DNS

---

## 📝 User Stories Agregadas

### Tarjeta Digital (US-042 a US-046)

**US-042: Crear y Editar Tarjeta Digital**
- Formulario completo con preview en tiempo real
- Username único global validado
- URL pública sin autenticación

**US-043: Compartir Tarjeta vía QR Code**
- Generación de QR code (300x300, 600x600, 1200x1200)
- QR descargable como PNG
- Opción copiar link al portapapeles

**US-044: Exportar vCard para Contactos (Starter+)**
- Exportar archivo .vcf
- Compatible iOS Contacts y Google Contacts
- Feature gate valida plan

**US-045: Personalizar Colores y Foto**
- Color picker: primario y fondo
- Upload foto con crop (max 5MB)
- Compresión automática >500KB
- Integración Gravatar opcional

**US-046: Ver Analytics de Vistas (Starter+)**
- Total views, unique visitors
- Gráfico tendencia últimos 7/30 días
- Clicks en enlaces sociales

---

### Landing Page (US-047 a US-051)

**US-047: Seleccionar Template**
- Free: 1 template (Basic)
- Starter: 3 templates (Minimal, Corporate, Creative)
- Professional: Todos + custom CSS

**US-048: Editar Secciones**
- Drag & drop para reordenar
- Secciones: Hero, About, Services, Portfolio, Contact
- Rich text editor (markdown)
- Preview responsive

**US-049: Formulario de Contacto**
- Validación client/server-side
- Anti-spam con reCAPTCHA (Professional+)
- Rate limiting: max 20 msg/hora por IP

**US-050: Configurar Meta Tags SEO (Professional+)**
- Meta title (60 chars), description (160 chars)
- Upload OG image (1200x630)
- Preview Google/Facebook/Twitter

**US-051: Integrar Google Analytics (Professional+)**
- GA4 o Universal Analytics
- Script async en `<head>`
- Banner cookies GDPR

---

### Portafolio (US-052 a US-055)

**US-052: Agregar Proyectos con Imágenes**
- Cover image + galería (max 10 imágenes)
- Upload drag & drop, compresión automática
- Links: demo, repo, case study

**US-053: Organizar por Categoría/Tags**
- Tags predefinidos + personalizados (max 20)
- Filtrado client-side por tag
- URL query param: `?tag=web-development`

**US-054: Configurar Proyecto Destacado**
- Max 3 proyectos destacados
- Badge "Destacado"
- Drag & drop para reordenar

**US-055: Compartir Link a Proyecto**
- URL individual: `/portafolio/{username}/{slug}`
- Meta tags específicos del proyecto
- Botón compartir copia URL

---

### CV Digital (US-056 a US-058)

**US-056: Generar CV desde Perfil**
- Auto-población desde user profile
- Secciones: Experiencia, Educación, Habilidades, Idiomas, Certificaciones
- Validación fechas

**US-057: Personalizar Secciones**
- Toggle mostrar/ocultar secciones
- Drag & drop para reordenar
- Múltiples versiones guardables

**US-058: Exportar CV a PDF (Professional+)**
- PDF alta calidad, tamaño A4
- Compatible ATS (Applicant Tracking Systems)
- Nombre: `CV_{Nombre}_{Apellido}_{Fecha}.pdf`

---

### Cross-Service (US-059 a US-060)

**US-059: Configurar SEO Global (Professional+)**
- Meta tags default para todos los servicios
- `sitemap.xml` dinámico
- `robots.txt` configurable
- Structured data (JSON-LD)

**US-060: Conectar Dominio Personalizado (Enterprise)**
- CNAME validation automática
- SSL automático (Let's Encrypt)
- Redirecciones configurables
- Soporte subdominios

---

## ⚙️ Functional Requirements Agregados

### SSR Architecture (FR-063 a FR-066)

**FR-063: Server-Side Rendering con Angular Universal**
- Express server con `@nguniversal/express-engine`
- HTML completo generado server-side
- TransferState para evitar duplicate API calls

**FR-064: HTML Estático para SEO**
- Contenido visible sin JavaScript
- Meta tags en `<head>` renderizados en servidor
- No-JS fallback para navegación

**FR-065: Caching de Páginas (Redis)**
- TTL: 5 minutos
- Cache key: `ssr:{service}:{username}:{version}`
- Hit rate objetivo: >80%
- Fallback graceful si Redis down

**FR-066: Invalidación de Cache**
- Post-save hooks invalidan cache inmediatamente
- Patrón: `DELETE ssr:{service}:{username}:*`
- CDN purge si aplica
- Cambios visibles <1 minuto

---

### URL Routing (FR-067 a FR-068)

**FR-067: Patrón URLs Públicas**
- Formato: `/{servicio}/{username}`
- URLs limpias, memorables, SEO-friendly
- Manejo trailing slash

**FR-068: Username Único Global**
- Constraint UNIQUE a nivel DB
- Regex: `^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$` (2-50 chars)
- Reservar: `admin`, `api`, `www`, `app`, `dashboard`, `login`, `register`
- Sugerencias si tomado

---

### Template System (FR-069 a FR-072)

**FR-069: Templates Component-Based**
- Template como JSON: `{ sections: [{ type, props }] }`
- Componentes standalone con `@Input()`
- Lazy loading

**FR-070: Templates Responsive**
- Mobile-first design
- Breakpoints: <640px (mobile), 640-1024px (tablet), >=1024px (desktop)
- Touch targets >=44x44px

**FR-071: Custom CSS (Professional+)**
- CSS en sandbox con scope
- Validación: prevenir `<script>`, JS injection
- Editor con syntax highlighting

**FR-072: Custom Templates (Enterprise)**
- Templates custom vía código HTML/CSS/TS
- Revisión por equipo técnico
- Deploy como componente standalone

---

### SEO & Metadata (FR-073 a FR-076)

**FR-073: Meta Tags Automáticos**
- Tags: title, description, OG, Twitter Cards
- Override manual (Professional+)
- Auto-generación OG image

**FR-074: Sitemap.xml Dinámico**
- Endpoint: `GET /sitemap.xml`
- Solo perfiles `is_public=True`
- Prioridad: 0.8 (landing/tarjeta), 0.6 (portfolio/CV)
- Cache: 24h

**FR-075: Structured Data (JSON-LD)**
- Schema.org types: Person, CreativeWork, Organization
- JSON-LD en `<head>`
- Validación: Google Rich Results Test

**FR-076: Robots.txt Configurable**
- Default permite indexación servicios públicos
- Bloquea: `/api/`, `/admin/`
- Referencia sitemap

---

### Public API (FR-077 a FR-078)

**FR-077: Endpoints Públicos Sin Auth**
- No requieren JWT
- Rate limiting: 100 req/min por IP
- CORS allow all origins
- Response: HTML (SSR)

**FR-078: Endpoints Admin con Ownership**
- Validación: `profile.user == request.user`
- Raise `PermissionDenied` si no match
- Audit log registra modificaciones

---

### Analytics (FR-079 a FR-080)

**FR-079: Tracking de Vistas**
- Métricas: page views, unique visitors, clicks
- Owner no cuenta en views
- Modelo `ServiceAnalytics` con agregación diaria

**FR-080: Analytics por Plan**
- Free: Sin analytics
- Starter: Básicas (7 días)
- Professional: Avanzadas (30 días, gráficos)
- Enterprise: Completas (ilimitado, export CSV)

---

### Custom Domains (FR-081 a FR-082)

**FR-081: Custom Domains con CNAME (Enterprise)**
- CNAME → `proxy.platform.com`
- Validación DNS retry cada 30 min (max 48h)
- Tabla `CustomDomain` con verification_status
- Solo 1 dominio por usuario

**FR-082: Provisión SSL Automática**
- Let's Encrypt con HTTP-01 o DNS-01 challenge
- Renovación automática 30 días antes expiración
- Alertas si falla renovación
- SSL status: `pending` → `active` → `renewing`

---

## 🗄️ Modelos de Datos Agregados

### 1. PublicProfile

```python
class PublicProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    username = models.SlugField(unique=True, max_length=50, db_index=True)
    display_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_public = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    og_image = models.ImageField(upload_to='og-images/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Índices:**
- `username` (unique)
- `is_public`, `created_at` (composite)

---

### 2. DigitalCard

```python
class DigitalCard(models.Model):
    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE)

    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)

    # Social Links
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Theme
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    background_color = models.CharField(max_length=7, default='#FFFFFF')

    # QR Code
    qr_code = models.ImageField(upload_to='qr-codes/', blank=True, null=True)

    # Stats
    total_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
```

---

### 3. LandingTemplate

```python
class LandingTemplate(models.Model):
    TEMPLATE_CHOICES = [
        ('basic', 'Basic'),
        ('minimal', 'Minimal'),
        ('corporate', 'Corporate'),
        ('creative', 'Creative'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE)
    template_type = models.CharField(max_length=20, choices=TEMPLATE_CHOICES)

    # Sections (JSON)
    sections = models.JSONField(default=list)
    # [{ type: 'hero', visible: true, props: {...} }, ...]

    # Contact Form
    contact_email = models.EmailField(blank=True)
    enable_contact_form = models.BooleanField(default=False)

    # Custom CSS (Professional+)
    custom_css = models.TextField(blank=True)

    # Google Analytics (Professional+)
    ga_tracking_id = models.CharField(max_length=20, blank=True)
```

---

### 4. PortfolioItem

```python
class PortfolioItem(models.Model):
    profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE)

    title = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description_short = models.CharField(max_length=200)
    description_full = models.TextField()  # Markdown

    # Images
    cover_image = models.ImageField(upload_to='portfolio/covers/')
    gallery_images = models.JSONField(default=list)

    # Links
    demo_url = models.URLField(blank=True)
    repo_url = models.URLField(blank=True)
    case_study_url = models.URLField(blank=True)

    # Organization
    tags = models.JSONField(default=list)
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    project_date = models.DateField()
```

**Índices:**
- `profile`, `is_featured` (composite)
- `slug` (unique per profile)

**Ordering:** `-is_featured`, `-project_date`

---

### 5. CVDocument

```python
class CVDocument(models.Model):
    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE)

    professional_summary = models.TextField(max_length=500, blank=True)

    # JSON fields for flexibility
    experience = models.JSONField(default=list)
    # [{ company, position, start_date, end_date, responsibilities }, ...]

    education = models.JSONField(default=list)
    # [{ institution, degree, field, start_date, end_date }, ...]

    skills = models.JSONField(default=list)  # ['Python', 'Django', ...]

    languages = models.JSONField(default=list)
    # [{ language: 'English', level: 'fluent' }, ...]

    certifications = models.JSONField(default=list)
    # [{ title, issuer, date, credential_url }, ...]

    # Config
    template_type = models.CharField(max_length=20, default='classic')
    show_photo = models.BooleanField(default=True)
    show_contact = models.BooleanField(default=True)
```

---

### 6. CustomDomain (Enterprise)

```python
class CustomDomain(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
    ]

    SSL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('renewing', 'Renewing'),
        ('failed', 'Failed'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE)
    domain = models.CharField(max_length=255, unique=True)

    # DNS Verification
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES)
    verification_token = models.CharField(max_length=64, unique=True)
    last_verification_attempt = models.DateTimeField(null=True, blank=True)

    # SSL
    ssl_status = models.CharField(max_length=20, choices=SSL_STATUS_CHOICES)
    ssl_cert_expires_at = models.DateTimeField(null=True, blank=True)

    # Redirect
    default_service = models.CharField(max_length=20, default='landing')
```

**Índices:**
- `domain` (unique)
- `verification_status`

---

### 7. ServiceAnalytics

```python
class ServiceAnalytics(models.Model):
    SERVICE_CHOICES = [
        ('tarjeta', 'Tarjeta Digital'),
        ('landing', 'Landing Page'),
        ('portafolio', 'Portafolio'),
        ('cv', 'CV Digital'),
    ]

    profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE)
    service = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    date = models.DateField()

    # Metrics
    page_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)

    # Click tracking (JSON)
    clicks = models.JSONField(default=dict)
    # { 'linkedin': 10, 'github': 5, 'demo_project_1': 3 }
```

**Índices:**
- `profile`, `service`, `date` (unique together)
- `date`

---

## 🔌 API Endpoints Agregados

### Public Endpoints (No Auth)

**GET /{service}/{username}**
- Render SSR public page
- Services: `tarjeta`, `landing`, `portafolio`, `cv`
- Response: HTML
- Cache: Redis 5min + CDN 1h

**GET /sitemap.xml**
- Dynamic sitemap all public profiles
- Cache: 24h

**GET /robots.txt**
- Configurable robots.txt

---

### Admin Endpoints - Public Profile

**POST /api/v1/app/digital-services/profile**
- Create/update public profile
- Auth: JWT required
- Body: `PublicProfileSerializer`

**GET /api/v1/app/digital-services/profile**
- Get authenticated user's profile
- Auth: JWT required

---

### Admin Endpoints - Digital Card

**POST /api/v1/app/digital-services/tarjeta**
- Create/update digital card
- Auth: JWT required

**GET /api/v1/app/digital-services/tarjeta**
- Get user's digital card

**POST /api/v1/app/digital-services/tarjeta/generate-qr**
- Generate QR code
- Body: `{ size: 600, include_logo: true }`

**GET /api/v1/app/digital-services/tarjeta/export-vcard**
- Export vCard (Starter+)
- Response: `text/vcard`

---

### Admin Endpoints - Landing Page

**POST /api/v1/app/digital-services/landing**
- Create/update landing
- Body: template_type, sections, contact config

**GET /api/v1/app/digital-services/landing**
- Get user's landing

---

### Admin Endpoints - Portfolio

**GET /api/v1/app/digital-services/portafolio**
- List all portfolio items

**POST /api/v1/app/digital-services/portafolio**
- Create portfolio item (Professional+)

**PATCH /api/v1/app/digital-services/portafolio/{id}**
- Update portfolio item (owner only)

**DELETE /api/v1/app/digital-services/portafolio/{id}**
- Delete portfolio item (owner only)

---

### Admin Endpoints - CV Digital

**POST /api/v1/app/digital-services/cv**
- Create/update CV

**GET /api/v1/app/digital-services/cv**
- Get user's CV

**POST /api/v1/app/digital-services/cv/export-pdf**
- Export PDF (Professional+)
- Response: PDF download

---

### Admin Endpoints - Analytics

**GET /api/v1/app/digital-services/analytics/{service}**
- Get analytics for service (Starter+)
- Query: `?days=7|30|90`
- Response: views, visitors, clicks by day

---

### Admin Endpoints - Custom Domain

**POST /api/v1/app/digital-services/custom-domain**
- Configure custom domain (Enterprise)
- Body: `{ domain, default_service }`

**POST /api/v1/app/digital-services/custom-domain/verify**
- Verify DNS configuration

**GET /api/v1/app/digital-services/custom-domain**
- Get custom domain status

---

## 📊 Features por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Tarjeta Digital** | ✅ Básica | ✅ + QR + vCard | ✅ + Custom CSS | ✅ + White-label |
| **Landing Page** | ❌ | ✅ (3 templates) | ✅ (Todos + CSS) | ✅ + Custom domain |
| **Portafolio** | ❌ | ❌ | ✅ Ilimitado | ✅ + Custom templates |
| **CV Digital** | ✅ Básico | ✅ + PDF export | ✅ + Múltiples versiones | ✅ + ATS optimization |
| **Templates** | 1 (Basic) | 3 por servicio | Todos + Custom CSS | Custom templates |
| **Views/mes** | 100 | 1,000 | 10,000 | Ilimitado |
| **Analytics** | ❌ | ✅ Básicas (7d) | ✅ Avanzadas (30d) | ✅ Completas (∞) |
| **Custom Domain** | ❌ | ❌ | ❌ | ✅ (1 dominio) |
| **SSL Automático** | ✅ | ✅ | ✅ | ✅ |
| **SEO Control** | Auto | Auto | ✅ Manual | ✅ Manual + SD |
| **Google Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Remove Branding** | ❌ | ❌ | ❌ | ✅ |

---

## 🏗️ Arquitectura SSR

### Stack Tecnológico

**Frontend SSR (Public Pages):**
- Angular 17+ con standalone components
- Angular Universal (`@nguniversal/express-engine`)
- Tailwind CSS 3+
- Express.js servidor Node

**Backend:**
- Django REST Framework (existing)
- PostgreSQL
- Redis (caching SSR)
- Celery (PDF generation, emails)

**Infraestructura:**
- Nginx reverse proxy
- Let's Encrypt SSL
- Cloudflare CDN (opcional)

---

### Flujo SSR

```
Browser → Nginx → Express Server (SSR) → Redis Cache?
                      ↓ (miss)
                  Django API → PostgreSQL
                      ↓
              Angular Universal Render
                      ↓
              Cache in Redis (5min)
                      ↓
              Return HTML → Browser
```

---

### Performance Targets

- **Cache hit ratio:** >80%
- **TTFB (cached):** <200ms
- **TTFB (uncached):** <1s
- **LCP:** <2.5s
- **FCP:** <1.8s

---

## 📅 Timeline Actualizado

### Fase 5: Digital Services (10 semanas)

**Sprint 33-34: SSR Infrastructure (4 weeks)**
- Backend: Modelos, serializers, API endpoints
- Frontend SSR: Angular Universal + Express + Redis
- DevOps: Deploy SSR service, Nginx proxy

**Sprint 35-36: Tarjeta Digital + Landing (3 weeks)**
- Tarjeta: Editor, QR, vCard, analytics, 3 templates
- Landing: Selector templates, editor secciones, SEO

**Sprint 37-38: Portafolio + CV (3 weeks)**
- Portafolio: CRUD proyectos, galería, filtros, featured
- CV: Auto-población, templates, export PDF

**Sprint 39-40: Analytics + Custom Domains (2 weeks)**
- Analytics: Tracking, dashboard, export CSV
- Custom Domains: DNS verification, SSL automático
- SEO: sitemap.xml, robots.txt, structured data

---

### Milestones

| Milestone | Week | Deliverable |
|-----------|------|-------------|
| **Alpha Release** | Week 12 | MVP completo |
| **Beta Release** | Week 20 | Advanced RBAC |
| **Public Launch** | Week 28 | Enterprise features |
| **v2.0** | Week 40 | Sharing & Projects |
| **v2.5** ⭐ | **Week 50** | **Digital Services (SSR)** |

**Timeline Total:** ~74 semanas (~17 meses)

---

## 📁 Archivos Modificados

### 1. Archivo Nuevo

- ✅ **`/prd/features/digital-services.md`** (~800 líneas)
  - Documentación completa del feature
  - Casos de uso, user stories, FRs
  - Arquitectura SSR, modelos, API, timeline

---

### 2. Requirements

- ✅ **`/prd/requirements/use-cases.md`**
  - +5 casos de uso (CU-009 a CU-013)
  - +150 líneas

- ✅ **`/prd/requirements/user-stories.md`**
  - +19 user stories (US-042 a US-060)
  - Nueva sección 3.8
  - +400 líneas

- ✅ **`/prd/requirements/functional-requirements.md`**
  - +20 FRs (FR-063 a FR-082)
  - Nueva sección 4.8
  - +350 líneas

---

### 3. Technical Documentation

- ✅ **`/prd/technical/architecture.md`**
  - Nueva sección "SSR Architecture"
  - Express server, caching, performance
  - +250 líneas

- ✅ **`/prd/technical/data-models.md`**
  - +7 modelos Django
  - +300 líneas

- ✅ **`/prd/technical/api-endpoints.md`**
  - +25 endpoints (public + admin)
  - +200 líneas

- ✅ **`/prd/technical/implementation-timeline.md`**
  - Nueva Fase 5 (4 sprints, 10 semanas)
  - Timeline 64 → 74 semanas
  - Milestone v2.5 agregado
  - +150 líneas

---

### 4. README Principal

- ✅ **`/prd/README.md`**
  - Digital Services agregado a features
  - Fase 4 y Fase 5 agregadas a roadmap
  - Fecha actualizada
  - +30 líneas

---

## 🎯 Próximos Pasos

### Para Product Team
1. Revisar y aprobar nuevos requerimientos
2. Validar feature gates por plan
3. Confirmar priorización (Fase 5)

### Para Desarrollo
1. Revisar arquitectura SSR propuesta
2. Estimar esfuerzo por sprint
3. Identificar dependencias técnicas
4. Planificar setup Angular Universal

### Para Diseño
1. Crear mockups de templates (Tarjeta, Landing, Portfolio, CV)
2. Definir componentes reutilizables
3. Diseñar editor drag & drop
4. Prototipar preview responsive

### Para QA
1. Definir test cases para SSR
2. Planificar tests SEO (meta tags, sitemap)
3. Estrategia testing PDF generation
4. Validación custom domains

---

## 📈 Métricas de Éxito

### Objetivos KPI (6 meses post-launch)

- **Adoption Rate:** 40% usuarios crean al menos 1 servicio digital
- **Conversion:** 15% Free → Starter upgrade por analytics
- **Conversion:** 25% Starter → Professional upgrade por portafolio/CV
- **SEO Performance:** 70% páginas indexadas en Google
- **Page Load:** LCP <2.5s en 95% de páginas
- **Uptime SSR:** 99.9%

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **SSR complejidad técnica** | Media | Alto | POC temprano con Angular Universal |
| **Performance problemas** | Media | Alto | Benchmark con datos reales, caching agresivo |
| **SEO no efectivo** | Baja | Alto | Testing con Google Search Console desde día 1 |
| **PDF generation lenta** | Media | Medio | Usar Puppeteer con pool de workers |
| **Custom domains DNS** | Alta | Medio | Documentación clara, soporte proactivo |
| **Scope creep templates** | Alta | Medio | Limitar templates iniciales, agregar post-launch |

---

## 📚 Referencias

### Documentación Relacionada

- **[Digital Services Feature](../prd/features/digital-services.md)** - Documentación completa
- **[Use Cases](../prd/requirements/use-cases.md)** - CU-009 a CU-013
- **[User Stories](../prd/requirements/user-stories.md)** - US-042 a US-060
- **[Functional Requirements](../prd/requirements/functional-requirements.md)** - FR-063 a FR-082
- **[Architecture](../prd/technical/architecture.md)** - SSR Architecture
- **[Data Models](../prd/technical/data-models.md)** - Digital Services Models
- **[API Endpoints](../prd/technical/api-endpoints.md)** - Digital Services API
- **[Timeline](../prd/technical/implementation-timeline.md)** - Fase 5

---

## 📝 Changelog

### 2026-02-12 - v1.0 (Initial)
- Agregados 5 casos de uso (CU-009 a CU-013)
- Agregadas 19 user stories (US-042 a US-060)
- Agregados 20 functional requirements (FR-063 a FR-082)
- Agregados 7 modelos de datos Django
- Agregados 25+ endpoints API
- Agregada Fase 5 al timeline (10 semanas)
- Actualizado README con feature y roadmap
- Timeline total: 64 → 74 semanas

---

**Fin del Reporte**

Para consultas sobre este reporte, contactar al Product Team o revisar la documentación completa en `/prd/features/digital-services.md`.
