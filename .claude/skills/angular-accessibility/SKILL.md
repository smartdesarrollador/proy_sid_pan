---
name: angular-accessibility
description: >
  Sistema completo de accesibilidad (a11y) para Angular standalone con WCAG 2.1 AA/AAA compliance.
  Usar cuando se necesite implementar ARIA labels/roles/attributes, keyboard navigation (Tab/Enter/Escape/Arrow keys),
  focus management, focus trapping, skip navigation, screen reader announcements (aria-live), semantic HTML,
  form accessibility, modal/dialog accessibility, dropdown/menu accessibility, custom focus indicators,
  color contrast compliance, alternative text, accessible data tables, testing con axe-core, accessible routing,
  o cualquier funcionalidad relacionada con accesibilidad web. Incluye directivas reutilizables (FocusTrap, AriaAnnouncer),
  servicios (LiveAnnouncerService, FocusManagementService), componentes accesibles (Button, Modal, Dropdown, Form),
  keyboard utilities, screen reader utilities, color contrast checkers, y best practices WCAG 2.1 para proyectos Angular 19+ production-ready.
---

# Angular Accessibility (A11y) - Sistema Completo WCAG 2.1

Sistema enterprise-ready de accesibilidad para Angular standalone applications con compliance WCAG 2.1 AA/AAA, Tailwind CSS y best practices.

## Arquitectura del Sistema

```
accessibility-system/
├── core/
│   ├── services/
│   │   ├── live-announcer.service.ts      # Screen reader announcements
│   │   ├── focus-management.service.ts    # Focus state management
│   │   └── keyboard-navigation.service.ts # Keyboard event handling
│   ├── directives/
│   │   ├── focus-trap.directive.ts        # Focus trapping
│   │   ├── aria-announcer.directive.ts    # ARIA live announcements
│   │   ├── skip-link.directive.ts         # Skip navigation
│   │   └── auto-focus.directive.ts        # Auto-focus management
│   ├── utils/
│   │   ├── keyboard.util.ts               # Keyboard event helpers
│   │   ├── aria.util.ts                   # ARIA attribute helpers
│   │   ├── focus.util.ts                  # Focus management helpers
│   │   └── color-contrast.util.ts         # WCAG contrast checker
│   └── models/
│       └── accessibility.models.ts        # TypeScript interfaces
├── shared/
│   ├── components/
│   │   ├── accessible-button/             # WCAG-compliant button
│   │   ├── accessible-modal/              # Accessible dialog
│   │   ├── accessible-dropdown/           # Keyboard-navigable dropdown
│   │   ├── accessible-form/               # Accessible form fields
│   │   ├── accessible-table/              # Accessible data table
│   │   └── skip-to-content/               # Skip navigation link
│   └── styles/
│       └── accessibility.scss             # A11y utility classes
└── testing/
    └── axe-testing.util.ts                # Automated a11y testing
```

## Tabla de Contenidos

