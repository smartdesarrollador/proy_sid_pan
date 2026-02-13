# Tailwind CSS Transitions & Transforms

## Table of Contents
- Transition Basics
- Transform Properties
- Timing Functions
- Hover & Focus Effects
- Responsive Transitions
- Accessibility (motion-safe/motion-reduce)

---

## Transition Basics

### Core Transition Properties

```tsx
// Basic transition
<button className="transition duration-300 hover:scale-105">
  Hover me
</button>

// Specific properties (better performance)
<div className="transition-colors duration-200 hover:bg-blue-500">
  Color transition
</div>

<div className="transition-transform duration-300 hover:translate-y-1">
  Transform transition
</div>

<div className="transition-opacity duration-500 hover:opacity-50">
  Opacity transition
</div>
```

### Available Transition Properties

```tsx
// transition (all properties)
className="transition"

// Specific properties (recommended for performance)
className="transition-colors"      // background, border, text colors
className="transition-opacity"     // opacity only
className="transition-shadow"      // box-shadow
className="transition-transform"   // transforms (scale, rotate, translate)
className="transition-all"         // all properties (use sparingly)

// Multiple properties
className="transition-[color,transform]"
```

### Duration

```tsx
// Preset durations
className="duration-75"    // 75ms
className="duration-100"   // 100ms
className="duration-150"   // 150ms (default)
className="duration-200"   // 200ms
className="duration-300"   // 300ms (common)
className="duration-500"   // 500ms
className="duration-700"   // 700ms
className="duration-1000"  // 1000ms (1s)

// Custom duration with bracket notation
className="duration-[2s]"
className="duration-[350ms]"

// Different durations for enter/exit (Tailwind v4+)
className="duration-[300ms,500ms]"  // enter: 300ms, exit: 500ms
```

### Timing Functions (Easing)

```tsx
// Preset easing functions
className="ease-linear"       // constant speed
className="ease-in"          // slow start, fast end
className="ease-out"         // fast start, slow end (common for exits)
className="ease-in-out"      // slow start and end (common for entrances)

// Custom cubic-bezier
className="ease-[cubic-bezier(0.4,0,0.2,1)]"

// Example: smooth button
<button className="transition-all duration-300 ease-out hover:scale-105">
  Click me
</button>
```

### Delay

```tsx
// Preset delays
className="delay-75"
className="delay-100"
className="delay-150"
className="delay-200"
className="delay-300"
className="delay-500"
className="delay-700"
className="delay-1000"

// Custom delay
className="delay-[2s]"

// Example: staggered list items
{items.map((item, i) => (
  <li
    key={item.id}
    className={`transition-opacity duration-300 delay-[${i * 100}ms]`}
  >
    {item.name}
  </li>
))}
```

---

## Transform Properties

### Scale

```tsx
// Uniform scale
className="scale-0"      // 0%
className="scale-50"     // 50%
className="scale-75"     // 75%
className="scale-90"     // 90%
className="scale-95"     // 95%
className="scale-100"    // 100% (default)
className="scale-105"    // 105%
className="scale-110"    // 110%
className="scale-125"    // 125%
className="scale-150"    // 150%

// Custom scale
className="scale-[1.15]"

// Axis-specific scale
className="scale-x-110"  // horizontal only
className="scale-y-90"   // vertical only

// Example: button press effect
<button className="transition-transform active:scale-95">
  Press me
</button>
```

### Rotate

```tsx
// Degrees
className="rotate-0"
className="rotate-1"     // 1deg
className="rotate-3"     // 3deg
className="rotate-6"     // 6deg
className="rotate-12"    // 12deg
className="rotate-45"    // 45deg
className="rotate-90"    // 90deg
className="rotate-180"   // 180deg

// Negative rotation
className="-rotate-45"

// Custom rotation
className="rotate-[17deg]"

// Example: loading spinner
<div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
```

### Translate

```tsx
// Translate X (horizontal)
className="translate-x-0"
className="translate-x-1"     // 0.25rem (4px)
className="translate-x-2"     // 0.5rem (8px)
className="translate-x-4"     // 1rem (16px)
className="translate-x-full"  // 100%
className="-translate-x-full" // -100%

// Translate Y (vertical)
className="translate-y-0"
className="translate-y-1"
className="translate-y-2"
className="translate-y-full"
className="-translate-y-full"

// Custom translate
className="translate-x-[13px]"
className="translate-y-[2.5rem]"

// Example: slide-in from bottom
<div className="translate-y-full transition-transform duration-500 hover:translate-y-0">
  Slide up
</div>
```

### Skew

```tsx
// Skew X
className="skew-x-0"
className="skew-x-3"
className="skew-x-6"
className="skew-x-12"
className="-skew-x-12"

// Skew Y
className="skew-y-3"
className="skew-y-6"

// Example: card tilt on hover
<div className="transition-transform hover:skew-y-1">
  Tilted card
</div>
```

### Transform Origin

