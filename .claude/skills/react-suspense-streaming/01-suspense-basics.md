# Suspense Fundamentals

React Suspense permite que tus componentes esperen por algo (datos, código, etc.) antes de renderizarse.

## 1. Concepto y Fallback UI

`Suspense` define un límite (boundary) alrededor de componentes que pueden suspenderse. Mientras esperan, React renderiza el `fallback`.

```tsx
import React, { Suspense } from 'react';
import { Spinner } from './components/Spinner';

const UserProfile = React.lazy(() => import('./UserProfile'));

export const App = () => {
  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {/* Boundary: Si UserProfile se suspende (cargando código o datos),
          se muestra el Spinner */}
      <Suspense fallback={<Spinner size="large" />}>
        <UserProfile userId="123" />
      </Suspense>
    </div>
  );
};
```

## 2. Lazy Components (Code Splitting)

`React.lazy` permite cargar componentes dinámicamente solo cuando se necesitan.

### Basic Usage

```tsx
// 🔴 Import estático (bloquea el bundle inicial)
// import HeavyChart from './HeavyChart';

// ✅ Lazy Import (se carga en un chunk separado)
const HeavyChart = React.lazy(() => import('./HeavyChart'));
```

### Dynamic Imports con Delay Artificial (Para testing)

```tsx
const DelayedComponent = React.lazy(() => {
  return new Promise(resolve => {
    setTimeout(() => resolve(import('./MyComponent')), 2000);
  });
});
```

### Boundary Placement Strategies

**Estrategia 1: Granular (Múltiples Suspense)**
Mejor para dashboard widgets independientes. Si uno falla o tarda, el resto se muestra.

```tsx
<div className="dashboard-grid">
  <Suspense fallback={<CardSkeleton />}>
    <AnalyticsWidget />
  </Suspense>
  
  <Suspense fallback={<CardSkeleton />}>
    <RecentActivityWidget />
  </Suspense>
</div>
```

**Estrategia 2: Global (Un Suspense)**
Mejor para transiciones de página completas donde no tiene sentido mostrar partes parciales.

```tsx
<Suspense fallback={<PageSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
</Suspense>
```

## 3. Error Boundaries con Suspense

Cuando un componente falla al cargar (error de red o excepción), `Suspense` no maneja el error. Necesitas un `Error Boundary` *alrededor* de `Suspense` o dentro de él, dependiendo del comportamiento deseado.

```tsx
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div role="alert">
    <p>Algo salió mal:</p>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Reintentar</button>
  </div>
);

export const RobustComponent = () => (
  // Si falla la carga, muestra error localmente sin romper toda la app
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onReset={() => {
      // Resetear estado o invalidar queries
    }}
  >
    <Suspense fallback={<Spinner />}>
      <DataComponent />
    </Suspense>
  </ErrorBoundary>
);
```
