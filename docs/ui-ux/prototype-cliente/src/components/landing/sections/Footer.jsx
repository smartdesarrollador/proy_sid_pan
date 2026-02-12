import { Calendar, Linkedin, Twitter, Github, Mail, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation('landing');
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: t('footer.product.features'), href: '#features' },
      { name: t('footer.product.pricing'), href: '#pricing' },
      { name: t('footer.product.useCases'), href: '#' },
      { name: t('footer.product.integrations'), href: '#' }
    ],
    company: [
      { name: t('footer.company.about'), href: '#' },
      { name: t('footer.company.blog'), href: '#' },
      { name: t('footer.company.contact'), href: '#' },
      { name: t('footer.company.careers'), href: '#' }
    ],
    legal: [
      { name: t('footer.legal.terms'), href: '#' },
      { name: t('footer.legal.privacy'), href: '#' },
      { name: t('footer.legal.cookies'), href: '#' },
      { name: t('footer.legal.compliance'), href: '#' }
    ]
  };

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: 'mailto:hello@example.com', label: 'Email' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-600 rounded-xl p-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Portal de Cliente</span>
            </div>
            <p className="text-gray-400 mb-4 text-sm">
              {t('footer.brandDescription')}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.product')}</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.sections.legal')}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {currentYear} {t('footer.copyright')}
          </p>

          {/* Language Selector */}
          <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <Globe className="w-4 h-4" />
            <span>{t('footer.language')}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
