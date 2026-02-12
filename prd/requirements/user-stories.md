# User Stories

[⬅️ Volver al README](../README.md)

---

## Índice
- [3.1 Autenticación y Gestión de Usuarios](#31-autenticación-y-gestión-de-usuarios)
- [3.2 Sistema de Roles y Permisos (RBAC)](#32-sistema-de-roles-y-permisos-rbac)
- [3.3 Gestión de Suscripciones y Facturación](#33-gestión-de-suscripciones-y-facturación)
- [3.4 Multi-Tenancy y Aislamiento de Datos](#34-multi-tenancy-y-aislamiento-de-datos)
- [3.5 Gestión de Proyectos (Cliente)](#35-gestión-de-proyectos-cliente)
- [3.6 Compartición y Colaboración](#36-compartición-y-colaboración)

---

## 3. User Stories

### 3.1 Autenticación y Gestión de Usuarios

**US-001: Registro de Nueva Organización**
Como fundador de startup, quiero registrarme con email/contraseña y crear mi organización, para empezar a usar el producto en menos de 5 minutos.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre, email, contraseña, nombre organización
- [ ] Validación de email único, contraseña fuerte (8+ chars, mayúscula, número, símbolo)
- [ ] Se crea tenant con subdomain `organizacion.plataforma.com`
- [ ] Usuario recibe email de verificación con link expirable (24h)
- [ ] Tras verificar, usuario es redirigido a onboarding wizard
- [ ] Se crea automáticamente rol OrgAdmin y se asigna al usuario

---

**US-002: Login con JWT y Refresh Token**
Como usuario registrado, quiero hacer login con email/contraseña y obtener tokens JWT, para acceder de forma segura sin re-autenticarme constantemente.

**Criterios de Aceptación:**
- [ ] Endpoint POST /api/v1/auth/login recibe email/password
- [ ] Respuesta incluye access_token (exp 15min), refresh_token (exp 7d), user profile
- [ ] Access token incluye claims: user_id, tenant_id, roles, permissions
- [ ] Refresh token permite obtener nuevo access token sin re-login
- [ ] Tras 5 intentos fallidos, cuenta se bloquea temporalmente (15 min)
- [ ] Se registra login en audit log con IP, user-agent, timestamp

---

**US-003: Invitación de Miembros de Equipo**
Como admin de organización, quiero invitar miembros por email con rol asignado, para construir mi equipo rápidamente.

**Criterios de Aceptación:**
- [ ] Formulario permite ingresar emails (múltiples) y seleccionar rol
- [ ] Sistema valida límite de usuarios según plan actual
- [ ] Se envían emails con link de invitación (expira 7 días)
- [ ] Invitado puede aceptar, crear contraseña, y acceder inmediatamente
- [ ] Si email ya existe en otro tenant, puede aceptar y tener acceso a ambos
- [ ] Admin ve estado de invitaciones: pending, accepted, expired

---

**US-004: Activación de MFA (Multi-Factor Auth)**
Como usuario preocupado por seguridad, quiero habilitar MFA con TOTP (Google Authenticator), para proteger mi cuenta contra accesos no autorizados.

**Criterios de Aceptación:**
- [ ] En perfil de usuario, opción "Enable MFA"
- [ ] Sistema genera QR code con secret para escanear con app TOTP
- [ ] Usuario ingresa código de 6 dígitos para verificar configuración
- [ ] Tras habilitar, login requiere email/password + código TOTP
- [ ] Se generan 10 códigos de recuperación de un solo uso
- [ ] Admin puede forzar MFA obligatorio para toda la organización

---

**US-005: Gestión de Sesiones Concurrentes**
Como usuario que accede desde múltiples dispositivos, quiero ver mis sesiones activas y poder cerrarlas remotamente, para controlar dónde estoy autenticado.

**Criterios de Aceptación:**
- [ ] Pantalla "Active Sessions" muestra: dispositivo, navegador, IP, última actividad
- [ ] Usuario puede cerrar sesión individual con botón "Revoke"
- [ ] Botón "Revoke All" cierra todas excepto la actual
- [ ] Cerrar sesión invalida refresh token asociado
- [ ] Límite de 5 sesiones concurrentes (configurable por plan)
- [ ] Notificación si se detecta login desde ubicación inusual

---

### 3.2 Sistema de Roles y Permisos (RBAC)

**US-006: Creación de Rol Personalizado**
Como admin de organización, quiero crear roles personalizados con permisos específicos, para adaptar el control de acceso a mi estructura organizacional.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre rol, descripción, permisos
- [ ] Permisos organizados por recurso (Users, Content, Projects, Billing) y acción (create, read, update, delete)
- [ ] Vista previa muestra resumen de lo que el rol puede hacer
- [ ] Puedo seleccionar rol existente como plantilla
- [ ] Se valida que nombre de rol sea único en el tenant
- [ ] Cambios se registran en audit log

---

**US-007: Asignación de Rol a Usuario**
Como admin, quiero asignar roles a usuarios, para controlar qué pueden hacer en la plataforma.

**Criterios de Aceptación:**
- [ ] Desde perfil de usuario, selector de rol(es) disponibles
- [ ] Usuario puede tener múltiples roles (permisos se suman)
- [ ] Cambio de rol es efectivo inmediatamente (sin re-login)
- [ ] Se notifica al usuario vía email si cambia su rol
- [ ] No puedo remover último OrgAdmin (prevenir lockout)
- [ ] Audit log registra quién cambió rol de quién y cuándo

---

**US-008: Permisos Condicionales (Context-Aware)**
Como admin, quiero configurar permisos que dependan del contexto (ej: "editar solo documentos propios"), para tener control granular sin crear muchos roles.

**Criterios de Aceptación:**
- [ ] Al asignar permiso `document.edit`, puedo seleccionar scope: "all", "own", "department"
- [ ] Scope "own" solo permite editar documentos donde user_id = creador
- [ ] Scope "department" usa campo department_id del usuario y documento
- [ ] Backend valida scope en cada request mediante middleware
- [ ] Frontend oculta/deshabilita acciones no permitidas según scope
- [ ] Se pueden definir scopes personalizados (custom logic en código)

---

**US-009: Jerarquía de Roles con Herencia**
Como admin, quiero definir que "Manager" herede todos los permisos de "Member" más permisos adicionales, para simplificar gestión de roles.

**Criterios de Aceptación:**
- [ ] Al crear/editar rol, puedo seleccionar "Inherits from" otro rol
- [ ] Permisos heredados se muestran en color diferente (no editables directamente)
- [ ] Puedo agregar permisos adicionales sobre los heredados
- [ ] Cambios en rol padre se propagan automáticamente a roles hijos
- [ ] No se permiten herencias circulares (validación)
- [ ] Máximo 3 niveles de herencia (performance consideration)

---

**US-010: Delegación Temporal de Permisos**
Como manager que va de vacaciones, quiero delegar mis permisos de aprobación a un colega temporalmente, para que el trabajo no se detenga.

**Criterios de Aceptación:**
- [ ] Opción "Delegate Permissions" con selector de usuario y fecha inicio/fin
- [ ] Puedo seleccionar qué permisos delegar (no necesariamente todos)
- [ ] Delegado recibe notificación por email
- [ ] Durante el período, delegado puede ejercer esos permisos
- [ ] Audit log registra acciones como "por [Delegado] en nombre de [Original]"
- [ ] Tras fecha fin, permisos expiran automáticamente (cronjob diario)
- [ ] Puedo revocar delegación antes de tiempo

---

**US-011: Grupos de Permisos Predefinidos**
Como admin, quiero usar grupos de permisos predefinidos (ej: "Financial Access", "HR Access"), para asignar múltiples permisos relacionados de una vez.

**Criterios de Aceptación:**
- [ ] Sistema incluye grupos predefinidos: Basic Access, Financial, HR, Engineering, Sales
- [ ] Al asignar grupo a usuario, se otorgan todos los permisos del grupo
- [ ] Puedo crear grupos personalizados para mi organización
- [ ] Cambios en grupo se propagan a todos los usuarios con ese grupo
- [ ] Usuario ve permisos individuales, no solo nombre del grupo
- [ ] Puedo quitar permisos individuales de un grupo sin afectar el grupo base

---

**US-012: Auditoría Completa de Cambios en Permisos**
Como security officer, quiero ver un log inmutable de todos los cambios en roles/permisos, para cumplir con auditorías de compliance.

**Criterios de Aceptación:**
- [ ] Tabla audit_logs registra: timestamp, actor_user_id, action, resource_type, resource_id, changes (JSON), IP, user_agent
- [ ] Cambios en roles: creación, edición, eliminación
- [ ] Cambios en asignaciones: usuario X recibió/perdió rol Y
- [ ] Cambios en permisos de rol: permisos agregados/removidos
- [ ] Logs son inmutables (insert-only, no updates/deletes)
- [ ] UI permite filtrar por: usuario, acción, recurso, rango de fechas
- [ ] Exportación a CSV/JSON para entregar a auditores
- [ ] Retención: 7 años (compliance SOC2/GDPR)

---

### 3.3 Gestión de Suscripciones y Facturación

**US-013: Selección de Plan Durante Onboarding**
Como nuevo usuario, quiero elegir un plan (Free trial, Starter, Professional) durante el registro, para empezar con el plan adecuado a mis necesidades.

**Criterios de Aceptación:**
- [ ] Durante onboarding, se muestra comparación de planes con features/límites
- [ ] Por defecto se selecciona Free Trial (14 días, no requiere tarjeta)
- [ ] Si elige plan pago, se solicita método de pago (Stripe Elements)
- [ ] Tras trial, si no upgradea, pasa a plan Free (limitado)
- [ ] Email recordatorio 7 días antes de fin de trial
- [ ] Dashboard muestra días restantes de trial con CTA "Upgrade Now"

---

**US-014: Upgrade de Plan con Proration**
Como admin en plan Starter, quiero hacer upgrade a Professional a mitad de mes, pagando solo la diferencia prorrateada, para aprovechar features inmediatamente sin pagar de más.

**Criterios de Aceptación:**
- [ ] Botón "Upgrade Plan" disponible en Billing settings
- [ ] Sistema calcula proration: (días restantes / días totales) * diferencia de precio
- [ ] Muestra breakdown: "Starter restante: -$X, Professional prorrateado: +$Y, Total hoy: $Z"
- [ ] Tras confirmar, se cobra proration inmediatamente
- [ ] Plan actualiza al instante (sin esperar a fin de mes)
- [ ] Siguiente factura será Professional completo (ciclo mensual/anual)
- [ ] Email confirmación con recibo PDF

---

**US-015: Downgrade de Plan con Límites**
Como admin en plan Professional, quiero hacer downgrade a Starter, entendiendo que perderé features y ajustaré límites.

**Criterios de Aceptación:**
- [ ] Sistema valida límites del nuevo plan (ej: Starter = 10 usuarios, Pro = 50)
- [ ] Si excede límites, muestra advertencia: "Tienes 25 usuarios, Starter permite 10. Desactiva 15 usuarios para continuar."
- [ ] Tras confirmar, downgrade toma efecto al final del ciclo de facturación actual
- [ ] No se cobra proration (se mantiene Pro hasta fin de período pagado)
- [ ] Features de Pro permanecen activas hasta fin de ciclo
- [ ] Email confirmación con fecha efectiva del downgrade

---

**US-016: Gestión de Métodos de Pago**
Como admin, quiero agregar/editar/eliminar tarjetas de crédito, para tener control sobre cómo se factura mi suscripción.

**Criterios de Aceptación:**
- [ ] Pantalla "Payment Methods" muestra tarjetas guardadas (últimos 4 dígitos, brand, exp)
- [ ] Puedo agregar nueva tarjeta con Stripe Elements (PCI-compliant)
- [ ] Puedo marcar una tarjeta como "Default" para futuros cargos
- [ ] Puedo eliminar tarjetas (excepto la default si hay suscripción activa)
- [ ] Webhook de Stripe notifica si tarjeta expira/es declinada
- [ ] Sistema intenta cobrar con tarjetas alternativas antes de suspender servicio

---

**US-017: Facturación Automática y Recibos**
Como admin, quiero que el sistema facture automáticamente cada mes/año y me envíe recibos, para no preocuparme por renovaciones.

**Criterios de Aceptación:**
- [ ] Cronjob diario verifica suscripciones a renovar (fecha de facturación)
- [ ] Se crea cargo en Stripe con descripción del plan y período
- [ ] Tras cobro exitoso, se extiende fecha de próxima renovación
- [ ] Se genera PDF con recibo (logo empresa, desglose, impuestos)
- [ ] Email con recibo adjunto + link a descargar desde dashboard
- [ ] Si falla pago, se reintenta 3 veces (día 1, 3, 7) antes de suspender
- [ ] Email notificación de fallo de pago con link para actualizar método

---

**US-018: Cancelación de Suscripción**
Como admin insatisfecho, quiero cancelar mi suscripción, manteniendo acceso hasta el final del período pagado.

**Criterios de Aceptación:**
- [ ] Botón "Cancel Subscription" en Billing settings
- [ ] Modal de confirmación explica: "Acceso hasta [fecha], luego pasarás a plan Free"
- [ ] Opcional: formulario de feedback sobre razón de cancelación
- [ ] Tras confirmar, suscripción marca como "canceled" pero activa hasta fin de período
- [ ] No se cobra siguiente ciclo
- [ ] Email confirmación con fecha de fin de acceso
- [ ] Al llegar fecha, tenant migra a plan Free (se deshabilitan features Pro)

---

**US-019: Feature Gates por Plan**
Como desarrollador del sistema, quiero que features se habiliten/deshabiliten automáticamente según el plan, para monetizar correctamente.

**Criterios de Aceptación:**
- [ ] Tabla `features` define qué features están disponibles en qué planes
- [ ] Middleware backend valida feature gate en cada request (`@require_feature('advanced_roles')`)
- [ ] Si usuario intenta usar feature no disponible, respuesta 403 con mensaje "Upgrade to Professional"
- [ ] Frontend consulta features disponibles al cargar (endpoint `/api/v1/features`)
- [ ] Componentes se ocultan/deshabilitan si feature no disponible
- [ ] Ejemplo features: custom_roles (Pro+), mfa (Starter+), sso (Enterprise), api_access (Pro+)

---

**US-020: Límites de Uso por Plan**
Como admin en plan Starter, quiero ver cuánto he consumido de mis límites (usuarios, storage, API calls), para saber cuándo necesito upgrade.

**Criterios de Aceptación:**
- [ ] Dashboard muestra progress bars: "8/10 users", "2.3GB/5GB storage", "1,234/10,000 API calls"
- [ ] Límites se validan en tiempo real (ej: no puedo invitar usuario #11 en plan Starter)
- [ ] Al acercarse a límite (80%), email de advertencia
- [ ] Al alcanzar 100%, modal sugiere upgrade
- [ ] Tabla `usage_tracking` registra consumo diario para analytics
- [ ] Planes: Free (5 users, 1GB, 1k API), Starter (10/5GB/10k), Pro (50/50GB/100k), Enterprise (unlimited)

---

### 3.4 Multi-Tenancy y Aislamiento de Datos

**US-021: Aislamiento Completo de Datos con RLS**
Como usuario de tenant A, nunca debo poder ver/modificar datos de tenant B, incluso si hay bug en código.

**Criterios de Aceptación:**
- [ ] PostgreSQL RLS policies en todas las tablas multi-tenant
- [ ] Policy: `CREATE POLICY tenant_isolation ON table USING (tenant_id = current_setting('app.tenant_id')::uuid)`
- [ ] Middleware Django establece `SET LOCAL app.tenant_id = X` al inicio de cada request
- [ ] Tests de seguridad verifican que queries no filtren datos entre tenants
- [ ] SuperAdmin puede acceder a cualquier tenant (con flag explícito + audit log)
- [ ] Indexes incluyen tenant_id como prefijo para performance

---

**US-022: Subdominios Personalizados por Tenant**
Como admin de organización "Acme Corp", quiero que mi equipo acceda via `acme.plataforma.com`, para branding profesional.

**Criterios de Aceptación:**
- [ ] Durante onboarding, se genera subdomain basado en nombre organización (slug)
- [ ] Validación: solo alfanumérico-guiones, único, no keywords reservadas
- [ ] DNS wildcard *.plataforma.com apunta a load balancer
- [ ] Middleware detecta subdomain del request, identifica tenant, establece contexto
- [ ] Si subdomain no existe, redirect a landing page
- [ ] Plan Enterprise permite custom domain completo (ej: portal.acmecorp.com) con CNAME

---

**US-023: Tenant Switching para Usuarios Multi-Org**
Como consultor que trabaja con 3 clientes, quiero cambiar entre organizaciones sin cerrar sesión, para ser más productivo.

**Criterios de Aceptación:**
- [ ] Dropdown en navbar muestra organizaciones donde tengo acceso
- [ ] Cambiar organización recarga app con nuevo contexto (sin re-login)
- [ ] JWT incluye `available_tenants: [{id, name, role}]`
- [ ] Al cambiar, se genera nuevo access token con tenant_id actualizado
- [ ] Navegación no pierde estado de la app
- [ ] Audit log registra tenant switches

---

**US-024: Configuración por Tenant (Branding)**
Como admin, quiero personalizar logo, colores, y nombre de organización, para que la plataforma se sienta como nuestra.

**Criterios de Aceptación:**
- [ ] Settings → Branding permite subir logo (PNG/SVG, max 500KB)
- [ ] Color picker para primary color (aplica a botones, links)
- [ ] Preview en tiempo real de cambios
- [ ] Logo se muestra en navbar, emails, y reportes PDF
- [ ] Custom branding solo disponible en plan Professional+
- [ ] Plan Enterprise permite ocultar "Powered by [Plataforma]"

---

**US-025: Métricas por Tenant para Analytics**
Como Product Manager, quiero ver métricas agregadas por tenant (usuarios activos, features usadas, churn), para identificar patrones.

**Criterios de Aceptación:**
- [ ] Dashboard SuperAdmin muestra: MAU por tenant, plan distribution, MRR, churn rate
- [ ] Drill-down en tenant individual: usuarios activos últimos 30d, features más usadas, tickets de soporte
- [ ] Alertas si tenant grande (>100 users) está en riesgo de churn (poco uso, tickets abiertos)
- [ ] Export a CSV para análisis en BI tools
- [ ] Datos anonimizados para compliance (no PII sin consentimiento)

---

### 3.5 Gestión de Proyectos (Cliente)

**US-26: Crear Proyecto**
- Como usuario cliente
- Quiero crear un nuevo proyecto con nombre y descripción
- Para organizar mis credenciales, documentos y enlaces

**Criterios de Aceptación:**
- [ ] Usuario puede crear proyecto desde botón "+ Nuevo Proyecto"
- [ ] Formulario solicita: nombre (requerido), descripción (opcional), color
- [ ] Sistema valida límites del plan (Free: 2 proyectos max)
- [ ] Proyecto creado aparece en lista "Mis Proyectos"
- [ ] Usuario es asignado como owner del proyecto automáticamente

---

**US-27: Organizar Items por Secciones**
- Como usuario con proyecto existente
- Quiero crear secciones/tags para agrupar items relacionados
- Para mantener organizado el contenido del proyecto

**Criterios de Aceptación:**
- [ ] Usuario puede crear sección desde panel del proyecto
- [ ] Sección tiene nombre único dentro del proyecto
- [ ] Usuario puede colapsar/expandir secciones
- [ ] Items se muestran agrupados por sección
- [ ] Sistema respeta límites del plan (Free: 3 secciones max)

---

**US-28: Gestionar Items de Credenciales**
- Como usuario del proyecto
- Quiero agregar items con campos customizables (usuario, password, email)
- Para almacenar credenciales de forma segura

**Criterios de Aceptación:**
- [ ] Usuario puede crear item dentro de una sección
- [ ] Item tipo "Credencial" tiene campos: usuario, password, email, URL, notas
- [ ] Campo password se muestra oculto por defecto (•••)
- [ ] Usuario puede mostrar/ocultar password con botón
- [ ] Passwords se almacenan encriptados en base de datos
- [ ] Sistema respeta límites del plan (Free: 50 items max)

---

**US-29: Operaciones de Item Individual**
- Como usuario con permisos de edición
- Quiero editar, copiar, reordenar y eliminar items
- Para gestionar el contenido del proyecto eficientemente

**Criterios de Aceptación:**
- [ ] Botón editar (✏️) abre modal con formulario de campos
- [ ] Botón copiar (📋) duplica el item con sufijo "(copia)"
- [ ] Botones ordenar (↑↓) mueven item arriba/abajo dentro de sección
- [ ] Botón info (ℹ️) muestra metadata (creado por, fecha)
- [ ] Botón eliminar (🗑️) solicita confirmación antes de borrar
- [ ] Auditoría registra todas las operaciones

---

**US-30: Operaciones Batch (Professional+)**
- Como usuario con plan Professional
- Quiero seleccionar múltiples items y aplicar acciones masivas
- Para ahorrar tiempo en gestión de proyectos grandes

**Criterios de Aceptación:**
- [ ] Checkboxes disponibles para selección múltiple
- [ ] Barra de acciones aparece al seleccionar items
- [ ] Acciones disponibles: Mover a sección, Eliminar, Exportar
- [ ] Confirmación requerida para operaciones destructivas
- [ ] Feature gate valida plan Professional antes de permitir

---

**US-31: Búsqueda y Filtros**
- Como usuario con muchos items
- Quiero buscar y filtrar dentro del proyecto
- Para encontrar información rápidamente

**Criterios de Aceptación:**
- [ ] Barra de búsqueda disponible en vista de proyecto
- [ ] Búsqueda en tiempo real (debounce 300ms)
- [ ] Busca en: título item, campos de texto, nombre sección
- [ ] Filtros laterales por: tipo item, sección/tag
- [ ] Resultados destacan texto coincidente

---

**US-32: Exportar/Importar Proyectos**
- Como usuario con plan Starter+
- Quiero exportar proyecto a CSV/JSON e importar desde archivo
- Para backup y migración de datos

**Criterios de Aceptación:**
- [ ] Botón "Exportar" genera archivo descargable
- [ ] Formatos soportados: CSV (Starter+), JSON (Professional+)
- [ ] Export incluye: proyecto, secciones, items, fields
- [ ] Passwords exportados quedan encriptados en archivo
- [ ] Importar valida formato y límites del plan
- [ ] Importar permite mapeo de campos si difieren

---

**US-33: Compartir Proyecto con Equipo**
- Como owner de proyecto
- Quiero compartir el proyecto con miembros de mi organización
- Para colaborar en la gestión de credenciales y documentos

**Criterios de Aceptación:**
- [ ] Botón "Compartir" abre modal de gestión de miembros
- [ ] Owner puede agregar usuarios de la organización
- [ ] Roles disponibles: Viewer, Editor, Admin
- [ ] Viewer: solo lectura
- [ ] Editor: leer, crear, editar items (no eliminar proyecto)
- [ ] Admin: todas las operaciones excepto eliminar proyecto
- [ ] Miembros reciben notificación de acceso

---

**US-34: Auditoría de Cambios en Proyecto**
- Como owner o admin de proyecto
- Quiero ver historial completo de cambios
- Para auditoría de seguridad y cumplimiento

**Criterios de Aceptación:**
- [ ] Panel "Actividad" muestra timeline de cambios
- [ ] Cada entrada registra: usuario, acción, timestamp, detalles
- [ ] Acciones auditadas: crear, editar, eliminar items/secciones
- [ ] Accesos a items sensibles (credenciales) se registran
- [ ] Filtros por: usuario, tipo acción, rango de fechas
- [ ] Export de logs disponible para plan Enterprise

---

### 3.6 Compartición y Colaboración

**US-032: Compartir Elemento Individual**

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

**US-033: Gestionar Permisos de Compartición**

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

**US-034: Compartir Grupo de Elementos con Herencia**

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

**US-035: Acceder a Elementos Compartidos Conmigo**

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

**US-036: Auditar Compartición para Compliance**

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


---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Casos de Uso](use-cases.md)
- [➡️ Ver Functional Requirements](functional-requirements.md)

---

**Última actualización**: 2026-02-10
