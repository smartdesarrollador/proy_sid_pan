# Arquitectura Híbrida & Patrones

Next.js te permite mezclar Server Components y Client Components de forma inteligente.

## 1. Client Components (`'use client'`)

Solo usa esta directiva **en los componentes que interactúan con el DOM** (onClick, onChange, hooks). Los componentes que solo renderizan UI deberían ser Server Components.

```tsx
'use client'; // ✅ Úsalo solo al inicio del archivo
import { useState } from 'react';

// Si no necesitas state, useEffect o eventos, ¡quítalo!
export default function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## 2. Server vs Client Composition Patterns

No puedes importar un Server Component dentro de un Client Component directamente.

### 🚫 Patrón Incorrecto

```tsx
// app/client-component.tsx
'use client';
import ServerComponent from './server-component'; // ❌ Error o Client Component será hidratado

export default function ClientWrapper() {
  return (
    <div>
      <ServerComponent /> {/* Esto fallará o funcionará mal */}
    </div>
  );
}
```

### ✅ Patrón Correcto (Children Props)

Pasa el Server Component como `children` al Client Component.

**Client Component (`Counter.tsx`):**
```tsx
'use client';

export default function Counter({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      {/* El contenido servidor se renderiza aquí */}
      {children}
    </div>
  );
}
```

**Page (Server Component):**
```tsx
// app/page.tsx
import Counter from './components/Counter';
import ServerContent from './components/ServerContent'; // Server Component

export default function Page() {
  return (
    <Counter>
      {/* ✅ ServerContent se renderiza en servidor y se pasa como HTML estático al cliente */}
      <ServerContent />
    </Counter>
  );
}
```

## 3. Props Serialization

Cuando pasas props de un Server Component a un Client Component, estas **deben ser serializables** (JSON.stringify-safe).

**✅ Prop Permitidas:**
*   Strings, números, booleanos, null, undefined.
*   Objetos planos, Arrays.
*   Server Actions (funciones marcadas con `'use server'`).

**🚫 Prop Prohibidas:**
*   Funciones (salvo Server Actions).
*   Instancias de clases complejas.
*   `Date` objects (conviértelos a string `date.toISOString()`).

### Ejemplo de "Date" Error

```tsx
// ❌ Error: Props must be serializable for components in the "use client" entry file.
<ClientTime timestamp={new Date()} />

// ✅ Correcto: Serializable Primitive type
<ClientTime timestamp={new Date().toISOString()} />
```
