# Análisis de Feature Gating por Plan

**Fecha:** 2026-06-17  
**Autor:** Claude Code (análisis automatizado)  
**Scope:** frontend_next_hub, frontend_workspace, frontend_next_vista, frontend_sidebar_desktop + backend

---

## 1. Resumen Ejecutivo

El sistema tiene cuatro planes: **Free → Starter ($29/mes) → Professional ($79/mes) → Enterprise ($199/mes)**. La lógica de gating está distribuida así:

| App | Estrategia de gating | Implementación |
|-----|---------------------|----------------|
| `frontend_next_hub` | Server-driven | `useFeatureGate` → `GET /api/v1/features/` |
| `frontend_workspace` | Server-driven | `useFeatureGate` + `FeatureGate` component |
| `frontend_next_vista` | Client-side | `featureGates.ts` + `useFeatureGate` + `FeatureGate` |
| `frontend_sidebar_desktop` | Sin gating propio | Solo muestra plan; acceso controlado en Hub |

La fuente de verdad es `apps/backend_django/utils/plans.py`. El endpoint `/api/v1/features/` expone el estado completo del plan activo. Vista es la excepción: sus gates están hardcodeados en `src/data/featureGates.ts` y se resuelven contra el `currentPlan` del auth store.

**Conclusión rápida:** la estrategia general está bien diseñada y sigue patrones de industria. Los puntos a revisar son pocos y concretos (ver sección 7).

---

## 2. Arquitectura del Sistema

```
Backend (fuente de verdad)
  utils/plans.py
    PLAN_FEATURES dict → 50+ feature flags por plan
    PLAN_LIMITS dict   → 13 tipos de límites de recursos

  rbac/permissions.py
    HasFeature('feature_key')  → HTTP 402 si plan no tiene la feature
    check_plan_limit(user, resource, count) → HTTP 402 si supera límite

  GET /api/v1/features/ → { plan, features: {key: bool}, limits: {key: int|null} }
         ↓
   Hub / Workspace                      Vista (client-side)
   useFeatureGate.ts                    featureGates.ts
   FeatureGate component                useFeatureGate.ts
   UpgradePrompt → /subscription        UpgradePrompt → HUB_URL/subscription
```

---

## 3. Hub Client Portal (`frontend_next_hub`)

El Hub no gestiona funcionalidades de producto directamente, sino el acceso a los **servicios** del catálogo. Cada servicio tiene un `required_plan` que determina si el tenant puede accedarlo.

### 3.1 Acceso a servicios por plan

| Servicio | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Workspace | ✗ | ✓ | ✓ | ✓ |
| Vista Digital | ✗ | ✓ | ✓ | ✓ |
| Desktop App | ✗ | ✗ | ✓ | ✓ |
| SSO Enterprise | ✗ | ✗ | ✗ | ✓ |

### 3.2 Gestión de suscripción y billing

| Función | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Ver plan actual | ✓ | ✓ | ✓ | ✓ |
| Comparar planes / upgrade | ✓ | ✓ | ✓ | — |
| Downgrade de plan | ✓ | ✓ | ✓ | ✓ |
| Ver facturas | ✓ | ✓ | ✓ | ✓ |
| Gestionar métodos de pago | ✓ | ✓ | ✓ | ✓ |

### 3.3 Permisos internos del Hub

El Hub usa `usePermissions` que expone `canUpgradePlan`:
- **Free / Starter:** `canUpgradePlan = true` → CTA de upgrade visible
- **Professional / Enterprise:** `canUpgradePlan = false` → CTA oculto

La lógica `isUpgrade(current, target)` en `plans-data.ts` filtra qué planes aparecen disponibles en el `UpgradePlanDrawer`.

---

## 4. Workspace (`frontend_workspace`)

### 4.1 Features de página completa (gateadas con `FeatureGate`)

