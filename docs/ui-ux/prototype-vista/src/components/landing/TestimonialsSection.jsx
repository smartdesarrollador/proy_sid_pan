const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      >
        ★
      </span>
    ))}
  </div>
);

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TestimonialsSection = ({ content }) => {
  const { title = 'Lo que dicen mis clientes', items = [] } = content;

  return (
    <section className="bg-gray-50 dark:bg-gray-800 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            {title}
          </h2>
        )}

        {items.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay testimonios disponibles
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm flex flex-col"
              >
                {/* Comillas decorativas */}
                <div className="text-5xl text-blue-200 dark:text-blue-900 font-serif leading-none mb-3 select-none">
                  ❝
                </div>

                {/* Texto del testimonio */}
                <p className="text-gray-700 dark:text-gray-300 flex-1 mb-6 italic leading-relaxed">
                  {item.quote || 'Sin testimonio'}
                </p>

                {/* Rating */}
                <StarRating rating={item.rating || 5} />

                {/* Autor */}
                <div className="flex items-center gap-3 mt-4">
                  {/* Avatar con iniciales */}
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {getInitials(item.name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {item.name || 'Anónimo'}
                    </p>
                    {item.role && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
