# Angular Accessibility Skill

Sistema completo de accesibilidad (a11y) para Angular standalone applications con WCAG 2.1 AA/AAA compliance.

## Contenido

### SKILL.md Principal (2,539 líneas)

Archivo principal con implementaciones completas:

1. **Interfaces y Modelos**
   - KeyCode enum para navegación
   - FocusTrapConfig, LiveAnnouncerConfig
   - ContrastResult para WCAG compliance

2. **Servicios Core (3)**
   - `LiveAnnouncerService` - Screen reader announcements
   - `FocusManagementService` - Focus state management
   - `KeyboardNavigationService` - Keyboard event handling

3. **Directivas Reutilizables (4)**
   - `FocusTrapDirective` - Focus trapping para modals
   - `AriaAnnouncerDirective` - ARIA live announcements
   - `SkipLinkDirective` - Skip navigation
   - `AutoFocusDirective` - Auto-focus management

4. **Utilidades (4)**
   - `KeyboardUtil` - Arrow navigation handlers
   - `AriaUtil` - ARIA attribute helpers
   - `FocusUtil` - Focus management helpers
   - `ColorContrastUtil` - WCAG contrast checker

5. **Componentes Accesibles (6)**
   - AccessibleButton - WCAG-compliant button
   - AccessibleModal - Accessible dialog
   - AccessibleDropdown - Keyboard-navigable dropdown
   - AccessibleFormField - Accessible form fields
   - AccessibleTable - Accessible data table
   - SkipToContent - Skip navigation component

6. **Estilos CSS Accessibility**
   - Screen reader only classes
   - Focus indicators
   - Touch targets (44x44px)
   - High contrast mode support
   - Reduced motion support

7. **Testing con Axe-core**
   - AxeTestingUtil helper class
   - Component test examples
   - WCAG AA/AAA automated tests

8. **Routing Accesible**
   - AccessibleRoutingService
   - Focus on route change
   - Route announcements

9. **Checklist WCAG 2.1**
   - Perceivable
   - Operable
   - Understandable
   - Robust

### Referencias (3 archivos)

#### 1. aria-patterns.md (588 líneas)
Patrones avanzados de ARIA:
- Accordion
- Tabs
- Combobox/Autocomplete
- Tree View
- Tooltip
- Alert/Toast
- Breadcrumb
- Menu Button
- Dialog/Modal
- Listbox

#### 2. testing-strategies.md (751 líneas)
Estrategias completas de testing:
- Automated Testing con Axe
- Manual Testing Checklist
- Screen Reader Testing (NVDA, VoiceOver, JAWS)
- Keyboard Navigation Testing
- Color Contrast Testing
- CI/CD Integration
- Playwright E2E Tests

#### 3. quick-start-guide.md (686 líneas)
Guía de implementación paso a paso:
- Setup Inicial
- Quick Wins (1-2 días)
- Medium Effort (1 semana)
- Long Term (2-4 semanas)
- Checklist Ejecutable
- Herramientas Recomendadas
- Recursos de Aprendizaje

## Cuándo Usar Este Skill

Usar cuando se necesite:
- ✅ ARIA labels, roles, attributes
- ✅ Keyboard navigation (Tab/Enter/Escape/Arrow keys)
- ✅ Focus management y focus trapping
- ✅ Skip navigation links
- ✅ Screen reader announcements (aria-live)
- ✅ Semantic HTML
- ✅ Form accessibility
- ✅ Modal/Dialog accessibility
- ✅ Dropdown/Menu accessibility
- ✅ Custom focus indicators
- ✅ Color contrast compliance (WCAG AA/AAA)
- ✅ Alternative text para imágenes
- ✅ Accessible data tables
- ✅ Testing con axe-core
- ✅ Accessible routing

## Features Clave

- 🎯 **Production-Ready**: Código listo para copiar y usar
- 🎯 **WCAG 2.1 Compliant**: AA/AAA compliance
- 🎯 **Angular 19+ Standalone**: Arquitectura moderna
- 🎯 **TypeScript Strict**: Type-safe
- 🎯 **Tailwind CSS**: Estilos utilitarios
- 🎯 **Best Practices**: Siguiendo estándares W3C ARIA
- 🎯 **Testing Completo**: Automated + Manual + Screen Reader
- 🎯 **Documentación Exhaustiva**: Ejemplos y explicaciones

## Estadísticas

- **Total líneas**: 4,564 líneas de código y documentación
- **Servicios**: 3 servicios core
- **Directivas**: 4 directivas reutilizables
- **Utilidades**: 4 utility classes
- **Componentes**: 6 componentes accesibles
- **Patrones ARIA**: 10 patrones avanzados
- **Test Utilities**: Testing completo con axe-core

## Inicio Rápido

1. **Leer SKILL.md** para implementaciones completas
2. **Consultar quick-start-guide.md** para guía paso a paso
3. **Ver aria-patterns.md** para patrones avanzados
4. **Revisar testing-strategies.md** para testing completo

## Uso en Claude Code

```bash
# El skill se carga automáticamente cuando mencionas:
# "implementar accesibilidad"
# "ARIA attributes"
# "keyboard navigation"
# "WCAG compliance"
# "screen reader"
# "focus management"
# etc.
```

## Estructura de Archivos

```
angular-accessibility/
├── SKILL.md (65KB)           # Archivo principal con todo el código
├── README.md                 # Este archivo
└── references/
    ├── aria-patterns.md      # Patrones avanzados de ARIA
    ├── testing-strategies.md # Testing completo
    └── quick-start-guide.md  # Guía de implementación
```

## Licencia

Este skill es parte del proyecto proy_temp y sigue las mejores prácticas de accesibilidad web según:
- WCAG 2.1 Guidelines
- W3C ARIA Authoring Practices
- Angular Best Practices

## Recursos Externos

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM**: https://webaim.org/
- **A11y Project**: https://www.a11yproject.com/
- **Deque axe**: https://www.deque.com/axe/

---

**Creado**: 2026-02-08  
**Angular Version**: 19+  
**WCAG Compliance**: 2.1 AA/AAA
