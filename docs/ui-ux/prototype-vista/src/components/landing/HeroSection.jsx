const getBgClass = (template) => {
  switch (template) {
    case 'creative': return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'dark':     return 'bg-gray-900 border-b border-gray-700';
    case 'minimal':  return 'bg-white border-b-2 border-gray-900';
    default:         return 'bg-blue-600';
  }
};

const getTextClass = (template) => {
  return template === 'minimal' ? 'text-gray-900' : 'text-white';
};

const getSubtextClass = (template) => {
  return template === 'minimal' ? 'text-gray-600' : 'text-white/90';
};

const getCtaClass = (template) => {
  switch (template) {
    case 'minimal':
      return 'bg-gray-900 text-white hover:bg-gray-700';
    case 'dark':
      return 'bg-white text-gray-900 hover:bg-gray-100';
    default:
      return 'bg-white text-blue-600 hover:bg-gray-100';
  }
};

const getScrollArrowClass = (template) => {
  return template === 'minimal' ? 'text-gray-400' : 'text-white/50';
};

export const HeroSection = ({ content, template }) => {
  const { title, subtitle, ctaText, ctaLink, alignment = 'center' } = content;

  const bgClass = getBgClass(template);
  const textClass = getTextClass(template);
  const subtextClass = getSubtextClass(template);
  const ctaClass = getCtaClass(template);
  const scrollArrowClass = getScrollArrowClass(template);

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment] || 'text-center';

  return (
    <section className={`${bgClass} py-20 px-6 relative`}>
      <div className={`max-w-4xl mx-auto ${alignmentClass}`}>
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${textClass}`}>
          {title}
        </h1>
        <p className={`text-xl md:text-2xl mb-8 ${subtextClass}`}>
          {subtitle}
        </p>
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className={`inline-block px-8 py-3 rounded-lg font-semibold transition-colors ${ctaClass}`}
          >
            {ctaText}
          </a>
        )}
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce ${scrollArrowClass}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
};
