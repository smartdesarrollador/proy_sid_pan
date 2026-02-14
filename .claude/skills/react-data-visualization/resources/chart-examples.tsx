/**
 * Chart Examples Gallery
 *
 * Comprehensive collection of chart examples with Recharts.
 * Copy-paste ready components for common use cases.
 */

import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  ScatterChart,
  RadarChart,
  ComposedChart,
  Line,
  Bar,
  Pie,
  Area,
  Scatter,
  Radar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'

// ============== Multi-Line Chart ==============

interface MultiLineData {
  month: string
  revenue: number
  profit: number
  expenses: number
}

const multiLineData: MultiLineData[] = [
  { month: 'Jan', revenue: 4000, profit: 2400, expenses: 1600 },
  { month: 'Feb', revenue: 3000, profit: 1398, expenses: 1602 },
  { month: 'Mar', revenue: 2000, profit: 9800, expenses: 800 },
  { month: 'Apr', revenue: 2780, profit: 3908, expenses: 1200 },
  { month: 'May', revenue: 1890, profit: 4800, expenses: 1090 },
  { month: 'Jun', revenue: 2390, profit: 3800, expenses: 1290 },
]

export function MultiLineChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={multiLineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ============== Stacked Bar Chart ==============

interface StackedBarData {
  quarter: string
  product1: number
  product2: number
  product3: number
}

const stackedBarData: StackedBarData[] = [
  { quarter: 'Q1', product1: 4000, product2: 2400, product3: 2400 },
  { quarter: 'Q2', product1: 3000, product2: 1398, product3: 2210 },
  { quarter: 'Q3', product1: 2000, product2: 9800, product3: 2290 },
  { quarter: 'Q4', product1: 2780, product2: 3908, product3: 2000 },
]

export function StackedBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={stackedBarData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="quarter" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="product1" stackId="a" fill="#3b82f6" />
        <Bar dataKey="product2" stackId="a" fill="#10b981" />
        <Bar dataKey="product3" stackId="a" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============== Donut Chart ==============

interface DonutData {
  name: string
  value: number
}

const donutData: DonutData[] = [
  { name: 'Mobile', value: 400 },
  { name: 'Desktop', value: 300 },
  { name: 'Tablet', value: 200 },
  { name: 'Other', value: 100 },
]

const DONUT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export function DonutChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={donutData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label={(entry) => `${entry.name}: ${entry.value}`}
        >
          {donutData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ============== Stacked Area Chart ==============

interface StackedAreaData {
  time: string
  organic: number
  direct: number
  referral: number
}

const stackedAreaData: StackedAreaData[] = [
  { time: '00:00', organic: 4000, direct: 2400, referral: 2400 },
  { time: '03:00', organic: 3000, direct: 1398, referral: 2210 },
  { time: '06:00', organic: 2000, direct: 9800, referral: 2290 },
  { time: '09:00', organic: 2780, direct: 3908, referral: 2000 },
  { time: '12:00', organic: 1890, direct: 4800, referral: 2181 },
  { time: '15:00', organic: 2390, direct: 3800, referral: 2500 },
]

export function StackedAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={stackedAreaData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="organic" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
        <Area type="monotone" dataKey="direct" stackId="1" stroke="#10b981" fill="#10b981" />
        <Area type="monotone" dataKey="referral" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============== Horizontal Bar Chart ==============

interface HorizontalBarData {
  category: string
  value: number
}

const horizontalBarData: HorizontalBarData[] = [
  { category: 'Category A', value: 4000 },
  { category: 'Category B', value: 3000 },
  { category: 'Category C', value: 2000 },
  { category: 'Category D', value: 2780 },
  { category: 'Category E', value: 1890 },
]

export function HorizontalBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={horizontalBarData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="category" width={120} />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============== Scatter Plot ==============

interface ScatterData {
  x: number
  y: number
  z: number
}

const scatterData: ScatterData[] = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
]

export function ScatterPlot() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="X Value" />
        <YAxis type="number" dataKey="y" name="Y Value" />
        <ZAxis type="number" dataKey="z" range={[60, 400]} name="Size" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Data Points" data={scatterData} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

// ============== Radar Chart ==============

interface RadarData {
  subject: string
  A: number
  B: number
  fullMark: number
}

const radarData: RadarData[] = [
  { subject: 'Math', A: 120, B: 110, fullMark: 150 },
  { subject: 'Science', A: 98, B: 130, fullMark: 150 },
  { subject: 'English', A: 86, B: 130, fullMark: 150 },
  { subject: 'History', A: 99, B: 100, fullMark: 150 },
  { subject: 'Art', A: 85, B: 90, fullMark: 150 },
  { subject: 'PE', A: 65, B: 85, fullMark: 150 },
]

export function RadarChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={90} domain={[0, 150]} />
        <Radar name="Student A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        <Radar name="Student B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ============== Composed Chart (Mixed Types) ==============

interface ComposedData {
  month: string
  sales: number
  revenue: number
  target: number
}

const composedData: ComposedData[] = [
  { month: 'Jan', sales: 590, revenue: 800, target: 1400 },
  { month: 'Feb', sales: 868, revenue: 967, target: 1506 },
  { month: 'Mar', sales: 1397, revenue: 1098, target: 989 },
  { month: 'Apr', sales: 1480, revenue: 1200, target: 1228 },
  { month: 'May', sales: 1520, revenue: 1108, target: 1100 },
  { month: 'Jun', sales: 1400, revenue: 680, target: 1700 },
]

export function ComposedChartExample() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={composedData}>
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

// ============== Gradient Area Chart ==============

export function GradientAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={multiLineData}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ============== Negative Values Bar Chart ==============

interface NegativeBarData {
  month: string
  profit: number
}

const negativeBarData: NegativeBarData[] = [
  { month: 'Jan', profit: 2400 },
  { month: 'Feb', profit: -1398 },
  { month: 'Mar', profit: 9800 },
  { month: 'Apr', profit: 3908 },
  { month: 'May', profit: -4800 },
  { month: 'Jun', profit: 3800 },
]

export function NegativeBarChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={negativeBarData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="profit" fill="#3b82f6">
          {negativeBarData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.profit > 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ============== Export All ==============

export const chartExamples = {
  MultiLineChart,
  StackedBarChart,
  DonutChart,
  StackedAreaChart,
  HorizontalBarChart,
  ScatterPlot,
  RadarChartExample,
  ComposedChartExample,
  GradientAreaChart,
  NegativeBarChart,
}
