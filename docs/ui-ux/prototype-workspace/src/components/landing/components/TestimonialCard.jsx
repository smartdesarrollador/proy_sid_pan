import { Star, Quote } from 'lucide-react';

function TestimonialCard({ testimonial }) {
  const { quote, author, role, company, avatar, rating } = testimonial;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 border-l-4 border-l-primary-500 hover:shadow-lg transition-shadow">
      {/* Quote Icon */}
      <Quote className="w-8 h-8 text-gray-200 mb-4" />

      {/* Quote Text */}
      <p className="text-gray-700 text-lg italic mb-4">{quote}</p>

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{author}</p>
          <p className="text-sm text-gray-600">
            {role} @ {company}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestimonialCard;
