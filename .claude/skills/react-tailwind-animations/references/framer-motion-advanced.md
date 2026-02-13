# Framer Motion Advanced Features

## Table of Contents
- AnimatePresence (Exit Animations)
- Gestures (Drag, Hover, Tap)
- Scroll Animations (whileInView, useScroll)
- Layout Animations
- useAnimate Hook
- Shared Layout Animations
- Performance Optimization

---

## AnimatePresence (Exit Animations)

AnimatePresence allows components to animate out when they're removed from the React tree.

### Basic Exit Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const ToggleBox = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <>
      <button onClick={() => setIsVisible(!isVisible)}>
        Toggle
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="p-6 bg-blue-500 text-white rounded-lg"
          >
            I can animate out!
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

### Modal with AnimatePresence

```tsx
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.2,
    },
  },
};

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
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
              exit="exit"
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

### List with Exit Animations

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Item {
  id: number;
  text: string;
}

export const AnimatedList = () => {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' },
  ]);

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <ul className="space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
          >
            <span>{item.text}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};
```

### Mode: wait, sync, popLayout

```tsx
// wait: Exit animation completes before next enters
<AnimatePresence mode="wait">
  {currentView === 'A' ? <ViewA key="a" /> : <ViewB key="b" />}
</AnimatePresence>

// sync: Enter and exit animations happen simultaneously (default)
<AnimatePresence mode="sync">
  {isVisible && <Component key="comp" />}
</AnimatePresence>

// popLayout: Exiting element doesn't affect layout
<AnimatePresence mode="popLayout">
  {items.map(item => <Item key={item.id} />)}
</AnimatePresence>
```

---

## Gestures

### Hover

```tsx
<motion.button
  whileHover={{
    scale: 1.1,
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
  }}
  className="px-6 py-3 bg-blue-500 text-white rounded-lg"
>
  Hover me
</motion.button>
```

### Tap (Press)

```tsx
<motion.button
  whileTap={{ scale: 0.9 }}
  className="px-6 py-3 bg-blue-500 text-white rounded-lg"
>
  Tap me
</motion.button>
```

### Drag

```tsx
// Basic drag
<motion.div
  drag
  className="w-24 h-24 bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing"
/>

// Drag only horizontal
<motion.div drag="x" />

// Drag only vertical
<motion.div drag="y" />

// Drag constraints
<motion.div
  drag
  dragConstraints={{
    top: -50,
    left: -50,
    right: 50,
    bottom: 50,
  }}
  className="w-24 h-24 bg-blue-500 rounded-lg"
/>

// Drag with elastic behavior
<motion.div
  drag
  dragElastic={0.2}
  className="w-24 h-24 bg-blue-500 rounded-lg"
/>

// Drag with momentum
<motion.div
  drag
  dragMomentum={true}
  className="w-24 h-24 bg-blue-500 rounded-lg"
/>
```

### Drag with Ref Constraints

```tsx
import { useRef } from 'react';

export const DragConstraintExample = () => {
  const constraintsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={constraintsRef}
      className="w-96 h-96 bg-gray-100 rounded-lg p-4"
    >
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        className="w-24 h-24 bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
```

### Drag Listeners

```tsx
<motion.div
  drag
  onDragStart={(event, info) => console.log('Drag started', info.point)}
  onDrag={(event, info) => console.log('Dragging', info.point)}
  onDragEnd={(event, info) => console.log('Drag ended', info.point)}
  className="w-24 h-24 bg-blue-500 rounded-lg"
/>
```

### Swipe Gestures

```tsx
export const SwipeCard = () => {
  const [exitX, setExitX] = useState(0);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(event, info) => {
        if (info.offset.x > 100) {
          setExitX(1000); // Swipe right
        } else if (info.offset.x < -100) {
          setExitX(-1000); // Swipe left
        }
      }}
      animate={{ x: exitX }}
      className="w-64 h-96 bg-white rounded-lg shadow-lg p-4"
    >
      Swipe me left or right
    </motion.div>
  );
};
```

---

## Scroll Animations

