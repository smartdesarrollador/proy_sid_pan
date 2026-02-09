# Testing Strategies - Accessibility Testing Completo

Guía completa para testing de accesibilidad en Angular applications.

## Tabla de Contenidos

1. [Niveles de Testing](#niveles-de-testing)
2. [Automated Testing con Axe](#automated-testing-con-axe)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [Screen Reader Testing](#screen-reader-testing)
5. [Keyboard Navigation Testing](#keyboard-navigation-testing)
6. [Color Contrast Testing](#color-contrast-testing)
7. [CI/CD Integration](#cicd-integration)

---

## Niveles de Testing

### Pirámide de Testing A11y

```
        Manual Testing (10%)
       /                    \
      Screen Reader Testing (20%)
     /                            \
    Keyboard & Focus Testing (30%)
   /                                \
  Automated Testing - Axe (40%)
```

---

## Automated Testing con Axe

### Setup Jest + Axe

**Instalar dependencias:**

```bash
npm install --save-dev jest-axe @axe-core/playwright axe-core
```

**Configurar jest.config.js:**

```javascript
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },
};
```

**Setup jest-axe en setup-jest.ts:**

```typescript
import 'jest-preset-angular/setup-jest';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Custom matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}
```

### Test Suite Template

**Crear `accessibility-test.base.ts`:**

```typescript
import { ComponentFixture } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

export class AccessibilityTestBase {
  /**
   * Run complete axe audit on component
   */
  static async runAxeAudit<T>(
    fixture: ComponentFixture<T>,
    options?: any
  ): Promise<void> {
    const results = await axe(fixture.nativeElement, options);
    expect(results).toHaveNoViolations();
  }

  /**
   * Test WCAG 2.1 Level A
   */
  static async testWCAG_A<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.runAxeAudit(fixture, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag21a']
      }
    });
  }

  /**
   * Test WCAG 2.1 Level AA (recommended)
   */
  static async testWCAG_AA<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.runAxeAudit(fixture, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });
  }

  /**
   * Test WCAG 2.1 Level AAA
   */
  static async testWCAG_AAA<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.runAxeAudit(fixture, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa']
      }
    });
  }

  /**
   * Test specific rule
   */
  static async testRule<T>(
    fixture: ComponentFixture<T>,
    ruleId: string
  ): Promise<void> {
    await this.runAxeAudit(fixture, {
      runOnly: {
        type: 'rule',
        values: [ruleId]
      }
    });
  }

  /**
   * Test color contrast
   */
  static async testColorContrast<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.testRule(fixture, 'color-contrast');
  }

  /**
   * Test keyboard accessibility
   */
  static async testKeyboard<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.runAxeAudit(fixture, {
      runOnly: {
        type: 'tag',
        values: ['keyboard']
      }
    });
  }

  /**
   * Test form labels
   */
  static async testFormLabels<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.testRule(fixture, 'label');
  }

  /**
   * Test image alt text
   */
  static async testImageAlt<T>(fixture: ComponentFixture<T>): Promise<void> {
    await this.testRule(fixture, 'image-alt');
  }
}
```

### Component Test Example

**button.component.spec.ts:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { AccessibilityTestBase } from '@/testing/accessibility-test.base';

describe('ButtonComponent - Accessibility', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Automated Accessibility Tests', () => {
    it('should pass WCAG 2.1 Level AA', async () => {
      await AccessibilityTestBase.testWCAG_AA(fixture);
    });

    it('should have sufficient color contrast', async () => {
      await AccessibilityTestBase.testColorContrast(fixture);
    });

    it('should be keyboard accessible', async () => {
      await AccessibilityTestBase.testKeyboard(fixture);
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper role', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('type')).toBe('button');
    });

    it('should have aria-label when provided', () => {
      fixture.componentRef.setInput('ariaLabel', 'Save document');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.getAttribute('aria-label')).toBe('Save document');
    });

    it('should set aria-disabled when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should trigger click on Enter key', () => {
      const button = fixture.nativeElement.querySelector('button');
      const clickSpy = jest.fn();
      component.onClick.subscribe(clickSpy);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(event);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should trigger click on Space key', () => {
      const button = fixture.nativeElement.querySelector('button');
      const clickSpy = jest.fn();
      component.onClick.subscribe(clickSpy);

      const event = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(event);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Touch Targets', () => {
    it('should meet minimum size of 44x44px', () => {
      const button = fixture.nativeElement.querySelector('button');
      const rect = button.getBoundingClientRect();

      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });
});
```

---

## Manual Testing Checklist

### Keyboard Navigation

**Test con Tab:**

```
✓ Tab navega a todos los elementos interactivos
✓ Tab sigue un orden lógico (top-to-bottom, left-to-right)
✓ Shift+Tab navega en reversa
✓ Focus visible en todos los elementos
✓ No hay keyboard traps
✓ Skip links funcionan correctamente
```

**Test con Enter/Space:**

```
✓ Enter activa links y botones
✓ Space activa botones y checkboxes
✓ Enter envía formularios
✓ Space hace scroll en páginas
```

**Test con Arrow Keys:**

```
✓ Arrow keys navegan en dropdowns
✓ Arrow keys navegan en tabs
✓ Arrow keys navegan en menus
✓ Arrow keys mueven sliders
```

**Test con Escape:**

```
✓ Escape cierra modals
✓ Escape cierra dropdowns
✓ Escape cancela operaciones
```

### Focus Management

**Script de testing manual:**

```javascript
// Ejecutar en DevTools Console

// 1. Ver elemento con foco actual
console.log('Focused element:', document.activeElement);

// 2. Obtener todos los elementos focusables
const focusableElements = document.querySelectorAll(
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
);
console.log('Focusable elements:', focusableElements.length);

// 3. Simular Tab navigation
let currentIndex = 0;
function simulateTab() {
  focusableElements[currentIndex].focus();
  console.log(`Focused element ${currentIndex}:`, focusableElements[currentIndex]);
  currentIndex = (currentIndex + 1) % focusableElements.length;
}

// Llamar simulateTab() repetidamente para testear orden

// 4. Verificar focus visible
const style = window.getComputedStyle(document.activeElement);
console.log('Focus outline:', style.outline);
console.log('Focus outline-offset:', style.outlineOffset);
```

---

## Screen Reader Testing

### Setup Screen Readers

**Windows:**
- NVDA (gratis): https://www.nvaccess.org/
- JAWS (pago): https://www.freedomscientific.com/

**Mac:**
- VoiceOver (incluido): Cmd+F5

**Linux:**
- Orca (gratis): Pre-instalado en la mayoría de distros

**Mobile:**
- iOS VoiceOver: Settings > Accessibility > VoiceOver
- Android TalkBack: Settings > Accessibility > TalkBack

### NVDA Keyboard Shortcuts

```
NVDA + Ctrl:       Stop speech
NVDA + Down Arrow: Read next item
NVDA + Up Arrow:   Read previous item
NVDA + Space:      Forms mode toggle
Insert + F7:       Elements list
Insert + T:        Read title
Insert + H:        Headings list
```

### Testing Checklist con Screen Reader

**Estructura de página:**

```
✓ Page title leído correctamente
✓ Landmarks anunciados (header, nav, main, footer)
✓ Headings en orden lógico (h1, h2, h3)
✓ Links descriptivos
✓ List items anunciados correctamente
```

**Formularios:**

```
✓ Labels asociados a inputs
✓ Errores anunciados
✓ Required fields indicados
✓ Placeholder no es la única indicación
✓ Fieldset/legend para grupos de campos
```

**Componentes interactivos:**

```
✓ Buttons anunciados con su label
✓ Modals anunciados al abrir
✓ Loading states anunciados
✓ Notificaciones/alerts anunciados
✓ Tabs anunciados con estado selected
✓ Dropdowns anunciados con estado expanded
```

**Testing Script:**

```
1. Abrir página
2. Escuchar título de página
3. Navegar por headings (H key en NVDA)
4. Navegar por landmarks (D key en NVDA)
5. Tabular por todos los elementos
6. Activar cada elemento interactivo
7. Completar formulario
8. Verificar mensajes de error
9. Abrir modal/dropdown
10. Cerrar modal/dropdown
```

---

## Keyboard Navigation Testing

### Automated Keyboard Test

**keyboard-navigation.spec.ts:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('Keyboard Navigation', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should have logical tab order', () => {
    const focusableElements = fixture.nativeElement.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const tabIndexes = Array.from(focusableElements).map(
      (el: any) => el.tabIndex
    );

    // All elements should have tabindex 0 or positive
    expect(tabIndexes.every(idx => idx >= 0)).toBe(true);
  });

  it('should not have keyboard traps', () => {
    const focusableElements = Array.from(
      fixture.nativeElement.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    // Simulate tabbing through all elements
    focusableElements.forEach((element, index) => {
      element.focus();
      expect(document.activeElement).toBe(element);

      // Tab to next
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      });
      element.dispatchEvent(event);
    });

    // Should return to first element (or document.body)
    const firstElement = focusableElements[0];
    expect([firstElement, document.body]).toContain(document.activeElement);
  });

  it('should have visible focus indicators', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    buttons.forEach((button: HTMLElement) => {
      button.focus();

      const styles = window.getComputedStyle(button);
      const hasOutline = styles.outline !== 'none' &&
                        styles.outline !== '' &&
                        styles.outline !== '0px';

      const hasBoxShadow = styles.boxShadow !== 'none';

      expect(hasOutline || hasBoxShadow).toBe(true);
    });
  });
});
```

---

## Color Contrast Testing

### Automated Contrast Test

**color-contrast.spec.ts:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorContrastUtil } from '@/core/utils/color-contrast.util';
import { AppComponent } from './app.component';

describe('Color Contrast - WCAG', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should meet WCAG AA for all text', () => {
    const textElements = fixture.nativeElement.querySelectorAll(
      'p, span, a, button, label, h1, h2, h3, h4, h5, h6'
    );

    textElements.forEach((element: HTMLElement) => {
      const result = ColorContrastUtil.checkElementContrast(element);

      if (result) {
        expect(result.AA).toBe(true);
      }
    });
  });

  it('should have 4.5:1 ratio for primary button', () => {
    const button = fixture.nativeElement.querySelector('.btn-primary');
    const styles = window.getComputedStyle(button);

    const result = ColorContrastUtil.getContrastRatio(
      styles.color,
      styles.backgroundColor
    );

    expect(result).toBeGreaterThanOrEqual(4.5);
  });
});
```

### Manual Contrast Testing Tools

**Browser DevTools:**

1. Chrome DevTools > Elements > Styles
2. Click color swatch next to color value
3. Ver "Contrast ratio" section
4. ✓ = WCAG AA pass
5. ✓✓ = WCAG AAA pass

**Online Tools:**

- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Contrast Ratio: https://contrast-ratio.com/
- ColorSafe: http://colorsafe.co/

---

## CI/CD Integration

### GitHub Actions Workflow

**.github/workflows/accessibility.yml:**

```yaml
name: Accessibility Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  a11y-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Run axe-core audit
        run: npm run test:axe

      - name: Upload axe results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: axe-results
          path: axe-results.json

      - name: Comment PR with results
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('axe-results.json'));

            let comment = '## ⚠️ Accessibility Violations Found\n\n';
            comment += `Found ${results.violations.length} violations:\n\n`;

            results.violations.forEach((violation, i) => {
              comment += `### ${i + 1}. ${violation.help}\n`;
              comment += `- **Impact**: ${violation.impact}\n`;
              comment += `- **Affected elements**: ${violation.nodes.length}\n`;
              comment += `- [More info](${violation.helpUrl})\n\n`;
            });

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:a11y": "jest --testPathPattern=a11y",
    "test:axe": "jest --testPathPattern=axe",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Playwright E2E Accessibility Tests

**e2e/accessibility.spec.ts:**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:4200');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('form should be keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:4200/form');

    // Tab through all form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="name"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('modal should trap focus', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Open modal
    await page.click('button:has-text("Open Modal")');

    // Tab should stay within modal
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluateHandle(() => document.activeElement);

    // Tab through all modal elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Should return to first element
    const currentFocused = await page.evaluateHandle(() => document.activeElement);
    expect(await firstFocusable.evaluate((el) => el.textContent))
      .toBe(await currentFocused.evaluate((el) => el.textContent));
  });
});
```

---

## Best Practices

1. **Run automated tests on every commit**
2. **Manual testing weekly con screen reader**
3. **Keyboard navigation testing diario durante desarrollo**
4. **Color contrast check en design reviews**
5. **Axe DevTools extension** durante desarrollo
6. **Accessibility checklist** en PR templates
7. **Training periódico** del equipo en a11y
8. **Real user testing** con personas con discapacidades

---

Para más información: https://www.w3.org/WAI/test-evaluate/
