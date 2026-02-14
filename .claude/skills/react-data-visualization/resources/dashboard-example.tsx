/**
 * Dashboard Example
 *
 * Complete dashboard with multiple chart types,
 * responsive layout, and real-world data.
 */

import { useState, useEffect } from 'react'
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Pie,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity } from 'lucide-react'

// ============== Types ==============

interface RevenueData {
  month: string
  revenue: number
  expenses: number
  profit: number
}

interface CategorySales {
  category: string
  sales: number
  percentage: number
}

interface UserActivity {
  hour: string
  activeUsers: number
}

interface MetricCard {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

// ============== Mock Data ==============

const revenueData: RevenueData[] = [
  { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
  { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
  { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
  { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
  { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
  { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000 },
]

const categorySales: CategorySales[] = [
  { category: 'Electronics', sales: 42500, percentage: 35 },
  { category: 'Clothing', sales: 32000, percentage: 26 },
  { category: 'Food', sales: 24000, percentage: 20 },
  { category: 'Books', sales: 15000, percentage: 12 },
  { category: 'Other', sales: 8500, percentage: 7 },
]

const userActivity: UserActivity[] = [
  { hour: '00:00', activeUsers: 1200 },
  { hour: '04:00', activeUsers: 800 },
  { hour: '08:00', activeUsers: 2500 },
  { hour: '12:00', activeUsers: 4200 },
  { hour: '16:00', activeUsers: 3800 },
  { hour: '20:00', activeUsers: 2900 },
]

// ============== Components ==============

function MetricCardComponent({ title, value, change, icon }: MetricCard) {
  const isPositive = change >= 0

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}
            {change}%
          </span>
          <span className="text-sm text-gray-500">vs last month</span>
        </div>
      </div>
    </div>
  )
}

function RevenueChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={revenueData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategorySalesChart() {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categorySales}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.category} (${entry.percentage}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="sales"
          >
            {categorySales.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function UserActivityChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={userActivity}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="hour" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Area
            type="monotone"
            dataKey="activeUsers"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopProductsChart() {
  const topProducts = [
    { product: 'iPhone 15 Pro', sales: 12500 },
    { product: 'MacBook Air', sales: 10200 },
    { product: 'AirPods Pro', sales: 8900 },
    { product: 'iPad Air', sales: 7600 },
    { product: 'Apple Watch', sales: 6400 },
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topProducts} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis type="category" dataKey="product" width={120} stroke="#6b7280" />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="sales" fill="#3b82f6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============== Main Dashboard ==============

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '$67,000',
      change: 12.5,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      title: 'Active Users',
      value: '4,235',
      change: 8.2,
      icon: <Users className="w-5 h-5" />,
    },
    {
      title: 'Total Orders',
      value: '1,842',
      change: -3.1,
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: 5.7,
      icon: <Activity className="w-5 h-5" />,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm h-32 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your business performance and metrics</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricCardComponent key={index} {...metric} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <CategorySalesChart />
          <UserActivityChart />
          <TopProductsChart />
        </div>
      </div>
    </div>
  )
}
