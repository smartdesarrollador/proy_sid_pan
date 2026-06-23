# Formulario de Contacto público con reCAPTCHA v3 + Panel Admin

**Fecha:** 2026-06-22
**Apps afectadas:** `backend_django` (nueva app `apps/contact`), `frontend_next_hub`, `frontend_admin`

## Qué se implementó

Sección "Contáctanos" en la landing del Hub (`digisider.com`) con:
- Formulario (nombre, email, teléfono opcional, mensaje) validado con `react-hook-form` + `zod`.
- Protección anti-spam con **reCAPTCHA v3 invisible** (`react-google-recaptcha-v3`).
- Al enviar: se guarda en BD (`contact_messages`) y se envía email de confirmación al usuario.
- Panel "Mensajes de Contacto" en Admin Panel para listar, filtrar y gestionar el estado (`new` → `read` → `archived`).

## Backend — `apps/contact/`

- `ContactMessage(BaseModel)`: name, email, phone, message, status (db_index), ip_address.
- `PublicContactView` (`AllowAny`): valida → verifica reCAPTCHA → crea registro → email → 201.
- `AdminContactListView` / `AdminContactDetailView` (`IsAdminUser`): GET con filtros `?status=&search=`, PATCH de estado.
- `_verify_recaptcha`: POST a Google `siteverify`, exige `success` y `score >= RECAPTCHA_MIN_SCORE` (0.5). Sin `RECAPTCHA_SECRET_KEY` configurada → permite (modo dev). Loguea `error-codes` y score cuando rechaza.
- Settings: `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_VERIFY_URL`, `RECAPTCHA_MIN_SCORE`.
- URLs: `POST /api/v1/public/contact/`, `GET /api/v1/admin/contact/`, `PATCH /api/v1/admin/contact/<uuid>/`.

## Frontend Hub

- `ContactSection.tsx` con `useGoogleReCaptcha().executeRecaptcha('contact_form')` al enviar.
- `GoogleReCaptchaProvider` en `app/providers.tsx` con `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
- `useSubmitContact` → `POST /public/contact/` (con trailing slash).

## Admin Panel

- `src/features/contact/` con tipos, hooks (`useContactMessages`, `useUpdateContactStatus`), `ContactStatusBadge`, `ContactDetailPanel`, `ContactPage`.
- Ruta `/contact` + ítem "Mensajes de Contacto" (icono `Mail`) en grupo System del Sidebar.

## El problema difícil: reCAPTCHA funcionaba en local pero no en producción

Cadena de bugs encontrados y resueltos en orden:

1. **`POST 405` en producción** — el Hub en prod llama directo a `api-rbac.digisider.com` (sin pasar por el proxy de Next.js). El POST sin trailing slash provocaba redirect 301 de Django → el navegador lo convertía en GET → 405.
   **Fix:** trailing slash en el hook (`/public/contact/`).

2. **`recaptcha_token: "dev"` → `400 recaptcha_failed`** — el site key llegaba **vacío** al bundle de producción, así que `executeRecaptcha` quedaba `undefined` y el form enviaba el token de fallback `"dev"`, que Google rechazaba.

3. **Causa raíz del site key vacío** (cadena completa de entrega de la env var):
   - Dokploy inyecta las variables **solo en build time** vía build-args, no en runtime → un enfoque server-side / `force-dynamic` nunca pudo leerla.
   - La var necesita prefijo **`NEXT_PUBLIC_`** para que Next.js la incruste en el bundle del navegador.
   - El **`docker-compose.dokploy.yml`** (que Dokploy usa) solo pasa al build los `args` listados explícitamente — y `RECAPTCHA_SITE_KEY` **no estaba en la lista**. Por eso `NEXT_PUBLIC_API_URL` sí funcionaba y la de reCAPTCHA no.

   **Fix final (cadena de 4 eslabones):**
   1. Dokploy env: `RECAPTCHA_SITE_KEY` (ya existía).
   2. `docker-compose.dokploy.yml` → agregar `args: RECAPTCHA_SITE_KEY: ${RECAPTCHA_SITE_KEY:-}`.
   3. `Dockerfile` → `ARG RECAPTCHA_SITE_KEY` + `ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${RECAPTCHA_SITE_KEY}` (mapeo sin prefijo → con prefijo).
   4. Código → lee `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

   Logs `console.log` temporales en `ContactSection` confirmaron en la consola del navegador de producción que la key pasó de vacía a presente y `executeRecaptcha` de `false` a `true`. Logs removidos tras confirmar.

## Lección clave / deuda evitada

Para variables `NEXT_PUBLIC_*` en frontends Next.js desplegados con Dokploy: deben declararse en **tres lugares** además del env de Dokploy → `build.args` del `docker-compose.dokploy.yml`, `ARG`/`ENV` en el `Dockerfile`, y leerse con el prefijo `NEXT_PUBLIC_` en el código. Son build-time, no runtime.

## Verificación en producción

- Badge de reCAPTCHA visible en la esquina inferior derecha.
- Envío del formulario → "¡Mensaje enviado!" (201).
- Email de confirmación recibido por el usuario.
- Registro guardado en `contact_messages` y visible en el panel Admin.
