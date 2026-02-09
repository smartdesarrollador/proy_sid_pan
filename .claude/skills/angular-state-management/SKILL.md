---
name: angular-state-management
description: >
  State management moderno con Angular Signals sin dependencias externas. Usar cuando se necesite
  gestionar estado con WritableSignal, computed signals, effects, BaseStore genérico, stores específicos
  (AuthStore, CartStore, UIStore), sincronización con APIs, estado global vs local, patterns con RxJS
  BehaviorSubject, toSignal(), actualización optimista, loading/error handling, o inmutabilidad.
  Código plug-and-play con best practices para proyectos Angular standalone.
---

# Angular State Management con Signals

Patrones modernos de state management usando Angular Signals (16+) sin librerías externas.

## 1. BaseStore Genérico

```typescript
// src/app/core/store/base.store.ts
import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * Estado base con loading y error
 */
export interface StoreState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Store base genérico para gestión de estado
 * @template T - Tipo de datos del estado
 */
export abstract class BaseStore<T> {
  /**
   * Estado privado writable
   */
  protected state: WritableSignal<StoreState<T>>;

  /**
   * Estado público readonly
   */
  readonly $state: Signal<StoreState<T>>;

  /**
   * Selectores derivados
   */
  readonly data: Signal<T>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly hasError: Signal<boolean>;
  readonly isIdle: Signal<boolean>;

  constructor(initialState: T) {
    // Inicializar estado
    this.state = signal<StoreState<T>>({
      data: initialState,
      loading: false,
      error: null
    });

    // Exponer estado readonly
    this.$state = this.state.asReadonly();

    // Computed signals para selectores
    this.data = computed(() => this.state().data);
    this.loading = computed(() => this.state().loading);
    this.error = computed(() => this.state().error);
    this.hasError = computed(() => this.state().error !== null);
    this.isIdle = computed(() => !this.state().loading && this.state().error === null);
  }

  /**
   * Actualizar estado completo
   */
  protected setState(newState: Partial<StoreState<T>>): void {
    this.state.update(state => ({
      ...state,
      ...newState
    }));
  }

  /**
   * Actualizar solo data
   */
  protected setData(data: T): void {
    this.state.update(state => ({
      ...state,
      data
    }));
  }

  /**
   * Actualizar data parcialmente (útil para objetos)
   */
  protected updateData(partial: Partial<T>): void {
    this.state.update(state => ({
      ...state,
      data: { ...state.data, ...partial }
    }));
  }

  /**
   * Establecer loading
   */
  protected setLoading(loading: boolean): void {
    this.state.update(state => ({
      ...state,
      loading,
      error: loading ? null : state.error // Limpiar error al cargar
    }));
  }

  /**
   * Establecer error
   */
  protected setError(error: string | null): void {
    this.state.update(state => ({
      ...state,
      error,
      loading: false
    }));
  }

  /**
   * Resetear a estado inicial
   */
  abstract reset(): void;
}
```

## 2. AuthStore - Estado de Autenticación

```typescript
// src/app/core/store/auth.store.ts
import { Injectable, inject, computed } from '@angular/core';
import { BaseStore } from './base.store';
import { AuthService } from '@core/services/auth.service';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore extends BaseStore<AuthState> {
  private authService = inject(AuthService);

  // Computed signals derivados
  readonly isAuthenticated = computed(() => this.data().user !== null);
  readonly currentUser = computed(() => this.data().user);
  readonly isAdmin = computed(() => this.data().user?.role === 'admin');

  constructor() {
    super({
      user: null,
      token: null
    });

    // Cargar usuario desde localStorage al iniciar
    this.loadFromStorage();
  }

  /**
   * Login de usuario
   */
  async login(email: string, password: string): Promise<void> {
    this.setLoading(true);

    try {
      const response = await this.authService.login(email, password).toPromise();

      this.setData({
        user: response.user,
        token: response.token
      });

      // Guardar en localStorage
      this.saveToStorage();
    } catch (error: any) {
      this.setError(error.message || 'Error al iniciar sesión');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.setData({
      user: null,
      token: null
    });
    localStorage.removeItem('auth_state');
  }

  /**
   * Actualizar perfil de usuario
   */
  updateProfile(updates: Partial<User>): void {
    const currentData = this.data();
    if (!currentData.user) return;

    this.setData({
      ...currentData,
      user: { ...currentData.user, ...updates }
    });

    this.saveToStorage();
  }

  /**
   * Guardar en localStorage
   */
  private saveToStorage(): void {
    localStorage.setItem('auth_state', JSON.stringify(this.data()));
  }

  /**
   * Cargar desde localStorage
   */
  private loadFromStorage(): void {
    const stored = localStorage.getItem('auth_state');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.setData(data);
      } catch (error) {
        console.error('Error loading auth state:', error);
      }
    }
  }

  /**
   * Reset
   */
  reset(): void {
    this.logout();
  }
}
```

