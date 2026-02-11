# Guía de Testing - Prototipo RBAC con Simulación de Login

## 🚀 Inicio Rápido

```bash
cd docs/ui-ux/prototype-react
npm install
npm run dev
```

El prototipo estará disponible en: http://localhost:3002

## 👥 Usuarios Disponibles para Testing

### 1. John Smith - OrgAdmin (Admin Completo)
- **Email:** admin@acme.com
- **Roles:** OrgAdmin
- **Permisos:** Acceso completo a todas las funcionalidades
- **Testing:**
  - ✅ Ver todos los módulos en sidebar (Dashboard, Usuarios, Roles, Permisos, Suscripción, Auditoría, Configuración)
  - ✅ Crear/editar/eliminar usuarios
  - ✅ Crear/editar/eliminar roles
  - ✅ Gestionar suscripción y facturación
  - ✅ Ver y exportar auditoría completa
  - ✅ Dashboard con todas las métricas

### 2. Sarah Johnson - Manager + HR Access
- **Email:** sarah.johnson@acme.com
- **Roles:** Manager, HR Access
- **Permisos:** Gestión de equipo + acceso HR
- **Testing:**
  - ✅ Sidebar: Dashboard, Usuarios (solo lectura), Roles (solo lectura), Auditoría
  - ✅ Ver usuarios pero NO invitar/eliminar
  - ✅ Ver roles pero NO crear/editar/eliminar
  - ❌ NO acceso a Permisos
  - ❌ NO acceso a Suscripción
  - ✅ Dashboard con stats de equipo

### 3. Mike Chen - Member + Engineering
- **Email:** mike.chen@acme.com
- **Roles:** Member, Engineering
- **Permisos:** Miembro estándar con acceso técnico
- **Testing:**
  - ✅ Sidebar: Solo Dashboard
  - ❌ NO acceso a Usuarios, Roles, Permisos
  - ❌ NO acceso a Suscripción, Auditoría
  - ✅ Dashboard limitado (solo 2 stats visibles)

### 4. Emma Davis - Content Editor
- **Email:** emma.davis@acme.com
- **Roles:** Content Editor
- **Permisos:** Crear y editar contenido
- **Testing:**
  - ✅ Sidebar: Solo Dashboard
  - ❌ NO acceso a módulos administrativos
  - ✅ Dashboard limitado (solo 2 stats visibles)

### 5. David Wilson - Guest
- **Email:** david.wilson@acme.com
- **Roles:** Guest
- **Permisos:** Solo lectura básica
- **Testing:**
  - ✅ Sidebar: Solo Dashboard
  - ❌ NO acceso a ningún módulo administrativo
  - ✅ Dashboard con mensaje de bienvenida (sin stats sensibles)

## 🧪 Casos de Prueba

### Flujo 1: Login y Navegación
1. Abrir prototipo → Ver Login page
2. Hacer click en tarjeta de usuario → Ver preview de permisos
3. Hacer doble click para login rápido
4. Verificar que Navbar muestra badge de rol
5. Verificar que Sidebar muestra solo items permitidos

### Flujo 2: Restricciones de Usuarios
1. Login como **OrgAdmin**
   - Ver tabla completa de usuarios
   - Botón "Invitar Usuario" visible
   - Acciones Editar/Eliminar habilitadas

2. Login como **Manager**
   - Ver tabla completa de usuarios
   - Botón "Invitar Usuario" → Mensaje "Sin permisos"
   - Acciones Editar habilitadas, Eliminar deshabilitadas

3. Login como **Member**
   - Módulo Usuarios NO visible en sidebar

### Flujo 3: Restricciones de Roles
1. Login como **OrgAdmin**
   - Ver grid de roles
   - Botón "Crear Rol" visible
   - Acciones Editar/Eliminar habilitadas en roles custom

2. Login como **Manager**
   - Ver grid de roles (solo lectura)
   - Botón "Crear Rol" → Mensaje "Sin permisos"
   - Acciones Editar/Eliminar deshabilitadas

3. Login como **Member**
   - Módulo Roles NO visible en sidebar

### Flujo 4: Restricciones de Suscripción
1. Login como **OrgAdmin**
   - Ver plan actual y comparación
   - Botones "Actualizar Plan" habilitados

2. Login como **Manager**
   - Módulo Suscripción NO visible en sidebar

3. Login como **Member/Guest**
   - Módulo Suscripción NO visible en sidebar

### Flujo 5: Dashboard Adaptado
1. Login como **OrgAdmin**
   - Ver 4 stats: Usuarios, Roles, Storage, API
   - Ver alertas de límites
   - Ver Usuarios Recientes y Auditoría

2. Login como **Manager**
   - Ver 4 stats
   - Ver alertas
   - Ver Usuarios Recientes y Auditoría

3. Login como **Member**
   - Ver solo 2 stats (Usuarios, Roles)
   - NO ver alertas
   - NO ver actividad reciente

4. Login como **Guest**
   - NO ver stats (mensaje de bienvenida)
   - NO ver alertas
   - NO ver actividad reciente