### whileInView (Animate when in viewport)

```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.6 }}
>
  I animate when scrolled into view
</motion.div>

// viewport options:
// - once: boolean (animate only once)
// - amount: number (0-1, how much of element must be visible)
// - margin: string (e.g., "0px 0px -200px 0px" to trigger earlier)
```

### useScroll Hook

```tsx
import { motion, useScroll, useTransform } from 'framer-motion';

export const ScrollParallax = () => {
  const { scrollY } = useScroll();

  // Transform scrollY to different values
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300, 500], [1, 0.5, 0]);

  return (
    <motion.div
      style={{ y, opacity }}
      className="w-full h-64 bg-blue-500"
    >
      Parallax effect
    </motion.div>
  );
};
```

### Scroll Progress Indicator

```tsx
import { motion, useScroll } from 'framer-motion';

export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed top-0 left-0 right-0 h-2 bg-blue-500 origin-left z-50"
    />
  );
};
```

### Scroll-Linked Transformations

```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const ScrollScale = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className="w-full h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"
    >
      Scales and fades based on scroll position
    </motion.div>
  );
};
```

---

## Layout Animations

Automatically animate layout changes with `layout` prop.

### Basic Layout Animation

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export const ExpandableBox = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        bg-blue-500 text-white rounded-lg p-6 cursor-pointer
        ${isExpanded ? 'w-96 h-96' : 'w-48 h-48'}
      `}
    >
      Click to expand
    </motion.div>
  );
};
```

### Shared Layout Animations

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

export const SharedLayoutExample = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const items = ['A', 'B', 'C', 'D'];

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <motion.div
          key={item}
          layoutId={item}
          onClick={() => setSelected(item)}
          className="p-6 bg-blue-500 text-white rounded-lg cursor-pointer"
        >
          {item}
        </motion.div>
      ))}

      {selected && (
        <motion.div
          layoutId={selected}
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          onClick={() => setSelected(null)}
        >
          <motion.div className="p-12 bg-blue-500 text-white rounded-lg text-4xl">
            {selected}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
```

---

## useAnimate Hook

Imperative animation API for complex sequences.

```tsx
import { useAnimate } from 'framer-motion';
import { useEffect } from 'react';

export const SequenceAnimation = () => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const sequence = async () => {
      await animate(scope.current, { x: 100 }, { duration: 0.5 });
      await animate(scope.current, { y: 100 }, { duration: 0.5 });
      await animate(scope.current, { x: 0 }, { duration: 0.5 });
      await animate(scope.current, { y: 0 }, { duration: 0.5 });
    };

    sequence();
  }, []);

  return (
    <div
      ref={scope}
      className="w-24 h-24 bg-blue-500 rounded-lg"
    />
  );
};
```

### Stagger with useAnimate

```tsx
import { useAnimate, stagger } from 'framer-motion';
import { useEffect } from 'react';

export const StaggeredCards = () => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      '.card',
      { opacity: 1, y: 0 },
      { delay: stagger(0.1), duration: 0.5 }
    );
  }, []);

  return (
    <div ref={scope} className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="card opacity-0 translate-y-4 p-6 bg-white rounded-lg shadow"
        >
          Card {i}
        </div>
      ))}
    </div>
  );
};
```

---

## Performance Optimization

### Use LazyMotion

```tsx
import { LazyMotion, domAnimation, m } from 'framer-motion';

export default function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Optimized bundle
      </m.div>
    </LazyMotion>
  );
}
```

### Reduce Motion for Accessibility

```tsx
import { motion, useReducedMotion } from 'framer-motion';

export const AccessibleAnimation = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.5,
      }}
    >
      Respects prefers-reduced-motion
    </motion.div>
  );
};
```

### Transform Template (for better performance)

```tsx
<motion.div
  style={{ x: 100 }}
  transformTemplate={({ x }) => `translateX(${x})`}
/>
```

### will-change for struggling animations

```tsx
<motion.div
  animate={{ x: 100, rotate: 360 }}
  style={{ willChange: 'transform' }}
/>
```
