# Animation Performance & Accessibility

## Table of Contents
- GPU Acceleration
- Properties to Animate
- will-change Property
- Reduce Motion (Accessibility)
- Performance Monitoring
- Bundle Size Optimization
- Common Performance Pitfalls
- Best Practices

---

## GPU Acceleration

Modern browsers can offload certain CSS properties to the GPU for hardware-accelerated rendering, resulting in smoother animations at 60fps.

### GPU-Accelerated Properties

✅ **Always animate these (GPU-accelerated):**

```tsx
// Transform properties (GPU-accelerated)
transform: translate3d()
transform: translateX() / translateY() / translateZ()
transform: scale() / scaleX() / scaleY()
transform: rotate() / rotateX() / rotateY() / rotateZ()
transform: skew() / skewX() / skewY()

// Opacity
opacity

// Filter (with caution - can be expensive)
filter: blur()
filter: brightness()
```

### Example: GPU-Optimized Animation

```tsx
// ✅ Good: GPU-accelerated
<motion.div
  animate={{
    x: 100,           // translateX
    y: 50,            // translateY
    scale: 1.2,       // scale
    rotate: 45,       // rotate
    opacity: 0.8,     // opacity
  }}
/>

// ❌ Bad: Not GPU-accelerated, causes reflow
<motion.div
  animate={{
    left: '100px',    // triggers layout reflow
    width: '200px',   // triggers layout reflow
    marginTop: '50px', // triggers layout reflow
  }}
/>
```

---

## Properties to Animate

### Performance Hierarchy

1. **Best (GPU-accelerated, no reflow):**
   - `transform` (translate, scale, rotate)
   - `opacity`

2. **Acceptable (GPU-accelerated, but can be expensive):**
   - `filter` (blur, brightness, etc.)
   - `backdrop-filter`

3. **Avoid (causes layout reflow):**
   - `width` / `height`
   - `margin` / `padding`
   - `top` / `left` / `right` / `bottom` (use `translate` instead)
   - `border-width`
   - Any property that affects layout

### Comparison Examples

```tsx
// ❌ Bad: Animates width (causes reflow)
<motion.div
  className="h-12"
  animate={{ width: isExpanded ? 300 : 100 }}
/>

// ✅ Good: Use scale instead
<motion.div
  className="h-12 w-[100px]"
  animate={{ scaleX: isExpanded ? 3 : 1 }}
  style={{ transformOrigin: 'left' }}
/>

// ❌ Bad: Animates top/left position
<motion.div
  style={{ position: 'absolute' }}
  animate={{ top: 100, left: 200 }}
/>

// ✅ Good: Use translate instead
<motion.div
  style={{ position: 'absolute' }}
  animate={{ x: 200, y: 100 }}
/>

// ❌ Bad: Animates margin
<motion.div
  animate={{ marginTop: 50 }}
/>

// ✅ Good: Use translateY instead
<motion.div
  animate={{ y: 50 }}
/>
```

---

## will-change Property

The `will-change` CSS property hints to browsers which properties will change, allowing optimization.

### When to Use

⚠️ **Use sparingly** - Only for animations that struggle to maintain 60fps.

```tsx
// Use will-change for struggling animations
<motion.div
  animate={{ x: 100, rotate: 360, scale: 1.5 }}
  style={{ willChange: 'transform' }}
/>

// Or in Tailwind
<motion.div className="will-change-transform" />
```

### Guidelines

```tsx
// ❌ Bad: Using will-change everywhere (memory overhead)
<motion.div style={{ willChange: 'transform, opacity, filter' }} />

// ✅ Good: Only when needed, remove after animation
<motion.div
  style={{
    willChange: isAnimating ? 'transform' : 'auto',
  }}
/>

// ✅ Good: Specific properties only
<motion.div
  style={{ willChange: 'transform' }} // Only transform
/>
```

### Dynamic will-change

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export const OptimizedAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  return (
    <motion.div
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      style={{
        willChange: isAnimating ? 'transform' : 'auto',
      }}
      whileHover={{ scale: 1.2, rotate: 10 }}
    />
  );
};
```

---

## Reduce Motion (Accessibility)

Respect users who have enabled `prefers-reduced-motion` in their OS settings.

### Why It Matters

- Some users experience **motion sickness** from animations
- Vestibular disorders can be triggered by parallax and motion effects
- **WCAG 2.1 Success Criterion 2.3.3** requires respecting reduce motion

### Tailwind CSS: motion-safe & motion-reduce

```tsx
// Animate only if user hasn't requested reduced motion
<div className="
  motion-safe:transition-transform
  motion-safe:hover:scale-105
  motion-reduce:hover:bg-gray-100
">
  Card
</div>

// Different animations based on preference
<div className="
  motion-safe:animate-bounce
  motion-reduce:animate-pulse
">
  Notification
</div>

// Disable animation entirely for reduced motion
<div className="motion-safe:transition-all motion-safe:duration-500">
  Content
</div>
```

### Framer Motion: useReducedMotion Hook

```tsx
import { motion, useReducedMotion } from 'framer-motion';