## 3. CartStore - Carrito de Compras

```typescript
// src/app/core/store/cart.store.ts
import { Injectable, computed } from '@angular/core';
import { BaseStore } from './base.store';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartState {
  items: CartItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CartStore extends BaseStore<CartState> {
  // Computed signals
  readonly items = computed(() => this.data().items);
  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );
  readonly isEmpty = computed(() => this.items().length === 0);

  constructor() {
    super({ items: [] });
    this.loadFromStorage();
  }

  /**
   * Agregar item al carrito
   */
  addItem(product: Omit<CartItem, 'quantity'>, quantity = 1): void {
    const items = this.items();
    const existingItem = items.find(item => item.id === product.id);

    if (existingItem) {
      // Incrementar cantidad si ya existe
      this.updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      // Agregar nuevo item
      this.setData({
        items: [...items, { ...product, quantity }]
      });
    }

    this.saveToStorage();
  }

  /**
   * Remover item del carrito
   */
  removeItem(productId: number): void {
    this.setData({
      items: this.items().filter(item => item.id !== productId)
    });
    this.saveToStorage();
  }

  /**
   * Actualizar cantidad de un item
   */
  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    this.setData({
      items: this.items().map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    });
    this.saveToStorage();
  }

  /**
   * Limpiar carrito
   */
  clear(): void {
    this.setData({ items: [] });
    this.saveToStorage();
  }

  /**
   * Guardar en localStorage
   */
  private saveToStorage(): void {
    localStorage.setItem('cart_state', JSON.stringify(this.data()));
  }

  /**
   * Cargar desde localStorage
   */
  private loadFromStorage(): void {
    const stored = localStorage.getItem('cart_state');
    if (stored) {
      try {
        this.setData(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }

  reset(): void {
    this.clear();
  }
}
```

## 4. UIStore - Estado de UI Global

```typescript
// src/app/core/store/ui.store.ts
import { Injectable, computed } from '@angular/core';
import { BaseStore } from './base.store';

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UIStore extends BaseStore<UIState> {
  // Computed signals
  readonly sidebarOpen = computed(() => this.data().sidebarOpen);
  readonly theme = computed(() => this.data().theme);
  readonly notifications = computed(() => this.data().notifications);
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  constructor() {
    super({
      sidebarOpen: true,
      theme: 'light',
      notifications: []
    });

    this.loadTheme();
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.updateData({
      sidebarOpen: !this.sidebarOpen()
    });
  }

  /**
   * Cambiar tema
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.updateData({ theme });
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Toggle tema
   */
  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  /**
   * Agregar notificación
   */
  addNotification(notification: Omit<Notification, 'id'>): void {
    const id = crypto.randomUUID();
    const newNotification: Notification = { id, ...notification };

    this.updateData({
      notifications: [...this.notifications(), newNotification]
    });

    // Auto-remover después de duration
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }
  }

  /**
   * Remover notificación
   */
  removeNotification(id: string): void {
    this.updateData({
      notifications: this.notifications().filter(n => n.id !== id)
    });
  }

  /**
   * Cargar tema desde localStorage
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.setTheme(savedTheme);
    }
  }

  reset(): void {
    this.setState({
      data: {
        sidebarOpen: true,
        theme: 'light',
        notifications: []
      },
      loading: false,
      error: null
    });
  }
}
```

## 5. Uso en Componentes

