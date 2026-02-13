// Feature gates configuration by subscription plan

export const PLAN_NAMES = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
};

export const featuresByPlan = {
  free: {
    // Digital Card
    digitalCard: true,
    digitalCardQR: true,
    digitalCardCustomColors: true,
    digitalCardVCard: false, // Starter+
    digitalCardAnalytics: false, // Starter+

    // Landing Page
    landingPage: false, // Starter+
    landingTemplates: 0,
    landingContactForm: false,
    landingCustomCSS: false,
    landingSEO: false,
    landingGoogleAnalytics: false,

    // Portfolio
    portfolio: false, // Professional+
    maxProjects: 0,
    portfolioGalleryImages: 0,
    portfolioFeaturedProjects: 0,

    // CV
    cv: true,
    cvTemplates: 1, // Classic only
    cvPDFExport: false, // Starter+
    cvMultipleVersions: false, // Professional+

    // General
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
  },

  starter: {
    // Digital Card
    digitalCard: true,
    digitalCardQR: true,
    digitalCardCustomColors: true,
    digitalCardVCard: true,
    digitalCardAnalytics: true, // 7 days
    digitalCardAnalyticsDays: 7,

    // Landing Page
    landingPage: true,
    landingTemplates: 3,
    landingContactForm: true,
    landingCustomCSS: false, // Professional+
    landingSEO: false, // Professional+
    landingGoogleAnalytics: false,

    // Portfolio
    portfolio: false, // Professional+
    maxProjects: 0,
    portfolioGalleryImages: 0,
    portfolioFeaturedProjects: 0,

    // CV
    cv: true,
    cvTemplates: 2, // Classic + Modern
    cvPDFExport: true,
    cvMultipleVersions: false, // Professional+

    // General
    customDomain: false,
    whiteLabel: false,
    prioritySupport: false,
  },

  professional: {
    // Digital Card
    digitalCard: true,
    digitalCardQR: true,
    digitalCardCustomColors: true,
    digitalCardVCard: true,
    digitalCardAnalytics: true,
    digitalCardAnalyticsDays: 30,

    // Landing Page
    landingPage: true,
    landingTemplates: Infinity,
    landingContactForm: true,
    landingCustomCSS: true,
    landingSEO: true,
    landingGoogleAnalytics: true,

    // Portfolio
    portfolio: true,
    maxProjects: Infinity,
    portfolioGalleryImages: 10,
    portfolioFeaturedProjects: 3,

    // CV
    cv: true,
    cvTemplates: 3, // All templates
    cvPDFExport: true,
    cvMultipleVersions: true,
    maxCVVersions: 5,

    // General
    customDomain: true,
    whiteLabel: false, // Enterprise only
    prioritySupport: false,
  },

  enterprise: {
    // Digital Card
    digitalCard: true,
    digitalCardQR: true,
    digitalCardCustomColors: true,
    digitalCardVCard: true,
    digitalCardAnalytics: true,
    digitalCardAnalyticsDays: 365,

    // Landing Page
    landingPage: true,
    landingTemplates: Infinity,
    landingContactForm: true,
    landingCustomCSS: true,
    landingSEO: true,
    landingGoogleAnalytics: true,

    // Portfolio
    portfolio: true,
    maxProjects: Infinity,
    portfolioGalleryImages: Infinity,
    portfolioFeaturedProjects: Infinity,

    // CV
    cv: true,
    cvTemplates: 3,
    cvPDFExport: true,
    cvMultipleVersions: true,
    maxCVVersions: Infinity,

    // General
    customDomain: true,
    whiteLabel: true,
    prioritySupport: true,
  },
};

// Upgrade messages for locked features
export const upgradeMessages = {
  digitalCardVCard: {
    title: 'Exportar Contacto',
    message: 'Permite a tus visitantes guardar tu contacto directamente en su teléfono con formato vCard.',
    requiredPlan: 'starter',
  },
  digitalCardAnalytics: {
    title: 'Estadísticas Avanzadas',
    message: 'Visualiza quién ve tu tarjeta digital, desde dónde y cuántas veces.',
    requiredPlan: 'starter',
  },
  landingPage: {
    title: 'Landing Page Profesional',
    message: 'Crea una página de aterrizaje completa con múltiples secciones y formulario de contacto.',
    requiredPlan: 'starter',
  },
  landingCustomCSS: {
    title: 'CSS Personalizado',
    message: 'Aplica estilos personalizados para que tu landing page sea 100% única.',
    requiredPlan: 'professional',
  },
  landingSEO: {
    title: 'Optimización SEO',
    message: 'Configura meta tags, Open Graph y optimiza tu landing para motores de búsqueda.',
    requiredPlan: 'professional',
  },
  portfolio: {
    title: 'Portafolio Digital',
    message: 'Muestra tus proyectos con galerías de imágenes y categorías personalizadas.',
    requiredPlan: 'professional',
  },
  cvPDFExport: {
    title: 'Exportar PDF',
    message: 'Descarga tu CV en formato PDF profesional listo para compartir.',
    requiredPlan: 'starter',
  },
  cvMultipleVersions: {
    title: 'Múltiples Versiones',
    message: 'Crea diferentes versiones de tu CV para distintos tipos de trabajo.',
    requiredPlan: 'professional',
  },
  customDomain: {
    title: 'Dominio Personalizado',
    message: 'Conecta tu propio dominio para mayor profesionalismo.',
    requiredPlan: 'professional',
  },
  whiteLabel: {
    title: 'Marca Blanca',
    message: 'Elimina todas las referencias a nuestra plataforma.',
    requiredPlan: 'enterprise',
  },
};

// Helper functions
export const normalizePlanName = (planName) => {
  if (!planName || typeof planName !== 'string') return PLAN_NAMES.FREE;
  const normalized = planName.toLowerCase().trim();
  return Object.values(PLAN_NAMES).includes(normalized) ? normalized : PLAN_NAMES.FREE;
};

export const getPlanDisplayName = (planName) => {
  const planMap = {
    [PLAN_NAMES.FREE]: 'Free',
    [PLAN_NAMES.STARTER]: 'Starter',
    [PLAN_NAMES.PROFESSIONAL]: 'Professional',
    [PLAN_NAMES.ENTERPRISE]: 'Enterprise',
  };
  return planMap[normalizePlanName(planName)] || 'Free';
};

export const isPlanHigherThan = (currentPlan, requiredPlan) => {
  const planHierarchy = [
    PLAN_NAMES.FREE,
    PLAN_NAMES.STARTER,
    PLAN_NAMES.PROFESSIONAL,
    PLAN_NAMES.ENTERPRISE,
  ];
  const currentIndex = planHierarchy.indexOf(normalizePlanName(currentPlan));
  const requiredIndex = planHierarchy.indexOf(normalizePlanName(requiredPlan));
  return currentIndex >= requiredIndex;
};

export const getFeatureInfo = (featureName) => {
  return upgradeMessages[featureName] || {
    title: 'Función Premium',
    message: 'Esta función está disponible en planes superiores.',
    requiredPlan: 'professional',
  };
};
