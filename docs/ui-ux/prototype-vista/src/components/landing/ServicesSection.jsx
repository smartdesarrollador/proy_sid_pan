import * as Icons from 'lucide-react';

export const ServicesSection = ({ content }) => {
  const { title, items = [] } = content;

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-12 text-center">
          {title}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => {
            // Get icon component dynamically from lucide-react
            const IconComponent = Icons[item.icon] || Icons.Box;

            return (
              <div
                key={index}
                className="card card-hover card-body text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No hay servicios agregados aún
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
