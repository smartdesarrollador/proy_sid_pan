# Vista Digital: branding "Digisider" en pies de página + PWA instalable

**Fecha:** 2026-07-03
**App:** `apps/frontend_next_vista`

## Contexto

Dos pedidos encadenados sobre las 4 vistas públicas de Vista Digital (`tarjeta`, `landing`,
`portafolio`, `cv`):

1. Ajustes visuales puntuales en la Tarjeta Digital pública (capturas de referencia): subir un
   poco la tarjeta en mobile, y reemplazar el pie de página "Creado con Vista Digital" por un
   link a **Digisider** (`digisider.com`). Extendido después a las otras 3 vistas (mismo pie de
   página compartido).
2. Pregunta exploratoria del usuario: ¿se puede instalar el link compartido de una tarjeta/
   landing/portafolio/cv **como si fuera una app nativa** (ícono propio, ventana standalone)?
   Respondida con la opción de una **PWA instalable por tenant** — implementada tras aprobación
   de un plan dedicado.

## Decisiones de diseño

**Branding del pie de página:**
- Reemplazo literal del texto por un link `<a href="https://digisider.com" target="_blank">` —
  sin nueva traducción i18n (se retiró la clave `poweredBy` de `next-intl` donde ya no se
  necesitaba, en vez de mantenerla sin usar).
- `PublicLandingFooter` y `PortfolioFooter` perdieron la prop `poweredByText` (antes inyectada
  por cada página vía `t('poweredBy')`) — al ser siempre el mismo contenido ahora, no tenía
  sentido seguir parametrizándolo.

**PWA multi-tenant:**
- Next.js 15 **no permite** el archivo especial `manifest.ts` dentro de un segmento dinámico
  (`isRootLayoutOrRootPage` lo gatea a la raíz real de la app) — se resolvió con un **Route
  Handler propio** (`[username]/manifest/route.ts`) en cada una de las 4 rutas, generando el
  manifest en base al perfil/color del tenant.
- Los archivos especiales `icon.tsx`/`apple-icon.tsx` sí son anidables por segmento dinámico
  (igual que `opengraph-image.tsx`, ya existente) — se usó ese patrón nativo para favicon/apple-
  touch-icon, más un `icon-512/route.ts` explícito (URL predecible) referenciado a mano dentro
  del manifest JSON, ya que Next no expone una URL determinística de `icon.tsx` para poder
  citarla desde otro archivo.
- Ícono con **fallback a iniciales** sobre el color de marca del tenant cuando no hay avatar
  (a diferencia de la imagen OG existente, que simplemente omite la imagen si no hay avatar —
  un ícono de instalación no puede quedar vacío). Con ~28% de padding de "safe zone" para
  cumplir `purpose: "maskable"` de Android.
- **Service Worker deliberadamente sin caché** — decisión explícita confirmada con el usuario
  (ver pregunta de alcance offline): el único propósito es cumplir el criterio de instalabilidad
  de Chrome (requiere un service worker con handler de `fetch`), no ofrecer modo offline. Cachear
  el contenido dinámico por tenant arriesgaría mostrar tarjetas/landings desactualizadas tras una
  edición.
- **Un solo ícono 512×512** (`purpose: "any maskable"`) en vez de 192+512 — ya cumple el mínimo
  de instalabilidad de Chrome (≥192px), evita duplicar renderizados sin beneficio real.
- **`portafolio/[username]/layout.tsx` nuevo** (en vez de duplicar metadata en `page.tsx` y
  `[slug]/page.tsx`) — ambas sub-rutas comparten el mismo scope/manifest/service-worker
  (misma "app" instalada), Next mergea metadata de layout con la del `page.tsx` hijo.

## Cambios

### Branding del footer

- `src/app/[locale]/tarjeta/[username]/page.tsx` — footer reemplazado por link a Digisider;
  además se subió la tarjeta en mobile reduciendo padding vertical de `header`/`main`
  (`py-4`→`py-2`, `py-6`→`pt-2` en el top, solo en breakpoint mobile).
- `src/components/landing/PublicLandingFooter.tsx` — quitada prop `poweredByText`, texto fijo
  "Creado con **Digisider**" (link).
- `src/components/portfolio/PortfolioFooter.tsx` — quitada prop `poweredByText`, link "Digisider".
- `src/app/[locale]/landing/[username]/page.tsx`, `portafolio/[username]/page.tsx`,
  `portafolio/[username]/[slug]/page.tsx`, `cv/[username]/page.tsx` — dejaron de pasar/usar
  `t('poweredBy')`; el de `[slug]` pasó a renderizar el link directamente.

### PWA instalable (nuevo, 4 rutas)