### Flujo 6: Logout y Cambio de Usuario
1. Login como cualquier usuario
2. Click en dropdown de usuario en Navbar
3. Ver roles del usuario actual
4. Click en "Cerrar sesión"
5. Volver a Login page
6. Login con otro usuario
7. Verificar que permisos cambian dinámicamente

## 🎨 Elementos Visuales a Verificar

### Navbar
- ✅ Badge de rol con color correspondiente (OrgAdmin=rojo, Manager=naranja, etc.)
- ✅ Dropdown muestra todos los roles del usuario
- ✅ Botón logout funcional

### Sidebar
- ✅ Items filtrados según permisos
- ✅ CTA de upgrade solo visible si tiene `billing.upgrade`
- ✅ Navegación smooth entre vistas

### Dashboard
- ✅ Banner informativo para roles no-admin: "Rol: X - Vista limitada"
- ✅ Stats adaptadas según rol
- ✅ Mensaje de bienvenida para Guest

### User Management
- ✅ Mensaje "(Solo lectura)" si no tiene permisos de edición
- ✅ Botón "Invitar Usuario" oculto o mensaje "Sin permisos"
- ✅ Botones de acción deshabilitados con tooltip

### Role Management
- ✅ Mensaje "(Solo lectura)" si no tiene permisos
- ✅ Botón "Crear Rol" oculto o mensaje "Sin permisos"
- ✅ Botones de acción deshabilitados en roles custom

### Subscription Management
- ✅ Banner "Acceso limitado" si no tiene `billing.manage`
- ✅ Botones "Actualizar Plan" deshabilitados con mensaje "Sin Permisos"

## 🐛 Testing de Edge Cases

1. **Sesión persistente:**
   - Login como usuario
   - Refresh página (F5)
   - Verificar que sesión se mantiene (localStorage)

2. **Permisos combinados:**
   - Login como Sarah (Manager + HR Access)
   - Verificar que permisos de ambos roles se combinan

3. **Navegación directa:**
   - Login como Guest
   - Intentar navegar manualmente a ruta no permitida
   - Verificar que item no está en sidebar

4. **Wildcard matching:**
   - OrgAdmin con `users.*` debe tener acceso a `users.create`, `users.update`, etc.
   - Verificar en consola del navegador

## 📊 Matriz de Acceso Rápida

| Módulo        | OrgAdmin | Manager | Member | Content Editor | Guest |
|---------------|----------|---------|--------|----------------|-------|
| Dashboard     | Full     | Full    | Limited| Limited        | Minimal|
| Usuarios      | Full     | Read    | ❌     | ❌             | ❌    |
| Roles         | Full     | Read    | ❌     | ❌             | ❌    |
| Permisos      | Full     | ❌      | ❌     | ❌             | ❌    |
| Suscripción   | Full     | ❌      | ❌     | ❌             | ❌    |
| Auditoría     | Full     | Read    | ❌     | ❌             | ❌    |
| Configuración | Full     | ❌      | ❌     | ❌             | ❌    |

**Leyenda:**
- **Full**: Acceso completo (crear, editar, eliminar)
- **Read**: Solo lectura
- **Limited**: Vista limitada
- **Minimal**: Vista muy básica
- **❌**: Sin acceso

## 💡 Tips de Testing

1. **Usar DevTools:**
   - Abrir React DevTools para ver estado de AuthContext
   - Inspeccionar permisos del usuario actual

2. **Consola del navegador:**
   - Ver logs de login/logout
   - Verificar permisos cargados

3. **Test de doble click:**
   - En Login page, doble click en usuario para login rápido

4. **Tooltips:**
   - Hover sobre botones deshabilitados para ver razón

5. **Responsive:**
   - Probar en diferentes tamaños de pantalla
   - Navbar se adapta (hide badges en mobile)

## 🎯 Checklist de Aceptación

- [ ] Login page muestra 5 usuarios con roles y permisos
- [ ] Cada usuario puede hacer login
- [ ] Navbar muestra badge de rol actual
- [ ] Sidebar filtra items según permisos
- [ ] Dashboard se adapta según rol
- [ ] Botones se deshabilitan según permisos
- [ ] Mensajes informativos claros ("Sin permisos", "Solo lectura")
- [ ] Logout funciona y vuelve a Login
- [ ] Cambiar de usuario actualiza permisos dinámicamente
- [ ] Sesión persiste al refresh (localStorage)

## 📝 Notas de Implementación

- **No backend real:** Toda la lógica es client-side
- **LocalStorage:** Mantiene sesión activa al refresh
- **Wildcards:** `users.*` matches `users.create`, `users.update`, etc.
- **Múltiples roles:** Permisos se combinan con OR
- **OrgAdmin bypass:** Siempre tiene todos los permisos

## 🚧 Limitaciones Conocidas

- Simulación solo client-side (no API real)
- No hay validación de tokens/JWT
- Permisos hardcodeados en mockData
- No hay timeout de sesión
- No hay refresh automático de permisos

## 📞 Soporte

Para reportar bugs o sugerencias, contactar al equipo de desarrollo.
