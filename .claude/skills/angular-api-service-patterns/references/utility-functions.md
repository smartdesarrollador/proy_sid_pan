# Utility Functions

Funciones de utilidad para servicios API.

## URL Builders

```typescript
// src/app/core/utils/url-builder.ts

export class UrlBuilder {
  private segments: string[] = [];
  private queryParams: Record<string, any> = {};

  constructor(private baseUrl: string) {}

  segment(path: string): this {
    this.segments.push(path);
    return this;
  }

  param(key: string, value: any): this {
    if (value !== null && value !== undefined) {
      this.queryParams[key] = value;
    }
    return this;
  }

  params(params: Record<string, any>): this {
    Object.entries(params).forEach(([key, value]) => {
      this.param(key, value);
    });
    return this;
  }

  build(): string {
    let url = [this.baseUrl, ...this.segments].join('/');

    const queryString = Object.entries(this.queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `${url}?${queryString}` : url;
  }
}

// Uso:
const url = new UrlBuilder('https://api.com')
  .segment('users')
  .segment('123')
  .param('include', 'posts')
  .build();
// https://api.com/users/123?include=posts
```

## Query String Helpers

```typescript
export function buildQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(v => `${key}[]=${encodeURIComponent(v)}`).join('&');
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

export function parseQueryString(queryString: string): Record<string, any> {
  const params: Record<string, any> = {};
  const pairs = queryString.slice(1).split('&');

  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  });

  return params;
}
```

## Transformers

```typescript
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}

export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }

  return obj;
}
```

## Validators

```typescript
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>\"']/g, '');
}
```
