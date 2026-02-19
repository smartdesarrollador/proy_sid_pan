interface MonthData {
  month: string
  sales: number
  revenue: number
}

const monthlyData: MonthData[] = [
  { month: 'Ago', sales: 65, revenue: 32000 },
  { month: 'Sep', sales: 72, revenue: 36500 },
  { month: 'Oct', sales: 58, revenue: 29000 },
  { month: 'Nov', sales: 85, revenue: 42500 },
  { month: 'Dic', sales: 94, revenue: 47000 },
  { month: 'Ene', sales: 88, revenue: 44000 },
  { month: 'Feb', sales: 100, revenue: 50000 },
]

const maxSales = Math.max(...monthlyData.map((d) => d.sales))

interface MetricCardProps {
  label: string
  value: string
  sub: string
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-green-400 mt-1">{sub}</p>
    </div>
  )
}

export default function Reports() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Reportes</h1>
        <p className="text-gray-400">Análisis de ventas e ingresos</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total ventas (Feb)" value="100" sub="↑ 13.6% vs Ene" />
        <MetricCard label="Ingresos (Feb)" value="$50,000" sub="↑ 13.6% vs Ene" />
        <MetricCard label="Ticket promedio" value="$500" sub="Sin cambio" />
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Ventas por Mes</h2>

        <div className="flex items-end gap-4 h-52">
          {monthlyData.map((d) => {
            const heightPct = Math.round((d.sales / maxSales) * 100)
            return (
              <div key={d.month} className="flex flex-col items-center flex-1 gap-2">
                <span className="text-xs text-gray-500">{d.sales}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-lg transition-colors cursor-pointer"
                    style={{ height: `${heightPct}%` }}
                    title={`${d.month}: ${d.sales} ventas / $${d.revenue.toLocaleString()}`}
                  />
                </div>
                <span className="text-xs text-gray-400">{d.month}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">Detalle por mes</h3>
          <div className="grid grid-cols-7 gap-2">
            {monthlyData.map((d) => (
              <div key={d.month} className="text-center">
                <p className="text-xs text-gray-500">{d.month}</p>
                <p className="text-xs text-white font-medium">${(d.revenue / 1000).toFixed(0)}k</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
