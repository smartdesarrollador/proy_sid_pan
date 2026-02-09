# Cache Strategies

Estrategias avanzadas de cache para servicios API.

## 1. Cache con BehaviorSubject

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CachedUserService {
  private cache$ = new BehaviorSubject<User[] | null>(null);

  getUsers(forceRefresh = false): Observable<User[]> {
    if (!forceRefresh && this.cache$.value) {
      return of(this.cache$.value);
    }

    return this.http.get<User[]>('/api/users').pipe(
      tap(users => this.cache$.next(users))
    );
  }

  clearCache(): void {
    this.cache$.next(null);
  }
}
```

## 2. Cache con TTL y Map

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 3. Cache con localStorage

```typescript
class LocalStorageCache {
  private readonly prefix = 'api_cache_';

  set<T>(key: string, data: T, ttl = 3600000): void {
    const entry = {
      data,
      expires: Date.now() + ttl
    };
    localStorage.setItem(this.prefix + key, JSON.stringify(entry));
  }

  get<T>(key: string): T | null {
    const item = localStorage.getItem(this.prefix + key);
    if (!item) return null;

    const entry = JSON.parse(item);
    if (Date.now() > entry.expires) {
      localStorage.removeItem(this.prefix + key);
      return null;
    }

    return entry.data;
  }
}
```

## 4. Estrategia Stale-While-Revalidate

```typescript
staleWhileRevalidate(key: string): Observable<User[]> {
  const cached = this.cache.get<User[]>(key);

  // Retornar cache inmediatamente si existe
  if (cached) {
    // Revalidar en background
    this.http.get<User[]>('/api/users').pipe(
      tap(data => this.cache.set(key, data))
    ).subscribe();

    return of(cached);
  }

  // Si no hay cache, fetch normal
  return this.http.get<User[]>('/api/users').pipe(
    tap(data => this.cache.set(key, data))
  );
}
```
