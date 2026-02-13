# React Context State Skill

Guía completa de gestión de estado global con Context API y TypeScript, enfocada en escalabilidad, performance y patrones de producción.

## 📋 Descripción

Este skill proporciona patrones de Context API con TypeScript para gestión de estado global en aplicaciones React medianas a grandes. Es una alternativa ligera a Redux/Zustand cuando no necesitas todas las features de un state manager completo.

**Ideal para:**
- Aplicaciones con estado global moderado (auth, theme, settings, notifications)
- Equipos que prefieren soluciones nativas de React
- Proyectos que necesitan type safety estricto
- Code reviews enfocados en performance
- Optimización de re-renders en aplicaciones grandes

## 🚀 Uso

El skill se invoca automáticamente cuando trabajas con:
- Setup de Context con `createContext`, `Provider`, `useContext`
- Patrones de Context + useReducer para estado complejo
- Múltiples contexts y separación por dominio
- Custom hooks (`useAuth`, `useTheme`, `useCart`)
- Optimización de re-renders y performance
- Composición de providers
- Estado derivado y selectores
- Testing de contexts

También puedes invocarlo manualmente:
```
/react-context-state
```

## 📚 Contenido

### SKILL.md Principal
Patrones core organizados en 8 secciones principales:

1. **Setup Básico de Context**
   - Context simple con tipos correctos
   - Default values seguros
   - Custom hooks para consumir context
   - Error boundaries

2. **Context + useReducer**
   - Reducers para estado complejo
   - Action creators con type safety
   - Helper functions
   - Patrones de dispatch

3. **Múltiples Contexts**
   - Separación por dominio (Auth, Theme, Notifications)
   - Context splitting para mejor organización
   - Independencia entre contexts

4. **Custom Hooks para Contexts**
   - Encapsulación de lógica
   - Hooks que combinan múltiples contexts
   - Hooks de permisos y autorización

5. **Optimización de Re-renders** ⚡
   - Split contexts para evitar re-renders
   - useMemo para context value
   - State/Dispatch separation
   - Identificar y resolver problemas de performance

6. **Composición de Providers**
   - ProviderComposer utility
   - Evitar provider hell
   - Orden de providers

7. **Estado Derivado y Selectores**
   - Computed values sin re-renders
   - Selector pattern
   - Custom hooks con selectores

8. **Inicialización de Estado**
   - Lazy initialization con localStorage
   - Async initialization con loading state
   - Persistencia de estado

### Referencias Adicionales

#### `references/provider-patterns.md`
- Patrones avanzados de composición
- Provider factories
- Conditional providers
- HOCs vs hooks para providers
- Multi-tenant providers

#### `references/optimization-strategies.md`
- Análisis detallado de re-render issues
- Profiling con React DevTools
- Context selectors avanzados
- Bailout strategies
- Técnicas de memoización
- Comparación con state managers (Redux, Zustand, Jotai)

#### `references/testing-contexts.md`
- Testing de providers con @testing-library/react
- Mock providers para tests
- Testing de custom hooks
- Integration tests con múltiples contexts
- Testing de performance y re-renders
- Snapshot testing de context state

## 💡 Cuándo Usar Context API vs State Managers

### ✅ Usar Context API cuando:
- Estado global moderado (< 10 contexts)
- Updates infrecuentes del estado
- Prefieres soluciones nativas de React
- No necesitas devtools avanzadas
- Tu equipo ya domina React hooks

### ⚠️ Considerar State Manager (Redux/Zustand) cuando:
- Estado global muy complejo (> 15 contexts)
- Updates muy frecuentes del estado
- Necesitas time-travel debugging
- Requieres middleware complejo (sagas, thunks)
- Necesitas devtools para debugging

## 🎯 Ejemplos de Uso

### Setup Rápido
```tsx
import { createContext, useContext, useState } from 'react';

// 1. Crear context con tipos
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. Provider
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Custom hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### Optimización de Performance
```tsx
// Split state y dispatch para evitar re-renders
const CartStateContext = createContext<CartState | undefined>(undefined);
const CartDispatchContext = createContext<Dispatch | undefined>(undefined);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartStateContext.Provider value={state}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

// Los componentes solo re-renderizan si usan el state, no el dispatch
```

## 🔗 Recursos Externos

- [React Context API Docs](https://react.dev/reference/react/useContext)
- [How to use React Context effectively - Kent C. Dodds](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [How to optimize your context value - Kent C. Dodds](https://kentcdodds.com/blog/how-to-optimize-your-context-value)
- [React TypeScript Cheatsheet - Context](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/)

## 📊 Comparación con Otros Patterns

| Feature | Context API | Redux | Zustand | Jotai |
|---------|-------------|-------|---------|-------|
| Setup Complexity | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ |
| TypeScript Support | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| DevTools | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Bundle Size | 0kb (built-in) | ~40kb | ~3kb | ~5kb |
| Learning Curve | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Performance | ⭐⭐⭐ (con optimización) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🏆 Best Practices

1. ✅ **Siempre usa TypeScript** para type safety
2. ✅ **Crea custom hooks** para encapsular lógica (`useAuth`, `useTheme`)
3. ✅ **Split contexts** por dominio para mejor organización
4. ✅ **Memoiza el value** con useMemo para evitar re-renders
5. ✅ **Separa state y dispatch** para optimizar performance
6. ✅ **Lazy initialization** para cálculos costosos (localStorage)
7. ✅ **Error boundaries** - throw error si context usado fuera de Provider
8. ⚠️ **No sobre-optimizar** - medir antes de aplicar optimizaciones

## 📝 Notas

- Este skill complementa `react-hooks-patterns` y `react-typescript-foundations`
- Para state local complejo, considera usar `useReducer` sin Context
- Para estado global muy complejo (> 10 contexts), considera Zustand o Jotai
- Siempre medir performance con React DevTools Profiler antes de optimizar

## 🆕 Actualizado

Este skill incluye las mejores prácticas de 2026:
- Context selectors pattern
- State/dispatch separation para performance
- Lazy initialization patterns
- TypeScript strict mode
- React 18+ features
