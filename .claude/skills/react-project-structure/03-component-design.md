# Component Design & Colocation

La organización interna de los componentes influye en la mantenibilidad y testabilidad.

## 1. Separation of Concerns (Pattérn Container/Dumb)

Es clave separar la lógica compleja (data fetching, state) de la UI.

### Presentational Components (Dumb)
*   **Props**: Data, Callbacks (`onSubmit`).
*   **No hooks de negocio** (solo visuales si acaso).
*   **Fácilmente reutilizable y testeable**.

```typescript
// features/products/components/ProductCard.tsx
interface Props {
  product: Product;
  onAddToCart: (id: string) => void;
}

export function ProductCard({ product, onAddToCart }: Props) {
  return (
    <div className="card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <Button onClick={() => onAddToCart(product.id)}>Add</Button>
    </div>
  );
}
```

### Container Components (Smart) / Page
*   **Props**: Mínimas o ningunas (se conectan a store/params).
*   **Orquesta la lógica**: llama hooks, services.

```typescript
// app/products/[id]/page.tsx (o un container separado)
import { useCart } from '@/features/cart'; // Hook de otra feature
import { useProduct } from '@/features/products';
import { ProductCard } from '@/features/products/components/ProductCard';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: product, isLoading } = useProduct(params.id);
  const { addToCart } = useCart();

  if (isLoading) return <Spinner />;

  return (
    <ProductCard 
      product={product} 
      onAddToCart={addToCart} // Conecta la lógica
    />
  );
}
```

## 2. Colocation (Archivos Relacionados Juntos)

Mantén todo lo relevante para un componente en su carpeta.

```
src/features/auth/components/LoginForm/
├── LoginForm.tsx      # Componente principal
├── LoginForm.test.tsx # Tests unitarios de LoginForm
├── LoginForm.module.css # Estilos (si usas CSS Modules)
├── types.ts           # Tipos específicos del form
├── hooks/             # useLoginForm (si es complejo)
└── index.ts           # Export (opcional)
```

Esto hace que borrar o modificar `LoginForm` sea trivial (borras la carpeta y listo).

### Tests y Historias

Si usas Storybook, las stories van aquí también (`LoginForm.stories.tsx`).

## 3. Atomic Design Adaptado

No te obsesiones con "Atomic" puro. Usar `ui/` para componentes base y `features/` para negocio funciona mejor.

*   **UI Library (`src/components/ui`)**: Botones, Modales, Inputs (Genéricos).
*   **Feature Components (`src/features/*/components`)**: LoginButton, ProductCard (Específicos).
*   **Page Components (`src/app`)**: DashboardView, ProfilePage (Composición).