| Feature / Página | Free | Starter | Professional | Enterprise | Archivo |
|-----------------|:----:|:-------:|:------------:|:----------:|---------|
| Variables de Entorno | ✗ | ✓ | ✓ | ✓ | `env-vars/EnvVarsPage.tsx` |
| SSH Keys | ✗ | ✓ | ✓ | ✓ | `ssh-keys/SSHKeysPage.tsx` |
| SSL Certs | ✗ | ✓ | ✓ | ✓ | `ssl-certs/SSLCertsPage.tsx` |
| Formularios | ✗ | ✓ | ✓ | ✓ | `forms/FormsPage.tsx` |
| Reportes / Analytics | ✗ | ✓ | ✓ | ✓ | `reports/ReportsPage.tsx` |
| Audit Log | ✗ | ✗ | ✓ | ✓ | `audit/AuditPage.tsx` |

> El sidebar de navegación también filtra los ítems marcados con `feature` cuando `hasFeature()` devuelve false — el ítem simplemente no aparece.

### 4.2 Features de acción (botones individuales gateados)

| Acción | Free | Starter | Professional | Enterprise |
|--------|:----:|:-------:|:------------:|:----------:|
| Export Contactos CSV | ✗ | ✓ | ✓ | ✓ |
| Export Proyectos | ✗ | ✗ | ✓ | ✓ |
| Export Bookmarks | ✗ | ✗ | ✓ | ✓ |
| Export Snippets | ✗ | ✗ | ✓ | ✓ |
| Export Env Vars | ✗ | ✗ | ✓ | ✓ |
| Export Form Responses CSV | ✗ | ✗ | ✓ | ✓ |
| Export Reporte Analytics | ✗ | ✗ | ✓ | ✓ |
| Gráfico de Tendencias (Analytics) | ✗ | ✗ | ✓ | ✓ |

### 4.3 Colaboración y asignación

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Compartir proyectos (sharing) | ✗ | ✓ | ✓ | ✓ |
| Asignar tareas a usuarios | ✗ | ✓ | ✓ | ✓ |
| Asistentes en calendario | ✗ | ✓ | ✓ | ✓ |
| Grupos de contactos | ✗ | ✓ | ✓ | ✓ |
| Colecciones de bookmarks | ✗ | ✓ | ✓ | ✓ |

### 4.4 Seguridad y DevOps

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| MFA (autenticación 2FA) | ✗ | ✗ | ✓ | ✓ |
| SSO (entre servicios) | ✗ | ✗ | ✗ | ✓ |
| Webhooks | ✗ | ✗ | ✓ | ✓ |
| Batch operations | ✗ | ✗ | ✓ | ✓ |
| Custom branding | ✗ | ✗ | ✓ | ✓ |
| Delegación temporal | ✗ | ✗ | ✓ | ✓ |
| Full-text search | ✗ | ✗ | ✓ | ✓ |

### 4.5 Roles personalizados

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Custom roles | ✗ | ✓ (máx 3) | ✓ (máx 10) | ✓ (∞) |

---

## 5. Vista Digital (`frontend_next_vista`)

Vista tiene su propio sistema de gates client-side (`src/data/featureGates.ts`), independiente del servidor. Es el frontend más granular en términos de gating.

### 5.1 Tarjeta Digital

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Crear tarjeta digital | ✓ | ✓ | ✓ | ✓ |
| QR Code de la tarjeta | ✗ | ✓ | ✓ | ✓ |
| Exportar vCard (.vcf) | ✗ | ✓ | ✓ | ✓ |
| Analytics de visitas | ✗ | ✓ | ✓ | ✓ |

### 5.2 Landing Page

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Builder de landing page | ✗ | ✓ | ✓ | ✓ |
| Templates disponibles | 0 | 3 | ∞ | ∞ |
| Formulario de contacto | ✗ | ✓ | ✓ | ✓ |
| CSS personalizado | ✗ | ✗ | ✓ | ✓ |
| SEO meta tags | ✗ | ✗ | ✓ | ✓ |
| Google Analytics | ✗ | ✗ | ✓ | ✓ |

