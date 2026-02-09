# Advanced Patterns

Patrones avanzados de state management.

## 1. Undo/Redo

```typescript
export class UndoableStore<T> extends BaseStore<T> {
  private history: T[] = [];
  private currentIndex = -1;

  canUndo = computed(() => this.currentIndex > 0);
  canRedo = computed(() => this.currentIndex < this.history.length - 1);

  protected override setData(data: T): void {
    super.setData(data);

    // Agregar a historial
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(data);
    this.currentIndex++;
  }

  undo(): void {
    if (this.canUndo()) {
      this.currentIndex--;
      super.setData(this.history[this.currentIndex]);
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
      super.setData(this.history[this.currentIndex]);
    }
  }
}
```

## 2. Devtools Integration

```typescript
export class DevToolsStore<T> extends BaseStore<T> {
  private actions: Array<{ type: string; payload: any; timestamp: number }> = [];

  protected override setState(newState: Partial<StoreState<T>>): void {
    // Log para devtools
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      this.logAction('SET_STATE', newState);
    }

    super.setState(newState);
  }

  private logAction(type: string, payload: any): void {
    this.actions.push({
      type,
      payload,
      timestamp: Date.now()
    });

    console.log(`[${type}]`, payload);
  }

  getActionHistory(): any[] {
    return this.actions;
  }
}
```

## 3. Selectors Memoizados

```typescript
@Injectable({ providedIn: 'root' })
export class UsersStore extends BaseStore<User[]> {
  private selectedUserId = signal<number | null>(null);

  // Memoized selector
  selectedUser = computed(() => {
    const id = this.selectedUserId();
    return this.data().find(u => u.id === id) || null;
  });

  // Selector parametrizado
  getUserById(id: number): Signal<User | undefined> {
    return computed(() => this.data().find(u => u.id === id));
  }

  selectUser(id: number): void {
    this.selectedUserId.set(id);
  }
}
```

## 4. Normalización de Datos

```typescript
interface NormalizedState<T> {
  entities: Record<number, T>;
  ids: number[];
}

export class NormalizedStore<T extends { id: number }> {
  private state = signal<NormalizedState<T>>({
    entities: {},
    ids: []
  });

  entities = computed(() => this.state().entities);
  ids = computed(() => this.state().ids);
  all = computed(() => this.ids().map(id => this.entities()[id]));

  setMany(items: T[]): void {
    const entities: Record<number, T> = {};
    const ids: number[] = [];

    items.forEach(item => {
      entities[item.id] = item;
      ids.push(item.id);
    });

    this.state.set({ entities, ids });
  }

  addOne(item: T): void {
    this.state.update(state => ({
      entities: { ...state.entities, [item.id]: item },
      ids: [...state.ids, item.id]
    }));
  }

  updateOne(id: number, changes: Partial<T>): void {
    this.state.update(state => ({
      ...state,
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], ...changes }
      }
    }));
  }
}
```

## 5. Entity Adapter

```typescript
export function createEntityAdapter<T extends { id: number }>() {
  return {
    addOne: (state: NormalizedState<T>, entity: T) => ({
      entities: { ...state.entities, [entity.id]: entity },
      ids: [...state.ids, entity.id]
    }),

    updateOne: (state: NormalizedState<T>, id: number, changes: Partial<T>) => ({
      ...state,
      entities: {
        ...state.entities,
        [id]: { ...state.entities[id], ...changes }
      }
    }),

    removeOne: (state: NormalizedState<T>, id: number) => ({
      entities: Object.fromEntries(
        Object.entries(state.entities).filter(([key]) => Number(key) !== id)
      ) as Record<number, T>,
      ids: state.ids.filter(i => i !== id)
    })
  };
}
```
