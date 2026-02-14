---
name: nextjs-deployment
description: >
  Guía completa de deployment de Next.js con TypeScript en Vercel, self-hosted, edge functions, middleware y optimización de producción.
  Usar cuando se necesite: Vercel deployment (vercel.json, env vars, preview deploys), self-hosted deployment (Docker, standalone, PM2),
  build configuration (next.config.js, output modes), environment variables, edge functions, middleware, caching strategies,
  performance optimization, monitoring, CI/CD pipelines. Incluye Vercel como primera opción, self-hosted como alternativa,
  edge computing, zero-downtime deploys y mejores prácticas de producción.
---

# Next.js Deployment - TypeScript

Guía completa para deployar aplicaciones Next.js con TypeScript en producción, cubriendo Vercel, self-hosted, edge computing y optimización.

## 1. Vercel Deployment (Recomendado)

Vercel es la plataforma oficial de Next.js con soporte nativo y cero configuración.

### Setup Inicial

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy desde directorio del proyecto
vercel

# Deploy a producción
vercel --prod
```

### vercel.json - Configuración

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database-url"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1, stale-while-revalidate"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

### Environment Variables

**Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Agregar variables con scopes: Production, Preview, Development
3. Secrets se encriptan automáticamente

**Desde CLI:**
```bash
# Agregar variable de entorno
vercel env add NEXT_PUBLIC_API_URL production

# Listar variables
vercel env ls

# Pull variables localmente
vercel env pull .env.local
```

### Preview Deployments

Cada push a una branch no-main crea un preview deployment automático:

```bash
# Cada PR automáticamente genera:
# https://my-app-git-feature-branch-username.vercel.app

# Deploy manual de preview
vercel

# Deploy de producción (main branch)
vercel --prod
```

**Configuración en GitHub:**
- Settings → Integrations → Vercel
- Auto-deploy on push (Production + Preview)
- Preview comments en PRs

---

## 2. Self-Hosted Deployment

Para casos donde Vercel no es opción (compliance, on-premise, custom infra).

### Opción 1: Standalone Output (Recomendado)

Next.js puede generar un build autocontenido optimizado.

**next.config.js:**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Opcional: copiar archivos públicos
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig
```

**Build y ejecución:**
```bash
# Build
npm run build

# Output en .next/standalone/
# Copiar archivos estáticos manualmente
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Ejecutar servidor
cd .next/standalone
node server.js

# Con PM2
pm2 start server.js --name nextjs-app
```

### Opción 2: Docker Deployment

**Dockerfile** (multi-stage optimizado):

```dockerfile
# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Build con args de tiempo de compilación
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://api.example.com
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://example.com
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - nextjs
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**Build y run:**
```bash
# Build imagen
docker build -t nextjs-app .

# Run contenedor
docker run -p 3000:3000 nextjs-app

# Con docker-compose
docker-compose up -d
```

### Opción 3: PM2 (Node Server)

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
    },
  ],
}
```

**Comandos PM2:**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar app
pm2 start ecosystem.config.js

# Listar apps
pm2 list

# Monitorear
pm2 monit

# Logs
pm2 logs nextjs-app

# Restart
pm2 restart nextjs-app

# Setup auto-start en boot
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

**nginx.conf:**

```nginx
upstream nextjs_upstream {
  server localhost:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name example.com www.example.com;

  # Redirect HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  # SSL Configuration
  ssl_certificate /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Gzip Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  gzip_vary on;

  # Static Files Caching
  location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://nextjs_upstream;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location /static {
    proxy_cache STATIC;
    proxy_ignore_headers Cache-Control;
    proxy_cache_valid 60m;
    proxy_pass http://nextjs_upstream;
  }

  # Main Proxy
  location / {
    proxy_pass http://nextjs_upstream;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 3. Build Configuration

### next.config.js Optimizado

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output mode
  output: 'standalone', // Para self-hosted
  // output: 'export', // Para static export (SSG only)

  // Optimización
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Compresión
  compress: true,

  // Imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['cdn.example.com', 'images.example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
    ]
  },

  // Rewrites (proxying)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ]
  },

  // Webpack customization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },

  // Environment variables públicas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

### Output Modes

**1. Standalone (Default para Server-Side):**
```typescript
// next.config.js
module.exports = {
  output: 'standalone',
}
```
- Genera `.next/standalone/` con servidor autocontenido
- Ideal para Docker, PM2, self-hosted
- Soporta SSR, ISR, API routes

**2. Static Export (Solo SSG):**
```typescript
// next.config.js
module.exports = {
  output: 'export',
}
```
- Genera `out/` con HTML estático
- No soporta SSR, ISR, API routes, middleware
- Ideal para CDN (Cloudflare Pages, Netlify, S3)

**3. Default (Vercel/Serverless):**
```typescript
// next.config.js
module.exports = {
  // Sin 'output' field
}
```
- Build optimizado para Vercel
- Soporta todas las features de Next.js

---

## 4. Environment Variables

### Tipos de Variables

**1. Public (Client-side):**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```
- Prefix `NEXT_PUBLIC_` es obligatorio
- Se exponen en el bundle del cliente
- Disponibles en `process.env.NEXT_PUBLIC_API_URL`

