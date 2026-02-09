# Angular Performance Metrics & Benchmarks

## Core Web Vitals Goals

### Largest Contentful Paint (LCP)
- **Good:** < 2.5s
- **Needs Improvement:** 2.5s - 4.0s
- **Poor:** > 4.0s

**Optimization Techniques:**
- Image lazy loading
- Defer blocks for heavy components
- Code splitting
- CDN for static assets

### First Input Delay (FID)
- **Good:** < 100ms
- **Needs Improvement:** 100ms - 300ms
- **Poor:** > 300ms

**Optimization Techniques:**
- OnPush change detection
- Web Workers for heavy computation
- Debounce/throttle event handlers
- Reduce JavaScript bundle size

### Cumulative Layout Shift (CLS)
- **Good:** < 0.1
- **Needs Improvement:** 0.1 - 0.25
- **Poor:** > 0.25

**Optimization Techniques:**
- Set explicit image dimensions
- Reserve space for lazy-loaded content
- Avoid inserting content above existing content
- Use CSS transforms instead of layout-triggering properties

## Angular-Specific Metrics

### Change Detection Cycles
- **Target:** < 5ms per cycle
- **Baseline:** 15-20ms (Default strategy)
- **Optimized:** 3-5ms (OnPush + Signals)

### Bundle Size
- **Initial Bundle:** < 200KB (gzipped)
- **Lazy Chunks:** < 50KB each
- **Total Budget:** < 500KB (gzipped)

### Runtime Performance
- **60 FPS:** 16.67ms per frame
- **Smooth Scrolling:** < 8ms per scroll event
- **Input Response:** < 50ms

## Performance Budget Example

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb",
      "maximumError": "10kb"
    },
    {
      "type": "bundle",
      "name": "main",
      "baseline": "200kb",
      "maximumWarning": "300kb",
      "maximumError": "400kb"
    }
  ]
}
```

## Benchmark Results

### Virtual Scrolling Performance

| List Size | Without Virtual Scroll | With Virtual Scroll | Improvement |
|-----------|------------------------|---------------------|-------------|
| 100 items | 45ms | 12ms | 3.75x |
| 1,000 items | 380ms | 15ms | 25x |
| 10,000 items | 2,500ms | 45ms | 55x |
| 100,000 items | Out of Memory | 180ms | N/A |

### OnPush vs Default Change Detection

| Scenario | Default Strategy | OnPush | Improvement |
|----------|------------------|--------|-------------|
| Simple component | 8ms | 3ms | 2.67x |
| Complex nested tree | 45ms | 12ms | 3.75x |
| Large form | 120ms | 35ms | 3.43x |

### Debounce Impact on API Calls

| Input Type | No Debounce | With Debounce (300ms) | Reduction |
|------------|-------------|-----------------------|-----------|
| Fast typing (10 chars) | 10 calls | 1 call | 90% |
| Medium typing | 8 calls | 1 call | 87.5% |
| Paste text | 1 call | 1 call | 0% |

## Monitoring Commands

```bash
# Lighthouse performance audit
npm install -g lighthouse
lighthouse https://your-app.com --only-categories=performance

# Bundle size analysis
ng build --stats-json
npx webpack-bundle-analyzer dist/your-app/stats.json

# Angular performance profiling
# Use Chrome DevTools > Performance tab with Angular DevTools extension

# Memory profiling
# Use Chrome DevTools > Memory tab to detect memory leaks
```

## Real-World Impact

### Case Study: E-commerce Product List

**Before Optimization:**
- Time to Interactive: 4.2s
- Largest Contentful Paint: 3.8s
- Total Bundle Size: 1.2MB
- Memory Usage: 450MB
- User Engagement: 45%

**After Optimization:**
- Time to Interactive: 1.8s (2.3x faster)
- Largest Contentful Paint: 1.2s (3.2x faster)
- Total Bundle Size: 380KB (68% reduction)
- Memory Usage: 120MB (73% reduction)
- User Engagement: 72% (60% increase)

**Techniques Applied:**
1. OnPush change detection
2. Virtual scrolling for product grid
3. Image lazy loading
4. Code splitting by category
5. Defer blocks for recommendations
6. TrackBy functions
7. Pure pipes for filters