1. [Interfaces y Modelos](#1-interfaces-y-modelos-tipados)
2. [Servicios Core](#2-servicios-core)
3. [Directivas Reutilizables](#3-directivas-reutilizables)
4. [Utilidades](#4-utilidades)
5. [Componentes Accesibles](#5-componentes-accesibles)
6. [Estilos CSS Accessibility](#6-estilos-css-accessibility)
7. [Testing con Axe-core](#7-testing-con-axe-core)
8. [Routing Accesible](#8-routing-accesible)
9. [Checklist WCAG 2.1](#9-checklist-wcag-21)

---

## 1. Interfaces y Modelos Tipados

Crear `src/app/core/models/accessibility.models.ts`:

```typescript
// ARIA live region politeness levels
export type AriaLive = 'off' | 'polite' | 'assertive';

// Keyboard keys for navigation
export enum KeyCode {
  TAB = 'Tab',
  ENTER = 'Enter',
  ESCAPE = 'Escape',
  SPACE = ' ',
  ARROW_UP = 'ArrowUp',
  ARROW_DOWN = 'ArrowDown',
  ARROW_LEFT = 'ArrowLeft',
  ARROW_RIGHT = 'ArrowRight',
  HOME = 'Home',
  END = 'End',
  PAGE_UP = 'PageUp',
  PAGE_DOWN = 'PageDown',
}

// Focus trap configuration
export interface FocusTrapConfig {
  autoFocus?: boolean;
  returnFocusOnDestroy?: boolean;
  clickOutsideDeactivates?: boolean;
}

// Live announcer configuration
export interface LiveAnnouncerConfig {
  politeness?: AriaLive;
  duration?: number; // ms to clear announcement
}

// Color contrast result
export interface ContrastResult {
  ratio: number;
  AA: boolean;        // WCAG AA compliance (4.5:1)
  AAA: boolean;       // WCAG AAA compliance (7:1)
  AALarge: boolean;   // WCAG AA for large text (3:1)
  AAALarge: boolean;  // WCAG AAA for large text (4.5:1)
}

// Accessible component base interface
export interface AccessibleComponent {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: string;
}
```

---

## 2. Servicios Core

### 2.1 Live Announcer Service

Crear `src/app/core/services/live-announcer.service.ts`:

```typescript
import { Injectable, inject, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';

/**
 * Service para anunciar mensajes a screen readers usando aria-live regions
 * Sigue el patrón del CDK LiveAnnouncer
 */
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService {
  private liveElement?: HTMLElement;
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  /**
   * Anuncia un mensaje a screen readers
   * @param message - Mensaje a anunciar
   * @param politeness - Nivel de urgencia: 'polite' (default) o 'assertive'
   * @param duration - Duración en ms antes de limpiar (default: 10000)
   */
  announce(message: string, politeness: AriaLive = 'polite', duration = 10000): void {
    this.ensureLiveElement();

    if (this.liveElement) {
      // Clear previous announcement
      this.liveElement.textContent = '';

      // Set politeness level
      this.liveElement.setAttribute('aria-live', politeness);

      // Small delay to ensure screen reader picks up change
      setTimeout(() => {
        this.liveElement!.textContent = message;
      }, 100);

      // Clear announcement after duration
      if (duration > 0) {
        setTimeout(() => {
          this.clear();
        }, duration);
      }
    }
  }

  /**
   * Limpia el mensaje actual
   */
  clear(): void {
    if (this.liveElement) {
      this.liveElement.textContent = '';
    }
  }

  /**
   * Crea el elemento aria-live si no existe
   */
  private ensureLiveElement(): void {
    if (this.liveElement) {
      return;
    }

    this.liveElement = document.createElement('div');
    this.liveElement.setAttribute('aria-live', 'polite');
    this.liveElement.setAttribute('aria-atomic', 'true');
    this.liveElement.classList.add('cdk-visually-hidden', 'sr-only');

    document.body.appendChild(this.liveElement);
  }

  ngOnDestroy(): void {
    if (this.liveElement) {
      this.liveElement.remove();
    }
  }
}
```

**Uso del LiveAnnouncerService:**

```typescript
import { Component, inject } from '@angular/core';
import { LiveAnnouncerService } from '@/core/services/live-announcer.service';

@Component({
  selector: 'app-form',
  template: `
    <button (click)="saveForm()">Guardar</button>
  `
})
export class FormComponent {
  private announcer = inject(LiveAnnouncerService);

  saveForm(): void {
    // ... save logic
    this.announcer.announce('Formulario guardado exitosamente', 'polite');
  }
}
```

---

### 2.2 Focus Management Service

Crear `src/app/core/services/focus-management.service.ts`:

```typescript
import { Injectable } from '@angular/core';

/**
 * Service para gestionar el foco de manera programática
 * Útil para modales, routing, y navegación compleja
 */
@Injectable({ providedIn: 'root' })
export class FocusManagementService {
  private previouslyFocusedElement?: HTMLElement;
  private focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  /**
   * Guarda el elemento con foco actual para restaurarlo después
   */
  saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  /**
   * Restaura el foco al elemento previamente guardado
   */
  restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = undefined;
    }
  }

  /**
   * Enfoca el primer elemento focusable dentro de un contenedor
   */
  focusFirst(container: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * Enfoca el último elemento focusable dentro de un contenedor
   */
  focusLast(container: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }

  /**
   * Obtiene todos los elementos focusables dentro de un contenedor
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(this.focusableSelectors)
    ).filter(el => this.isVisible(el));
  }

  /**
   * Verifica si un elemento es visible (no oculto con display/visibility)
   */
  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           element.offsetParent !== null;
  }

  /**
   * Mueve el foco al siguiente elemento focusable
   */
  focusNext(container: HTMLElement, currentElement: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(currentElement);

    if (currentIndex < focusable.length - 1) {
      focusable[currentIndex + 1].focus();
    } else {
      focusable[0].focus(); // Wrap to first
    }
  }

  /**
   * Mueve el foco al elemento focusable anterior
   */
  focusPrevious(container: HTMLElement, currentElement: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    const currentIndex = focusable.indexOf(currentElement);

    if (currentIndex > 0) {
      focusable[currentIndex - 1].focus();
    } else {
      focusable[focusable.length - 1].focus(); // Wrap to last
    }
  }
}
```

---

### 2.3 Keyboard Navigation Service

Crear `src/app/core/services/keyboard-navigation.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { KeyCode } from '@/core/models/accessibility.models';

/**
 * Service para manejar navegación por teclado de manera centralizada
 */
@Injectable({ providedIn: 'root' })
export class KeyboardNavigationService {

  /**
   * Verifica si una tecla específica fue presionada
   */
  isKey(event: KeyboardEvent, key: KeyCode): boolean {
    return event.key === key;
  }

  /**
   * Verifica si es una tecla de navegación (arrows)
   */
  isNavigationKey(event: KeyboardEvent): boolean {
    return [
      KeyCode.ARROW_UP,
      KeyCode.ARROW_DOWN,
      KeyCode.ARROW_LEFT,
      KeyCode.ARROW_RIGHT,
      KeyCode.HOME,
      KeyCode.END
    ].includes(event.key as KeyCode);
  }

  /**
   * Verifica si es una tecla de acción (Enter/Space)
   */
  isActionKey(event: KeyboardEvent): boolean {
    return this.isKey(event, KeyCode.ENTER) ||
           this.isKey(event, KeyCode.SPACE);
  }

  /**
   * Previene el comportamiento default y detiene propagación
   */
  preventDefault(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handler genérico para cerrar con Escape
   */
  onEscapeClose(event: KeyboardEvent, callback: () => void): void {
    if (this.isKey(event, KeyCode.ESCAPE)) {
      this.preventDefault(event);
      callback();
    }
  }

  /**
   * Handler genérico para confirmar con Enter
   */
  onEnterConfirm(event: KeyboardEvent, callback: () => void): void {
    if (this.isKey(event, KeyCode.ENTER)) {
      this.preventDefault(event);
      callback();
    }
  }
}
```

---

## 3. Directivas Reutilizables

### 3.1 Focus Trap Directive

Crear `src/app/core/directives/focus-trap.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  input
} from '@angular/core';
import { FocusManagementService } from '@/core/services/focus-management.service';

/**
 * Directiva para atrapar el foco dentro de un contenedor
 * Útil para modales y dropdowns
 *
 * @example
 * <div appFocusTrap [autoFocus]="true" [returnFocus]="true">
 *   <!-- contenido modal -->
 * </div>
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly focusManager = inject(FocusManagementService);

  // Auto-focus primer elemento al activar
  autoFocus = input<boolean>(true);

  // Retornar foco al elemento previo al destruir
  returnFocus = input<boolean>(true);

  ngOnInit(): void {
    if (this.returnFocus()) {
      this.focusManager.saveFocus();
    }

    if (this.autoFocus()) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        this.focusManager.focusFirst(this.el.nativeElement);
      }, 100);
    }

    // Escuchar eventos de teclado para trap
    this.el.nativeElement.addEventListener('keydown', this.handleKeydown);
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('keydown', this.handleKeydown);

    if (this.returnFocus()) {
      this.focusManager.restoreFocus();
    }
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = this.focusManager.getFocusableElements(this.el.nativeElement);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    // Shift+Tab en primer elemento -> ir al último
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab en último elemento -> ir al primero
    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  };
}
```

---

### 3.2 ARIA Announcer Directive

Crear `src/app/core/directives/aria-announcer.directive.ts`:

```typescript
import {
  Directive,
  input,
  effect,
  inject
} from '@angular/core';
import { LiveAnnouncerService } from '@/core/services/live-announcer.service';
import { AriaLive } from '@/core/models/accessibility.models';

/**
 * Directiva para anunciar cambios a screen readers
 *
 * @example
 * <div [appAriaAnnounce]="message" [politeness]="'assertive'"></div>
 */
@Directive({
  selector: '[appAriaAnnounce]',
  standalone: true
})
export class AriaAnnouncerDirective {
  private readonly announcer = inject(LiveAnnouncerService);

  // Mensaje a anunciar (reactivo)
  message = input<string>('', { alias: 'appAriaAnnounce' });

  // Nivel de politeness
  politeness = input<AriaLive>('polite');

  constructor() {
    // Effect para anunciar cuando cambia el mensaje
    effect(() => {
      const msg = this.message();
      if (msg) {
        this.announcer.announce(msg, this.politeness());
      }
    });
  }
}
```

---

### 3.3 Skip Link Directive

Crear `src/app/core/directives/skip-link.directive.ts`:

```typescript
import {
  Directive,
  HostListener,
  input,
  inject,
  Renderer2,
  ElementRef
} from '@angular/core';

/**
 * Directiva para enlaces "Skip to content"
 * Enfoca el contenido principal al hacer clic
 *
 * @example
 * <a appSkipLink skipTo="main-content">Skip to main content</a>
 * <main id="main-content">...</main>
 */
@Directive({
  selector: '[appSkipLink]',
  standalone: true
})
export class SkipLinkDirective {
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);

  // ID del elemento target
  skipTo = input.required<string>();

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();

    const targetId = this.skipTo();
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      // Hacer el elemento focusable temporalmente si no lo es
      const originalTabIndex = targetElement.getAttribute('tabindex');

      if (originalTabIndex === null) {
        this.renderer.setAttribute(targetElement, 'tabindex', '-1');
      }

      // Enfocar el elemento
      targetElement.focus();

      // Scroll al elemento
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Restaurar tabindex original después del focus
      if (originalTabIndex === null) {
        // Pequeño delay para que el focus se aplique primero
        setTimeout(() => {
          this.renderer.removeAttribute(targetElement, 'tabindex');
        }, 100);
      }
    }
  }
}
```

---

### 3.4 Auto Focus Directive

Crear `src/app/core/directives/auto-focus.directive.ts`:

```typescript
import {
  Directive,
  ElementRef,
  OnInit,
  inject,
  input
} from '@angular/core';

/**
 * Directiva para auto-focus en elementos
 *
 * @example
 * <input appAutoFocus [delay]="200" />
 */
@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);

  // Delay en ms antes de enfocar
  delay = input<number>(0);

  ngOnInit(): void {
    const delayMs = this.delay();

    if (delayMs > 0) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, delayMs);
    } else {
      this.el.nativeElement.focus();
    }
  }
}
```

---

## 4. Utilidades

### 4.1 Keyboard Utilities

Crear `src/app/core/utils/keyboard.util.ts`:

```typescript
import { KeyCode } from '@/core/models/accessibility.models';

/**
 * Utilidades para manejo de eventos de teclado
 */
export class KeyboardUtil {

  /**
   * Crea un handler para navegación arrow key en listas
   */
  static createArrowNavigationHandler(
    items: HTMLElement[],
    orientation: 'vertical' | 'horizontal' = 'vertical'
  ): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      const currentIndex = items.findIndex(item => item === document.activeElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (orientation === 'vertical') {
        if (event.key === KeyCode.ARROW_DOWN) {
          nextIndex = (currentIndex + 1) % items.length;
          event.preventDefault();
        } else if (event.key === KeyCode.ARROW_UP) {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          event.preventDefault();
        }
      } else {
        if (event.key === KeyCode.ARROW_RIGHT) {
          nextIndex = (currentIndex + 1) % items.length;
          event.preventDefault();
        } else if (event.key === KeyCode.ARROW_LEFT) {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          event.preventDefault();
        }
      }

      if (event.key === KeyCode.HOME) {
        nextIndex = 0;
        event.preventDefault();
      } else if (event.key === KeyCode.END) {
        nextIndex = items.length - 1;
        event.preventDefault();
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex].focus();
      }
    };
  }

  /**
   * Verifica si el evento debe activar un elemento clickable
   */
  static isActivationKey(event: KeyboardEvent): boolean {
    return event.key === KeyCode.ENTER || event.key === KeyCode.SPACE;
  }

  /**
   * Combina múltiples keyboard handlers
   */
  static combineHandlers(
    ...handlers: Array<(event: KeyboardEvent) => void>
  ): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      handlers.forEach(handler => handler(event));
    };
  }
}
```

---

### 4.2 ARIA Utilities

Crear `src/app/core/utils/aria.util.ts`:

```typescript
/**
 * Utilidades para trabajar con atributos ARIA
 */
export class AriaUtil {

  /**
   * Genera un ID único para ARIA labelledby/describedby
   */
  static generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Establece aria-label o aria-labelledby según corresponda
   */
  static setLabel(
    element: HTMLElement,
    label?: string,
    labelledBy?: string
  ): void {
    if (labelledBy) {
      element.setAttribute('aria-labelledby', labelledBy);
      element.removeAttribute('aria-label');
    } else if (label) {
      element.setAttribute('aria-label', label);
      element.removeAttribute('aria-labelledby');
    }
  }

  /**
   * Establece aria-expanded para componentes expandibles
   */
  static setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', String(expanded));
  }

  /**
   * Establece aria-disabled
   */
  static setDisabled(element: HTMLElement, disabled: boolean): void {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true');
    } else {
      element.removeAttribute('aria-disabled');
    }
  }

  /**
   * Establece aria-invalid para validación de formularios
   */
  static setInvalid(element: HTMLElement, invalid: boolean): void {
    element.setAttribute('aria-invalid', String(invalid));
  }

  /**
   * Asocia un campo de error con aria-describedby
   */
  static associateError(
    fieldElement: HTMLElement,
    errorElement: HTMLElement
  ): void {
    const errorId = errorElement.id || AriaUtil.generateId('error');
    errorElement.id = errorId;

    const describedBy = fieldElement.getAttribute('aria-describedby');
    const ids = describedBy ? `${describedBy} ${errorId}` : errorId;

    fieldElement.setAttribute('aria-describedby', ids);
  }
}
```

---

### 4.3 Focus Utilities

Crear `src/app/core/utils/focus.util.ts`:

```typescript
/**
 * Utilidades para gestión de foco
 */
export class FocusUtil {

  /**
   * Verifica si un elemento puede recibir foco
   */
  static isFocusable(element: HTMLElement): boolean {
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const tabIndex = element.getAttribute('tabindex');

    return (
      !element.hasAttribute('disabled') &&
      (focusableTags.includes(element.tagName) ||
        (tabIndex !== null && tabIndex !== '-1') ||
        element.hasAttribute('contenteditable'))
    );
  }

  /**
   * Crea un "focus visible" indicator
   * Para mostrar outline solo cuando se navega con teclado
   */
  static setupFocusVisible(container: HTMLElement = document.body): void {
    let hadKeyboardEvent = false;

    const onKeydown = () => {
      hadKeyboardEvent = true;
    };

    const onMousedown = () => {
      hadKeyboardEvent = false;
    };

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;

      if (hadKeyboardEvent) {
        target.classList.add('focus-visible');
      } else {
        target.classList.remove('focus-visible');
      }
    };

    const onBlur = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      target.classList.remove('focus-visible');
    };

    container.addEventListener('keydown', onKeydown, true);
    container.addEventListener('mousedown', onMousedown, true);
    container.addEventListener('focus', onFocus, true);
    container.addEventListener('blur', onBlur, true);
  }

  /**
   * Gestiona el foco en un grupo roving tabindex
   * Útil para toolbars y menús
   */
  static createRovingTabIndex(items: HTMLElement[]): void {
    // Solo el primer elemento debe ser tabbable
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    // Mover tabindex al elemento enfocado
    items.forEach(item => {
      item.addEventListener('focus', () => {
        items.forEach(i => i.setAttribute('tabindex', '-1'));
        item.setAttribute('tabindex', '0');
      });
    });
  }
}
```

---

### 4.4 Color Contrast Utilities

Crear `src/app/core/utils/color-contrast.util.ts`:

```typescript
import { ContrastResult } from '@/core/models/accessibility.models';

/**
 * Utilidades para verificar contraste de color WCAG
 */
export class ColorContrastUtil {

  /**
   * Calcula el ratio de contraste entre dos colores
   * @param foreground - Color de texto (hex, rgb, o rgba)
   * @param background - Color de fondo (hex, rgb, o rgba)
   * @returns Ratio de contraste (1-21)
   */
  static getContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getRelativeLuminance(foreground);
    const bgLuminance = this.getRelativeLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Verifica compliance WCAG para un par de colores
   * @param foreground - Color de texto
   * @param background - Color de fondo
   * @param isLargeText - Si el texto es grande (>=18pt o >=14pt bold)
   * @returns Resultado de compliance WCAG
   */
  static checkWCAG(
    foreground: string,
    background: string,
    isLargeText = false
  ): ContrastResult {
    const ratio = this.getContrastRatio(foreground, background);

    return {
      ratio,
      AA: ratio >= 4.5,           // Normal text AA
      AAA: ratio >= 7,             // Normal text AAA
      AALarge: ratio >= 3,         // Large text AA
      AAALarge: ratio >= 4.5,      // Large text AAA
    };
  }

  /**
   * Calcula la luminancia relativa de un color
   */
  private static getRelativeLuminance(color: string): number {
    const rgb = this.parseColor(color);

    const [r, g, b] = rgb.map(val => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parsea un color en formato hex, rgb o rgba a [r, g, b]
   */
  private static parseColor(color: string): [number, number, number] {
    // Hex format
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return [r, g, b];
    }

    // RGB/RGBA format
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3])
      ];
    }

    // Default to black
    return [0, 0, 0];
  }

  /**
   * Verifica contraste de un elemento del DOM
   */
  static checkElementContrast(element: HTMLElement): ContrastResult | null {
    const styles = window.getComputedStyle(element);
    const foreground = styles.color;
    const background = styles.backgroundColor;

    if (!foreground || !background || background === 'rgba(0, 0, 0, 0)') {
      return null; // Necesita un fondo sólido
    }

    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);

    return this.checkWCAG(foreground, background, isLargeText);
  }
}
```

---

## 5. Componentes Accesibles

### 5.1 Accessible Button Component

Crear `src/app/shared/components/accessible-button/accessible-button.component.ts`:

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Botón accesible con ARIA support completo
 */
@Component({
  selector: 'app-accessible-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-pressed]="ariaPressed()"
      [class]="getClasses()"
      (click)="onClick.emit($event)"
      (keydown.enter)="onEnter($event)"
      (keydown.space)="onSpace($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* Focus visible - mostrar outline solo con teclado */
    button:focus {
      outline: none;
    }

    button:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Touch targets - mínimo 44x44px WCAG */
    button {
      min-height: 44px;
      min-width: 44px;
      padding: 0.5rem 1rem;
    }
  `]
})
export class AccessibleButtonComponent {
  // Inputs
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  ariaLabel = input<string>();
  ariaDescribedBy = input<string>();
  ariaPressed = input<boolean>();
  variant = input<'primary' | 'secondary' | 'danger'>('primary');

  // Outputs
  onClick = output<MouseEvent>();

  getClasses(): string {
    const baseClasses = 'font-medium rounded-md transition-colors focus-visible:outline-none';
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700'
    };

    return `${baseClasses} ${variantClasses[this.variant()]}`;
  }

  onEnter(event: KeyboardEvent): void {
    if (!this.disabled()) {
      event.preventDefault();
      (event.target as HTMLButtonElement).click();
    }
  }

  onSpace(event: KeyboardEvent): void {
    if (!this.disabled()) {
      event.preventDefault();
      (event.target as HTMLButtonElement).click();
    }
  }
}
```

---

### 5.2 Accessible Modal Component

Crear `src/app/shared/components/accessible-modal/accessible-modal.component.ts`:

```typescript
import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusTrapDirective } from '@/core/directives/focus-trap.directive';
import { LiveAnnouncerService } from '@/core/services/live-announcer.service';

/**
 * Modal Dialog accesible con ARIA y keyboard navigation
 */
@Component({
  selector: 'app-accessible-modal',
  standalone: true,
  imports: [CommonModule, FocusTrapDirective],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        (click)="onBackdropClick()"
        aria-hidden="true"
      ></div>

      <!-- Modal -->
      <div
        role="dialog"
        [attr.aria-modal]="true"
        [attr.aria-labelledby]="titleId()"
        [attr.aria-describedby]="descriptionId()"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        appFocusTrap
        [autoFocus]="true"
        [returnFocus]="true"
        (keydown.escape)="close()"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <!-- Title -->
          <h2 [id]="titleId()" class="text-xl font-semibold mb-4">
            {{ title() }}
          </h2>

          <!-- Description -->
          @if (description()) {
            <p [id]="descriptionId()" class="text-gray-600 mb-4">
              {{ description() }}
            </p>
          }

          <!-- Content -->
          <div class="mb-6">
            <ng-content></ng-content>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="close()"
              class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {{ cancelText() }}
            </button>

            @if (showConfirm()) {
              <button
                type="button"
                (click)="onConfirm.emit()"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {{ confirmText() }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Asegurar que focus-visible sea visible */
    button:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `]
})
export class AccessibleModalComponent {
  private announcer = inject(LiveAnnouncerService);

  // Inputs
  isOpen = input<boolean>(false);
  title = input.required<string>();
  description = input<string>();
  titleId = input<string>('modal-title');
  descriptionId = input<string>('modal-description');
  cancelText = input<string>('Cancelar');
  confirmText = input<string>('Confirmar');
  showConfirm = input<boolean>(true);
  closeOnBackdrop = input<boolean>(true);

  // Outputs
  onClose = output<void>();
  onConfirm = output<void>();

  constructor() {
    // Anunciar cuando el modal se abre
    effect(() => {
      if (this.isOpen()) {
        this.announcer.announce(
          `Modal abierto: ${this.title()}`,
          'polite'
        );
      }
    });
  }

  close(): void {
    this.onClose.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }
}
```

---

### 5.3 Accessible Dropdown Component

Crear `src/app/shared/components/accessible-dropdown/accessible-dropdown.component.ts`:

```typescript
import { Component, signal, input, output, ElementRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardUtil } from '@/core/utils/keyboard.util';
import { KeyCode } from '@/core/models/accessibility.models';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * Dropdown accesible con keyboard navigation completa
 */
@Component({
  selector: 'app-accessible-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Trigger Button -->
      <button
        type="button"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-labelledby]="labelId()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
        class="w-full px-4 py-2 bg-white border rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        {{ selectedLabel() || placeholder() }}
        <span class="ml-2" aria-hidden="true">▼</span>
      </button>

      <!-- Dropdown List -->
      @if (isOpen()) {
        <ul
          role="listbox"
          [attr.aria-labelledby]="labelId()"
          [attr.aria-activedescendant]="activeDescendant()"
          class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
          (keydown)="onListKeydown($event)"
        >
          @for (option of options(); track option.value) {
            <li
              [id]="'option-' + option.value"
              role="option"
              [attr.aria-selected]="selectedValue() === option.value"
              [attr.aria-disabled]="option.disabled"
              [class.bg-blue-100]="focusedIndex() === $index"
              [class.bg-blue-600]="selectedValue() === option.value"
              [class.text-white]="selectedValue() === option.value"
              [class.opacity-50]="option.disabled"
              [class.cursor-pointer]="!option.disabled"
              class="px-4 py-2"
              (click)="selectOption(option)"
              (mouseenter)="focusedIndex.set($index)"
            >
              {{ option.label }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    button:focus-visible, ul:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    li[aria-selected="true"] {
      font-weight: 600;
    }
  `]
})
export class AccessibleDropdownComponent {
  private el = inject(ElementRef);

  // State
  isOpen = signal(false);
  focusedIndex = signal(0);
  selectedValue = signal<string | null>(null);
  selectedLabel = signal<string>('');
  activeDescendant = signal<string>('');

  // Inputs
  options = input.required<DropdownOption[]>();
  placeholder = input<string>('Seleccionar...');
  labelId = input<string>('dropdown-label');

  // Outputs
  onSelect = output<DropdownOption>();

  toggle(): void {
    this.isOpen.update(v => !v);

    if (this.isOpen()) {
      this.focusedIndex.set(0);
      this.updateActiveDescendant();
    }
  }

  selectOption(option: DropdownOption): void {
    if (option.disabled) return;

    this.selectedValue.set(option.value);
    this.selectedLabel.set(option.label);
    this.isOpen.set(false);
    this.onSelect.emit(option);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === KeyCode.ARROW_DOWN || event.key === KeyCode.ARROW_UP) {
      event.preventDefault();
      this.isOpen.set(true);
    } else if (event.key === KeyCode.ESCAPE) {
      this.isOpen.set(false);
    }
  }

  onListKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    let newIndex = this.focusedIndex();

    switch (event.key) {
      case KeyCode.ARROW_DOWN:
        event.preventDefault();
        newIndex = (newIndex + 1) % opts.length;
        break;

      case KeyCode.ARROW_UP:
        event.preventDefault();
        newIndex = (newIndex - 1 + opts.length) % opts.length;
        break;

      case KeyCode.HOME:
        event.preventDefault();
        newIndex = 0;
        break;

      case KeyCode.END:
        event.preventDefault();
        newIndex = opts.length - 1;
        break;

      case KeyCode.ENTER:
      case KeyCode.SPACE:
        event.preventDefault();
        this.selectOption(opts[newIndex]);
        return;

      case KeyCode.ESCAPE:
        event.preventDefault();
        this.isOpen.set(false);
        return;

      default:
        return;
    }

    this.focusedIndex.set(newIndex);
    this.updateActiveDescendant();
  }

  private updateActiveDescendant(): void {
    const opts = this.options();
    const focused = opts[this.focusedIndex()];
    this.activeDescendant.set(`option-${focused?.value}`);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
```

---

### 5.4 Skip to Content Component

Crear `src/app/shared/components/skip-to-content/skip-to-content.component.ts`:

```typescript
import { Component } from '@angular/core';
import { SkipLinkDirective } from '@/core/directives/skip-link.directive';

/**
 * Componente "Skip to main content" para navegación por teclado
 * Debe colocarse al inicio del layout
 */
@Component({
  selector: 'app-skip-to-content',
  standalone: true,
  imports: [SkipLinkDirective],
  template: `
    <a
      href="#main-content"
      appSkipLink
      skipTo="main-content"
      class="skip-link"
    >
      Skip to main content
    </a>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      top: -100px;
      left: 0;
      z-index: 9999;
      padding: 0.5rem 1rem;
      background: #000;
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 0;
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `]
})
export class SkipToContentComponent {}
```

---

### 5.5 Accessible Form Field Component

Crear `src/app/shared/components/accessible-form-field/accessible-form-field.component.ts`:

```typescript
import { Component, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

/**
 * Campo de formulario accesible con labels, errores y ARIA
 */
@Component({
  selector: 'app-accessible-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="form-field">
      <!-- Label -->
      <label
        [for]="fieldId()"
        [class.required]="required()"
        class="block text-sm font-medium text-gray-700 mb-1"
      >
        {{ label() }}
        @if (required()) {
          <span aria-label="required" class="text-red-600">*</span>
        }
      </label>

      <!-- Input -->
      <input
        [id]="fieldId()"
        [type]="type()"
        [formControl]="control()"
        [required]="required()"
        [attr.aria-required]="required()"
        [attr.aria-invalid]="isInvalid()"
        [attr.aria-describedby]="getDescribedBy()"
        [placeholder]="placeholder()"
        class="w-full px-3 py-2 border rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
        [class.border-red-500]="isInvalid()"
      />

      <!-- Helper Text -->
      @if (helperText()) {
        <p
          [id]="helperId()"
          class="text-sm text-gray-500 mt-1"
        >
          {{ helperText() }}
        </p>
      }

      <!-- Error Message -->
      @if (isInvalid() && errorMessage()) {
        <p
          [id]="errorId()"
          role="alert"
          aria-live="polite"
          class="text-sm text-red-600 mt-1"
        >
          {{ errorMessage() }}
        </p>
      }
    </div>
  `,
  styles: [`
    .required::after {
      content: ' *';
      color: #dc2626;
    }

    input:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    input[aria-invalid="true"] {
      border-color: #dc2626;
    }
  `]
})
export class AccessibleFormFieldComponent {
  // Inputs
  label = input.required<string>();
  control = input.required<FormControl>();
  type = input<string>('text');
  required = input<boolean>(false);
  placeholder = input<string>('');
  helperText = input<string>('');
  fieldId = input<string>(`field-${Math.random().toString(36).substr(2, 9)}`);

  // Computed IDs
  helperId = signal('');
  errorId = signal('');

  constructor() {
    effect(() => {
      this.helperId.set(`${this.fieldId()}-helper`);
      this.errorId.set(`${this.fieldId()}-error`);
    });
  }

  isInvalid(): boolean {
    const ctrl = this.control();
    return !!(ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  errorMessage(): string {
    const ctrl = this.control();
    if (!ctrl.errors) return '';

    if (ctrl.errors['required']) return `${this.label()} es requerido`;
    if (ctrl.errors['email']) return 'Email inválido';
    if (ctrl.errors['minlength']) {
      return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    }
    if (ctrl.errors['maxlength']) {
      return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  getDescribedBy(): string {
    const ids: string[] = [];

    if (this.helperText()) {
      ids.push(this.helperId());
    }

    if (this.isInvalid()) {
      ids.push(this.errorId());
    }

    return ids.join(' ') || undefined!;
  }
}
```

---

### 5.6 Accessible Data Table Component

Crear `src/app/shared/components/accessible-table/accessible-table.component.ts`:

```typescript
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
}

/**
 * Tabla de datos accesible con headers y scope apropiados
 */
@Component({
  selector: 'app-accessible-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table
        role="table"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        class="min-w-full divide-y divide-gray-200"
      >
        <!-- Caption (screen reader) -->
        @if (caption()) {
          <caption class="sr-only">{{ caption() }}</caption>
        }

        <!-- Header -->
        <thead class="bg-gray-50">
          <tr role="row">
            @for (col of columns(); track col.key) {
              <th
                scope="col"
                role="columnheader"
                [attr.aria-sort]="getAriaSort(col)"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {{ col.header }}

                @if (col.sortable) {
                  <button
                    type="button"
                    [attr.aria-label]="'Sort by ' + col.header"
                    class="ml-2 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    ↕
                  </button>
                }
              </th>
            }
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          @for (row of data(); track $index) {
            <tr role="row">
              @for (col of columns(); track col.key) {
                <td
                  role="cell"
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {{ row[col.key] }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    /* Screen reader only class */
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

    button:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `]
})
export class AccessibleTableComponent {
  // Inputs
  columns = input.required<TableColumn[]>();
  data = input.required<any[]>();
  caption = input<string>('');
  ariaLabel = input<string>('');
  ariaDescribedBy = input<string>('');

  getAriaSort(col: TableColumn): string | null {
    // Implementar lógica de sort si es necesario
    return col.sortable ? 'none' : null;
  }
}
```

---

## 6. Estilos CSS Accessibility

Crear `src/styles/accessibility.scss`:

```scss
/* ============================================
   ACCESSIBILITY UTILITIES
   ============================================ */

/* Screen Reader Only - oculta visualmente pero accesible */
.sr-only,
.visually-hidden {
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

/* Mostrar en foco (útil para skip links) */
.sr-only-focusable:focus,
.visually-hidden-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* ============================================
   FOCUS INDICATORS
   ============================================ */

/* Focus visible - solo mostrar outline con teclado */
*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Custom focus para diferentes variantes */
.focus-ring-primary:focus-visible {
  outline-color: #3b82f6;
}

.focus-ring-danger:focus-visible {
  outline-color: #dc2626;
}

.focus-ring-success:focus-visible {
  outline-color: #16a34a;
}

/* ============================================
   TOUCH TARGETS (WCAG 2.5.5)
   ============================================ */

/* Mínimo 44x44px para touch targets */
button,
a,
input[type="checkbox"],
input[type="radio"],
[role="button"],
[role="link"] {
  min-height: 44px;
  min-width: 44px;
}

/* Para elementos inline más pequeños, usar padding */
.touch-target {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-height: 44px;
    min-width: 44px;
  }
}

/* ============================================
   HIGH CONTRAST MODE SUPPORT
   ============================================ */

@media (prefers-contrast: high) {
  * {
    border-color: currentColor !important;
  }

  button,
  a,
  input,
  select,
  textarea {
    border: 2px solid currentColor !important;
  }
}

/* ============================================
   REDUCED MOTION (WCAG 2.3.3)
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ============================================
   COLOR CONTRAST HELPERS
   ============================================ */

/* WCAG AA compliant color pairs */
.text-contrast-light {
  color: #ffffff;
  background-color: #000000; /* 21:1 */
}

.text-contrast-dark {
  color: #000000;
  background-color: #ffffff; /* 21:1 */
}

/* ============================================
   ARIA LIVE REGIONS
   ============================================ */

[aria-live] {
  position: relative;
}

/* Destacar visualmente regiones live en dev mode */
[aria-live]:not([aria-live="off"]) {
  /* Solo en desarrollo, eliminar en producción */
  /* border: 1px dashed orange; */
}

/* ============================================
   DISABLED STATES
   ============================================ */

[disabled],
[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

/* ============================================
   SKIP LINKS
   ============================================ */

.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 9999;
  padding: 0.75rem 1.5rem;
  background: #000;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  transition: top 0.2s ease-in-out;

  &:focus {
    top: 0;
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
}

/* ============================================
   TAILWIND UTILITIES EXTENSION
   ============================================ */

@layer utilities {
  /* Utilidades de accesibilidad custom */
  .focus-ring {
    @apply focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2;
  }

  .touch-target-min {
    @apply min-h-[44px] min-w-[44px];
  }
}
```

---

## 7. Testing con Axe-core

### 7.1 Setup Axe-core

Instalar dependencia:

```bash
npm install --save-dev axe-core @axe-core/playwright
```

### 7.2 Axe Testing Utility

Crear `src/app/testing/axe-testing.util.ts`:

```typescript
import { ComponentFixture } from '@angular/core/testing';
import * as axe from 'axe-core';

/**
 * Utilidad para testing de accesibilidad con axe-core
 */
export class AxeTestingUtil {

  /**
   * Ejecuta axe-core en un componente de Angular
   * @param fixture - ComponentFixture del componente a testear
   * @param config - Configuración de axe (opcional)
   * @returns Resultados de axe
   */
  static async runAxe(
    fixture: ComponentFixture<any>,
    config?: axe.RunOptions
  ): Promise<axe.AxeResults> {
    const element = fixture.nativeElement;

    const results = await axe.run(element, config || {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa']
      }
    });

    return results;
  }

  /**
   * Verifica que no haya violaciones de accesibilidad
   * @param fixture - ComponentFixture del componente
   */
  static async expectNoViolations(
    fixture: ComponentFixture<any>
  ): Promise<void> {
    const results = await this.runAxe(fixture);

    expect(results.violations).toEqual([]);

    if (results.violations.length > 0) {
      console.error('Accessibility violations:', results.violations);
    }
  }

  /**
   * Verifica reglas específicas
   */
  static async checkRule(
    fixture: ComponentFixture<any>,
    ruleId: string
  ): Promise<axe.Result[]> {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: {
        type: 'rule',
        values: [ruleId]
      }
    });

    return results.violations;
  }

  /**
   * Genera reporte legible de violaciones
   */
  static formatViolations(results: axe.AxeResults): string {
    if (results.violations.length === 0) {
      return 'No accessibility violations found ✓';
    }

    let report = `Found ${results.violations.length} accessibility violations:\n\n`;

    results.violations.forEach((violation, index) => {
      report += `${index + 1}. ${violation.help}\n`;
      report += `   Impact: ${violation.impact}\n`;
      report += `   Description: ${violation.description}\n`;
      report += `   Affected elements: ${violation.nodes.length}\n`;

      violation.nodes.forEach((node, nodeIndex) => {
        report += `     ${nodeIndex + 1}. ${node.html}\n`;
        report += `        ${node.failureSummary}\n`;
      });

      report += `   More info: ${violation.helpUrl}\n\n`;
    });

    return report;
  }
}
```

### 7.3 Ejemplo de Test

Crear `src/app/shared/components/accessible-button/accessible-button.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccessibleButtonComponent } from './accessible-button.component';
import { AxeTestingUtil } from '@/testing/axe-testing.util';

describe('AccessibleButtonComponent - Accessibility', () => {
  let component: AccessibleButtonComponent;
  let fixture: ComponentFixture<AccessibleButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessibleButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AccessibleButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should pass axe accessibility tests', async () => {
    await AxeTestingUtil.expectNoViolations(fixture);
  });

  it('should have proper ARIA attributes', () => {
    const button = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('aria-label') || button.textContent?.trim()).toBeTruthy();
  });

  it('should have minimum touch target size', () => {
    const button = fixture.nativeElement.querySelector('button');
    const rect = button.getBoundingClientRect();

    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  });

  it('should support keyboard navigation', () => {
    const button = fixture.nativeElement.querySelector('button');
    const clickSpy = jest.fn();

    component.onClick.subscribe(clickSpy);

    // Enter key
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockClear();

    // Space key
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should be disabled correctly', async () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });
});
```

---

## 8. Routing Accesible

### 8.1 Focus on Route Change

Crear `src/app/core/services/accessible-routing.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LiveAnnouncerService } from './live-announcer.service';

/**
 * Service para manejar accesibilidad en routing
 */
@Injectable({ providedIn: 'root' })
export class AccessibleRoutingService {
  private router = inject(Router);
  private announcer = inject(LiveAnnouncerService);

  /**
   * Inicializa el servicio para anunciar cambios de ruta
   */
  init(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleRouteChange(event);
      });
  }

  /**
   * Maneja el cambio de ruta
   */
  private handleRouteChange(event: NavigationEnd): void {
    // 1. Enfocar el contenido principal
    this.focusMainContent();

    // 2. Anunciar el cambio de página
    this.announceRouteChange(event.url);

    // 3. Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Enfoca el elemento main al cambiar de ruta
   */
  private focusMainContent(): void {
    // Buscar elemento <main> o [role="main"]
    const mainElement = document.querySelector<HTMLElement>(
      'main, [role="main"]'
    );

    if (mainElement) {
      // Hacer el elemento focusable temporalmente
      const originalTabIndex = mainElement.getAttribute('tabindex');
      mainElement.setAttribute('tabindex', '-1');
      mainElement.focus();

      // Restaurar tabindex después del focus
      mainElement.addEventListener('blur', () => {
        if (originalTabIndex === null) {
          mainElement.removeAttribute('tabindex');
        } else {
          mainElement.setAttribute('tabindex', originalTabIndex);
        }
      }, { once: true });
    }
  }

  /**
   * Anuncia el cambio de página a screen readers
   */
  private announceRouteChange(url: string): void {
    // Extraer título de la página o crear uno basado en la ruta
    const title = this.getPageTitle(url);
    this.announcer.announce(`Navegado a: ${title}`, 'polite');
  }

  /**
   * Obtiene el título de la página actual
   */
  private getPageTitle(url: string): string {
    // Usar document.title si está disponible
    if (document.title) {
      return document.title;
    }

    // Fallback: generar desde URL
    const segments = url.split('/').filter(s => s);
    if (segments.length === 0) {
      return 'Página principal';
    }

    const lastSegment = segments[segments.length - 1];
    return lastSegment.replace(/-/g, ' ');
  }
}
```

### 8.2 Configurar en app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { AccessibleRoutingService } from '@/core/services/accessible-routing.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    // Inicializar routing accesible
    {
      provide: 'INIT_ACCESSIBLE_ROUTING',
      useFactory: (service: AccessibleRoutingService) => {
        service.init();
        return () => {};
      },
      deps: [AccessibleRoutingService],
      multi: true
    }
  ]
};
```

---

## 9. Checklist WCAG 2.1

### 9.1 Perceivable (Perceptible)

**1.1 Text Alternatives**
- [ ] Todas las imágenes tienen `alt` text descriptivo
- [ ] Imágenes decorativas usan `alt=""` o `aria-hidden="true"`
- [ ] Iconos tienen `aria-label` o texto visible
- [ ] Videos tienen subtítulos y transcripciones

**1.2 Time-based Media**
- [ ] Audio tiene transcripción
- [ ] Videos tienen subtítulos sincronizados

**1.3 Adaptable**
- [ ] HTML semántico (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`)
- [ ] Orden lógico de heading (`<h1>`, `<h2>`, `<h3>`)
- [ ] Formularios usan `<label>` correctamente
- [ ] Tablas usan `<th scope="col|row">`
- [ ] Lists usan `<ul>`, `<ol>`, `<li>`

**1.4 Distinguishable**
- [ ] Contraste de color 4.5:1 para texto normal (WCAG AA)
- [ ] Contraste de color 7:1 para texto normal (WCAG AAA)
- [ ] Contraste de color 3:1 para texto grande (WCAG AA)
- [ ] El color no es la única forma de transmitir información
- [ ] Texto puede redimensionarse hasta 200% sin pérdida de funcionalidad
- [ ] Imágenes de texto evitadas (usar CSS)

### 9.2 Operable

**2.1 Keyboard Accessible**
- [ ] Toda la funcionalidad disponible por teclado
- [ ] No hay keyboard traps
- [ ] Skip links implementados
- [ ] Focus visible en todos los elementos interactivos
- [ ] Orden de tabulación lógico

**2.2 Enough Time**
- [ ] Timeouts pueden extenderse o deshabilitarse
- [ ] Contenido que se mueve puede pausarse

**2.3 Seizures and Physical Reactions**
- [ ] Sin elementos que parpadeen más de 3 veces por segundo
- [ ] Animaciones pueden deshabilitarse (`prefers-reduced-motion`)

**2.4 Navigable**
- [ ] Múltiples formas de navegar (menú, búsqueda, mapa de sitio)
- [ ] `<title>` descriptivo en cada página
- [ ] Orden de foco lógico
- [ ] Texto de enlaces descriptivo
- [ ] Breadcrumbs implementados
- [ ] Headings descriptivos

**2.5 Input Modalities**
- [ ] Touch targets mínimo 44x44px
- [ ] Funciones activables con un solo puntero
- [ ] Labels en controles de formulario

### 9.3 Understandable (Comprensible)

**3.1 Readable**
- [ ] Atributo `lang` en `<html>`
- [ ] Cambios de idioma marcados con `lang`

**3.2 Predictable**
- [ ] Navegación consistente en todas las páginas
- [ ] Focus no causa cambios de contexto inesperados
- [ ] Componentes identificados consistentemente

**3.3 Input Assistance**
- [ ] Labels descriptivos en formularios
- [ ] Errores de validación claros y específicos
- [ ] Sugerencias para corregir errores
- [ ] Confirmación en acciones importantes
- [ ] `autocomplete` en campos comunes

### 9.4 Robust (Robusto)

**4.1 Compatible**
- [ ] HTML válido (sin errores de sintaxis)
- [ ] IDs únicos
- [ ] ARIA usado correctamente
- [ ] Elementos ARIA tienen roles válidos
- [ ] `aria-*` attributes válidos
- [ ] No usar ARIA cuando HTML nativo es suficiente

---

## 10. Patrones Comunes de Uso

### 10.1 Accessible Form con Validación

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LiveAnnouncerService } from '@/core/services/live-announcer.service';

@Component({
  selector: 'app-registration-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-accessible-form-field
        label="Email"
        [control]="form.controls.email"
        type="email"
        [required]="true"
        helperText="Usaremos este email para contactarte"
      />

      <app-accessible-form-field
        label="Contraseña"
        [control]="form.controls.password"
        type="password"
        [required]="true"
        helperText="Mínimo 8 caracteres"
      />

      <button type="submit" [disabled]="form.invalid">
        Registrarse
      </button>
    </form>
  `
})
export class RegistrationFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private announcer: LiveAnnouncerService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Submit logic
      this.announcer.announce('Formulario enviado exitosamente', 'polite');
    } else {
      this.announcer.announce('Por favor corrige los errores en el formulario', 'assertive');
    }
  }
}
```

### 10.2 Accessible Navigation Menu

```typescript
@Component({
  selector: 'app-nav-menu',
  template: `
    <nav aria-label="Main navigation">
      <ul role="menubar">
        <li role="none">
          <a
            role="menuitem"
            routerLink="/home"
            routerLinkActive="active"
            [attr.aria-current]="isActive('/home') ? 'page' : null"
          >
            Home
          </a>
        </li>
        <li role="none">
          <a
            role="menuitem"
            routerLink="/about"
            routerLinkActive="active"
            [attr.aria-current]="isActive('/about') ? 'page' : null"
          >
            About
          </a>
        </li>
      </ul>
    </nav>
  `
})
export class NavMenuComponent {
  isActive(route: string): boolean {
    return window.location.pathname === route;
  }
}
```

### 10.3 Accessible Loading State

```typescript
@Component({
  selector: 'app-data-loader',
  template: `
    @if (loading()) {
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        class="flex items-center gap-2"
      >
        <span class="spinner" aria-hidden="true"></span>
        <span>Cargando datos...</span>
      </div>
    } @else {
      <div
        role="region"
        aria-live="polite"
        [appAriaAnnounce]="'Datos cargados: ' + data().length + ' elementos'"
      >
        <!-- Contenido cargado -->
      </div>
    }
  `
})
export class DataLoaderComponent {
  loading = signal(false);
  data = signal<any[]>([]);
}
```

---

## 11. Best Practices Summary

1. **Siempre usar HTML semántico** antes que ARIA
2. **Testear con screen readers** (NVDA, JAWS, VoiceOver)
3. **Navegar solo con teclado** en toda la aplicación
4. **Verificar contraste de colores** con herramientas como WebAIM
5. **Ejecutar axe-core** en tests automáticos
6. **Focus management** en componentes dinámicos (modals, tabs)
7. **Anunciar cambios** a screen readers con aria-live
8. **Touch targets mínimo 44x44px** para móviles
9. **Soportar `prefers-reduced-motion`** para animaciones
10. **Documentar ARIA patterns** en componentes complejos

---

## 12. Recursos Adicionales

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Deque axe**: https://www.deque.com/axe/
- **Angular CDK A11y**: https://material.angular.io/cdk/a11y/overview

---

**Nota**: Este skill proporciona código production-ready para aplicaciones Angular 19+ standalone con compliance WCAG 2.1 AA/AAA. Todos los componentes están diseñados para ser reutilizables y extensibles. Ajustar según las necesidades específicas del proyecto.
