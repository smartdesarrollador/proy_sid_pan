# Advanced Patterns

Patrones avanzados para servicios API.

## 1. Repository Pattern

```typescript
export interface Repository<T> {
  getAll(): Observable<T[]>;
  getById(id: number): Observable<T>;
  create(entity: T): Observable<T>;
  update(id: number, entity: T): Observable<T>;
  delete(id: number): Observable<void>;
}

@Injectable()
export class UserRepository implements Repository<User> {
  constructor(private userService: UserService) {}

  getAll = () => this.userService.getAll();
  getById = (id: number) => this.userService.getById(id);
  create = (user: User) => this.userService.create(user);
  update = (id: number, user: User) => this.userService.update(id, user);
  delete = (id: number) => this.userService.delete(id);
}
```

## 2. State Management con Service

```typescript
export interface State<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private state$ = new BehaviorSubject<State<User>>({
    data: [],
    loading: false,
    error: null
  });

  readonly users$ = this.state$.pipe(map(state => state.data));
  readonly loading$ = this.state$.pipe(map(state => state.loading));
  readonly error$ = this.state$.pipe(map(state => state.error));

  loadUsers(): void {
    this.setState({ loading: true, error: null });

    this.userService.getAll().subscribe({
      next: (data) => this.setState({ data, loading: false }),
      error: (error) => this.setState({ error: error.message, loading: false })
    });
  }

  private setState(partial: Partial<State<User>>): void {
    this.state$.next({ ...this.state$.value, ...partial });
  }
}
```

## 3. Infinite Scroll

```typescript
@Injectable()
export class InfiniteScrollService<T> {
  private page$ = new BehaviorSubject(1);
  private items$ = new BehaviorSubject<T[]>([]);

  readonly data$ = this.items$.asObservable();

  constructor(private fetchFn: (page: number) => Observable<T[]>) {
    this.page$.pipe(
      switchMap(page => this.fetchFn(page)),
      scan((acc, items) => [...acc, ...items], [] as T[])
    ).subscribe(this.items$);
  }

  loadMore(): void {
    this.page$.next(this.page$.value + 1);
  }

  reset(): void {
    this.page$.next(1);
    this.items$.next([]);
  }
}
```

## 4. Optimistic Updates

```typescript
updateUserOptimistic(id: number, updates: Partial<User>): Observable<User> {
  // 1. Actualizar UI inmediatamente
  const currentUsers = this.usersSubject.value;
  const optimisticUsers = currentUsers.map(u =>
    u.id === id ? { ...u, ...updates } : u
  );
  this.usersSubject.next(optimisticUsers);

  // 2. Hacer request al servidor
  return this.userService.update(id, updates).pipe(
    catchError(error => {
      // 3. Revertir en caso de error
      this.usersSubject.next(currentUsers);
      return throwError(() => error);
    })
  );
}
```

## 5. Polling

```typescript
pollData(interval = 5000): Observable<User[]> {
  return timer(0, interval).pipe(
    switchMap(() => this.userService.getAll()),
    retry({ delay: 1000 })
  );
}
```
