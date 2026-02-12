import LandingHeader from './LandingHeader';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import PricingSection from './sections/PricingSection';
import HowItWorksSection from './sections/HowItWorksSection';
import PaymentMethodsSection from './sections/PaymentMethodsSection';
import TestimonialsSection from './sections/TestimonialsSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import Footer from './sections/Footer';

function LandingPage({ onGetStarted }) {
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
