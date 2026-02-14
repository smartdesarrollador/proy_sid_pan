# Logging & Recovery

No basta con capturar el error, debes saber qué pasó (Logging) y darle al usuario una salida (Recovery).

## 1. Estrategias de Recuperación (Recovery)

Cuando ocurre un error, ¿qué puede hacer el usuario?

### Retry Button (Simple)
Botón "Reintentar" que resetea el Error Boundary o re-lanza la query (React Query).

```tsx
<button onClick={() => window.location.reload()}>
  Recargar Página
</button>

// O con react-error-boundary
<button onClick={resetErrorBoundary}>
  Intentar de nuevo
</button>
```

### Fallback Navigation (Redirección)
Si un usuario intenta acceder a `/dashboard` sin permiso (403), redirígelo a `/login` o `/unauthorized`.

```tsx
// En Next.js (Server Component)
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin'); // Lanza error interno que Next.js catch
  }
  return <Content />;
}
```

### Partial UI Recovery (Degradación)
Si falla el widget del clima, muestra "No disponible" en lugar de romper toda la sidebar.

```tsx
<ErrorBoundary fallback={<div className="text-gray-500">Clima no disponible</div>}>
  <WeatherWidget />
</ErrorBoundary>
```

## 2. Servicios de Logging (Sentry / LogRocket)

En producción, los `console.error` no te sirven. Usa Sentry.

**Instalación Next.js:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Configuración (`sentry.client.config.ts`):**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  tracesSampleRate: 1.0, // Ajustar en prod (e.g. 0.1)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay(),
  ],
});
```

**Uso Manual (Capturar excepciones controladas):**

```typescript
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error); // Envía stack trace completo
  toast.error("Ocurrió un error inesperado.");
}
```

### Contexto de Usuario

Añade info del usuario para saber **quién** sufrió el error.

```typescript
// En tu Auth Provider
useEffect(() => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}, [user]);
```

## 3. Diferencias Dev vs Prod

### Development
*   **Overlay de Error**: Overlay rojo de Next.js/React con stack trace completo.
*   **Logging**: `console.error` detallado.
*   **Strict Mode**: React monta componentes doble vez para detectar efectos secundarios impuros (puede parecer que hay más errores).

### Production
*   **Sanitized Messages**: Nunca muestres "Database connection failed at 192.168.1.5". Muestra "Error de conexión".
*   **Source Maps**: Sentry usa source maps (subidos en CI) para des-minificar el código y mostrarte la línea exacta en tu TS original.
*   **Performance**: Los loggers deben ser asíncronos para no bloquear el hilo principal.
