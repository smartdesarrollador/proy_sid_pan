import { Clock, Copy } from 'lucide-react';
import { useState } from 'react';

function PromotionCard({ promotion }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Badge de descuento flotante */}
      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full transform rotate-12 shadow-lg">
        <span className="text-lg font-bold">{promotion.discount}</span>
      </div>

      {/* Contenido */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {promotion.title}
        </h3>
        <p className="text-gray-600 text-sm">
          {promotion.description}
        </p>
      </div>

      {/* Código promocional */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Código promocional</p>
            <p className="text-lg font-mono font-bold text-primary-600">
              {promotion.code}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Validez */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          Válido hasta {promotion.validUntil}
        </div>
        {promotion.limited && (
          <span className="badge bg-red-100 text-red-700">
            Cupos limitados
          </span>
        )}
      </div>

      {/* CTA */}
      <button className="btn-primary w-full">
        {promotion.cta}
      </button>
    </div>
  );
}

export default PromotionCard;
