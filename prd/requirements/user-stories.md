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
- [3.7 Internacionalización y Experiencia de Usuario](#37-internacionalización-y-experiencia-de-usuario)
- [3.8 Digital Services (Servicios Públicos)](#38-digital-services-servicios-públicos)
- [3.9 Analytics de Negocio](#39-analytics-de-negocio)
- [3.10 Sistema de Promociones](#310-sistema-de-promociones)

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

### 3.7 Internacionalización y Experiencia de Usuario

**US-037: Cambio de Idioma en Panel de Admin**

**Como** administrador de organización,
**Quiero** cambiar el idioma de la interfaz entre Español e Inglés desde el panel de admin,
**Para** usar la plataforma en mi idioma preferido y facilitar la gestión.

**Criterios de aceptación:**
- [ ] Language switcher visible en navbar del panel de admin (top-right)
- [ ] Selector muestra opciones: Español (ES), English (EN)
- [ ] Al seleccionar idioma, toda la UI cambia inmediatamente (textos, labels, mensajes)
- [ ] Cambio de idioma NO requiere recargar página (SPA behavior)
- [ ] Idioma seleccionado se guarda en backend (`user.preferences.language`)
- [ ] Idioma se persiste entre sesiones (localStorage + backend sync)
- [ ] Textos dinámicos (datos del usuario) NO se traducen (solo UI)

**Escenarios de prueba:**
- Login en español → Cambiar a inglés → Validar que navbar, sidebar, botones cambien
- Cambiar idioma → Recargar página → Idioma se mantiene
- Cambiar idioma en admin → Abrir cliente → Cliente también usa nuevo idioma

---

**US-038: Cambio de Idioma en Portal de Cliente**

**Como** usuario final del portal de cliente,
**Quiero** cambiar el idioma de la interfaz desde el portal de cliente,
**Para** interactuar con tareas, calendario y proyectos en mi idioma preferido.

**Criterios de aceptación:**
- [ ] Language switcher visible en navbar del portal de cliente
- [ ] Misma funcionalidad que panel de admin (cambio instantáneo, persistencia)
- [ ] Servicios (Tareas, Calendario, Proyectos, Archivos) se traducen
- [ ] Nombres de estados, prioridades, tipos se traducen (TODO → Por Hacer, High → Alta)
- [ ] Fechas se formatean según locale (ES: dd/MM/yyyy, EN: MM/dd/yyyy)

**Escenarios de prueba:**
- Crear tarea en español → Cambiar a inglés → Validar estados (TODO → To Do, DONE → Done)
- Ver calendario en inglés → Nombres de meses y días en inglés

---

**US-039: Persistencia de Preferencia de Idioma**

**Como** usuario de la plataforma,
**Quiero** que mi idioma preferido se guarde en mi perfil,
**Para** no tener que seleccionarlo cada vez que hago login.

**Criterios de aceptación:**
- [ ] Primera vez que hago login, sistema detecta idioma del navegador (Accept-Language header)
- [ ] Si cambio idioma manualmente, preferencia se guarda en backend
- [ ] Endpoint `PATCH /api/v1/users/me/preferences` acepta `{"language": "es" | "en"}`
- [ ] Backend actualiza campo `user.preferences.language` (JSONB)
- [ ] Al hacer login desde nuevo dispositivo, idioma guardado se aplica
- [ ] Si no hay idioma guardado, usar español como default

**Escenarios de prueba:**
- Login en español → Cambiar a inglés → Logout → Login → Sigue en inglés
- Login desde móvil en inglés → Cambiar a español → Login desde desktop → Sigue en español

---

**US-040: Cambio de Tema (Light/Dark)**

**Como** usuario de la plataforma,
**Quiero** cambiar entre tema claro y oscuro,
**Para** reducir fatiga visual según la hora del día y mis preferencias.

**Criterios de aceptación:**
- [ ] Theme switcher visible en navbar (icono sol/luna)
- [ ] Click alterna entre light mode y dark mode
- [ ] Dark mode aplica inmediatamente sin reload (clase `dark` en `<html>`)
- [ ] Todos los componentes respetan tema (Tailwind `dark:` classes)
- [ ] Colores mantienen contraste WCAG AA en ambos temas
- [ ] Tema se persiste en localStorage (`theme: 'light' | 'dark'`)
- [ ] Auto-detect: Si no hay preferencia guardada, usar `prefers-color-scheme` del navegador

**Escenarios de prueba:**
- Cambiar a dark mode → Validar navbar, sidebar, cards, modals en dark
- Cambiar tema → Recargar página → Tema se mantiene
- Navegador en dark mode → Primera vez → Sistema usa dark por default

---

**US-041: Persistencia de Preferencia de Tema**

**Como** usuario de la plataforma,
**Quiero** que mi tema preferido se sincronice entre dispositivos,
**Para** tener experiencia consistente en desktop, móvil, tablet.

**Criterios de aceptación:**
- [ ] Tema se guarda en backend además de localStorage
- [ ] Endpoint `PATCH /api/v1/users/me/preferences` acepta `{"theme": "light" | "dark" | "auto"}`
- [ ] Opción "Auto" respeta `prefers-color-scheme` del dispositivo
- [ ] Login desde nuevo dispositivo aplica tema guardado
- [ ] Si localStorage y backend difieren, backend tiene precedencia

**Escenarios de prueba:**
- Cambiar a dark en desktop → Login en móvil → Móvil usa dark
- Seleccionar "Auto" → Cambiar tema del sistema a dark → App cambia a dark

---

### 3.8 Digital Services (Servicios Públicos)

**US-042: Crear y Editar Tarjeta Digital desde Panel Cliente**

**Como** usuario,
**Quiero** crear mi tarjeta digital con información de contacto y enlaces sociales,
**Para** tener una presencia profesional online con URL compartible.

**Criterios de Aceptación:**
- [ ] Formulario solicita: nombre, título, foto, bio, email, teléfono, redes sociales
- [ ] Preview en tiempo real muestra cambios al editar
- [ ] Sistema valida username único globalmente
- [ ] Colores del tema personalizables (color primario, fondo)
- [ ] Tarjeta publicada accesible en `/tarjeta/{username}` sin autenticación
- [ ] Botón "Editar" permite modificar después de publicar

**Escenarios de prueba:**
- Usuario Free crea primera tarjeta → Publicada exitosamente
- Username "jsmith" ya existe → Sugiere "jsmith1", "j-smith", "john-smith"
- Usuario edita bio y color → Preview actualiza inmediatamente

---

**US-043: Compartir Tarjeta vía QR Code**

**Como** usuario,
**Quiero** generar QR code de mi tarjeta digital,
**Para** compartir mi contacto fácilmente en eventos o imprimir en tarjetas físicas.

**Criterios de Aceptación:**
- [ ] Botón "Generar QR" crea código QR apuntando a URL pública
- [ ] QR descargable como PNG (300x300px, 600x600px, 1200x1200px)
- [ ] QR incluye logo/avatar en centro (opcional)
- [ ] Opción "Copiar Link" copia URL al portapapeles
- [ ] Modal muestra preview del QR antes de descargar

---

**US-044: Exportar vCard para Contactos**

**Como** usuario con plan Starter+,
**Quiero** exportar mi tarjeta como archivo vCard (.vcf),
**Para** que otros puedan agregar mi contacto a sus teléfonos con un click.

**Criterios de Aceptación:**
- [ ] Botón "Exportar vCard" genera archivo `.vcf`
- [ ] vCard incluye: nombre, email, teléfono, URL de tarjeta, foto
- [ ] Compatible con iOS Contacts y Google Contacts
- [ ] Feature gate valida plan Starter+ antes de exportar

---

**US-045: Personalizar Colores y Foto de Perfil**

**Como** usuario,
**Quiero** personalizar colores de mi tarjeta y subir foto de perfil profesional,
**Para** reflejar mi identidad de marca personal.

**Criterios de Aceptación:**
- [ ] Color picker permite seleccionar color primario (usado en botones, links)
- [ ] Color picker para fondo (sólido o degradado)
- [ ] Upload de foto con preview y crop
- [ ] Validación: JPG/PNG, max 5MB, min 200x200px
- [ ] Compresión automática si excede 500KB
- [ ] Opción "Usar avatar de Gravatar" (basado en email)

---

**US-046: Ver Analytics de Vistas en Tarjeta**

**Como** usuario con plan Starter+,
**Quiero** ver cuántas personas han visitado mi tarjeta digital,
**Para** medir el alcance de mi presencia online.

**Criterios de Aceptación:**
- [ ] Dashboard muestra: total views, unique visitors, views últimos 7/30 días
- [ ] Gráfico de líneas muestra tendencia de vistas por día
- [ ] No se trackean vistas del propio usuario (by session)
- [ ] Analytics disponibles solo para Starter+ (UpgradePrompt para Free)
- [ ] Clicks en enlaces sociales trackeados individualmente

---

**US-047: Seleccionar Template de Landing Page**

**Como** usuario con plan Starter+,
**Quiero** elegir un template profesional para mi landing page,
**Para** crear una presencia online atractiva sin diseñar desde cero.

**Criterios de Aceptación:**
- [ ] Galería muestra templates disponibles según plan
- [ ] Free: 1 template (Basic) - solo lectura
- [ ] Starter: 3 templates (Minimal, Corporate, Creative)
- [ ] Professional: Todos los templates + custom CSS
- [ ] Preview de template muestra diseño completo antes de seleccionar
- [ ] Cambiar template preserva contenido, solo cambia diseño

---

**US-048: Editar Secciones de Landing (Hero, About, Services, Contact)**

**Como** usuario,
**Quiero** personalizar las secciones de mi landing page,
**Para** comunicar efectivamente mi propuesta de valor y servicios.

**Criterios de Aceptación:**
- [ ] Editor muestra secciones: Hero, About, Services, Portfolio, Contact
- [ ] Drag & drop para reordenar secciones
- [ ] Toggle para mostrar/ocultar secciones
- [ ] **Hero**: Título, subtítulo, CTA button (texto + link), background image
- [ ] **About**: Rich text editor (markdown), imagen lateral
- [ ] **Services**: Grid de servicios (hasta 6), cada uno con ícono, título, descripción
- [ ] **Contact**: Formulario (nombre, email, mensaje) con configuración de email destino
- [ ] Preview responsive (mobile/tablet/desktop)

---

**US-049: Agregar Formulario de Contacto**

**Como** usuario,
**Quiero** incluir formulario de contacto en mi landing,
**Para** que visitantes puedan comunicarse conmigo directamente.

**Criterios de Aceptación:**
- [ ] Formulario tiene campos: nombre, email, asunto, mensaje
- [ ] Validación client-side y server-side
- [ ] Configuración de email destino (por defecto: email del usuario)
- [ ] Anti-spam con reCAPTCHA (opcional, Professional+)
- [ ] Notificación in-app cuando recibe nuevo mensaje
- [ ] Rate limiting: max 20 mensajes/hora por IP

---

**US-050: Configurar Meta Tags para SEO**

**Como** usuario con plan Professional+,
**Quiero** configurar meta tags personalizados,
**Para** mejorar el ranking de mi landing en buscadores.

**Criterios de Aceptación:**
- [ ] Campos: Meta title (max 60 chars), meta description (max 160 chars)
- [ ] Upload de Open Graph image (1200x630px recomendado)
- [ ] Preview muestra cómo se verá en Google, Facebook, Twitter
- [ ] Auto-generación de OG image si no se sube (título + foto perfil)
- [ ] Tags incluidos: og:title, og:description, og:image, twitter:card
- [ ] HTML source muestra tags en `<head>` (validar con SSR)

---

**US-051: Integrar Google Analytics**

**Como** usuario con plan Professional+,
**Quiero** conectar Google Analytics a mi landing,
**Para** entender el comportamiento de mis visitantes.

**Criterios de Aceptación:**
- [ ] Campo para ingresar Google Analytics Tracking ID (GA4 o Universal Analytics)
- [ ] Script de Analytics inyectado en `<head>` de la página
- [ ] No afecta performance (async loading)
- [ ] Cumple GDPR: banner de cookies si usuario en EU
- [ ] Opción para deshabilitar Analytics temporalmente

---

**US-052: Agregar Proyectos al Portafolio con Imágenes**

**Como** usuario con plan Professional+,
**Quiero** publicar proyectos en mi portafolio con imágenes y descripciones,
**Para** mostrar mi trabajo a potenciales clientes o empleadores.

**Criterios de Aceptación:**
- [ ] Formulario: título, descripción breve, descripción completa (markdown), cover image, galería (max 10 imágenes)
- [ ] Upload de imágenes con drag & drop, preview, y reordenamiento
- [ ] Validación: JPG/PNG/WebP, max 5MB por imagen
- [ ] Compresión y optimización automática (WebP conversion)
- [ ] Links: demo live, repositorio, case study (validación de URLs)
- [ ] Fecha de publicación del proyecto

---

**US-053: Organizar Proyectos por Categoría/Tags**

**Como** usuario,
**Quiero** categorizar proyectos con tags,
**Para** que visitantes filtren por tipo de trabajo.

**Criterios de Aceptación:**
- [ ] Tags predefinidos: Web Development, Mobile App, UI/UX Design, Branding, Backend, Frontend
- [ ] Opción para crear tags personalizados (max 20 tags totales)
- [ ] Multi-selección de tags por proyecto
- [ ] Página de portafolio muestra filtros por tag (client-side filtering)
- [ ] URL con query param: `/portafolio/jsmith?tag=web-development`

---

**US-054: Configurar Proyecto Destacado**

**Como** usuario,
**Quiero** marcar hasta 3 proyectos como destacados,
**Para** que aparezcan primero en mi portafolio.

**Criterios de Aceptación:**
- [ ] Toggle "Destacar proyecto" en editor
- [ ] Máximo 3 proyectos destacados simultáneamente
- [ ] Proyectos destacados muestran badge "Destacado"
- [ ] Orden: Destacados (ordenados manualmente) → Resto (por fecha descendente)
- [ ] Drag & drop para reordenar proyectos destacados

---

**US-055: Compartir Link a Proyecto Específico**

**Como** usuario,
**Quiero** compartir URL de un proyecto individual,
**Para** enviar mi trabajo específico a clientes o incluir en aplicaciones de empleo.

**Criterios de Aceptación:**
- [ ] URL de proyecto: `/portafolio/jsmith/{project-slug}`
- [ ] Slug generado automáticamente desde título (ej: "Mi App" → `mi-app`)
- [ ] Página de proyecto individual muestra: galería full, descripción completa, links
- [ ] Botón "Compartir" copia URL al portapapeles
- [ ] Meta tags específicos del proyecto para sharing en redes sociales

---

**US-056: Generar CV Digital desde Perfil del Usuario**

**Como** usuario,
**Quiero** generar mi CV digital automáticamente desde mi perfil,
**Para** ahorrar tiempo al no tener que duplicar información.

**Criterios de Aceptación:**
- [ ] Sistema auto-completa secciones desde perfil: nombre, email, teléfono, foto
- [ ] Secciones editables: Resumen profesional, Experiencia, Educación, Habilidades, Idiomas, Certificaciones
- [ ] Cada sección tiene formulario específico con validaciones
- [ ] Fechas de experiencia/educación con validación (end_date >= start_date)
- [ ] Habilidades con auto-complete de skills comunes

---

**US-057: Personalizar Secciones del CV**

**Como** usuario,
**Quiero** personalizar qué secciones incluir en mi CV,
**Para** adaptarlo a diferentes oportunidades laborales.

**Criterios de Aceptación:**
- [ ] Toggle para mostrar/ocultar secciones: Foto, Teléfono, Dirección, Certificaciones, Referencias
- [ ] Drag & drop para reordenar secciones
- [ ] Opción "Versión Anónima" oculta: foto, nombre completo, contacto (para procesos ciegos)
- [ ] Múltiples versiones de CV guardables (ej: "CV Backend", "CV Fullstack")

---

**US-058: Exportar CV a PDF**

**Como** usuario con plan Professional+,
**Quiero** descargar mi CV como PDF profesional,
**Para** enviarlo en aplicaciones de empleo.

**Criterios de Aceptación:**
- [ ] Botón "Exportar PDF" genera PDF de alta calidad
- [ ] PDF usa template seleccionado (Classic, Modern, Minimal)
- [ ] Nombre de archivo: `CV_{Nombre}_{Apellido}_{Fecha}.pdf`
- [ ] PDF tamaño A4, fuentes embebidas, compatible con ATS (Applicant Tracking Systems)
- [ ] Opción para incluir/excluir foto en PDF

---

**US-059: Configurar SEO Global para Servicios Digitales**

**Como** usuario con plan Professional+,
**Quiero** configurar SEO default para todos mis servicios digitales,
**Para** maximizar mi visibilidad en buscadores.

**Criterios de Aceptación:**
- [ ] Configuración global: Meta title base, meta description base, keywords
- [ ] Cada servicio puede override configuración global
- [ ] Sistema genera `sitemap.xml` dinámico incluyendo todas las páginas públicas
- [ ] `robots.txt` configurable (allow/disallow por servicio)
- [ ] Structured data (JSON-LD) para Person schema

---

**US-060: Conectar Dominio Personalizado (Enterprise)**

**Como** admin de organización Enterprise,
**Quiero** conectar un dominio personalizado a mis servicios digitales,
**Para** branding profesional sin mencionar la plataforma.

**Criterios de Aceptación:**
- [ ] Configuración de dominio: ingresar domain, verificar DNS, activar SSL
- [ ] Instrucciones claras para configurar CNAME en proveedor DNS
- [ ] Validación automática de DNS cada 30 min (max 24h)
- [ ] Provisión automática de SSL con Let's Encrypt
- [ ] Configuración de redirecciones: dominio → servicio específico
- [ ] Soporte para subdominios: `cv.domain.com`, `portfolio.domain.com`
- [ ] White-label: remover "Powered by [Platform]" footer

---

### 3.9 Analytics de Negocio

**US-061: Ver Dashboard de Analytics con KPIs**

**Como** SuperAdmin u OrgAdmin,
**Quiero** visualizar un dashboard con métricas clave de negocio (Clientes Activos, MRR, ARPC, Health Score),
**Para** monitorear la salud financiera y tomar decisiones basadas en datos.

**Criterios de Aceptación:**
- [ ] Dashboard muestra 4 KPIs principales en cards:
  - Clientes Activos (count + % cambio vs mes anterior)
  - MRR Total ($ + % cambio vs mes anterior)
  - ARPC - Average Revenue Per Customer ($ + % cambio)
  - Health Score (% + indicador Estable/Crecimiento/Riesgo)
- [ ] Indicadores de cambio tienen color semántico:
  - Verde (+% positivo para MRR, Clientes)
  - Rojo (-% negativo)
  - Gris (sin cambio o estable)
- [ ] Métricas se calculan en tiempo real desde BD
- [ ] Carga inicial < 2 segundos
- [ ] Soporte responsive para tablet y móvil

**Prioridad:** Alta | **Estimación:** 5 puntos

---

**US-062: Filtrar Analytics por Plan y Estado**

**Como** admin,
**Quiero** filtrar las métricas por plan de suscripción y estado de cliente,
**Para** analizar segmentos específicos de mi base de clientes.

**Criterios de Aceptación:**
- [ ] Filtros disponibles en header de dashboard:
  - Dropdown "Plan": Todos, Free, Starter, Professional, Enterprise
  - Dropdown "Estado": Todos, Activo, Prueba, Pago Vencido, Cancelado
- [ ] Al cambiar filtro, todos los gráficos y KPIs se actualizan
- [ ] Filtros persisten en query params para compartir URL
- [ ] Combinación de filtros (ej: Professional + Activo)
- [ ] Indicador visual de filtros activos
- [ ] Botón "Limpiar filtros" para resetear a "Todos"

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-063: Visualizar Distribución de Clientes por Plan**

**Como** admin,
**Quiero** ver un gráfico de barras con distribución de clientes por plan,
**Para** entender la composición de mi base de clientes.

**Criterios de Aceptación:**
- [ ] Gráfico de barras horizontales con:
  - Eje X: Cantidad de clientes
  - Eje Y: Plan (Free, Starter, Professional, Enterprise)
  - Color único por plan (consistente con branding)
- [ ] Cada barra muestra:
  - Cantidad absoluta de clientes
  - Porcentaje del total (ej: "40.0%")
- [ ] Barras ordenadas de mayor a menor cantidad
- [ ] Tooltip al hover con detalles adicionales
- [ ] Animación de carga progresiva

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-064: Identificar Top 5 Clientes por MRR**

**Como** admin,
**Quiero** ver un ranking de mis top 5 clientes ordenados por MRR,
**Para** identificar cuentas estratégicas y priorizar atención comercial.

**Criterios de Aceptación:**
- [ ] Tabla muestra columnas:
  - # (ranking 1-5)
  - Cliente (nombre con avatar)
  - Plan (badge con color)
  - MRR ($ formateado)
  - Usuarios (count de miembros del tenant)
- [ ] Ordenado descendente por MRR
- [ ] Click en fila navega a detalle de cliente
- [ ] Destacar visualmente #1 (ej: icono de corona)
- [ ] Si hay empate en MRR, ordenar alfabéticamente

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-065: Exportar Reportes de Analytics (Professional+)**

**Como** admin con plan Professional o Enterprise,
**Quiero** exportar reportes de analytics a PDF o Excel,
**Para** compartir métricas con stakeholders externos.

**Criterios de Aceptación:**
- [ ] Botón "Exportar" en header de dashboard
- [ ] Opciones de formato: PDF, Excel (XLSX)
- [ ] Reporte incluye:
  - Fecha de generación
  - Filtros aplicados
  - Todos los KPIs y gráficos visibles
  - Tabla de top 10 clientes (vs 5 en UI)
- [ ] Feature gate: solo Professional y Enterprise
- [ ] Plan Free/Starter muestra upgrade prompt
- [ ] Descarga archivo con nombre: `analytics-{tenant}-{fecha}.{ext}`
- [ ] Generación async con notificación al completar

**Prioridad:** Baja | **Estimación:** 5 puntos

---

### 3.10 Sistema de Promociones

**US-066: Crear Nueva Promoción**

**Como** admin con permisos de marketing,
**Quiero** crear códigos promocionales con descuentos personalizados,
**Para** ejecutar campañas de adquisición y retención sin soporte técnico.

**Criterios de Aceptación:**
- [ ] Botón "Nueva Promoción" abre modal de creación
- [ ] Formulario requiere:
  - Código (alfanumérico, 3-20 chars, uppercase, único)
  - Nombre (display name, 5-100 chars)
  - Descripción opcional (hasta 255 chars)
  - Tipo: Porcentaje (%), Monto ($), Días adicionales
  - Valor según tipo: % (1-100), $ (> 0), Días (1-365)
  - Límite de usos (1-9999, opcional = ilimitado)
  - Vigencia: fecha inicio + fecha fin (obligatorias)
  - Planes aplicables: multi-select (Free, Starter, Pro, Enterprise)
  - Checkbox "Solo primer pago" (default: true)
- [ ] Validaciones en tiempo real:
  - Código único (async check con debounce 300ms)
  - Fechas: inicio < fin, fin >= hoy
  - Valor > 0 según tipo
- [ ] Al guardar, promoción tiene estado "Activa" si hoy >= fecha_inicio
- [ ] Si fecha_inicio > hoy, estado es "Programada"
- [ ] Notificación de éxito con código para copiar

**Prioridad:** Alta | **Estimación:** 5 puntos

---

**US-067: Gestionar Estados de Promociones**

**Como** admin,
**Quiero** pausar, reanudar o finalizar promociones activas,
**Para** controlar manualmente la disponibilidad de códigos.

**Criterios de Aceptación:**
- [ ] Columna "Estado" muestra badge con color semántico:
  - Activa (verde), Pausada (amarillo), Agotada (gris), Expirada (rojo), Programada (azul)
- [ ] Menú de acciones incluye:
  - "Pausar" (solo si Activa) → cambia estado a Pausada
  - "Reanudar" (solo si Pausada) → vuelve a Activa
  - "Finalizar" (si Activa/Pausada) → marca como Expirada manualmente
- [ ] Estados automáticos:
  - Si usos >= límite → Agotada (no editable)
  - Si hoy > fecha_fin → Expirada (no editable)
  - Si hoy < fecha_inicio → Programada
- [ ] Confirmación antes de finalizar manualmente
- [ ] Al pausar, código no aplicable en checkout (error user-friendly)

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-068: Filtrar y Buscar Promociones**

**Como** admin,
**Quiero** buscar promociones por código/nombre y filtrar por estado/tipo,
**Para** encontrar rápidamente códigos específicos en listas largas.

**Criterios de Aceptación:**
- [ ] Barra de búsqueda con placeholder "Buscar por código o nombre..."
- [ ] Búsqueda en tiempo real con debounce 300ms
- [ ] Búsqueda case-insensitive en: Código, Nombre, Descripción
- [ ] Filtros dropdown:
  - Estado: Todos, Activa, Pausada, Agotada, Expirada, Programada
  - Tipo: Todos, Porcentaje (%), Monto ($), Días adicionales
- [ ] Filtros combinables (búsqueda + estado + tipo)
- [ ] Indicador de "X resultados encontrados"
- [ ] Botón "Limpiar filtros" si hay filtros activos
- [ ] Persistencia de filtros en URL query params

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-069: Monitorear Métricas de Promociones**

**Como** admin,
**Quiero** ver KPIs de promociones (activas, usos totales, ingresos generados),
**Para** medir la efectividad de mis campañas.

**Criterios de Aceptación:**
- [ ] Header de página muestra 3 KPIs en cards:
  - Promociones Activas (count de estado = Activa)
  - Usos Totales (sum de `current_uses` de todas las promos)
  - Ingresos Generados (sum de discounts aplicados)
- [ ] Tabla muestra columna "Uso" con:
  - Barra de progreso (current_uses / max_uses)
  - Indicador numérico "X/Y" (ej: 23/100)
  - % de utilización
- [ ] Click en icono "Analytics" de fila muestra modal con:
  - Gráfico de usos en el tiempo (line chart)
  - Conversión: % de usuarios que aplicaron el código y pagaron
  - Planes donde más se usó (pie chart)
  - Revenue impactado ($ total de descuentos)
- [ ] Feature gate Analytics detallado: Professional+
- [ ] Exportar reporte de promoción individual (PDF/Excel)

**Prioridad:** Media | **Estimación:** 5 puntos

---

**US-070: Aplicar Código Promocional en Checkout**

**Como** usuario nuevo,
**Quiero** ingresar un código promocional durante el checkout,
**Para** obtener descuentos en mi suscripción.

**Criterios de Aceptación:**
- [ ] Checkout muestra campo "Código promocional" (colapsable)
- [ ] Al ingresar código y hacer click "Aplicar":
  - Validación async con backend
  - Spinner durante validación
- [ ] Si código válido:
  - Mensaje de éxito: "Código SUMMER2026 aplicado: 20% de descuento"
  - Actualizar precio final con descuento
  - Mostrar precio original tachado + precio con descuento
- [ ] Si código inválido: Error "Código inválido o expirado"
- [ ] Validaciones backend:
  - Código existe y estado = Activa
  - No supera límite de usos
  - Vigencia válida (hoy entre fecha_inicio y fecha_fin)
  - Plan seleccionado incluido en planes_aplicables
- [ ] Al completar pago:
  - Incrementar `current_uses` de promoción
  - Crear registro en PromoUsage
  - Aplicar descuento en invoice
- [ ] Promoción aplicable también en upgrades (si configurado)

**Prioridad:** Alta | **Estimación:** 5 puntos

---

## Módulo Notas

**US-071: Crear Nota con Categoría y Pin**

**Como** usuario,
**Quiero** crear una nota con título, contenido, categoría y opción de fijarla,
**Para** organizar mis apuntes e ideas dentro de mi workspace.

**Criterios de Aceptación:**
- [ ] Modal de creación con campos: título (requerido), contenido (textarea), categoría (dropdown: work/personal/ideas/archive), pin (toggle)
- [ ] Notas fijadas aparecen al inicio de la lista con indicador visual
- [ ] Feature gate: Free (10 max), Starter (100 max), Pro (1000 max), Enterprise (∞)
- [ ] Muestra UpgradePrompt si se alcanza el límite del plan
- [ ] Toast de confirmación al crear

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-072: Buscar y Filtrar Notas**

**Como** usuario,
**Quiero** buscar notas por texto y filtrar por categoría,
**Para** encontrar rápidamente la información que necesito.

**Criterios de Aceptación:**
- [ ] Barra de búsqueda filtra por título y contenido en tiempo real (debounce 300ms)
- [ ] Filtro por categoría: Todas, Work, Personal, Ideas, Archive
- [ ] Contador de resultados mostrado ("X notas")
- [ ] Estado vacío con mensaje contextual cuando no hay resultados
- [ ] Vista lista y grid seleccionable

**Prioridad:** Media | **Estimación:** 2 puntos

---

**US-073: Editar y Eliminar Nota**

**Como** usuario,
**Quiero** poder modificar y eliminar mis notas existentes,
**Para** mantener mi información actualizada.

**Criterios de Aceptación:**
- [ ] Click en nota abre modal de edición con campos pre-cargados
- [ ] Cambios se guardan con botón "Actualizar"
- [ ] Botón eliminar muestra confirmación antes de borrar
- [ ] Nota eliminada desaparece de la lista sin reload
- [ ] Sólo el propietario puede editar/eliminar

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-074: Ver Notas por Categoría**

**Como** usuario,
**Quiero** ver mis notas agrupadas visualmente por categoría con colores,
**Para** identificar rápidamente el tipo de cada nota.

**Criterios de Aceptación:**
- [ ] Cada categoría tiene un color distintivo (work: azul, personal: verde, ideas: amarillo, archive: gris)
- [ ] Badge de categoría visible en la card de cada nota
- [ ] Filtro de categoría persiste durante la sesión
- [ ] Vista grid muestra color de fondo según categoría
- [ ] Contador de notas por categoría en el filtro

**Prioridad:** Baja | **Estimación:** 2 puntos

---

## Módulo Contactos

**US-075: Crear Contacto con Información Completa**

**Como** usuario,
**Quiero** agregar contactos con nombre, email, teléfono, empresa y cargo,
**Para** centralizar mi directorio de personas en mi workspace.

**Criterios de Aceptación:**
- [ ] Formulario con campos: nombre (requerido), apellido, email, teléfono, empresa, cargo, grupo
- [ ] Avatar generado automáticamente con iniciales del nombre
- [ ] Feature gate: Free (25 max), Starter (100 max), Professional+ (∞)
- [ ] Validación de formato email en tiempo real
- [ ] Toast de confirmación al guardar

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-076: Buscar y Filtrar Contactos**

**Como** usuario,
**Quiero** buscar contactos por nombre, email o empresa y filtrar por grupo,
**Para** encontrar rápidamente el contacto que necesito.

**Criterios de Aceptación:**
- [ ] Búsqueda en tiempo real por nombre, email y empresa
- [ ] Filtro por grupo con dropdown
- [ ] Ordenamiento por nombre (A-Z, Z-A)
- [ ] Estado vacío cuando no hay resultados con CTA para crear contacto
- [ ] Contador total de contactos mostrado

**Prioridad:** Media | **Estimación:** 2 puntos

---

**US-077: Editar y Eliminar Contacto**

**Como** usuario,
**Quiero** actualizar y eliminar contactos de mi directorio,
**Para** mantener mi directorio limpio y actualizado.

**Criterios de Aceptación:**
- [ ] Botón editar abre modal con campos pre-cargados
- [ ] Todos los campos editables excepto el ID
- [ ] Confirmación antes de eliminar con nombre del contacto
- [ ] Contacto eliminado desaparece inmediatamente de la lista
- [ ] Sólo el propietario puede modificar sus contactos

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-078: Organizar Contactos en Grupos**

**Como** usuario con plan Starter+,
**Quiero** crear grupos de contactos personalizados,
**Para** organizar mi directorio por proyectos, equipos o categorías.

**Criterios de Aceptación:**
- [ ] Crear/editar/eliminar grupos con nombre y color
- [ ] Asignar contacto a grupo desde el formulario de contacto
- [ ] Filtrar directorio por grupo seleccionado
- [ ] Feature gate: grupos sólo en Starter+ (Free ve un grupo genérico)
- [ ] UpgradePrompt si intenta crear grupo en Free

**Prioridad:** Media | **Estimación:** 3 puntos

---

## Módulo Bookmarks

**US-079: Guardar Bookmark con URL y Metadatos**

**Como** usuario,
**Quiero** guardar una URL con título, descripción y tags,
**Para** organizar mis enlaces importantes y recuperarlos fácilmente.

**Criterios de Aceptación:**
- [ ] Formulario con campos: URL (requerido, validación de formato), título, descripción, colección, tags
- [ ] Feature gate: Free (20 max), Starter (100 max), Professional+ (∞)
- [ ] Validación de URL en tiempo real
- [ ] Tags ingresados con Enter o coma, removibles con X
- [ ] Card muestra favicon placeholder, título y URL truncada

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-080: Organizar Bookmarks en Colecciones**

**Como** usuario con plan Starter+,
**Quiero** crear colecciones para agrupar bookmarks relacionados,
**Para** estructurar mis enlaces por proyecto o temática.

**Criterios de Aceptación:**
- [ ] Crear/editar/eliminar colecciones con nombre y color
- [ ] Asignar bookmark a colección al crear o editar
- [ ] Filtrar bookmarks por colección en la lista
- [ ] Feature gate: colecciones en Starter+ (Free: sin colecciones)
- [ ] UpgradePrompt si intenta crear colección en Free

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-081: Buscar y Filtrar Bookmarks**

**Como** usuario,
**Quiero** buscar bookmarks por texto y filtrar por colección o tag,
**Para** recuperar rápidamente el enlace que necesito.

**Criterios de Aceptación:**
- [ ] Búsqueda por título, URL y descripción (debounce 300ms)
- [ ] Filtro por colección con dropdown
- [ ] Filtro por tag con chips seleccionables
- [ ] Contador de resultados visible
- [ ] Vista lista y grid disponibles

**Prioridad:** Media | **Estimación:** 2 puntos

---

**US-082: Gestionar Tags de Bookmarks**

**Como** usuario,
**Quiero** agregar y quitar tags de mis bookmarks,
**Para** clasificarlos de forma transversal independiente de las colecciones.

**Criterios de Aceptación:**
- [ ] Tags editables desde el modal de edición
- [ ] Autocompletado de tags existentes al escribir
- [ ] Tags mostrados como chips en la card del bookmark
- [ ] Click en tag de card aplica filtro automáticamente
- [ ] Feature gate: tags en Starter+ (Free: sin tags)

**Prioridad:** Baja | **Estimación:** 2 puntos

---

## Módulo Variables de Entorno

**US-083: Crear y Organizar Variables por Ambiente**

**Como** usuario con plan Starter+,
**Quiero** agregar variables de entorno clasificadas por ambiente (dev/staging/prod),
**Para** gestionar la configuración de mis proyectos de forma segura.

**Criterios de Aceptación:**
- [ ] Formulario: key (requerido, UPPER_CASE recomendado), value, ambiente (dropdown), descripción, toggle "es secreto"
- [ ] Feature gate: sólo Starter+ (UpgradePrompt en Free)
- [ ] Límite Starter: 25 variables, Professional+: ∞
- [ ] Variables agrupadas por ambiente en la lista principal
- [ ] Toast de confirmación al guardar

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-084: Revelar y Copiar Valor de Variable**

**Como** usuario con plan Starter+,
**Quiero** poder revelar temporalmente el valor de una variable secreta y copiarlo,
**Para** usarlo en mi configuración sin que quede expuesto permanentemente.

**Criterios de Aceptación:**
- [ ] Valores secretos mostrados como `••••••••` por defecto
- [ ] Ícono de ojo revela el valor por 30 segundos, luego se enmascara automáticamente
- [ ] Botón copiar al portapapeles con feedback "¡Copiado!" por 2s
- [ ] Acción de revelación registrada en el audit log
- [ ] Solo el propietario puede revelar valores de sus variables

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-085: Editar y Eliminar Variable de Entorno**

**Como** usuario con plan Starter+,
**Quiero** actualizar el valor o descripción de una variable existente y eliminarla si ya no la necesito,
**Para** mantener mi configuración actualizada.

**Criterios de Aceptación:**
- [ ] Modal de edición con campos pre-cargados (value enmascarado, requiere re-ingresar para cambiar)
- [ ] Confirmación de eliminación con nombre de la variable
- [ ] Eliminación registrada en audit log
- [ ] Solo propietario puede editar/eliminar

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-086: Exportar Variables por Ambiente**

**Como** usuario con plan Professional+,
**Quiero** exportar las variables de un ambiente como archivo `.env`,
**Para** usarlas directamente en mis proyectos.

**Criterios de Aceptación:**
- [ ] Botón "Exportar .env" disponible por ambiente
- [ ] Archivo descargado como `{ambiente}.env` con formato `KEY=VALUE`
- [ ] Valores secretos incluidos en texto plano en el archivo exportado
- [ ] Feature gate: Professional+ (UpgradePrompt en Starter/Free)
- [ ] Exportación registrada en audit log

**Prioridad:** Media | **Estimación:** 2 puntos

---

## Módulo Claves SSH

**US-087: Agregar Clave SSH con Nombre y Descripción**

**Como** usuario con plan Starter+,
**Quiero** registrar mis claves SSH con nombre, algoritmo y descripción,
**Para** tener un inventario centralizado de mis claves de acceso.

**Criterios de Aceptación:**
- [ ] Formulario: nombre (requerido), algoritmo (RSA/ED25519/ECDSA), clave pública (requerida), clave privada (opcional, cifrada), descripción, fecha de expiración
- [ ] Feature gate: Starter (5 max), Professional+ (∞), Free (❌)
- [ ] Fingerprint SHA-256 calculado automáticamente al ingresar clave pública
- [ ] Toast de confirmación al guardar

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-088: Ver Fingerprint y Copiar Clave Pública**

**Como** usuario con plan Starter+,
**Quiero** ver el fingerprint de cada clave y copiar la clave pública con un click,
**Para** identificar y usar mis claves sin exponerlas innecesariamente.

**Criterios de Aceptación:**
- [ ] Fingerprint SHA-256 mostrado en la card de cada clave
- [ ] Botón copiar al portapapeles para la clave pública
- [ ] Feedback "¡Copiado!" por 2s al copiar
- [ ] Badge de algoritmo (RSA/ED25519/ECDSA) con color distintivo
- [ ] Clave privada NO accesible desde la UI (solo almacenada cifrada)

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-089: Gestionar Expiración de Claves SSH**

**Como** usuario con plan Professional+,
**Quiero** recibir alertas cuando mis claves SSH estén próximas a vencer,
**Para** renovarlas antes de que interrumpan el acceso a mis servidores.

**Criterios de Aceptación:**
- [ ] Indicador visual de expiración: verde (válida), amarillo (<30 días), rojo (vencida)
- [ ] Alertas automáticas por email a 30, 7 y 1 día antes del vencimiento
- [ ] Feature gate: alertas en Professional+ (Starter ve indicadores pero sin email)
- [ ] Columna "Expira" en la lista con fecha y color de estado

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-090: Eliminar Clave SSH de Forma Segura**

**Como** usuario con plan Starter+,
**Quiero** eliminar una clave SSH que ya no necesito,
**Para** reducir la superficie de ataque de mis accesos.

**Criterios de Aceptación:**
- [ ] Confirmación de eliminación con nombre de la clave
- [ ] Eliminación registrada en audit log con timestamp
- [ ] Solo el propietario puede eliminar sus claves
- [ ] Clave eliminada desaparece inmediatamente de la lista

**Prioridad:** Media | **Estimación:** 1 punto

---

## Módulo Certificados SSL

**US-091: Agregar Certificado SSL con Información del Emisor**

**Como** usuario con plan Starter+,
**Quiero** registrar un certificado SSL con dominio, emisor y fechas de validez,
**Para** hacer seguimiento de mis certificados en un lugar centralizado.

**Criterios de Aceptación:**
- [ ] Formulario: dominio (requerido), emisor, fecha desde (requerida), fecha hasta (requerida), notas
- [ ] Feature gate: Starter (10 max), Professional+ (∞), Free (❌)
- [ ] Validación: fecha hasta > fecha desde
- [ ] Estado calculado automáticamente al crear

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-092: Ver Estado Visual del Certificado**

**Como** usuario con plan Starter+,
**Quiero** ver el estado de cada certificado con código de color,
**Para** identificar de un vistazo cuáles requieren atención inmediata.

**Criterios de Aceptación:**
- [ ] Badge verde: válido (>30 días restantes)
- [ ] Badge amarillo: por vencer (8-30 días restantes)
- [ ] Badge rojo: vencido o ≤7 días restantes
- [ ] Días restantes mostrados en cada card ("23 días restantes")
- [ ] Certificados vencidos/críticos listados primero (ordenados por urgencia)

**Prioridad:** Alta | **Estimación:** 2 puntos

---

**US-093: Recibir Alertas de Vencimiento de Certificados**

**Como** usuario con plan Professional+,
**Quiero** recibir emails automáticos cuando un certificado esté próximo a vencer,
**Para** renovarlo a tiempo y evitar interrupciones de servicio.

**Criterios de Aceptación:**
- [ ] Alerta enviada a 30 días del vencimiento
- [ ] Alerta enviada a 7 días del vencimiento
- [ ] Alerta enviada a 1 día del vencimiento
- [ ] Feature gate: alertas solo en Professional+ (Starter ve colores pero sin emails)
- [ ] Alertas no se reenvían (flag `alert_30_sent`, `alert_7_sent`, `alert_1_sent`)

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-094: Renovar o Eliminar Certificado Vencido**

**Como** usuario con plan Starter+,
**Quiero** actualizar las fechas de un certificado renovado o eliminar uno que ya no uso,
**Para** mantener mi inventario de certificados limpio y actualizado.

**Criterios de Aceptación:**
- [ ] Botón editar abre modal con campos pre-cargados para actualizar fechas
- [ ] Estado se recalcula automáticamente al actualizar fechas
- [ ] Confirmación de eliminación con nombre del dominio
- [ ] Acción registrada en audit log

**Prioridad:** Media | **Estimación:** 2 puntos

---

## Módulo Snippets

**US-095: Crear Snippet con Lenguaje y Código**

**Como** usuario,
**Quiero** guardar un fragmento de código con su lenguaje y descripción,
**Para** reutilizarlo en el futuro sin tener que buscarlo o reescribirlo.

**Criterios de Aceptación:**
- [ ] Formulario: título (requerido), lenguaje (dropdown con 13+ opciones), código (textarea monospace), descripción, tags
- [ ] Feature gate: Free (10 max), Starter (50 max), Professional+ (∞)
- [ ] Badge de lenguaje con color identificativo en la card
- [ ] Preview del código (primeras 3 líneas) en la card

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-096: Buscar Snippets por Lenguaje o Tags**

**Como** usuario,
**Quiero** filtrar mis snippets por lenguaje de programación o tags,
**Para** encontrar rápidamente el fragmento que necesito.

**Criterios de Aceptación:**
- [ ] Dropdown de filtro por lenguaje con iconos/badges
- [ ] Filtro por tags con chips seleccionables (multi-selección)
- [ ] Búsqueda por título y descripción en tiempo real
- [ ] Combinación de filtros (lenguaje + tag + búsqueda simultáneos)
- [ ] Contador de resultados visible

**Prioridad:** Media | **Estimación:** 2 puntos

---

**US-097: Copiar Snippet al Portapapeles**

**Como** usuario,
**Quiero** copiar el código de un snippet con un solo click,
**Para** pegarlo inmediatamente en mi editor sin seleccionar el texto manualmente.

**Criterios de Aceptación:**
- [ ] Botón "Copiar" visible en la card de cada snippet
- [ ] `navigator.clipboard.writeText(code)` copia el código completo
- [ ] Feedback visual "¡Copiado!" por 2s con cambio de ícono
- [ ] Funciona desde vista lista y vista grid

**Prioridad:** Alta | **Estimación:** 1 punto

---

**US-098: Organizar Snippets con Tags Personalizados**

**Como** usuario,
**Quiero** agregar tags personalizados a mis snippets,
**Para** clasificarlos de forma transversal más allá del lenguaje.

**Criterios de Aceptación:**
- [ ] Tags ingresados con Enter o coma en el formulario
- [ ] Tags removibles con X en el modal de edición
- [ ] Tags mostrados como chips en la card
- [ ] Autocompletado de tags existentes del usuario
- [ ] Máximo 10 tags por snippet

**Prioridad:** Baja | **Estimación:** 2 puntos

---

## Módulo Formularios

**US-099: Crear Formulario con Preguntas Configurables**

**Como** usuario,
**Quiero** crear un formulario con diferentes tipos de preguntas,
**Para** recopilar información estructurada de otras personas.

**Criterios de Aceptación:**
- [ ] Formulario: título (requerido), descripción, lista de preguntas
- [ ] Tipos de pregunta: Texto corto, Texto largo, Opción múltiple, Casillas, Número, Fecha
- [ ] Orden de preguntas reordenable con drag o botones up/down
- [ ] Toggle "Requerido" por pregunta
- [ ] Feature gate: Free (1 form, 5 preguntas), Starter (5 forms, 20 preguntas), Pro+ (∞)

**Prioridad:** Alta | **Estimación:** 5 puntos

---

**US-100: Activar y Compartir Formulario con URL Pública**

**Como** usuario con plan Starter+,
**Quiero** activar mi formulario y compartir la URL pública,
**Para** que cualquier persona pueda responderlo sin necesidad de cuenta.

**Criterios de Aceptación:**
- [ ] Botón "Activar" cambia estado de Draft a Activo y genera slug único
- [ ] URL pública mostrada con botón de copia: `{base_url}/forms/{slug}`
- [ ] Formulario inactivo muestra mensaje "Este formulario no está disponible"
- [ ] Feature gate: URL pública en Starter+ (Free: sin URL pública)
- [ ] Botón "Cerrar formulario" para dejar de recibir respuestas

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-101: Ver Respuestas Recibidas con Conteo**

**Como** usuario,
**Quiero** ver el conteo de respuestas y el detalle de cada una,
**Para** analizar los datos recopilados por mis formularios.

**Criterios de Aceptación:**
- [ ] Tabla de formularios muestra columna "Respuestas" con conteo actualizado en tiempo real
- [ ] Click en "Ver respuestas" muestra lista de submissions con fecha/hora
- [ ] Click en respuesta individual muestra las respuestas a cada pregunta
- [ ] Paginación en lista de respuestas (20 por página)
- [ ] Feature gate almacenamiento: Free (50 respuestas), Starter+ (∞)

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-102: Exportar Respuestas a CSV**

**Como** usuario con plan Professional+,
**Quiero** exportar todas las respuestas de un formulario a CSV,
**Para** analizarlas en Excel u otra herramienta de datos.

**Criterios de Aceptación:**
- [ ] Botón "Exportar CSV" disponible en la vista de respuestas
- [ ] CSV con columnas: fecha_envio, ip_respondente, y una columna por pregunta
- [ ] Descarga inmediata del archivo `{form_title}_respuestas.csv`
- [ ] Feature gate: Professional+ (UpgradePrompt en Starter/Free)
- [ ] Exportación registrada en audit log

**Prioridad:** Media | **Estimación:** 2 puntos

---

## Módulo Auditoría

**US-103: Ver Timeline de Acciones del Sistema**

**Como** Owner o Service Manager con plan Professional+,
**Quiero** ver un timeline cronológico de todas las acciones del sistema,
**Para** tener visibilidad completa de lo que ocurrió en mi workspace.

**Criterios de Aceptación:**
- [ ] Timeline paginado (50 eventos por página) ordenado por fecha DESC
- [ ] Cada evento muestra: ícono de acción, usuario, descripción, recurso y timestamp
- [ ] Feature gate: Professional+ (UpgradePrompt en Starter/Free)
- [ ] Vista de solo lectura (sin opciones de edición/eliminación)
- [ ] Retención: 30 días en Professional, 365 días en Enterprise

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-104: Filtrar Eventos por Usuario, Acción y Fecha**

**Como** Owner con plan Professional+,
**Quiero** filtrar el log de auditoría por usuario, tipo de acción y rango de fechas,
**Para** encontrar eventos específicos de forma eficiente.

**Criterios de Aceptación:**
- [ ] Filtro por usuario (dropdown con todos los miembros del tenant)
- [ ] Filtro por tipo de acción (create/update/delete/login/share/reveal)
- [ ] Filtro por rango de fechas (fecha desde - fecha hasta)
- [ ] Filtros combinables y aplicados simultáneamente
- [ ] Botón "Limpiar filtros" cuando hay filtros activos

**Prioridad:** Alta | **Estimación:** 3 puntos

---

**US-105: Exportar Log de Auditoría para Compliance**

**Como** Owner con plan Enterprise,
**Quiero** exportar el log de auditoría filtrado a CSV o PDF,
**Para** presentarlo en auditorías de compliance.

**Criterios de Aceptación:**
- [ ] Botón "Exportar" disponible con opciones CSV y PDF
- [ ] Exportación incluye los filtros activos en el momento de exportar
- [ ] PDF incluye header con nombre del tenant, período y fecha de generación
- [ ] Feature gate: Enterprise únicamente
- [ ] Exportación misma registrada en el audit log (meta-auditoría)

**Prioridad:** Media | **Estimación:** 3 puntos

---

## Módulo Reportes

**US-106: Ver Métricas de Uso del Workspace**

**Como** Owner con plan Starter+,
**Quiero** ver un dashboard con las métricas de uso de mi workspace,
**Para** entender cómo se utiliza la plataforma y planificar recursos.

**Criterios de Aceptación:**
- [ ] Cards de métricas: Usuarios activos, Total proyectos, Storage usado, API calls del período
- [ ] Período seleccionable: Última semana, último mes, último trimestre
- [ ] Métricas básicas en Starter, métricas avanzadas en Professional+
- [ ] Feature gate: Free (❌), Starter+ (✅)
- [ ] Datos calculados bajo demanda (no cacheados >5min)

**Prioridad:** Alta | **Estimación:** 4 puntos

---

**US-107: Comparar Métricas Entre Períodos**

**Como** Owner con plan Professional+,
**Quiero** ver tendencias comparando el período actual con el anterior,
**Para** identificar crecimiento o declive en el uso.

**Criterios de Aceptación:**
- [ ] Indicador de cambio por métrica: porcentaje de variación con flecha (↑↓) y color (verde/rojo)
- [ ] Gráfico de barras CSS (sin librería externa) para tendencia semanal
- [ ] Comparativa: período actual vs mismo período anterior
- [ ] Feature gate: Professional+ (Starter ve métricas simples sin comparativa)
- [ ] Datos de tendencia disponibles para período histórico máximo del plan

**Prioridad:** Media | **Estimación:** 4 puntos

---

**US-108: Exportar Reporte Ejecutivo**

**Como** Owner con plan Enterprise,
**Quiero** exportar un reporte ejecutivo en PDF con todas las métricas del período,
**Para** compartirlo con stakeholders o inversores.

**Criterios de Aceptación:**
- [ ] Botón "Exportar PDF" en el dashboard de reportes
- [ ] PDF incluye: nombre del tenant, período, todas las métricas con variaciones, gráficos
- [ ] Generación del PDF en el servidor (background task)
- [ ] Email con link de descarga cuando esté listo
- [ ] Feature gate: Enterprise únicamente (UpgradePrompt en Professional/Starter)

**Prioridad:** Media | **Estimación:** 5 puntos

---

**US-109: Panel de Reportes Admin con KPIs de Actividad**

**Como** admin o service manager,
**Quiero** ver un panel de reportes con KPIs de actividad (usuarios activos, nuevos este mes, churn rate, MRR) y una tabla de actividad de usuarios con badges de estado,
**Para** monitorear la salud operacional del workspace de un vistazo.

**Criterios de Aceptación:**
- [ ] 4 KPI cards visibles: Usuarios Activos, Nuevos Este Mes, Churn Rate, MRR
- [ ] Tabla de actividad de usuarios con columnas: nombre, email, rol, último acceso, badge de estado
- [ ] Badge dinámico: "Muy activo" (≤1 día), "Activo" (≤7 días), "Inactivo" (>7 días)
- [ ] Botón "Exportar" visible para roles con permiso `analytics.read`
- [ ] Accesible desde el menú de navegación admin

**Permiso requerido:** `analytics.read`

**Prioridad:** Alta | **Estimación:** 5 puntos

---

**US-110: Distribución de Roles y Permisos Más Usados en Reportes**

**Como** admin,
**Quiero** ver la distribución de roles del equipo con barras de progreso y el ranking de permisos más utilizados,
**Para** entender el uso real del sistema RBAC y detectar roles sobredimensionados o permisos subutilizados.

**Criterios de Aceptación:**
- [ ] Sección "Distribución de Roles" con barra de progreso, porcentaje y conteo por rol
- [ ] Sección "Permisos Más Usados" con ranking ordenado descendentemente
- [ ] Barras de permisos proporcionales al uso máximo del permiso más utilizado
- [ ] Datos actualizados al cargar la página (sin intervalo automático)
- [ ] Sección visible solo para usuarios con `analytics.read`

**Permiso requerido:** `analytics.read`

**Prioridad:** Media | **Estimación:** 3 puntos

---

**US-111: Centro de Notificaciones Administrativo**

**Como** usuario del panel admin (cualquier rol),
**Quiero** un centro de notificaciones con filtros por categoría, poder marcar como leída y descartar notificaciones individualmente o todas a la vez,
**Para** mantenerme informado sobre eventos relevantes del sistema sin perder contexto de trabajo.

**Criterios de Aceptación:**
- [ ] Notificaciones categorizadas: seguridad, usuarios, facturación, sistema, roles
- [ ] Filtros funcionales por categoría y por estado (sin leer / todas)
- [ ] Badge con conteo de notificaciones sin leer en el icono del menú
- [ ] Acción "Marcar todas como leídas" disponible cuando hay sin leer
- [ ] Descartar notificación individual con botón "×"
- [ ] Timestamp relativo visible: "Hace X min/h/días"
- [ ] Empty state descriptivo cuando no hay notificaciones en el filtro activo

**Permiso requerido:** `dashboard.read` (todos los roles con acceso al panel admin)

**Prioridad:** Alta | **Estimación:** 5 puntos

---

**US-112: Panel de Historial Financiero Admin**

**Como** admin o billing manager,
**Quiero** ver un panel dedicado de facturación con resumen de totales, métodos de pago registrados, historial de facturas descargables y timeline de transacciones,
**Para** tener visibilidad completa del estado financiero del workspace sin necesidad de contactar soporte.

**Criterios de Aceptación:**
- [ ] Fila de 3 stats cards: total facturado (pagado), pendiente de cobro, próxima factura (fecha + monto)
- [ ] Cards de métodos de pago con brand, últimos 4 dígitos, vencimiento y badge "Principal"
- [ ] Botón "Agregar método de pago" visible solo para `billing.manage`
- [ ] Tabla de facturas con: # factura, período, monto, badge de estado (Pagada / Pendiente / Fallida), botón descarga PDF
- [ ] Timeline vertical de transacciones con dot de color según estado (verde/amarillo/rojo)
- [ ] Historial ordenado cronológicamente descendente (más reciente primero)

**Permiso requerido:** `billing.read` (lectura); `billing.manage` (agregar métodos)

**Prioridad:** Alta | **Estimación:** 8 puntos

---

## Navegación

- [⬅️ Volver al README](../README.md)
- [➡️ Ver Casos de Uso](use-cases.md)
- [➡️ Ver Functional Requirements](functional-requirements.md)

---

**Última actualización**: 2026-02-22
