# Streaming & SSR

El renderizado tradicional SSR envía *todo* el HTML al cliente de una sola vez. Con Streaming SSR (React 18 / Next.js), puedes enviar trozos (chunks) de HTML a medida que están listos.

## 1. Streaming SSR en Next.js (App Router)

Es el estándar en Next.js 13+.

### Cómo funciona
1.  Servidor comienza a renderizar `<RootLayout>`.
2.  Encuentra `<Suspense>` boundaries.
3.  Envía inmediatamente el HTML estático (Header, Footer) y el **fallback** del Suspense (Shell/Skeleton) al navegador.
4.  El navegador muestra la UI inicial.
5.  Servidor continúa fetcheando datos para el contenido suspendido.
6.  Cuando los datos están listos, el servidor envía el HTML restante y un script (`<script>`) para inyectarlo en el lugar correcto.
7.  React hidrata *selectivamente* esa parte.

### Archivo `loading.tsx`

Crea automáticamente un Suspense Boundary alrededor de la página.

**Estructura:**
```
app/
  dashboard/
    page.tsx      (Async Component, fetch lento)
    loading.tsx   (Componente síncrono, skeleton)
    layout.tsx
```

**loading.tsx:**
```tsx
export default function Loading() {
  return <div className="skeleton-loader">Cargando Dashboard...</div>;
}

// Next.js lo compila a algo como:
// <Layout>
//   <Suspense fallback={<Loading />}>
//     <Page />
//   </Suspense>
// </Layout>
```

**page.tsx:**
```tsx
import { Suspense } from 'react';
import { RevenueChart } from './components/RevenueChart';

export default async function DashboardPage() {
  // El layout y loading.tsx se muestran AL INSTANTE.
  // Esta página espera a que la data principal (quizás user info) esté lista.
  const user = await getUser();

  return (
    <main>
      <h1>Welcome, {user.name}</h1>
      
      {/* Streaming Granular: RevenueChart carga INDEPENDIE del resto de la página */}
      <Suspense fallback={<ChartSkeleton />}>
        {/* Componente que hace su propio fetch async */}
        <RevenueChart />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <RecentTransactions />
      </Suspense>
    </main>
  );
}
```

## 2. Progressive Hydration

React no necesita esperar a que *todo* el JS de la página cargue para hacerla interactiva.

*   **Selective Hydration**: Si el usuario hace click en un botón dentro de una zona (Suspense boundary) que ya cargó HTML pero aún no hidrató JS, React prioriza descargar e hidratar *esa* zona específica primero.

### Ejemplo Visual

1.  **Server**: Envía HTML de Header + Sidebar + Skeletons de Main Content.
2.  **Browser**: Pinta Header + Sidebar (no interactivo aún) + Skeletons.
3.  **Server**: Termina fetch de Main Content -> Envía HTML real.
4.  **Browser**: Reemplaza Skeletons por HTML real.
5.  **Browser**: Empieza a descargar JS. (Hydration).
6.  **User**: Click en Sidebar (aún no hidratado).
7.  **React**: "Oh, el usuario quiere interactuar con Sidebar. ¡Prioriza hidratar Sidebar antes que Main Content!"
