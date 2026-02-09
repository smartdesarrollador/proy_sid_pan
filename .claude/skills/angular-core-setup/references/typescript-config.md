# Configuración de TypeScript

Configuración completa de TypeScript para proyectos Angular con strict mode.

## tsconfig.json (Raíz del Proyecto)

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "skipLibCheck": true,
    "baseUrl": "./",
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@layout/*": ["src/app/layout/*"],
      "@env/*": ["src/environments/*"],
      "@assets/*": ["src/assets/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
    "strictNullChecks": true
  }
}
```

## tsconfig.app.json (Para la aplicación)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts",
    "src/test.ts"
  ]
}
```

## tsconfig.spec.json (Para tests)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jasmine",
      "node"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
```

## Opciones Importantes de Strict Mode

### strict: true

Habilita todas las verificaciones estrictas:

- `strictNullChecks`: No permite `null` o `undefined` sin verificación
- `strictFunctionTypes`: Verificación estricta de tipos de función
- `strictBindCallApply`: Tipos correctos en `.bind()`, `.call()`, `.apply()`
- `strictPropertyInitialization`: Propiedades deben inicializarse
- `noImplicitThis`: No permite `this` con tipo implícito `any`
- `noImplicitAny`: No permite tipo `any` implícito

### noUnusedLocals y noUnusedParameters

Detecta variables y parámetros no utilizados:

```typescript
// ❌ Error con noUnusedLocals
function example() {
  const unused = 'value'; // Error: unused is declared but never used
}

// ✅ Correcto
function example() {
  const used = 'value';
  console.log(used);
}
```

### noImplicitReturns

Todas las rutas de código deben retornar un valor:

```typescript
// ❌ Error
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  // Error: Not all code paths return a value
}

// ✅ Correcto
function getValue(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  return 'no';
}
```

### noFallthroughCasesInSwitch

Evita casos de switch sin `break`:

```typescript
// ❌ Error
function getValue(value: number): string {
  switch (value) {
    case 1:
      console.log('one');
      // Error: Fallthrough case in switch
    case 2:
      return 'two';
    default:
      return 'other';
  }
}

// ✅ Correcto
function getValue(value: number): string {
  switch (value) {
    case 1:
      return 'one';
    case 2:
      return 'two';
    default:
      return 'other';
  }
}
```

## Angular Compiler Options

### strictTemplates: true

Habilita verificación estricta de tipos en templates:

```typescript
@Component({
  template: `
    <!-- ❌ Error con strictTemplates -->
    <div>{{ user.name.toUpperCase() }}</div>
    <!-- Error si user puede ser null -->

    <!-- ✅ Correcto -->
    <div>{{ user?.name?.toUpperCase() }}</div>
  `
})
export class MyComponent {
  user: User | null = null;
}
```

### strictInputAccessModifiers: true

Fuerza acceso correcto a inputs:

```typescript
@Component({
  selector: 'app-child'
})
export class ChildComponent {
  @Input() value!: string;
}

// ❌ Error con strictInputAccessModifiers
const component = new ChildComponent();
component.value = 'test'; // Error: Input is read-only

// ✅ Correcto - usar property binding
<app-child [value]="'test'"></app-child>
```

### strictInjectionParameters: true

Verifica tipos de inyección de dependencias:

```typescript
// ❌ Error
@Injectable()
export class MyService {
  constructor(private http) {} // Error: Parameter 'http' implicitly has an 'any' type
}

// ✅ Correcto
@Injectable()
export class MyService {
  constructor(private http: HttpClient) {}
}
```

## Path Aliases

Configurar aliases para imports limpios:

```json
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@features/*": ["src/app/features/*"],
  "@layout/*": ["src/app/layout/*"],
  "@env/*": ["src/environments/*"]
}
```

Uso:

```typescript
// ❌ Antes
import { AuthService } from '../../../core/services/auth.service';

// ✅ Después
import { AuthService } from '@core/services/auth.service';
```

## Type-Safe Environments

Crear type para environments:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  features: {
    analytics: false,
  },
} as const;

export type Environment = typeof environment;
```

```typescript
// src/environments/environment.prod.ts
import { Environment } from './environment';

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.production.com',
  features: {
    analytics: true,
  },
};
```

## Decorators y Metadata

```json
"experimentalDecorators": true, // Para @Component, @Injectable, etc.
"emitDecoratorMetadata": true   // Si usas reflection
```

## Target y Module

```json
"target": "ES2022",      // JavaScript moderno
"module": "ES2022",      // Módulos ES
"lib": ["ES2022", "dom"] // APIs disponibles
```

## Verificaciones Adicionales Útiles

### forceConsistentCasingInFileNames

Evita problemas entre OS:

```typescript
// ❌ Error en sistemas case-sensitive
import { MyComponent } from './mycomponent'; // Archivo: MyComponent.ts
```

### skipLibCheck

Omite verificación de tipos en archivos `.d.ts` de `node_modules`:

```json
"skipLibCheck": true // Mejora performance
```

### resolveJsonModule

Permite importar archivos JSON:

```json
"resolveJsonModule": true
```

```typescript
import data from './data.json';
console.log(data.version);
```

## Custom Type Definitions

Crear `src/typings.d.ts`:

```typescript
// Declaraciones de módulos sin tipos
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

// Extender interfaces globales
interface Window {
  analytics: {
    track: (event: string, properties?: Record<string, unknown>) => void;
  };
}

// Types globales del proyecto
type ID = string | number;
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
```

## Best Practices

1. **Siempre usar strict mode**: Detecta errores temprano
2. **Path aliases**: Mejora legibilidad de imports
3. **Type environments**: Environments type-safe
4. **noUnusedLocals/Parameters**: Mantiene código limpio
5. **strictTemplates**: Tipos en templates de Angular
6. **Custom types**: Definir tipos globales en `typings.d.ts`
7. **skipLibCheck**: Mejorar performance de compilación
8. **Consistent casing**: Evitar problemas entre sistemas operativos

## Comandos Útiles

```bash
# Verificar configuración
npx tsc --showConfig

# Compilar sin emitir archivos (solo verificar tipos)
npx tsc --noEmit

# Watch mode
npx tsc --watch
```
