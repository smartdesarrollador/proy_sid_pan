# Quick Start Guide - Implementación Paso a Paso

Guía rápida para implementar accesibilidad en una aplicación Angular existente.

## Tabla de Contenidos

1. [Setup Inicial](#setup-inicial)
2. [Implementación por Prioridad](#implementación-por-prioridad)
3. [Quick Wins (1-2 días)](#quick-wins-1-2-días)
4. [Medium Effort (1 semana)](#medium-effort-1-semana)
5. [Long Term (2-4 semanas)](#long-term-2-4-semanas)
6. [Checklist Ejecutable](#checklist-ejecutable)

---

## Setup Inicial

### 1. Instalar Dependencias

```bash
# Core dependencies
npm install --save-dev axe-core @axe-core/playwright jest-axe

# Angular CDK (opcional, para componentes avanzados)
npm install @angular/cdk
```

### 2. Configurar Testing

**setup-jest.ts:**

```typescript
import 'jest-preset-angular/setup-jest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

### 3. Agregar Estilos Base

**src/styles.scss:**

```scss
@import 'styles/accessibility.scss';

// Asegurar que focus-visible funcione
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

// Screen reader only class
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// Reduced motion
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4. Crear Servicios Core

Copiar del SKILL.md principal:
- `LiveAnnouncerService`
- `FocusManagementService`
- `KeyboardNavigationService`

### 5. Crear Directivas

Copiar del SKILL.md principal:
- `FocusTrapDirective`
- `SkipLinkDirective`
- `AutoFocusDirective`

---

## Implementación por Prioridad

### Prioridad CRÍTICA (Hacer primero)

1. **Keyboard Navigation**
   - Verificar que toda la funcionalidad sea accesible con teclado
   - No debe haber keyboard traps
   - Orden de tabulación lógico

2. **Focus Indicators**
   - Visible en todos los elementos interactivos
   - Contraste suficiente (3:1 mínimo)

3. **Form Labels**
   - Todos los inputs tienen `<label>` asociado
   - Errores anunciados a screen readers

4. **ARIA en Modals**
   - `role="dialog"`
   - `aria-modal="true"`
   - Focus trap implementado

5. **Alt Text en Imágenes**
   - Todas las imágenes tienen `alt`
   - Imágenes decorativas: `alt=""` o `aria-hidden="true"`

### Prioridad ALTA (Siguiente paso)

6. **Semantic HTML**
   - `<header>`, `<nav>`, `<main>`, `<footer>`
   - Headings en orden (`<h1>`, `<h2>`, `<h3>`)
   - `<button>` para acciones, `<a>` para navegación

7. **Color Contrast**
   - Texto normal: 4.5:1 (WCAG AA)
   - Texto grande: 3:1 (WCAG AA)

8. **Skip Links**
   - Implementar "Skip to main content"

9. **Screen Reader Announcements**
   - Usar `LiveAnnouncerService` para notificaciones
   - ARIA live regions para cambios dinámicos

10. **Accessible Routing**
    - Focus en main content al cambiar ruta
    - Anunciar cambios de página

### Prioridad MEDIA (Mejoras)

11. **Touch Targets**
    - Mínimo 44x44px para todos los elementos clickables

12. **Tooltips Accesibles**
    - `role="tooltip"`
    - `aria-describedby`

13. **Dropdowns Accesibles**
    - Keyboard navigation con arrow keys
    - `aria-expanded`, `aria-haspopup`

14. **Tables Accesibles**
    - `<th scope="col|row">`
    - `<caption>` descriptivo

15. **Autocomplete Accesible**
    - `role="combobox"`
    - `aria-autocomplete="list"`

### Prioridad BAJA (Opcional)

16. **Dark Mode Accessible**
    - Mantener contraste en ambos modos

17. **Internationalization**
    - `lang` attribute correcto

18. **Print Styles**
    - CSS para impresión accesible

---

## Quick Wins (1-2 días)

### 1. Agregar Alt Text a Imágenes

**Antes:**
```html
<img src="logo.png">
```

**Después:**
```html
<img src="logo.png" alt="Company Logo">

<!-- Para imágenes decorativas -->
<img src="decoration.png" alt="" aria-hidden="true">
```

### 2. Agregar Skip Link

**app.component.html:**
```html
<a href="#main-content" class="skip-link">Skip to main content</a>

<header>...</header>
<nav>...</nav>

<main id="main-content" tabindex="-1">
  <router-outlet></router-outlet>
</main>
```

**styles.scss:**
```scss
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 9999;
  padding: 0.75rem 1.5rem;
  background: #000;
  color: #fff;
  text-decoration: none;

  &:focus {
    top: 0;
  }
}
```

### 3. Fix Focus Indicators

**styles.scss:**
```scss
// Remover outline default
*:focus {
  outline: none;
}

// Agregar focus-visible
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

// Variantes por color
.btn-primary:focus-visible {
  outline-color: #3b82f6;
}

.btn-danger:focus-visible {
  outline-color: #dc2626;
}
```

### 4. Usar Semantic HTML

**Antes:**
```html
<div class="header">
  <div class="nav">...</div>
</div>
<div class="content">...</div>
<div class="footer">...</div>
```

**Después:**
```html
<header>
  <nav aria-label="Main navigation">...</nav>
</header>
<main>...</main>
<footer>...</footer>
```

### 5. Fix Form Labels

**Antes:**
```html
<input type="text" placeholder="Name">
```

**Después:**
```html
<label for="name">Name</label>
<input id="name" type="text" placeholder="e.g., John Doe">
```

---

## Medium Effort (1 semana)

### 1. Implementar LiveAnnouncerService

**Crear servicio:**

```typescript
// src/app/core/services/live-announcer.service.ts
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService {
  private liveElement?: HTMLElement;

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    this.ensureLiveElement();
    this.liveElement!.setAttribute('aria-live', politeness);
    this.liveElement!.textContent = message;
  }

  private ensureLiveElement(): void {
    if (this.liveElement) return;

    this.liveElement = document.createElement('div');
    this.liveElement.className = 'sr-only';
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.liveElement);
  }
}
```

**Usar en componentes:**

```typescript
export class FormComponent {
  private announcer = inject(LiveAnnouncerService);

  onSubmit(): void {
    if (this.form.valid) {
      // ... submit logic
      this.announcer.announce('Form submitted successfully', 'polite');
    } else {
      this.announcer.announce('Please fix errors in the form', 'assertive');
    }
  }
}
```

### 2. Implementar FocusTrap para Modals

**focus-trap.directive.ts:**

```typescript
@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private focusManager = inject(FocusManagementService);

  autoFocus = input<boolean>(true);
  returnFocus = input<boolean>(true);

  ngOnInit(): void {
    if (this.returnFocus()) {
      this.focusManager.saveFocus();
    }

    if (this.autoFocus()) {
      setTimeout(() => {
        this.focusManager.focusFirst(this.el.nativeElement);
      }, 100);
    }

    this.el.nativeElement.addEventListener('keydown', this.handleKeydown);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('keydown', this.handleKeydown);

    if (this.returnFocus()) {
      this.focusManager.restoreFocus();
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusable = this.focusManager.getFocusableElements(this.el.nativeElement);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
```

**Usar en modal:**

```html
<div
  *ngIf="isOpen"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  appFocusTrap
  [autoFocus]="true"
  [returnFocus]="true"
  (keydown.escape)="close()"
>
  <h2 id="modal-title">{{ title }}</h2>
  <!-- contenido -->
</div>
```

### 3. Implementar Accessible Routing

**accessible-routing.service.ts:**

```typescript
@Injectable({ providedIn: 'root' })
export class AccessibleRoutingService {
  private router = inject(Router);
  private announcer = inject(LiveAnnouncerService);

  init(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.focusMainContent();
        this.announcePageChange();
        window.scrollTo(0, 0);
      });
  }

  private focusMainContent(): void {
    const main = document.querySelector<HTMLElement>('main, [role="main"]');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
    }
  }

  private announcePageChange(): void {
    const title = document.title || 'Page loaded';
    this.announcer.announce(`Navigated to: ${title}`, 'polite');
  }
}
```

**app.config.ts:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: APP_INITIALIZER,
      useFactory: (service: AccessibleRoutingService) => () => service.init(),
      deps: [AccessibleRoutingService],
      multi: true
    }
  ]
};
```

### 4. Agregar Axe Tests

**button.component.spec.ts:**

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ButtonComponent - A11y', () => {
  it('should pass axe accessibility tests', async () => {
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Long Term (2-4 semanas)

### 1. Crear Biblioteca de Componentes Accesibles

- AccessibleButton
- AccessibleModal
- AccessibleDropdown
- AccessibleForm
- AccessibleTable

### 2. Implementar Testing Completo

- Unit tests con axe-core
- E2E tests con Playwright
- Manual testing checklist
- Screen reader testing

### 3. Training del Equipo

- Workshop de accesibilidad
- Documentación interna
- Code review guidelines

### 4. Monitoring Continuo

- Axe DevTools en CI/CD
- Lighthouse CI
- Accessibility metrics tracking

---

## Checklist Ejecutable

### HTML Semántico ✓

```
□ Usar <header>, <nav>, <main>, <footer>
□ Usar <article>, <section> apropiadamente
□ Headings en orden (h1 → h2 → h3)
□ Usar <button> para acciones
□ Usar <a> para navegación
□ Usar <ul>/<ol> para listas
```

### Imágenes ✓

```
□ Todas las imágenes tienen alt text
□ Alt text descriptivo (no "image", "photo")
□ Imágenes decorativas: alt="" o aria-hidden="true"
□ Imágenes complejas: descripción larga con aria-describedby
□ SVG icons tienen title o aria-label
```

### Formularios ✓

```
□ Todos los inputs tienen <label> asociado
□ Labels visibles (no solo placeholder)
□ Required fields marcados (aria-required="true")
□ Errores asociados con aria-describedby
□ Errores anunciados con aria-live
□ Grouping con <fieldset> y <legend>
□ Autocomplete attributes para campos comunes
```

### Keyboard Navigation ✓

```
□ Tab alcanza todos los elementos interactivos
□ Tab sigue orden lógico (DOM order)
□ Shift+Tab funciona en reversa
□ Enter activa links y botones
□ Space activa botones y checkboxes
□ Escape cierra modals y dropdowns
□ Arrow keys navegan en componentes (dropdown, tabs)
□ Focus visible en todos los elementos
□ No hay keyboard traps
□ Skip links implementados
```

### ARIA ✓

```
□ role="button" solo cuando sea necesario (preferir <button>)
□ aria-label en iconos sin texto
□ aria-expanded en elementos expandibles
□ aria-haspopup en triggers de menus
□ aria-live para notificaciones
□ aria-modal="true" en modals
□ aria-describedby para help text
□ aria-labelledby para labels complejos
□ No usar ARIA cuando HTML nativo funciona
```

### Focus Management ✓

```
□ Modals trapean focus
□ Focus retorna después de cerrar modal
□ Routing enfoca main content
□ Focus visible con outline o box-shadow
□ No usar outline: none sin alternativa
□ Custom focus indicators tienen contraste 3:1
```

### Color Contrast ✓

```
□ Texto normal: 4.5:1 (WCAG AA)
□ Texto grande: 3:1 (WCAG AA)
□ UI components: 3:1 (WCAG AA)
□ Verificar con herramientas (WebAIM, Chrome DevTools)
□ No depender solo del color para información
```

### Screen Reader ✓

```
□ Page title descriptivo
□ Landmarks apropiados (header, nav, main, footer)
□ Headings descriptivos
□ Links descriptivos (no "click here")
□ Tablas con <th scope>
□ Listas para contenido list-like
□ Cambios dinámicos anunciados (aria-live)
```

### Touch Targets ✓

```
□ Mínimo 44x44px para elementos clickables
□ Spacing adecuado entre elementos táctiles
□ Verificar en mobile devices
```

### Testing ✓

```
□ Automated tests con axe-core
□ Manual testing con keyboard
□ Screen reader testing (NVDA/VoiceOver)
□ Color contrast verification
□ Responsive testing
□ CI/CD integration
```

---

## Herramientas Recomendadas

### Browser Extensions

- **axe DevTools** (Chrome/Firefox)
- **WAVE** (Chrome/Firefox/Edge)
- **Lighthouse** (Chrome DevTools)
- **Accessibility Insights** (Chrome/Edge)

### Testing Tools

- **axe-core** - Automated testing
- **jest-axe** - Jest integration
- **@axe-core/playwright** - E2E testing
- **Pa11y** - CLI accessibility testing

### Screen Readers

- **NVDA** (Windows, gratis)
- **JAWS** (Windows, pago)
- **VoiceOver** (Mac/iOS, incluido)
- **TalkBack** (Android, incluido)

### Color Tools

- **WebAIM Contrast Checker**
- **Contrast Ratio** (contrast-ratio.com)
- **Chrome DevTools** (built-in contrast checker)

---

## Recursos de Aprendizaje

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Inclusive Components**: https://inclusive-components.design/

---

## Próximos Pasos

1. **Week 1**: Implementar Quick Wins
2. **Week 2**: Setup testing infrastructure
3. **Week 3**: Implementar servicios core (LiveAnnouncer, FocusManagement)
4. **Week 4**: Crear componentes accesibles reutilizables
5. **Ongoing**: Manual testing, screen reader testing, training

---

**Nota**: Esta guía está diseñada para implementación incremental. No es necesario hacer todo de una vez. Prioriza según las necesidades de tu aplicación y usuarios.
