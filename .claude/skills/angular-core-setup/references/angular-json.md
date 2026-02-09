# Configuración Completa de angular.json

Esta es la configuración optimizada de `angular.json` para un proyecto Angular con Tailwind CSS.

## Estructura Principal

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "my-angular-app": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "css",
          "standalone": true,
          "changeDetection": "OnPush"
        },
        "@schematics/angular:directive": {
          "standalone": true
        },
        "@schematics/angular:pipe": {
          "standalone": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/my-angular-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "css",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": ["src/styles.css"],
            "scripts": [],
            "stylePreprocessorOptions": {
              "includePaths": ["src/styles"]
            }
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kB",
                  "maximumError": "4kB"
                }
              ],
              "outputHashing": "all",
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ],
              "optimization": {
                "scripts": true,
                "styles": {
                  "minify": true,
                  "inlineCritical": true
                },
                "fonts": true
              },
              "sourceMap": false,
              "namedChunks": false,
              "extractLicenses": true,
              "vendorChunk": false,
              "buildOptimizer": true
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true,
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.development.ts"
                }
              ]
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "my-angular-app:build:production"
            },
            "development": {
              "buildTarget": "my-angular-app:build:development"
            }
          },
          "defaultConfiguration": "development",
          "options": {
            "port": 4200,
            "open": true,
            "host": "localhost"
          }
        },
        "extract-i18n": {
          "builder": "@angular-devkit/build-angular:extract-i18n"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "inlineStyleLanguage": "css",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": ["src/styles.css"],
            "scripts": [],
            "codeCoverage": true,
            "codeCoverageExclude": [
              "**/*.spec.ts",
              "**/*.mock.ts",
              "**/test-helpers/**"
            ]
          }
        },
        "lint": {
          "builder": "@angular-eslint/builder:lint",
          "options": {
            "lintFilePatterns": ["src/**/*.ts", "src/**/*.html"]
          }
        }
      }
    }
  },
  "cli": {
    "analytics": false,
    "schematicCollections": ["@angular-eslint/schematics"]
  }
}
```

## Opciones Importantes

### Schematics (Generadores)

```json
"schematics": {
  "@schematics/angular:component": {
    "style": "css",
    "standalone": true,
    "changeDetection": "OnPush"  // Mejor rendimiento
  }
}
```

### Build Budgets

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kB",
    "maximumError": "1MB"
  }
]
```

### Optimization para Producción

```json
"optimization": {
  "scripts": true,
  "styles": {
    "minify": true,
    "inlineCritical": true  // Inline critical CSS
  },
  "fonts": true
}
```

### File Replacements (Environments)

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

## Configuraciones Adicionales Útiles

### Proxy para API

Crear `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Actualizar `angular.json`:

```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### Multiple Environments

```json
"configurations": {
  "production": { /* ... */ },
  "staging": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.staging.ts"
      }
    ],
    "optimization": true,
    "sourceMap": false
  },
  "development": { /* ... */ }
}
```

### CSS Preprocessors (SCSS)

Si usas SCSS en lugar de CSS:

```json
"inlineStyleLanguage": "scss",
"styles": ["src/styles.scss"],
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```

## Best Practices

1. **Standalone por defecto**: Configurar schematics para generar componentes standalone
2. **OnPush change detection**: Mejor rendimiento
3. **Build budgets**: Alertas cuando el bundle crece demasiado
4. **Source maps**: Solo en desarrollo
5. **Optimization**: Habilitada en producción, deshabilitada en desarrollo
6. **Analytics deshabilitado**: Por privacidad
