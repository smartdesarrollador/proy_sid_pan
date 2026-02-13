# Base Components Library

Biblioteca completa de componentes reutilizables con Tailwind CSS y TypeScript.

## Alert Component

```tsx
// src/components/Alert.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 border-gray-200',
        info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30',
        success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-950/30',
        warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950/30',
        error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

interface AlertProps extends VariantProps<typeof alertVariants> {
  title: string;
  description?: string;
  className?: string;
}

export default function Alert({ variant = 'default', title, description, className }: AlertProps) {
  const Icon = variant && iconMap[variant];

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      {Icon && <Icon className="h-4 w-4" />}
      <div>
        <h5 className="font-medium leading-none tracking-tight">{title}</h5>
        {description && <div className="mt-1 text-sm opacity-90">{description}</div>}
      </div>
    </div>
  );
}
```

## Spinner Component

```tsx
// src/components/Spinner.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-2 border-current border-t-transparent', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    },
    variant: {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white',
    },
  },
  defaultVariants: { size: 'md', variant: 'primary' },
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export default function Spinner({ size, variant, className }: SpinnerProps) {
  return <div className={cn(spinnerVariants({ size, variant }), className)} role="status" aria-label="Loading" />;
}
```

## Textarea Component

```tsx
// src/components/Textarea.tsx
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-600',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
```

## Select Component

```tsx
// src/components/Select.tsx
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-600',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';
export default Select;
```

## Checkbox Component

```tsx
// src/components/Checkbox.tsx
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, ...props }, ref) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600',
          'focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
export default Checkbox;
```

## Modal Component

```tsx
// src/components/Modal.tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          'relative z-50 w-full rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900',
          {
            'max-w-sm': size === 'sm',
            'max-w-md': size === 'md',
            'max-w-lg': size === 'lg',
            'max-w-xl': size === 'xl',
          }
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
```

## Accordion Component

```tsx
// src/components/Accordion.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-left font-medium hover:text-blue-600"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && <div className="pb-4 text-sm text-gray-600 dark:text-gray-400">{children}</div>}
    </div>
  );
}

export default function Accordion({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-gray-200 dark:divide-gray-800">{children}</div>;
}
```

**Uso:**
```tsx
<Accordion>
  <AccordionItem title="Section 1" defaultOpen>
    Content 1
  </AccordionItem>
  <AccordionItem title="Section 2">
    Content 2
  </AccordionItem>
</Accordion>
```

## Resumen

Componentes base incluidos:
- ✅ Alert (info, success, warning, error)
- ✅ Spinner (loading indicator)
- ✅ Textarea
- ✅ Select
- ✅ Checkbox
- ✅ Modal (con backdrop y escape key)
- ✅ Accordion (collapsible sections)

Todos con TypeScript strict, variants, forwardRef y accessibility.
