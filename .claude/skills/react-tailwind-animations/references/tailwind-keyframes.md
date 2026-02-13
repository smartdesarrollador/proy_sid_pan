# Tailwind CSS Custom Keyframes & Animations

## Table of Contents
- Built-in Animations
- Creating Custom Keyframes
- Animation Utilities
- Configuration in tailwind.config
- Common Animation Patterns
- Examples

---

## Built-in Animations

Tailwind provides several built-in animations:

```tsx
// Spin (360deg rotation, 1s linear infinite)
<div className="animate-spin">
  Loading...
</div>

// Ping (scale + opacity, 1s cubic-bezier infinite)
<div className="relative">
  <div className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping" />
  <div className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
</div>

// Pulse (opacity fade in/out, 2s cubic-bezier infinite)
<div className="animate-pulse bg-gray-200 h-4 w-full rounded" />

// Bounce (bounce effect, 1s infinite)
<div className="animate-bounce">
  ↓
</div>
```

---

## Creating Custom Keyframes

### Step 1: Define Keyframes in `tailwind.config.ts`

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      keyframes: {
        // Fade in from opacity 0 to 1
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        // Fade out from opacity 1 to 0
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },

        // Slide in from bottom
        slideInBottom: {
          '0%': {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },

        // Slide in from right
        slideInRight: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },

        // Slide out to top
        slideOutTop: {
          '0%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
        },

        // Scale in (zoom in)
        scaleIn: {
          '0%': {
            transform: 'scale(0.9)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },

        // Shake (error effect)
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },

        // Wiggle
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },

        // Shimmer (skeleton loading)
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },

        // Progress bar
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },

        // Float (gentle up/down motion)
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },

        // Glow (pulsating glow effect)
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
          },
        },

        // Swing (pendulum motion)
        swing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(15deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '80%': { transform: 'rotate(-5deg)' },
        },

        // Flip
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },

        // Heartbeat
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
        },
      },

      // Step 2: Create animation utilities
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'slide-in-bottom': 'slideInBottom 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-top': 'slideOutTop 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'progress': 'progress 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'swing': 'swing 1s ease-in-out',
        'flip': 'flip 0.6s ease-in-out',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Using Custom Animations

### Basic Usage

```tsx
// Fade in on mount
<div className="animate-fade-in">
  Welcome!
</div>

// Slide in from bottom
<div className="animate-slide-in-bottom">
  Notification
</div>

// Shake on error
<input className={error ? 'animate-shake border-red-500' : ''} />

// Wiggle continuously
<div className="animate-wiggle">
  👋
</div>
```

### Conditional Animations

```tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export const Toast = ({ message, type, isVisible }: ToastProps) => {
  return (
    <div
      className={`
        fixed top-4 right-4 p-4 rounded-lg shadow-lg
        ${isVisible ? 'animate-slide-in-right' : 'animate-slide-out-top'}
        ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}
        text-white
      `}
    >
      {message}
    </div>
  );
};
```

### Skeleton Loading

```tsx
export const SkeletonCard = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 w-full">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
};

// Or with shimmer effect
export const ShimmerCard = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 w-full overflow-hidden">
      <div
        className="animate-shimmer h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 mb-4"
        style={{
          backgroundSize: '1000px 100%',
        }}
      />
      <div
        className="animate-shimmer h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-4"
        style={{
          backgroundSize: '1000px 100%',
        }}
      />
    </div>
  );
};
```

---

## Advanced Keyframe Patterns

### Staggered Animations

```tsx
// In tailwind.config.ts, add animation delays
animation: {
  'fade-in-1': 'fadeIn 0.3s ease-out 0.1s both',
  'fade-in-2': 'fadeIn 0.3s ease-out 0.2s both',
  'fade-in-3': 'fadeIn 0.3s ease-out 0.3s both',
  'fade-in-4': 'fadeIn 0.3s ease-out 0.4s both',
}

// Usage
export const StaggeredList = () => {
  return (
    <div>
      <div className="animate-fade-in-1">Item 1</div>
      <div className="animate-fade-in-2">Item 2</div>
      <div className="animate-fade-in-3">Item 3</div>
      <div className="animate-fade-in-4">Item 4</div>
    </div>
  );
};

// Or dynamic with style
export const DynamicStagger = ({ items }: { items: string[] }) => {
  return (
    <div>
      {items.map((item, i) => (
        <div
          key={i}
          className="animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};
```

### Complex Multi-Step Animations

