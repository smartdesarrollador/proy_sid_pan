import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useTranslation } from './contexts/LanguageContext'
import Login from './components/Login'
import Navbar from './components/Navbar'
import LandingPage from './components/landing/LandingPage'
import HubDashboard from './components/dashboard/HubDashboard'
import ServiceCatalog from './components/dashboard/ServiceCatalog'
import SubscriptionView from './components/subscription/SubscriptionView'
import SupportView from './components/support/SupportView'
import ProfileView from './components/profile/ProfileView'
import PaymentMethodsView from './components/billing/PaymentMethodsView'
import NotificationsView from './components/notifications/NotificationsView'
import TeamView from './components/team/TeamView'
import RegisterView from './components/register/RegisterView'
import ReferralsView from './components/referrals/ReferralsView'

// views: 'landing' | 'login' | 'register' | 'dashboard' | 'services' | 'subscription' | 'support' | 'profile' | 'billing' | 'notifications' | 'team' | 'referrals'

const AUTHENTICATED_VIEWS = ['dashboard', 'services', 'subscription', 'support', 'profile', 'billing', 'notifications', 'team', 'referrals']

export default function App() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState('landing')

  const navigate = (view) => setCurrentView(view)

  // --- Unauthenticated routes ---
  if (!isAuthenticated) {
    if (currentView === 'login') {
      return <Login onGoToLanding={() => navigate('landing')} />
    }
    if (currentView === 'register') {
      return <RegisterView onGoToLanding={() => navigate('landing')} />
    }
    return <LandingPage onLogin={() => navigate('login')} onRegister={() => navigate('register')} />
  }

  // When user logs in while on 'landing' or 'login', treat as dashboard
  const activeView = AUTHENTICATED_VIEWS.includes(currentView) ? currentView : 'dashboard'

  const renderContent = () => {
    switch (activeView) {
      case 'services':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('navbar.services')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {t('serviceCatalog.unavailableSub')}
              </p>
            </div>
            <ServiceCatalog onNavigate={navigate} />
          </div>
        )
      case 'subscription':
        return <SubscriptionView onNavigate={navigate} />
      case 'support':
        return <SupportView />
      case 'profile':
        return <ProfileView />
      case 'billing':
        return <PaymentMethodsView />
      case 'notifications':
        return <NotificationsView />
      case 'team':
        return <TeamView />
      case 'referrals':
        return <ReferralsView />
      case 'dashboard':
      default:
        return <HubDashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentView={activeView} onNavigate={navigate} />
      <main id="main-content" className="pt-16" aria-label="Contenido principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
