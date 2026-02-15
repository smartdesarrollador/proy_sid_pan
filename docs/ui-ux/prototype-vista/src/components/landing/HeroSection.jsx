export const HeroSection = ({ content, template }) => {
  const { title, subtitle, ctaText, ctaLink, alignment = 'center' } = content;

  // Determine background styles based on template
  const backgroundClass = template === 'creative'
    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
    : 'bg-blue-600';

  // Determine text alignment
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment] || 'text-center';

  return (
    <section className={`${backgroundClass} text-white py-20 px-6`}>
      <div className={`max-w-4xl mx-auto ${alignmentClass}`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-white/90">
          {subtitle}
        </p>
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
};
