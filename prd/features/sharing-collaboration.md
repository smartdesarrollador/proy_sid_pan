# Sharing & Collaboration Feature

[⬅️ Volver al README](../README.md)

---

## Índice
- [Casos de Uso](#casos-de-uso)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Timeline](#timeline)

---

## Casos de Uso

### CU-006: Compartir Proyecto con Control de Permisos

**Actor**: Project Owner / Admin

**Flujo principal**:
1. Usuario abre proyecto "Sistema de Autenticación"
2. Click en botón "Miembros" (header superior derecho)
3. Modal muestra:
   - Lista de miembros actuales con sus roles
   - Botón "+ Agregar Miembro"
4. Click "+ Agregar Miembro"
5. Selector muestra usuarios de la organización
6. Selecciona "Mike Chen"
7. Dropdown de nivel de acceso: Viewer, Commenter, Editor, Admin
8. Selecciona "Editor"
9. Toggle "Notificar por email" (checked por default)
10. Click "Compartir"
11. Sistema valida:
    - Usuario tiene permiso `project.share`
    - No excede límite de plan (Professional: max 50 usuarios)
    - Mike Chen pertenece a misma organización
12. Backend crea registro en tabla `shares`
13. Mike Chen recibe notificación email + in-app
14. Proyecto aparece en "Compartidos conmigo" de Mike
15. Audit log registra: `share.created` con metadatos

**Tiempo objetivo**: <2 minutos desde inicio hasta compartición exitosa

**Flujos alternativos**:
- **Alt-1**: Límite de plan alcanzado → UpgradePrompt con comparación de planes
- **Alt-2**: Usuario sin permiso → Error "No tienes permiso para compartir este proyecto"
- **Alt-3**: Usuario ya tiene acceso → Actualizar nivel de acceso existente

---

### CU-007: Revocar Acceso a Elemento Compartido

**Actor**: Project Admin / Owner

**Flujo principal**:
1. Usuario abre proyecto compartido
2. Click en "Miembros" → Lista usuarios con acceso
3. Click en menú de opciones (•••) junto a "Mike Chen"
4. Selecciona "Remover acceso"
5. Modal de confirmación:
   - "¿Remover acceso de Mike Chen?"
   - "Mike perderá acceso inmediato al proyecto y todos sus elementos"
   - Checkbox "Notificar a Mike por email"
   - Botones: [Cancelar] [Remover Acceso]
6. Click "Remover Acceso"
7. Backend:
   - Valida permiso `project.share_admin`
   - Elimina registro de tabla `shares`
   - Invalida sesiones activas de Mike en ese proyecto
8. Mike recibe notificación (si checkbox checked)
9. Proyecto desaparece de "Compartidos conmigo" de Mike
10. Audit log registra: `share.revoked` con motivo

**Tiempo objetivo**: <1 minuto desde inicio hasta revocación

**Validaciones críticas**:
- No permitir remover último usuario admin (sistema previene)
- No permitir remover owner (solo transferir ownership)

---

### CU-008: Gestionar Herencia de Permisos en Proyecto

**Actor**: Project Owner

**Flujo principal**:
1. Usuario comparte proyecto "Sistema Autenticación" con Alice: Editor
2. Proyecto tiene 3 secciones:
   - "Credenciales Prod" (5 items)
   - "Configuración JWT" (4 items)
   - "Documentación" (3 items)
3. Permisos se heredan automáticamente:
   - Alice → Editor en todas las secciones e items
4. Usuario quiere que Alice sea Admin solo en "Documentación"
5. Click en sección "Documentación" → Menú → "Permisos"
6. Modal muestra permisos de sección:
   - Alice: Editor (heredado de proyecto)
7. Click "Cambiar permiso local"
8. Selecciona "Admin"
9. Icon "🔒" indica permiso local (no heredado)
10. Ahora Alice tiene:
    - Editor en "Credenciales Prod" (heredado)
    - Editor en "Configuración JWT" (heredado)
    - Admin en "Documentación" (local) ← Puede compartir esta sección
11. Usuario cambia permiso del proyecto Alice: Editor → Viewer
12. Permisos heredados actualizan:
    - Viewer en "Credenciales Prod"
    - Viewer en "Configuración JWT"
    - Admin en "Documentación" (local, no cambia)

**Tiempo objetivo**: Cambios aplicados en <5 segundos

**Criterios de éxito**:
- UI muestra claramente permisos heredados vs locales
- Permisos locales no se sobrescriben al cambiar padre
- Usuario entiende jerarquía de permisos sin confusión

---

## User Stories

### US-032: Compartir Elemento Individual

**Como** usuario con permisos de administración en un elemento,
**Quiero** compartir ese elemento con otros usuarios de mi organización y asignar niveles de acceso,
**Para** colaborar eficientemente sin duplicar información.

**Criterios de aceptación:**
- [ ] Puedo acceder a opción "Compartir" desde elemento (proyecto, tarea, archivo, etc.)
- [ ] Modal muestra lista de usuarios de mi organización
- [ ] Puedo seleccionar 1+ usuarios y asignar nivel de acceso (Viewer, Editor, etc.)
- [ ] Sistema valida que tengo permisos de compartición antes de permitirlo
- [ ] Usuarios receptores reciben notificación de compartición
- [ ] Elemento aparece en su sección "Compartidos conmigo"
- [ ] Puedo ver lista de usuarios con acceso y sus niveles
- [ ] Feature gate verifica límites de mi plan antes de compartir

**Escenarios de prueba:**
- Compartir proyecto con colega como Editor → Colega puede editar
- Compartir archivo como Viewer → Colega solo puede ver
- Intentar compartir sin permisos → Sistema muestra error
- Alcanzar límite de plan → Mostrar UpgradePrompt

---

### US-033: Gestionar Permisos de Compartición

**Como** usuario admin de un elemento compartido,
**Quiero** cambiar niveles de acceso y revocar acceso de usuarios,
**Para** mantener control sobre quién puede hacer qué.

**Criterios de aceptación:**
- [ ] Puedo acceder a lista de usuarios con acceso al elemento
- [ ] Puedo cambiar nivel de acceso de cualquier usuario (excepto owner)
- [ ] Puedo revocar acceso de usuario con confirmación
- [ ] Cambios se aplican inmediatamente
- [ ] Sistema notifica usuarios afectados por cambios
- [ ] Audit log registra cambios con timestamp y autor
- [ ] No puedo remover último usuario admin (prevención)

**Escenarios de prueba:**
- Cambiar Editor → Viewer → Usuario pierde permisos de edición
- Revocar acceso → Usuario pierde acceso inmediatamente
- Intentar remover último admin → Sistema previene

---

### US-034: Compartir Grupo de Elementos con Herencia

**Como** usuario owner de un proyecto,
**Quiero** compartir el proyecto completo (secciones + items) en 1 acción,
**Para** no tener que compartir cada elemento individualmente.

**Criterios de aceptación:**
- [ ] Opción "Compartir proyecto completo" comparte todas sus secciones e items
- [ ] Permisos se heredan automáticamente a elementos hijos
- [ ] Puedo configurar permisos locales en elementos específicos
- [ ] UI muestra claramente qué permisos son heredados vs locales
- [ ] Cambiar permiso del padre actualiza permisos heredados de hijos
- [ ] Feature gate verifica que mi plan permite compartir grupos

**Escenarios de prueba:**
- Compartir proyecto → Todos los items heredan permisos
- Configurar permiso local → Sobrescribe heredado
- Cambiar permiso del padre → Hijos actualizan

---

### US-035: Acceder a Elementos Compartidos Conmigo

**Como** usuario,
**Quiero** ver lista de elementos que otros compartieron conmigo,
**Para** acceder rápidamente a información colaborativa.

**Criterios de aceptación:**
- [ ] Sección "Compartidos conmigo" lista todos los elementos compartidos
- [ ] Puedo filtrar por tipo de elemento (proyectos, tareas, archivos, etc.)
- [ ] Puedo ver quién compartió cada elemento y con qué nivel
- [ ] Puedo aceptar/rechazar compartición (opcional)
- [ ] Notificaciones me alertan cuando alguien comparte algo conmigo

**Escenarios de prueba:**
- Colega comparte proyecto → Aparece en "Compartidos conmigo"
- Filtrar por tareas → Solo muestra tareas compartidas
- Click en elemento compartido → Accedo con permisos correctos

---

### US-036: Auditar Compartición para Compliance

**Como** Security Officer,
**Quiero** generar reportes de quién tiene acceso a qué recursos,
**Para** cumplir con auditorías de seguridad y compliance.

**Criterios de aceptación:**
- [ ] Puedo acceder a "Audit Logs → Shares"
- [ ] Puedo filtrar por: recurso, usuario, fecha, tipo de evento
- [ ] Puedo generar reporte CSV con: timestamp, actor, recurso, acción, nivel
- [ ] Reporte incluye comparticiones activas + históricas
- [ ] Reporte se genera en <30 segundos
- [ ] Logs son inmutables (no modificables)

**Escenarios de prueba:**
- Generar reporte de proyecto sensible → Lista todos los accesos
- Filtrar por usuario → Muestra todo lo compartido con ese usuario
- Exportar CSV → Descarga correctamente

---

## Functional Requirements

### FR-032: Compartición de Elementos

- El sistema DEBE permitir compartir cualquier elemento con miembros de la organización
- El sistema DEBE validar permisos antes de permitir compartir (`resource.share`)
- El sistema DEBE validar límites del plan antes de compartir
- El sistema DEBE crear registro en tabla `shares` con: resource_id, resource_type, user_from, user_to, permission_level
- El sistema DEBE enviar notificaciones a usuarios receptores
- El sistema DEBE mostrar elementos compartidos en sección "Compartidos conmigo"

### FR-033: Niveles de Acceso en Compartición

- El sistema DEBE soportar niveles: Viewer, Commenter, Editor, Admin, Owner
- **Viewer**: Solo lectura sin modificaciones
- **Commenter**: Viewer + agregar comentarios
- **Editor**: Commenter + crear/editar/eliminar contenido
- **Admin**: Editor + compartir con otros + configurar permisos
- **Owner**: Admin + transferir ownership + eliminar elemento
- El sistema DEBE validar acceso según nivel en cada operación

### FR-034: Herencia de Permisos

- El sistema DEBE heredar automáticamente permisos de padre a hijos
- El sistema DEBE permitir permisos locales que sobrescriben heredados
- El sistema DEBE propagar cambios en permisos de padre a hijos (excepto locales)
- El sistema DEBE marcar visualmente permisos heredados vs locales en UI
- El sistema DEBE calcular permisos efectivos: local > heredado > default

### FR-035: Gestión de Comparticiones

- El sistema DEBE permitir cambiar nivel de acceso de usuarios
- El sistema DEBE permitir revocar acceso con confirmación
- El sistema DEBE prevenir remover último usuario admin
- El sistema DEBE prevenir remover owner (solo transferir)
- El sistema DEBE invalidar sesiones al revocar acceso
- El sistema DEBE notificar cambios a usuarios afectados

### FR-036: Auditoría de Compartición

- El sistema DEBE registrar en audit log: share.created, share.updated, share.revoked
- El sistema DEBE permitir filtrar audit logs por recurso, usuario, acción, fecha
- El sistema DEBE generar reportes CSV de comparticiones
- El sistema DEBE incluir metadatos: timestamp, actor, recurso, nivel, cambios
- Logs DEBEN ser inmutables (insert-only)
- Retención: 7 años (compliance)

---

## Data Models

### Share Model

```python
class Share(models.Model):
    """
    Registro de compartición de recursos entre usuarios
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    # Campos polimórficos para soportar cualquier recurso
    resource_type = models.CharField(max_length=50)  # 'project', 'task', 'file', etc.
    resource_id = models.UUIDField()  # ID del recurso compartido
    
    # Usuarios involucrados
    shared_by = models.ForeignKey('User', related_name='shares_given', on_delete=models.CASCADE)
    shared_with = models.ForeignKey('User', related_name='shares_received', on_delete=models.CASCADE)
    
    # Control de acceso
    permission_level = models.CharField(
        max_length=20,
        choices=[
            ('viewer', 'Viewer'),
            ('commenter', 'Commenter'),
            ('editor', 'Editor'),
            ('admin', 'Admin'),
        ]
    )
    
    # Flags
    is_inherited = models.BooleanField(default=False)  # Si es heredado o local
    notify_on_changes = models.BooleanField(default=True)
    
    # Timestamps
    shared_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # Compartición temporal
    
    class Meta:
        db_table = 'shares'
        unique_together = [['tenant', 'resource_type', 'resource_id', 'shared_with']]
        indexes = [
            models.Index(fields=['tenant', 'resource_type', 'resource_id']),
            models.Index(fields=['tenant', 'shared_with']),
            models.Index(fields=['shared_by']),
        ]
```

### SharePermission Model

```python
class SharePermission(models.Model):
    """
    Define permisos específicos incluidos en cada nivel de acceso
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    permission_level = models.CharField(max_length=20)
    resource_type = models.CharField(max_length=50)
    
    # Permisos específicos (JSON)
    permissions = models.JSONField(default=dict)
    # Ejemplo: {'read': True, 'create': False, 'update': True, 'delete': False, 'share': False}
    
    class Meta:
        db_table = 'share_permissions'
        unique_together = [['permission_level', 'resource_type']]
```

---

## API Endpoints

### Compartir Elemento

```http
POST /api/v1/app/shares
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "resource_type": "project",
  "resource_id": "123e4567-e89b-12d3-a456-426614174000",
  "shared_with_user_ids": ["789e4567-e89b-12d3-a456-426614174001"],
  "permission_level": "editor",
  "notify": true
}

Response 201:
{
  "shares": [
    {
      "id": "share-uuid",
      "resource_type": "project",
      "resource_id": "123e4567-e89b-12d3-a456-426614174000",
      "shared_with": {
        "id": "789e4567-e89b-12d3-a456-426614174001",
        "name": "Mike Chen",
        "email": "mike@example.com"
      },
      "permission_level": "editor",
      "shared_at": "2026-02-10T10:30:00Z"
    }
  ]
}

Response 402:
{
  "error": "payment_required",
  "message": "Your plan allows max 10 shared users. Upgrade to Professional.",
  "upgrade_url": "/billing/upgrade"
}
```

---

### Listar Comparticiones de Recurso

```http
GET /api/v1/app/shares?resource_type=project&resource_id={id}
Authorization: Bearer {access_token}

Response 200:
{
  "shares": [
    {
      "id": "share-uuid",
      "shared_with": {"id": "...", "name": "Mike Chen"},
      "permission_level": "editor",
      "is_inherited": false,
      "shared_at": "2026-02-10T10:30:00Z"
    }
  ]
}
```

---

### Actualizar Nivel de Acceso

```http
PATCH /api/v1/app/shares/{share_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "permission_level": "viewer"
}

Response 200:
{
  "share": {
    "id": "share-uuid",
    "permission_level": "viewer",
    "updated_at": "2026-02-10T11:00:00Z"
  }
}
```

---

### Revocar Compartición

```http
DELETE /api/v1/app/shares/{share_id}
Authorization: Bearer {access_token}

{
  "notify_user": true
}

Response 204 No Content
```

---

### Elementos Compartidos Conmigo

```http
GET /api/v1/app/shares/shared-with-me?resource_type=project
Authorization: Bearer {access_token}

Response 200:
{
  "shares": [
    {
      "id": "share-uuid",
      "resource": {
        "id": "project-uuid",
        "type": "project",
        "name": "Sistema Autenticación",
        "owner": {"name": "Alice Smith"}
      },
      "permission_level": "editor",
      "shared_by": {"name": "Alice Smith"},
      "shared_at": "2026-02-10T10:30:00Z"
    }
  ]
}
```

---

## Timeline

### Phase 4 (Sprints 10-12): Sharing & Collaboration

**Sprint 10: Core Sharing**
- Implementar modelos Share y SharePermission
- Crear endpoints de compartición (crear, listar, actualizar, revocar)
- Implementar validaciones de permisos y feature gates
- Crear UI modal de compartir con selector de usuarios

**Sprint 11: Herencia de Permisos**
- Implementar lógica de herencia automática
- Permitir permisos locales que sobrescriben heredados
- Crear UI para visualizar permisos heredados vs locales
- Implementar propagación de cambios de padre a hijos

**Sprint 12: "Compartidos Conmigo" & Auditoría**
- Crear sección "Compartidos conmigo" en frontend
- Implementar notificaciones de compartición
- Implementar audit logs de compartición
- Crear reportes de auditoría para compliance

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Projects Feature](projects.md)
- [Ver Billing Feature](billing.md)

---

**Última actualización**: 2026-02-10
