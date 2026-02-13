# Framer Motion Setup & Basics

## Table of Contents
- Installation & Setup
- Motion Components
- Animation Props
- Variants
- Transitions
- Basic Examples
- TypeScript Integration

---

## Installation & Setup

### Install Framer Motion

```bash
npm install framer-motion
# or
yarn add framer-motion
# or
pnpm add framer-motion
```

### Basic Import

```tsx
import { motion } from 'framer-motion';
```

### LazyMotion (Optimized Bundle Size)

For smaller bundle sizes, use LazyMotion to load features on demand:

```tsx
// App.tsx or layout component
import { LazyMotion, domAnimation } from 'framer-motion';

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}

// domAnimation: 15kb (covers most use cases)
// domMax: 25kb (includes drag, layout animations)
```

---

## Motion Components

Every HTML and SVG element has a `motion` component equivalent:

```tsx
import { motion } from 'framer-motion';

// HTML elements
<motion.div />
<motion.button />
<motion.span />
<motion.img />
<motion.input />
<motion.form />
<motion.section />
<motion.article />
<motion.header />
<motion.footer />
<motion.ul />
<motion.li />

// SVG elements
<motion.svg />
<motion.circle />
<motion.path />
<motion.rect />
<motion.line />
```

### Creating Custom Motion Components

```tsx
import { motion } from 'framer-motion';

// Wrap custom component with motion
const MotionCustom = motion.create(CustomComponent);

// Or use forwardRef
import { forwardRef } from 'react';

interface CustomProps {
  title: string;
}

const CustomComponent = forwardRef<HTMLDivElement, CustomProps>(
  ({ title, ...props }, ref) => (
    <div ref={ref} {...props}>
      {title}
    </div>
  )
);

const MotionCustom = motion(CustomComponent);
```

---

## Animation Props

### Core Animation Props

```tsx
// initial: Starting state
<motion.div initial={{ opacity: 0 }} />

// animate: Target state
<motion.div animate={{ opacity: 1 }} />

// exit: Exit state (requires AnimatePresence)
<motion.div exit={{ opacity: 0 }} />

// whileHover: State while hovering
<motion.button whileHover={{ scale: 1.1 }} />

// whileTap: State while pressing/tapping
<motion.button whileTap={{ scale: 0.95 }} />

// whileFocus: State while focused
<motion.input whileFocus={{ borderColor: '#3b82f6' }} />

// whileInView: Animate when element enters viewport
<motion.div whileInView={{ opacity: 1 }} />
```

### Complete Example

```tsx
export const AnimatedButton = () => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg"
    >
      Click Me
    </motion.button>
  );
};
```

---

## Variants

Variants are pre-defined animation states that make animations more reusable and orchestrated.

### Basic Variants

```tsx
const variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

<motion.div
  initial="hidden"
  animate="visible"
  variants={variants}
>
  Content
</motion.div>
```

### Variants with Children (Staggered)

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const StaggeredList = ({ items }: { items: string[] }) => {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, i) => (
        <motion.li key={i} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
};
```

### Dynamic Variants (with custom data)

```tsx
const itemVariants = {
  hidden: { opacity: 0 },
  visible: (custom: number) => ({
    opacity: 1,
    transition: {
      delay: custom * 0.1,
    },
  }),
};

<motion.div
  custom={0}
  initial="hidden"
  animate="visible"
  variants={itemVariants}
/>
<motion.div
  custom={1}
  initial="hidden"
  animate="visible"
  variants={itemVariants}
/>
```

### TypeScript Variants

```tsx
import { Variants } from 'framer-motion';

const variants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
};
```

---

## Transitions

Control how animations execute with transition configuration.

### Duration & Easing

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    duration: 0.5,
    ease: 'easeInOut',
  }}
/>

// Available easing presets
ease: 'linear'
ease: 'easeIn'
ease: 'easeOut'
ease: 'easeInOut'
ease: 'circIn'
ease: 'circOut'
ease: 'circInOut'
ease: 'backIn'
ease: 'backOut'
ease: 'backInOut'
ease: 'anticipate'

// Custom cubic-bezier
ease: [0.17, 0.67, 0.83, 0.67]
```

### Delay

```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5 }}
/>
```

### Type-Specific Transitions

