# Component Variants Pattern

Guía completa del variants pattern para componentes Tailwind con TypeScript, clsx y CVA (Class Variance Authority).

## clsx + tailwind-merge (cn utility)

### Instalación

```bash
npm install clsx tailwind-merge
```

### cn Utility

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Beneficios:**
- `clsx`: Clases condicionales
- `twMerge`: Resuelve conflictos Tailwind

**Ejemplo:**
```ts
cn('px-4', 'px-6') // → 'px-6' (último gana)
cn('px-4', undefined, 'py-2') // → 'px-4 py-2'
cn({ 'text-red-500': isError }) // → 'text-red-500' si isError
```

## Button con Variants Manual

```tsx
// src/components/Button.tsx
import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',

          // Variants
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'border border-gray-300 hover:bg-gray-100': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
          },

          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
```

## CVA (Class Variance Authority)

### Instalación

```bash
npm install class-variance-authority
```

### Button con CVA

```tsx
// src/components/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
        outline:
          'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
export { buttonVariants };
```

**Beneficios CVA:**
- ✅ Type-safe variants
- ✅ Default variants
- ✅ Compound variants
- ✅ Exportable variants (reusable)

### Compound Variants

```tsx
const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-200',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
    loading: {
      true: 'opacity-50 cursor-wait',
    },
  },
  compoundVariants: [
    // Primary + Large = más padding
    {
      variant: 'primary',
      size: 'lg',
      class: 'px-8',
    },
  ],
  defaultVariants: {
    variant: 'primary',
    size: 'sm',
    loading: false,
  },
});
```

## Badge Component

```tsx
// src/components/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        outline:
          'border border-gray-300 bg-transparent text-gray-700 dark:border-gray-700 dark:text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export default function Badge({ variant, className, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

## Input Variants

```tsx
// src/components/Input.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-white px-3 py-2 text-sm',
    'placeholder:text-gray-400',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:ring-blue-600',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      inputSize: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant, inputSize, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ variant, inputSize }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
```

## Best Practices

### ✅ Do's
1. **Use CVA** para múltiples variants
2. **Export variants** para reusabilidad
3. **Default variants** para props opcionales
4. **Type-safe** con VariantProps
5. **forwardRef** para ref forwarding
6. **displayName** para debugging

### ❌ Don'ts
1. NO hardcodear clases sin cn()
2. NO omitir defaultVariants
3. NO abusar de compound variants
4. NO inline styles (usar Tailwind)

## Resumen

Variants pattern con Tailwind:
- ✅ cn() para clases condicionales
- ✅ CVA para type-safe variants
- ✅ Compound variants para combinaciones
- ✅ Export variants para reusabilidad
- ✅ forwardRef + TypeScript strict
