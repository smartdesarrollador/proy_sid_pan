# Angular Responsive Layout Skill

Sistema completo de layouts responsive para Angular standalone con Tailwind CSS.

## Estructura del Skill

```
angular-responsive-layout/
├── SKILL.md                          # Documentación principal con todos los componentes
├── README.md                         # Este archivo
└── references/
    ├── advanced-patterns.md          # Patrones avanzados (drawer, modal, tabs, etc.)
    ├── tailwind-config.md            # Configuración completa de Tailwind
    └── usage-examples.md             # Ejemplos completos de implementación
```

## Componentes Incluidos

### Core Services
- **BreakpointService** - Detección de viewport con signals (isMobile, isTablet, isDesktop)
- **ThemeService** - Dark mode toggle

### Layout Components
- **MainLayoutComponent** - Layout completo (navbar + sidebar + content + footer)
- **NavbarComponent** - Navegación responsive con mobile drawer
- **SidebarComponent** - Sidebar collapsible con nested links
- **BottomNavComponent** - Navegación inferior para mobile
- **FooterComponent** - Footer responsive multi-columna
- **BreadcrumbsComponent** - Breadcrumbs responsive

### UI Components
- **HamburgerMenuComponent** - Icono de menú animado
- **DarkModeToggleComponent** - Toggle de tema claro/oscuro
- **ContainerComponent** - Containers responsive (sm, md, lg, xl)
- **ResponsiveImageComponent** - Imágenes con aspect ratio
- **ResponsiveVideoComponent** - Video player responsive

### Directives
- **ResponsiveDirective** - Show/hide condicional por breakpoint

### Advanced Components (en references)
- **MobileDrawerComponent** - Drawer animado para mobile
- **ResponsiveModalComponent** - Modal que se adapta a mobile/desktop
- **AdaptiveTabsComponent** - Tabs que cambian a dropdown en mobile
- **ResponsiveTableComponent** - Tabla que se convierte en cards en mobile
- **ProgressiveImageComponent** - Imágenes con placeholder blur
- **ScrollToTopComponent** - Botón scroll to top

## Quick Start

### 1. Configurar Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

Usar la configuración en `references/tailwind-config.md`

### 2. Crear BreakpointService

```typescript
// src/app/core/services/breakpoint.service.ts
// Copiar código del SKILL.md sección 1
```

### 3. Implementar MainLayout

```typescript
// src/app/layouts/main-layout/main-layout.component.ts
// Copiar código del SKILL.md sección 9
```

### 4. Configurar Rutas

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      // ... más rutas
    ]
  }
];
```

## Uso Rápido

### Detectar Breakpoints

```typescript
export class MyComponent {
  breakpoint = inject(BreakpointService);

  // En template
  @if (breakpoint.isMobile()) {
    <app-mobile-view />
  } @else {
    <app-desktop-view />
  }
}
```

### Responsive Directive

```html
<!-- Solo mobile -->
<div *appResponsive="'mobile'">Mobile only</div>

<!-- Solo desktop -->
<div *appResponsive="'desktop'">Desktop only</div>

<!-- Mobile y tablet -->
<div *appResponsive="['mobile', 'tablet']">Mobile & Tablet</div>
```

### Grid Layouts

```html
<!-- 1 col mobile, 2 tablet, 3 desktop, 4 large -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <!-- items -->
</div>
```

### Responsive Typography

```html
<h1 class="heading-1">Responsive Heading</h1>
<p class="body-normal">Responsive text</p>
```

### Containers

```html
<div class="container-responsive">
  <!-- Content with responsive padding -->
</div>
```

## Best Practices

1. **Mobile-First**: Empieza con estilos mobile, agrega breakpoints progresivamente
2. **Signals**: Usa signals para reactive breakpoint detection
3. **Performance**: Debounce resize events, lazy load images
4. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
5. **Dark Mode**: Usa classes dark: de Tailwind

## Referencias

- **SKILL.md** - Documentación completa con código de todos los componentes
- **advanced-patterns.md** - Drawer, modal, tabs, tables responsive
- **tailwind-config.md** - Configuración Tailwind completa
- **usage-examples.md** - Ejemplos E-commerce, Dashboard, Products

## Tailwind Utilities Custom

```css
/* Container */
.container-responsive   /* max-w-7xl con padding responsive */

/* Spacing */
.section-spacing       /* py responsive (8/12/16/20) */
.gap-responsive        /* gap responsive (4/6/8) */

/* Typography */
.heading-1, .heading-2, .heading-3  /* Headings responsive */
.body-large, .body-normal, .body-small

/* Components */
.card, .card-hover
.btn, .btn-primary, .btn-secondary
.input, .label, .badge
```

## Ejemplos Completos

Ver `references/usage-examples.md` para:
- ✅ E-commerce Layout completo
- ✅ Dashboard con stats grid
- ✅ Products page con filtros
- ✅ Formularios responsive
- ✅ Modals y drawers

---

**Nota**: Este skill está diseñado para Angular 19+ standalone con Tailwind CSS. Todos los componentes son production-ready y siguen best practices de Angular y diseño responsive mobile-first.
