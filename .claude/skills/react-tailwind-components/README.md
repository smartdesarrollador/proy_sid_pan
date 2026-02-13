# React + Tailwind CSS Components Skill

Guía completa de componentes React con Tailwind CSS y TypeScript usando utility-first approach y mejores prácticas de producción.

## ¿Cuándo usar este skill?

Usa este skill cuando necesites ayuda con:

- ✅ **Setup Tailwind**: Configuración en React/Next.js, tailwind.config.ts, theme customization
- ✅ **Utility-first patterns**: Composición de clases, evitar CSS custom, className organization
- ✅ **Component variants**: Props para variants (size, color, variant), clsx/cn utility
- ✅ **Responsive design**: Breakpoints (sm, md, lg, xl, 2xl), mobile-first approach
- ✅ **Dark mode**: Class/media strategy, useTheme hook, toggle implementation
- ✅ **Componentes base**: Button, Input, Card, Badge, Avatar con variants tipadas
- ✅ **Composition patterns**: Compound components, as prop, children composition
- ✅ **Tailwind plugins**: forms, typography, aspect-ratio, line-clamp
- ✅ **Performance**: Purge configuration, JIT mode, build optimization
- ✅ **Accessibility**: Focus states, hover states, disabled states, screen reader classes

## Contenido

### SKILL.md (Main)
Guía principal con ejemplos copy-paste listos para usar:
- Setup y configuración de Tailwind en React/Next.js
- Utility-first patterns y organización de classes
- cn utility con clsx + tailwind-merge
- Component variants pattern (Button, Input)
- Responsive design mobile-first
- Dark mode con class strategy
- Componentes base reutilizables (Card, Badge, Avatar)
- Compound components (Tabs example)
- Tailwind plugins útiles
- Performance optimization (purge, JIT, safelist)
- Accessibility best practices

### Referencias Detalladas

1. **[setup-configuration.md](references/setup-configuration.md)** - Setup completo, theme customization
   - Instalación en React/Vite y Next.js
   - tailwind.config.ts avanzado
   - PostCSS configuration
   - Theme extension (colors, fonts, spacing)
   - Custom utilities

2. **[component-variants.md](references/component-variants.md)** - Variants pattern avanzado
   - clsx + tailwind-merge (cn utility)
   - CVA (Class Variance Authority) library
   - Multiple variants composition
   - Compound variants
   - Default variants y required props

3. **[base-components.md](references/base-components.md)** - Biblioteca completa
   - Button (todos los variants)
   - Input, Textarea, Select
   - Card, CardHeader, CardContent
   - Badge, Avatar, Spinner
   - Alert, Toast, Modal
   - Tabs, Accordion, Dropdown

4. **[dark-mode-theming.md](references/dark-mode-theming.md)** - Dark mode implementation
   - Class vs Media strategy
   - ThemeProvider component
   - useTheme hook
   - Theme toggle button
   - Persistent theme storage
   - System preference detection

5. **[responsive-accessibility.md](references/responsive-accessibility.md)** - Responsive y a11y
   - Mobile-first approach
   - Container queries
   - Responsive typography
   - Grid y Flexbox responsive
   - ARIA patterns con Tailwind
   - Focus management
   - Screen reader utilities
   - Keyboard navigation

## Filosofía Utility-First

### ✅ Ventajas
- **No context switching**: Todo en JSX (no cambiar entre archivos)
- **No naming hell**: No inventar nombres de clases
- **Dead code elimination**: PurgeCSS automático
- **Mobile-first**: Responsive design natural
- **Consistency**: Design system con utilities
- **Performance**: Solo CSS usado se incluye en bundle

### ⚠️ Trade-offs
- Clases largas en JSX (mitigado con cn utility)
- Curva de aprendizaje inicial
- Necesita disciplina (no abusar de @apply)

## Arquitectura Recomendada

```
src/
├── components/
│   ├── ui/              # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   └── features/        # Componentes específicos de features
│       └── UserCard.tsx
├── lib/
│   └── utils.ts         # cn utility
└── styles/
    └── globals.css      # @tailwind directives
```

## Ejemplos de Uso

### Button con Variants
```tsx
<Button variant="primary" size="lg">
  Primary Button
</Button>

<Button variant="outline" size="sm" disabled>
  Disabled Outline
</Button>
```

### Card Component
```tsx
<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Product description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Buy Now</Button>
  </CardFooter>
</Card>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

### Dark Mode
```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

## Componentes Incluidos

### Basic
- Button (primary, secondary, outline, ghost, danger)
- Input (default, error states)
- Textarea
- Select
- Checkbox
- Radio

### Layout
- Card (with Header, Content, Footer)
- Container
- Section
- Divider

### Feedback
- Badge (default, success, warning, danger, outline)
- Alert (info, success, warning, error)
- Toast
- Spinner
- Progress Bar

### Display
- Avatar (with fallback)
- Image
- Icon

### Interactive
- Tabs (compound component)
- Accordion
- Dropdown Menu
- Modal/Dialog
- Tooltip

## Plugins Recomendados

```bash
# Forms: estilos base para inputs
npm install -D @tailwindcss/forms

# Typography: prose class para contenido
npm install -D @tailwindcss/typography

# Aspect Ratio: ratios de imágenes/videos
npm install -D @tailwindcss/aspect-ratio

# Line Clamp: truncar texto multi-línea
npm install -D @tailwindcss/line-clamp
```

## Performance Tips

1. **Content paths precisos** - Solo archivos con clases Tailwind
2. **JIT mode** - Enabled por default en v3 (on-demand generation)
3. **Safelist mínimo** - Solo clases realmente dinámicas
4. **Evitar @apply** - Usar components en su lugar
5. **PurgeCSS** - Automático con content configuration

## Accessibility Checklist

- ✅ Focus-visible en todos los elementos interactivos
- ✅ Disabled states claros (opacity + cursor + pointer-events)
- ✅ Color contrast adecuado (WCAG AA/AAA)
- ✅ Screen reader text con `sr-only`
- ✅ ARIA labels donde necesario
- ✅ Keyboard navigation funcional
- ✅ Focus traps en modals
- ✅ Skip links para navegación

## Comparación con Alternativas

| Feature | Tailwind | CSS-in-JS | CSS Modules |
|---------|----------|-----------|-------------|
| **Learning Curve** | Medium | Low | Low |
| **Bundle Size** | Pequeño (purged) | Grande | Medio |
| **Performance** | Excelente | Buena | Excelente |
| **DX** | Excelente | Buena | Buena |
| **Theming** | Built-in | Custom | Custom |
| **Dark Mode** | Built-in | Custom | Custom |
| **Responsive** | Built-in | Custom | Custom |

## Recursos Externos

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/) - Unstyled components
- [shadcn/ui](https://ui.shadcn.com/) - Copy-paste components
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground

## Licencia

Este skill es parte del proyecto y sigue la misma licencia.
