// Mock data for Digital Services prototype - Multi-user support

// ============================================================================
// USERS (Same as prototype-cliente for consistency)
// ============================================================================

export const users = [
  {
    id: 'user-001',
    username: 'johnsmith',
    name: 'John Smith',
    email: 'admin@acme.com',
    plan: 'enterprise',
    status: 'active',
  },
  {
    id: 'user-002',
    username: 'sarahjohnson',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acme.com',
    plan: 'professional',
    status: 'active',
  },
  {
    id: 'user-003',
    username: 'mikechen',
    name: 'Mike Chen',
    email: 'mike.chen@acme.com',
    plan: 'starter',
    status: 'active',
  },
  {
    id: 'user-004',
    username: 'emmadavis',
    name: 'Emma Davis',
    email: 'emma.davis@acme.com',
    plan: 'free',
    status: 'active',
  },
  {
    id: 'user-005',
    username: 'davidwilson',
    name: 'David Wilson',
    email: 'david.wilson@acme.com',
    plan: 'free',
    status: 'pending',
  },
];

// ============================================================================
// USER DIGITAL CARDS
// ============================================================================

export const userDigitalCards = {
  'user-001': {
    id: 'card-001',
    userId: 'user-001',
    isPublished: true,
    theme: {
      primaryColor: '#3B82F6',
      leftPanelBg: '#1F2937',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#F3F4F6',
    },
    profile: {
      displayName: 'John Smith',
      title: 'Enterprise Solutions Architect',
      avatar: null,
      initials: 'JS',
      location: 'San Francisco, CA',
      about: 'Senior architect specializing in cloud infrastructure and enterprise-scale systems. 15+ years building scalable solutions.',
      specialties: ['Cloud Architecture', 'DevOps', 'System Design', 'Team Leadership'],
    },
    contact: {
      whatsapp: '+14155551234',
      phone: '+14155551234',
      email: 'admin@acme.com',
      website: 'https://johnsmith.dev',
    },
    social: {
      linkedin: 'https://linkedin.com/in/johnsmith',
      twitter: 'https://twitter.com/johnsmith',
      instagram: null,
      github: 'https://github.com/johnsmith',
      facebook: null,
      youtube: null,
    },
    qr: {
      data: 'https://johnsmith.dev/card',
      action: 'website',
    },
    stats: {
      views: 1245,
      clicks: 342,
      vCardDownloads: 89,
      qrScans: 156,
    },
  },
  'user-002': {
    id: 'card-002',
    userId: 'user-002',
    isPublished: true,
    theme: {
      primaryColor: '#EC4899',
      leftPanelBg: '#831843',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#FCE7F3',
    },
    profile: {
      displayName: 'Sarah Johnson',
      title: 'UX/UI Designer & Brand Strategist',
      avatar: null,
      initials: 'SJ',
      location: 'New York, NY',
      about: 'Creating beautiful, user-centered digital experiences. Passionate about accessibility and inclusive design.',
      specialties: ['UX Design', 'UI Design', 'Branding', 'Accessibility'],
    },
    contact: {
      whatsapp: '+12125551234',
      phone: '+12125551234',
      email: 'sarah.johnson@acme.com',
      website: 'https://sarahdesigns.co',
    },
    social: {
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      twitter: 'https://twitter.com/sarahdesigns',
      instagram: 'https://instagram.com/sarahdesigns',
      github: null,
      facebook: null,
      youtube: null,
    },
    qr: {
      data: 'https://sarahdesigns.co/card',
      action: 'website',
    },
    stats: {
      views: 892,
      clicks: 245,
      vCardDownloads: 67,
      qrScans: 123,
    },
  },
  'user-003': {
    id: 'card-003',
    userId: 'user-003',
    isPublished: true,
    theme: {
      primaryColor: '#10B981',
      leftPanelBg: '#064E3B',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#D1FAE5',
    },
    profile: {
      displayName: 'Mike Chen',
      title: 'Full Stack Developer',
      avatar: null,
      initials: 'MC',
      location: 'Austin, TX',
      about: 'Building modern web applications with React and Node.js. Open source enthusiast.',
      specialties: ['React', 'Node.js', 'TypeScript', 'API Development'],
    },
    contact: {
      whatsapp: '+15125551234',
      phone: '+15125551234',
      email: 'mike.chen@acme.com',
      website: 'https://mikechen.dev',
    },
    social: {
      linkedin: 'https://linkedin.com/in/mikechen',
      twitter: 'https://twitter.com/mikechen',
      instagram: null,
      github: 'https://github.com/mikechen',
      facebook: null,
      youtube: null,
    },
    qr: {
      data: 'https://wa.me/15125551234',
      action: 'whatsapp',
    },
    stats: {
      views: 456,
      clicks: 128,
      vCardDownloads: 34,
      qrScans: 78,
    },
  },
  'user-004': {
    id: 'card-004',
    userId: 'user-004',
    isPublished: true,
    theme: {
      primaryColor: '#8B5CF6',
      leftPanelBg: '#5B21B6',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#EDE9FE',
    },
    profile: {
      displayName: 'Emma Davis',
      title: 'Content Writer & Blogger',
      avatar: null,
      initials: 'ED',
      location: 'Portland, OR',
      about: 'Freelance content writer specializing in tech and lifestyle topics. Coffee enthusiast.',
      specialties: ['Content Writing', 'Blogging', 'SEO', 'Editing'],
    },
    contact: {
      whatsapp: '+15035551234',
      phone: '+15035551234',
      email: 'emma.davis@acme.com',
      website: 'https://emmawritess.com',
    },
    social: {
      linkedin: 'https://linkedin.com/in/emmadavis',
      twitter: 'https://twitter.com/emmawritess',
      instagram: 'https://instagram.com/emmawritess',
      github: null,
      facebook: null,
      youtube: null,
    },
    qr: {
      data: 'https://wa.me/15035551234',
      action: 'whatsapp',
    },
    stats: {
      views: 234,
      clicks: 67,
      vCardDownloads: 18,
      qrScans: 45,
    },
  },
  'user-005': {
    id: 'card-005',
    userId: 'user-005',
    isPublished: false,
    theme: {
      primaryColor: '#3B82F6',
      leftPanelBg: '#1F2937',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#F3F4F6',
    },
    profile: {
      displayName: 'David Wilson',
      title: '',
      avatar: null,
      initials: 'DW',
      location: '',
      about: '',
      specialties: [],
    },
    contact: {
      whatsapp: '',
      phone: '',
      email: 'david.wilson@acme.com',
      website: '',
    },
    social: {
      linkedin: null,
      twitter: null,
      instagram: null,
      github: null,
      facebook: null,
      youtube: null,
    },
    qr: {
      data: '',
      action: 'website',
    },
    stats: {
      views: 0,
      clicks: 0,
      vCardDownloads: 0,
      qrScans: 0,
    },
  },
};

