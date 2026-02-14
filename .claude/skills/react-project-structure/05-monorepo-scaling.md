# Scaling to Monorepo

Cuando una app crece mucho (o tienes un Web, un Admin, una Mobile), escalar a monorrepo con herramientas como Turborepo/Nx tiene sentido.

## 1. Estructura de Workspaces (`apps/`, `packages/`)

Un monorrepo organiza múltiples proyectos en el mismo repositorio.

```
/
├── apps/                 # (Workspaces que se despliegan)
│   ├── web/              # Next.js (Website)
│   ├── admin/            # Vite (Admin Panel)
│   └── mobile/           # Expo (React Native)
├── packages/             # (Librerías compartidas)
│   ├── ui/               # Design System (Button, Input)
│   ├── config/           # ESLint, TSConfig base
│   ├── database/         # Prisma Schema & Client
│   └── utils/            # Funciones puras (date-format)
├── turbo.json            # Config Turborepo
└── pnpm-workspace.yaml   # Config Workspaces
```

## 2. Librerías Compartidas (`packages/ui`)

La carpeta `packages/ui` es clave. Un Design System compartido asegura consistencia entre Web y Admin.

**`packages/ui/Button.tsx`:**

```typescript
import * as React from 'react';

export const Button = ({ children, ...props }: any) => {
  return <button className="bg-blue-500 rounded p-2" {...props}>{children}</button>;
};
```

**Uso en `apps/web/page.tsx`:**

```typescript
import { Button } from '@repo/ui'; // Importa del workspace

export default function Page() {
  return <Button>Click me</Button>;
}
```

## 3. Configuración Base (`packages/config`)

Centraliza configuraciones repetitivas (`tsconfig`, `eslint`, `tailwind`).

**`packages/config/tsconfig.json`:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true
  }
}
```

Cada app solo extiende de esto:
```json
// apps/web/tsconfig.json
{
  "extends": "@repo/config/tsconfig.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
