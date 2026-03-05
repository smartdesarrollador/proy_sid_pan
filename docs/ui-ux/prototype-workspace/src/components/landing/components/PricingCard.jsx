import { Check, X } from 'lucide-react';

function PricingCard({ plan, isAnnual, onGetStarted, isPopular }) {
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
  const isEnterprise = plan.id === 'plan-enterprise';
  const isFree = plan.id === 'plan-free';

  return (
    <div
      className={`
        bg-white rounded-xl border p-8 transition-all relative
        ${isPopular
          ? 'pricing-card-popular'
          : 'border-gray-200 hover:shadow-lg'
        }
      `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="popular-badge">
          Más Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
        <p className="text-gray-600 text-sm">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {isEnterprise ? (
          <div className="text-3xl font-bold text-gray-900">Contactar</div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-900">${price}</span>
              {!isFree && (
                <span className="text-gray-600">/{isAnnual ? 'año' : 'mes'}</span>
              )}
            </div>
            {isAnnual && !isFree && (
              <p className="text-sm text-gray-500 mt-1">
                ${(plan.priceAnnual / 12).toFixed(0)}/mes facturado anualmente
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <span
              className={`text-sm ${
                feature.included ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onGetStarted}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-colors
          ${isPopular || isFree
            ? 'btn-primary'
            : isEnterprise
            ? 'btn-ghost'
            : 'btn-secondary'
          }
        `}
      >
        {isEnterprise ? 'Contactar Ventas' : isFree ? 'Probar Gratis' : 'Comenzar Ahora'}
      </button>
    </div>
  );
}

export default PricingCard;