**2. Private (Server-only):**
```bash
# .env.local
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SECRET_KEY=super-secret-key-123
STRIPE_SECRET_KEY=sk_test_xxxxx
```
- NO tienen prefix `NEXT_PUBLIC_`
- Solo disponibles en server-side (API routes, getServerSideProps)
- **NUNCA** expuestas al cliente

### Archivos de Environment

```plaintext
.env                # Defaults para todos los entornos
.env.local          # Local overrides (NO commitear)
.env.development    # Development environment
.env.production     # Production environment
.env.test           # Test environment
```

**Prioridad** (mayor a menor):
1. `.env.$(NODE_ENV).local`
2. `.env.local`
3. `.env.$(NODE_ENV)`
4. `.env`

### Validación con Zod (Recomendado)

**env.ts:**
```typescript
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
})

const env = envSchema.parse(process.env)

export default env
```

**Uso:**
```typescript
import env from '@/lib/env'

export default async function handler(req, res) {
  const response = await fetch(env.NEXT_PUBLIC_API_URL)
  // ...
}
```

### Secrets Management

**Vercel:**
```bash
vercel env add DATABASE_URL production
```

**Docker:**
```bash
docker run -e DATABASE_URL="$DATABASE_URL" nextjs-app
```

**Docker Secrets (Swarm):**
```yaml
version: '3.8'
services:
  nextjs:
    image: nextjs-app
    secrets:
      - database_url
    environment:
      - DATABASE_URL_FILE=/run/secrets/database_url

secrets:
  database_url:
    external: true
```

**AWS Secrets Manager:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({ region: 'us-east-1' })

export async function getSecret(secretName: string) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  )
  return response.SecretString
}
```

---

## 5. Edge Functions & Edge Runtime

Edge Functions ejecutan en Edge Network (CDN) cerca del usuario para latencia ultra-baja.

### Edge Runtime en Route Handlers

**app/api/hello/route.ts:**
```typescript
export const runtime = 'edge'

export async function GET(request: Request) {
  return new Response('Hello from the Edge!', {
    status: 200,
    headers: {
      'content-type': 'text/plain',
    },
  })
}
```

### Edge Runtime en Pages

**app/dashboard/page.tsx:**
```typescript
export const runtime = 'edge'

export default function Dashboard() {
  return <div>Dashboard rendered at the Edge</div>
}
```

### Geolocation

```typescript
export const runtime = 'edge'

export async function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') || 'Unknown'
  const city = request.headers.get('x-vercel-ip-city') || 'Unknown'

  return new Response(
    JSON.stringify({
      country,
      city,
      message: `Hello from ${city}, ${country}!`,
    }),
    {
      headers: { 'content-type': 'application/json' },
    }
  )
}
```

### A/B Testing en Edge

**app/api/ab-test/route.ts:**
```typescript
export const runtime = 'edge'

export async function GET(request: Request) {
  const bucket = Math.random() < 0.5 ? 'A' : 'B'

  return new Response(
    JSON.stringify({
      bucket,
      feature: bucket === 'A' ? 'Original' : 'Variant',
    }),
    {
      headers: {
        'content-type': 'application/json',
        'x-ab-bucket': bucket,
      },
    }
  )
}
```

### Regional Deployment (Vercel)

**vercel.json:**
```json
{
  "regions": ["iad1", "sfo1", "lhr1", "hnd1"]
}
```

Regions: `iad1` (US East), `sfo1` (US West), `lhr1` (London), `hnd1` (Tokyo), etc.

---

## 6. Middleware

Middleware ejecuta **antes** de cada request, ideal para auth, redirects, rewrites.

### middleware.ts

**Ubicación:** Root del proyecto (mismo nivel que `app/`)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Logging
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`)

  // 2. Authentication check
  const token = request.cookies.get('auth-token')
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Custom header
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  return response
}

