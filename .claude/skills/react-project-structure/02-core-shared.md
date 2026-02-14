# Core & Shared Layers

Organiza las capas base de tu aplicación: Utilidades, Hooks globales y componentes UI reutilizables.

## 1. Path Aliases (`tsconfig.json`)

Los aliases son esenciales para imports limpios. Evita `../../../../components/Button`.

### Configuración Recomendada

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/lib/*": ["src/lib/*"],
      "@/types/*": ["src/types/*"]
    }
  }
}
```

Configura tu bundler (Next.js/Vite) para que entienda esto. En Next.js es automático.

**Ejemplo de Import:**
```typescript
import { Button } from '@/components/ui/Button'; // ✅ Limpio
import { useAuth } from '@/features/auth';        // ✅ Limpio
```

## 2. Componentes UI Compartidos (`components/ui`)

Esta carpeta es tu **Design System** interno. Aquí viven los componentes "tontos" (sin lógica de negocio).

*   **Atomic Design Simplificado**:
    *   `/atoms`: `Button`, `Input`, `Label`, `Spinner`.
    *   `/molecules`: `FormField`, `Card`, `Modal` (compuestos por átomos).
    *   `/organisms`: `Header`, `Sidebar` (menos comunes aquí, a veces van a features).

**Ejemplo (`components/ui/Button.tsx`):**
```typescript
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Función merge de clases

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: { /* ... */ },
    defaultVariants: { /* ... */ },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
};
```

## 3. Barrel Exports (`index.ts`) y Tree-Shaking

Los archivos `index.ts` (Barrels) simplifican imports, pero úsalos con cuidado.

### 🚫 Mal Uso (Import Circular)
```typescript
// components/index.ts
export * from './Button';
export * from './Input';
export * from './Card'; // Si Card importa Button -> Circular Dependency posible
```

### ✅ Buen Uso (Feature Boundary)
Usa Barrels solo para **Public APIs** de features o categorías grandes (`components/ui/index.ts`).

Next.js y Vite hacen **Tree-Shaking** eficiente. Si importas `import { Button } from '@/components/ui'`, solo se incluirá `Button` en el bundle final (si están configurados correctamente como módulos ES).
