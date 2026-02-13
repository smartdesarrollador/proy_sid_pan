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
- [CU-009: Crear Tarjeta Digital desde Panel Cliente](#cu-009-crear-tarjeta-digital-desde-panel-cliente)
- [CU-010: Personalizar Landing Page Pública](#cu-010-personalizar-landing-page-pública)
- [CU-011: Gestionar Portafolio de Proyectos](#cu-011-gestionar-portafolio-de-proyectos)
- [CU-012: Generar CV Digital desde Perfil](#cu-012-generar-cv-digital-desde-perfil)
- [CU-013: Configurar Dominio Personalizado (Enterprise)](#cu-013-configurar-dominio-personalizado-enterprise)

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

## CU-009: Crear Tarjeta Digital desde Panel Cliente

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

---

## CU-010: Personalizar Landing Page Pública

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

---

## CU-011: Gestionar Portafolio de Proyectos

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

---

## CU-012: Generar CV Digital desde Perfil

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

---

## CU-013: Configurar Dominio Personalizado (Enterprise)

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

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver User Stories](user-stories.md)
- [➡️ Ver Functional Requirements](functional-requirements.md)

---

**Última actualización**: 2026-02-12
