# Digital Services - Public Profile Feature

[⬅️ Volver al README](../README.md)

---

## Índice
- [Overview](#overview)
- [Casos de Uso](#casos-de-uso)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Features por Plan](#features-por-plan)
- [Technical Architecture](#technical-architecture)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [URL Patterns](#url-patterns)
- [Template System](#template-system)
- [SEO Strategy](#seo-strategy)
- [Timeline](#timeline)

---

## Overview

### Descripción General

El módulo de **Digital Services** permite a los usuarios crear y publicar cuatro tipos de páginas públicas profesionales, gestionadas desde el panel de cliente pero renderizadas en un frontend separado optimizado para SEO mediante Server-Side Rendering (SSR):

1. **Tarjeta Digital** (`/tarjeta/{username}`) - Tarjeta de presentación digital con información de contacto, enlaces sociales, y QR code para compartir
2. **Landing Page** (`/landing/{username}`) - Página de perfil público personalizable con secciones (Hero, About, Services, Contact)
3. **Portafolio Digital** (`/portafolio/{username}`) - Showcase de proyectos y trabajos con imágenes, categorías, y enlaces
4. **CV Digital** (`/cv/{username}`) - Currículum vitae profesional con exportación a PDF

### Características Clave

- **Server-Side Rendering (SSR)**: Utilizando Next.js App Router para renderizado en servidor, React Server Components, y óptimo SEO out-of-the-box
- **Modern React Stack**: Next.js 14+ con TypeScript, Tailwind CSS, y best practices
- **Responsive Design**: Diseño mobile-first con Tailwind CSS, enfoque minimalista
- **SEO Optimizado**: Meta tags automáticos (Open Graph, Twitter Cards), sitemap.xml, structured data (JSON-LD)
- **Analytics**: Trackeo de vistas, visitantes únicos, clicks en enlaces (disponible según plan)
- **Compartición Social**: URLs amigables, QR codes, Open Graph images
- **Custom Domains**: Dominios personalizados para planes Enterprise con SSL automático
- **Template System**: Sistema de templates component-based, responsive, y customizable
- **Performance**: ISR (Incremental Static Regeneration) con revalidación de 60s, caching optimizado

### URL Patterns

```
https://domain.com/tarjeta/jsmith       # Tarjeta digital de usuario "jsmith"
https://domain.com/landing/mgarcia      # Landing page de usuario "mgarcia"
https://domain.com/portafolio/alopez    # Portafolio de usuario "alopez"
https://domain.com/cv/rperez            # CV digital de usuario "rperez"

# Enterprise con custom domain
https://juansmith.com                    # Custom domain apunta a tarjeta/landing
```

---

## Casos de Uso

### CU-009: Crear Tarjeta Digital desde Panel Cliente

**Actor**: Usuario final (Free+)

**Flujo principal**:
1. Usuario hace login en panel de cliente
2. Navega a "Servicios Digitales" → "Tarjeta Digital"
3. Si no existe tarjeta, ve pantalla de bienvenida con preview de template
4. Click "Crear Mi Tarjeta"
5. Formulario solicita:
   - Nombre completo
   - Título/profesión
   - Foto de perfil (upload o URL)
   - Bio breve (max 200 caracteres)
   - Email público
   - Teléfono (opcional)
   - Enlaces sociales: LinkedIn, Twitter, GitHub, Instagram, Facebook, website
   - Colores del tema (color primario, color de fondo)
6. Preview en tiempo real muestra cambios
7. Click "Publicar"
8. Sistema valida username único, genera URL pública
9. Tarjeta publicada disponible en `https://domain.com/tarjeta/{username}`
10. Usuario puede compartir vía QR code o enlace directo

**Tiempo objetivo**: <5 minutos desde inicio hasta publicación

**Criterios de éxito**:
- Tarjeta creada y accesible públicamente sin autenticación
- Preview actualiza en tiempo real al editar
- QR code generado automáticamente apunta a URL pública
- Responsive en mobile/tablet/desktop

**Flujos alternativos**:
- **Alt-1**: Username ya existe → Sugerir alternativas (jsmith1, jsmith2, j-smith)
- **Alt-2**: Límite de views alcanzado (Free: 100/mes) → UpgradePrompt
- **Alt-3**: Foto de perfil excede tamaño → Compresión automática a max 500KB

---

### CU-010: Personalizar Landing Page Pública

**Actor**: Usuario con plan Professional+ (Starter incluye templates limitados)

**Flujo principal**:
1. Usuario navega a "Servicios Digitales" → "Landing Page"
2. Selector de templates muestra:
   - Free: 1 template básico (fijo)
   - Starter: 3 templates (Minimal, Corporate, Creative)
   - Professional: Todos los templates + custom CSS
3. Selecciona template "Minimal"
4. Editor muestra secciones configurables:
   - **Hero**: Título, subtítulo, CTA button, imagen de fondo
   - **About**: Texto enriquecido (markdown), imagen lateral
   - **Services**: Grid de servicios (ícono, título, descripción)
   - **Portfolio**: Galería de proyectos destacados (vincula a proyectos existentes)
   - **Contact**: Formulario de contacto (emails se envían a usuario)
5. Usuario personaliza cada sección con drag & drop para reordenar
6. Configuración de SEO:
   - Meta title (max 60 caracteres)
   - Meta description (max 160 caracteres)
   - Open Graph image (upload o auto-generate)
7. Click "Vista Previa" abre modal con preview responsive
8. Click "Publicar"
9. Landing disponible en `https://domain.com/landing/{username}`

**Tiempo objetivo**: <15 minutos para personalización completa

**Criterios de éxito**:
- Drag & drop funciona smoothly para reordenar secciones
- Preview muestra exactamente lo que se verá en producción
- SEO meta tags visibles en código fuente HTML (SSR)
- Formulario de contacto envía emails correctamente

**Professional+ Features**:
- Custom CSS editor con syntax highlighting
- Google Analytics integration
- Custom favicon
- Remove "Powered by [Platform]" footer

---

### CU-011: Gestionar Portafolio de Proyectos

**Actor**: Usuario con plan Professional+

**Flujo principal**:
1. Usuario navega a "Servicios Digitales" → "Portafolio"
2. Dashboard muestra proyectos existentes (vinculados o standalone)
3. Click "+ Agregar Proyecto"
4. Formulario solicita:
   - Título del proyecto
   - Descripción breve (200 caracteres) y completa (markdown)
   - Imágenes: Cover image + galería (max 10 imágenes)
   - Tags/categorías: Selección múltiple (Web, Mobile, Design, Backend, etc.)
   - Enlaces: Demo live, repositorio GitHub, case study
   - Fecha de publicación
5. Opción "Vincular a proyecto existente" conecta con módulo Projects
6. Vista previa muestra card del proyecto en grid
7. Click "Publicar Proyecto"
8. Proyecto aparece en `https://domain.com/portafolio/{username}`
9. Proyectos ordenados por: Destacado → Fecha (recientes primero)
10. Usuario puede marcar hasta 3 proyectos como "Destacados" (aparecen primero)

**Tiempo objetivo**: <10 minutos por proyecto

**Criterios de éxito**:
- Grid responsive (1 col mobile, 2 cols tablet, 3 cols desktop)
- Lightbox para galería de imágenes
- Filtrado por tags funcional (client-side)
- Links externos abren en nueva pestaña con `rel="noopener"`

**Features adicionales**:
- Drag & drop para reordenar proyectos
- Analytics: Clicks en demo, repository, por proyecto
- Integración con Behance/Dribbble (importar proyectos)

---

### CU-012: Generar CV Digital desde Perfil

**Actor**: Usuario (Free+, limitaciones por plan)

**Flujo principal**:
1. Usuario navega a "Servicios Digitales" → "CV Digital"
2. Sistema auto-completa secciones desde perfil del usuario:
   - **Header**: Nombre, título, contacto (email, teléfono, ubicación)
   - **Resumen Profesional**: Campo editable (max 300 caracteres)
   - **Experiencia Laboral**: Lista de empleos (empresa, cargo, fechas, responsabilidades)
   - **Educación**: Lista de títulos (institución, grado, fechas)
   - **Habilidades**: Tags de habilidades (Frontend, React, Python, etc.)
   - **Idiomas**: Lista con nivel (Nativo, Fluido, Intermedio, Básico)
   - **Certificaciones**: Títulos y emisores
3. Usuario edita cada sección con formulario dedicado
4. Selector de template: Classic, Modern, Minimal (Free: 1, Starter: 2, Pro: todos)
5. Botón "Export PDF" genera PDF descargable (Professional+)
6. Click "Publicar CV"
7. CV disponible en `https://domain.com/cv/{username}`

**Tiempo objetivo**: <10 minutos con auto-población, <30 min manualmente

**Criterios de éxito**:
- Auto-población funciona si usuario completó perfil
- CV responsive (mobile muestra secciones apiladas)
- PDF generado coincide visualmente con versión web
- PDF descargable tiene nombre: `CV_{Nombre}_{Fecha}.pdf`

**Features por plan**:
- Free: CV básico, sin PDF export
- Starter: PDF export, 2 templates
- Professional: Todos los templates, custom CSS, hide contact info selectively

---

### CU-013: Configurar Dominio Personalizado (Enterprise)

**Actor**: Admin de organización con plan Enterprise

**Flujo principal**:
1. Usuario navega a "Servicios Digitales" → "Configuración" → "Custom Domain"
2. Ingresa dominio deseado: `juansmith.com`
3. Sistema verifica disponibilidad y que no esté usado por otro tenant
4. Instrucciones de configuración DNS:
   ```
   Tipo: CNAME
   Nombre: @  (o www)
   Valor: proxy.platform.com
   TTL: 3600
   ```
5. Usuario configura DNS en su proveedor (Cloudflare, GoDaddy, etc.)
6. Click "Verificar Configuración"
7. Sistema valida DNS propagation (puede tardar hasta 24h)
8. Tras validación exitosa, sistema provisiona SSL automático (Let's Encrypt)
9. Dominio activo apunta a landing page o tarjeta (configurable)
10. Usuario puede configurar redirecciones:
    ```
    juansmith.com → /landing/jsmith
    juansmith.com/cv → /cv/jsmith
    ```

**Tiempo objetivo**: <5 minutos configuración, <24h propagación DNS

**Criterios de éxito**:
- Verificación DNS automática con retry cada 30 min
- SSL activo en <2h tras validación DNS
- Redirecciones configurables desde panel
- Soporte para subdominios (www, cv, portfolio)

**Validaciones críticas**:
- No permitir dominios ya usados por otros usuarios
- Validar ownership del dominio (email verification o TXT record)
- Renovación automática de certificados SSL

---

## User Stories

### 3.8 Digital Services (Servicios Públicos)

#### Tarjeta Digital (US-042 a US-046)

**US-042: Crear y Editar Tarjeta Digital desde Panel Cliente**

Como usuario, quiero crear mi tarjeta digital con información de contacto y enlaces sociales, para tener una presencia profesional online con URL compartible.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre, título, foto, bio, email, teléfono, redes sociales
- [ ] Preview en tiempo real muestra cambios al editar
- [ ] Sistema valida username único globalmente
- [ ] Colores del tema personalizables (color primario, fondo)
- [ ] Tarjeta publicada accesible en `/tarjeta/{username}` sin autenticación
- [ ] Botón "Editar" permite modificar después de publicar

**Escenarios:**
1. Usuario Free crea primera tarjeta → Publicada exitosamente
2. Username "jsmith" ya existe → Sugiere "jsmith1", "j-smith", "john-smith"
3. Usuario edita bio y color → Preview actualiza inmediatamente

---

**US-043: Compartir Tarjeta vía QR Code**

Como usuario, quiero generar QR code de mi tarjeta digital, para compartir mi contacto fácilmente en eventos o imprimir en tarjetas físicas.

**Criterios de Aceptación:**
- [ ] Botón "Generar QR" crea código QR apuntando a URL pública
- [ ] QR descargable como PNG (300x300px, 600x600px, 1200x1200px)
- [ ] QR incluye logo/avatar en centro (opcional)
- [ ] Opción "Copiar Link" copia URL al portapapeles
- [ ] Modal muestra preview del QR antes de descargar

---

**US-044: Exportar vCard para Contactos**

Como usuario con plan Starter+, quiero exportar mi tarjeta como archivo vCard (.vcf), para que otros puedan agregar mi contacto a sus teléfonos con un click.

**Criterios de Aceptación:**
- [ ] Botón "Exportar vCard" genera archivo `.vcf`
- [ ] vCard incluye: nombre, email, teléfono, URL de tarjeta, foto
- [ ] Compatible con iOS Contacts y Google Contacts
- [ ] Feature gate valida plan Starter+ antes de exportar

---

**US-045: Personalizar Colores y Foto de Perfil**

Como usuario, quiero personalizar colores de mi tarjeta y subir foto de perfil profesional, para reflejar mi identidad de marca personal.

**Criterios de Aceptación:**
- [ ] Color picker permite seleccionar color primario (usado en botones, links)
- [ ] Color picker para fondo (sólido o degradado)
- [ ] Upload de foto con preview y crop
- [ ] Validación: JPG/PNG, max 5MB, min 200x200px
- [ ] Compresión automática si excede 500KB
- [ ] Opción "Usar avatar de Gravatar" (basado en email)

---

**US-046: Ver Analytics de Vistas en Tarjeta**

Como usuario con plan Starter+, quiero ver cuántas personas han visitado mi tarjeta digital, para medir el alcance de mi presencia online.

**Criterios de Aceptación:**
- [ ] Dashboard muestra: total views, unique visitors, views últimos 7/30 días
- [ ] Gráfico de líneas muestra tendencia de vistas por día
- [ ] No se trackean vistas del propio usuario (by session)
- [ ] Analytics disponibles solo para Starter+ (UpgradePrompt para Free)
- [ ] Clicks en enlaces sociales trackeados individualmente

---

#### Landing Page (US-047 a US-051)

**US-047: Seleccionar Template de Landing Page**

Como usuario con plan Starter+, quiero elegir un template profesional para mi landing page, para crear una presencia online atractiva sin diseñar desde cero.

**Criterios de Aceptación:**
- [ ] Galería muestra templates disponibles según plan
- [ ] Free: 1 template (Basic) - solo lectura
- [ ] Starter: 3 templates (Minimal, Corporate, Creative)
- [ ] Professional: Todos los templates + custom CSS
- [ ] Preview de template muestra diseño completo antes de seleccionar
- [ ] Cambiar template preserva contenido, solo cambia diseño

---

**US-048: Editar Secciones de Landing (Hero, About, Services, Contact)**

Como usuario, quiero personalizar las secciones de mi landing page, para comunicar efectivamente mi propuesta de valor y servicios.

**Criterios de Aceptación:**
- [ ] Editor muestra secciones: Hero, About, Services, Portfolio, Contact
- [ ] Drag & drop para reordenar secciones
- [ ] Toggle para mostrar/ocultar secciones
- [ ] **Hero**: Título, subtítulo, CTA button (texto + link), background image
- [ ] **About**: Rich text editor (markdown), imagen lateral
- [ ] **Services**: Grid de servicios (hasta 6), cada uno con ícono, título, descripción
- [ ] **Contact**: Formulario (nombre, email, mensaje) con configuración de email destino
- [ ] Preview responsive (mobile/tablet/desktop)

---

**US-049: Agregar Formulario de Contacto**

Como usuario, quiero incluir formulario de contacto en mi landing, para que visitantes puedan comunicarse conmigo directamente.

**Criterios de Aceptación:**
- [ ] Formulario tiene campos: nombre, email, asunto, mensaje
- [ ] Validación client-side y server-side
- [ ] Configuración de email destino (por defecto: email del usuario)
- [ ] Anti-spam con reCAPTCHA (opcional, Professional+)
- [ ] Notificación in-app cuando recibe nuevo mensaje
- [ ] Rate limiting: max 20 mensajes/hora por IP

---

**US-050: Configurar Meta Tags para SEO**

Como usuario con plan Professional+, quiero configurar meta tags personalizados, para mejorar el ranking de mi landing en buscadores.

**Criterios de Aceptación:**
- [ ] Campos: Meta title (max 60 chars), meta description (max 160 chars)
- [ ] Upload de Open Graph image (1200x630px recomendado)
- [ ] Preview muestra cómo se verá en Google, Facebook, Twitter
- [ ] Auto-generación de OG image si no se sube (título + foto perfil)
- [ ] Tags incluidos: og:title, og:description, og:image, twitter:card
- [ ] HTML source muestra tags en `<head>` (validar con SSR)

---

**US-051: Integrar Google Analytics**

Como usuario con plan Professional+, quiero conectar Google Analytics a mi landing, para entender el comportamiento de mis visitantes.

**Criterios de Aceptación:**
- [ ] Campo para ingresar Google Analytics Tracking ID (GA4 o Universal Analytics)
- [ ] Script de Analytics inyectado en `<head>` de la página
- [ ] No afecta performance (async loading)
- [ ] Cumple GDPR: banner de cookies si usuario en EU
- [ ] Opción para deshabilitar Analytics temporalmente

---

#### Portafolio Digital (US-052 a US-055)

**US-052: Agregar Proyectos al Portafolio con Imágenes**

Como usuario con plan Professional+, quiero publicar proyectos en mi portafolio con imágenes y descripciones, para mostrar mi trabajo a potenciales clientes o empleadores.

**Criterios de Aceptación:**
- [ ] Formulario: título, descripción breve, descripción completa (markdown), cover image, galería (max 10 imágenes)
- [ ] Upload de imágenes con drag & drop, preview, y reordenamiento
- [ ] Validación: JPG/PNG/WebP, max 5MB por imagen
- [ ] Compresión y optimización automática (WebP conversion)
- [ ] Links: demo live, repositorio, case study (validación de URLs)
- [ ] Fecha de publicación del proyecto

---

**US-053: Organizar Proyectos por Categoría/Tags**

Como usuario, quiero categorizar proyectos con tags, para que visitantes filtren por tipo de trabajo.

**Criterios de Aceptación:**
- [ ] Tags predefinidos: Web Development, Mobile App, UI/UX Design, Branding, Backend, Frontend
- [ ] Opción para crear tags personalizados (max 20 tags totales)
- [ ] Multi-selección de tags por proyecto
- [ ] Página de portafolio muestra filtros por tag (client-side filtering)
- [ ] URL con query param: `/portafolio/jsmith?tag=web-development`

---

**US-054: Configurar Proyecto Destacado**

Como usuario, quiero marcar hasta 3 proyectos como destacados, para que aparezcan primero en mi portafolio.

**Criterios de Aceptación:**
- [ ] Toggle "Destacar proyecto" en editor
- [ ] Máximo 3 proyectos destacados simultáneamente
- [ ] Proyectos destacados muestran badge "Destacado"
- [ ] Orden: Destacados (ordenados manualmente) → Resto (por fecha descendente)
- [ ] Drag & drop para reordenar proyectos destacados

---

**US-055: Compartir Link a Proyecto Específico**

Como usuario, quiero compartir URL de un proyecto individual, para enviar mi trabajo específico a clientes o incluir en aplicaciones de empleo.

**Criterios de Aceptación:**
- [ ] URL de proyecto: `/portafolio/jsmith/{project-slug}`
- [ ] Slug generado automáticamente desde título (ej: "Mi App" → `mi-app`)
- [ ] Página de proyecto individual muestra: galería full, descripción completa, links
- [ ] Botón "Compartir" copia URL al portapapeles
- [ ] Meta tags específicos del proyecto para sharing en redes sociales

---

#### CV Digital (US-056 a US-058)

**US-056: Generar CV Digital desde Perfil del Usuario**

Como usuario, quiero generar mi CV digital automáticamente desde mi perfil, para ahorrar tiempo al no tener que duplicar información.

**Criterios de Aceptación:**
- [ ] Sistema auto-completa secciones desde perfil: nombre, email, teléfono, foto
- [ ] Secciones editables: Resumen profesional, Experiencia, Educación, Habilidades, Idiomas, Certificaciones
- [ ] Cada sección tiene formulario específico con validaciones
- [ ] Fechas de experiencia/educación con validación (end_date >= start_date)
- [ ] Habilidades con auto-complete de skills comunes

---

**US-057: Personalizar Secciones del CV**

Como usuario, quiero personalizar qué secciones incluir en mi CV, para adaptarlo a diferentes oportunidades laborales.

**Criterios de Aceptación:**
- [ ] Toggle para mostrar/ocultar secciones: Foto, Teléfono, Dirección, Certificaciones, Referencias
- [ ] Drag & drop para reordenar secciones
- [ ] Opción "Versión Anónima" oculta: foto, nombre completo, contacto (para procesos ciegos)
- [ ] Múltiples versiones de CV guardables (ej: "CV Backend", "CV Fullstack")

---

**US-058: Exportar CV a PDF**

Como usuario con plan Professional+, quiero descargar mi CV como PDF profesional, para enviarlo en aplicaciones de empleo.

**Criterios de Aceptación:**
- [ ] Botón "Exportar PDF" genera PDF de alta calidad
- [ ] PDF usa template seleccionado (Classic, Modern, Minimal)
- [ ] Nombre de archivo: `CV_{Nombre}_{Apellido}_{Fecha}.pdf`
- [ ] PDF tamaño A4, fuentes embebidas, compatible con ATS (Applicant Tracking Systems)
- [ ] Opción para incluir/excluir foto en PDF

---

#### Cross-Service Features (US-059 a US-060)

**US-059: Configurar SEO Global para Servicios Digitales**

Como usuario con plan Professional+, quiero configurar SEO default para todos mis servicios digitales, para maximizar mi visibilidad en buscadores.

**Criterios de Aceptación:**
- [ ] Configuración global: Meta title base, meta description base, keywords
- [ ] Cada servicio puede override configuración global
- [ ] Sistema genera `sitemap.xml` dinámico incluyendo todas las páginas públicas
- [ ] `robots.txt` configurable (allow/disallow por servicio)
- [ ] Structured data (JSON-LD) para Person schema

---

**US-060: Conectar Dominio Personalizado (Enterprise)**

Como admin de organización Enterprise, quiero conectar un dominio personalizado a mis servicios digitales, para branding profesional sin mencionar la plataforma.

**Criterios de Aceptación:**
- [ ] Configuración de dominio: ingresar domain, verificar DNS, activar SSL
- [ ] Instrucciones claras para configurar CNAME en proveedor DNS
- [ ] Validación automática de DNS cada 30 min (max 24h)
- [ ] Provisión automática de SSL con Let's Encrypt
- [ ] Configuración de redirecciones: dominio → servicio específico
- [ ] Soporte para subdominios: `cv.domain.com`, `portfolio.domain.com`
- [ ] White-label: remover "Powered by [Platform]" footer

---

## Functional Requirements

### 4.8 Digital Services (Public Profiles)

#### SSR Architecture (FR-063 a FR-066)

**FR-063: Server-Side Rendering con Next.js App Router**

El sistema DEBE utilizar Next.js App Router para renderizar las páginas públicas en el servidor, generando HTML completo antes de enviar al cliente para optimizar SEO y performance.

**Detalles técnicos:**
- Express server con `@nguniversal/express-engine`
- Pre-rendering de rutas estáticas en build time
- Dynamic SSR para rutas dinámicas (usernames)
- Transfer state para evitar duplicate API calls

---

**FR-064: Generación de HTML Estático para Páginas Públicas**

El sistema DEBE generar HTML estático completo con contenido renderizado en el servidor, visible sin JavaScript habilitado, para garantizar indexación por buscadores.

**Detalles técnicos:**
- HTML source incluye contenido completo (no solo placeholders)
- Meta tags en `<head>` renderizados en servidor
- No-JS fallback para funcionalidades básicas (navegación)

---

**FR-065: Caching de Páginas Renderizadas**

El sistema DEBE cachear las páginas SSR renderizadas en Redis con TTL de 5 minutos, para reducir carga del servidor y mejorar latencia.

**Detalles técnicos:**
- Cache key: `ssr:{service}:{username}:{version}`
- TTL: 5 minutos (300 segundos)
- Hit rate objetivo: >80%
- Fallback si Redis down: render directo (degradación graceful)

---

**FR-066: Invalidación de Cache al Actualizar Perfil**

El sistema DEBE invalidar el cache de una página pública inmediatamente cuando el usuario actualiza su perfil, para garantizar que los cambios sean visibles en <1 minuto.

**Detalles técnicos:**
- Hook post-save en modelos Django
- DELETE key de Redis: `ssr:{service}:{username}:*`
- Purge de CDN si se usa (Cloudflare, CloudFront)

---

#### URL Routing (FR-067 a FR-068)

**FR-067: Patrón de URLs Públicas**

El sistema DEBE seguir el patrón de URL `/{servicio}/{username}` para todas las páginas públicas, garantizando URLs limpias, memorables, y SEO-friendly.

**Servicios soportados:**
- `/tarjeta/{username}`
- `/landing/{username}`
- `/portafolio/{username}`
- `/cv/{username}`

---

**FR-068: Validación de Username Único Global**

El sistema DEBE validar que los usernames sean únicos globalmente (no solo por tenant), para evitar conflictos en URLs públicas y permitir migración futura a subdominios.

**Detalles técnicos:**
- Validación en backend: `PublicProfile.username` con unique constraint
- Regex permitido: `^[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?$` (lowercase, números, guiones, 2-50 chars)
- Reservar usernames: admin, api, www, app, dashboard, login, register
- Sugerir alternativas si username tomado

---

#### Template System (FR-069 a FR-072)

**FR-069: Templates Component-Based**

El sistema DEBE soportar un sistema de templates component-based, donde cada template se compone de componentes React reutilizables (Header, Hero, About, Footer, etc.).

**Detalles técnicos:**
- Template como configuración JSON: `{ sections: [ { type: 'hero', props: {...} } ] }`
- React components con props tipados (TypeScript interfaces)
- Dynamic imports con React.lazy() para lazy loading de componentes
- Server Components por defecto, Client Components solo cuando necesario

---

**FR-070: Templates Responsive Mobile-First**

Todos los templates DEBEN ser responsive con diseño mobile-first, garantizando experiencia óptima en dispositivos móviles, tablets, y desktop.

**Breakpoints Tailwind:**
- Mobile: < 640px (1 columna)
- Tablet: 640px - 1024px (2 columnas)
- Desktop: >= 1024px (3 columnas en grids)

---

**FR-071: Custom CSS para Professional+**

El sistema DEBE permitir a usuarios Professional+ agregar CSS personalizado, aplicado en sandbox para prevenir inyección de código malicioso.

**Detalles técnicos:**
- Editor de CSS con syntax highlighting
- Validación: solo propiedades CSS permitidas (no `<script>`, no `background-image: url()` con JS)
- Sandbox: CSS scoped al contenedor del usuario
- Preview en tiempo real antes de publicar

---

**FR-072: Custom Templates para Enterprise**

El sistema DEBE permitir a usuarios Enterprise crear templates completamente personalizados mediante código HTML/CSS/TypeScript validado por admins de la plataforma.

**Detalles técnicos:**
- Solicitud de template custom vía ticket de soporte
- Revisión de código por equipo técnico
- Deploy como componente standalone
- Aislado de otros usuarios

---

#### SEO & Metadata (FR-073 a FR-076)

**FR-073: Generación Automática de Meta Tags**

El sistema DEBE generar automáticamente meta tags (title, description, Open Graph, Twitter Cards) para todas las páginas públicas, permitiendo override manual.

**Meta tags incluidos:**
```html
<title>Juan Smith - Desarrollador Full Stack</title>
<meta name="description" content="Portafolio de proyectos web...">
<meta property="og:title" content="Juan Smith - Desarrollador Full Stack">
<meta property="og:description" content="Portafolio de proyectos web...">
<meta property="og:image" content="https://domain.com/og-images/jsmith.jpg">
<meta property="og:url" content="https://domain.com/landing/jsmith">
<meta name="twitter:card" content="summary_large_image">
```

---

**FR-074: Sitemap.xml Dinámico**

El sistema DEBE generar un sitemap.xml dinámico que incluya todas las páginas públicas de servicios digitales, actualizado automáticamente al crear/eliminar perfiles.

**Detalles técnicos:**
- Endpoint: `GET /sitemap.xml`
- Incluye: todas las páginas públicas con `is_public=True`
- Prioridad: 0.8 para landing/tarjeta, 0.6 para portfolio/CV
- Changefreq: weekly
- Cache: 24 horas

---

**FR-075: Structured Data (JSON-LD)**

El sistema DEBE incluir structured data en formato JSON-LD para páginas públicas, facilitando rich snippets en buscadores.

**Schema.org types:**
- Person (tarjeta, landing, CV)
- CreativeWork (proyectos de portafolio)
- Organization (si usuario tiene empresa)

Ejemplo:
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Juan Smith",
  "jobTitle": "Desarrollador Full Stack",
  "url": "https://domain.com/landing/jsmith",
  "sameAs": [
    "https://linkedin.com/in/jsmith",
    "https://github.com/jsmith"
  ]
}
```

---

**FR-076: Robots.txt Configurable**

El sistema DEBE generar un `robots.txt` configurable que permita a usuarios controlar qué páginas son indexables por buscadores.

**Configuración default:**
```
User-agent: *
Allow: /tarjeta/
Allow: /landing/
Allow: /portafolio/
Allow: /cv/
Disallow: /api/
Sitemap: https://domain.com/sitemap.xml
```

---

#### Public API (FR-077 a FR-078)

**FR-077: Endpoints Públicos Sin Autenticación**

Los endpoints públicos para renderizar servicios digitales NO DEBEN requerir autenticación JWT, siendo accesibles por cualquier visitante.

**Endpoints públicos:**
- `GET /tarjeta/{username}`
- `GET /landing/{username}`
- `GET /portafolio/{username}`
- `GET /portafolio/{username}/{project-slug}`
- `GET /cv/{username}`

---

**FR-078: Endpoints Admin con Validación de Ownership**

Los endpoints de administración de servicios digitales DEBEN validar que el usuario autenticado sea el owner del perfil que intenta modificar.

**Validación:**
```python
def check_profile_ownership(request, username):
    profile = PublicProfile.objects.get(username=username)
    if profile.user != request.user:
        raise PermissionDenied("No tienes permiso para editar este perfil")
```

---

#### Analytics (FR-079 a FR-080)

**FR-079: Tracking de Vistas y Visitantes**

El sistema DEBE trackear views, unique visitors, y clicks en enlaces para servicios digitales, almacenando datos agregados para analytics.

**Métricas trackeadas:**
- Page views (total y por día)
- Unique visitors (por session cookie o IP)
- Clicks en enlaces sociales
- Clicks en proyectos de portafolio
- Descargas de PDF (CV)

---

**FR-080: Analytics por Plan**

Las analytics DEBEN estar disponibles según el plan del usuario, con diferentes niveles de detalle.

**Límites por plan:**
- Free: Sin analytics
- Starter: Analytics básicas (7 días, totales)
- Professional: Analytics avanzadas (30 días, gráficos, por fuente)
- Enterprise: Analytics completas (ilimitado, export CSV, integración Google Analytics)

---

#### Custom Domains (FR-081 a FR-082)

**FR-081: Soporte para Custom Domains con CNAME**

El sistema DEBE soportar dominios personalizados para usuarios Enterprise mediante configuración CNAME, permitiendo usar su propio dominio en lugar del subdominio de la plataforma.

**Detalles técnicos:**
- Usuario configura CNAME apuntando a: `proxy.platform.com`
- Validación de DNS con retry cada 30 min (max 48h)
- Tabla `CustomDomain`: domain, tenant, verification_status, ssl_status
- Solo 1 custom domain activo por usuario (Enterprise)

---

**FR-082: Provisión Automática de SSL**

El sistema DEBE provisionar certificados SSL automáticamente para custom domains usando Let's Encrypt, renovándolos antes de expiración.

**Detalles técnicos:**
- Integración con certbot o servicios como Cloudflare
- Validación: HTTP-01 challenge o DNS-01
- Renovación automática 30 días antes de expiración
- Alertas si renovación falla

---

## Features por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Tarjeta Digital** | ✅ Básica | ✅ + QR + vCard | ✅ + Custom CSS | ✅ + White-label |
| **Landing Page** | ❌ | ✅ (3 templates) | ✅ (Todos + CSS) | ✅ + Custom domain |
| **Portafolio** | ❌ | ❌ | ✅ (Ilimitado) | ✅ + Custom templates |
| **CV Digital** | ✅ Básico | ✅ + PDF export | ✅ + Múltiples versiones | ✅ + ATS optimization |
| **Templates** | 1 (Basic) | 3 por servicio | Todos + Custom CSS | Custom templates |
| **Views/mes** | 100 | 1,000 | 10,000 | Ilimitado |
| **Analytics** | ❌ | ✅ Básicas (7 días) | ✅ Avanzadas (30 días) | ✅ Completas (ilimitado) |
| **Custom Domain** | ❌ | ❌ | ❌ | ✅ (1 dominio) |
| **SSL Automático** | ✅ | ✅ | ✅ | ✅ |
| **SEO Control** | Auto | Auto | ✅ Manual | ✅ Manual + Structured data |
| **Google Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Remove Branding** | ❌ | ❌ | ❌ | ✅ |

---

## Technical Architecture

### Stack Tecnológico

**Frontend SSR (Public Pages - Digital Services):**
- Next.js 14+ App Router con React 18+ Server Components
- TypeScript 5+ con strict mode
- Tailwind CSS 3.4+ para estilos
- next-intl para internacionalización con SSR
- next-themes para dark mode
- Built-in Node.js server (standalone output para Docker)

**Backend (API + Admin):**
- Django REST Framework (existing backend)
- PostgreSQL para datos
- Redis para caching (opcional con ISR)
- Celery para tareas async (PDF generation, email)

**Infraestructura:**
- Nginx como reverse proxy
- Let's Encrypt para SSL (custom domains)
- Vercel (recommended) o self-hosted con Docker
- Cloudflare CDN (opcional) para caching global

---

### Decisión de SSR: Next.js App Router

**Razones para Next.js:**

1. **Best-in-class SEO**:
   - Metadata API automática (title, description, Open Graph, Twitter Cards)
   - JSON-LD structured data out-of-the-box
   - Sitemap y robots.txt generation
   - Automatic canonical URLs

2. **Performance**:
   - React Server Components stream HTML progresivamente
   - Automatic code splitting por ruta
   - Image optimization con next/image (WebP, AVIF, lazy loading)
   - Font optimization con next/font
   - CSS optimization (Tailwind purge automático)

3. **Developer Experience**:
   - File-based routing (no router config)
   - Fast Refresh (HMR instantáneo)
   - Built-in TypeScript support
   - Zero-config production builds

4. **ISR (Incremental Static Regeneration)**:
   - Pre-render rutas populares en build time
   - Revalidación on-demand o por tiempo
   - Fallback rendering para rutas nuevas

5. **Deployment**:
   - Vercel integration (edge functions, CDN, analytics)
   - Standalone output para Docker/self-hosted
   - Middleware para A/B testing, redirects, auth checks

**Alternativas consideradas:**
1. **Remix**: Excelente SSR, pero ecosistema más pequeño que Next.js
2. **Astro**: Ideal para sitios estáticos, pero interactividad limitada
3. **React + Vite SSR**: Requiere setup manual (Express, routing, data fetching)
4. **Django Templates**: Sin SPA interactivity, DX pobre para UI modernas

---

### Arquitectura de SSR

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /landing/jsmith
       ▼
┌──────────────────┐
│  Nginx (Reverse  │
│      Proxy)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐      ┌─────────────┐
│  Next.js Server  │─────▶│    Redis    │
│  (App Router)    │◀─────│   (Cache)   │
└──────┬───────────┘      └─────────────┘
       │ API Call
       ▼
┌──────────────────┐      ┌─────────────┐
│  Django Backend  │─────▶│ PostgreSQL  │
│   (REST API)     │      │             │
└──────────────────┘      └─────────────┘
```

**Flujo de rendering:**
1. Browser solicita `/landing/jsmith`
2. Nginx enruta a Next.js server (SSR)
3. Next.js verifica ISR cache (`revalidate: 60`)
4. Si hit: devuelve HTML cacheado
5. Si miss o stale:
   - Next.js Server Component llama API Django: `GET /api/v1/app/public-profiles/jsmith`
   - React Server Components renderizan en servidor
   - HTML completo generado (no necesita TransferState)
   - Next.js cachea para ISR (revalidate cada 60s)
   - Devuelve HTML al browser
6. Browser recibe HTML completo (indexable por SEO)
7. React hydration en cliente para interactividad

---

### Caching Strategy

**Niveles de cache:**

1. **Redis (SSR Pages)**: TTL 5 minutos
   - Key: `ssr:{service}:{username}:{lang}`
   - Invalidación: post-save hook en Django

2. **CDN (Cloudflare/CloudFront)**: TTL 1 hora
   - Cache-Control header: `public, max-age=3600`
   - Purge vía API al invalidar Redis

3. **Browser**: TTL 5 minutos
   - Cache-Control: `public, max-age=300`

**Performance objetivo:**
- Cache hit ratio: >80%
- TTFB (Time to First Byte): <200ms (cached), <1s (uncached)
- LCP (Largest Contentful Paint): <2.5s

---

### Next.js Project Setup

**Installation**:
```bash
# Create Next.js app
npx create-next-app@latest digital-services --typescript --tailwind --app --src-dir

cd digital-services

# Install dependencies
npm install next-intl next-themes
npm install -D @types/node
```

**Project Structure**:
```
digital-services/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          # Root layout (Server Component)
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── [username]/
│   │   │   │   ├── page.tsx        # User profile (SSR)
│   │   │   │   └── opengraph-image.tsx  # Dynamic OG images
│   │   │   └── not-found.tsx       # 404 page
│   │   ├── api/                    # API routes (optional)
│   │   └── sitemap.ts              # Dynamic sitemap
│   ├── components/
│   │   ├── server/                 # Server Components
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── SectionRenderer.tsx
│   │   └── client/                 # Client Components
│   │       ├── ThemeToggle.tsx
│   │       └── ContactForm.tsx
│   ├── lib/
│   │   ├── api.ts                  # Django API client
│   │   ├── metadata.ts             # SEO helpers
│   │   └── i18n.ts                 # i18n config
│   └── styles/
│       └── globals.css
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output for deployment
  output: 'standalone', // Docker-friendly

  // Images
  images: {
    domains: ['api.example.com', 'cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // i18n with next-intl
  experimental: {
    serverActions: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // API proxy (optional)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/api/:path*`,
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

**Root Layout con i18n**:
```typescript
// src/app/[locale]/layout.tsx
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/providers/theme-provider';

const locales = ['en', 'es'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await import(`@/locales/${locale}.json`);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages.default}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Profile Page con SSR y SEO**:
```typescript
// src/app/[locale]/[username]/page.tsx
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/api';
import type { Metadata } from 'next';
import ProfileHeader from '@/components/server/ProfileHeader';
import SectionRenderer from '@/components/server/SectionRenderer';

interface Props {
  params: { username: string; locale: string };
}

// SEO Metadata (Server Component)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);

  if (!profile) return { title: 'Profile Not Found' };

  return {
    title: `${profile.display_name} | Digital Card`,
    description: profile.bio || `View ${profile.display_name}'s digital profile`,
    keywords: profile.tags?.join(', '),
    authors: [{ name: profile.display_name }],

    // Open Graph
    openGraph: {
      title: profile.display_name,
      description: profile.bio,
      url: `https://example.com/${params.username}`,
      siteName: 'Digital Services',
      images: [
        {
          url: profile.avatar_url,
          width: 1200,
          height: 630,
          alt: profile.display_name,
        },
      ],
      locale: params.locale,
      type: 'profile',
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: profile.display_name,
      description: profile.bio,
      images: [profile.avatar_url],
    },

    // JSON-LD Structured Data
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.display_name,
        description: profile.bio,
        image: profile.avatar_url,
        url: `https://example.com/${params.username}`,
      }),
    },
  };
}

// Server Component con SSR
export default async function ProfilePage({ params }: Props) {
  const profile = await getPublicProfile(params.username);

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader profile={profile} />

      <main className="container mx-auto py-8">
        {profile.config.sections.map((section: any, i: number) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </main>
    </div>
  );
}

// ISR: Regenerate popular profiles every 60 seconds
export const revalidate = 60;

// Pre-render top 100 profiles at build time
export async function generateStaticParams() {
  const topProfiles = await getTopProfiles(100);
  return topProfiles.map((profile: any) => ({
    username: profile.username,
  }));
}
```

**API Client con fetch cache**:
```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getPublicProfile(username: string) {
  const res = await fetch(`${API_URL}/api/digital-services/public/${username}/`, {
    next: {
      revalidate: 60,  // ISR: revalidate every 60 seconds
      tags: [`profile-${username}`],  // For on-demand revalidation
    },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  return res.json();
}

export async function getTopProfiles(limit: number = 100) {
  const res = await fetch(`${API_URL}/api/digital-services/top-profiles/?limit=${limit}`, {
    next: { revalidate: 3600 },  // Revalidate every hour
  });

  if (!res.ok) return [];
  return res.json();
}
```

**Dynamic Sitemap**:
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllPublicProfiles } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://example.com';

  const profiles = await getAllPublicProfiles();

  const profileUrls = profiles.map((profile: any) => ({
    url: `${baseUrl}/${profile.username}`,
    lastModified: profile.updated_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...profileUrls,
  ];
}
```

**Package.json**:
```json
{
  "name": "digital-services",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.1.0",
    "next-intl": "^3.9.0",
    "next-themes": "^0.2.1",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

**Deployment (Docker)**:
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

---

## Data Models

### PublicProfile Model

```python
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PublicProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='public_profile')
    username = models.SlugField(unique=True, max_length=50, db_index=True)
    display_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True)  # "Desarrollador Full Stack"
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Privacy
    is_public = models.BooleanField(default=False)

    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    og_image = models.ImageField(upload_to='og-images/', blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'public_profiles'
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['is_public', 'created_at']),
        ]

    def __str__(self):
        return f"{self.display_name} (@{self.username})"
```

### DigitalCard Model

```python
class DigitalCard(models.Model):
    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='digital_card')

    # Contact Info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)  # "Madrid, España"

    # Social Links
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)

    # Theme
    primary_color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    background_color = models.CharField(max_length=7, default='#FFFFFF')

    # QR Code
    qr_code = models.ImageField(upload_to='qr-codes/', blank=True, null=True)

    # Stats (updated by analytics)
    total_views = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'digital_cards'
