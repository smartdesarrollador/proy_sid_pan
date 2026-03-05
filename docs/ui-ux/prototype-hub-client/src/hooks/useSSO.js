export function useSSO() {
  const navigateToService = (service) => {
    if (service.status !== 'active') return
    // In real implementation: POST /api/v1/auth/sso-token/ then redirect
    // Mock: just open the URL
    const mockToken = btoa(`sso_${service.id}_${Date.now()}`)
    const url = `${service.url}?sso_token=${mockToken}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return { navigateToService }
}
