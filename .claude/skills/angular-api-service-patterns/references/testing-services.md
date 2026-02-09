# Testing Services

Testing de servicios API con HttpTestingController.

## Setup

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService
      ]
    });

    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });
});
```

## Test CRUD Operations

```typescript
it('should get all users', () => {
  const mockUsers: User[] = [
    { id: 1, name: 'User 1', email: 'user1@test.com', role: 'user', createdAt: '', updatedAt: '' }
  ];

  service.getAll().subscribe(users => {
    expect(users).toEqual(mockUsers);
  });

  const req = httpTesting.expectOne('/api/users');
  expect(req.request.method).toBe('GET');
  req.flush({ success: true, data: mockUsers });
});

it('should create user', () => {
  const newUser = { name: 'New User', email: 'new@test.com', password: '123' };
  const created: User = { id: 1, ...newUser, role: 'user', createdAt: '', updatedAt: '' };

  service.create(newUser).subscribe(user => {
    expect(user).toEqual(created);
  });

  const req = httpTesting.expectOne('/api/users');
  expect(req.request.method).toBe('POST');
  expect(req.request.body).toEqual(newUser);
  req.flush({ success: true, data: created });
});
```

## Test Cache

```typescript
it('should cache getById results', fakeAsync(() => {
  const user: User = { id: 1, name: 'User', email: 'user@test.com', role: 'user', createdAt: '', updatedAt: '' };

  // Primera llamada
  service.getById(1).subscribe();
  const req1 = httpTesting.expectOne('/api/users/1');
  req1.flush({ success: true, data: user });

  tick();

  // Segunda llamada (debe usar cache)
  service.getById(1).subscribe(result => {
    expect(result).toEqual(user);
  });

  // No debe haber segunda request HTTP
  httpTesting.expectNone('/api/users/1');
}));
```