**Helpers compartidos:**
- `src/lib/pwa/profileIcon.tsx` — `renderProfileIcon()`, `ImageResponse` de `next/og` con
  avatar (o iniciales) sobre color de marca.
- `src/components/shared/PwaInstallRegister.tsx` — client component, registra `/sw.js` con
  `scope` propio por tenant.
- `public/sw.js` — service worker mínimo (`install`→`skipWaiting`, `activate`→`clients.claim`,
  `fetch`→passthrough de red, sin caché).

**Por cada una de las 4 rutas** (`tarjeta`, `landing`, `portafolio`, `cv`), bajo `[username]/`:
- `manifest/route.ts` — manifest JSON per-tenant (`name`, `short_name`, `theme_color` según
  color de marca de esa feature, `scope`/`start_url`/`id` = ruta del tenant, ícono 512).
- `icon-512/route.ts` — PNG 512×512 referenciado por el manifest.
- `icon.tsx` / `apple-icon.tsx` — favicon 32×32 y apple-touch-icon 180×180 (convención nativa
  de Next, wired automáticamente al `<head>`).
- `page.tsx` (o `layout.tsx` en portafolio) — nuevo `generateViewport` (theme-color), `manifest`
  + `appleWebApp` en `generateMetadata`, y `<PwaInstallRegister scope="..." />` en el JSX.

Resolución de color de marca por feature: tarjeta → `digital_card.primary_color`; landing →
`landing.accent_color ?? landing.theme_colors?.hero_bg`; portafolio →
`digital_card?.primary_color ?? theme_colors?.accent`; cv → `cv.accent_color`. Todas con
fallback `#3B82F6`.

## Estado de tests / verificación

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` | ✓ sin errores nuevos (1 error preexistente no relacionado en `WelcomeBanner.tsx`) |
| `npx jest` | 57/59 ✓ (2 fallos preexistentes en `CardEditor.test.tsx`, no relacionados — confirmado antes de estos cambios) |
| Manifest por tenant (`curl` contra contenedor dev real, username `empresa15`) | Las 4 rutas devuelven JSON correcto (nombre/color/ícono) con `Content-Type: application/manifest+json` |
| Ícono `icon-512` | Las 4 rutas devuelven PNG 512×512 real |
| `<head>` de página | `<link rel="manifest">`, `meta theme-color`, `meta mobile-web-app-capable`, `meta apple-mobile-web-app-title`, favicon y apple-touch-icon confirmados en tarjeta (y manifest link confirmado también en portafolio, vía el `layout.tsx` nuevo) |
| `sw.js` | 200, `Content-Type: application/javascript` |

No se agregaron tests automatizados nuevos para los Route Handlers de manifest/ícono ni para
`PwaInstallRegister` (ver deuda técnica).

## Deuda técnica / ideas para después

- **Sin test automatizado de los nuevos Route Handlers (`manifest/route.ts`, `icon-512/route.ts`)
  ni de `PwaInstallRegister`** — verificado solo manualmente vía `curl` contra el contenedor real.
- **Verificar instalación real en navegador (Lighthouse/`beforeinstallprompt`) fuera de este
  entorno** — la verificación de esta sesión fue vía `curl` (HTTP plano, no valida "secure
  context"). `navigator.serviceWorker` solo está disponible en contextos seguros: `localhost`/
  `127.0.0.1` califican sin HTTPS, pero el hostname de desarrollo habitual del proyecto
  (`next-vista.local.test`, mapeado a `127.0.0.1` vía hosts) **no** — Chrome no lo reconoce como
  seguro solo por resolver a loopback. Para probar el botón "Instalar app" real: usar
  `http://localhost:3004` directo, o el dominio de producción una vez desplegado (HTTPS).
- **Sin ícono 192×192 adicional** (decisión de alcance deliberada, un solo 512 con
  `purpose: "any maskable"" ya cumple el mínimo de Chrome) — agregar si en el futuro se detecta
  algún launcher/plataforma que prefiera explícitamente 192.
- **Sin caching offline** (decisión confirmada con el usuario) — si más adelante se quiere que
  abra "algo" sin conexión, es trabajo aparte: cachear el app-shell (no el contenido dinámico
  del tenant, para evitar mostrar datos desactualizados).

## Resultado

Las 4 vistas públicas de Vista Digital ahora atribuyen a **Digisider** (link a `digisider.com`)
en vez de "Vista Digital", y son **instalables como PWA por tenant**: cada tarjeta/landing/
portafolio/cv genera su propio manifest, ícono (avatar o iniciales sobre su color de marca) y
scope aislado, de forma que instalar la de un tenant no interfiere con la de otro en el mismo
dominio. Confirmado end-to-end contra un tenant real (`empresa15`) sirviendo desde el contenedor
de desarrollo.
