# Footer Administrable — Hub de Servicios

**Fecha:** 2026-06-22  
**Estado:** ✅ Implementado y en producción  
**Área:** Backend Django · Frontend Admin Panel · Frontend Hub (Next.js)

---

## Contexto

El footer de todas las landing pages del Hub era un bloque JSX inline minimal (solo logo + copyright). Se requería:

1. Un footer elaborado con 3 columnas compartido entre todas las páginas.
2. Que su contenido (redes sociales, contacto, enlaces) sea editable desde el Admin Panel sin tocar código.
3. Persistencia en base de datos con una API pública y una API de administración.

---

## Nuevas landing pages previas (mismo sprint)

Antes del footer se crearon 2 nuevas landing pages en `frontend_next_hub`:

| Ruta | Página |
|------|--------|
| `/digital-design` | Diseño Gráfico Digital |
| `/aprende-inteligencia-artificial` | Capacitación en Inteligencia Artificial |

Adicionalmente se agregó en la página de inicio (`/`):
- Sección **"Otros Servicios"** con 5 cards que enlazan a cada landing page.
- Link **"Servicios"** en el navbar.

---

## Arquitectura implementada

### Capa 1 — Backend Django: nueva app `apps/site_config/`

#### Modelos

```python
class FooterConfig(models.Model):
    tagline       = CharField(max_length=200, blank=True, default='')
    email         = EmailField(blank=True, default='')
    whatsapp      = CharField(max_length=30, blank=True, default='')
    phone         = CharField(max_length=30, blank=True, default='')
    facebook_url  = URLField(blank=True, default='')
    instagram_url = URLField(blank=True, default='')
    youtube_url   = URLField(blank=True, default='')
    linkedin_url  = URLField(blank=True, default='')
    updated_at    = DateTimeField(auto_now=True)

class FooterLink(models.Model):
    config = ForeignKey(FooterConfig, on_delete=CASCADE, related_name='links')
    label  = CharField(max_length=100)
    url    = CharField(max_length=200)
    order  = PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
```

**Patrón singleton:** siempre se usa `FooterConfig.objects.get_or_create(pk=1)` — una sola fila en BD.

#### Endpoints

| Método | URL | Auth | Descripción |
|--------|-----|------|-------------|
| `GET` | `/api/v1/public/footer` | Ninguna | Footer completo (Hub) |
| `GET` | `/api/v1/admin/footer/` | Staff | Footer completo (Admin) |
| `PUT` | `/api/v1/admin/footer/` | Staff | Actualizar tagline + contacto + redes |
| `POST` | `/api/v1/admin/footer/links/` | Staff | Crear enlace |
| `PATCH` | `/api/v1/admin/footer/links/{id}/` | Staff | Editar label/url/order |
| `DELETE` | `/api/v1/admin/footer/links/{id}/` | Staff | Eliminar enlace |

#### Archivos creados

```
apps/site_config/
├── __init__.py
├── apps.py
├── models.py
├── serializers.py
├── views.py
├── urls.py            # admin routes
├── public_urls.py     # public route
├── admin.py
└── migrations/
    └── 0001_initial.py
```

#### Archivos modificados

- `config/settings/base.py` — añadido `'apps.site_config'` a `LOCAL_APPS`
- `config/urls.py` — añadidos includes para rutas admin y pública

---

### Capa 2 — Frontend Hub (`frontend_next_hub`)

#### Componente compartido `LandingFooter`

Archivo: `components/shared/LandingFooter.tsx`

Layout de 3 columnas:

| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|
| Logo + Nombre | Servicios (links) | Contacto |
| Tagline | — | Email (mailto) |
| Iconos sociales FB/IG/YT/LI | — | WhatsApp (wa.me) |
| — | — | Teléfono (tel) |

- Fondo: `bg-[#0B2740]` (mismo color corporativo)
- Campos vacíos no renderizan su sección
- Skeleton de 3 columnas con `animate-pulse` mientras carga
- Barra inferior: copyright con año dinámico

#### Hook de datos

Archivo: `features/footer/hooks/useFooterConfig.ts`

```ts
useQuery({
  queryKey: ['footer-config'],
  queryFn: () => publicClient.get<FooterConfig>('/public/footer').then(r => r.data),
  staleTime: 10 * 60 * 1000,  // 10 minutos
})
```

> **Nota técnica:** URL sin trailing slash (`/public/footer`) porque el proxy de Next.js en `next.config.ts` añade `/` automáticamente en el destino. Con trailing slash se generaba doble `//` → Django 404.

#### Páginas actualizadas

El footer inline fue reemplazado por `<LandingFooter />` en las 6 páginas:

- `features/landing/LandingPageClient.tsx` (home `/`)
- `features/automatizaciones/AutomatizacionesPage.tsx`
- `features/marketing-digital/MarketingDigitalPage.tsx`
- `features/paginas-web/PaginasWebPage.tsx`
- `features/digital-design/DigitalDesignPage.tsx`
- `features/aprende-inteligencia-artificial/AprendeIAPage.tsx`

