# Concurrent UX Hooks

React 18 introdujo hooks para manejar renderizaciones costosas o lentas sin bloquear la interacción del usuario.

## 1. useTransition (Transiciones No Bloqueantes)

Permite marcar una actualización de estado como "no urgente". Si el usuario interactúa mientras React está renderizando la transición, React pausará la transición para manejar la interacción urgente (input, click).

**Escenario Común:** Filtrar una lista grande o cambiar de tab.

```tsx
import { useState, useTransition, useDeferredValue } from 'react';

const LargeList = ({ filter }: { filter: string }) => {
  // Simulación de render costoso (artificialmente lento)
  const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
  const filtered = items.filter(i => i.includes(filter));
  return <ul>{filtered.map(i => <li key={i}>{i}</li>)}</ul>;
};

export const FilterApp = () => {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Actualiza el input inmediatamente (urgente)
    // setInput(e.target.value); 🔴 Esto bloquearía el UI si LargeList re-renderiza

    // 2. Usando startTransition
    // El input se actualiza YA, pero la lista se actualiza cuando pueda.
    startTransition(() => {
      setInput(e.target.value);
    });
  };

  return (
    <div>
      <input 
        onChange={handleChange} 
        placeholder="Escribe para filtrar (no bloquea UI)..." 
      />
      
      {/* Indicador de carga suti (opcional) */}
      {isPending && <span style={{ opacity: 0.5 }}>Actualizando lista...</span>}
      
      <LargeList filter={input} />
    </div>
  );
};
```

## 2. useDeferredValue (Defer de Valores)

Similar a `useTransition`, pero para cuando recibes un valor (props) y quieres "aplazar" su uso en partes costosas de la UI. Útil para debouncing *integrado en React*.

**Diferencia Clave:** `useTransition` envuelve la acción (`setState`), `useDeferredValue` envuelve el valor.

```tsx
const SearchResults = ({ query }: { query: string }) => {
  // Si `query` cambia rápido ('r', 're', 'rea'...), `deferredQuery` se quedará atrás 
  // hasta que React tenga tiempo de procesar el renderizado costoso.
  const deferredQuery = useDeferredValue(query);

  // Renderiza la lista con el valor "antiguo" hasta que el nuevo esté listo
  // (evita parpadeos de loading)
  
  // Puedes mostrar loading state si los valores difieren
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      <HeavyComponent query={deferredQuery} />
    </div>
  );
};
```

## 3. Concurrent Rendering Prioridades

### Automatic Batching
En React 18, *todas* las actualizaciones de estado dentro de event handlers, promesas,setTimeouts, etc., se agrupan en un solo render.

**Antes (React 17):**
```js
setTimeout(() => {
  setCount(c => c + 1); // Render 1
  setFlag(f => !f);     // Render 2
}, 1000);
```

**Ahora (React 18):**
```js
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React espera al final del callback -> Solo 1 Render
}, 1000);
```

### Suspense for Data Fetching Prioritization

React prioriza las interacciones de usuario (clicks, tipeo) sobre las actualizaciones de Suspense. Si un usuario hace click en un botón mientras se carga una query de Suspense en background, el click se procesa inmediatamente.