### 5.3 Portfolio

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Portfolio de proyectos | ✗ | ✗ | ✓ | ✓ |
| Imágenes por galería | 0 | 0 | 10 | ∞ |
| Proyectos destacados | 0 | 0 | 3 | ∞ |

### 5.4 CV / Currículum

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Editor de CV | ✓ | ✓ | ✓ | ✓ |
| Templates disponibles | 1 | 2 | 3 | 3 |
| Exportar PDF | ✗ | ✓ | ✓ | ✓ |
| Sección Proyectos en CV | ✗ | ✓ | ✓ | ✓ |
| Múltiples versiones de CV | ✗ | ✗ | ✓ | ✓ |
| Sección Voluntariado | ✗ | ✗ | ✓ | ✓ |
| Sección Premios | ✗ | ✗ | ✓ | ✓ |
| Color de acento personalizado | ✗ | ✗ | ✓ | ✓ |

### 5.5 Dominio y Marca

| Feature | Free | Starter | Professional | Enterprise |
|---------|:----:|:-------:|:------------:|:----------:|
| Dominio personalizado | ✗ | ✗ | ✓ | ✓ |
| White label (sin branding) | ✗ | ✗ | ✗ | ✓ |

### 5.6 Analytics de servicios digitales

La retención de datos de analytics varía por plan:
- **Free / Starter:** 7 días
- **Professional:** 30 días
- **Enterprise:** 365 días

---

## 6. Desktop App (`frontend_sidebar_desktop`)

El Desktop en sí **no tiene feature gating interno**. La lógica de acceso opera en dos niveles externos:

1. **Hub (acceso al servicio):** El catálogo de servicios marca Desktop App con `required_plan: 'professional'`. Un tenant Free o Starter no puede lanzar la app.

2. **Backend (validación en SSO):** Cuando Desktop inicia autenticación vía deep link (`rbacdesktop://`), el backend valida que el tenant tenga `TenantService.status == 'active'` para el servicio Desktop. Si el plan no lo incluye, el flujo falla en el Hub antes de llegar al backend.

3. **Plan en UI:** El `ProfilePanel` del Desktop muestra el plan actual del tenant como badge informativo, pero no restringe ninguna acción interna.

**Consecuencia:** una vez que el tenant tiene acceso al Desktop (Professional+), todas las funcionalidades están disponibles sin gates adicionales dentro de la app.

---

## 7. Backend — Límites de Recursos

### 7.1 Límites numéricos por plan

| Recurso | Free | Starter | Professional | Enterprise |
|---------|-----:|-------:|-------------:|----------:|
| Usuarios (max_users) | 5 | 10 | 25 | ∞ |
| Proyectos (max_projects) | 2 | 10 | ∞ | ∞ |
| Secciones por proyecto | 3 | 10 | ∞ | ∞ |
| Ítems por proyecto | 50 | 200 | ∞ | ∞ |
| Notas (max_notes) | 10 | 100 | 1,000 | ∞ |
| Contactos (max_contacts) | 25 | 100 | ∞ | ∞ |
| Bookmarks (max_bookmarks) | 20 | 100 | ∞ | ∞ |
| Snippets (max_snippets) | 10 | 50 | ∞ | ∞ |
| Variables de entorno | 0 | 50 | ∞ | ∞ |
| SSH Keys | 0 | 5 | ∞ | ∞ |
| SSL Certs | 0 | 10 | ∞ | ∞ |
| Formularios | 1 | 5 | 25 | ∞ |
| Preguntas por formulario | 5 | 20 | ∞ | ∞ |
| Respuestas por formulario | 50 | ∞ | ∞ | ∞ |
| Task boards | 1 | 5 | ∞ | ∞ |
| Tareas (max_tasks) | 50 | 500 | ∞ | ∞ |
| Eventos de calendario | 50 | 200 | ∞ | ∞ |
| Compartir por proyecto | 0 | 5 | 50 | ∞ |
| Roles personalizados | 0 | 3 | 10 | ∞ |
| Storage (GB) | 1 | 5 | 20 | ∞ |
| API calls/mes | 1,000 | 10,000 | 100,000 | ∞ |
| Retención audit logs (días) | 7 | 30 | 365 | 2,555 |

