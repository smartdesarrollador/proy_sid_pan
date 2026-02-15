import { User } from 'lucide-react';

export const AboutSection = ({ content }) => {
  const { title, text, image, layout = 'image-right' } = content;

  const isImageLeft = layout === 'image-left';

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${isImageLeft ? 'md:flex-row-reverse' : ''}`}>
          {/* Text Content */}
          <div className={isImageLeft ? 'md:order-2' : ''}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {text}
            </p>
          </div>

          {/* Image Placeholder */}
          <div className={isImageLeft ? 'md:order-1' : ''}>
            {image ? (
              <img
                src={image}
                alt={title}
                className="w-full h-80 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
