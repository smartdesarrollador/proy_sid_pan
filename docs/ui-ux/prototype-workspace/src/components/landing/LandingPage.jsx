import { useTranslation } from 'react-i18next';
import LandingHeader from './LandingHeader';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import PromotionsSection from './sections/PromotionsSection';
import PricingSection from './sections/PricingSection';
import HowItWorksSection from './sections/HowItWorksSection';
import PaymentMethodsSection from './sections/PaymentMethodsSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';
import { specialPromotions } from '../../data/mockData';

function LandingPage({ onGetStarted }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'es';

  // Transformar promociones al idioma actual
  const activePromotions = specialPromotions.map(promo => ({
    ...promo,
    title: promo.title[currentLang],
    description: promo.description[currentLang],
    validUntil: promo.validUntil[currentLang],
    cta: promo.cta[currentLang]
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Enable smooth scrolling */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Language Switcher Header */}
      <LandingHeader />

      {/* All Sections */}
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <PromotionsSection promotions={activePromotions} />
      <PricingSection onGetStarted={onGetStarted} />
      <HowItWorksSection />
      <PaymentMethodsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}

export default LandingPage;
