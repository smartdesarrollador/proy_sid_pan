# React TypeScript Foundations Skill

Guía completa de fundamentos de React con TypeScript para proyectos escalables y reutilizables.

## 📋 Descripción

Este skill proporciona patrones, mejores prácticas y ejemplos copy-paste de React con TypeScript, cubriendo desde setup básico hasta patrones avanzados. Está diseñado para:

- Desarrolladores que necesitan referencias rápidas de TypeScript con React
- Equipos que quieren estandarizar patrones en sus proyectos
- Proyectos que requieren componentes type-safe y reutilizables

## 🚀 Uso

El skill se invoca automáticamente cuando trabajas con:
- Componentes funcionales de React
- Hooks tipados (useState, useEffect, useContext, etc.)
- Custom hooks con TypeScript
- Patrones de composición
- Manejo de eventos tipados
- Optimización de componentes
- Mejores prácticas de TypeScript con React

También puedes invocarlo manualmente:
```
/react-typescript-foundations
```

## 📚 Contenido

### SKILL.md Principal
Contiene los fundamentos core organizados en 10 secciones:

1. **Setup Inicial**: Props, children, eventos tipados
2. **Hooks Fundamentales**: useState, useEffect, useContext, useRef
3. **Custom Hooks**: useLocalStorage, useFetch, useDebounce
4. **Patrones de Composición**: Render props, children as function
5. **Eventos y Refs**: Tipos de eventos, refs tipadas
6. **Tipos Avanzados**: Generics, utility types
7. **Mejores Prácticas**: Naming conventions, file organization
8. **Optimización**: memo, useCallback, useMemo
9. **Error Handling**: Try-catch, optional chaining, error boundaries
10. **Componentes Comunes**: Button, Input, Card, Modal

### Archivos de Referencia

#### `references/hooks-reference.md`
Custom hooks avanzados listos para usar:
- `useToggle` - Boolean state simplificado
- `useClickOutside` - Detectar clicks externos
- `useMediaQuery` - Responsive design
- `usePrevious` - Valor anterior del state
- `useInterval` - setInterval declarativo
- `useWindowSize` - Dimensiones de ventana
- `useAsync` - Operaciones async con estados
- `useForm` - Manejo de formularios
- `useCopyToClipboard` - Copiar al portapapeles
- `useOnScreen` - Visibilidad de elementos
- `useDebounceCallback` - Debounce de funciones
- `useKeyPress` - Detectar teclas presionadas

#### `references/advanced-patterns.md`
Patrones avanzados de TypeScript para React:
- Utility types: DeepPartial, Extract, Exclude, ReturnType, Parameters
- Mapped types y conditional types
- Discriminated unions para states complejos
- Generics con constraints
- Type guards y narrowing
- Props con discriminated unions
- Polymorphic components (as prop)
- Context con reducers type-safe
- Template literal types

#### `references/component-examples.md`
Componentes completos copy-paste listos:
- **Button**: Variants, sizes, loading, icons
- **Input**: Validación, error states, tipos
- **Card**: Header, body, footer con composición
- **Modal**: Portal, animations, keyboard handling
- **Table**: Sorting, striped, selección, genérico
- **Select**: Búsqueda, múltiple selección

## 💡 Ejemplos de Uso

### Crear un componente funcional tipado
```tsx
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
};
```

### Custom hook con tipado
```tsx
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Implementation...
}
```

### Componente genérico
```tsx
interface ListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T extends { id: string }>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

## 🎯 Cuándo Usar Este Skill

✅ **Usar cuando:**
- Necesitas setup de componentes con TypeScript
- Quieres implementar custom hooks tipados
- Buscas patrones de composición
- Necesitas ejemplos de componentes comunes
- Requieres optimización de componentes
- Trabajas con tipos avanzados (generics, utility types)

❌ **No usar para:**
- State management complejo (Redux, MobX) - fuera del scope
- React Native - patrones específicos diferentes
- Server Components de Next.js - requiere skill específico
- Frameworks de UI (Material-UI, Chakra) - tienen sus propias APIs

## 🔧 Configuración Recomendada

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

### Estructura de proyecto recomendada
```
src/
├── components/
│   ├── common/        # Componentes reutilizables
│   └── features/      # Componentes específicos
├── hooks/             # Custom hooks
├── types/             # Definiciones de tipos
└── utils/             # Utilidades
```

## 📖 Referencias

Basado en las mejores prácticas actuales (2026) y documentación oficial:
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React Documentation](https://react.dev/)

## 🤝 Contribuir

Para mejorar este skill:
1. Lee la documentación oficial actualizada
2. Prueba los patrones en proyectos reales
3. Verifica que el código compile con TypeScript strict mode
4. Actualiza los ejemplos según cambios en React/TypeScript

## 📝 Notas

- Todos los ejemplos usan TypeScript strict mode
- Los componentes siguen accesibilidad (ARIA) cuando es aplicable
- Se prefiere composición sobre herencia
- Se usa functional components sobre class components
- Los hooks siguen las reglas de hooks de React