### 7.2 Enforcement

- Creación de recursos: `check_plan_limit(user, 'resource', current_count)` → HTTP 402
- Features: `HasFeature('feature_key')` como permission class en la view → HTTP 402
- Respuesta de error estándar: `{ "error": { "code": "feature_not_available", "message": "...", "upgrade_url": "/billing/upgrade" } }`

---

## 8. Análisis del Rationale

### 8.1 Por qué Free está así

**Objetivo:** demostrar valor sin fricción, capturar leads.

- **Tarjeta digital y CV gratuitos:** son las funcionalidades más "virales" — el usuario las comparte públicamente, actuando como marketing orgánico. Correcto tenerlos en Free.
- **2 proyectos y 50 tareas:** suficiente para que un individuo pruebe el Workspace pero insuficiente para un equipo real, generando presión de upgrade natural.
- **Sin colaboración (sharing=0, max_users=5):** la colaboración es el principal driver de upgrade en herramientas de productividad. Ocultarla en Free es la jugada estándar.
- **Sin env_vars ni SSH keys en Free:** estas son herramientas de desarrolladores/DevOps. Usuarios Free probablemente no las necesiten; incluirlas en Starter atrae a ese segmento técnico.
- **Sin landing page en Free:** aunque sea una feature sencilla, la landing es un "producto vendible" que el usuario va a querer publicar seriamente — ponerla en Starter tiene sentido.

### 8.2 Por qué Starter está así

**Objetivo:** primer ingreso económico, equipos pequeños y freelancers.

- **Workspace + Vista desbloqueados:** desbloquear los dos servicios principales en Starter es correcto. Un cliente que paga $29 debe poder usar la plataforma completa.
- **Custom roles (3):** dar algo de RBAC en Starter es una buena práctica — los equipos pequeños necesitan al menos separar Owner / Editor / Viewer customizado.
- **Sin MFA en Starter:** éste es el punto más discutible de toda la configuración (ver recomendaciones).
- **Sin audit logs en Starter:** apropiado — auditoría completa es una necesidad de compliance (SOC2, GDPR) que típicamente solo tienen empresas medianas+.
- **Analytics en Starter:** bien. Los freelancers y equipos pequeños tienen necesidades básicas de métricas. Solo las tendencias y el export quedan para Professional.
- **Sin webhooks en Starter:** los webhooks requieren infraestructura en el lado del cliente para consumirlos. Son una feature técnica avanzada; profesional es el nivel correcto.

### 8.3 Por qué Professional está así

**Objetivo:** equipos medianos con necesidades de compliance, DevOps y automatización.

- **MFA obligatorio (required):** correcto para equipos que manejan datos sensibles. Nótese que está marcado como `required=True` en el backend — esto merece revisión (ver sección 9).
- **Audit logs (365 días):** estándar para compliance SOC2. Un año de retención es lo mínimo que piden la mayoría de certificaciones.
- **Webhooks y batch_operations:** automatizan flujos de trabajo. Son complejidad técnica que justifica el precio Professional.
- **Custom domain y portfolio en Vista:** desblocar el portfolio en Professional (no en Starter) puede ser agresivo — ver recomendaciones.
- **SSO solo en Enterprise:** correcto. La integración SSO requiere trabajo de setup en el lado del cliente y soporte dedicado.
- **Desktop App solo en Professional+:** la app de escritorio es una herramienta de productividad avanzada. Professional es el nivel correcto.

### 8.4 Por qué Enterprise está así

**Objetivo:** grandes organizaciones con necesidades de compliance, personalización y SLA.

- **SSO + Custom domain + White label:** los tres son clásicos Enterprise. El SSO centralizado, el dominio propio y la eliminación de branding son requisitos habituales de grandes clientes.
- **Support SLA:** el SLA de soporte es el diferenciador de retención de clientes Enterprise. Apropiado.
- **Audit log 7 años (2,555 días):** algunas industrias (salud, finanzas) tienen requisitos legales de retención de 5-7 años. Correcto.
- **Unlimited en todo:** simplificar la propuesta de valor — los Enterprise no quieren contar límites.

