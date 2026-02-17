# Productivity Services

[⬅️ Volver al README](../README.md)

---

## Índice
- [Notas](#notas)
- [Contactos](#contactos)
- [Bookmarks](#bookmarks)

---

## Notas

### Descripción
Sistema de notas rápidas con soporte de categorías, colores, pin y búsqueda. Permite a los usuarios capturar ideas, apuntes y referencias de forma organizada dentro de su espacio de trabajo.

### Características Clave
1. **CRUD de Notas**: Crear, leer, actualizar y eliminar notas
2. **Categorías**: work, personal, ideas, archive (con color por categoría)
3. **Pin**: Fijar notas importantes al inicio de la lista
4. **Búsqueda**: Filtrar notas por título o contenido
5. **Vista**: Lista o grid de tarjetas

### Feature Gates por Plan

| Plan | Notas máximas | Compartir notas |
|------|--------------|----------------|
| Free | 10 | ❌ |
| Starter | 100 | ❌ |
| Professional | 1.000 | ✅ |
| Enterprise | ∞ | ✅ |

### Casos de Uso Referenciados
- **CU-016**: Gestionar Notas

### User Stories Referenciadas
- **US-071**: Crear nota con categoría y pin
- **US-072**: Buscar y filtrar notas
- **US-073**: Editar y eliminar notas
- **US-074**: Ver notas por categoría

### Requerimientos Funcionales
- **FR-093**: CRUD de notas con categorías y pin (ver [functional-requirements.md](../requirements/functional-requirements.md#fr-093))
- **FR-094**: Búsqueda y filtrado de notas
- **FR-095**: Límites de notas por plan con feature gates
- **FR-096**: Vista lista/grid configurable

### Modelo de Datos Django

```python
class Note(TenantModel):
    """Nota de texto del usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=[('work', 'Trabajo'), ('personal', 'Personal'),
                 ('ideas', 'Ideas'), ('archive', 'Archivo')],
        default='personal'
    )
    is_pinned = models.BooleanField(default=False)
    color = models.CharField(max_length=20, default='gray')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notes'
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'is_pinned', '-created_at']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/notes/` | Listar notas del usuario | JWT |
| POST | `/api/v1/notes/` | Crear nota | JWT |
| GET | `/api/v1/notes/{id}/` | Obtener nota | JWT |
| PATCH | `/api/v1/notes/{id}/` | Actualizar nota | JWT |
| DELETE | `/api/v1/notes/{id}/` | Eliminar nota | JWT |
| PATCH | `/api/v1/notes/{id}/pin/` | Toggle pin | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Editar | Eliminar |
|-----|-------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propias) | ✅ (propias) |
| Viewer | ❌ | ✅ | ❌ | ❌ |

---

## Contactos

### Descripción
Directorio de personas y empresas vinculadas al espacio de trabajo del usuario. Permite centralizar información de contacto con búsqueda, filtros por grupo y gestión completa del ciclo de vida del contacto.

### Características Clave
1. **CRUD de Contactos**: Crear, leer, actualizar y eliminar contactos
2. **Campos**: nombre, email, teléfono, empresa, cargo, grupo
3. **Avatar generado**: Iniciales del contacto como avatar
4. **Grupos**: Organizar contactos en grupos personalizados
5. **Búsqueda**: Por nombre, email, empresa

### Feature Gates por Plan

| Plan | Contactos máximos | Grupos personalizados | Exportar CSV |
|------|------------------|-----------------------|-------------|
| Free | 25 | ❌ | ❌ |
| Starter | 100 | ✅ | ✅ |
| Professional | ∞ | ✅ | ✅ |
| Enterprise | ∞ | ✅ | ✅ |

### Casos de Uso Referenciados
- **CU-017**: Gestionar Contactos

### User Stories Referenciadas
- **US-075**: Crear contacto con información completa
- **US-076**: Buscar y filtrar contactos
- **US-077**: Editar y eliminar contactos
- **US-078**: Organizar contactos en grupos

### Requerimientos Funcionales
- **FR-097**: CRUD de contactos con campos completos
- **FR-098**: Búsqueda y filtrado por múltiples campos
- **FR-099**: Gestión de grupos de contactos
- **FR-100**: Exportación a CSV (Starter+)

### Modelo de Datos Django

```python
class ContactGroup(TenantModel):
    """Grupo de contactos del usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='blue')

class Contact(TenantModel):
    """Contacto del directorio del usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    group = models.ForeignKey(ContactGroup, null=True, blank=True, on_delete=models.SET_NULL)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'
        indexes = [
            models.Index(fields=['user', 'group']),
            models.Index(fields=['user', 'last_name', 'first_name']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/contacts/` | Listar contactos | JWT |
| POST | `/api/v1/contacts/` | Crear contacto | JWT |
| GET | `/api/v1/contacts/{id}/` | Obtener contacto | JWT |
| PATCH | `/api/v1/contacts/{id}/` | Actualizar contacto | JWT |
| DELETE | `/api/v1/contacts/{id}/` | Eliminar contacto | JWT |
| GET | `/api/v1/contacts/groups/` | Listar grupos | JWT |
| POST | `/api/v1/contacts/groups/` | Crear grupo | JWT |
| GET | `/api/v1/contacts/export/` | Exportar CSV (Starter+) | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Editar | Eliminar |
|-----|-------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propios) | ✅ (propios) |
| Viewer | ❌ | ✅ | ❌ | ❌ |

---

## Bookmarks

### Descripción
Gestor de enlaces web con soporte de colecciones, tags, búsqueda y vista previa. Permite organizar y recuperar rápidamente URLs relevantes para el trabajo o proyectos del usuario.

### Características Clave
1. **CRUD de Bookmarks**: Guardar, organizar y eliminar enlaces
2. **Colecciones**: Agrupar bookmarks por proyecto o tema
3. **Tags**: Etiquetas para clasificación transversal
4. **Búsqueda**: Por título, URL o descripción
5. **Favicon placeholder**: Identificación visual rápida

### Feature Gates por Plan

| Plan | Bookmarks máximos | Colecciones | Tags | Importar |
|------|------------------|-------------|------|---------|
| Free | 20 | ❌ | ❌ | ❌ |
| Starter | 100 | ✅ | ✅ | ✅ |
| Professional | ∞ | ✅ | ✅ | ✅ |
| Enterprise | ∞ | ✅ | ✅ | ✅ |

### Casos de Uso Referenciados
- **CU-018**: Gestionar Bookmarks

### User Stories Referenciadas
- **US-079**: Guardar bookmark con URL y metadatos
- **US-080**: Organizar bookmarks en colecciones
- **US-081**: Buscar y filtrar bookmarks
- **US-082**: Gestionar tags de bookmarks

### Requerimientos Funcionales
- **FR-101**: CRUD de bookmarks con URL, título y descripción
- **FR-102**: Organización en colecciones (Starter+)
- **FR-103**: Sistema de tags para clasificación transversal
- **FR-104**: Búsqueda full-text en título, URL y descripción

### Modelo de Datos Django

```python
class BookmarkCollection(TenantModel):
    """Colección de bookmarks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='blue')

class Bookmark(TenantModel):
    """Enlace guardado del usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    collection = models.ForeignKey(BookmarkCollection, null=True, blank=True, on_delete=models.SET_NULL)
    url = models.URLField(max_length=2048)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    favicon_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bookmarks'
        indexes = [
            models.Index(fields=['user', 'collection']),
            models.Index(fields=['user', '-created_at']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/bookmarks/` | Listar bookmarks | JWT |
| POST | `/api/v1/bookmarks/` | Crear bookmark | JWT |
| GET | `/api/v1/bookmarks/{id}/` | Obtener bookmark | JWT |
| PATCH | `/api/v1/bookmarks/{id}/` | Actualizar bookmark | JWT |
| DELETE | `/api/v1/bookmarks/{id}/` | Eliminar bookmark | JWT |
| GET | `/api/v1/bookmarks/collections/` | Listar colecciones | JWT |
| POST | `/api/v1/bookmarks/collections/` | Crear colección (Starter+) | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Editar | Eliminar |
|-----|-------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propios) | ✅ (propios) |
| Viewer | ❌ | ✅ | ❌ | ❌ |

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver DevOps Services](devops-services.md)
- [➡️ Ver Admin Services](admin-services.md)
- [Ver Functional Requirements](../requirements/functional-requirements.md)

---

**Última actualización**: 2026-02-17
