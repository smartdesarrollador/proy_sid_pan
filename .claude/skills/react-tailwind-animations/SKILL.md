---
name: react-tailwind-animations
description: >
  Guía completa de animaciones en React con Tailwind CSS, Framer Motion y TypeScript para UX moderna y performante. Use this skill when implementing: (1) Tailwind transitions, transforms, hover effects, (2) Custom keyframes and animate-* utilities, (3) Framer Motion setup, variants, gestures, (4) AnimatePresence for exit animations, (5) Scroll-triggered animations (whileInView), (6) Drag gestures and interactions, (7) GPU-accelerated animations, (8) Accessibility with motion-safe/motion-reduce, (9) Production-ready animated components (Modal, Dropdown, Accordion, Toast, Tabs, Drawer), (10) Performance optimization and bundle size reduction. Includes TypeScript patterns, accessibility best practices, and copy-paste ready components.
---

# React + Tailwind + Framer Motion Animations

Complete guide for creating modern, performant, and accessible animations in React applications using Tailwind CSS and Framer Motion with TypeScript.

## When to Use This Skill

- Implementing UI animations with Tailwind CSS (transitions, transforms, keyframes)
- Adding advanced animations with Framer Motion (gestures, scroll, layout)
- Creating animated components (modals, dropdowns, accordions, toasts)
- Optimizing animation performance (GPU acceleration, reduced motion)
- Building accessible animations respecting user preferences

## Quick Start

### Tailwind CSS Animations

For simple transitions and hover effects, use Tailwind utilities:

```tsx
<div className="transition-transform duration-300 hover:scale-105">
  Simple hover effect
</div>
```

### Framer Motion Animations

For complex, interactive animations:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Fade in from bottom
</motion.div>
```

---

## Reference Files

This skill uses **progressive disclosure** - start with the basics and dive into specific topics as needed.

### 1. Tailwind CSS Basics

**File:** [tailwind-basics.md](references/tailwind-basics.md)

**When to use:**
- Simple hover/focus effects
- Basic transitions (color, opacity, transform)
- Responsive animations
- Accessibility with `motion-safe`/`motion-reduce`

**What's covered:**
- Transition properties (duration, timing, delay)
- Transform (scale, rotate, translate, skew)
- Hover, focus, active states
- Group hover patterns
- Performance tips

**Example:**
```tsx
<button className="
  transition-all duration-300
  hover:scale-105 hover:shadow-lg
  motion-safe:hover:-translate-y-1
  motion-reduce:hover:bg-blue-600
">
  Animated Button
</button>
```

---

### 2. Custom Keyframes

**File:** [tailwind-keyframes.md](references/tailwind-keyframes.md)

**When to use:**
- Custom animation sequences
- Loading skeletons
- Attention-seeking animations (shake, wiggle, pulse)
- Progress indicators
- Modal entrance/exit animations

**What's covered:**
- Creating keyframes in `tailwind.config.ts`
- Built-in animations (spin, ping, pulse, bounce)
- Custom animations (fade, slide, scale, shimmer)
- Staggered animations
- Animation timing and iteration

**Example:**
```typescript
// tailwind.config.ts
keyframes: {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
},
animation: {
  'fade-in': 'fadeIn 0.3s ease-out',
}

// Component
<div className="animate-fade-in">
  Fades in on mount
</div>
```

---

### 3. Framer Motion Setup

**File:** [framer-motion-setup.md](references/framer-motion-setup.md)

**When to use:**
- Setting up Framer Motion in a project
- Basic entrance/exit animations
- Understanding variants and transitions
- TypeScript integration with Motion
- Spring animations

**What's covered:**
- Installation and LazyMotion (bundle optimization)
- Motion components (`motion.div`, `motion.button`)
- Animation props (initial, animate, exit, whileHover)
- Variants for reusable animations
- Transition configuration (duration, easing, spring)
- TypeScript types and patterns

**Example:**
```tsx
const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div
  variants={variants}
  initial="hidden"
  animate="visible"
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

### 4. Framer Motion Advanced

**File:** [framer-motion-advanced.md](references/framer-motion-advanced.md)

**When to use:**
- AnimatePresence for exit animations
- Drag gestures and interactions
- Scroll-triggered animations (whileInView)
- Layout animations
- Complex animation sequences

**What's covered:**
- `AnimatePresence` for enter/exit animations
- Gestures: drag, hover, tap, swipe
- `whileInView` for scroll animations
- `useScroll` hook for parallax effects
- Layout animations with `layout` prop
- Shared layout animations (morphing)
- `useAnimate` hook for imperative control

**Example:**
```tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      Animates in and out
    </motion.div>
  )}
</AnimatePresence>
```

---

### 5. Performance & Accessibility

**File:** [performance.md](references/performance.md)

**When to use:**
- Optimizing animation performance
- Ensuring 60fps animations
- Respecting `prefers-reduced-motion`
- Debugging janky animations
- Reducing bundle size

**What's covered:**
- GPU-accelerated properties (transform, opacity)
- Properties to avoid (width, height, margin)
- `will-change` usage guidelines
- `motion-safe` and `motion-reduce` utilities
- `useReducedMotion` hook
- Bundle optimization with LazyMotion
- Performance monitoring with DevTools
- Common pitfalls and best practices

**Example:**
```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={{
    y: shouldReduceMotion ? 0 : 50,
  }}
  transition={{
    duration: shouldReduceMotion ? 0.01 : 0.5,
  }}
>
  Accessible animation
</motion.div>
```

---

### 6. Animated Components Library

**File:** [animated-components.md](references/animated-components.md)

