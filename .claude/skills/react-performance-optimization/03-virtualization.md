# Virtualización de Listas

El renderizado de listas largas (1000+ elementos) sin virtualización puede colapsar el hilo principal del navegador. La virtualización solo renderiza los elementos visibles en pantalla.

## Librerías Recomendadas
*   `react-window`: Ligera, eficiente.
*   `react-virtualized`: Más completa, pero más pesada.
*   `virtuoso`: Muy flexible, excelente para listas dinámicas.

## Ejemplo con `react-window`

**Métrica de Impacto**:
*   Rendering 10,000 items (sin virtualización): **~1200ms** (Main thread blocked).
*   Con virtualización: **~8ms** (Constant time per frame).

**Instalación:**
```bash
npm install react-window
```

**Código Base (Listado NO OPTIMIZADO):**
```tsx
const HugeList = ({ items }: { items: string[] }) => (
  <div style={{ height: 600, overflowY: 'scroll' }}>
    {items.map((item, index) => (
      <div key={index} style={{ height: 50, borderBottom: '1px solid #ccc' }}>
        {item}
      </div>
    ))}
  </div>
);
```

**Código Optimizado (Virtualizado):**
```tsx
import { FixedSizeList as List } from 'react-window';

interface RowProps {
  index: number;
  style: React.CSSProperties; // Importante para posicionamiento absoluto
}

const Row = ({ index, style }: RowProps) => (
  // El estilo DEBE pasar al div wrapper para que funcione
  <div style={style}>
    Row {index}
  </div>
);

const VirtualizedList = () => (
  <List
    height={600} // Altura del contenedor visible
    itemCount={10000} // Total de items
    itemSize={50} // Altura de cada fila (fija)
    width={300}
  >
    {Row}
  </List>
);
```

## Infinite Scroll Optimizado

Usa un `intersection observer` o un componente `InfiniteLoader` (proporcionado por `react-window-infinite-loader`) para cargar más datos *solo* cuando el scroll llega al final.

**Ejemplo Conceptual:**
```tsx
import InfiniteLoader from 'react-window-infinite-loader';

const InfiniteList = ({ items, hasMore, loadMore }: any) => {
  const isItemLoaded = (index: number) => items[index] != null;
  const loadMoreItems = loadMore;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={hasMore ? items.length + 1 : items.length}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <List
          height={600}
          itemCount={items.length}
          itemSize={50}
          width="100%"
          onItemsRendered={onItemsRendered}
          ref={ref}
        >
          {Row}
        </List>
      )}
    </InfiniteLoader>
  );
};
```