```tsx
// In tailwind.config.ts
keyframes: {
  'complex-entrance': {
    '0%': {
      opacity: '0',
      transform: 'translateY(20px) scale(0.95)',
    },
    '50%': {
      opacity: '0.5',
      transform: 'translateY(-5px) scale(1.02)',
    },
    '100%': {
      opacity: '1',
      transform: 'translateY(0) scale(1)',
    },
  },
},
animation: {
  'complex-entrance': 'complex-entrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
}

// Usage
<div className="animate-complex-entrance">
  Bouncy entrance
</div>
```

### Looping vs One-Time

```tsx
// One-time animation (default)
<div className="animate-fade-in">
  Fades in once
</div>

// Infinite loop (add 'infinite' in config)
animation: {
  'wiggle': 'wiggle 1s ease-in-out infinite',
}

<div className="animate-wiggle">
  Wiggles forever
</div>

// Custom iteration count with inline style
<div
  className="animate-fade-in"
  style={{ animationIterationCount: '3' }}
>
  Fades in 3 times
</div>
```

---

## Common Animation Patterns

### Modal Enter/Exit

```tsx
// tailwind.config.ts
keyframes: {
  'modal-in': {
    '0%': {
      opacity: '0',
      transform: 'scale(0.95) translateY(-20px)',
    },
    '100%': {
      opacity: '1',
      transform: 'scale(1) translateY(0)',
    },
  },
  'overlay-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
},
animation: {
  'modal-in': 'modal-in 0.2s ease-out',
  'overlay-in': 'overlay-in 0.2s ease-out',
}

// Usage
export const Modal = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 animate-overlay-in" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full animate-modal-in">
          {children}
        </div>
      </div>
    </>
  );
};
```

### Notification Toast

```tsx
// tailwind.config.ts
keyframes: {
  'toast-in': {
    '0%': {
      transform: 'translateX(100%)',
      opacity: '0',
    },
    '100%': {
      transform: 'translateX(0)',
      opacity: '1',
    },
  },
  'toast-out': {
    '0%': {
      transform: 'translateX(0)',
      opacity: '1',
    },
    '100%': {
      transform: 'translateX(100%)',
      opacity: '0',
    },
  },
},
animation: {
  'toast-in': 'toast-in 0.3s ease-out',
  'toast-out': 'toast-out 0.3s ease-in',
}
```

### Progress Indicator

```tsx
// tailwind.config.ts
keyframes: {
  'progress-indeterminate': {
    '0%': { transform: 'translateX(-100%) scaleX(0.3)' },
    '50%': { transform: 'translateX(0%) scaleX(0.5)' },
    '100%': { transform: 'translateX(100%) scaleX(0.3)' },
  },
},
animation: {
  'progress-indeterminate': 'progress-indeterminate 2s ease-in-out infinite',
}

// Usage
export const ProgressBar = () => {
  return (
    <div className="w-full h-1 bg-gray-200 overflow-hidden">
      <div className="h-full bg-blue-500 animate-progress-indeterminate origin-left" />
    </div>
  );
};
```

### Attention Seeking (Bounce, Pulse, etc.)

```tsx
// Error field attention
<input
  className={error ? 'border-red-500 animate-shake' : 'border-gray-300'}
/>

// New notification badge
<div className="relative">
  <BellIcon />
  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
</div>

// Floating call-to-action
<button className="animate-float bg-blue-500 text-white px-6 py-3 rounded-full">
  Get Started
</button>
```

---

## Accessibility Considerations

Always respect `prefers-reduced-motion`:

```tsx
// In tailwind.config.ts, create motion-safe variants
animation: {
  // Regular animations
  'fade-in': 'fadeIn 0.3s ease-out',
  'shake': 'shake 0.5s ease-in-out',

  // Reduced-motion alternatives (optional)
  'fade-in-reduced': 'fadeIn 0.15s ease-out',
}

// Usage
<div className="
  motion-safe:animate-fade-in
  motion-reduce:opacity-100
">
  Content
</div>

// Or disable animations entirely for reduced motion
<div className="motion-safe:animate-shake">
  Error message
</div>
```

---

## Performance Tips

1. **Use `transform` and `opacity`** - GPU accelerated
2. **Avoid animating `width`, `height`, `margin`, `padding`** - Causes reflow
3. **Use `will-change` sparingly** - Only for animations that struggle
4. **Clean up infinite animations** - Remove when component unmounts
5. **Prefer CSS animations over JavaScript** - Better performance

```tsx
// Good: GPU accelerated
className="animate-fade-in"  // uses opacity + transform

// Bad: Causes reflow
className="animate-width-expand"  // animates width

// Use will-change for struggling animations
<div className="animate-complex-entrance will-change-transform">
  Complex animation
</div>
```
