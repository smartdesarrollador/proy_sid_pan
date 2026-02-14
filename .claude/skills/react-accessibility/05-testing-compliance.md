# Testing A11y & Herramientas

Detecta problemas de accesibilidad durante el desarrollo y testing.

## 1. ESLint (`jsx-a11y`)

Linting estático para errores obvios (`<img src>`).

**Instalación:**
```bash
npm install eslint-plugin-jsx-a11y
```

**Configuración (`.eslintrc.json`):**
```json
{
  "extends": ["plugin:jsx-a11y/recommended"]
}
```

## 2. Testing Automatizado (`jest-axe`)

Corre auditorías de accesibilidad (AXE-core) dentro de Jest/Vitest.

**Instalación:**
```bash
npm install jest-axe
```

**Setup (`setupTests.ts`):**
```typescript
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

**Test:**
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Toggle } from './Toggle';

test('el componente toggle no tiene violaciones a11y', async () => {
    const { container } = render(<Toggle label="Modo Oscuro" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
});
```

## 3. Checklist Manual (Crucial)

Las herramientas automáticas solo detectan **~30%** de los errores. El resto requiere validación humana.

### Checklist WCAG AA
1.  **Tab Key**: Navega por todos los elementos interactivos en orden lógico.
2.  **Focus Visible**: Siempre sabes dónde está el foco.
3.  **Esc**: Cierra modales/menús.
4.  **Space/Enter**: Activa botones y enlaces.
5.  **Zoom 200%**: El sitio es usable y no se rompe al hacer zoom.
6.  **Screen Reader (NVDA/VoiceOver)**: Navega por la página y escucha si los rótulos tienen sentido ("Botón, Cerrar" vs "Botón, unlabelled").
7.  **Color Contrast**: Verifica contraste suficiente con herramientas (DevTools, Colour Contract Analyser).
