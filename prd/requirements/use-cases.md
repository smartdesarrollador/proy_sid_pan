# Casos de Uso Principales

[⬅️ Volver al README](../README.md)

---

## Índice
- [CU-001: Onboarding de Nueva Organización](#cu-001-onboarding-de-nueva-organización)
- [CU-002: Configuración de Roles Personalizados](#cu-002-configuración-de-roles-personalizados)
- [CU-003: Upgrade de Plan con Cambio de Límites](#cu-003-upgrade-de-plan-con-cambio-de-límites)
- [CU-004: Delegación Temporal de Permisos](#cu-004-delegación-temporal-de-permisos)
- [CU-005: Auditoría de Cambios en Permisos (Compliance)](#cu-005-auditoría-de-cambios-en-permisos-compliance)
- [CU-006: Compartir Proyecto con Control de Permisos](#cu-006-compartir-proyecto-con-control-de-permisos)
- [CU-007: Revocar Acceso a Elemento Compartido](#cu-007-revocar-acceso-a-elemento-compartido)
- [CU-008: Gestionar Herencia de Permisos en Proyecto](#cu-008-gestionar-herencia-de-permisos-en-proyecto)

---

## CU-001: Onboarding de Nueva Organización

**Actor**: Fundador/Admin

**Flujo**:
1. Usuario visita landing page y hace click en "Start Free Trial"
2. Completa formulario (nombre, email, contraseña, nombre organización)
3. Recibe email de verificación y activa cuenta
4. Asistente de onboarding guía: invitar equipo, configurar roles básicos, explorar features
5. Usuario invita a 3 miembros de equipo
6. Miembros reciben emails, activan cuentas, son asignados a roles
7. Admin explora dashboard y primeras features

**Tiempo objetivo**: <10 minutos hasta primer valor

---

## CU-002: Configuración de Roles Personalizados

**Actor**: Admin de Organización

**Flujo**:
1. Admin accede a Settings → Roles & Permissions
2. Crea nuevo rol "Content Editor" desde plantilla o scratch
3. Asigna permisos granulares: `content.create`, `content.edit_own`, `content.publish` (requiere aprobación)
4. Configura herencia: "Content Editor" hereda permisos de "Member"
5. Asigna rol a 5 usuarios del equipo de contenido
6. Sistema registra cambio en audit log con timestamp, autor, permisos modificados

**Criterio de éxito**: Usuario puede crear rol funcional en <5 minutos

---

## CU-003: Upgrade de Plan con Cambio de Límites

**Actor**: Admin de Organización

**Flujo**:
1. Organización en plan Starter (límite 10 usuarios) intenta invitar usuario #11
2. Sistema muestra mensaje: "Límite alcanzado. Upgrade a Professional para hasta 50 usuarios"
3. Admin hace click en "Upgrade Now"
4. Revisa comparación de planes y features desbloqueados
5. Confirma upgrade, ingresa método de pago si no existe
6. Sistema calcula proration: $X por días restantes del ciclo actual
7. Procesa pago, actualiza plan inmediatamente
8. Admin puede invitar usuarios adicionales sin fricción
9. Factura reflejará upgrade prorated + siguiente ciclo completo

**Criterio de éxito**: Upgrade completado en <3 minutos, sin downtime

---

## CU-004: Delegación Temporal de Permisos

**Actor**: Manager

**Flujo**:
1. Manager va de vacaciones por 2 semanas
2. Accede a "Delegate Permissions" y selecciona colega de confianza
3. Configura: permisos a delegar (ej: `approvals.expenses`), fecha inicio/fin
4. Sistema notifica al delegado vía email
5. Durante 2 semanas, delegado puede aprobar gastos
6. Audit log registra cada aprobación como "Aprobado por [Delegado] en nombre de [Manager]"
7. Tras 2 semanas, permisos expiran automáticamente
8. Manager recibe resumen de acciones tomadas por delegado

**Criterio de éxito**: Delegación configurada en <2 minutos, auto-expira sin intervención

---

## CU-005: Auditoría de Cambios en Permisos (Compliance)

**Actor**: Security Officer

**Flujo**:
1. Auditor externo solicita reporte de "quién tuvo acceso a datos financieros en Q4 2025"
2. Security Officer accede a Audit Logs → Permissions
3. Aplica filtros: recurso=`financial_data`, acción=`read`, fecha=Q4 2025
4. Sistema genera reporte CSV con: timestamp, usuario, acción, recurso, resultado (allow/deny), IP, user-agent
5. Reporte incluye cambios en asignación de roles que afectan ese permiso
6. Exporta y entrega a auditor

**Criterio de éxito**: Reporte generado en <30 segundos, inmutable (no modificable retroactivamente)

---

## CU-006: Compartir Proyecto con Control de Permisos

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

## CU-007: Revocar Acceso a Elemento Compartido

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

## CU-008: Gestionar Herencia de Permisos en Proyecto

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

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver User Stories](user-stories.md)
- [➡️ Ver Functional Requirements](functional-requirements.md)

---

**Última actualización**: 2026-02-10