```tsx
// Preset origins
className="origin-center"      // default
className="origin-top"
className="origin-top-right"
className="origin-right"
className="origin-bottom-right"
className="origin-bottom"
className="origin-bottom-left"
className="origin-left"
className="origin-top-left"

// Example: rotate from corner
<div className="origin-top-left transition-transform hover:rotate-12">
  Rotate from top-left
</div>
```

---

## Hover & Focus Effects

### Hover State

```tsx
// Basic hover
<button className="hover:bg-blue-500 hover:text-white transition-colors">
  Hover me
</button>

// Multiple transforms on hover
<div className="transition-all hover:scale-105 hover:shadow-lg hover:-translate-y-1">
  Lift on hover
</div>

// Hover with smooth color transition
<a className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
  Link
</a>
```

### Focus State

```tsx
// Focus ring with transition
<input
  className="border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
/>

// Focus scale
<button className="focus:scale-105 transition-transform">
  Focus me
</button>
```

### Active State

```tsx
// Button press effect
<button className="active:scale-95 transition-transform">
  Press me
</button>

// Active with color change
<button className="bg-blue-500 active:bg-blue-700 transition-colors">
  Click
</button>
```

### Group Hover

```tsx
// Parent hover affects children
<div className="group">
  <img className="group-hover:scale-110 transition-transform" />
  <h3 className="group-hover:text-blue-500 transition-colors">Title</h3>
</div>
```

---

## Responsive Transitions

```tsx
// Different transitions per breakpoint
<div className="
  transition-transform
  duration-300 md:duration-500
  hover:scale-105 md:hover:scale-110
  hover:rotate-3 md:hover:rotate-6
">
  Responsive animation
</div>

// Disable transition on mobile
<button className="md:transition-transform md:hover:scale-105">
  Desktop only transition
</button>
```

---

## Accessibility: Motion Safe & Motion Reduce

### Respecting User Preferences

```tsx
// Only animate if user hasn't requested reduced motion
<div className="motion-safe:transition-transform motion-safe:hover:scale-105">
  Respects prefers-reduced-motion
</div>

// Provide alternative for reduced motion
<div className="
  motion-safe:transition-transform motion-safe:hover:scale-105
  motion-reduce:hover:bg-gray-100
">
  Scale on hover (or bg change if motion disabled)
</div>

// Different animations based on preference
<div className="
  motion-safe:animate-spin
  motion-reduce:animate-pulse
">
  Spinner (or pulse if motion disabled)
</div>
```

### Real Example: Card Component

```tsx
interface CardProps {
  title: string;
  description: string;
}

export const Card = ({ title, description }: CardProps) => {
  return (
    <div className="
      group
      p-6 rounded-lg border border-gray-200 bg-white
      motion-safe:transition-all motion-safe:duration-300
      motion-safe:hover:scale-105 motion-safe:hover:shadow-lg motion-safe:hover:-translate-y-1
      motion-reduce:hover:border-blue-500
      cursor-pointer
    ">
      <h3 className="
        text-xl font-bold mb-2
        group-hover:text-blue-600
        motion-safe:transition-colors
      ">
        {title}
      </h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};
```

---

## Performance Tips

### DO: Animate These (GPU Accelerated)

✅ `transform` (scale, rotate, translate)
✅ `opacity`
✅ `filter` (with caution)

### DON'T: Avoid Animating These

❌ `width` / `height` (causes reflow)
❌ `margin` / `padding` (causes reflow)
❌ `top` / `left` / `right` / `bottom` (use `translate` instead)

### Optimize Transitions

```tsx
// ❌ Bad: animates all properties
<div className="transition-all hover:scale-105 hover:bg-blue-500">
  Inefficient
</div>

// ✅ Good: specific properties
<div className="transition-[transform,background-color] hover:scale-105 hover:bg-blue-500">
  Optimized
</div>

// ✅ Even better: separate transitions
<div className="transition-transform duration-300 transition-colors duration-200 hover:scale-105 hover:bg-blue-500">
  Fully optimized
</div>
```

---

## Common Patterns

### Lift on Hover (Card)

```tsx
<div className="
  transition-all duration-300
  hover:scale-105 hover:shadow-xl hover:-translate-y-2
">
  Card content
</div>
```

### Smooth Color Change

```tsx
<button className="
  bg-blue-500 text-white
  hover:bg-blue-600
  transition-colors duration-200
">
  Button
</button>
```

### Fade In/Out

```tsx
<div className="opacity-0 hover:opacity-100 transition-opacity duration-500">
  Fade in on hover
</div>
```

### Slide From Side

```tsx
// Slide in from left
<div className="-translate-x-full opacity-0 transition-all duration-500 hover:translate-x-0 hover:opacity-100">
  Slide in
</div>
```

### Rotate on Hover

```tsx
<button className="transition-transform duration-300 hover:rotate-12">
  Tilt me
</button>
```

### Loading Button

```tsx
<button
  disabled={isLoading}
  className="
    relative
    transition-opacity
    disabled:opacity-50
  "
>
  {isLoading && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
    </div>
  )}
  <span className={isLoading ? 'invisible' : ''}>
    Submit
  </span>
</button>
```
