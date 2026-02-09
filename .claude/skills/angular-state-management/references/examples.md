# Ejemplos Prácticos

Ejemplos completos de uso de stores.

## Form State Management

```typescript
@Injectable()
export class FormStore extends BaseStore<FormState> {
  readonly isDirty = computed(() => {
    const original = this.originalData();
    const current = this.data();
    return JSON.stringify(original) !== JSON.stringify(current);
  });

  readonly isValid = computed(() => {
    const data = this.data();
    return data.email.includes('@') && data.name.length > 0;
  });

  private originalData = signal<FormState>(this.data());

  updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    this.updateData({ [field]: value } as Partial<FormState>);
  }

  save(): void {
    this.originalData.set(this.data());
  }

  revert(): void {
    this.setData(this.originalData());
  }
}
```

## Pagination Store

```typescript
@Injectable()
export class PaginationStore {
  private state = signal({
    page: 1,
    pageSize: 10,
    total: 0
  });

  page = computed(() => this.state().page);
  pageSize = computed(() => this.state().pageSize);
  total = computed(() => this.state().total);
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  hasNext = computed(() => this.page() < this.totalPages());
  hasPrev = computed(() => this.page() > 1);

  nextPage(): void {
    if (this.hasNext()) {
      this.state.update(s => ({ ...s, page: s.page + 1 }));
    }
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.state.update(s => ({ ...s, page: s.page - 1 }));
    }
  }

  setTotal(total: number): void {
    this.state.update(s => ({ ...s, total }));
  }
}
```

## WebSocket Store

```typescript
@Injectable({ providedIn: 'root' })
export class WebSocketStore {
  private messagesSignal = signal<Message[]>([]);
  private ws: WebSocket | null = null;

  messages = this.messagesSignal.asReadonly();
  isConnected = signal(false);

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnected.set(true);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messagesSignal.update(msgs => [...msgs, message]);
    };

    this.ws.onclose = () => {
      this.isConnected.set(false);
    };
  }

  send(message: string): void {
    if (this.ws && this.isConnected()) {
      this.ws.send(message);
    }
  }

  disconnect(): void {
    this.ws?.close();
  }
}
```