// ============================================================================
// USER LANDING PAGES (Professional+ feature)
// ============================================================================

export const userLandingPages = {
  'user-001': {
    id: 'landing-001',
    userId: 'user-001',
    isPublished: true,
    template: 'corporate',
    meta: {
      title: 'John Smith - Enterprise Solutions Architect',
      description: 'Senior architect specializing in cloud infrastructure and enterprise-scale systems',
      keywords: ['cloud', 'architecture', 'enterprise', 'devops'],
      ogImage: null,
      favicon: null,
      customCSS: '',
      googleAnalyticsId: null,
    },
    sections: [
      {
        id: 'hero-001',
        type: 'hero',
        order: 0,
        visible: true,
        content: {
          title: 'Enterprise Solutions Architect',
          subtitle: 'Building scalable cloud infrastructure for Fortune 500 companies',
          ctaText: 'Get in Touch',
          ctaLink: 'mailto:admin@acme.com',
          backgroundImage: null,
          alignment: 'center',
        },
      },
      {
        id: 'about-001',
        type: 'about',
        order: 1,
        visible: true,
        content: {
          title: 'About Me',
          text: 'With over 15 years of experience in software architecture, I help organizations design and implement scalable, secure, and cost-effective cloud solutions. Specialized in AWS, Azure, and Google Cloud platforms.',
          image: null,
          layout: 'image-right',
        },
      },
      {
        id: 'services-001',
        type: 'services',
        order: 2,
        visible: true,
        content: {
          title: 'Services',
          items: [
            { icon: 'Cloud', title: 'Cloud Architecture', description: 'Design and implement scalable cloud solutions' },
            { icon: 'Code', title: 'System Design', description: 'Enterprise-grade system architecture' },
            { icon: 'Users', title: 'Team Leadership', description: 'Technical leadership and mentoring' },
          ],
        },
      },
      {
        id: 'contact-001',
        type: 'contact',
        order: 3,
        visible: true,
        content: {
          title: 'Contact',
          showForm: true,
          email: 'admin@acme.com',
          phone: '+14155551234',
          address: 'San Francisco, CA',
        },
      },
    ],
    customDomain: null,
  },
  'user-002': {
    id: 'landing-002',
    userId: 'user-002',
    isPublished: true,
    template: 'creative',
    meta: {
      title: 'Sarah Johnson - UX/UI Designer',
      description: 'Creating beautiful, user-centered digital experiences',
      keywords: ['ux', 'ui', 'design', 'branding', 'accessibility'],
      ogImage: null,
      favicon: null,
      customCSS: '',
      googleAnalyticsId: null,
    },
    sections: [
      {
        id: 'hero-002',
        type: 'hero',
        order: 0,
        visible: true,
        content: {
          title: 'Design That Connects',
          subtitle: 'Crafting intuitive experiences that users love',
          ctaText: 'View My Work',
          ctaLink: '#portfolio',
          backgroundImage: null,
          alignment: 'left',
        },
      },
      {
        id: 'about-002',
        type: 'about',
        order: 1,
        visible: true,
        content: {
          title: 'Hi, I\'m Sarah',
          text: 'I\'m a UX/UI designer passionate about creating inclusive digital experiences. With a background in psychology and visual design, I bring both empathy and aesthetics to every project.',
          image: null,
          layout: 'image-left',
        },
      },
      {
        id: 'services-002',
        type: 'services',
        order: 2,
        visible: true,
        content: {
          title: 'What I Do',
          items: [
            { icon: 'Palette', title: 'UX Research', description: 'User interviews, personas, journey mapping' },
            { icon: 'Layout', title: 'UI Design', description: 'Beautiful, accessible interfaces' },
            { icon: 'Sparkles', title: 'Brand Strategy', description: 'Visual identity and brand guidelines' },
          ],
        },
      },
      {
        id: 'contact-002',
        type: 'contact',
        order: 3,
        visible: true,
        content: {
          title: 'Let\'s Work Together',
          showForm: true,
          email: 'sarah.johnson@acme.com',
          phone: '+12125551234',
          address: 'New York, NY',
        },
      },
    ],
    customDomain: null,
  },
  // user-003 (Starter plan): No landing page (Starter plan has landing pages limited)
  // user-004 (Free plan): No landing page (Free plan can't have landing pages)
  // user-005 (Free plan, pending): No landing page
};

