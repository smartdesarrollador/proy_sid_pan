import { Users, DollarSign, Ticket, Activity } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  change: string
  positive: boolean
  icon: React.ReactNode
  color: string
}

function KpiCard({ title, value, change, positive, icon, color }: KpiCardProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <p className={`text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? '↑' : '↓'} {change} vs mes anterior
      </p>
    </div>
  )
}

const kpis = [
  {
    title: 'Usuarios Activos',
    value: '1,248',
    change: '12.5%',
    positive: true,
    icon: <Users size={20} className="text-blue-300" />,
    color: 'bg-blue-600/20',
  },
  {
    title: 'Ingresos',
    value: '$48,320',
    change: '8.2%',
    positive: true,
    icon: <DollarSign size={20} className="text-green-300" />,
    color: 'bg-green-600/20',
  },
  {
    title: 'Tickets Abiertos',
    value: '87',
    change: '3.1%',
    positive: false,
    icon: <Ticket size={20} className="text-yellow-300" />,
    color: 'bg-yellow-600/20',
  },
  {
    title: 'Uptime',
    value: '99.9%',
    change: '0.1%',
    positive: true,
    icon: <Activity size={20} className="text-purple-300" />,
    color: 'bg-purple-600/20',
  },
]

const recentActivity = [
  { user: 'María García', action: 'Nuevo contrato firmado', time: 'hace 5 min' },
  { user: 'Carlos López', action: 'Ticket #1204 resuelto', time: 'hace 12 min' },
  { user: 'Ana Martínez', action: 'Plan actualizado a Pro', time: 'hace 28 min' },
  { user: 'Luis Rodríguez', action: 'Nueva cuenta creada', time: 'hace 1h' },
  { user: 'Sofia Chen', action: 'Pago procesado $2,400', time: 'hace 2h' },
]

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-300 font-medium">
                    {item.user.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{item.user}</p>
                  <p className="text-xs text-gray-500">{item.action}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
