# Jasmine + Karma Configuration (Alternative to Jest)

Si prefieres usar Jasmine con Karma (configuración por defecto de Angular CLI):

## Configuración de Karma

### karma.conf.js

```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: false, // Disable random test order for consistency
        seed: 42,
        stopSpecOnExpectationFailure: false
      },
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    },
    reporters: ['progress', 'kjhtml', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      }
    },
    singleRun: false,
    restartOnFileChange: true,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000
  });
};
```

### package.json scripts

```json
{
  "scripts": {
    "test": "ng test",
    "test:ci": "ng test --no-watch --code-coverage --browsers=ChromeHeadlessCI",
    "test:coverage": "ng test --no-watch --code-coverage",
    "test:debug": "ng test --browsers=Chrome --watch=true --source-map=true"
  }
}
```

## Jasmine Matchers

### Basic Matchers

```typescript
describe('Jasmine Matchers', () => {
  it('should demonstrate basic matchers', () => {
    // Equality
    expect(true).toBe(true);
    expect({ a: 1 }).toEqual({ a: 1 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);

    // Truthiness
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
    expect(value).toBeDefined();

    // Comparison
    expect(10).toBeGreaterThan(5);
    expect(5).toBeLessThan(10);
    expect(10).toBeGreaterThanOrEqual(10);
    expect(10).toBeLessThanOrEqual(10);

    // String matching
    expect('Hello World').toContain('World');
    expect('test@example.com').toMatch(/^[a-z]+@[a-z]+\.[a-z]+$/);

    // Array/Object
    expect([1, 2, 3]).toContain(2);
    expect({ name: 'John', age: 30 }).toEqual(
      jasmine.objectContaining({ name: 'John' })
    );

    // Type checking
    expect(() => {}).toEqual(jasmine.any(Function));
    expect([1, 2, 3]).toEqual(jasmine.any(Array));
    expect('test').toEqual(jasmine.any(String));

    // Negation
    expect(value).not.toBe(otherValue);
  });
});
```

### Custom Matchers

```typescript
// custom-matchers.ts
export const customMatchers: jasmine.CustomMatcherFactories = {
  toBeWithinRange: () => ({
    compare: (actual: number, min: number, max: number) => {
      const pass = actual >= min && actual <= max;
      const message = pass
        ? `Expected ${actual} not to be within range ${min}-${max}`
        : `Expected ${actual} to be within range ${min}-${max}`;

      return { pass, message };
    }
  }),

  toHaveBeenCalledWithSignal: () => ({
    compare: (spy: jasmine.Spy, expectedValue: any) => {
      const calls = spy.calls.all();
      const pass = calls.some(call => {
        const arg = call.args[0];
        return typeof arg === 'function' ? arg() === expectedValue : arg === expectedValue;
      });

      return {
        pass,
        message: `Expected spy to have been called with signal value ${expectedValue}`
      };
    }
  })
};

// Usage in tests
beforeEach(() => {
  jasmine.addMatchers(customMatchers);
});

it('should be within range', () => {
  expect(15).toBeWithinRange(10, 20);
});
```

## Jasmine Spies

### Creating Spies

```typescript
describe('Jasmine Spies', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should spy on method', () => {
    spyOn(userService, 'getUsers').and.returnValue(of([]));

    userService.getUsers().subscribe(users => {
      expect(users).toEqual([]);
    });

    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should spy with callThrough', () => {
    spyOn(userService, 'getUsers').and.callThrough();

    // Calls actual implementation
    userService.getUsers();

    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should spy with callFake', () => {
    spyOn(userService, 'getUsers').and.callFake(() => {
      return of([{ id: '1', name: 'Fake User' }]);
    });

    userService.getUsers().subscribe(users => {
      expect(users[0].name).toBe('Fake User');
    });
  });

  it('should spy with returnValues', () => {
    spyOn(userService, 'getUsers')
      .and.returnValues(
        of([{ id: '1' }]),
        of([{ id: '1' }, { id: '2' }]),
        of([])
      );

    // First call
    userService.getUsers().subscribe(users => {
      expect(users.length).toBe(1);
    });

    // Second call
    userService.getUsers().subscribe(users => {
      expect(users.length).toBe(2);
    });

    // Third call
    userService.getUsers().subscribe(users => {
      expect(users.length).toBe(0);
    });
  });

  it('should create spy object', () => {
    const spy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'createUser',
      'deleteUser'
    ]);

    spy.getUsers.and.returnValue(of([]));

    expect(spy.getUsers).toBeDefined();
    expect(spy.createUser).toBeDefined();
  });

  it('should check spy calls', () => {
    spyOn(userService, 'getUserById');

    userService.getUserById('1');
    userService.getUserById('2');

    expect(userService.getUserById).toHaveBeenCalledTimes(2);
    expect(userService.getUserById).toHaveBeenCalledWith('1');
    expect(userService.getUserById).toHaveBeenCalledWith('2');

    // First call
    expect(userService.getUserById).toHaveBeenCalledBefore(userService.getUsers as any);
  });
});
```

## Jasmine Async Utilities

### done() callback

```typescript
it('should handle async with done', (done) => {
  service.getData().subscribe(data => {
    expect(data).toBeTruthy();
    done();
  });
});

it('should handle async errors with done', (done) => {
  service.getData().subscribe({
    next: () => fail('Should have failed'),
    error: (error) => {
      expect(error).toBeTruthy();
      done();
    }
  });
});
```

### waitForAsync (formerly async)

```typescript
import { waitForAsync } from '@angular/core/testing';

it('should handle async operations', waitForAsync(() => {
  service.getData().subscribe(data => {
    expect(data).toBeTruthy();
  });
}));
```

## Jasmine Clock

```typescript
describe('Jasmine Clock', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should advance time', () => {
    let called = false;

    setTimeout(() => {
      called = true;
    }, 1000);

    expect(called).toBe(false);

    jasmine.clock().tick(1000);

    expect(called).toBe(true);
  });

  it('should mock Date', () => {
    const baseTime = new Date(2024, 0, 1);
    jasmine.clock().mockDate(baseTime);

    expect(new Date().getTime()).toBe(baseTime.getTime());

    jasmine.clock().tick(1000);

    expect(new Date().getTime()).toBe(baseTime.getTime() + 1000);
  });
});
```

## Jasmine vs Jest Comparison

| Feature | Jasmine | Jest |
|---------|---------|------|
| Setup | Built-in with Angular | Requires installation |
| Speed | Slower (browser-based) | Faster (Node-based) |
| Snapshot Testing | No | Yes |
| Code Coverage | Via Istanbul | Built-in |
| Mocking | Manual | Auto-mocking |
| Watch Mode | Basic | Advanced |
| Parallel Tests | No | Yes |
| Migration | N/A | Requires effort |

## Migration from Jasmine to Jest

### Key Changes

```typescript
// Jasmine
it('test', () => {
  spyOn(service, 'method').and.returnValue(of(data));
});

// Jest
it('test', () => {
  jest.spyOn(service, 'method').mockReturnValue(of(data));
});

// Jasmine
expect(spy).toHaveBeenCalled();

// Jest (same)
expect(spy).toHaveBeenCalled();

// Jasmine
jasmine.createSpyObj('Service', ['method']);

// Jest
jest.fn() or jest.mock()
```
