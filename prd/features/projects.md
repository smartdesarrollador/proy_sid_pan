# Projects/Portafolio Feature

[⬅️ Volver al README](../README.md)

---

## Índice
- [Product Overview](#product-overview)
- [Features por Plan](#features-por-plan)
- [User Stories](#user-stories)
- [Functional Requirements](#functional-requirements)
- [Permisos RBAC](#permisos-rbac)
- [Data Models](#data-models)

---

## Product Overview

**Descripción**: Sistema completo de gestión de proyectos con organización jerárquica por tags/secciones, control granular de items con campos customizables, operaciones batch y auditoría completa.

### Funcionalidades Clave

1. **Gestión de Proyectos**:
   - Creación de proyectos con nombre, descripción, color/icono identificador
   - Estados del proyecto: Activo, Archivado, En Pausa
   - Filtrado por estado y búsqueda por nombre

2. **Organización por Secciones/Tags**:
   - Creación de secciones/tags configurables dentro de cada proyecto
   - Agrupación lógica de items relacionados
   - Colapsar/expandir secciones
   - Ordenamiento de secciones

3. **Gestión de Items**:
   - Tipos de items: Credenciales, Documentos, Enlaces, Notas, Configuraciones
   - Campos customizables por tipo: usuario, contraseña, email, URL, descripción, fecha vencimiento
   - Campos de contraseña con ocultación/mostrar

4. **Operaciones por Item**:
   - Editar: modificar todos los campos del item
   - Copiar/Clonar: duplicar item con todos sus datos
   - Reordenar: mover item arriba/abajo dentro de la sección
   - Eliminar: remover item con confirmación
   - Ver información: mostrar metadata (creado por, fecha, última modificación)

5. **Operaciones Batch** (Professional+):
   - Selección múltiple de items
   - Mover items seleccionados a otra sección
   - Editar en masa campos comunes
   - Eliminar múltiples items
   - Exportar selección

6. **Búsqueda y Filtros**:
   - Búsqueda global dentro del proyecto
   - Filtrar por sección/tag específico
   - Filtrar por tipo de item
   - Buscar en campos específicos (usuario, email, etc.)

7. **Compartición y Colaboración**:
   - Compartir proyecto con miembros del equipo
   - Permisos granulares por miembro: Ver, Editar, Admin
   - Notificaciones de cambios en proyectos compartidos
   - Historial de actividad

8. **Auditoría y Seguridad**:
   - Historial completo de cambios: quién modificó qué y cuándo
   - Log de accesos a items sensibles (credenciales)
   - Encriptación de campos de contraseña
   - Backup automático de proyectos

9. **Importación/Exportación**:
   - Importar proyectos desde CSV/JSON
   - Exportar proyecto completo o por sección
   - Plantillas de proyectos reutilizables

10. **Vistas Personalizadas**:
    - Vista Lista (por defecto): items en lista vertical
    - Vista Tabla: grid con todas las columnas visibles
    - Vista Compacta: solo títulos de items

11. **Integraciones** (Enterprise):
    - Webhooks para sincronización con sistemas externos
    - API REST para gestión programática
    - Conectores con password managers (1Password, LastPass)

12. **Notificaciones**:
    - Alertas de items próximos a vencer
    - Notificaciones de cambios en proyectos compartidos
    - Recordatorios de contraseñas a renovar

---

## Features por Plan

### Free
- 2 proyectos
- 50 items totales
- 3 secciones por proyecto
- Sin operaciones batch
- Sin exportación

### Starter
- 10 proyectos
- 200 items totales
- 10 secciones por proyecto
- Operaciones batch básicas (selección múltiple, eliminar lotes)
- Exportar a CSV

### Professional
- Proyectos ilimitados
- Items ilimitados
- Secciones ilimitadas
- Operaciones batch avanzadas (mover sección, editar en masa)
- Plantillas reutilizables de proyectos
- Exportar a CSV/JSON
- Búsqueda full-text

### Enterprise
- Todo lo de Professional +
- Webhooks de cambios en proyectos
- Integración API para sincronización externa
- Auditoría avanzada con exportación de logs
- Dashboards analíticos de proyectos
- Compartición externa (read-only links)

---

## User Stories

### US-26: Crear Proyecto

**Como** usuario cliente
**Quiero** crear un nuevo proyecto con nombre y descripción
**Para** organizar mis credenciales, documentos y enlaces

**Criterios de Aceptación:**
- [ ] Usuario puede crear proyecto desde botón "+ Nuevo Proyecto"
- [ ] Formulario solicita: nombre (requerido), descripción (opcional), color
- [ ] Sistema valida límites del plan (Free: 2 proyectos max)
- [ ] Proyecto creado aparece en lista "Mis Proyectos"
- [ ] Usuario es asignado como owner del proyecto automáticamente

---

### US-27: Organizar Items por Secciones

**Como** usuario con proyecto existente
**Quiero** crear secciones/tags para agrupar items relacionados
**Para** mantener organizado el contenido del proyecto

**Criterios de Aceptación:**
- [ ] Usuario puede crear sección desde panel del proyecto
- [ ] Sección tiene nombre único dentro del proyecto
- [ ] Usuario puede colapsar/expandir secciones
- [ ] Items se muestran agrupados por sección
- [ ] Sistema respeta límites del plan (Free: 3 secciones max)

---

### US-28: Gestionar Items de Credenciales

**Como** usuario del proyecto
**Quiero** agregar items con campos customizables (usuario, password, email)
**Para** almacenar credenciales de forma segura

**Criterios de Aceptación:**
- [ ] Usuario puede crear item dentro de una sección
- [ ] Item tipo "Credencial" tiene campos: usuario, password, email, URL, notas
- [ ] Campo password se muestra oculto por defecto (•••)
- [ ] Usuario puede mostrar/ocultar password con botón
- [ ] Passwords se almacenan encriptados en base de datos
- [ ] Sistema respeta límites del plan (Free: 50 items max)

---

### US-29: Operaciones de Item Individual

**Como** usuario con permisos de edición
**Quiero** editar, copiar, reordenar y eliminar items
**Para** gestionar el contenido del proyecto eficientemente

**Criterios de Aceptación:**
- [ ] Botón editar (✏️) abre modal con formulario de campos
- [ ] Botón copiar (📋) duplica el item con sufijo "(copia)"
- [ ] Botones ordenar (↑↓) mueven item arriba/abajo dentro de sección
- [ ] Botón info (ℹ️) muestra metadata (creado por, fecha)
- [ ] Botón eliminar (🗑️) solicita confirmación antes de borrar
- [ ] Auditoría registra todas las operaciones

---

### US-30: Operaciones Batch (Professional+)

**Como** usuario con plan Professional
**Quiero** seleccionar múltiples items y aplicar acciones masivas
**Para** ahorrar tiempo en gestión de proyectos grandes

**Criterios de Aceptación:**
- [ ] Checkboxes disponibles para selección múltiple
- [ ] Barra de acciones aparece al seleccionar items
- [ ] Acciones disponibles: Mover a sección, Eliminar, Exportar
- [ ] Confirmación requerida para operaciones destructivas
- [ ] Feature gate valida plan Professional antes de permitir

---

### US-31: Búsqueda y Filtros

**Como** usuario con muchos items
**Quiero** buscar y filtrar dentro del proyecto
**Para** encontrar información rápidamente

**Criterios de Aceptación:**
- [ ] Barra de búsqueda disponible en vista de proyecto
- [ ] Búsqueda en tiempo real (debounce 300ms)
- [ ] Busca en: título item, campos de texto, nombre sección
- [ ] Filtros laterales por: tipo item, sección/tag
- [ ] Resultados destacan texto coincidente

---

### US-32: Exportar/Importar Proyectos

**Como** usuario con plan Starter+
**Quiero** exportar proyecto a CSV/JSON e importar desde archivo
**Para** backup y migración de datos

**Criterios de Aceptación:**
- [ ] Botón "Exportar" genera archivo descargable
- [ ] Formatos soportados: CSV (Starter+), JSON (Professional+)
- [ ] Export incluye: proyecto, secciones, items, fields
- [ ] Passwords exportados quedan encriptados en archivo
- [ ] Importar valida formato y límites del plan
- [ ] Importar permite mapeo de campos si difieren

---

### US-33: Compartir Proyecto con Equipo

**Como** owner de proyecto
**Quiero** compartir el proyecto con miembros de mi organización
**Para** colaborar en la gestión de credenciales y documentos

**Criterios de Aceptación:**
- [ ] Botón "Compartir" abre modal de gestión de miembros
- [ ] Owner puede agregar usuarios de la organización
- [ ] Roles disponibles: Viewer, Editor, Admin
- [ ] Viewer: solo lectura
- [ ] Editor: leer, crear, editar items (no eliminar proyecto)
- [ ] Admin: todas las operaciones excepto eliminar proyecto
- [ ] Miembros reciben notificación de acceso

---

### US-34: Auditoría de Cambios en Proyecto

**Como** owner o admin de proyecto
**Quiero** ver historial completo de cambios
**Para** auditoría de seguridad y cumplimiento

**Criterios de Aceptación:**
- [ ] Panel "Actividad" muestra timeline de cambios
- [ ] Cada entrada registra: usuario, acción, timestamp, detalles
- [ ] Acciones auditadas: crear, editar, eliminar items/secciones
- [ ] Accesos a items sensibles (credenciales) se registran
- [ ] Filtros por: usuario, tipo acción, rango de fechas
- [ ] Export de logs disponible para plan Enterprise

---

## Functional Requirements

### FR-050: Creación de Proyectos
- El sistema DEBE permitir a usuarios crear proyectos con nombre, descripción, color
- El sistema DEBE asignar al creador como owner automáticamente
- El sistema DEBE validar límites del plan antes de crear (Free: 2, Starter: 10, Professional+: ilimitado)
- El sistema DEBE generar UUID único para cada proyecto

### FR-051: Organización por Secciones
- El sistema DEBE permitir crear secciones/tags dentro de cada proyecto
- El sistema DEBE permitir nombres de sección únicos dentro del proyecto
- El sistema DEBE soportar reordenamiento de secciones con drag-and-drop
- El sistema DEBE respetar límites del plan (Free: 3 secciones, Starter: 10, Professional+: ilimitado)

### FR-052: Gestión de Items
- El sistema DEBE soportar tipos de items: Credencial, Documento, Enlace, Nota, Configuración
- El sistema DEBE permitir campos customizables por item según su tipo
- El sistema DEBE encriptar valores de campos tipo "password" en base de datos (AES-256)
- El sistema DEBE validar límites de items según plan (Free: 50, Starter: 200, Professional+: ilimitado)

### FR-053: Operaciones de Item
- El sistema DEBE permitir editar todos los campos de un item
- El sistema DEBE permitir clonar items duplicando todos sus datos
- El sistema DEBE permitir reordenar items dentro de su sección (mover arriba/abajo)
- El sistema DEBE solicitar confirmación antes de eliminar items
- El sistema DEBE registrar auditoría de todas las operaciones

### FR-054: Operaciones Batch (Professional+)
- El sistema DEBE permitir seleccionar múltiples items con checkboxes
- El sistema DEBE soportar acciones batch: mover a sección, eliminar, exportar
- El sistema DEBE validar feature gate antes de permitir operaciones batch
- El sistema DEBE mostrar progreso durante operaciones batch extensas

### FR-055: Búsqueda y Filtros
- El sistema DEBE implementar búsqueda full-text dentro del proyecto (Professional+)
- El sistema DEBE permitir búsqueda básica por nombre en planes inferiores
- El sistema DEBE permitir filtrar por: sección, tipo de item, fecha creación
- El sistema DEBE soportar búsqueda en campos específicos
- Búsqueda DEBE retornar resultados en <1 segundo

### FR-056: Exportación/Importación
- El sistema DEBE permitir exportar proyectos a CSV (Starter+) y JSON (Professional+)
- Export DEBE incluir: metadata proyecto, secciones, items, fields
- Passwords exportados DEBEN estar encriptados
- El sistema DEBE permitir importar desde CSV/JSON validando formato
- Importación DEBE validar límites del plan antes de procesar

### FR-057: Auditoría de Proyectos
- El sistema DEBE registrar en audit log: create, update, delete de proyectos, secciones, items
- El sistema DEBE registrar accesos a items sensibles (tipo credencial)
- Logs DEBEN incluir: timestamp, user_id, action, resource_id, changes (JSON)
- Logs DEBEN ser inmutables (insert-only)
- El sistema DEBE permitir filtrar y exportar logs (Enterprise)

### FR-058: Compartición de Proyectos
- Ver detalle en [Sharing & Collaboration Feature](sharing-collaboration.md)
- Niveles: Viewer, Editor, Admin
- Herencia de permisos a secciones e items
- Notificaciones de cambios

---

## Permisos RBAC

- `projects.create`: Crear nuevos proyectos
- `projects.read`: Ver proyectos asignados
- `projects.update`: Editar detalles de proyecto (nombre, descripción)
- `projects.delete`: Eliminar proyectos (solo propietario)
- `projects.manage_sections`: Crear/editar/eliminar secciones/tags
- `projects.manage_items`: Crear, editar, reordenar items
- `projects.delete_items`: Eliminar items del proyecto
- `projects.manage_members`: Agregar/remover miembros, asignar permisos
- `projects.export`: Exportar datos del proyecto

---

## Data Models

### Project Model

```python
class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    icon = models.CharField(max_length=50, default='folder')
    
    owner = models.ForeignKey('User', related_name='owned_projects', on_delete=models.PROTECT)
    status = models.CharField(
        max_length=20,
        choices=[('active', 'Active'), ('archived', 'Archived'), ('paused', 'Paused')],
        default='active'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['owner']),
        ]
```

### ProjectSection Model

```python
class ProjectSection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey('Project', related_name='sections', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default='#6B7280')
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_sections'
        ordering = ['order', 'created_at']
        unique_together = [['project', 'name']]
```

### ProjectItem Model

```python
class ProjectItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    section = models.ForeignKey('ProjectSection', related_name='items', on_delete=models.CASCADE)
    
    name = models.CharField(max_length=255)
    item_type = models.CharField(
        max_length=50,
        choices=[
            ('credential', 'Credential'),
            ('document', 'Document'),
            ('link', 'Link'),
            ('note', 'Note'),
            ('config', 'Configuration'),
        ]
    )
    order = models.IntegerField(default=0)
    
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_items'
        ordering = ['order', 'created_at']
```

### ProjectItemField Model

```python
class ProjectItemField(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    item = models.ForeignKey('ProjectItem', related_name='fields', on_delete=models.CASCADE)
    
    field_name = models.CharField(max_length=100)  # 'username', 'password', 'email', 'url', etc.
    field_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('password', 'Password'),
            ('email', 'Email'),
            ('url', 'URL'),
            ('date', 'Date'),
            ('textarea', 'Textarea'),
        ]
    )
    
    value = models.TextField()  # Encrypted for password fields
    is_encrypted = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'project_item_fields'
        unique_together = [['item', 'field_name']]
```

### ProjectMember Model

```python
class ProjectMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    project = models.ForeignKey('Project', related_name='members', on_delete=models.CASCADE)
    user = models.ForeignKey('User', related_name='project_memberships', on_delete=models.CASCADE)
    
    role = models.CharField(
        max_length=20,
        choices=[
            ('viewer', 'Viewer'),
            ('editor', 'Editor'),
            ('admin', 'Admin'),
        ]
    )
    
    added_by = models.ForeignKey('User', related_name='+', on_delete=models.SET_NULL, null=True)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_members'
        unique_together = [['project', 'user']]
```

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [Ver Sharing & Collaboration](sharing-collaboration.md)
- [Ver Billing Feature](billing.md)

---

**Última actualización**: 2026-02-10
