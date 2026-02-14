# Error Boundaries

Los Error Boundaries son componentes que capturan errores de renderizado en sus hijos y muestran una UI alternativa.

## 1. Class Component (Legacy to Standard)

Los únicos componentes que pueden actuar como Error Boundaries son componentes de clase.

```typescript
// components/ErrorBoundary.tsx
import React, { ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Actualiza el estado para que el siguiente render muestre la UI alternativa
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Efecto secundario: Loguear el error a un servicio
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

## 2. react-error-boundary (Modern Standard)

Librería recomendada que maneja el boilerplate y permite resetear el estado del error fácilmente.

**Instalación:**
```bash
npm install react-error-boundary
```

**Uso:**

```typescript
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

// UI Fallback con botón "Reintentar"
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert">
      <h2>Algo salió mal.</h2>
      <pre className="text-red-500">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Reintentar</button>
    </div>
  );
}

export const Dashboard = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
        console.log('Resetting app state...');
      }}
    >
      <SensitiveWidget />
    </ErrorBoundary>
  );
};
```

## 3. Patrones: Global vs Granular

### Global Error Boundary
Captura errores catastróficos que "rompen" toda la app. Muestra una pantalla de "Oops" genérica.

### Granular Error Boundary
Envuelve partes específicas de la UI (widgets, secciones independientes). Si falla el `SideBar`, el `MainContent` sigue funcionando.

```typescript
// App.tsx
function App() {
  return (
    <GlobalErrorBoundary>
      <Layout>
        <SidebarErrorBoundary>
           <Sidebar />
        </SidebarErrorBoundary>
        
        <MainContentErrorBoundary>
           <MainContent />
        </MainContentErrorBoundary>
      </Layout>
    </GlobalErrorBoundary>
  );
}
```
