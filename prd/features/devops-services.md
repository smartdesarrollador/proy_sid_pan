# DevOps Services

[⬅️ Volver al README](../README.md)

---

## Índice
- [Variables de Entorno](#variables-de-entorno)
- [Claves SSH](#claves-ssh)
- [Certificados SSL](#certificados-ssl)
- [Snippets de Código](#snippets-de-código)

---

## Variables de Entorno

### Descripción
Gestión segura de variables de entorno por ambiente (dev, staging, prod). Los valores secretos se cifran en reposo con AES-256 y se enmascaran en la UI. Permite separar configuración por ambiente y controlar el acceso con permisos granulares.

### Características Clave
1. **Ambientes**: Separación por dev, staging, production
2. **Cifrado**: Valores sensibles cifrados con AES-256
3. **Enmascarado**: Valores ocultos por defecto en UI con toggle de revelación
4. **CRUD**: Crear, leer, actualizar y eliminar variables
5. **Búsqueda**: Filtrar por nombre de variable o ambiente

### Feature Gates por Plan

| Plan | Disponible | Variables máximas | Ambientes | Exportar |
|------|-----------|------------------|-----------|---------|
| Free | ❌ | — | — | — |
| Starter | ✅ | 25 | dev, staging, prod | ❌ |
| Professional | ✅ | ∞ | Personalizados | ✅ |
| Enterprise | ✅ | ∞ | Personalizados | ✅ |

### Casos de Uso Referenciados
- **CU-019**: Gestionar Variables de Entorno

### User Stories Referenciadas
- **US-083**: Crear y organizar variables por ambiente
- **US-084**: Revelar y copiar valor de variable
- **US-085**: Editar y eliminar variables de entorno
- **US-086**: Exportar variables por ambiente (Professional+)

### Requerimientos Funcionales
- **FR-105**: CRUD de variables con cifrado AES-256 para valores sensibles
- **FR-106**: Separación por ambiente (dev/staging/prod)
- **FR-107**: Enmascarado de valores con toggle de revelación temporal (30s)
- **FR-108**: Exportación en formato `.env` (Professional+)

### Modelo de Datos Django

```python
class EnvVariable(TenantModel):
    """Variable de entorno cifrada"""
    ENVIRONMENTS = [('dev', 'Development'), ('staging', 'Staging'), ('prod', 'Production')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='env_variables')
    key = models.CharField(max_length=255)  # Nombre de la variable (ej: DATABASE_URL)
    value_encrypted = models.TextField()    # Valor cifrado con AES-256
    environment = models.CharField(max_length=20, choices=ENVIRONMENTS)
    description = models.CharField(max_length=255, blank=True)
    is_secret = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'env_variables'
        unique_together = ['user', 'key', 'environment']
        indexes = [
            models.Index(fields=['user', 'environment']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/env-vars/` | Listar variables (values masked) | JWT |
| POST | `/api/v1/env-vars/` | Crear variable | JWT |
| GET | `/api/v1/env-vars/{id}/` | Obtener variable | JWT |
| PATCH | `/api/v1/env-vars/{id}/` | Actualizar variable | JWT |
| DELETE | `/api/v1/env-vars/{id}/` | Eliminar variable | JWT |
| POST | `/api/v1/env-vars/{id}/reveal/` | Obtener valor descifrado (audit log) | JWT |
| GET | `/api/v1/env-vars/export/` | Exportar como .env (Professional+) | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Revelar valor | Editar | Eliminar |
|-----|-------|------|--------------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propias) | ✅ (propias) | ✅ (propias) |
| Viewer | ❌ | ✅ (masked) | ❌ | ❌ | ❌ |

---

## Claves SSH

### Descripción
Almacenamiento seguro de pares de claves SSH y GPG. Las claves privadas se cifran con AES-256. Permite gestionar múltiples claves con nombre, fingerprint y fecha de expiración para acceso a servidores y servicios remotos.

### Características Clave
1. **Algoritmos**: RSA 2048/4096, ED25519, ECDSA
2. **Cifrado**: Clave privada cifrada con AES-256
3. **Fingerprint**: Visualización del fingerprint SHA-256
4. **Expiración**: Fecha de expiración opcional con alertas
5. **Copia**: Copiar clave pública con un click

### Feature Gates por Plan

| Plan | Disponible | Claves máximas | Alertas vencimiento |
|------|-----------|---------------|---------------------|
| Free | ❌ | — | — |
| Starter | ✅ | 5 | ❌ |
| Professional | ✅ | ∞ | ✅ |
| Enterprise | ✅ | ∞ | ✅ |

### Casos de Uso Referenciados
- **CU-020**: Gestionar Claves SSH

### User Stories Referenciadas
- **US-087**: Agregar clave SSH con nombre y descripción
- **US-088**: Ver fingerprint y copiar clave pública
- **US-089**: Gestionar expiración de claves
- **US-090**: Eliminar clave SSH de forma segura

### Requerimientos Funcionales
- **FR-109**: Almacenamiento de claves con clave privada cifrada AES-256
- **FR-110**: Visualización de fingerprint SHA-256 sin revelar clave privada
- **FR-111**: Alertas automáticas de vencimiento a 30, 7 y 1 días (Professional+)
- **FR-112**: Eliminación segura con confirmación y registro en audit log

### Modelo de Datos Django

```python
class SSHKey(TenantModel):
    """Par de claves SSH del usuario"""
    ALGORITHMS = [('rsa', 'RSA'), ('ed25519', 'ED25519'), ('ecdsa', 'ECDSA')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ssh_keys')
    name = models.CharField(max_length=255)
    algorithm = models.CharField(max_length=20, choices=ALGORITHMS)
    public_key = models.TextField()
    private_key_encrypted = models.TextField(blank=True)  # Cifrada AES-256
    fingerprint = models.CharField(max_length=255)        # SHA-256 fingerprint
    description = models.TextField(blank=True)
    expires_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ssh_keys'
        indexes = [
            models.Index(fields=['user', 'expires_at']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/ssh-keys/` | Listar claves (sin private key) | JWT |
| POST | `/api/v1/ssh-keys/` | Crear clave SSH | JWT |
| GET | `/api/v1/ssh-keys/{id}/` | Obtener clave | JWT |
| PATCH | `/api/v1/ssh-keys/{id}/` | Actualizar metadatos | JWT |
| DELETE | `/api/v1/ssh-keys/{id}/` | Eliminar clave | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Editar | Eliminar |
|-----|-------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propias) | ✅ (propias) |
| Viewer | ❌ | ✅ | ❌ | ❌ |

---

## Certificados SSL

### Descripción
Tracking de certificados SSL/TLS con alertas automáticas de vencimiento. Permite monitorear el estado de los certificados de dominios con indicadores visuales de color según proximidad al vencimiento.

### Características Clave
1. **Seguimiento**: Dominio, emisor, fecha desde/hasta
2. **Estado visual**: Verde (válido), Amarillo (<30 días), Rojo (vencido/≤7 días)
3. **Alertas**: Notificaciones automáticas a 30, 7 y 1 día antes de vencimiento
4. **Multi-dominio**: Soporte para wildcard y SAN (Subject Alternative Names)
5. **Import**: Cargar desde archivo .pem o .crt

### Feature Gates por Plan

| Plan | Disponible | Certificados máximos | Alertas automáticas |
|------|-----------|---------------------|---------------------|
| Free | ❌ | — | — |
| Starter | ✅ | 10 | ❌ |
| Professional | ✅ | ∞ | ✅ |
| Enterprise | ✅ | ∞ | ✅ |

### Casos de Uso Referenciados
- **CU-021**: Gestionar Certificados SSL

### User Stories Referenciadas
- **US-091**: Agregar certificado SSL con dominio e información del emisor
- **US-092**: Ver estado visual del certificado (verde/amarillo/rojo)
- **US-093**: Recibir alertas de vencimiento próximo (Professional+)
- **US-094**: Renovar o eliminar certificados vencidos

### Requerimientos Funcionales
- **FR-113**: CRUD de certificados con dominio, emisor, fechas y estado
- **FR-114**: Cálculo automático de estado según días hasta vencimiento
- **FR-115**: Alertas de vencimiento por email a 30, 7 y 1 día (Professional+)
- **FR-116**: Importación desde archivo .pem/.crt con extracción automática de metadatos

### Modelo de Datos Django

```python
class SSLCertificate(TenantModel):
    """Certificado SSL/TLS del usuario"""
    STATUS_CHOICES = [('valid', 'Válido'), ('expiring', 'Por vencer'), ('expired', 'Vencido')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ssl_certs')
    domain = models.CharField(max_length=255)
    issuer = models.CharField(max_length=255)
    subject_alt_names = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    valid_from = models.DateField()
    valid_until = models.DateField()
    serial_number = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    alert_30_sent = models.BooleanField(default=False)
    alert_7_sent = models.BooleanField(default=False)
    alert_1_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def days_until_expiry(self):
        return (self.valid_until - date.today()).days

    @property
    def status(self):
        days = self.days_until_expiry
        if days < 0:
            return 'expired'
        elif days <= 30:
            return 'expiring'
        return 'valid'

    class Meta:
        db_table = 'ssl_certificates'
        indexes = [
            models.Index(fields=['user', 'valid_until']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/ssl-certs/` | Listar certificados con estado | JWT |
| POST | `/api/v1/ssl-certs/` | Crear certificado | JWT |
| GET | `/api/v1/ssl-certs/{id}/` | Obtener certificado | JWT |
| PATCH | `/api/v1/ssl-certs/{id}/` | Actualizar certificado | JWT |
| DELETE | `/api/v1/ssl-certs/{id}/` | Eliminar certificado | JWT |
| POST | `/api/v1/ssl-certs/import/` | Importar desde .pem/.crt | JWT |

### Permisos RBAC por Rol

| Rol | Crear | Leer | Editar | Eliminar |
|-----|-------|------|--------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Service Manager | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ (propios) | ✅ (propios) |
| Viewer | ❌ | ✅ | ❌ | ❌ |

---

## Snippets de Código

### Descripción
Repositorio personal de fragmentos de código reutilizables con soporte de múltiples lenguajes, syntax highlighting, tags y búsqueda. Permite capturar y recuperar rápidamente patrones de código frecuentes.

### Características Clave
1. **Lenguajes**: JavaScript, TypeScript, Python, Bash, SQL, CSS, Go, Rust, Java, PHP, Ruby, YAML, JSON
2. **Syntax highlighting**: Resaltado visual por lenguaje
3. **Tags**: Etiquetas personalizadas para clasificación
4. **Copia rápida**: Copiar al portapapeles con un click
5. **Búsqueda**: Por título, lenguaje, tags o contenido

### Feature Gates por Plan

| Plan | Snippets máximos | Lenguajes | Compartir |
|------|-----------------|-----------|-----------|
| Free | 10 | Todos | ❌ |
| Starter | 50 | Todos | ❌ |
| Professional | ∞ | Todos | ✅ |
| Enterprise | ∞ | Todos | ✅ |

### Casos de Uso Referenciados
- **CU-022**: Gestionar Snippets de Código

### User Stories Referenciadas
- **US-095**: Crear snippet con lenguaje y código
- **US-096**: Buscar snippets por lenguaje o tags
- **US-097**: Copiar snippet al portapapeles rápidamente
- **US-098**: Organizar snippets con tags personalizados

### Requerimientos Funcionales
- **FR-117**: CRUD de snippets con título, lenguaje, código y descripción
- **FR-118**: Soporte de 13+ lenguajes con identificación visual por badge
- **FR-119**: Sistema de tags para clasificación transversal
- **FR-120**: Búsqueda full-text en título, descripción y código

### Modelo de Datos Django

```python
class CodeSnippet(TenantModel):
    """Fragmento de código reutilizable"""
    LANGUAGES = [
        ('javascript', 'JavaScript'), ('typescript', 'TypeScript'),
        ('python', 'Python'), ('bash', 'Bash'), ('sql', 'SQL'),
        ('css', 'CSS'), ('go', 'Go'), ('rust', 'Rust'),
        ('java', 'Java'), ('php', 'PHP'), ('ruby', 'Ruby'),
        ('yaml', 'YAML'), ('json', 'JSON'), ('other', 'Otro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='snippets')
    title = models.CharField(max_length=255)
    language = models.CharField(max_length=30, choices=LANGUAGES)
    code = models.TextField()
    description = models.TextField(blank=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'code_snippets'
        indexes = [
            models.Index(fields=['user', 'language']),
            models.Index(fields=['user', '-created_at']),
        ]
```

### Endpoints API REST

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/snippets/` | Listar snippets con filtros | JWT |
| POST | `/api/v1/snippets/` | Crear snippet | JWT |
| GET | `/api/v1/snippets/{id}/` | Obtener snippet | JWT |
| PATCH | `/api/v1/snippets/{id}/` | Actualizar snippet | JWT |
| DELETE | `/api/v1/snippets/{id}/` | Eliminar snippet | JWT |

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
- [⬅️ Ver Productivity Services](productivity-services.md)
- [➡️ Ver Admin Services](admin-services.md)
- [Ver Functional Requirements](../requirements/functional-requirements.md)

---

**Última actualización**: 2026-02-17
