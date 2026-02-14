# Feature-Based Architecture

La estructura de proyecto es crítica para la escalabilidad. La arquitectura recomendada es **Feature-Based** (inspirada en Feature-Sliced Design).

## 1. Features vs Layers

### Layers (Tradicional)
Organizar por tipo de archivo (`components/`, `hooks/`, `services/`).
*   **Contras**: Escala mal. Para editar "Auth", tienes que tocar 5 carpetas diferentes. Difícil de eliminar features.
*   **Pros**: Fácil de entender al principio.

### Features (Recomendada)
Organizar por dominio de negocio (`features/auth/`, `features/checkout/`).
*   **Pros**: Todo lo relacionado con "Auth" está junto. Fácil de eliminar, refactorizar o testear aisladamente.
*   **Contras**: Requiere disciplina para no acoplar features.

## 2. Estructura de Carpetas Recomendada (`src/`)

```
src/
├── app/                  # (Next.js App Router) Rutas y Layouts
│   ├── (auth)/login/
│   ├── dashboard/
│   └── layout.tsx
├── components/           # Componentes UI compartidos (Button, Input, Modal)
│   ├── ui/               # Atomos básicos
│   └── layout/           # Header, Sidebar, Footer
├── features/             # Módulos de negocio aislados
│   ├── auth/             # Login, Register, User Profile
│   │   ├── components/   # LoginForm, RegisterButton (UI específica)
│   │   ├── hooks/        # useAuth, useLogin
│   │   ├── services/     # api calls (authService.ts)
│   │   ├── types/        # User, AuthState
│   │   └── index.ts      # Public API (lo que exporta al resto de la app)
│   └── products/         # ProductList, ProductDetails...
├── hooks/                # Hooks globales reutilizables (useDebounce, useClickOutside)
├── lib/                  # Configuraciones de librerías (axios, queryClient, utils)
├── stores/               # Estado global (Zustand, Redux) - si es necesario
├── types/                # Tipos globales o compartidos (APIResponse, Theme)
└── utils/                # Funciones puras compartidas (formatDate, currency)
```

## 3. Reglas de Importación

1.  **Feature Isolation**: Una feature NO debe importar directamente de otra feature (ej. `features/products` no importa `features/auth/components/LoginForm`).
2.  **Public API (`index.ts`)**: Si una feature necesita exponer algo, hazlo a través de su `index.ts`.
3.  **App Layer**: `/app` (o `/pages`) conecta las features entre sí. Es el "pegamento".

### Ejemplo de `features/auth/index.ts`

```typescript
// features/auth/index.ts
// Solo exportamos lo necesario
export { LoginForm } from './components/LoginForm';
export { useAuth } from './hooks/useAuth';
// NO exportamos componentes internos o types privados
```

### Ejemplo de Uso en `/app`

```typescript
// app/login/page.tsx
// ✅ Import limpio desde la feature
import { LoginForm } from '@/features/auth'; 

export default function LoginPage() {
  return (
    <main>
      <h1>Iniciar Sesión</h1>
      <LoginForm />
    </main>
  );
}
```
