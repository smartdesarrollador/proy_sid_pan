# Advanced Loading Patterns

Para mejorar la UX percibida, no basta con usar `Suspense` y spinners. Hay estrategias superiores.

## 1. Skeleton UI Strategies

Reemplaza spinners con "esqueletos" que imitan el layout del contenido final.

**Best Practices:**
*   **Color**: Gris claro con animación pulsante (`#f3f4f6`).
*   **Dimensions**: Altura/Anchura fija para evitar *Layout Shift* (CLS).
*   **Component Composition**: Crea componentes Skeleton reutilizables (CardSkeleton, TableSkeleton).

### Ejemplo con CSS y Animación

```css
/* keyframes */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton {
  background-color: #eee;
  overflow: hidden;
  position: relative;
}

.skeleton::after {
  content: "";
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(255, 255, 255, 0.5), 
    transparent
  );
  transform: translateX(-100%);
  animation: shimmer 1.5s infinite;
}
```

## 2. Optimistic UI

Muestra el resultado *exitoso* de una acción (mutación) **antes** de que el servidor confirme la operación.

**TanStack Query Example:**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const LikeButton = ({ postId }: { postId: string }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: likePostApi,
    // 1. Antes de ejecutar la mutación
    onMutate: async () => {
      // Cancelar queries en curso para evitar sobrescrituras
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // Guardar snapshot del estado previo (rollback)
      const previousPost = queryClient.getQueryData(['post', postId]);

      // ✅ Actualizar cache optimísticamente: "Ya le di like"
      queryClient.setQueryData(['post', postId], (old: any) => ({
        ...old,
        likes: old.likes + 1,
        likedByUser: true,
      }));

      return { previousPost };
    },
    // 2. Si hay error
    onError: (err, newTodo, context) => {
      // Rollback con el snapshot guardado
      queryClient.setQueryData(['post', postId], context?.previousPost);
    },
    // 3. Siempre (refetch para asegurar consistencia real)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  return (
    <button onClick={() => mutation.mutate()}>
      {/* Feedback inmediato: El contador sube INSTANTÁNEAMENTE */}
      Like
    </button>
  );
};
```

## 3. Progressive Content Reveal

No muestres todo de golpe si una parte es muy lenta.

### Staggered Loading (Escalonado)
Si tienes una lista de cards, puede ser visualmente agradable que aparezcan una tras otra con un pequeño delay (aunque ya estén cargadas), o mostrarlas en grupos.

**Implementación con `framer-motion` (Opcional):**

```tsx
<motion.ul initial="hidden" animate="visible" variants={listVariants}>
  {items.map(item => (
    <motion.li variants={itemVariants} key={item.id}>
      <Card item={item} />
    </motion.li>
  ))}
</motion.ul>
```

**Con Suspense Anidado:**
```tsx
<Suspense fallback={<HeaderSkeleton />}>
  <Header /> {/* Carga rápido */}
  
  <Suspense fallback={<MainSkeleton />}> 
    <MainContent /> {/* Carga medio */}
    
    <Suspense fallback={<FooterSkeleton />}>
      <Footer /> {/* Carga lento (ej. analytics/ads) */}
    </Suspense>
  </Suspense>
</Suspense>
```
Esto asegura que el Footer nunca aparezca antes que el MainContent, manteniendo una jerarquía visual lógica.
