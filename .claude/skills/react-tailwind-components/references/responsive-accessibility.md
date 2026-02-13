# Responsive Design & Accessibility

Guía completa de responsive design y accessibility con Tailwind CSS.

## Responsive Breakpoints

### Mobile-First Approach

```tsx
// Base = mobile (0px+)
// sm = tablet (640px+)
// md = small laptop (768px+)
// lg = laptop (1024px+)
// xl = desktop (1280px+)
// 2xl = large desktop (1536px+)

<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5">
  Responsive width
</div>
```

### Grid Responsive

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id} />
  ))}
</div>
```

### Typography Responsive

```tsx
<h1 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>

<p className="text-sm sm:text-base md:text-lg">
  Responsive paragraph
</p>
```

### Padding/Margin Responsive

```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  Responsive padding
</div>
```

### Hide/Show Elements

```tsx
// Hidden on mobile, visible from sm
<div className="hidden sm:block">Desktop Navigation</div>

// Visible on mobile, hidden from sm
<div className="block sm:hidden">Mobile Navigation</div>
```

## Accessibility (a11y)

### Focus States

```tsx
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
  Button
</button>

<input className="focus:border-blue-600 focus:ring-2 focus:ring-blue-600" />
```

### Disabled States

```tsx
<button
  disabled
  className="disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
>
  Disabled Button
</button>
```

### Screen Reader Only

```tsx
<span className="sr-only">Loading...</span>

// Visible en hover/focus para keyboard navigation
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0">
  Skip to main content
</a>
```

### ARIA Attributes

```tsx
<button aria-label="Close modal" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

<div role="alert" aria-live="polite">
  {errorMessage}
</div>

<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>
```

### Semantic HTML

```tsx
// ✅ Semantic
<button onClick={handleClick}>Click me</button>
<nav>...</nav>
<main>...</main>
<article>...</article>
<aside>...</aside>

// ❌ Non-semantic
<div onClick={handleClick}>Click me</div>
```

### Keyboard Navigation

```tsx
<div
  tabIndex={0}
  role="button"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom button
</div>
```

### Color Contrast

```tsx
// ✅ Good contrast
<div className="bg-blue-600 text-white">High contrast</div>

// ❌ Poor contrast
<div className="bg-blue-200 text-blue-300">Low contrast</div>
```

## Accessibility Checklist

- ✅ Focus-visible en todos los elementos interactivos
- ✅ Keyboard navigation funcional (Tab, Enter, Space, Arrows)
- ✅ ARIA labels donde necesario
- ✅ Semantic HTML (button, nav, main, article)
- ✅ Screen reader text (sr-only)
- ✅ Color contrast WCAG AA/AAA
- ✅ Disabled states claros
- ✅ Form labels asociados (htmlFor)
- ✅ Alt text en imágenes
- ✅ Skip links para navegación

## Container Responsive

```tsx
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    Content
  </div>
</div>
```

## Resumen

Responsive + Accessibility:
- ✅ Mobile-first breakpoints (sm, md, lg, xl, 2xl)
- ✅ Grid/Flexbox responsive
- ✅ Typography responsive
- ✅ Focus-visible states
- ✅ Screen reader utilities (sr-only)
- ✅ ARIA patterns
- ✅ Semantic HTML
- ✅ Keyboard navigation
