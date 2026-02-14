---
name: react-data-visualization
description: >
  Guía completa de visualización de datos en React con TypeScript, Recharts/Visx, responsive charts y performance con datasets grandes.
  Usar cuando se necesite: Recharts setup (LineChart, BarChart, PieChart, AreaChart), customization (colores, tooltips, legends),
  Visx low-level primitives, chart types (Line, Bar, Pie, Area, Scatter, Composed), responsive design, data transformation,
  performance optimization (virtualization, memoization), real-time data (websockets, animations), accessibility (ARIA, keyboard),
  export functionality (PNG/SVG/PDF/CSV). Incluye Recharts como primera opción, Visx para casos avanzados, responsive first,
  performance con big data, tipos seguros y mejores prácticas de producción.
---

# React Data Visualization - TypeScript

Guía completa para crear visualizaciones de datos interactivas en React con TypeScript, usando Recharts, Visx y mejores prácticas de producción.

## 1. Recharts Setup

Recharts es la librería de charts más popular para React, con API declarativa y alta composabilidad.

### Instalación

```bash
npm install recharts
npm install -D @types/recharts
```

### Componentes Básicos

**LineChart:**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
  name: string
  value: number
  revenue: number
}

const data: DataPoint[] = [
  { name: 'Jan', value: 400, revenue: 2400 },
  { name: 'Feb', value: 300, revenue: 1398 },
  { name: 'Mar', value: 200, revenue: 9800 },
  { name: 'Apr', value: 278, revenue: 3908 },
  { name: 'May', value: 189, revenue: 4800 },
  { name: 'Jun', value: 239, revenue: 3800 },
]

export function SimpleLineChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**BarChart:**
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SalesData {
  month: string
  sales: number
  profit: number
}

const salesData: SalesData[] = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
]

