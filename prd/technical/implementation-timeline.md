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
- [ ] Editor de tarjeta en panel cliente (Angular SPA)
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

## Milestones

| Milestone | Week | Deliverable |
|-----------|------|-------------|
| **Alpha Release** | Week 12 | MVP completo, internal testing |
| **Beta Release** | Week 20 | Advanced RBAC, closed beta users |
| **Public Launch** | Week 28 | Enterprise features, public availability |
| **v2.0** | Week 40 | Sharing & Projects completo |
| **v2.5** | Week 50 | Digital Services (SSR + Public Profiles) |

---

## Team Structure (Recommended)

### Core Team (MVP)
- **Backend Developer** (2): Django, PostgreSQL, Redis
- **Frontend Developer** (2): Angular, Tailwind
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