// Configuración de rutas
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Redirects Condicionales

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US'

  // Redirect usuarios de EU a página específica
  if (country === 'DE' || country === 'FR') {
    return NextResponse.redirect(new URL('/eu', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}
```

### A/B Testing

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const bucket = request.cookies.get('ab-test-bucket')

  if (!bucket) {
    const newBucket = Math.random() < 0.5 ? 'A' : 'B'
    const response = NextResponse.next()
    response.cookies.set('ab-test-bucket', newBucket, { maxAge: 60 * 60 * 24 * 30 })
    return response
  }

  return NextResponse.next()
}
```

### Rate Limiting

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

### Authentication con JWT

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
}
```

---

## 7. Caching Strategies

### Cache-Control Headers

**app/api/data/route.ts:**
```typescript
export async function GET() {
  const data = await fetchData()

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Cache por 60 segundos, revalidate stale en background
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  })
}
```

**Estrategias comunes:**
```typescript
// No cache
'Cache-Control': 'no-store'

// Cache 5 minutos
'Cache-Control': 'public, max-age=300'

// Cache 1 hora, revalidate stale
'Cache-Control': 's-maxage=3600, stale-while-revalidate'

// Cache inmutable (assets estáticos)
'Cache-Control': 'public, max-age=31536000, immutable'
```

### Static Assets Caching

Next.js automáticamente cachea archivos en `/_next/static/` con hash:

```html
<!-- Automáticamente cacheado por 1 año -->
<script src="/_next/static/chunks/main-abc123.js"></script>
```

**Configuración en next.config.js:**
```typescript
module.exports = {
  // Generar ETags para validación de cache
  generateEtags: true,

  // Headers personalizados
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### ISR Cache

**Incremental Static Regeneration** cachea páginas estáticas y las regenera en background:

```typescript
// app/posts/[slug]/page.tsx
export const revalidate = 3600 // Revalidate cada 1 hora

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}
```

**On-Demand Revalidation:**
```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { path } = await request.json()
  revalidatePath(path)
  return Response.json({ revalidated: true })
}
```

### CDN Caching (Vercel)

Vercel automáticamente cachea en su CDN global:

```typescript
// Función que será cacheada en CDN
export const revalidate = 60 // Revalidate cada 60 segundos

export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

### Redis Caching (Custom)

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function GET(request: Request) {
  const cacheKey = 'api:users:all'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return Response.json(cached)
  }

  const data = await fetchUsers()
  await redis.set(cacheKey, data, { ex: 3600 }) // Cache 1 hora

  return Response.json(data)
}
```

---

## 8. Performance Optimization

### Bundle Analysis

```bash
# Instalar analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... resto de config
})

# Analizar bundle
ANALYZE=true npm run build
```

### Code Splitting

**Dynamic Imports:**
```typescript
import dynamic from 'next/dynamic'

// Component con code splitting
const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Opcional: deshabilitar SSR
})

export default function Page() {
  return <HeavyComponent />
}
```

**Conditional Loading:**
```typescript
import dynamic from 'next/dynamic'

const AdminPanel = dynamic(() => import('@/components/AdminPanel'))

export default function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      {isAdmin && <AdminPanel />}
    </div>
  )
}
```

### Image Optimization

```typescript
import Image from 'next/image'

export default function Gallery() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority // LCP optimization
      placeholder="blur" // Show blur while loading
      blurDataURL="data:image/..." // Base64 blur
    />
  )
}
```

**Optimizaciones automáticas:**
- Lazy loading por default
- Generación automática de AVIF/WebP
- Responsive images con `srcset`
- Optimización on-demand

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**CSS:**
```css
body {
  font-family: var(--font-inter);
}

code {
  font-family: var(--font-roboto-mono);
}
```

### React Server Components

Usar Server Components por default para reducir bundle del cliente:

```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ❌ Client Component (solo cuando necesario)
'use client'
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Suspense & Streaming

```typescript
import { Suspense } from 'react'

async function SlowComponent() {
  await delay(2000)
  return <div>Slow content</div>
}

export default function Page() {
  return (
    <div>
      <h1>Fast content</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}
```

---

## 9. Monitoring & Observability

### Error Tracking - Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
```

**sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

**Custom error capture:**
```typescript
import * as Sentry from '@sentry/nextjs'

try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'checkout' },
    extra: { userId: user.id },
  })
}
```

### Analytics - Google Analytics

**app/layout.tsx:**
```typescript
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}
```

**Event tracking:**
```typescript
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Uso
trackEvent('click', 'button', 'checkout', 1)
```

### Performance Monitoring - Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Custom Logging

**lib/logger.ts:**
```typescript
type LogLevel = 'info' | 'warn' | 'error'

interface LogData {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
}

export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const logData: LogData = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }

  if (process.env.NODE_ENV === 'production') {
    // Enviar a servicio de logs (Datadog, Logtail, etc.)
    fetch('/api/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    })
  } else {
    console[level](logData)
  }
}

// Uso
log('error', 'Payment failed', { userId: '123', amount: 50 })
```

### Health Checks

**app/api/health/route.ts:**
```typescript
export async function GET() {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`

    // Check external API
    const apiResponse = await fetch('https://api.example.com/health')
    if (!apiResponse.ok) throw new Error('API unhealthy')

    return Response.json({ status: 'healthy' }, { status: 200 })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

---

## 10. CI/CD Pipelines

### GitHub Actions - Vercel

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm test

  deploy-preview:
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitHub Actions - Self-Hosted Docker

**.github/workflows/docker-deploy.yml:**
```yaml
name: Build and Deploy Docker

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:main
            docker stop nextjs-app || true
            docker rm nextjs-app || true
            docker run -d \
              --name nextjs-app \
              -p 3000:3000 \
              -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
              --restart unless-stopped \
              ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:main
```

---

## Deployment Checklist

### Pre-Deploy

- [ ] Environment variables configuradas
- [ ] Tests pasando (`npm test`)
- [ ] Build local exitoso (`npm run build`)
- [ ] Linters pasando (`npm run lint`)
- [ ] Type checking exitoso (`npm run type-check`)
- [ ] Bundle size aceptable (analizar con `ANALYZE=true npm run build`)
- [ ] Lighthouse score > 90 (Performance, Accessibility, SEO)

### Production Configuration

- [ ] `NODE_ENV=production`
- [ ] `NEXT_TELEMETRY_DISABLED=1` (opcional)
- [ ] SSL/HTTPS habilitado
- [ ] Security headers configurados
- [ ] Compression habilitada (gzip/brotli)
- [ ] Error tracking configurado (Sentry)
- [ ] Analytics configurado (GA, Vercel Analytics)
- [ ] Monitoring configurado (uptime, performance)

### Post-Deploy

- [ ] Health check pasando (`/api/health`)
- [ ] Smoke tests manuales (login, checkout, etc.)
- [ ] SSL certificate válido
- [ ] CDN caching funcionando
- [ ] Error tracking recibiendo eventos
- [ ] Analytics tracking eventos
- [ ] Performance metrics aceptables

### Security

- [ ] Secrets no expuestos en código
- [ ] CORS configurado correctamente
- [ ] Rate limiting habilitado
- [ ] SQL injection protegido (ORM/prepared statements)
- [ ] XSS protegido (React auto-escapes)
- [ ] CSRF tokens en formularios
- [ ] Dependencias actualizadas (`npm audit`)

---

## Recursos Adicionales

Ver archivos en `resources/` para:
- `docker-compose-full.yml` - Compose file completo con Nginx, PostgreSQL, Redis
- `github-actions-complete.yml` - Pipeline CI/CD completo
- `vercel-config-advanced.json` - Configuración avanzada de Vercel
- `deployment-checklist.md` - Checklist detallado de deployment

---

## Mejores Prácticas

1. **Vercel First**: Si es posible, usar Vercel para zero-config deployment
2. **Standalone Mode**: Para self-hosted, usar `output: 'standalone'`
3. **Docker Multi-Stage**: Minimizar tamaño de imagen con multi-stage builds
4. **Environment Variables**: Nunca commitear secrets, usar .env.local
5. **Edge Functions**: Usar para latencia ultra-baja y geolocation
6. **Middleware**: Centralizar auth, redirects, headers
7. **Caching**: Configurar Cache-Control apropiadamente
8. **Monitoring**: Configurar error tracking + analytics desde día 1
9. **CI/CD**: Automatizar tests, linting y deploy
10. **Zero-Downtime**: Usar health checks y rolling deploys

---

## Troubleshooting

### Build falla en Vercel

```bash
# Verificar build local
npm run build

# Revisar logs de Vercel
vercel logs

# Verificar environment variables
vercel env pull .env.local
```

### Docker image muy grande

```bash
# Analizar capas
docker history nextjs-app

# Usar .dockerignore
echo "node_modules\n.next\n.git" > .dockerignore

# Multi-stage build con alpine
FROM node:20-alpine
```

### Middleware no ejecuta

- Verificar ubicación: debe estar en root (mismo nivel que `app/`)
- Verificar `matcher` en config
- Verificar que no esté en `.gitignore`

### ISR no revalida

```bash
# Verificar revalidate time
export const revalidate = 60

# Force revalidation
fetch('/api/revalidate', {
  method: 'POST',
  body: JSON.stringify({ path: '/blog' }),
})
```

---

Esta guía cubre deployment end-to-end de Next.js con TypeScript, desde Vercel hasta self-hosted, con enfoque en producción y mejores prácticas.
