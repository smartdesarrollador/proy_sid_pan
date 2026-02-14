/**
 * Data Transformation Utilities
 *
 * Helper functions for preparing and transforming data for charts.
 */

// ============== Types ==============

export interface TimeSeriesData {
  date: string
  value: number
}

export interface CategoricalData {
  category: string
  value: number
}

export interface MultiSeriesData {
  [key: string]: string | number
}

// ============== Date Utilities ==============

/**
 * Group daily data by week
 */
export function aggregateByWeek(data: TimeSeriesData[]): TimeSeriesData[] {
  const weeks = new Map<string, number>()

  data.forEach((item) => {
    const date = new Date(item.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0]

    weeks.set(weekKey, (weeks.get(weekKey) || 0) + item.value)
  })

  return Array.from(weeks.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Group daily data by month
 */
export function aggregateByMonth(data: TimeSeriesData[]): TimeSeriesData[] {
  const months = new Map<string, number>()

  data.forEach((item) => {
    const date = new Date(item.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    months.set(monthKey, (months.get(monthKey) || 0) + item.value)
  })

  return Array.from(months.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: TimeSeriesData[],
  startDate: Date,
  endDate: Date
): TimeSeriesData[] {
  return data.filter((item) => {
    const date = new Date(item.date)
    return date >= startDate && date <= endDate
  })
}

/**
 * Get last N days of data
 */
export function getLastNDays(data: TimeSeriesData[], days: number): TimeSeriesData[] {
  const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return sorted.slice(0, days).reverse()
}

// ============== Transformation Utilities ==============

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: TimeSeriesData[], window: number): TimeSeriesData[] {
  return data.map((item, index) => {
    const start = Math.max(0, index - window + 1)
    const subset = data.slice(start, index + 1)
    const average = subset.reduce((sum, d) => sum + d.value, 0) / subset.length

    return {
      date: item.date,
      value: Math.round(average * 100) / 100,
    }
  })
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(data: TimeSeriesData[]): TimeSeriesData[] {
  return data.map((item, index) => {
    if (index === 0) {
      return { date: item.date, value: 0 }
    }

    const previous = data[index - 1].value
    const change = previous === 0 ? 0 : ((item.value - previous) / previous) * 100

    return {
      date: item.date,
      value: Math.round(change * 100) / 100,
    }
  })
}

/**
 * Calculate cumulative sum
 */
export function calculateCumulativeSum(data: TimeSeriesData[]): TimeSeriesData[] {
  let sum = 0
  return data.map((item) => {
    sum += item.value
    return {
      date: item.date,
      value: sum,
    }
  })
}

/**
 * Normalize data to 0-100 scale
 */
export function normalizeData(data: TimeSeriesData[]): TimeSeriesData[] {
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) {
    return data.map((d) => ({ ...d, value: 50 }))
  }

  return data.map((item) => ({
    date: item.date,
    value: Math.round(((item.value - min) / range) * 100),
  }))
}

// ============== Sorting & Filtering ==============

/**
 * Sort categorical data by value
 */
export function sortByValue<T extends CategoricalData>(
  data: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...data].sort((a, b) => {
    return order === 'asc' ? a.value - b.value : b.value - a.value
  })
}

/**
 * Get top N items
 */
export function getTopN<T extends CategoricalData>(data: T[], n: number): T[] {
  return sortByValue(data, 'desc').slice(0, n)
}

/**
 * Get bottom N items
 */
export function getBottomN<T extends CategoricalData>(data: T[], n: number): T[] {
  return sortByValue(data, 'asc').slice(0, n)
}

/**
 * Group small categories into "Others"
 */
export function groupOthers(data: CategoricalData[], threshold: number): CategoricalData[] {
  const sorted = sortByValue(data, 'desc')
  const top = sorted.slice(0, threshold)
  const others = sorted.slice(threshold)

  if (others.length === 0) {
    return top
  }

  const othersSum = others.reduce((sum, item) => sum + item.value, 0)

  return [...top, { category: 'Others', value: othersSum }]
}

// ============== Statistical Utilities ==============

/**
 * Calculate mean
 */
export function calculateMean(data: TimeSeriesData[]): number {
  const sum = data.reduce((acc, item) => acc + item.value, 0)
  return sum / data.length
}

/**
 * Calculate median
 */
export function calculateMedian(data: TimeSeriesData[]): number {
  const sorted = [...data].sort((a, b) => a.value - b.value)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1].value + sorted[mid].value) / 2
  }

  return sorted[mid].value
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(data: TimeSeriesData[]): number {
  const mean = calculateMean(data)
  const squaredDiffs = data.map((item) => Math.pow(item.value - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length
  return Math.sqrt(avgSquaredDiff)
}

/**
 * Calculate percentile
 */
export function calculatePercentile(data: TimeSeriesData[], percentile: number): number {
  const sorted = [...data].sort((a, b) => a.value - b.value)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower].value
  }

  return sorted[lower].value * (1 - weight) + sorted[upper].value * weight
}

// ============== Data Validation ==============

/**
 * Remove outliers using IQR method
 */
export function removeOutliers(data: TimeSeriesData[]): TimeSeriesData[] {
  const q1 = calculatePercentile(data, 25)
  const q3 = calculatePercentile(data, 75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return data.filter((item) => item.value >= lowerBound && item.value <= upperBound)
}

/**
 * Fill missing dates
 */
export function fillMissingDates(data: TimeSeriesData[], fillValue: number = 0): TimeSeriesData[] {
  if (data.length === 0) return []

  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const result: TimeSeriesData[] = []
  const start = new Date(sorted[0].date)
  const end = new Date(sorted[sorted.length - 1].date)

  const dataMap = new Map(sorted.map((d) => [d.date, d.value]))

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      value: dataMap.get(dateStr) ?? fillValue,
    })
  }

  return result
}

// ============== Format Utilities ==============

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString()
}

/**
 * Format as currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers (K, M, B)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toString()
}

// ============== Export ==============

export default {
  aggregateByWeek,
  aggregateByMonth,
  filterByDateRange,
  getLastNDays,
  calculateMovingAverage,
  calculatePercentageChange,
  calculateCumulativeSum,
  normalizeData,
  sortByValue,
  getTopN,
  getBottomN,
  groupOthers,
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculatePercentile,
  removeOutliers,
  fillMissingDates,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
}