export function SimpleBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={salesData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#8884d8" />
        <Bar dataKey="profit" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**PieChart:**
```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CategoryData {
  name: string
  value: number
}

const categoryData: CategoryData[] = [
  { name: 'Electronics', value: 400 },
  { name: 'Clothing', value: 300 },
  { name: 'Food', value: 300 },
  { name: 'Books', value: 200 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function SimplePieChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => entry.name}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {categoryData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

**AreaChart:**
```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TrafficData {
  time: string
  users: number
  pageViews: number
}

const trafficData: TrafficData[] = [
  { time: '00:00', users: 4000, pageViews: 2400 },
  { time: '03:00', users: 3000, pageViews: 1398 },
  { time: '06:00', users: 2000, pageViews: 9800 },
  { time: '09:00', users: 2780, pageViews: 3908 },
  { time: '12:00', users: 1890, pageViews: 4800 },
]

export function SimpleAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={trafficData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="pageViews" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

---

## 2. Recharts Customization

### Custom Colors & Themes

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Theme colors
const theme = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  grid: '#e5e7eb',
  text: '#6b7280',
}

export function ThemedLineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey="name" stroke={theme.text} />
        <YAxis stroke={theme.text} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${theme.grid}`,
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={theme.primary}
          strokeWidth={3}
          dot={{ fill: theme.primary, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Custom Tooltip

```typescript
import { TooltipProps } from 'recharts'

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.name}:</span>
          <span className="text-sm font-semibold text-gray-900">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ChartWithCustomTooltip({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Custom Legend

```typescript
import { LegendProps } from 'recharts'

interface CustomLegendProps extends LegendProps {
  payload?: Array<{
    value: string
    type: string
    id?: string
    color?: string
  }>
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null

  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartWithCustomLegend({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend content={<CustomLegend />} />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Responsive Container with Aspect Ratio

```typescript
export function ResponsiveChart() {
  return (
    <ResponsiveContainer width="100%" aspect={2}>
      <LineChart data={data}>
        {/* Chart components */}
      </LineChart>
    </ResponsiveContainer>
  )
}

// Multiple breakpoints
export function MultiBreakpointChart() {
  const [height, setHeight] = useState(400)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setHeight(250)
      } else if (window.innerWidth < 1024) {
        setHeight(350)
      } else {
        setHeight(400)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        {/* Chart components */}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## 3. Visx (Low-Level Alternative)

Visx es una colección de primitives de bajo nivel para mayor control sobre visualizaciones.

### Instalación

```bash
npm install @visx/visx
```

### Basic Line Chart con Visx

```typescript
import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { scaleTime, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { curveMonotoneX } from '@visx/curve'

interface DataPoint {
  date: Date
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  width: number
  height: number
}

export function VisxLineChart({ data, width, height }: LineChartProps) {
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Scales
  const xScale = scaleTime({
    domain: [Math.min(...data.map((d) => d.date.getTime())), Math.max(...data.map((d) => d.date.getTime()))],
    range: [0, innerWidth],
  })

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value))],
    range: [innerHeight, 0],
    nice: true,
  })

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        <LinePath
          data={data}
          x={(d) => xScale(d.date) ?? 0}
          y={(d) => yScale(d.value) ?? 0}
          stroke="#3b82f6"
          strokeWidth={2}
          curve={curveMonotoneX}
        />
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          numTicks={6}
          label="Date"
        />
        <AxisLeft scale={yScale} label="Value" />
      </Group>
    </svg>
  )
}
```

### Cuándo Usar Visx vs Recharts

**Usar Recharts cuando:**
- Necesitas charts rápidos y fáciles
- API declarativa es suficiente
- Tooltips y legends built-in son adecuados
- Prototipado rápido
- Charts estándar (Line, Bar, Pie, Area)

**Usar Visx cuando:**
- Necesitas control total sobre el rendering
- Visualizaciones custom complejas
- Optimización de performance crítica
- Animaciones custom avanzadas
- Integración con D3.js
- Visualizaciones no-convencionales

---

## 4. Chart Types & Use Cases

### Line Chart - Tendencias Temporales

```typescript
// Casos de uso:
// - Stock prices over time
// - Temperature changes
// - Website traffic trends
// - Sales growth

interface TimeSeriesData {
  date: string
  value: number
}

export function TrendLineChart({ data }: { data: TimeSeriesData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Bar Chart - Comparación de Categorías

```typescript
// Casos de uso:
// - Sales by region
// - Product comparisons
// - Survey results
// - Monthly revenue

interface CategoryData {
  category: string
  value: number
}

export function ComparisonBarChart({ data }: { data: CategoryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="category" width={100} />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Pie Chart - Distribución de Partes

```typescript
// Casos de uso:
// - Market share
// - Budget allocation
// - Demographics
// - Traffic sources

interface DistributionData {
  name: string
  value: number
  percentage: number
}

export function DistributionPieChart({ data }: { data: DistributionData[] }) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name} (${entry.percentage}%)`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### Area Chart - Volumen Temporal

```typescript
// Casos de uso:
// - Cumulative metrics
// - Stacked data over time
// - Traffic volume
// - Resource usage

export function VolumeAreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### Scatter Chart - Correlaciones

```typescript
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

// Casos de uso:
// - Correlaciones
// - Clustering
// - Outlier detection

interface ScatterDataPoint {
  x: number
  y: number
  z: number
}

export function CorrelationScatterChart({ data }: { data: ScatterDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="X Axis" />
        <YAxis type="number" dataKey="y" name="Y Axis" />
        <ZAxis type="number" dataKey="z" range={[60, 400]} name="Z Axis" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Data Points" data={data} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
```

### Composed Chart - Múltiples Tipos

```typescript
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Casos de uso:
// - Revenue (bar) + Profit margin (line)
// - Sales (area) + Target (line)
// - Multiple metrics with different scales

export function MultiMetricComposedChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="revenue" fill="#93c5fd" stroke="#3b82f6" />
        <Bar dataKey="sales" barSize={20} fill="#10b981" />
        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
```

---

## 5. Responsive Design

### ResponsiveContainer Best Practices

```typescript
// ✅ Bueno: Usar ResponsiveContainer
export function ResponsiveChart() {
  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* ... */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ❌ Malo: Dimensiones fijas
export function FixedChart() {
  return (
    <LineChart width={600} height={400} data={data}>
      {/* ... */}
    </LineChart>
  )
}
```

### Mobile-First Responsive Charts

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery'

export function MobileResponsiveChart({ data }: { data: any[] }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  const chartHeight = isMobile ? 250 : isTablet ? 350 : 400
  const fontSize = isMobile ? 10 : 12

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 30}
          tick={{ fontSize }}
        />
        <YAxis tick={{ fontSize }} />
        <Tooltip />
        {!isMobile && <Legend />}
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Aspect Ratio Control

```typescript
export function AspectRatioChart({ data }: { data: any[] }) {
  return (
    <div className="w-full">
      {/* 16:9 aspect ratio */}
      <ResponsiveContainer width="100%" aspect={16 / 9}>
        <LineChart data={data}>
          {/* ... */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Custom aspect ratios por breakpoint
export function DynamicAspectChart({ data }: { data: any[] }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const aspect = isMobile ? 1 : 2 // Square en mobile, 2:1 en desktop

  return (
    <ResponsiveContainer width="100%" aspect={aspect}>
      <LineChart data={data}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## 6. Data Transformation

### Type-Safe Data Preparation

```typescript
// Raw API response
interface RawSalesData {
  date: string
  total_sales: number
  total_orders: number
}

// Transformed for chart
interface ChartData {
  date: string
  sales: number
  orders: number
  averageOrderValue: number
}

function transformSalesData(raw: RawSalesData[]): ChartData[] {
  return raw.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    sales: item.total_sales,
    orders: item.total_orders,
    averageOrderValue: item.total_sales / item.total_orders,
  }))
}
```

### Data Aggregation

```typescript
interface DailyData {
  date: string
  value: number
}

function aggregateByWeek(daily: DailyData[]): DailyData[] {
  const weeks = new Map<string, number>()

  daily.forEach((item) => {
    const date = new Date(item.date)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekKey = weekStart.toISOString().split('T')[0]

    weeks.set(weekKey, (weeks.get(weekKey) || 0) + item.value)
  })

  return Array.from(weeks.entries()).map(([date, value]) => ({ date, value }))
}

function aggregateByMonth(daily: DailyData[]): DailyData[] {
  const months = new Map<string, number>()

  daily.forEach((item) => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    months.set(monthKey, (months.get(monthKey) || 0) + item.value)
  })

  return Array.from(months.entries()).map(([date, value]) => ({ date, value }))
}
```

### Data Filtering & Sorting

```typescript
function filterByDateRange(data: DailyData[], startDate: Date, endDate: Date): DailyData[] {
  return data.filter((item) => {
    const date = new Date(item.date)
    return date >= startDate && date <= endDate
  })
}

function sortByValue(data: ChartData[], order: 'asc' | 'desc' = 'desc'): ChartData[] {
  return [...data].sort((a, b) => {
    return order === 'asc' ? a.sales - b.sales : b.sales - a.sales
  })
}

function topN(data: ChartData[], n: number): ChartData[] {
  return sortByValue(data, 'desc').slice(0, n)
}
```

---

## 7. Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react'

export function OptimizedChart({ rawData }: { rawData: RawSalesData[] }) {
  // Memoize transformed data
  const chartData = useMemo(() => transformSalesData(rawData), [rawData])

  // Memoize calculations
  const stats = useMemo(() => {
    return {
      total: chartData.reduce((sum, item) => sum + item.sales, 0),
      average: chartData.reduce((sum, item) => sum + item.sales, 0) / chartData.length,
      max: Math.max(...chartData.map((item) => item.sales)),
    }
  }, [chartData])

  return (
    <div>
      <div className="mb-4">
        <p>Total: ${stats.total.toLocaleString()}</p>
        <p>Average: ${stats.average.toLocaleString()}</p>
        <p>Max: ${stats.max.toLocaleString()}</p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          {/* ... */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Virtualization para Datasets Grandes

```typescript
import { useState } from 'react'

export function LargeDatasetChart({ data }: { data: ChartData[] }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 })

  // Solo mostrar subset de datos
  const visibleData = useMemo(
    () => data.slice(visibleRange.start, visibleRange.end),
    [data, visibleRange]
  )

  const handleZoom = (domain: any) => {
    // Update visible range based on zoom
    if (domain) {
      setVisibleRange({
        start: Math.floor(domain.startIndex),
        end: Math.ceil(domain.endIndex),
      })
    }
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={visibleData}
        onMouseDown={(e) => console.log('Zoom start')}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Lazy Loading Charts

```typescript
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./components/HeavyChart'))

export function LazyLoadedDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={data} />
      </Suspense>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="w-full h-96 bg-gray-100 animate-pulse rounded-lg" />
  )
}
```

### Debounced Updates

```typescript
import { useDebounce } from '@/hooks/useDebounce'

export function DebouncedChart({ liveData }: { liveData: ChartData[] }) {
  // Debounce updates para evitar re-renders constantes
  const debouncedData = useDebounce(liveData, 300)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={debouncedData}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## 8. Real-Time Data

### WebSocket Integration

```typescript
import { useEffect, useState } from 'react'

interface RealtimeData {
  timestamp: string
  value: number
}

export function RealtimeChart() {
  const [data, setData] = useState<RealtimeData[]>([])
  const maxDataPoints = 50

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/realtime')

    ws.onmessage = (event) => {
      const newPoint: RealtimeData = JSON.parse(event.data)

      setData((prev) => {
        const updated = [...prev, newPoint]
        // Mantener solo últimos N puntos
        return updated.slice(-maxDataPoints)
      })
    }

    return () => ws.close()
  }, [])

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          isAnimationActive={false} // Deshabilitar animación para real-time
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Smooth Animations

```typescript
export function AnimatedChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          // Animation config
          animationDuration={800}
          animationEasing="ease-in-out"
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Auto-Refresh

```typescript
import { useInterval } from '@/hooks/useInterval'

export function AutoRefreshChart() {
  const [data, setData] = useState<ChartData[]>([])

  const fetchData = async () => {
    const response = await fetch('/api/chart-data')
    const newData = await response.json()
    setData(newData)
  }

  // Auto-refresh cada 5 segundos
  useInterval(fetchData, 5000)

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        {/* ... */}
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## 9. Accessibility

### Chart Descriptions & ARIA Labels

```typescript
export function AccessibleChart({ data, title, description }: {
  data: ChartData[]
  title: string
  description: string
}) {
  return (
    <div role="img" aria-label={`${title}. ${description}`}>
      <h3 className="sr-only">{title}</h3>
      <p className="sr-only">{description}</p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>

      {/* Data table fallback for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item.date}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Keyboard Navigation

```typescript
export function KeyboardNavigableChart({ data }: { data: ChartData[] }) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        setFocusedIndex((prev) => Math.min(prev + 1, data.length - 1))
        break
      case 'ArrowLeft':
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Interactive chart. Use arrow keys to navigate data points."
    >
      <p className="text-sm text-gray-600 mb-2">
        Current point: {data[focusedIndex]?.date} - {data[focusedIndex]?.value}
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            activeDot={{ r: focusedIndex }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

## 10. Export Functionality

### Export as PNG

```typescript
import html2canvas from 'html2canvas'

export function ExportableToPNG({ data }: { data: ChartData[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  const exportToPNG = async () => {
    if (!chartRef.current) return

    const canvas = await html2canvas(chartRef.current)
    const url = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = `chart-${Date.now()}.png`
    link.href = url
    link.click()
  }

  return (
    <div>
      <button
        onClick={exportToPNG}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export as PNG
      </button>

      <div ref={chartRef}>
        <ResponsiveContainer width={800} height={400}>
          <LineChart data={data}>
            {/* ... */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### Export as SVG

```typescript
export function ExportableToSVG({ data }: { data: ChartData[] }) {
  const chartRef = useRef<HTMLDivElement>(null)

  const exportToSVG = () => {
    if (!chartRef.current) return

    const svg = chartRef.current.querySelector('svg')
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `chart-${Date.now()}.svg`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <button onClick={exportToSVG} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">
        Export as SVG
      </button>

      <div ref={chartRef}>
        <ResponsiveContainer width={800} height={400}>
          <LineChart data={data}>
            {/* ... */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

### Export Data as CSV

```typescript
export function ExportableToCSV({ data }: { data: ChartData[] }) {
  const exportToCSV = () => {
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map((item) => Object.values(item).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `chart-data-${Date.now()}.csv`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded">
      Export Data (CSV)
    </button>
  )
}
```

---

## Resources

Ver archivos en `resources/` para:
- `chart-examples.tsx` - Galería completa de ejemplos de charts
- `dashboard-example.tsx` - Dashboard completo con múltiples charts
- `data-utils.ts` - Helpers para transformación de datos
- `export-utils.ts` - Utilidades completas para export PNG/SVG/CSV/PDF

---

## Best Practices

1. **Type Safety**: Siempre definir interfaces para datos
2. **Responsiveness**: Usar ResponsiveContainer en todos los charts
3. **Performance**: Memoizar datos transformados, virtualizar datasets grandes
4. **Accessibility**: Incluir ARIA labels, alt text, data tables para screen readers
5. **Mobile-First**: Ajustar dimensiones, fontSize, y layout para mobile
6. **Error Handling**: Validar datos antes de renderizar charts
7. **Loading States**: Mostrar skeletons mientras cargan datos
8. **Color Palette**: Usar paleta consistente y accesible (contrast ratio > 4.5:1)
9. **Export**: Proveer opciones de export (PNG, SVG, CSV)
10. **Documentation**: Documentar qué representa cada chart

---

Esta guía cubre visualización de datos end-to-end en React con TypeScript, desde setup hasta producción con Recharts y Visx.