export const AccessibleAnimation = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.5,
      }}
    >
      Respects user preference
    </motion.div>
  );
};
```

### Complete Example: Accessible Modal

```tsx
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AccessibleModal = ({ isOpen, onClose, children }: ModalProps) => {
  const shouldReduceMotion = useReducedMotion();

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.8,
      y: shouldReduceMotion ? 0 : -50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
```

---

## Performance Monitoring

### Chrome DevTools Performance Tab

1. Open DevTools → Performance tab
2. Start recording
3. Trigger animations
4. Stop recording
5. Look for:
   - **Green bars** (painting) should be minimal
   - **Purple bars** (rendering/layout) should be minimal
   - Animation should run at **60fps** (16.67ms per frame)

### React DevTools Profiler

```tsx
import { Profiler } from 'react';

<Profiler
  id="AnimatedComponent"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  }}
>
  <AnimatedComponent />
</Profiler>
```

### Frame Rate Monitoring

```tsx
import { useEffect, useRef } from 'react';

export const useFrameRate = () => {
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const measureFrameRate = (currentTime: number) => {
      frameRef.current++;

      if (currentTime >= lastTimeRef.current + 1000) {
        console.log(`FPS: ${frameRef.current}`);
        frameRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    animationFrameId = requestAnimationFrame(measureFrameRate);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);
};
```

---

## Bundle Size Optimization

### LazyMotion (Framer Motion)

```tsx
import { LazyMotion, domAnimation, m } from 'framer-motion';

// App.tsx
export default function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

// Component.tsx - use 'm' instead of 'motion'
import { m } from 'framer-motion';

<m.div animate={{ x: 100 }} />

// domAnimation: 15kb (most features)
// domMax: 25kb (includes drag, layout animations)
```

### Tree Shaking (Tailwind)

```javascript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind automatically tree-shakes unused utilities
}
```

### Dynamic Imports for Heavy Animations

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy animation component
const HeavyAnimation = lazy(() => import('./HeavyAnimation'));

export const App = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyAnimation />
    </Suspense>
  );
};
```

---

## Common Performance Pitfalls

### 1. Animating Non-Optimized Properties

```tsx
// ❌ Bad
<motion.div animate={{ height: 300 }} />

// ✅ Good
<motion.div animate={{ scaleY: 1.5 }} style={{ transformOrigin: 'top' }} />
```

### 2. Too Many Simultaneous Animations

```tsx
// ❌ Bad: Animating 100 elements simultaneously
{items.map((item, i) => (
  <motion.div
    key={i}
    animate={{ x: 100, y: 100, rotate: 360, scale: 1.5 }}
  />
))}

// ✅ Good: Stagger animations, limit concurrent animations
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item, i) => (
    <motion.div key={i} variants={itemVariants} />
  ))}
</motion.div>
```

### 3. Excessive Re-renders During Animation

```tsx
// ❌ Bad: Inline objects cause re-renders
<motion.div
  animate={{ x: 100 }}
  transition={{ duration: 0.5 }}
/>

// ✅ Good: Define outside component or useMemo
const transition = { duration: 0.5 };

<motion.div
  animate={{ x: 100 }}
  transition={transition}
/>
```

### 4. Large Images Without Optimization

```tsx
// ❌ Bad: Animating large unoptimized images
<motion.img src="/large-image.jpg" animate={{ scale: 1.2 }} />

// ✅ Good: Optimize images, use Next.js Image
import Image from 'next/image';

<motion.div animate={{ scale: 1.2 }}>
  <Image
    src="/large-image.jpg"
    width={800}
    height={600}
    alt="Description"
    priority
  />
</motion.div>
```

### 5. Animation on Scroll Without Throttling

```tsx
// ❌ Bad: No throttling
useEffect(() => {
  const handleScroll = () => {
    setScrollY(window.scrollY); // Fires on every scroll pixel
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

// ✅ Good: Use Framer Motion's useScroll (optimized)
import { useScroll } from 'framer-motion';

const { scrollY } = useScroll();
```

---

## Best Practices Checklist

### ✅ Do

- Animate `transform` (translate, scale, rotate) and `opacity`
- Use `will-change` sparingly for struggling animations
- Respect `prefers-reduced-motion` with `motion-safe`/`motion-reduce`
- Use LazyMotion to reduce bundle size
- Stagger animations instead of running all at once
- Monitor performance with Chrome DevTools
- Use specific transitions instead of `transition-all`
- Optimize images before animating them
- Use `AnimatePresence` for exit animations
- Test on low-powered devices

### ❌ Don't

- Animate `width`, `height`, `margin`, `padding`, `top`, `left`
- Use `will-change` on every animated element
- Ignore `prefers-reduced-motion` preference
- Animate large unoptimized images
- Run 100+ animations simultaneously
- Use `transition-all` for performance-critical animations
- Create inline objects for `animate` or `transition` props
- Forget to clean up animation listeners
- Skip performance testing on mobile devices
- Animate on scroll without optimization

---

## Production-Ready Pattern

```tsx
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { useMemo } from 'react';

interface CardProps {
  title: string;
  description: string;
}

export const PerformantCard = ({ title, description }: CardProps) => {
  const shouldReduceMotion = useReducedMotion();

  // Memoize variants to prevent re-creation
  const variants: Variants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        y: shouldReduceMotion ? 0 : 20,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: shouldReduceMotion ? 0.01 : 0.3,
        },
      },
    }),
    [shouldReduceMotion]
  );

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="
        p-6 bg-white rounded-lg shadow
        motion-safe:hover:scale-105
        motion-reduce:hover:shadow-lg
        transition-shadow
        will-change-auto
      "
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};
```
