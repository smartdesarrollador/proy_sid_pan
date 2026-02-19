import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Clients from './components/Clients'
import Reports from './components/Reports'
import Settings from './components/Settings'
import Profile from './components/Profile'

export type Section = 'dashboard' | 'clients' | 'reports' | 'settings' | 'profile'

const sectionComponents: Record<Section, JSX.Element> = {
  dashboard: <Dashboard />,
  clients: <Clients />,
  reports: <Reports />,
  settings: <Settings />,
  profile: <Profile />,
}

export default function App() {
  const [active, setActive] = useState<Section>('dashboard')

  return (
    <div className="flex flex-row h-screen w-screen bg-gray-950 overflow-hidden">
      <main className="flex-1 overflow-auto">
        {sectionComponents[active]}
      </main>
      <Sidebar active={active} onSelect={setActive} />
    </div>
  )
}