// ============================================================================
// USER PORTFOLIOS (Professional+ feature)
// ============================================================================

export const userPortfolios = {
  'user-001': [
    {
      id: 'proj-001',
      userId: 'user-001',
      title: 'Global E-commerce Platform Migration',
      slug: 'ecommerce-platform-migration',
      description: 'Led migration of legacy e-commerce platform to AWS, handling 10M+ daily transactions.',
      coverImage: null,
      gallery: [],
      tags: ['AWS', 'Microservices', 'E-commerce', 'Migration'],
      isFeatured: true,
      isPublished: true,
      publishedAt: '2026-01-15T10:00:00Z',
      views: 456,
    },
    {
      id: 'proj-002',
      userId: 'user-001',
      title: 'Healthcare Data Platform',
      slug: 'healthcare-data-platform',
      description: 'Designed HIPAA-compliant data analytics platform for healthcare provider network.',
      coverImage: null,
      gallery: [],
      tags: ['Healthcare', 'Data', 'Compliance', 'Azure'],
      isFeatured: true,
      isPublished: true,
      publishedAt: '2026-01-20T14:30:00Z',
      views: 389,
    },
    {
      id: 'proj-003',
      userId: 'user-001',
      title: 'Real-time Analytics System',
      slug: 'realtime-analytics',
      description: 'Built real-time analytics system processing 1B+ events per day with sub-second latency.',
      coverImage: null,
      gallery: [],
      tags: ['Analytics', 'Real-time', 'Big Data', 'Kafka'],
      isFeatured: false,
      isPublished: true,
      publishedAt: '2026-02-01T09:15:00Z',
      views: 267,
    },
  ],
  'user-002': [
    {
      id: 'proj-004',
      userId: 'user-002',
      title: 'Banking App Redesign',
      slug: 'banking-app-redesign',
      description: 'Complete UX overhaul of mobile banking app, improving user satisfaction by 40%.',
      coverImage: null,
      gallery: [],
      tags: ['Mobile', 'Banking', 'UX', 'Accessibility'],
      isFeatured: true,
      isPublished: true,
      publishedAt: '2026-01-10T11:00:00Z',
      views: 612,
    },
    {
      id: 'proj-005',
      userId: 'user-002',
      title: 'E-learning Platform UI',
      slug: 'elearning-platform',
      description: 'Designed intuitive interface for online learning platform with 50K+ students.',
      coverImage: null,
      gallery: [],
      tags: ['Education', 'UI Design', 'Web', 'Figma'],
      isFeatured: true,
      isPublished: true,
      publishedAt: '2026-01-25T15:30:00Z',
      views: 523,
    },
  ],
  // user-003 (Starter plan): No portfolio (Starter plan limited to landing page only)
  // user-004 (Free plan): No portfolio
  // user-005 (Free plan, pending): No portfolio
};

