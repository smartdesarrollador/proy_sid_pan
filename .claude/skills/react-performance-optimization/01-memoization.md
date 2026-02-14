# Estrategias de Memoización y Renderizado

La memoización es una potente herramienta para evitar re-renderizados innecesarios, pero debe usarse con precaución. Aquí aprenderás cuándo y cómo usar `React.memo`, `useMemo` y `useCallback` en TypeScript.

## 1. React.memo

Evita que un componente funcional se re-renderice si sus props no han cambiado.

### Cuándo Usar
*   Componentes puros (mismis props -> mismos render).
*   Componentes que se re-renderizan frecuentemente con las mismas props.
*   Componentes grandes o costosos de renderizar.

### Cuándo NO Usar
*   Componentes muy simples (el costo de comparación puede superar el ahorro).
*   Componentes cuyas props cambian en casi todos los renders.

### Comparación: Shallow vs Deep

Por defecto, `React.memo` hace una comparación superficial (`shallow compare`). Si pasas objetos o funciones nuevas en cada render del padre, `React.memo` fallará.

**Mala Práctica (Objeto nuevo en cada render):**

```tsx
// ParentComponent.tsx
import React from 'react';
import { ExpensiveComponent } from './ExpensiveComponent';

export const ParentComponent = () => {
  // 🔴 INCORRECTO: style se recrea en cada render, invalidando React.memo
  const style = { color: 'red' }; 
  
  return <ExpensiveComponent style={style} />;
};
```

**Buena Práctica (Objeto estable):**

```tsx
// ParentComponent.tsx
import React, { useMemo } from 'react';
import { ExpensiveComponent } from './ExpensiveComponent';

export const ParentComponent = () => {
  // ✅ CORRECTO: style es estable entre renders
  const style = useMemo(() => ({ color: 'red' }), []);
  
  return <ExpensiveComponent style={style} />;
};
```

### Custom Comparison Function

Si necesitas una lógica de comparación compleja (deep compare), puedes pasar una función como segundo argumento.

```tsx
interface Props {
  data: { id: number; value: string };
}

const areEqual = (prevProps: Props, nextProps: Props) => {
  return prevProps.data.id === nextProps.data.id; // Solo compara IDs
};

export const Deep memoizedComponent = React.memo((props: Props) => {
  console.log('Rendering DeepMemoizedComponent');
  return <div>{props.data.value}</div>;
}, areEqual);
```

## 2. useMemo

Memoriza el resultado de un cálculo costoso.

### Dependencias Correctas
El array de dependencias debe incluir *todas* las variables externas usadas dentro del callback.

### Cuándo Usar
*   Cálculos pesados (filtrado/ordenamiento de listas grandes).
*   Para estabilizar referencias de objetos pasados a componentes memoizados (`React.memo`) o hooks (`useEffect`).

### Ejemplo Real

**Antes (Sin optimización):**

```tsx
const ListComponent = ({ list, filterText }: { list: string[], filterText: string }) => {
  // 🔴 Costoso: se ejecuta en cada render
  const filteredList = list.filter(item => item.includes(filterText));
  
  return (
    <ul>
      {filteredList.map(item => <li key={item}>{item}</li>)}
    </ul>
  );
};
```

**Después (Con useMemo):**

```tsx
import { useMemo } from 'react';

const ListComponent = ({ list, filterText }: { list: string[], filterText: string }) => {
  // ✅ Optimizado: Solo se recalcula si list o filterText cambian
  const filteredList = useMemo(() => {
    console.time('Filtering');
    const result = list.filter(item => item.includes(filterText));
    console.timeEnd('Filtering'); // Métrica real en consola
    return result;
  }, [list, filterText]);
  
  return (
    <ul>
      {filteredList.map(item => <li key={item}>{item}</li>)}
    </ul>
  );
};
```

**Métricas:**
*   Sin `useMemo`: Filtrado de 10k items -> ~15ms en cada render.
*   Con `useMemo`: 0ms en renders donde `list` y `filterText` no cambian.

## 3. useCallback

Memoriza la definición de una función.

### Casos de Uso Reales
*   Pasar callbacks a componentes hijos optimizados con `React.memo`. (Sin `useCallback`, la función se recrea, cambiando la prop y forzando el render del hijo).
*   Dependencias de `useEffect`.

**Ejemplo de Optimización de Event Handler:**

```tsx
import React, { useState, useCallback } from 'react';

// Hijo memoizado
const Button = React.memo(({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => {
  console.log(`Rendering Button: ${children}`);
  return <button onClick={onClick}>{children}</button>;
});

export const CounterApp = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // 🔴 Esta función se recrea cada vez que 'text' cambia (o cualquier state),
  // causando que el botón "Increment" se re-renderice innecesariamente.
  const badIncrement = () => setCount(c => c + 1);

  // ✅ Esta función es estable y no cambia entre renders a menos que sus deps cambien (ninguna aquí).
  const goodIncrement = useCallback(() => {
    setCount(prevCount => prevCount + 1);
  }, []); // Dependencias vacías porque usamos functional update

  return (
    <div>
      <h1>Count: {count}</h1>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="Type something..." />
      
      {/* Se re-renderiza al escribir en el input */}
      <Button onClick={badIncrement}>Bad Increment</Button>
      
      {/* NO se re-renderiza al escribir en el input */}
      <Button onClick={goodIncrement}>Good Increment</Button>
    </div>
  );
};
```