```tsx
<motion.div
  animate={{
    x: 100,
    backgroundColor: '#ff0000',
    scale: 1.5,
  }}
  transition={{
    // Default for all
    duration: 0.5,

    // Specific for scale
    scale: {
      duration: 0.3,
      ease: 'easeOut',
    },

    // Specific for backgroundColor
    backgroundColor: {
      duration: 1,
    },
  }}
/>
```

### Spring Animations

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'spring',
    stiffness: 100,
    damping: 10,
  }}
/>

// Spring presets
transition={{ type: 'spring' }}  // default
transition={{ type: 'spring', bounce: 0.25 }}  // bouncy
transition={{ type: 'spring', stiffness: 300 }}  // stiff
transition={{ type: 'spring', damping: 5 }}  // less damping (more oscillation)
```

### Tween Animations

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'tween',
    duration: 0.5,
    ease: 'easeInOut',
  }}
/>
```

### Repeat & Yoyo

```tsx
// Repeat infinitely
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    repeat: Infinity,
    duration: 2,
    ease: 'linear',
  }}
/>

// Repeat N times
<motion.div
  animate={{ scale: 1.1 }}
  transition={{
    repeat: 3,
    duration: 0.5,
  }}
/>

// Yoyo (reverse on alternate iterations)
<motion.div
  animate={{ x: 100 }}
  transition={{
    repeat: Infinity,
    repeatType: 'reverse',
    duration: 1,
  }}
/>

// Mirror (restart from beginning)
<motion.div
  animate={{ x: 100 }}
  transition={{
    repeat: Infinity,
    repeatType: 'mirror',
    duration: 1,
  }}
/>
```

---

## Basic Examples

### Fade In on Mount

```tsx
export const FadeIn = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};
```

### Slide In from Bottom

```tsx
export const SlideInBottom = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};
```

### Scale In (Zoom)

```tsx
export const ScaleIn = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
```

### Hover & Tap Effects

```tsx
export const InteractiveButton = () => {
  return (
    <motion.button
      whileHover={{
        scale: 1.05,
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      }}
      whileTap={{ scale: 0.95 }}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg"
    >
      Hover & Click Me
    </motion.button>
  );
};
```

### Loading Spinner

```tsx
export const Spinner = () => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        duration: 1,
        ease: 'linear',
      }}
      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  );
};
```

### Staggered List

```tsx
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

interface Item {
  id: number;
  name: string;
}

export const StaggeredList = ({ items }: { items: Item[] }) => {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="p-4 bg-white rounded-lg shadow"
        >
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
};
```

---

## TypeScript Integration

### Component Props with Animation

```tsx
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  title: string;
  description: string;
}

export const AnimatedCard = ({
  title,
  description,
  ...motionProps
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      {...motionProps}
      className="p-6 bg-white rounded-lg shadow"
    >
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

// Usage
<AnimatedCard
  title="Title"
  description="Description"
  whileHover={{ scale: 1.05 }}
/>
```

### Typed Variants

```tsx
import { Variants } from 'framer-motion';

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};
```

### Custom Motion Component with TypeScript

```tsx
import { motion, MotionProps } from 'framer-motion';
import { ComponentPropsWithoutRef } from 'react';

type AnimatedButtonProps = ComponentPropsWithoutRef<'button'> &
  MotionProps & {
    variant?: 'primary' | 'secondary';
  };

export const AnimatedButton = ({
  children,
  variant = 'primary',
  ...props
}: AnimatedButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
      className={`px-6 py-3 rounded-lg ${
        variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200'
      }`}
    >
      {children}
    </motion.button>
  );
};
```

---

## Common Patterns

### Reusable Animation Wrapper

```tsx
interface AnimateInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimateIn = ({
  children,
  delay = 0,
  direction = 'up',
}: AnimateInProps) => {
  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

// Usage
<AnimateIn direction="up" delay={0.2}>
  <h1>Title</h1>
</AnimateIn>
```

### Conditional Animation

```tsx
export const ConditionalAnimation = ({ isActive }: { isActive: boolean }) => {
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.1 : 1,
        backgroundColor: isActive ? '#3b82f6' : '#e5e7eb',
      }}
      transition={{ duration: 0.3 }}
      className="p-4 rounded-lg"
    >
      {isActive ? 'Active' : 'Inactive'}
    </motion.div>
  );
};
```
