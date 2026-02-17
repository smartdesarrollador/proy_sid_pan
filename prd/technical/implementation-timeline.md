# Implementation Timeline & Phases

[⬅️ Volver al README](../README.md)

---

## Índice
- [Fase 1: MVP (12 semanas)](#fase-1-mvp-12-semanas)
- [Fase 2: Advanced RBAC (16 semanas)](#fase-2-advanced-rbac-16-semanas)
- [Fase 3: Enterprise Features (24 semanas)](#fase-3-enterprise-features-24-semanas)
- [Fase 4: Sharing & Projects (12 semanas)](#fase-4-sharing--projects-12-semanas)
- [Fase 5: Digital Services (10 semanas)](#fase-5-digital-services-10-semanas)

---

## Timeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Project Timeline                          │
├─────────────────────────────────────────────────────────────────┤
│ Phase 1: MVP              │ 12 weeks │ ████████████░░░░░░░░░░░  │
│ Phase 2: Advanced RBAC    │ 16 weeks │ ░░░░░░░░░░░░████████████  │
│ Phase 3: Enterprise       │ 24 weeks │ ░░░░░░░░░░░░░░░░░░░░████  │
│ Phase 4: Sharing/Projects │ 12 weeks │ ░░░░░░░░░░░░░░░░░░░░░░██  │
│ Phase 5: Digital Services │ 10 weeks │ ░░░░░░░░░░░░░░░░░░░░░░░█  │
└─────────────────────────────────────────────────────────────────┘
Total: ~74 weeks (~17 months)
```

---

## Fase 1: MVP (12 semanas)

**Objetivo**: Lanzar producto funcional con core features para validar market-product fit.

### Sprint 1-2: Infrastructure & Auth (4 weeks)

**Backend**:
- [ ] Setup Django project con PostgreSQL + Redis
- [ ] Implementar modelos: Tenant, User, Role, Permission
- [ ] Configurar RLS (Row-Level Security) en PostgreSQL
- [ ] Implementar JWT authentication (access + refresh tokens)
- [ ] Middleware de tenant isolation
- [ ] Endpoints básicos: /auth/register, /auth/login, /auth/refresh

**Frontend Admin** (React + Vite + TypeScript):
- [ ] Setup proyecto con `npm create vite@latest` (React + TypeScript)
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Implementar login/register pages con React Hook Form + Zod
- [ ] AuthContext provider con JWT storage (localStorage + httpOnly cookies)
- [ ] Axios interceptor para agregar auth header automáticamente
- [ ] ProtectedRoute component para rutas protegidas
- [ ] React Router 6 setup con lazy loading

**DevOps**:
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Deploy staging environment (AWS/DO)
- [ ] Configurar dominio y SSL

---

### Sprint 3-4: User & Role Management (4 weeks)

**Backend**:
- [ ] Implementar CRUD de usuarios
- [ ] Implementar invitaciones por email
- [ ] Crear 5 roles predefinidos (SuperAdmin, OrgAdmin, Manager, Member, Guest)
- [ ] Sistema de permisos granulares (RBAC middleware)
- [ ] Endpoints: /admin/users, /admin/roles, /admin/permissions

**Frontend Admin**:
- [ ] Dashboard con métricas básicas
- [ ] User management (CRUD, list, invite)
- [ ] Role assignment UI
- [ ] Permission matrix visualizer

---

### Sprint 5-6: Subscriptions & Billing (4 weeks)

**Backend**:
- [ ] Modelos: Subscription, Invoice, PaymentMethod
- [ ] Integración con Stripe API
- [ ] Implementar 3 planes: Free, Starter, Professional
- [ ] Feature gates middleware
- [ ] Límites de uso (usuarios, storage, API calls)
- [ ] Cronjob de facturación automática
- [ ] Endpoints: /admin/subscriptions, /admin/billing

**Frontend Admin**:
- [ ] Billing dashboard
- [ ] Plan comparison page
- [ ] Upgrade/downgrade flow
- [ ] Payment methods management
- [ ] Usage metrics con progress bars

**Testing & Polish**:
- [ ] Stripe webhooks (payment success/failed)
- [ ] Email templates (invoices, trial ending)
- [ ] E2E tests para flujos críticos

---

## Fase 2: Advanced RBAC (16 semanas)

**Objetivo**: Features avanzadas de RBAC para clientes enterprise.

### Sprint 7-8: Custom Roles & Hierarchy (4 weeks)

**Backend**:
- [ ] Permitir creación de roles personalizados por tenant
- [ ] Implementar herencia de roles (parent-child)
- [ ] Validación de herencias circulares
- [ ] Propagación automática de cambios en roles padre

**Frontend Admin**:
- [ ] Role builder UI con drag-and-drop de permisos
- [ ] Role hierarchy visualizer
- [ ] Role templates

---

### Sprint 9-10: Conditional Permissions & Delegation (4 weeks)

**Backend**:
- [ ] Implementar permisos condicionales (scopes: all, own, department)
- [ ] Modelo PermissionDelegation
- [ ] Cronjob de expiración de delegaciones
- [ ] Audit log con contexto de delegación

**Frontend Admin**:
- [ ] Permission scope selector
- [ ] Delegation wizard
- [ ] Active delegations manager

---

### Sprint 11-12: MFA & Advanced Audit (4 weeks)

**Backend**:
- [ ] Implementar MFA con TOTP (pyotp)
- [ ] Generación de códigos de recuperación
- [ ] Forzar MFA por organización
- [ ] Advanced audit logs con filtros

**Frontend Admin**:
- [ ] MFA setup wizard con QR code
- [ ] Recovery codes display
- [ ] Audit log explorer con filtros avanzados
- [ ] Exportar audit logs (CSV/JSON)

---

### Sprint 13-14: Groups & Webhooks (4 weeks)

**Backend**:
- [ ] Implementar grupos de usuarios
- [ ] Grupos de permisos predefinidos
- [ ] Webhooks para eventos de auth/authz
- [ ] Webhook retry logic

**Frontend Admin**:
- [ ] Groups management UI
- [ ] Webhook configuration panel
- [ ] Webhook logs viewer

---

## Fase 3: Enterprise Features (24 semanas)

**Objetivo**: Features enterprise para clientes grandes.

### Sprint 15-18: SSO/SAML Integration (8 weeks)

**Backend**:
- [ ] Implementar SAML 2.0 authentication
- [ ] Integración con proveedores comunes (Okta, Azure AD)
- [ ] Just-In-Time (JIT) provisioning
- [ ] SCIM protocol para sincronización

**Frontend Admin**:
- [ ] SSO configuration wizard
- [ ] Identity provider selector
- [ ] SAML metadata uploader

---

### Sprint 19-22: Multi-Tenant Switching & Custom Branding (8 weeks)

**Backend**:
- [ ] Soporte para usuarios en múltiples tenants
- [ ] Tenant switching sin re-login
- [ ] Modelo TenantCustomization
- [ ] Upload y storage de logos (S3)

**Frontend Admin & Cliente**:
- [ ] Tenant switcher dropdown
- [ ] Branding customization panel
- [ ] Dynamic theme application

---

### Sprint 23-26: Advanced Analytics & Compliance (8 weeks)

**Backend**:
- [ ] Modelos de analytics (UsageMetrics, TenantActivity)
- [ ] Agregación de métricas (Celery tasks)
- [ ] Generación de compliance reports (SOC2, GDPR)
- [ ] API rate limiting granular por endpoint

**Frontend Admin**:
- [ ] Advanced analytics dashboard
- [ ] Compliance reports generator
- [ ] Export para BI tools

---

## Fase 4: Sharing & Projects (12 semanas)

**Objetivo**: Implementar sistema de proyectos con compartición colaborativa.

### Sprint 27-28: Project Core (4 weeks)

**Backend**:
- [ ] Modelos: Project, ProjectSection, ProjectItem, ProjectItemField
- [ ] CRUD completo con feature gates
- [ ] Encriptación de campos password (AES-256)
- [ ] Validación de límites por plan

**Frontend Cliente** (React + Vite + TypeScript):
- [ ] Projects list view con TanStack Query (caching)
- [ ] Project detail con sidebar de secciones (Zustand para estado local)
- [ ] Item CRUD con React Hook Form + Zod validation
- [ ] Password field con reveal/hide (useState + useEffect timer)
- [ ] Drag & drop para reordenar items (dnd-kit)

---

### Sprint 29-30: Sharing & Collaboration (4 weeks)

**Backend**:
- [ ] Modelos: Share, SharePermission
- [ ] Herencia automática de permisos
- [ ] Permisos locales que sobrescriben heredados
- [ ] Notificaciones de compartición

**Frontend Cliente**:
- [ ] Share modal con user selector
- [ ] Manage members panel
- [ ] "Shared with me" section
- [ ] Permission level badges

---

### Sprint 31-32: Batch Operations & Export (4 weeks)

**Backend**:
- [ ] Operaciones batch (Professional+)
- [ ] Export a CSV/JSON con passwords encriptados
- [ ] Import desde CSV/JSON con validación
- [ ] Búsqueda full-text (PostgreSQL FTS)

**Frontend Cliente**:
- [ ] Batch selection UI con checkboxes
- [ ] Batch actions bar
- [ ] Export/import wizard
- [ ] Search bar con filters

---

## Fase 5: Digital Services (10 semanas)

**Objetivo**: Implementar servicios digitales públicos (tarjeta digital, landing page, portafolio, CV) con SSR para SEO.

### Sprint 33-34: SSR Infrastructure (4 weeks)

**Backend (Django)**:
- [ ] Modelos: PublicProfile, DigitalCard, PortfolioItem, CVDocument
- [ ] Migrations con indexes optimizados
- [ ] Serializers para todos los modelos
- [ ] Endpoints admin: CRUD para cada servicio
- [ ] Public API endpoints (no auth): `GET /{service}/{username}`
- [ ] Validación de username único con sugerencias
- [ ] Post-save hooks para invalidar cache Redis

**Frontend SSR (Next.js App Router)**:
- [ ] Setup Next.js 14+ con App Router (`npx create-next-app@latest`)
- [ ] Configurar TypeScript + Tailwind CSS
- [ ] Setup next-intl para i18n con SSR
- [ ] Componentes Server Components: DigitalCard, LandingPage, Portfolio, CV
- [ ] 1 template básico por servicio
- [ ] Metadata API para SEO (generateMetadata)
- [ ] ISR con revalidate: 60 (Incremental Static Regeneration)
- [ ] Dynamic routes: `app/[locale]/[username]/page.tsx`

**DevOps**:
- [ ] Deploy SSR service en servidor Node separado (puerto 4000)
- [ ] Nginx reverse proxy: `/tarjeta/*` → SSR, `/api/*` → Django
- [ ] Redis setup con replication
- [ ] Monitoring: latencia SSR, cache hit rate

**Milestones Week 33-36**:
- Week 33: Modelos + API backend completos
- Week 34: SSR funcional con 1 template por servicio

---

### Sprint 35-36: Tarjeta Digital + Landing Page (3 weeks)

**Tarjeta Digital**:
- [ ] Editor de tarjeta en panel cliente (React + Vite SPA)
- [ ] Campos: info de contacto, redes sociales, colores del tema
- [ ] Preview en tiempo real
- [ ] Generación de QR code (backend con qrcode library)
- [ ] Export vCard (Starter+)
- [ ] Analytics básicas: views, unique visitors
- [ ] 3 templates: Classic, Minimal, Modern

**Landing Page**:
- [ ] Selector de templates (Free: 1, Starter: 3)
- [ ] Editor de secciones con drag & drop
- [ ] Secciones: Hero, About, Services, Portfolio, Contact
- [ ] Rich text editor para About (markdown support)
- [ ] Formulario de contacto con anti-spam (reCAPTCHA)
- [ ] Configuración de SEO: meta title, description, OG image
- [ ] Preview responsive (mobile/tablet/desktop)

**Testing**:
- [ ] Unit tests: serializers, validators
- [ ] Integration tests: endpoints CRUD
- [ ] E2E tests: Crear tarjeta → Publicar → Verificar URL pública

**Milestones Week 35-37**:
- Week 35: Tarjeta digital completa con QR
- Week 37: Landing page con 3 templates y editor

---

### Sprint 37-38: Portafolio + CV Digital (3 weeks)

**Portafolio**:
- [ ] CRUD de proyectos: título, descripción, imágenes, tags, links
- [ ] Upload de imágenes con drag & drop
- [ ] Galería con lightbox
- [ ] Filtrado por tags (client-side)
- [ ] Proyectos destacados (max 3)
- [ ] Drag & drop para reordenar proyectos
- [ ] Analytics: clicks en demo, repo, por proyecto
- [ ] Página individual de proyecto: `/portafolio/{username}/{slug}`

**CV Digital**:
- [ ] Auto-población desde perfil del usuario
- [ ] Formularios para: Experiencia, Educación, Habilidades, Idiomas, Certificaciones
- [ ] Validación de fechas (end_date >= start_date)
- [ ] Templates: Classic, Modern, Minimal
- [ ] Export PDF (Professional+) con wkhtmltopdf o Puppeteer
- [ ] Múltiples versiones de CV guardables
- [ ] Toggle para mostrar/ocultar secciones

**Testing**:
- [ ] PDF generation tests
- [ ] Image upload and compression tests
- [ ] Analytics tracking tests

**Milestones Week 37-40**:
- Week 38: Portafolio con proyectos ilimitados
- Week 40: CV con export PDF funcional

---

### Sprint 39-40: Analytics + Custom Domains (2 weeks)

**Analytics**:
- [ ] Modelo ServiceAnalytics: service, date, views, unique_visitors, clicks
- [ ] Tracking de views con cookies/sessions (no duplicar owner)
- [ ] Endpoint: `GET /api/v1/app/digital-services/analytics/{service}?days=30`
- [ ] Dashboard en panel cliente: gráficos de vistas por día
- [ ] Clicks en enlaces: LinkedIn, GitHub, demo, repo
- [ ] Export CSV (Professional+)

**Custom Domains (Enterprise)**:
- [ ] Modelo CustomDomain: domain, verification_status, ssl_status
- [ ] Formulario de configuración con instrucciones DNS
- [ ] Celery task: verificar DNS cada 30 min
- [ ] Integración con Let's Encrypt (certbot)
- [ ] Provisión SSL automática tras validación DNS
- [ ] Configuración de redirecciones: domain → default_service
- [ ] Soporte para subdominios

**SEO Final**:
- [ ] Sitemap.xml dinámico: `/sitemap.xml`
- [ ] Robots.txt configurable
- [ ] Structured data (JSON-LD): Person, Organization, CreativeWork
- [ ] Meta tags testing con Facebook Debugger, Twitter Card Validator

**Feature Gates**:
- [ ] Validar límites por plan en todos los endpoints
- [ ] UpgradePrompt en frontend para features bloqueadas

**Milestones Week 39-42**:
- Week 41: Analytics completas con gráficos
- Week 42: Custom domains funcionales con SSL

---

## Fase 6: Servicios Complementarios (Weeks 51-62, Sprints 41-46)

**Objetivo**: Implementar los 10 servicios de productividad, DevOps y administración documentados en las features de Productivity Services, DevOps Services y Admin Services.

**Duración**: 12 semanas
**Sprints**: 41-46 (2 semanas cada uno)

### Sprint 41-42: Servicios de Productividad (Weeks 51-54)

**Notas** (Week 51):
- [ ] Modelo `Note` con categorías, pin y timestamps
- [ ] CRUD endpoints `/api/v1/notes/`
- [ ] Endpoint PATCH `/api/v1/notes/{id}/pin/` para toggle pin
- [ ] Feature gate: validación de límites por plan (10/100/1000/∞)
- [ ] Filtros: por categoría, búsqueda full-text (título + contenido)
- [ ] Tests unitarios y de integración (coverage >85%)

**Contactos** (Week 52):
- [ ] Modelos `Contact` y `ContactGroup` con relaciones
- [ ] CRUD endpoints `/api/v1/contacts/` y `/api/v1/contacts/groups/`
- [ ] Endpoint GET `/api/v1/contacts/export/` (CSV, Starter+)
- [ ] Feature gate: límites Free/Starter/Pro, grupos solo Starter+
- [ ] Búsqueda por nombre, email, empresa
- [ ] Tests unitarios y de integración

**Bookmarks** (Week 53-54):
- [ ] Modelos `Bookmark` y `BookmarkCollection`
- [ ] CRUD endpoints `/api/v1/bookmarks/` y `/api/v1/bookmarks/collections/`
- [ ] ArrayField para tags (PostgreSQL)
- [ ] Feature gate: límites y colecciones según plan
- [ ] Búsqueda full-text en URL, título y descripción
- [ ] Tests unitarios y de integración

**Feature Gates Semana 51-54**:
- [ ] UpgradePrompt en frontend para todos los límites de plan
- [ ] Validaciones en serializers con error 402 al superar límites

**Milestones Sprint 41-42**:
- Week 52: Notas y Contactos en producción con tests verdes
- Week 54: Bookmarks completo con colecciones y tags

---

### Sprint 43-44: Servicios DevOps (Weeks 55-58)

**Variables de Entorno** (Week 55):
- [ ] Modelo `EnvVariable` con cifrado AES-256 (campo `value_encrypted`)
- [ ] CRUD endpoints `/api/v1/env-vars/`
- [ ] Endpoint POST `/api/v1/env-vars/{id}/reveal/` con audit log
- [ ] Endpoint GET `/api/v1/env-vars/export/` (archivo .env, Professional+)
- [ ] Feature gate: solo Starter+ (25 vars Starter, ∞ Pro/Enterprise)
- [ ] Unique constraint: key + environment por usuario
- [ ] Tests de seguridad: verificar que valores no se exponen en listados

**Claves SSH** (Week 56):
- [ ] Modelo `SSHKey` con clave privada cifrada AES-256
- [ ] CRUD endpoints `/api/v1/ssh-keys/`
- [ ] Cálculo automático de fingerprint SHA-256 al crear
- [ ] Feature gate: Starter (5 max), Professional+ (∞), Free (❌)
- [ ] Tests: verificar que clave privada nunca aparece en respuestas

**Certificados SSL** (Week 57):
- [ ] Modelo `SSLCertificate` con properties `status` y `days_until_expiry`
- [ ] CRUD endpoints `/api/v1/ssl-certs/`
- [ ] Endpoint POST `/api/v1/ssl-certs/import/` con librería `cryptography`
- [ ] Feature gate: Starter (10 max), Professional+ (∞), Free (❌)
- [ ] Cron job: evaluación diaria de vencimientos y envío de alertas email

**Snippets** (Week 58):
- [ ] Modelo `CodeSnippet` con ArrayField para tags
- [ ] CRUD endpoints `/api/v1/snippets/`
- [ ] Filtros por lenguaje y tags
- [ ] Feature gate: Free (10 max), Starter (50 max), Pro+ (∞)
- [ ] Búsqueda full-text con PostgreSQL FTS en título y descripción

**Milestones Sprint 43-44**:
- Week 56: EnvVars y SSH Keys en producción con cifrado verificado
- Week 58: SSL Certs con alertas automáticas y Snippets completos

---

### Sprint 45-46: Servicios de Administración (Weeks 59-62)

**Formularios** (Week 59-60):
- [ ] Modelos `Form`, `FormQuestion`, `FormResponse`
- [ ] CRUD endpoints `/api/v1/forms/`
- [ ] Endpoint POST `/api/v1/forms/{id}/activate/` (genera slug único)
- [ ] Endpoint público POST `/api/v1/forms/public/{slug}/submit/` (sin auth)
- [ ] Endpoint GET `/api/v1/forms/{id}/responses/` (paginado, 20/page)
- [ ] Endpoint GET `/api/v1/forms/{id}/export/` (CSV, Professional+)
- [ ] Feature gate: límites por plan en forms y preguntas
- [ ] Tests: submission anónimo, validaciones de tipos de pregunta

**Log de Auditoría** (Week 61):
- [ ] Vista de lectura del AuditLog existente con filtros adicionales
- [ ] Endpoint GET `/api/v1/audit-log/` con filtros: usuario, acción, fecha rango
- [ ] Endpoint GET `/api/v1/audit-log/export/` (CSV/PDF, Enterprise)
- [ ] Feature gate: Professional+ (con 30d retención), Enterprise (365d retención)
- [ ] Cron job: purga automática de logs según retención del plan
- [ ] Generación de PDF con ReportLab o WeasyPrint

**Reportes** (Week 62):
- [ ] Clase `TenantReport` con cálculo de métricas bajo demanda
- [ ] Endpoint GET `/api/v1/reports/summary/` (Starter+)
- [ ] Endpoint GET `/api/v1/reports/usage/` (desglose por recurso, Starter+)
- [ ] Endpoint GET `/api/v1/reports/trends/` (comparativas, Professional+)
- [ ] Endpoint GET `/api/v1/reports/export/` (PDF ejecutivo, Enterprise)
- [ ] Cache Redis con TTL 5 minutos para evitar recálculo innecesario
- [ ] Task Celery para generación de PDF en background con email de notificación

**Milestones Sprint 45-46**:
- Week 60: Formularios con submissions anónimos y exportación CSV
- Week 62: Auditoría y Reportes completos con exportación Enterprise

---

## Milestones

| Milestone | Week | Deliverable |
|-----------|------|-------------|
| **Alpha Release** | Week 12 | MVP completo, internal testing |
| **Beta Release** | Week 20 | Advanced RBAC, closed beta users |
| **Public Launch** | Week 28 | Enterprise features, public availability |
| **v2.0** | Week 40 | Sharing & Projects completo |
| **v2.5** | Week 50 | Digital Services (SSR + Public Profiles) |
| **v3.0** | Week 62 | Servicios Complementarios (Productividad + DevOps + Admin) |

---

## Team Structure (Recommended)

### Core Team (MVP)
- **Backend Developer** (2): Django, PostgreSQL, Redis
- **Frontend Developer** (2): React, Next.js, Tailwind
- **DevOps Engineer** (1): AWS, CI/CD, monitoring
- **Product Manager** (1): Roadmap, requirements
- **Designer** (0.5): UI/UX design

### Extended Team (Post-MVP)
- **QA Engineer** (1): Testing, automation
- **Security Engineer** (0.5): Pentesting, compliance
- **Technical Writer** (0.5): Documentation

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Stripe integration delays** | Medium | High | Start integration early, use Stripe test mode |
| **RLS performance issues** | Low | High | Benchmark with realistic data, optimize indexes |
| **SSO complexity** | High | Medium | Use libraries (python-saml), allocate 2 sprints |
| **Scope creep** | High | High | Strict sprint planning, MVP-first mentality |
| **Key developer leaves** | Low | High | Knowledge sharing, pair programming, documentation |

---

## Post-Launch Roadmap

### Future Phases (Beyond Week 50)

**Phase 6: Mobile Apps**
- iOS app (Swift/SwiftUI)
- Android app (Kotlin)
- Push notifications

**Phase 7: AI/ML Features**
- Anomaly detection en accesos
- Smart permission recommendations
- Predictive analytics

**Phase 8: Marketplace**
- Integraciones con terceros (Jira, Slack, etc.)
- Webhook templates
- Partner ecosystem

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Architecture](architecture.md)
- [Ver API Endpoints](api-endpoints.md)
- [Ver Data Models](data-models.md)

---

**Última actualización**: 2026-02-12