---

## 9. Comparación con Mejores Prácticas de Industria

La tabla siguiente compara la configuración actual contra lo que hacen plataformas similares (Notion, Linear, ClickUp, Webflow, Squarespace).

| Práctica de industria | Actual en este proyecto | Evaluación |
|----------------------|------------------------|-----------|
| Free con colaboración básica (al menos 2-3 colaboradores) | Free = 5 usuarios pero sin sharing | ⚠️ Parcial — los usuarios existen pero no pueden compartir nada |
| MFA disponible desde plan gratuito o Starter | MFA solo en Professional | ❌ Problema de seguridad |
| Analytics básicos en Starter | ✓ Analytics en Starter | ✓ Correcto |
| Export de datos disponible para todos (derecho del usuario) | Export solo en Starter+ / Professional+ | ⚠️ Borderline |
| Portfolio y presencia digital sin paywall agresivo | Portfolio solo en Professional | ⚠️ Puede ser muy restrictivo |
| Landing page en Starter | ✓ Landing en Starter | ✓ Correcto |
| Webhooks en Professional | ✓ Webhooks en Professional | ✓ Correcto |
| SSO en Enterprise | ✓ SSO en Enterprise | ✓ Correcto |
| White label en Enterprise | ✓ White label en Enterprise | ✓ Correcto |
| Custom domain en Professional | ✓ Custom domain en Professional | ✓ Correcto |
| Audit logs en Professional | ✓ Audit logs en Professional | ✓ Correcto |
| Grandfathering / sin eliminar datos al downgrade | No evaluado en código | ❓ No analizado |

---

## 10. Recomendaciones

### 10.1 Crítico: MFA en Starter (seguridad)

**Problema:** MFA solo está disponible en Professional+. Esto significa que usuarios de planes Free y Starter no pueden habilitar autenticación de dos factores aunque manejen datos sensibles de negocio.

**Por qué importa:** en 2024-2026, MFA no es una "feature premium" — es una expectativa básica de seguridad. Plataformas como GitHub, Google Workspace, Notion y Atlassian ofrecen MFA en todos los planes incluyendo el gratuito. Restringirlo genera riesgo de seguridad real y puede ser un bloqueador de ventas cuando los clientes tienen políticas de seguridad internas.

**Recomendación:** mover `mfa` de Professional a Starter (o incluso Free). Puede mantenerse en Professional como `mfa_required` (habilitación forzada para toda la organización), pero el TOTP individual debería ser accesible en todos los planes.

### 10.2 Revisar: Portfolio en Professional (demasiado restrictivo)

**Problema:** el portfolio es la tercera pieza del perfil digital (después de tarjeta y CV). Bloquearlo en Professional cuando la tarjeta y el CV están en Free/Starter crea una experiencia fragmentada — el usuario puede presentarse con CV y tarjeta pero no mostrar su trabajo.

**Contexto de industria:** Behance, Dribbble y Carrd tienen portfolios en planes gratuitos.

**Recomendación:** mover portfolio básico (sin límite de imágenes de galería, máx 3-5 proyectos) a Starter. Mantener en Professional las capacidades avanzadas (portfolioGalleryImages ilimitadas, proyectos destacados ∞).

### 10.3 Revisar: MFA `required=True` en Professional

**Problema técnico:** en `utils/plans.py`, la feature `mfa` en Professional está marcada como `required=True`. Esto implica que el sistema podría forzar MFA en todos los usuarios de Professional — lo cual puede ser una sorpresa desagradable al hacer upgrade y potencialmente romper el flujo de login de usuarios existentes.

**Recomendación:** separar en dos flags: `mfa_available` (Starter+) y `mfa_enforce` (Enterprise, para cumplimiento de seguridad organizacional). El `required` debería ser una decisión que tome el admin del tenant, no el sistema.

