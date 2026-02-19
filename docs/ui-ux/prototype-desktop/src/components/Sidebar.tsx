import { LayoutDashboard, Users, BarChart3, Settings, UserCircle } from 'lucide-react'
import type { Section } from '../App'

interface NavItem {
  id: Section
  icon: React.ReactNode
  label: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
  { id: 'clients', icon: <Users size={24} />, label: 'Clientes' },
  { id: 'reports', icon: <BarChart3 size={24} />, label: 'Reportes' },
  { id: 'settings', icon: <Settings size={24} />, label: 'Configuración' },
  { id: 'profile', icon: <UserCircle size={24} />, label: 'Perfil' },
]

interface SidebarProps {
  active: Section
  onSelect: (section: Section) => void
}

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="w-[90px] h-full bg-gray-900 flex flex-col items-center py-6 gap-2 border-l border-gray-800">
      <div className="mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">PD</span>
        </div>
      </div>
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            title={label}
            className={`w-full flex items-center justify-center p-3 rounded-xl transition-colors ${
              active === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            {icon}
          </button>
        ))}
      </nav>
    </aside>
  )
}
