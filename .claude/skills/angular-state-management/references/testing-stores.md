# Testing Stores

Testing de stores con Signals.

## Setup

```typescript
import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart.store';

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CartStore]
    });

    store = TestBed.inject(CartStore);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
```

## Test Signals

```typescript
it('should add item to cart', () => {
  const product = { id: 1, name: 'Product 1', price: 100 };

  store.addItem(product);

  expect(store.items()).toEqual([{ ...product, quantity: 1 }]);
  expect(store.itemCount()).toBe(1);
  expect(store.total()).toBe(100);
});

it('should increment quantity for existing item', () => {
  const product = { id: 1, name: 'Product 1', price: 100 };

  store.addItem(product);
  store.addItem(product);

  expect(store.items().length).toBe(1);
  expect(store.items()[0].quantity).toBe(2);
  expect(store.total()).toBe(200);
});
```

## Test Computed Signals

```typescript
it('should calculate total correctly', () => {
  store.addItem({ id: 1, name: 'P1', price: 100 }, 2);
  store.addItem({ id: 2, name: 'P2', price: 50 }, 3);

  expect(store.total()).toBe(350); // (100*2) + (50*3)
});

it('should detect empty cart', () => {
  expect(store.isEmpty()).toBe(true);

  store.addItem({ id: 1, name: 'P1', price: 100 });

  expect(store.isEmpty()).toBe(false);
});
```

## Test Effects

```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

it('should trigger effect on state change', fakeAsync(() => {
  let effectCalled = false;

  TestBed.runInInjectionContext(() => {
    effect(() => {
      store.itemCount(); // Read signal
      effectCalled = true;
    });
  });

  tick(); // Trigger initial effect

  effectCalled = false;
  store.addItem({ id: 1, name: 'P1', price: 100 });

  tick(); // Trigger effect after change

  expect(effectCalled).toBe(true);
}));
```

## Test Async Operations

```typescript
it('should handle loading state', async () => {
  expect(store.loading()).toBe(false);

  const promise = store.loadUsers();

  expect(store.loading()).toBe(true);

  await promise;

  expect(store.loading()).toBe(false);
  expect(store.data().length).toBeGreaterThan(0);
});
```

## Test localStorage Persistence

```typescript
it('should persist to localStorage', () => {
  store.addItem({ id: 1, name: 'P1', price: 100 });

  const stored = localStorage.getItem('cart_state');
  expect(stored).toBeTruthy();

  const parsed = JSON.parse(stored!);
  expect(parsed.items.length).toBe(1);
});

it('should load from localStorage', () => {
  const data = { items: [{ id: 1, name: 'P1', price: 100, quantity: 2 }] };
  localStorage.setItem('cart_state', JSON.stringify(data));

  const newStore = TestBed.inject(CartStore);

  expect(newStore.items()).toEqual(data.items);
});
```
