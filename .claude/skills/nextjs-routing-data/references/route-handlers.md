# Route Handlers - API Endpoints

Guía completa de Route Handlers en Next.js App Router para crear API endpoints tipados con TypeScript.

## ¿Qué son Route Handlers?

Route Handlers son funciones que manejan HTTP requests en Next.js App Router (reemplazo de API Routes en Pages Router).

**Convención:** Archivo `route.ts` en cualquier carpeta de `app/`.

```
app/
├── api/
│   ├── users/
│   │   ├── route.ts          # GET /api/users, POST /api/users
│   │   └── [id]/
│   │       └── route.ts      # GET /api/users/:id, PUT /api/users/:id
│   ├── posts/
│   │   └── route.ts          # CRUD de posts
│   └── auth/
│       ├── login/
│       │   └── route.ts      # POST /api/auth/login
│       └── logout/
│           └── route.ts      # POST /api/auth/logout
```

## HTTP Methods

### GET Request

```tsx
// app/api/posts/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());

  return NextResponse.json(posts);
}
```

### POST Request con Body

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface CreatePostBody {
  title: string;
  content: string;
  authorId: number;
}

export async function POST(request: NextRequest) {
  // Parsear JSON body
  const body: CreatePostBody = await request.json();

  // Validación básica
  if (!body.title || !body.content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Crear post
  const newPost = await fetch('https://api.example.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  return NextResponse.json(newPost, { status: 201 });
}
```

### PUT Request (Update)

```tsx
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

interface UpdatePostBody {
  title?: string;
  content?: string;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const body: UpdatePostBody = await request.json();

  const updatedPost = await fetch(`https://api.example.com/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  return NextResponse.json(updatedPost);
}
```

### DELETE Request

```tsx
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  await fetch(`https://api.example.com/posts/${id}`, {
    method: 'DELETE',
  });

  return NextResponse.json({ success: true, id }, { status: 200 });
}
```

### PATCH Request (Partial Update)

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface PatchUserBody {
  name?: string;
  email?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body: PatchUserBody = await request.json();

  const updatedUser = await fetch(`https://api.example.com/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

  return NextResponse.json(updatedUser);
}
```

## Request Handling

### Query Params

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Acceder a query params: /api/posts?page=2&limit=10
  const searchParams = request.nextUrl.searchParams;

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  const category = searchParams.get('category');

  const posts = await fetch(
    `https://api.example.com/posts?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`
  ).then((r) => r.json());

  return NextResponse.json(posts);
}
```

### Headers

```tsx
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Leer headers
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Validar token...
  const data = await fetchProtectedData(token);

  return NextResponse.json(data);
}
```

### Cookies

```tsx
// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Leer cookie
  const sessionId = cookies().get('sessionId')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  // Usar sessionId...
  return NextResponse.json({ sessionId });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Crear response con cookie
  const response = NextResponse.json({ success: true });

  // Set cookie
  response.cookies.set('sessionId', body.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
  });

  return response;
}
```

## Dynamic Routes

### Single Dynamic Segment

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  const user = await fetch(`https://api.example.com/users/${id}`).then((r) => r.json());

  return NextResponse.json(user);
}
```

### Multiple Dynamic Segments

```tsx
// app/api/projects/[projectId]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    projectId: string;
    taskId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { projectId, taskId } = params;

  const task = await fetch(
    `https://api.example.com/projects/${projectId}/tasks/${taskId}`
  ).then((r) => r.json());

  return NextResponse.json(task);
}
```

## Error Handling

### Try-Catch Pattern

```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const response = await fetch(`https://api.example.com/users/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const user = await response.json();

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);

    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}
```

### Custom Error Responses

```tsx
// app/api/lib/errors.ts
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('Unexpected error:', error);

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

// Uso
// app/api/posts/route.ts
import { ApiError, errorResponse } from '../lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title) {
      throw new ApiError('Title is required', 400);
    }

    // Crear post...
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
```

## Validation con Zod

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive().optional(),
});

type CreateUserBody = z.infer<typeof CreateUserSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validatedData = CreateUserSchema.parse(body);

    // Crear user con data validada
    const newUser = await createUser(validatedData);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

## Authentication Patterns

### JWT Verification

```tsx
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  email: string;
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Usar payload.userId para fetch data del user
  const userData = await fetchUserData(payload.userId);

  return NextResponse.json(userData);
}
```

### Middleware Pattern (Reusable)

```tsx
// app/api/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: number) => Promise<NextResponse>
) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Llamar handler con userId
    return handler(request, payload.userId);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Uso
// app/api/me/route.ts
import { withAuth } from '../lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    const user = await fetchUser(userId);
    return NextResponse.json(user);
  });
}
```

## Database Integration

### Prisma Example

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
```

## CORS Configuration

```tsx
// app/api/public/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const data = { message: 'Public API' };

  const response = NextResponse.json(data);

  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
```

## Rate Limiting

```tsx
// app/api/lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  request: NextRequest,
  limit: number = 10,
  windowMs: number = 60000 // 1 minuto
): NextResponse | null {
  const ip = request.ip ?? 'unknown';
  const now = Date.now();

  const record = rateLimit.get(ip);

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}

// Uso
// app/api/posts/route.ts
import { checkRateLimit } from '../lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, 5, 60000); // 5 requests/min
  if (rateLimitResponse) return rateLimitResponse;

  // Continuar con la lógica...
  return NextResponse.json({ success: true });
}
```

## File Upload

```tsx
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
    }

    // Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar archivo
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ filename, url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

## Mejores Prácticas

### ✅ TypeScript
1. **Tipar requests/responses** - Interfaces para body, params, responses
2. **Validación runtime** - Usar Zod/Yup para validar input
3. **Type guards** - Para error handling

### ✅ Security
1. **Validar input** - Nunca confiar en data del cliente
2. **Rate limiting** - Prevenir abuse
3. **Authentication** - JWT, session cookies
4. **CORS** - Configurar origins permitidos
5. **Sanitize data** - Prevenir SQL injection, XSS

### ✅ Performance
1. **Database indexes** - Para queries frecuentes
2. **Caching** - Redis para data que cambia poco
3. **Pagination** - No retornar todo dataset
4. **Async operations** - Background jobs con queues

### ✅ Error Handling
1. **Try-catch** - En todas las rutas
2. **Status codes correctos** - 200, 201, 400, 401, 404, 500
3. **Error logging** - Para debugging
4. **User-friendly messages** - No exponer detalles internos

## Resumen

Route Handlers en Next.js App Router:
- ✅ Full control sobre HTTP methods (GET, POST, PUT, DELETE, PATCH)
- ✅ TypeScript first-class support
- ✅ Acceso a request (body, headers, cookies, query params)
- ✅ Integración directa con databases
- ✅ Middleware patterns para auth, rate limiting
- ✅ File uploads, CORS, validación con Zod

**Patrón recomendado:** Validar → Autenticar → Procesar → Retornar
