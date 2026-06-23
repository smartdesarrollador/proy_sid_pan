# EVAL-04 — Crear una app Django nueva siguiendo convenciones

**Skill objetivo:** convenciones del proyecto / `CLAUDE.md` (y validará un futuro skill `new-django-app`)
**Tipo:** scaffold
**Qué mide:** que el agente cree una app backend nueva con la estructura y el cableado correctos, sin olvidar los pasos que causaron bugs en el pasado (registro de URLs, permisos sembrados).

## Prompt (pegar tal cual en una sesión NUEVA del repo)

> Crea una nueva app Django `announcements` en `apps/backend_django` para que un admin publique anuncios (título, cuerpo, publicado sí/no, fecha). Debe tener endpoints públicos de solo lectura (`/api/v1/public/announcements/`) y endpoints admin para CRUD (`/api/v1/admin/announcements/`). Sigue las convenciones del proyecto.

## Rúbrica (puntuar cada ítem: ✅1 / 🟡0.5 / ❌0 → total /10)

- [ ] Modelo hereda de `BaseModel` (UUID PK + timestamps) de `core/models.py`.
- [ ] Estructura de app consistente con las existentes (`models.py`, `serializers.py`, `views.py`, `urls.py`/`public_urls.py`/`admin_urls.py`, `migrations/`).
- [ ] Registró la app en `INSTALLED_APPS` (`config/settings/base.py`, `LOCAL_APPS`).
- [ ] Registró las rutas en `config/urls.py` (include de las URLs admin y pública).
- [ ] URLs **con trailing slash** consistentes con el resto del backend.
- [ ] Vista pública con `AllowAny`; vistas admin con permiso/`IsAdminUser` adecuado.
- [ ] Si usó un permiso RBAC nuevo (`announcements.manage`/`...`), recordó **añadirlo al fixture `seed_permissions`** (si no, da 403 → LL-061).
- [ ] Mencionó correr `make makemigrations` + `make migrate`.
- [ ] Recordó **reiniciar Django** tras tocar `urls.py`/settings (`docker-compose restart django` → LL-020), o que el cambio no se ve sin recargar.
- [ ] No introdujo secretos hardcodeados (sigue `.claude/rules/security.md`).

## Señales de fallo (qué revisar si puntúa bajo → observability ligera)

- Olvidó registrar la app en `INSTALLED_APPS` o las URLs en `config/urls.py` → causa típica de 404 (LL-020). Candidato a crear el skill `new-django-app`.
- No añadió el permiso al fixture → 403 silencioso (LL-061).
- No mencionó migraciones ni reinicio de Django → reforzar el checklist backend.
- Estructura inconsistente con apps existentes (ej. `contact`, `site_config`) → señal de que faltaría un skill de scaffold backend.

## Cómo correrlo

1. Sesión nueva de Claude Code en la raíz del repo.
2. Pegar el Prompt.
3. Marcar la rúbrica y sumar el puntaje.
4. Anotar fecha + puntaje en [`RESULTS.md`](RESULTS.md).

> Nota: hoy esta eval mide las **convenciones** (vía `CLAUDE.md` + `lessons-learned`). Si más adelante
> se crea el skill `new-django-app`, esta misma eval sirve para verificar que ese skill mejora el puntaje.
