import * as Icons from 'lucide-react';

function StepCard({ step, isLast }) {
  const IconComponent = Icons[step.icon];

  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Step Number Badge */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg">
        {step.number}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 mb-4">
        {IconComponent && <IconComponent className="w-6 h-6" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>

      {/* Description */}
      <p className="text-gray-600 text-sm">{step.description}</p>

      {/* Connecting Line (hidden on mobile, shown on desktop if not last) */}
      {!isLast && (
        <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 border-t-2 border-dashed border-gray-300 -z-10" />
      )}
    </div>
  );
}

export default StepCard;