### 10.4 Revisar: Compartir (sharing) en Free con límite 0

**Problema:** Free tiene `max_users: 5` pero `max_shares_per_project: 0`. Esto significa que hay hasta 5 usuarios en un tenant Free pero ninguno puede compartir proyectos entre sí. El equipo existe pero no puede colaborar.

**Recomendación:** permitir sharing básico entre miembros del mismo tenant en Free (todos los usuarios que ya están en el tenant). Reservar el sharing hacia usuarios externos para Starter+. Esto elimina la contradicción interna.

### 10.5 Menor: Export de datos básico como derecho

**Contexto:** el GDPR (Art. 20) y regulaciones similares garantizan el derecho de portabilidad de datos. Aunque no es obligatorio que la UI facilite export avanzado, el principio de buena fe sugiere permitir al menos un export básico de los propios datos.

**Recomendación:** permitir export de datos personales básicos (propios contactos, propias notas) en todos los planes. Mantener en Professional+ el export de datos de organización completa y los exports masivos/automatizados.

### 10.6 Positivo: Lo que está bien

- **Tarjeta digital y CV en Free:** generar marketing orgánico con vistas públicas es una estrategia de crecimiento sólida.
- **Landing page en Starter:** precio justo para desbloquear una herramienta de presencia web.
- **Webhooks y batch_operations en Professional:** correcto. Son features técnicas que requieren infraestructura del lado del cliente.
- **Audit logs escalados (7/30/365/2555 días):** la escalada progresiva es perfecta para cubrir desde cumplimiento básico hasta regulaciones de industria pesada.
- **Desktop App en Professional:** posicionar el Desktop como diferenciador de plan medio-alto tiene sentido; los power users que quieren la app de escritorio son los mismos que necesitan las otras features de Professional.
- **SSO y White label en Enterprise:** estándar de industria, bien ubicados.
- **Sistema dual (frontend gate + backend enforce):** la duplicación intencional de gates (UI deshabilitada + backend rechaza igualmente) es la práctica correcta. Nunca depender solo del frontend para seguridad de features.
- **HTTP 402 con `upgrade_url`:** respuesta estándar que permite al frontend mostrar un CTA de upgrade directamente desde el error del backend.

### 10.7 Técnico: Inconsistencia client-side vs server-driven en Vista

**Observación:** Vista es el único frontend con gates hardcodeados en `featureGates.ts`. Si el backend cambia las definiciones de plan, Vista no se actualiza automáticamente — hay que sincronizar manualmente el archivo TypeScript.

**Recomendación a largo plazo:** considerar que Vista también consuma el endpoint `/api/v1/features/` en lugar de su propio archivo. El hook ya existe (`useFeatureGate.ts`), solo falta migrar la fuente de datos de local a API. Esto eliminaría la deuda de sincronización.

---

## 11. Resumen de Prioridades

| Prioridad | Cambio recomendado | Impacto |
|-----------|-------------------|---------|
| 🔴 Alta | MFA disponible desde Starter (no solo Professional) | Seguridad de clientes |
| 🔴 Alta | Revisar `mfa required=True` en Professional | UX en upgrade |
| 🟡 Media | Portfolio básico en Starter | Conversión Starter |
| 🟡 Media | Sharing entre miembros del mismo tenant en Free | Coherencia del producto |
| 🟡 Media | Export de datos propios en todos los planes | GDPR / buena fe |
| 🟢 Baja | Migrar featureGates.ts de Vista a server-driven | Mantenibilidad |

---

*Generado el 2026-06-17. Basado en análisis estático de: `apps/backend_django/utils/plans.py`, `apps/frontend_next_vista/src/data/featureGates.ts`, `apps/frontend_workspace/src/layouts/components/Sidebar.tsx`, `apps/frontend_workspace/src/test/handlers/features.ts`, `apps/frontend_next_hub/features/subscription/plans-data.ts`, `apps/frontend_next_hub/hooks/useFeatureGate.ts`.*