---

### Capa 3 — Admin Panel (`frontend_admin`)

#### Nueva sección "Footer del Hub"

Ruta: `/footer` · Sidebar: grupo **SYSTEM**

Interfaz con 4 cards editables:

| Card | Campos |
|------|--------|
| **Identidad** | Tagline (texto libre) |
| **Información de Contacto** | Email, WhatsApp, Teléfono |
| **Redes Sociales** | Facebook, Instagram, YouTube, LinkedIn (URLs) |
| **Enlaces del Footer** | Lista inline editable con ↑↓ y eliminar |

**UX de enlaces:**
- Edición inline con `onBlur` → PATCH inmediato al backend
- Reordenamiento con botones ↑ / ↓ (swap de `order`)
- "Agregar enlace" → POST + aparece inmediatamente en lista
- Eliminar con icono papelera

**Botón "Guardar cambios":** guarda tagline + contacto + redes con PUT. Muestra "¡Guardado!" 3 segundos.

#### Archivos creados

```
src/features/footer/
├── types.ts
├── FooterPage.tsx
└── hooks/
    ├── useFooterConfig.ts
    └── useFooterMutations.ts      # useUpdateFooter, useCreateLink, useUpdateLink, useDeleteLink
src/pages/FooterPage.tsx           # re-export wrapper
```

#### Archivos modificados

- `src/router/index.tsx` — ruta lazy `{ path: 'footer', ... }`
- `src/layouts/components/Sidebar.tsx` — item "Footer del Hub" con icono `PanelBottom`

---

## Bugs encontrados y corregidos durante la prueba

### Bug 1 — Formulario Admin se reseteaba al agregar enlaces

**Síntoma:** Al hacer clic en "Agregar enlace", los campos del formulario (tagline, email, redes sociales) se vaciaban antes de guardar.

**Causa:** El `useEffect(() => { if (footer) reset(footer) }, [footer, reset])` se ejecutaba en cada invalidación del cache de React Query. Al crear un enlace, el hook `useCreateLink` invalida `['admin-footer']`, dispara un refetch, y el effect volvía a ejecutar `reset()` pisando los valores no guardados.

**Fix:** Añadido `useRef` para inicializar el formulario solo una vez:
```ts
const formInitialized = useRef(false)
useEffect(() => {
  if (footer && !formInitialized.current) {
    reset(footer)
    formInitialized.current = true
  }
}, [footer, reset])
```

### Bug 2 — Footer Hub devolvía 404

**Síntoma:** `GET /api/v1/public/footer/` → 404.

**Causa raíz 1 — Doble trailing slash:** El proxy de Next.js (`next.config.ts`) tiene la regla:
```js
{ source: '/api/:path*', destination: `${API_TARGET}/api/:path*/` }
```
Al enviar `/api/v1/public/footer/` (con slash), el `path*` captura `v1/public/footer/` y el destino añade otra `/`, resultando en `/api/v1/public/footer//` — Django no encuentra la URL.

**Fix:** Cambiar la URL del hook a `/public/footer` (sin trailing slash). El proxy añade el `/` correcto.

**Causa raíz 2 — Servidor Django sin recargar:** El archivo `config/urls.py` fue modificado para incluir `apps.site_config.public_urls`, pero el contenedor Django estaba en ejecución con la versión anterior cacheada en memoria. Django no detectó el cambio automáticamente en el entorno Docker.

**Fix:** `docker-compose restart django` para recargar todos los módulos de Python.

---

## Datos de prueba cargados (QA)

Cargados desde el Admin Panel → Footer del Hub:

| Campo | Valor |
|-------|-------|
| Tagline | Soluciones digitales para empresas y emprendedores |
| Email | hola@hubdeservicios.com |
| WhatsApp | +51987654321 |
| Teléfono | +51 1 234 5678 |
| Facebook | https://facebook.com/hubdeservicios |
| Instagram | https://instagram.com/hubdeservicios |
| YouTube | https://youtube.com/@hubdeservicios |
| LinkedIn | https://linkedin.com/company/hubdeservicios |

**Enlaces configurados:**

| Label | URL |
|-------|-----|
| Inicio | / |
| Marketing Digital | /marketing-digital |
| Páginas Web | /paginas-web |
| Automatizaciones | /automatizaciones |
| Diseño Gráfico | /digital-design |

---

## Resultado final

- ✅ Footer 3 columnas visible en las 6 landing pages del Hub
- ✅ Datos editables desde Admin Panel sin tocar código
- ✅ API pública sin autenticación (accesible por cualquier visitante)
- ✅ Iconos sociales aparecen solo si tienen URL configurada
- ✅ Secciones de contacto y enlaces ocultas si están vacías
- ✅ Skeleton de carga mientras llega la respuesta de la API
- ✅ Verificado en producción