// ============================================================================
// USER CVs (All plans have CV, but Free plan limited to Classic template)
// ============================================================================

export const userCVs = {
  'user-001': {
    id: 'cv-001',
    userId: 'user-001',
    template: 'modern',
    versions: [
      {
        id: 'version-001',
        name: 'Principal',
        isDefault: true,
        createdAt: '2026-01-10T10:00:00Z',
      },
    ],
    personalInfo: {
      fullName: 'John Smith',
      title: 'Enterprise Solutions Architect',
      email: 'admin@acme.com',
      phone: '+14155551234',
      location: 'San Francisco, CA',
      website: 'https://johnsmith.dev',
      linkedin: 'https://linkedin.com/in/johnsmith',
      photo: null,
    },
    summary: 'Enterprise Solutions Architect with 15+ years of experience designing and implementing scalable cloud infrastructure for Fortune 500 companies. Expert in AWS, Azure, and Google Cloud platforms.',
    experience: [
      {
        id: 'exp-001',
        company: 'Acme Corp',
        position: 'Chief Architect',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: null,
        current: true,
        description: 'Leading architecture team of 12 engineers. Designed multi-cloud strategy reducing infrastructure costs by 35%.',
        achievements: [
          'Migrated 200+ microservices to Kubernetes, improving deployment speed by 60%',
          'Implemented zero-downtime deployment strategy for mission-critical systems',
        ],
      },
      {
        id: 'exp-002',
        company: 'Tech Innovations Inc',
        position: 'Senior Solutions Architect',
        location: 'San Francisco, CA',
        startDate: '2015-03',
        endDate: '2019-12',
        current: false,
        description: 'Designed cloud architecture for SaaS platform serving 5M+ users.',
        achievements: [
          'Led AWS migration saving $2M annually in infrastructure costs',
        ],
      },
    ],
    education: [
      {
        id: 'edu-001',
        institution: 'Stanford University',
        degree: 'M.S. Computer Science',
        location: 'Stanford, CA',
        startDate: '2008-09',
        endDate: '2010-06',
        description: 'Specialized in distributed systems and cloud computing.',
      },
    ],
    skills: [
      { id: 'skill-001', name: 'Cloud Architecture', level: 'expert' },
      { id: 'skill-002', name: 'AWS', level: 'expert' },
      { id: 'skill-003', name: 'Azure', level: 'advanced' },
      { id: 'skill-004', name: 'Kubernetes', level: 'expert' },
      { id: 'skill-005', name: 'System Design', level: 'expert' },
    ],
    languages: [
      { id: 'lang-001', name: 'English', level: 'native' },
      { id: 'lang-002', name: 'Spanish', level: 'intermediate' },
    ],
    certifications: [
      {
        id: 'cert-001',
        name: 'AWS Certified Solutions Architect - Professional',
        issuer: 'Amazon Web Services',
        date: '2023-06',
        credentialId: 'AWS-PSA-12345',
      },
    ],
  },
  'user-002': {
    id: 'cv-002',
    userId: 'user-002',
    template: 'minimal',
    versions: [
      {
        id: 'version-002',
        name: 'Principal',
        isDefault: true,
        createdAt: '2026-01-12T14:00:00Z',
      },
    ],
    personalInfo: {
      fullName: 'Sarah Johnson',
      title: 'UX/UI Designer & Brand Strategist',
      email: 'sarah.johnson@acme.com',
      phone: '+12125551234',
      location: 'New York, NY',
      website: 'https://sarahdesigns.co',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      photo: null,
    },
    summary: 'Award-winning UX/UI designer with 8+ years creating beautiful, accessible digital experiences. Passionate about inclusive design and user research.',
    experience: [
      {
        id: 'exp-003',
        company: 'Design Studio NYC',
        position: 'Senior UX Designer',
        location: 'New York, NY',
        startDate: '2019-06',
        endDate: null,
        current: true,
        description: 'Leading design for fintech and healthcare clients. Conducting user research and creating high-fidelity prototypes.',
        achievements: [
          'Redesigned banking app increasing user satisfaction by 40%',
          'Implemented design system used across 15+ products',
        ],
      },
    ],
    education: [
      {
        id: 'edu-002',
        institution: 'Parsons School of Design',
        degree: 'BFA Design and Technology',
        location: 'New York, NY',
        startDate: '2012-09',
        endDate: '2016-05',
        description: 'Focus on interaction design and user experience.',
      },
    ],
    skills: [
      { id: 'skill-006', name: 'UX Research', level: 'expert' },
      { id: 'skill-007', name: 'UI Design', level: 'expert' },
      { id: 'skill-008', name: 'Figma', level: 'expert' },
      { id: 'skill-009', name: 'Accessibility', level: 'advanced' },
    ],
    languages: [
      { id: 'lang-003', name: 'English', level: 'native' },
    ],
    certifications: [],
  },
  'user-003': {
    id: 'cv-003',
    userId: 'user-003',
    template: 'modern',
    versions: [
      {
        id: 'version-003',
        name: 'Principal',
        isDefault: true,
        createdAt: '2026-01-18T09:00:00Z',
      },
    ],
    personalInfo: {
      fullName: 'Mike Chen',
      title: 'Full Stack Developer',
      email: 'mike.chen@acme.com',
      phone: '+15125551234',
      location: 'Austin, TX',
      website: 'https://mikechen.dev',
      linkedin: 'https://linkedin.com/in/mikechen',
      photo: null,
    },
    summary: 'Full stack developer specializing in React and Node.js. Passionate about building performant web applications and contributing to open source.',
    experience: [
      {
        id: 'exp-004',
        company: 'Startup Inc',
        position: 'Full Stack Developer',
        location: 'Austin, TX',
        startDate: '2021-03',
        endDate: null,
        current: true,
        description: 'Building SaaS platform with React, Node.js, and PostgreSQL.',
        achievements: [
          'Reduced page load time by 50% through optimization',
        ],
      },
    ],
    education: [
      {
        id: 'edu-003',
        institution: 'University of Texas',
        degree: 'B.S. Computer Science',
        location: 'Austin, TX',
        startDate: '2017-08',
        endDate: '2021-05',
        description: '',
      },
    ],
    skills: [
      { id: 'skill-010', name: 'React', level: 'expert' },
      { id: 'skill-011', name: 'Node.js', level: 'advanced' },
      { id: 'skill-012', name: 'TypeScript', level: 'advanced' },
    ],
    languages: [
      { id: 'lang-004', name: 'English', level: 'native' },
      { id: 'lang-005', name: 'Mandarin', level: 'native' },
    ],
    certifications: [],
  },
  'user-004': {
    id: 'cv-004',
    userId: 'user-004',
    template: 'classic', // Free plan limited to classic template
    versions: [
      {
        id: 'version-004',
        name: 'Principal',
        isDefault: true,
        createdAt: '2026-02-01T11:00:00Z',
      },
    ],
    personalInfo: {
      fullName: 'Emma Davis',
      title: 'Content Writer & Blogger',
      email: 'emma.davis@acme.com',
      phone: '+15035551234',
      location: 'Portland, OR',
      website: 'https://emmawritess.com',
      linkedin: 'https://linkedin.com/in/emmadavis',
      photo: null,
    },
    summary: 'Freelance content writer with 5+ years of experience creating engaging content for tech and lifestyle brands.',
    experience: [
      {
        id: 'exp-005',
        company: 'Freelance',
        position: 'Content Writer',
        location: 'Portland, OR',
        startDate: '2019-01',
        endDate: null,
        current: true,
        description: 'Writing blog posts, articles, and marketing copy for various clients.',
        achievements: [],
      },
    ],
    education: [
      {
        id: 'edu-004',
        institution: 'Portland State University',
        degree: 'B.A. English Literature',
        location: 'Portland, OR',
        startDate: '2014-09',
        endDate: '2018-06',
        description: '',
      },
    ],
    skills: [
      { id: 'skill-013', name: 'Content Writing', level: 'expert' },
      { id: 'skill-014', name: 'SEO', level: 'advanced' },
      { id: 'skill-015', name: 'Editing', level: 'advanced' },
    ],
    languages: [
      { id: 'lang-006', name: 'English', level: 'native' },
    ],
    certifications: [],
  },
  'user-005': {
    id: 'cv-005',
    userId: 'user-005',
    template: 'classic',
    versions: [
      {
        id: 'version-005',
        name: 'Principal',
        isDefault: true,
        createdAt: '2026-02-10T08:00:00Z',
      },
    ],
    personalInfo: {
      fullName: 'David Wilson',
      title: '',
      email: 'david.wilson@acme.com',
      phone: '',
      location: '',
      website: '',
      linkedin: null,
      photo: null,
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  },
};

// ============================================================================
// ANALYTICS DATA (Starter+ feature)
// ============================================================================

export const serviceAnalytics = {
  // user-001 analytics
  'user-001-digitalCard': {
    last7Days: [
      { date: '2026-02-05', views: 165, clicks: 45, qrScans: 20 },
      { date: '2026-02-06', views: 182, clicks: 52, qrScans: 25 },
      { date: '2026-02-07', views: 158, clicks: 41, qrScans: 18 },
      { date: '2026-02-08', views: 201, clicks: 58, qrScans: 28 },
      { date: '2026-02-09', views: 178, clicks: 48, qrScans: 22 },
      { date: '2026-02-10', views: 195, clicks: 54, qrScans: 24 },
      { date: '2026-02-11', views: 166, clicks: 44, qrScans: 19 },
    ],
    topReferrers: [
      { source: 'LinkedIn', visits: 342 },
      { source: 'Twitter', visits: 245 },
      { source: 'Direct', visits: 189 },
      { source: 'Email', visits: 156 },
    ],
  },
  'user-001-landing': {
    last7Days: [
      { date: '2026-02-05', visits: 234, uniqueVisitors: 198, bounceRate: 28 },
      { date: '2026-02-06', visits: 267, uniqueVisitors: 225, bounceRate: 25 },
      { date: '2026-02-07', visits: 198, uniqueVisitors: 167, bounceRate: 32 },
      { date: '2026-02-08', visits: 289, uniqueVisitors: 245, bounceRate: 22 },
      { date: '2026-02-09', visits: 256, uniqueVisitors: 218, bounceRate: 26 },
      { date: '2026-02-10', visits: 278, uniqueVisitors: 236, bounceRate: 24 },
      { date: '2026-02-11', views: 245, uniqueVisitors: 209, bounceRate: 27 },
    ],
  },
  // user-002 analytics
  'user-002-digitalCard': {
    last7Days: [
      { date: '2026-02-05', views: 118, clicks: 32, qrScans: 15 },
      { date: '2026-02-06', views: 135, clicks: 39, qrScans: 19 },
      { date: '2026-02-07', views: 102, clicks: 28, qrScans: 12 },
      { date: '2026-02-08', views: 148, clicks: 42, qrScans: 21 },
      { date: '2026-02-09', views: 128, clicks: 35, qrScans: 17 },
      { date: '2026-02-10', views: 142, clicks: 40, qrScans: 20 },
      { date: '2026-02-11', views: 119, clicks: 33, qrScans: 16 },
    ],
    topReferrers: [
      { source: 'Instagram', visits: 245 },
      { source: 'LinkedIn', visits: 189 },
      { source: 'Direct', visits: 134 },
      { source: 'Behance', visits: 98 },
    ],
  },
  'user-002-landing': {
    last7Days: [
      { date: '2026-02-05', visits: 167, uniqueVisitors: 142, bounceRate: 31 },
      { date: '2026-02-06', visits: 189, uniqueVisitors: 159, bounceRate: 28 },
      { date: '2026-02-07', visits: 145, uniqueVisitors: 123, bounceRate: 35 },
      { date: '2026-02-08', visits: 203, uniqueVisitors: 172, bounceRate: 25 },
      { date: '2026-02-09', visits: 178, uniqueVisitors: 151, bounceRate: 29 },
      { date: '2026-02-10', visits: 192, uniqueVisitors: 163, bounceRate: 27 },
      { date: '2026-02-11', visits: 171, uniqueVisitors: 145, bounceRate: 30 },
    ],
  },
  // user-003 analytics (Starter plan has analytics)
  'user-003-digitalCard': {
    last7Days: [
      { date: '2026-02-05', views: 58, clicks: 16, qrScans: 8 },
      { date: '2026-02-06', views: 67, clicks: 19, qrScans: 10 },
      { date: '2026-02-07', views: 52, clicks: 14, qrScans: 7 },
      { date: '2026-02-08', views: 74, clicks: 21, qrScans: 12 },
      { date: '2026-02-09', views: 63, clicks: 18, qrScans: 9 },
      { date: '2026-02-10', views: 69, clicks: 20, qrScans: 11 },
      { date: '2026-02-11', views: 61, clicks: 17, qrScans: 9 },
    ],
    topReferrers: [
      { source: 'GitHub', visits: 128 },
      { source: 'Twitter', visits: 89 },
      { source: 'Direct', visits: 67 },
      { source: 'LinkedIn', visits: 45 },
    ],
  },
  // user-004 (Free plan): No analytics
  // user-005 (Free plan, pending): No analytics
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getUserById = (userId) => {
  return users.find(u => u.id === userId) || null;
};

export const getDigitalCardByUser = (userId) => {
  return userDigitalCards[userId] || null;
};

export const getLandingPageByUser = (userId) => {
  return userLandingPages[userId] || null;
};

export const getPortfolioByUser = (userId) => {
  return userPortfolios[userId] || [];
};

export const getCVByUser = (userId) => {
  return userCVs[userId] || null;
};

export const getAnalyticsByService = (userId, serviceName) => {
  const key = `${userId}-${serviceName}`;
  return serviceAnalytics[key] || null;
};

export const getPortfolioItemBySlug = (userId, slug) => {
  const portfolio = userPortfolios[userId] || [];
  return portfolio.find(item => item.slug === slug);
};

export const getFeaturedProjects = (userId) => {
  const portfolio = userPortfolios[userId] || [];
  return portfolio.filter(item => item.isFeatured && item.isPublished);
};

export const getProjectsByTag = (userId, tag) => {
  const portfolio = userPortfolios[userId] || [];
  return portfolio.filter(item =>
    item.isPublished && item.tags.includes(tag)
  );
};

export const getAllTags = (userId) => {
  const portfolio = userPortfolios[userId] || [];
  const tags = new Set();
  portfolio.forEach(item => {
    if (item.isPublished) {
      item.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags);
};

// Create default data for new users
export const createDefaultCard = (userId) => {
  const user = getUserById(userId);
  if (!user) return null;

  return {
    id: `card-${userId}`,
    userId: userId,
    isPublished: false,
    theme: {
      primaryColor: '#3B82F6',
      leftPanelBg: '#1F2937',
      centerPanelBg: '#FFFFFF',
      rightPanelBg: '#F3F4F6',
    },
    profile: {
      displayName: user.name,
      title: '',
      avatar: null,
      initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      location: '',
      about: '',
      specialties: [],
    },
    contact: {
      whatsapp: '',
      phone: '',
      email: user.email,
      website: '',
    },
    social: {
      linkedin: null,
      twitter: null,
      instagram: null,
      github: null,
      facebook: null,
      youtube: null,
    },
    qr: {
      data: '',
      action: 'website',
    },
    stats: {
      views: 0,
      clicks: 0,
      vCardDownloads: 0,
      qrScans: 0,
    },
  };
};

export const createDefaultCV = (userId) => {
  const user = getUserById(userId);
  if (!user) return null;

  return {
    id: `cv-${userId}`,
    userId: userId,
    template: 'classic',
    versions: [
      {
        id: `version-${userId}-001`,
        name: 'Principal',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ],
    personalInfo: {
      fullName: user.name,
      title: '',
      email: user.email,
      phone: '',
      location: '',
      website: '',
      linkedin: null,
      photo: null,
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };
};

// ============================================================================
// PUBLIC CARD ACCESS HELPERS
// ============================================================================

export const getUserByUsername = (username) => {
  if (!username) return null;
  return users.find(u => u.username === username.toLowerCase()) || null;
};

export const getDigitalCardByUsername = (username) => {
  const user = getUserByUsername(username);
  if (!user) return null;
  return userDigitalCards[user.id] || null;
};
