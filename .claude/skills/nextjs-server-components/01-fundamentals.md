# Fundamentos de RSC

Por defecto, en Next.js (App Router), todos los componentes son **Server Components**. No necesitas añadir `'use server'` a los componentes (eso es para Server Actions).

## 1. Server vs Client Components

| Característica | Server Component (Default) | Client Component (`throw` 'use client') |
| :--- | :--- | :--- |
| **Fetch Data** | ✅ Directo (Queries DB, APIs) | ❌ Indirecto (via API routes o Server Actions) |
| **Backend Access** | ✅ Filesystem, Secret keys | ❌ Prohibido (inseguro) |
| **Interactivity** | ❌ No onClick, onChange | ✅ hooks (useState, useEffect), eventos |
| **Bundle Size** | 📉 0 KB JS enviado al cliente | 📈 JS descargado e hidratado |
| **Async/Await** | ✅ Soportado | ❌ No soportado (aún) en render |

## 2. Async Server Components

En RSC, puedes usar `async/await` directamente en el cuerpo del componente para hacer data fetching.

```tsx
// app/dashboard/page.tsx
import { db } from '@/lib/db';

// ✅ Async Component
export default async function DashboardPage() {
  // Fetch data directo (sin API route intermedia)
  const users = await db.user.findMany();

  return (
    <main>
      <h1>Usuarios</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

### Parallel Data Fetching

Si tienes múltiples promesas independientes, usa `Promise.all` para evitar cascadas ("waterfalls").

```tsx
async function Page({ params }: { params: { id: string } }) {
  // ⚡ Ejecuta en paralelo
  const [user, posts] = await Promise.all([
    getUser(params.id),
    getPosts(params.id)
  ]);

  return <UserProfile user={user} posts={posts} />;
}
```

## 3. Server-Only Code (`server-only`)

Para prevenir que código sensible (ej. conexión DB, API keys) se filtre accidentalmente al cliente, usa el paquete `server-only`.

**Instalación:**
```bash
npm install server-only
```

**Uso:**

```typescript
// lib/data.ts
import 'server-only'; // 🚨 Build fallará si este archivo se importa en un componente cliente

export async function getData() {
  const apiKey = process.env.API_SECRET;
  // ... lógica segura
}
```

Esto asegura que si alguien hace `import { getData } from '@/lib/data'` dentro de un componente con `'use client'`, el build falle inmediatamente.