**When to use:**
- Need production-ready animated components
- Building Modal, Dropdown, Accordion, Tooltip
- Creating Toast notifications
- Implementing Tabs or Drawer
- Loading states (Spinner, Skeleton)

**What's covered:**
- **Modal**: with backdrop, multiple sizes, accessible
- **Dropdown**: with staggered items, click-outside handling
- **Accordion**: with smooth height transitions
- **Tooltip**: with multiple positions
- **Toast**: with context provider, auto-dismiss
- **Tabs**: with animated underline indicator
- **Drawer**: slide-in from left/right
- **Loading**: Spinner, Pulse, Skeleton loaders

**Example:**
```tsx
import { Modal } from './components/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content goes here</p>
</Modal>
```

---

## Choosing the Right Approach

### Use Tailwind CSS when:
- ✅ Simple hover/focus effects
- ✅ Basic transitions (colors, opacity, scale)
- ✅ Single-property animations
- ✅ You want minimal bundle size
- ✅ You prefer utility-first approach

### Use Framer Motion when:
- ✅ Complex entrance/exit animations
- ✅ Gestures (drag, swipe, tap)
- ✅ Scroll-based animations
- ✅ Orchestrated sequences (stagger, delay)
- ✅ Layout animations (morphing)
- ✅ Spring physics
- ✅ Need fine-grained control

### Combine Both when:
- ✅ Tailwind for static styles + Framer for animations
- ✅ Tailwind `motion-safe`/`motion-reduce` + Framer `useReducedMotion`
- ✅ Building production components (see animated-components.md)

---

## Common Patterns

### Fade In on Mount

```tsx
// Tailwind
<div className="animate-fade-in">Content</div>

// Framer Motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>
```

### Hover Scale

```tsx
// Tailwind
<button className="transition-transform hover:scale-105">
  Button
</button>

// Framer Motion
<motion.button whileHover={{ scale: 1.05 }}>
  Button
</motion.button>
```

### Staggered List

```tsx
// Tailwind (with delays)
{items.map((item, i) => (
  <div
    key={i}
    className="animate-fade-in"
    style={{ animationDelay: `${i * 100}ms` }}
  >
    {item}
  </div>
))}

// Framer Motion (with variants)
<motion.ul variants={containerVariants}>
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item}
    </motion.li>
  ))}
</motion.ul>
```

### Scroll-Triggered Animation

```tsx
// Framer Motion only (no Tailwind equivalent)
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
>
  Animates when scrolled into view
</motion.div>
```

---

## Accessibility Best Practices

Always respect user preferences for reduced motion:

### Tailwind CSS

```tsx
<div className="
  motion-safe:transition-transform
  motion-safe:hover:scale-105
  motion-reduce:hover:bg-blue-500
">
  Accessible animation
</div>
```

### Framer Motion

```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={{
    scale: shouldReduceMotion ? 1 : 1.1,
  }}
  transition={{
    duration: shouldReduceMotion ? 0 : 0.3,
  }}
/>
```

---

## Performance Checklist

✅ **DO:**
- Animate `transform` (translate, scale, rotate) and `opacity`
- Use `motion-safe`/`motion-reduce` for accessibility
- Use LazyMotion for smaller bundles
- Stagger animations instead of running all at once
- Monitor with Chrome DevTools Performance tab

❌ **DON'T:**
- Animate `width`, `height`, `margin`, `padding`, `top`, `left`
- Use `will-change` everywhere (only for struggling animations)
- Ignore `prefers-reduced-motion` preference
- Animate large unoptimized images
- Use `transition-all` for performance-critical animations

---

## Quick Reference

| Feature | Tailwind | Framer Motion |
|---------|----------|---------------|
| Hover effects | ✅ `hover:scale-105` | ✅ `whileHover` |
| Transitions | ✅ `transition-all` | ✅ `transition` prop |
| Keyframes | ✅ Custom in config | ✅ `keyframes` variant |
| Exit animations | ❌ | ✅ `AnimatePresence` |
| Drag gestures | ❌ | ✅ `drag` prop |
| Scroll animations | ❌ | ✅ `whileInView` |
| Layout animations | ❌ | ✅ `layout` prop |
| Reduced motion | ✅ `motion-safe` | ✅ `useReducedMotion` |

---

## Next Steps

1. **Getting started?** Read [tailwind-basics.md](references/tailwind-basics.md)
2. **Need custom animations?** See [tailwind-keyframes.md](references/tailwind-keyframes.md)
3. **Adding Framer Motion?** Start with [framer-motion-setup.md](references/framer-motion-setup.md)
4. **Building components?** Check [animated-components.md](references/animated-components.md)
5. **Optimizing performance?** Review [performance.md](references/performance.md)
6. **Advanced features?** Explore [framer-motion-advanced.md](references/framer-motion-advanced.md)

---

## Installation

### Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Framer Motion

```bash
npm install framer-motion
```

### Optional: Icons (for components)

```bash
npm install lucide-react
```

---

## TypeScript Support

All examples in this skill use TypeScript with strict typing. Framer Motion has excellent TypeScript support out of the box.

```tsx
import { motion, Variants, HTMLMotionProps } from 'framer-motion';

const variants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  title: string;
}

export const AnimatedCard = ({ title, ...props }: AnimatedCardProps) => {
  return (
    <motion.div variants={variants} {...props}>
      <h3>{title}</h3>
    </motion.div>
  );
};
```

---

## Resources

All code examples in the reference files are:
- ✅ Copy-paste ready
- ✅ TypeScript strict mode compatible
- ✅ Production-tested patterns
- ✅ Accessible (respects prefers-reduced-motion)
- ✅ Performance-optimized (GPU acceleration)

Navigate to the appropriate reference file based on your needs and copy the examples directly into your project.