```typescript
// src/app/features/products/products.component.ts
import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStore } from '@core/store/cart.store';
import { AuthStore } from '@core/store/auth.store';
import { UIStore } from '@core/store/ui.store';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="products-container">
      <!-- Header con info de usuario -->
      <header>
        @if (authStore.isAuthenticated()) {
          <p>Bienvenido, {{ authStore.currentUser()?.name }}</p>
          <button (click)="authStore.logout()">Logout</button>
        }

        <!-- Carrito -->
        <div class="cart-badge">
          🛒 {{ cartStore.itemCount() }}
          <span>Total: ${{ cartStore.total() }}</span>
        </div>
      </header>

      <!-- Lista de productos -->
      <div class="products-grid">
        @for (product of products; track product.id) {
          <div class="product-card">
            <h3>{{ product.name }}</h3>
            <p>{{ product.price | currency }}</p>
            <button (click)="addToCart(product)">
              Agregar al Carrito
            </button>
          </div>
        }
      </div>

      <!-- Notificaciones -->
      @if (uiStore.hasNotifications()) {
        <div class="notifications">
          @for (notification of uiStore.notifications(); track notification.id) {
            <div [class]="'alert alert-' + notification.type">
              {{ notification.message }}
              <button (click)="uiStore.removeNotification(notification.id)">×</button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProductsComponent {
  cartStore = inject(CartStore);
  authStore = inject(AuthStore);
  uiStore = inject(UIStore);

  products = [
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 },
  ];

  constructor() {
    // Effect para logging cuando cambia el carrito
    effect(() => {
      console.log('Cart updated:', {
        items: this.cartStore.itemCount(),
        total: this.cartStore.total()
      });
    });
  }

  addToCart(product: any): void {
    this.cartStore.addItem(product);

    this.uiStore.addNotification({
      type: 'success',
      message: `${product.name} agregado al carrito`,
      duration: 3000
    });
  }
}
```

## 6. Integración con RxJS

```typescript
// src/app/core/store/products.store.ts
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductService } from '@core/services/product.service';

export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsStore {
  private productService = inject(ProductService);

  // Estado con BehaviorSubject
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  products$ = this.productsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  // Convertir a signals
  products = toSignal(this.products$, { initialValue: [] });
  loading = toSignal(this.loading$, { initialValue: false });

  /**
   * Cargar productos
   */
  loadProducts(): void {
    this.loadingSubject.next(true);

    this.productService.getAll().subscribe({
      next: (products) => {
        this.productsSubject.next(products);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Agregar producto (actualización optimista)
   */
  addProduct(product: Product): void {
    // 1. Actualizar UI inmediatamente
    const current = this.productsSubject.value;
    this.productsSubject.next([...current, product]);

    // 2. Sincronizar con servidor
    this.productService.create(product).subscribe({
      next: (created) => {
        // Actualizar con datos del servidor
        const updated = this.productsSubject.value.map(p =>
          p.id === product.id ? created : p
        );
        this.productsSubject.next(updated);
      },
      error: () => {
        // Revertir en caso de error
        this.productsSubject.next(current);
      }
    });
  }
}
```

## 7. Effects para Side Effects

```typescript
import { Component, inject, effect, signal } from '@angular/core';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <button (click)="toggleTheme()">
      {{ theme() === 'light' ? '🌙' : '☀️' }}
    </button>
  `
})
export class ThemeSwitcherComponent {
  private uiStore = inject(UIStore);

  theme = this.uiStore.theme;

  constructor() {
    // Effect se ejecuta cuando theme() cambia
    effect(() => {
      const theme = this.theme();
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(theme);
      console.log('Theme changed to:', theme);
    });
  }

  toggleTheme(): void {
    this.uiStore.toggleTheme();
  }
}
```

## Best Practices

1. **Inmutabilidad**: Siempre crear nuevos objetos, no mutar
2. **Single Source of Truth**: Un solo store por dominio
3. **Computed Signals**: Para valores derivados
4. **Effects**: Solo para side effects (DOM, localStorage, logs)
5. **toSignal()**: Convertir Observables a Signals
6. **Estado Local vs Global**:
   - Global: Auth, UI, Cart (compartido entre componentes)
   - Local: Form state, component-specific data
7. **Async**: Usar async/await o RxJS según preferencia
8. **Reset**: Siempre implementar método reset()

## Referencias

- **RxJS Integration**: Ver `references/rxjs-integration.md`
- **Advanced Patterns**: Ver `references/advanced-patterns.md`
- **Testing Stores**: Ver `references/testing-stores.md`

## Checklist

- [ ] Crear BaseStore genérico
- [ ] Implementar AuthStore
- [ ] Implementar CartStore
- [ ] Implementar UIStore
- [ ] Usar computed signals para valores derivados
- [ ] Implementar effects para side effects
- [ ] Integrar toSignal() para Observables
- [ ] Agregar persistencia con localStorage
- [ ] Testear stores
- [ ] Documentar estado global vs local
