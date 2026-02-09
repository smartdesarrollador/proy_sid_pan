# Configuración de ESLint y Prettier

Configuración completa de linting y formateo para proyectos Angular.

## Instalación

```bash
# ESLint para Angular
ng add @angular-eslint/schematics

# Prettier y plugin de integración
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# Plugins adicionales de ESLint (opcionales)
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

## eslint.config.js (ESLint 9.x Flat Config)

```javascript
// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      prettier, // Debe ser el último
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/no-input-rename": "error",
      "@angular-eslint/no-output-rename": "error",
      "@angular-eslint/use-lifecycle-interface": "error",
      "@angular-eslint/use-pipe-transform-interface": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "memberLike",
          modifiers: ["private"],
          format: ["camelCase"],
          leadingUnderscore: "require",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
      ],
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/no-negated-async": "error",
      "@angular-eslint/template/use-track-by-function": "warn",
      "@angular-eslint/template/no-call-expression": "warn",
      "@angular-eslint/template/button-has-type": "error",
    },
  }
);
```

## .prettierrc.json

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "auto",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "htmlWhitespaceSensitivity": "css",
  "insertPragma": false,
  "proseWrap": "preserve",
  "quoteProps": "as-needed",
  "requirePragma": false,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular",
        "printWidth": 120
      }
    },
    {
      "files": "*.json",
      "options": {
        "printWidth": 120,
        "tabWidth": 2
      }
    }
  ]
}
```

## .prettierignore

```
# Build outputs
dist
.angular
coverage
node_modules

# Environment files
.env
.env.*

# Generated files
*.generated.ts

# Package files
package-lock.json
yarn.lock
pnpm-lock.yaml
```

## .editorconfig

```ini
# Editor configuration, see https://editorconfig.org
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
quote_type = single

[*.md]
max_line_length = off
trim_trailing_whitespace = false
```

## package.json Scripts

```json
{
  "scripts": {
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,css,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,css,scss,json}\"",
    "lint:all": "npm run lint && npm run format:check"
  }
}
```

## VS Code Settings (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": [
    "javascript",
    "typescript",
    "html"
  ],
  "eslint.format.enable": false
}
```

## VS Code Extensions (.vscode/extensions.json)

```json
{
  "recommendations": [
    "angular.ng-template",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "editorconfig.editorconfig"
  ]
}
```

## Reglas Importantes de ESLint

### @angular-eslint/component-selector

Fuerza naming de selectores:

```typescript
// ❌ Error
@Component({
  selector: 'myComponent' // Debe ser kebab-case
})

// ✅ Correcto
@Component({
  selector: 'app-my-component'
})
```

### @angular-eslint/no-input-rename

Evita renombrar inputs:

```typescript
// ❌ Error
@Input('userName') user!: string;

// ✅ Correcto
@Input() userName!: string;
```

### @angular-eslint/use-lifecycle-interface

Implementa interfaces de lifecycle:

```typescript
// ❌ Error
export class MyComponent {
  ngOnInit() {}
}

// ✅ Correcto
export class MyComponent implements OnInit {
  ngOnInit() {}
}
```

### @typescript-eslint/no-unused-vars

Detecta variables no usadas:

```typescript
// ❌ Error
const unused = 'value';

// ✅ Correcto - prefijo _ para variables intencionalmente no usadas
const _intentionallyUnused = 'value';
```

### @typescript-eslint/naming-convention

Convenciones de naming:

```typescript
// ✅ Correcto
const myVariable = 'value';           // camelCase
const MY_CONSTANT = 'value';          // UPPER_CASE
class MyClass {}                      // PascalCase
interface MyInterface {}              // PascalCase
enum MyEnum { VALUE_ONE, VALUE_TWO }  // PascalCase + UPPER_CASE

class MyComponent {
  private _privateField = '';         // _ prefix para privados
  public publicField = '';            // camelCase
}
```

## Reglas para Templates HTML

### @angular-eslint/template/use-track-by-function

Usar trackBy en *ngFor:

```html
<!-- ❌ Warning -->
<div *ngFor="let item of items">{{ item.name }}</div>

<!-- ✅ Correcto -->
<div *ngFor="let item of items; trackBy: trackByFn">{{ item.name }}</div>
```

```typescript
trackByFn(index: number, item: Item): number {
  return item.id;
}
```

### @angular-eslint/template/button-has-type

Botones deben tener type:

```html
<!-- ❌ Error -->
<button>Click</button>

<!-- ✅ Correcto -->
<button type="button">Click</button>
<button type="submit">Submit</button>
```

## Pre-commit Hooks (Opcional)

Instalar husky y lint-staged:

```bash
npm install -D husky lint-staged
npx husky init
```

Crear `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Actualizar `package.json`:

```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.html": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

## Ignorar Archivos

Crear `.eslintignore`:

```
# Build outputs
dist
.angular
coverage
node_modules

# Generated files
*.generated.ts
*.spec.ts.snap

# Config files
*.config.js
```

## CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
```

## Best Practices

1. **Prettier para formateo, ESLint para código**: No mezclar responsabilidades
2. **Format on save**: Configurar en VS Code
3. **Pre-commit hooks**: Asegurar calidad antes de commit
4. **CI/CD**: Verificar en pipeline
5. **Reglas consistentes**: Todo el equipo usa misma config
6. **Disable con cuidado**: Comentarios `// eslint-disable-next-line` solo cuando sea necesario
7. **Actualizar regularmente**: Mantener dependencias actualizadas

## Disable Rules Temporalmente

```typescript
// Deshabilitar regla específica
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getValue();

// Deshabilitar para archivo completo
/* eslint-disable @typescript-eslint/no-explicit-any */
// ... código ...
/* eslint-enable @typescript-eslint/no-explicit-any */
```

## Troubleshooting

```bash
# Limpiar caché de ESLint
rm -rf .eslintcache

# Verificar configuración de ESLint
npx eslint --print-config src/app/app.component.ts

# Debug Prettier
npx prettier --debug-check src/**/*.ts
```