```

### LandingTemplate Model

```python
class LandingTemplate(models.Model):
    TEMPLATE_CHOICES = [
        ('basic', 'Basic'),
        ('minimal', 'Minimal'),
        ('corporate', 'Corporate'),
        ('creative', 'Creative'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='landing')
    template_type = models.CharField(max_length=20, choices=TEMPLATE_CHOICES, default='basic')

    # Sections (stored as JSON)
    sections = models.JSONField(default=list)  # [{ type: 'hero', props: {...} }, ...]

    # Contact Form Config
    contact_email = models.EmailField(blank=True)
    enable_contact_form = models.BooleanField(default=False)

    # Custom CSS (Professional+)
    custom_css = models.TextField(blank=True)

    # Google Analytics (Professional+)
    ga_tracking_id = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'landing_templates'
```

### PortfolioItem Model

```python
class PortfolioItem(models.Model):
    profile = models.ForeignKey(PublicProfile, on_delete=models.CASCADE, related_name='portfolio_items')

    title = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description_short = models.CharField(max_length=200)
    description_full = models.TextField()  # Supports markdown

    # Images
    cover_image = models.ImageField(upload_to='portfolio/covers/')
    gallery_images = models.JSONField(default=list)  # [{ url: '...', caption: '...' }, ...]

    # Links
    demo_url = models.URLField(blank=True)
    repo_url = models.URLField(blank=True)
    case_study_url = models.URLField(blank=True)

    # Organization
    tags = models.JSONField(default=list)  # ['web', 'react', 'tailwind']
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    # Dates
    project_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'portfolio_items'
        ordering = ['-is_featured', '-project_date']
        indexes = [
            models.Index(fields=['profile', 'is_featured']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title
```

### CVDocument Model

```python
class CVDocument(models.Model):
    LANGUAGE_LEVEL_CHOICES = [
        ('native', 'Native'),
        ('fluent', 'Fluent'),
        ('intermediate', 'Intermediate'),
        ('basic', 'Basic'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='cv')

    # Summary
    professional_summary = models.TextField(max_length=500, blank=True)

    # Experience (stored as JSON for flexibility)
    experience = models.JSONField(default=list)  # [{ company, position, start_date, end_date, responsibilities }, ...]

    # Education
    education = models.JSONField(default=list)  # [{ institution, degree, field, start_date, end_date }, ...]

    # Skills
    skills = models.JSONField(default=list)  # ['Python', 'Django', 'React', ...]

    # Languages
    languages = models.JSONField(default=list)  # [{ language: 'English', level: 'fluent' }, ...]

    # Certifications
    certifications = models.JSONField(default=list)  # [{ title, issuer, date, credential_url }, ...]

    # Template & Config
    template_type = models.CharField(max_length=20, default='classic')
    show_photo = models.BooleanField(default=True)
    show_contact = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cv_documents'
```

### CustomDomain Model (Enterprise)

```python
class CustomDomain(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
    ]

    profile = models.OneToOneField(PublicProfile, on_delete=models.CASCADE, related_name='custom_domain')
    domain = models.CharField(max_length=255, unique=True)

    # DNS Verification
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    verification_token = models.CharField(max_length=64, unique=True)
    last_verification_attempt = models.DateTimeField(null=True, blank=True)

    # SSL
    ssl_status = models.CharField(max_length=20, default='pending')
    ssl_cert_expires_at = models.DateTimeField(null=True, blank=True)

    # Redirect Config
    default_service = models.CharField(max_length=20, default='landing')  # landing, tarjeta, portafolio, cv

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'custom_domains'
```

---

## API Endpoints

### Public Endpoints (No Authentication)

**GET /{service}/{username}**
- **Description**: Render public page for user (SSR)
- **Auth**: None (public)
- **Response**: HTML (Server-Side Rendered)
- **Cache**: Redis 5min + CDN 1h

**Examples:**
- `GET /tarjeta/jsmith`
- `GET /landing/mgarcia`
- `GET /portafolio/alopez`
- `GET /portafolio/alopez/mi-proyecto-web`
- `GET /cv/rperez`

---

### Admin Endpoints (Digital Services Management)

**Base path:** `/api/v1/app/digital-services/`

#### Public Profile

**POST /api/v1/app/digital-services/profile**
- **Description**: Create or update public profile
- **Auth**: JWT required
- **Body**: `PublicProfileSerializer`
- **Response**: `200 OK` with profile data

**GET /api/v1/app/digital-services/profile**
- **Description**: Get authenticated user's public profile
- **Auth**: JWT required
- **Response**: `200 OK` with profile data or `404` if not created

---

#### Digital Card

**POST /api/v1/app/digital-services/tarjeta**
- **Description**: Create or update digital card
- **Auth**: JWT required
- **Body**: `DigitalCardSerializer`
- **Response**: `200 OK` with card data

**GET /api/v1/app/digital-services/tarjeta**
- **Description**: Get authenticated user's digital card
- **Auth**: JWT required
- **Response**: `200 OK` with card data

**POST /api/v1/app/digital-services/tarjeta/generate-qr**
- **Description**: Generate QR code for digital card
- **Auth**: JWT required
- **Response**: `200 OK` with QR image URL

---

#### Landing Page

**POST /api/v1/app/digital-services/landing**
- **Description**: Create or update landing page
- **Auth**: JWT required
- **Body**: `LandingTemplateSerializer`
- **Response**: `200 OK` with landing data

**GET /api/v1/app/digital-services/landing**
- **Description**: Get authenticated user's landing page
- **Auth**: JWT required
- **Response**: `200 OK` with landing data

---

#### Portfolio

**GET /api/v1/app/digital-services/portafolio**
- **Description**: List all portfolio items for authenticated user
- **Auth**: JWT required
- **Response**: `200 OK` with array of items

**POST /api/v1/app/digital-services/portafolio**
- **Description**: Create new portfolio item
- **Auth**: JWT required
- **Body**: `PortfolioItemSerializer`
- **Response**: `201 Created` with item data

**PATCH /api/v1/app/digital-services/portafolio/{id}**
- **Description**: Update portfolio item
- **Auth**: JWT required (owner only)
- **Body**: Partial `PortfolioItemSerializer`
- **Response**: `200 OK` with updated item

**DELETE /api/v1/app/digital-services/portafolio/{id}**
- **Description**: Delete portfolio item
- **Auth**: JWT required (owner only)
- **Response**: `204 No Content`

---

#### CV Digital

**POST /api/v1/app/digital-services/cv**
- **Description**: Create or update CV
- **Auth**: JWT required
- **Body**: `CVDocumentSerializer`
- **Response**: `200 OK` with CV data

**GET /api/v1/app/digital-services/cv**
- **Description**: Get authenticated user's CV
- **Auth**: JWT required
- **Response**: `200 OK` with CV data

**POST /api/v1/app/digital-services/cv/export-pdf**
- **Description**: Generate and download CV as PDF (Professional+)
- **Auth**: JWT required
- **Feature Gate**: Professional+
- **Response**: PDF file download

---

#### Analytics

**GET /api/v1/app/digital-services/analytics/{service}**
- **Description**: Get analytics for specific service
- **Auth**: JWT required
- **Feature Gate**: Starter+
- **Query Params**: `days` (7, 30, 90)
- **Response**: `200 OK` with analytics data

---

#### Custom Domain (Enterprise)

**POST /api/v1/app/digital-services/custom-domain**
- **Description**: Configure custom domain
- **Auth**: JWT required
- **Feature Gate**: Enterprise
- **Body**: `{ domain: 'example.com', default_service: 'landing' }`
- **Response**: `200 OK` with verification instructions

**POST /api/v1/app/digital-services/custom-domain/verify**
- **Description**: Verify DNS configuration
- **Auth**: JWT required
- **Response**: `200 OK` with verification status

---

## URL Patterns

### Standard URLs

```
# Tarjeta Digital
https://domain.com/tarjeta/{username}

# Landing Page
https://domain.com/landing/{username}

# Portafolio
https://domain.com/portafolio/{username}
https://domain.com/portafolio/{username}/{project-slug}

# CV Digital
https://domain.com/cv/{username}
```

### Custom Domain (Enterprise)

```
# Dominio personalizado apunta a servicio default
https://juansmith.com  →  https://domain.com/landing/jsmith

# Subdominios para servicios específicos
https://cv.juansmith.com  →  https://domain.com/cv/jsmith
https://portfolio.juansmith.com  →  https://domain.com/portafolio/jsmith
```

---

## Template System

### Template Structure

Cada template se define como configuración JSON con array de secciones:

```json
{
  "template_type": "minimal",
  "sections": [
    {
      "type": "hero",
      "visible": true,
      "props": {
        "title": "Hola, soy Juan Smith",
        "subtitle": "Desarrollador Full Stack especializado en Angular y Django",
        "cta_text": "Ver mis proyectos",
        "cta_link": "#portfolio",
        "background_image": "/uploads/hero-bg.jpg"
      }
    },
    {
      "type": "about",
      "visible": true,
      "props": {
        "title": "Sobre mí",
        "content": "Desarrollador con 5 años de experiencia...",
        "image": "/uploads/about-photo.jpg",
        "image_position": "right"
      }
    },
    {
      "type": "services",
      "visible": true,
      "props": {
        "title": "Servicios",
        "items": [
          {
            "icon": "code",
            "title": "Desarrollo Web",
            "description": "Aplicaciones web modernas con Angular y React"
          },
          {
            "icon": "mobile",
            "title": "Apps Móviles",
            "description": "Aplicaciones nativas para iOS y Android"
          }
        ]
      }
    }
  ]
}
```

### Available Section Types

- **hero**: Cabecera principal con título, subtítulo, CTA, background image
- **about**: Sección "Sobre mí" con texto y foto
- **services**: Grid de servicios con íconos
- **portfolio**: Galería de proyectos destacados
- **testimonials**: Testimonios de clientes (Professional+)
- **contact**: Formulario de contacto
- **footer**: Footer con links y redes sociales

---

## SEO Strategy

### On-Page SEO

1. **Meta Tags**: Title, description, Open Graph, Twitter Cards generados automáticamente
2. **Semantic HTML**: Uso de tags semánticos (`<header>`, `<main>`, `<article>`, `<section>`)
3. **Headings Hierarchy**: H1 único, H2-H6 estructurados correctamente
4. **Alt Text**: Imágenes con alt descriptivo
5. **Internal Linking**: Links entre servicios del mismo usuario

### Technical SEO

1. **Sitemap.xml**: Generado dinámicamente, actualizado cada 24h
2. **Robots.txt**: Configurable por usuario
3. **Structured Data**: JSON-LD para Person, Organization, CreativeWork
4. **Mobile-Friendly**: Responsive design, viewport meta tag
5. **Page Speed**: SSR + caching = TTFB <200ms, LCP <2.5s
6. **HTTPS**: SSL obligatorio para todas las páginas

### Content SEO

1. **Unique Content**: Cada perfil tiene contenido único (no duplicado)
2. **Rich Content**: Imágenes optimizadas, markdown para texto enriquecido
3. **Keywords**: Meta keywords (opcional), basados en bio y título

---

## Timeline

### Fase 5: Digital Services (10 semanas)

---

#### Sprint 33-34: SSR Infrastructure (4 semanas)

**Backend (Django):**
- [ ] Implementar modelos: `PublicProfile`, `DigitalCard`, `PortfolioItem`, `CVDocument`
- [ ] Migrations con indexes optimizados
- [ ] Serializers para todos los modelos
- [ ] Endpoints admin: CRUD para cada servicio
- [ ] Public API endpoints (no auth): `GET /{service}/{username}`
- [ ] Validación de username único con sugerencias
- [ ] Post-save hooks para invalidar cache Redis

**Frontend SSR (Next.js App Router):**
- [ ] Setup Next.js 14+ con App Router
- [ ] Configurar Express server con `@nguniversal/express-engine`
- [ ] Integración con Redis para caching
- [ ] Componentes base: `DigitalCardComponent`, `LandingPageComponent`, `PortfolioComponent`, `CVComponent`
- [ ] 1 template básico por servicio
- [ ] Service para meta tags (SEO)
- [ ] TransferState para evitar duplicate API calls

**DevOps:**
- [ ] Deploy SSR service en servidor Node separado
- [ ] Nginx reverse proxy: `/tarjeta/*` → SSR, `/api/*` → Django
- [ ] Redis setup con replication
- [ ] Monitoring: latencia SSR, cache hit rate

**Milestones:**
- Week 33: Modelos + API backend completos
- Week 34: SSR funcional con 1 template por servicio

---

#### Sprint 35-36: Tarjeta Digital + Landing Page (3 semanas)

**Tarjeta Digital:**
- [ ] Editor de tarjeta en panel cliente (React + Vite SPA)
- [ ] Campos: info de contacto, redes sociales, colores del tema
- [ ] Preview en tiempo real
- [ ] Generación de QR code (backend con qrcode library)
- [ ] Export vCard (Starter+)
- [ ] Analytics básicas: views, unique visitors
- [ ] 3 templates: Classic, Minimal, Modern

**Landing Page:**
- [ ] Selector de templates (Free: 1, Starter: 3)
- [ ] Editor de secciones con drag & drop
- [ ] Secciones: Hero, About, Services, Portfolio, Contact
- [ ] Rich text editor para About (markdown support)
- [ ] Formulario de contacto con anti-spam (reCAPTCHA)
- [ ] Configuración de SEO: meta title, description, OG image
- [ ] Preview responsive (mobile/tablet/desktop)

**Testing:**
- [ ] Unit tests: serializers, validators
- [ ] Integration tests: endpoints CRUD
- [ ] E2E tests: Crear tarjeta → Publicar → Verificar URL pública

**Milestones:**
- Week 35: Tarjeta digital completa con QR
- Week 37: Landing page con 3 templates y editor

---

#### Sprint 37-38: Portafolio + CV Digital (3 semanas)

**Portafolio:**
- [ ] CRUD de proyectos: título, descripción, imágenes, tags, links
- [ ] Upload de imágenes con drag & drop
- [ ] Galería con lightbox
- [ ] Filtrado por tags (client-side)
- [ ] Proyectos destacados (max 3)
- [ ] Drag & drop para reordenar proyectos
- [ ] Analytics: clicks en demo, repo, por proyecto
- [ ] Página individual de proyecto: `/portafolio/{username}/{slug}`

**CV Digital:**
- [ ] Auto-población desde perfil del usuario
- [ ] Formularios para: Experiencia, Educación, Habilidades, Idiomas, Certificaciones
- [ ] Validación de fechas (end_date >= start_date)
- [ ] Templates: Classic, Modern, Minimal
- [ ] Export PDF (Professional+) con wkhtmltopdf o Puppeteer
- [ ] Múltiples versiones de CV guardables
- [ ] Toggle para mostrar/ocultar secciones

**Testing:**
- [ ] PDF generation tests
- [ ] Image upload and compression tests
- [ ] Analytics tracking tests

**Milestones:**
- Week 38: Portafolio con proyectos ilimitados
- Week 40: CV con export PDF funcional

---

#### Sprint 39-40: Analytics + Custom Domains (2 semanas)

**Analytics:**
- [ ] Modelo `ServiceAnalytics`: service, date, views, unique_visitors, clicks
- [ ] Tracking de views con cookies/sessions (no duplicar owner)
- [ ] Endpoint: `GET /api/v1/app/digital-services/analytics/{service}?days=30`
- [ ] Dashboard en panel cliente: gráficos de vistas por día
- [ ] Clicks en enlaces: LinkedIn, GitHub, demo, repo
- [ ] Export CSV (Professional+)

**Custom Domains (Enterprise):**
- [ ] Modelo `CustomDomain`: domain, verification_status, ssl_status
- [ ] Formulario de configuración con instrucciones DNS
- [ ] Celery task: verificar DNS cada 30 min
- [ ] Integración con Let's Encrypt (certbot)
- [ ] Provisión SSL automática tras validación DNS
- [ ] Configuración de redirecciones: domain → default_service
- [ ] Soporte para subdominios

**SEO Final:**
- [ ] Sitemap.xml dinámico: `/sitemap.xml`
- [ ] Robots.txt configurable
- [ ] Structured data (JSON-LD): Person, Organization, CreativeWork
- [ ] Meta tags testing con Facebook Debugger, Twitter Card Validator

**Feature Gates:**
- [ ] Validar límites por plan en todos los endpoints
- [ ] UpgradePrompt en frontend para features bloqueadas

**Milestones:**
- Week 41: Analytics completas con gráficos
- Week 42: Custom domains funcionales con SSL

---

### Total Timeline Phase 5

**10 semanas totales:**
- Week 33-36: Infrastructure + Tarjeta + Landing (4 weeks)
- Week 37-40: Portafolio + CV (4 weeks)
- Week 41-42: Analytics + Custom Domains (2 weeks)

**Key Milestones:**
- Week 37: **Alpha** - SSR + Tarjeta + Landing funcionando
- Week 39: **Beta** - Portafolio + CV con export PDF
- Week 42: **Launch** - Analytics + Custom Domains + SEO completo

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Use Cases](../requirements/use-cases.md)
- [➡️ Ver User Stories](../requirements/user-stories.md)
- [➡️ Ver Functional Requirements](../requirements/functional-requirements.md)
- [➡️ Ver Architecture](../technical/architecture.md)

---

**Última actualización**: 2026-02-12
